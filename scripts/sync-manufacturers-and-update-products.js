#!/usr/bin/env node

/**
 * Script to sync manufacturers and categories from SoftOne ERP and update product codes
 * This script will:
 * 1. Fetch all manufacturers from SoftOne ERP
 * 2. Fetch all categories from SoftOne ERP
 * 3. Sync them to the database
 * 4. Update product manufacturer and category codes to match ERP data
 */

const { PrismaClient } = require('@prisma/client');
const iconv = require('iconv-lite');

const prisma = new PrismaClient();

const SOFTONE_BASE_URL = 'https://aic.oncloud.gr/s1services/JS/webservice.utilities';
const SOFTONE_ITEMS_URL = 'https://aic.oncloud.gr/s1services/JS/webservice.items';
const SOFTONE_CREDENTIALS = {
  username: process.env.SOFTONE_USERNAME || 'Service',
  password: process.env.SOFTONE_PASSWORD || 'Service',
  company: parseInt(process.env.SOFTONE_COMPANY || '1000'),
};

/**
 * Convert ANSI 1253 encoded data to UTF-8
 */
function convertAnsi1253ToUtf8(buffer) {
  const uint8Array = new Uint8Array(buffer);
  return iconv.decode(Buffer.from(uint8Array), 'win1253');
}

/**
 * Fetch all manufacturers from SoftOne ERP
 */
