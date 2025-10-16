#!/usr/bin/env ts-node

/**
 * Script to sync manufacturers from SoftOne ERP and update product manufacturer codes
 * This script will:
 * 1. Fetch all manufacturers from SoftOne ERP
 * 2. Sync them to the database
 * 3. Update product manufacturer codes to match ERP data
 */

const { PrismaClient } = require('@prisma/client');
const { fetchAllManufacturers, mapSoftOneManufacturerToModel } = require('../lib/softone/manufacturers');
const { fetchAllCategories, mapSoftOneCategoryToModel } = require('../lib/softone/categories');

const prisma = new PrismaClient();

async function syncManufacturersAndUpdateProducts() {
  try {
    console.log('🚀 Starting manufacturer sync and product update...');

    // Step 1: Fetch manufacturers from SoftOne ERP
    console.log('📡 Fetching manufacturers from SoftOne ERP...');
    const manufacturersResponse = await fetchAllManufacturers();
    console.log(`✅ Found ${manufacturersResponse.total} manufacturers in ERP`);

    // Step 2: Fetch categories from SoftOne ERP
    console.log('📡 Fetching categories from SoftOne ERP...');
    const categoriesResponse = await fetchAllCategories();
    console.log(`✅ Found ${categoriesResponse.total} categories in ERP`);

    // Step 3: Sync manufacturers to database
    console.log('💾 Syncing manufacturers to database...');
    let manufacturersCreated = 0;
    let manufacturersUpdated = 0;

    for (const softoneManufacturer of manufacturersResponse.result) {
      const mappedManufacturer = mapSoftOneManufacturerToModel(softoneManufacturer);
      
      const existingManufacturer = await prisma.manufacturer.findUnique({
        where: { mtrmanfctr: mappedManufacturer.mtrmanfctr },
      });

      await prisma.manufacturer.upsert({
        where: { mtrmanfctr: mappedManufacturer.mtrmanfctr },
        create: mappedManufacturer,
        update: mappedManufacturer,
      });

      if (existingManufacturer) {
        manufacturersUpdated++;
      } else {
        manufacturersCreated++;
      }
    }

    console.log(`✅ Manufacturers synced: ${manufacturersCreated} created, ${manufacturersUpdated} updated`);

    // Step 4: Sync categories to database
    console.log('💾 Syncing categories to database...');
    let categoriesCreated = 0;
    let categoriesUpdated = 0;

    for (const softoneCategory of categoriesResponse.result) {
      const mappedCategory = mapSoftOneCategoryToModel(softoneCategory);
      
      const existingCategory = await prisma.category.findUnique({
        where: { softoneCode: mappedCategory.softoneCode },
      });

      await prisma.category.upsert({
        where: { softoneCode: mappedCategory.softoneCode },
        create: mappedCategory,
        update: mappedCategory,
      });

      if (existingCategory) {
        categoriesUpdated++;
      } else {
        categoriesCreated++;
      }
    }

    console.log(`✅ Categories synced: ${categoriesCreated} created, ${categoriesUpdated} updated`);

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
      const updateData: any = {};
      let updatedFields: string[] = [];

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
      if (product.mtrcategory && !product.categoryId) {
        const category = await prisma.category.findUnique({
          where: { softoneCode: product.mtrcategory },
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

    exampleProducts.forEach((product: any) => {
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
