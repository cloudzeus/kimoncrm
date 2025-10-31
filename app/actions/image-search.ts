"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { bunnyPut } from "@/lib/bunny/upload";
import sharp from "sharp";

/**
 * Search for images using Bing Image Search API
 */
export async function searchImagesAction(query: string, count: number = 100) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const apiKey = process.env.BING_IMAGE_SEARCH_API_KEY;
    if (!apiKey) {
      return { 
        success: false, 
        error: "Bing Image Search API key not configured. Please add BING_IMAGE_SEARCH_API_KEY to your .env file" 
      };
    }

    // Bing Image Search API endpoint
    const endpoint = "https://api.bing.microsoft.com/v7.0/images/search";
    
    // Make the API request
    const response = await fetch(
      `${endpoint}?q=${encodeURIComponent(query)}&count=${Math.min(count, 150)}&imageType=Photo&safeSearch=Moderate`,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Bing API Error:", errorText);
      return { 
        success: false, 
        error: `Bing API error: ${response.status}` 
      };
    }

    const data = await response.json();

    // Extract relevant image information and ensure thumbnails are 200x200
    const images = data.value?.map((img: any) => {
      // Bing provides thumbnailUrl but we want to standardize to 200x200
      let thumbnailUrl = img.thumbnailUrl || img.contentUrl;
      
      // Try to get 200x200 thumbnail if available from Bing's thumbnail resizing
      if (thumbnailUrl && thumbnailUrl.includes('&w=') && thumbnailUrl.includes('&h=')) {
        // Replace width and height parameters to get 200x200
        thumbnailUrl = thumbnailUrl.replace(/&w=\d+/, '&w=200').replace(/&h=\d+/, '&h=200');
      } else if (thumbnailUrl) {
        // Append size parameters if not present
        thumbnailUrl += thumbnailUrl.includes('?') ? '&w=200&h=200' : '?w=200&h=200';
      }

      return {
        thumbnailUrl,
        contentUrl: img.contentUrl,
        name: img.name || "",
        width: img.width || 0,
        height: img.height || 0,
        thumbnail: {
          width: 200,
          height: 200,
        },
        hostPageUrl: img.hostPageUrl || "",
        encodingFormat: img.encodingFormat || "",
      };
    }) || [];

    return {
      success: true,
      images,
      totalEstimatedMatches: data.totalEstimatedMatches || 0,
    };
  } catch (error: any) {
    console.error("Error searching images:", error);
    return {
      success: false,
      error: error.message || "Failed to search images",
    };
  }
}

/**
 * Download multiple images, convert to WebP, upload to BunnyCDN, and save to database
 * This processes everything server-side to avoid CORS issues
 */
export async function processAndSaveImagesAction(
  productId: string,
  selectedImages: Array<{
    contentUrl: string;
    name: string;
    isDefault: boolean;
    order: number;
  }>
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(session.user.role)) {
      return { success: false, error: "Forbidden" };
    }

    // Get product for alt text and code
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        translations: {
          where: { languageCode: "el" },
          select: { shortDescription: true },
        },
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Get default alt text
    let defaultAlt = product.translations[0]?.shortDescription || product.name;
    if (defaultAlt && defaultAlt.length > 255) {
      defaultAlt = defaultAlt.substring(0, 252) + "...";
    }

    const sanitizedCode = (product.code || product.id).replace(/[^a-zA-Z0-9]/g, "_");
    const uploadedImages: Array<{
      url: string;
      alt: string | null;
      isDefault: boolean;
      order: number;
    }> = [];
    const errors: Array<{ index: number; error: string }> = [];

    // If any image is set as default, unset all existing defaults
    const hasDefault = selectedImages.some((img) => img.isDefault);
    if (hasDefault) {
      await prisma.productImage.updateMany({
        where: { productId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Process each image
    for (let i = 0; i < selectedImages.length; i++) {
      const image = selectedImages[i];
      
      try {
        // Download the image
        const imageResponse = await fetch(image.contentUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; KimonCRM/1.0)",
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (!imageResponse.ok) {
          errors.push({ 
            index: i, 
            error: `Failed to download: ${imageResponse.status}` 
          });
          continue;
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Convert to WebP and optimize (main image)
        const webpBuffer = await sharp(imageBuffer)
          .webp({ quality: 85, effort: 6 })
          .resize(1200, 1200, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toBuffer();

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${sanitizedCode}_${timestamp}_${i}.webp`;
        const bunnyPath = `products/${filename}`;

        // Upload main image to BunnyCDN
        const uploadResult = await bunnyPut(bunnyPath, webpBuffer);

        uploadedImages.push({
          url: uploadResult.url,
          alt: image.name || defaultAlt || null,
          isDefault: image.isDefault,
          order: image.order,
        });
      } catch (error: any) {
        console.error(`Error processing image ${i}:`, error);
        errors.push({ 
          index: i, 
          error: error.message || "Processing failed" 
        });
      }
    }

    // Save all uploaded images to database
    if (uploadedImages.length > 0) {
      await prisma.$transaction(
        uploadedImages.map((img) =>
          prisma.productImage.create({
            data: {
              productId,
              url: img.url,
              alt: img.alt,
              isDefault: img.isDefault,
              order: img.order,
            },
          })
        )
      );

      // Revalidate product pages
      revalidatePath(`/products/${productId}`);
      revalidatePath("/products");
    }

    return {
      success: true,
      uploaded: uploadedImages.length,
      failed: errors.length,
      errors,
      message: `Successfully uploaded ${uploadedImages.length} image(s)${
        errors.length > 0 ? `, ${errors.length} failed` : ""
      }`,
    };
  } catch (error: any) {
    console.error("Error processing images:", error);
    return {
      success: false,
      error: error.message || "Failed to process images",
    };
  }
}


