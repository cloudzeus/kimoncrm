import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import ImageModule from 'docxtemplater-image-module-free';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

interface ProductData {
  id: string;
  name: string;
  brand?: string;
  manufacturer?: string;
  category?: string;
  images?: Array<{
    url: string;
    alt?: string;
    isDefault?: boolean;
  }>;
  translations?: Array<{
    languageCode: string;
    name?: string;
    description?: string;
    shortDescription?: string;
  }>;
  specifications?: Array<{
    specKey: string;
    translations: Array<{
      languageCode: string;
      specName: string;
      specValue: string;
    }>;
  }>;
  width?: number;
  height?: number;
  length?: number;
  weight?: number;
  unit?: {
    name: string;
    shortcut: string;
  };
}

interface ProductAnalysisData {
  productName: string;
  description: string;
  specifications: Array<{
    name: string;
    value: string;
  }>;
  mainImage?: Buffer;
  additionalImages?: Buffer[];
  brandName?: string;
  categoryName?: string;
  dimensions?: string;
  weight?: string;
  unit?: string;
}

/**
 * Download image from URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`Failed to download image from ${url}:`, error);
    return null;
  }
}

/**
 * Prepare product data for Word template
 */
export async function prepareProductAnalysisData(product: ProductData): Promise<ProductAnalysisData> {
  // Get Greek translation (el language code)
  const greekTranslation = product.translations?.find(t => t.languageCode === 'el');
  
  // Get product name (Greek or fallback to default)
  const productName = greekTranslation?.name || product.name;
  
  // Get description (Greek or fallback to default)
  const description = greekTranslation?.description || greekTranslation?.shortDescription || 'Δεν υπάρχει περιγραφή διαθέσιμη.';
  
  // Get Greek specifications
  const specifications: Array<{ name: string; value: string }> = [];
  
  if (product.specifications && product.specifications.length > 0) {
    for (const spec of product.specifications) {
      const greekSpec = spec.translations.find(t => t.languageCode === 'el');
      if (greekSpec) {
        specifications.push({
          name: greekSpec.specName,
          value: greekSpec.specValue,
        });
      }
    }
  }
  
  // Download main image
  let mainImage: Buffer | null = null;
  const defaultImage = product.images?.find(img => img.isDefault);
  const firstImage = product.images?.[0];
  
  if (defaultImage?.url) {
    mainImage = await downloadImage(defaultImage.url);
  } else if (firstImage?.url) {
    mainImage = await downloadImage(firstImage.url);
  }
  
  // Download additional images (max 3)
  const additionalImages: Buffer[] = [];
  const otherImages = product.images?.filter(img => !img.isDefault).slice(0, 3) || [];
  
  for (const img of otherImages) {
    if (img.url) {
      const buffer = await downloadImage(img.url);
      if (buffer) {
        additionalImages.push(buffer);
      }
    }
  }
  
  // Build dimensions string
  let dimensions = '';
  if (product.length || product.width || product.height) {
    const parts = [];
    if (product.length) parts.push(`Μήκος: ${product.length}mm`);
    if (product.width) parts.push(`Πλάτος: ${product.width}mm`);
    if (product.height) parts.push(`Ύψος: ${product.height}mm`);
    dimensions = parts.join(', ');
  }
  
  return {
    productName,
    description,
    specifications,
    mainImage: mainImage || undefined,
    additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
    brandName: product.brand || undefined,
    categoryName: product.category || undefined,
    dimensions: dimensions || undefined,
    weight: product.weight ? `${product.weight}kg` : undefined,
    unit: product.unit?.shortcut || product.unit?.name || undefined,
  };
}

/**
 * Generate Product Analysis Word document using template
 */
