import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean MTRL codes in Product table
 * Removes trailing slashes and trims whitespace
 */
async function cleanMtrlCodes() {
  try {
    console.log('🔍 Fetching products with MTRL codes...');
    
    const products = await prisma.product.findMany({
      where: {
        mtrl: {
          not: null,
        },
      },
      select: {
        id: true,
        mtrl: true,
        code: true,
      },
    });

    console.log(`📦 Found ${products.length} products with MTRL codes`);

    let updatedCount = 0;
    const updates = [];

    for (const product of products) {
      if (!product.mtrl) continue;

      // Clean MTRL: trim and remove trailing slashes
      const cleanMtrl = product.mtrl.trim().replace(/\/+$/, '');

      // Only update if the MTRL changed
      if (cleanMtrl !== product.mtrl) {
        updates.push({
          id: product.id,
          code: product.code,
          oldMtrl: product.mtrl,
          newMtrl: cleanMtrl,
        });

        await prisma.product.update({
          where: { id: product.id },
          data: { mtrl: cleanMtrl },
        });

        updatedCount++;
        console.log(`✅ Updated product ${product.code}: "${product.mtrl}" → "${cleanMtrl}"`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total products with MTRL: ${products.length}`);
    console.log(`   Products updated: ${updatedCount}`);
    console.log(`   Products unchanged: ${products.length - updatedCount}`);

    if (updates.length > 0) {
      console.log('\n📝 Updated products:');
      updates.forEach((u) => {
        console.log(`   ${u.code}: "${u.oldMtrl}" → "${u.newMtrl}"`);
      });
    }

    console.log('\n✅ MTRL codes cleaned successfully!');
  } catch (error) {
    console.error('❌ Error cleaning MTRL codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cleanMtrlCodes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