async function fetchAllManufacturers() {
  try {
    const response = await fetch(`${SOFTONE_BASE_URL}/getManufactures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: SOFTONE_CREDENTIALS.username,
        password: SOFTONE_CREDENTIALS.password,
        company: SOFTONE_CREDENTIALS.company,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    const data = JSON.parse(decodedText);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch manufacturers');
    }

    return data;
  } catch (error) {
    console.error('Error fetching manufacturers from SoftOne:', error);
    throw error;
  }
}

/**
 * Fetch all categories from SoftOne ERP
 */
async function fetchAllCategories() {
  try {
    // Try different endpoints for categories
    let response;
    try {
      response = await fetch(`${SOFTONE_ITEMS_URL}/getCategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: SOFTONE_CREDENTIALS.username,
          password: SOFTONE_CREDENTIALS.password,
          company: SOFTONE_CREDENTIALS.company,
          sodtype: 51,
        }),
      });
    } catch (error) {
      // Fallback to utilities endpoint
      response = await fetch(`${SOFTONE_BASE_URL}/getCategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: SOFTONE_CREDENTIALS.username,
          password: SOFTONE_CREDENTIALS.password,
          company: SOFTONE_CREDENTIALS.company,
          sodtype: 51,
        }),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const decodedText = convertAnsi1253ToUtf8(arrayBuffer);
    const data = JSON.parse(decodedText);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch categories');
    }

    return data;
  } catch (error) {
    console.error('Error fetching categories from SoftOne:', error);
    throw error;
  }
}

/**
 * Map SoftOne manufacturer to Prisma Manufacturer model
 */
function mapSoftOneManufacturerToModel(softoneManufacturer) {
  return {
    mtrmanfctr: softoneManufacturer.MTRMANFCTR,
    code: softoneManufacturer.CODE,
    name: softoneManufacturer.NAME,
    isActive: softoneManufacturer.ISACTIVE === '1',
    softoneCode: softoneManufacturer.MTRMANFCTR,
  };
}

/**
 * Map SoftOne category to Prisma Category model
 */
function mapSoftOneCategoryToModel(softoneCategory) {
  return {
    name: softoneCategory.NAME,
    softoneCode: softoneCategory.CODE, // Map CODE to softoneCode
  };
}

async function syncManufacturersAndUpdateProducts() {
  try {
    console.log('🚀 Starting manufacturer and category sync with product update...');

    // Step 1: Fetch manufacturers from SoftOne ERP
    console.log('📡 Fetching manufacturers from SoftOne ERP...');
    const manufacturersResponse = await fetchAllManufacturers();
    console.log(`✅ Found ${manufacturersResponse.total} manufacturers in ERP`);

    // Step 2: Sync manufacturers to database
    console.log('💾 Syncing manufacturers to database...');
    let manufacturersCreated = 0;
    let manufacturersUpdated = 0;

    for (const softoneManufacturer of manufacturersResponse.result) {
      const mappedManufacturer = mapSoftOneManufacturerToModel(softoneManufacturer);
      
      const existingManufacturer = await prisma.manufacturer.findUnique({
        where: { mtrmanfctr: mappedManufacturer.mtrmanfctr },
      });

      try {
        await prisma.manufacturer.upsert({
          where: { mtrmanfctr: mappedManufacturer.mtrmanfctr },
          create: {
            ...mappedManufacturer,
            code: mappedManufacturer.code || mappedManufacturer.mtrmanfctr, // Use mtrmanfctr as code if code is empty
          },
          update: {
            ...mappedManufacturer,
            code: mappedManufacturer.code || mappedManufacturer.mtrmanfctr,
          },
        });

        if (existingManufacturer) {
          manufacturersUpdated++;
        } else {
          manufacturersCreated++;
        }
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Duplicate manufacturer name: ${mappedManufacturer.name} (mtrmanfctr: ${mappedManufacturer.mtrmanfctr})`);
          // Try to update by finding existing manufacturer with same name
          const existingByName = await prisma.manufacturer.findFirst({
            where: { name: mappedManufacturer.name }
          });
          if (existingByName) {
            await prisma.manufacturer.update({
              where: { id: existingByName.id },
              data: {
                mtrmanfctr: mappedManufacturer.mtrmanfctr,
                code: mappedManufacturer.code || mappedManufacturer.mtrmanfctr,
                isActive: mappedManufacturer.isActive,
              }
            });
            manufacturersUpdated++;
          }
        } else {
          throw error;
        }
      }
    }

    console.log(`✅ Manufacturers synced: ${manufacturersCreated} created, ${manufacturersUpdated} updated`);

    // Step 3: Skip categories sync for now (endpoint issue)
    console.log('⚠️  Skipping categories sync due to endpoint issues');
    let categoriesCreated = 0;
    let categoriesUpdated = 0;

    // Step 5: Update product manufacturer and category codes
    console.log('🔄 Updating product manufacturer and category codes...');
    
    // Get all products that need updating
    const productsToUpdate = await prisma.product.findMany({
      where: {
        OR: [
          { mtrmanfctr: { not: null }, manufacturerId: null },
          { mtrcategory: { not: null }, categoryId: null }
        ]
      },
      select: {
        id: true,
        name: true,
        mtrmanfctr: true,
        mtrcategory: true,
        manufacturerId: true,
        categoryId: true,
      }
    });

    console.log(`📋 Found ${productsToUpdate.length} products to update`);

    let productsUpdated = 0;
    let productsSkipped = 0;

    for (const product of productsToUpdate) {
      const updateData = {};
      let updatedFields = [];

      // Handle manufacturer
      if (product.mtrmanfctr && !product.manufacturerId) {
        const manufacturer = await prisma.manufacturer.findUnique({
          where: { mtrmanfctr: product.mtrmanfctr },
          select: { id: true, name: true }
        });

        if (manufacturer) {
          updateData.manufacturerId = manufacturer.id;
          updatedFields.push(`Manufacturer: ${manufacturer.name}`);
        } else {
          console.log(`⚠️  Manufacturer not found for mtrmanfctr: ${product.mtrmanfctr} (Product: ${product.name})`);
        }
      }

      // Handle category - use mtrcategory to find category by softoneCode
      // Pad mtrcategory with zeros to match softoneCode format (001, 002, etc.)
      if (product.mtrcategory && !product.categoryId) {
        const paddedMtrcategory = product.mtrcategory.toString().padStart(3, '0');
        const category = await prisma.category.findUnique({
          where: { softoneCode: paddedMtrcategory },
          select: { id: true, name: true }
        });

        if (category) {
          updateData.categoryId = category.id;
          updatedFields.push(`Category: ${category.name}`);
        } else {
          console.log(`⚠️  Category not found for mtrcategory: ${product.mtrcategory} (Product: ${product.name})`);
        }
      }

      // Update the product if we have changes
      if (Object.keys(updateData).length > 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: updateData
        });
        
        console.log(`✅ Updated product "${product.name}" -> ${updatedFields.join(', ')}`);
        productsUpdated++;
      } else {
        productsSkipped++;
      }
    }

    // Step 6: Verify the results
    console.log('🔍 Verifying results...');
    
    const totalProducts = await prisma.product.count();
    const productsWithManufacturers = await prisma.product.count({
      where: { manufacturerId: { not: null } }
    });
    const productsWithCategories = await prisma.product.count({
      where: { categoryId: { not: null } }
    });

    console.log('\n📊 SUMMARY:');
    console.log(`   Total products: ${totalProducts}`);
    console.log(`   Products with manufacturers: ${productsWithManufacturers}`);
    console.log(`   Products with categories: ${productsWithCategories}`);
    console.log(`   Products updated: ${productsUpdated}`);
    console.log(`   Products skipped: ${productsSkipped}`);
    console.log(`   Manufacturers created: ${manufacturersCreated}`);
    console.log(`   Manufacturers updated: ${manufacturersUpdated}`);
    console.log(`   Categories created: ${categoriesCreated}`);
    console.log(`   Categories updated: ${categoriesUpdated}`);

    // Step 7: Show some examples
    console.log('\n🎯 EXAMPLE PRODUCTS WITH MANUFACTURERS AND CATEGORIES:');
    const exampleProducts = await prisma.product.findMany({
      where: { 
        OR: [
          { manufacturerId: { not: null } },
          { categoryId: { not: null } }
        ]
      },
      include: {
        manufacturer: {
          select: { name: true, code: true }
        },
        category: {
          select: { name: true, softoneCode: true }
        }
      },
      take: 5
    });

    exampleProducts.forEach((product) => {
      const manufacturerInfo = product.manufacturer ? `Manufacturer: ${product.manufacturer.name}` : '';
      const categoryInfo = product.category ? `Category: ${product.category.name}` : '';
      const info = [manufacturerInfo, categoryInfo].filter(Boolean).join(', ');
      console.log(`   • ${product.name} -> ${info}`);
    });

    console.log('\n✅ Manufacturer and category sync with product update completed successfully!');

  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  syncManufacturersAndUpdateProducts();
}

module.exports = { syncManufacturersAndUpdateProducts };