export async function generateProductAnalysisDocument(
  product: ProductData,
  templatePath: string
): Promise<Buffer> {
  try {
    // Read the template file
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    
    // Prepare product data
    const analysisData = await prepareProductAnalysisData(product);
    
    // Configure image module
    const imageOpts = {
      centered: false,
      getImage: function (tagValue: any) {
        // tagValue will be the image buffer
        if (!tagValue || !Buffer.isBuffer(tagValue)) {
          return null;
        }
        return tagValue;
      },
      getSize: function (img: any, tagValue: any, tagName: string): [number, number] {
        // Return image size (width, height in pixels)
        // Check if image buffer is valid
        if (!img || !Buffer.isBuffer(img) || img.length === 0) {
          return [0, 0];
        }
        
        // For main image: larger size
        if (tagName === 'mainImage') {
          return [400, 300]; // width, height in pixels
        }
        // For additional images: smaller size
        return [200, 150];
      },
    };
    
    const imageModule = new ImageModule(imageOpts);
    
    // Create docxtemplater instance - temporarily without image module to test
    const doc = new Docxtemplater(zip, {
      modules: [], // Disable image module for now
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Prepare template data
    const templateData = {
      productName: analysisData.productName || 'N/A',
      description: analysisData.description || '',
      hasSpecifications: !!(analysisData.specifications && analysisData.specifications.length > 0),
      specifications: analysisData.specifications || [],
      hasBrand: !!analysisData.brandName,
      brandName: analysisData.brandName || '',
      hasCategory: !!analysisData.categoryName,
      categoryName: analysisData.categoryName || '',
      hasDimensions: !!analysisData.dimensions,
      dimensions: analysisData.dimensions || '',
      hasWeight: !!analysisData.weight,
      weight: analysisData.weight || '',
      hasUnit: !!analysisData.unit,
      unit: analysisData.unit || '',
      hasMainImage: false, // Disable images for now
      mainImage: null,
      hasAdditionalImages: false, // Disable images for now
      additionalImages: [],
      generatedDate: new Date().toLocaleDateString('el-GR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
    
    console.log('Template data prepared:', JSON.stringify({
      ...templateData,
      mainImage: templateData.mainImage ? 'Buffer present' : 'null',
      additionalImages: `Array(${templateData.additionalImages.length})`,
    }, null, 2));
    
    // Render the document
    doc.render(templateData);
    
    // Generate buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });
    
    return buffer;
  } catch (error) {
    console.error('Error generating product analysis document:', error);
    throw new Error(`Failed to generate product analysis document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate Product Analysis Word document and return buffer
 */
export async function generateProductAnalysisBuffer(
  product: ProductData,
  templatePath?: string
): Promise<Buffer> {
  // Use default template path if not provided
  const defaultTemplatePath = path.join(process.cwd(), 'public', 'templates', 'product-analysis-template.docx');
  const finalTemplatePath = templatePath || defaultTemplatePath;
  
  // Check if template exists
  if (!fs.existsSync(finalTemplatePath)) {
    throw new Error(`Template file not found: ${finalTemplatePath}`);
  }
  
  return generateProductAnalysisDocument(product, finalTemplatePath);
}

/**
 * Generate a single Product Analysis document for multiple products
 */
export async function generateMultiProductAnalysisBuffer(
  products: ProductData[],
  templatePath?: string
): Promise<Buffer> {
  // Track temporary files for cleanup (declare outside try block)
  const tempFiles: string[] = [];
  
  try {
    if (!products || products.length === 0) {
      throw new Error('No products provided for analysis');
    }

    // Use default multi-product template path if not provided
    const defaultTemplatePath = path.join(process.cwd(), 'public', 'templates', 'multi-product-analysis-template.docx');
    const finalTemplatePath = templatePath || defaultTemplatePath;
    
    // Check if template exists
    if (!fs.existsSync(finalTemplatePath)) {
      throw new Error(`Template file not found: ${finalTemplatePath}`);
    }

    // Read the template
    const content = fs.readFileSync(finalTemplatePath, 'binary');
    const zip = new PizZip(content);
    
    // Image module configuration
    const imageOpts = {
      centered: true,
      getImage: function (tagValue: any) {
        // tagValue will be a file path string
        if (!tagValue || typeof tagValue !== 'string') {
          return null;
        }
        try {
          if (fs.existsSync(tagValue)) {
            return fs.readFileSync(tagValue);
          }
        } catch (error) {
          console.error(`Failed to read image file ${tagValue}:`, error);
        }
        return null;
      },
      getSize: function (img: any, tagValue: any, tagName: string): [number, number] {
        if (!img || img.length === 0) {
          return [0, 0];
        }
        // Main images: larger
        if (tagName && tagName.includes('main')) {
          return [400, 300];
        }
        // Additional images: smaller
        return [250, 188];
      },
    };
    
    const imageModule = new ImageModule(imageOpts);
    
    // Create docxtemplater instance with image module enabled
    const doc = new Docxtemplater(zip, {
      modules: [imageModule],
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare analysis data for all products
    const productsData = await Promise.all(products.map(async (product) => {
      const greekTranslation = product.translations?.find(t => t.languageCode === 'el');
      const greekName = greekTranslation?.name || product.name || 'N/A';
      const greekDescription = greekTranslation?.description || product.translations?.[0]?.description || '';

      // Get Greek specifications
      const greekSpecs = (product.specifications || []).map(spec => {
        const greekSpec = spec.translations.find(t => t.languageCode === 'el');
        if (greekSpec) {
          return {
            name: greekSpec.specName,
            value: greekSpec.specValue,
          };
        }
        return null;
      }).filter(Boolean);

      // Construct dimensions string if available
      let dimensions = '';
      if (product.length || product.width || product.height) {
        const parts = [];
        if (product.length) parts.push(`Μήκος: ${product.length}mm`);
        if (product.width) parts.push(`Πλάτος: ${product.width}mm`);
        if (product.height) parts.push(`Ύψος: ${product.height}mm`);
        dimensions = parts.join(', ');
      }

      // Download images to temporary files
      const defaultImage = product.images?.find(img => img.isDefault) || product.images?.[0];
      const otherImages = product.images?.filter(img => !img.isDefault && img !== defaultImage) || [];
      
      let mainImagePath: string | null = null;
      const additionalImagePaths: string[] = [];
      
      // Download main image
      if (defaultImage?.url) {
        try {
          const response = await axios.get(defaultImage.url, { 
            responseType: 'arraybuffer',
            timeout: 10000 // 10 second timeout
          });
          const ext = path.extname(defaultImage.url.split('?')[0]) || '.jpg';
          const tempPath = path.join(os.tmpdir(), `${uuidv4()}${ext}`);
          fs.writeFileSync(tempPath, Buffer.from(response.data));
          mainImagePath = tempPath;
          tempFiles.push(tempPath);
        } catch (error) {
          console.error(`Failed to download main image for product ${product.id}:`, error);
        }
      }
      
      // Download additional images (limit to 3)
      for (const img of otherImages.slice(0, 3)) {
        if (img.url) {
          try {
            const response = await axios.get(img.url, { 
              responseType: 'arraybuffer',
              timeout: 10000
            });
            const ext = path.extname(img.url.split('?')[0]) || '.jpg';
            const tempPath = path.join(os.tmpdir(), `${uuidv4()}${ext}`);
            fs.writeFileSync(tempPath, Buffer.from(response.data));
            additionalImagePaths.push(tempPath);
            tempFiles.push(tempPath);
          } catch (error) {
            console.error(`Failed to download additional image for product ${product.id}:`, error);
          }
        }
      }

      return {
        productName: greekName.toUpperCase(),
        description: greekDescription,
        hasSpecifications: greekSpecs.length > 0,
        specifications: greekSpecs,
        hasBrand: !!product.brand,
        brandName: product.brand || '',
        hasCategory: !!product.category,
        categoryName: product.category || '',
        hasDimensions: !!dimensions,
        dimensions: dimensions,
        hasWeight: !!product.weight,
        weight: product.weight ? `${product.weight}g` : '',
        hasUnit: !!product.unit,
        unit: product.unit?.name || '',
        hasMainImage: !!mainImagePath,
        mainImage: mainImagePath,
        hasAdditionalImages: additionalImagePaths.length > 0,
        additionalImages: additionalImagePaths,
      };
    }));

    // Prepare template data with array of products
    const templateData = {
      products: productsData,
      generatedDate: new Date().toLocaleDateString('el-GR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      totalProducts: products.length,
    };
    
    console.log('Multi-product template data prepared:', {
      totalProducts: templateData.totalProducts,
      generatedDate: templateData.generatedDate,
      productsWithImages: productsData.filter(p => p.hasMainImage).length,
      productsWithAdditionalImages: productsData.filter(p => p.hasAdditionalImages).length,
    });
    
    // Render the document
    try {
      doc.render(templateData);
    } catch (renderError: any) {
      console.error('Error rendering document:', renderError);
      console.error('Render error properties:', renderError.properties);
      throw renderError;
    }
    
    // Generate buffer
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });
    
    // Clean up temporary files
    tempFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted temporary file: ${filePath}`);
        }
      } catch (error) {
        console.error(`Failed to delete temporary file ${filePath}:`, error);
      }
    });
    
    return buffer;
  } catch (error) {
    console.error('Error generating multi-product analysis document:', error);
    
    // Clean up temporary files even on error
    tempFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error(`Failed to delete temporary file ${filePath}:`, cleanupError);
      }
    });
    
    throw new Error(`Failed to generate multi-product analysis document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

