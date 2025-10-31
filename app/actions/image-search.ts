"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { bunnyPut } from "@/lib/bunny/upload";
import sharp from "sharp";

/**
 * Search for images using multiple providers with automatic fallback
 * Priority: SerpAPI (best for products) > Pexels > Google Custom Search > Bing
 */
export async function searchImagesAction(query: string, count: number = 100) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Try SerpAPI first (best for product images - real Google Images results)
    const serpApiKey = process.env.SERPAPI_API_KEY;
    if (serpApiKey) {
      const result = await searchImagesSerpAPI(query, count, serpApiKey);
      if (result.success) return result;
      console.log("SerpAPI failed, trying next provider...");
    }

    // Try Pexels (high-quality stock photos, good for products)
    const pexelsApiKey = process.env.PEXELS_API_KEY;
    if (pexelsApiKey) {
      const result = await searchImagesPexels(query, count, pexelsApiKey);
      if (result.success) return result;
      console.log("Pexels failed, trying next provider...");
    }

    // Try Google Custom Search
    const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    if (googleApiKey && googleSearchEngineId) {
      const result = await searchImagesGoogle(query, count, googleApiKey, googleSearchEngineId);
      if (result.success) return result;
      console.log("Google failed, trying next provider...");
    }

    // Fallback to Bing if configured
    const bingApiKey = process.env.BING_IMAGE_SEARCH_API_KEY;
    if (bingApiKey) {
      const result = await searchImagesBing(query, count, bingApiKey);
      if (result.success) return result;
    }

    // No API keys configured
    return { 
      success: false, 
      error: "No image search API configured. Please add SERPAPI_API_KEY, PEXELS_API_KEY, GOOGLE_SEARCH_API_KEY, or BING_IMAGE_SEARCH_API_KEY to your .env file" 
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
 * Search images using SerpAPI (Real Google Images results - best for products)
 */
async function searchImagesSerpAPI(query: string, count: number, apiKey: string) {
  try {
    const endpoint = "https://serpapi.com/search";
    const params = new URLSearchParams({
      engine: "google_images",
      q: query,
      api_key: apiKey,
      num: Math.min(count, 100).toString(),
      ijn: "0",
    });

    const response = await fetch(`${endpoint}?${params}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SerpAPI Error:", errorText);
      return { 
        success: false, 
        error: `SerpAPI error: ${response.status}` 
      };
    }

    const data = await response.json();

    const images = (data.images_results || []).map((img: any) => ({
      thumbnailUrl: img.thumbnail || img.original,
      contentUrl: img.original || img.thumbnail,
      name: img.title || query,
      width: img.original_width || 0,
      height: img.original_height || 0,
      thumbnail: {
        width: 200,
        height: 200,
      },
      hostPageUrl: img.source || "",
      encodingFormat: "",
    }));

    return {
      success: true,
      images,
      totalEstimatedMatches: images.length,
      provider: "serpapi",
    };
  } catch (error: any) {
    console.error("SerpAPI search error:", error);
    return {
      success: false,
      error: error.message || "Failed to search with SerpAPI",
    };
  }
}

/**
 * Search images using Pexels API (High-quality stock photos)
 */
async function searchImagesPexels(query: string, count: number, apiKey: string) {
  try {
    const maxResults = Math.min(count, 80); // Pexels max 80 per request
    const images: any[] = [];

    // Pexels returns 15-80 results per page
    const perPage = Math.min(maxResults, 80);
    const endpoint = "https://api.pexels.com/v1/search";
    const params = new URLSearchParams({
      query,
      per_page: perPage.toString(),
      page: "1",
    });

    const response = await fetch(`${endpoint}?${params}`, {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pexels API Error:", errorText);
      return { 
        success: false, 
        error: `Pexels API error: ${response.status}` 
      };
    }

    const data = await response.json();

    if (data.photos) {
      data.photos.forEach((photo: any) => {
        images.push({
          thumbnailUrl: photo.src.small || photo.src.tiny,
          contentUrl: photo.src.large2x || photo.src.large || photo.src.original,
          name: photo.alt || photo.photographer || query,
          width: photo.width || 0,
          height: photo.height || 0,
          thumbnail: {
            width: 200,
            height: 200,
          },
          hostPageUrl: photo.url || "",
          encodingFormat: "",
        });
      });
    }

    return {
      success: true,
      images,
      totalEstimatedMatches: data.total_results || images.length,
      provider: "pexels",
    };
  } catch (error: any) {
    console.error("Pexels search error:", error);
    return {
      success: false,
      error: error.message || "Failed to search with Pexels",
    };
  }
}

/**
 * Search images using Google Custom Search API
 */
async function searchImagesGoogle(query: string, count: number, apiKey: string, searchEngineId: string) {
  try {
    const maxResults = Math.min(count, 100); // Google allows max 100 results
    const images: any[] = [];

    // Google Custom Search returns 10 results per page, so we need to paginate
    const pages = Math.ceil(maxResults / 10);
    
    for (let page = 0; page < pages; page++) {
      const startIndex = page * 10 + 1;
      const endpoint = "https://www.googleapis.com/customsearch/v1";
      const params = new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: query,
        searchType: "image",
        num: "10",
        start: startIndex.toString(),
        safe: "active",
        imgSize: "large",
      });

      const response = await fetch(`${endpoint}?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google API Error:", errorText);
        
        if (images.length > 0) {
          // Return partial results if we got some
          break;
        }
        
        return { 
          success: false, 
          error: `Google API error: ${response.status}` 
        };
      }

      const data = await response.json();

      if (data.items) {
        data.items.forEach((item: any) => {
          images.push({
            thumbnailUrl: item.image?.thumbnailLink || item.link,
            contentUrl: item.link,
            name: item.title || "",
            width: item.image?.width || 0,
            height: item.image?.height || 0,
            thumbnail: {
              width: 200,
              height: 200,
            },
            hostPageUrl: item.image?.contextLink || "",
            encodingFormat: item.mime || "",
          });
        });
      }

      // Break if no more results
      if (!data.items || data.items.length < 10) {
        break;
      }
    }

    return {
      success: true,
      images,
      totalEstimatedMatches: images.length,
      provider: "google",
    };
  } catch (error: any) {
    console.error("Google search error:", error);
    return {
      success: false,
      error: error.message || "Failed to search with Google",
    };
  }
}

/**
 * Search images using Bing Image Search API
 */
async function searchImagesBing(query: string, count: number, apiKey: string) {
  try {
    const endpoint = "https://api.bing.microsoft.com/v7.0/images/search";
    
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

    const images = data.value?.map((img: any) => {
      let thumbnailUrl = img.thumbnailUrl || img.contentUrl;
      
      if (thumbnailUrl && thumbnailUrl.includes('&w=') && thumbnailUrl.includes('&h=')) {
        thumbnailUrl = thumbnailUrl.replace(/&w=\d+/, '&w=200').replace(/&h=\d+/, '&h=200');
      } else if (thumbnailUrl) {
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
      provider: "bing",
    };
  } catch (error: any) {
    console.error("Bing search error:", error);
    return {
      success: false,
      error: error.message || "Failed to search with Bing",
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


