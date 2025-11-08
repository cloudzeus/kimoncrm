import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean service codes in Service table
 * Removes trailing slashes and trims whitespace
 */
async function cleanServiceCodes() {
  try {
    console.log('🔍 Fetching services with codes...');
    
    const services = await prisma.service.findMany({
      where: {
        code: {
          not: null,
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    console.log(`📦 Found ${services.length} services with codes`);

    let updatedCount = 0;
    let skippedCount = 0;
    const updates = [];
    const skipped = [];

    for (const service of services) {
      if (!service.code) continue;

      // Clean code: trim and remove trailing slashes
      const cleanCode = service.code.trim().replace(/\/+$/, '');

      // Only update if the code changed
      if (cleanCode !== service.code) {
        // Check if the cleaned code would create a duplicate
        const existingService = await prisma.service.findUnique({
          where: { code: cleanCode },
          select: { id: true, code: true, name: true },
        });

        if (existingService && existingService.id !== service.id) {
          // Skip - would create duplicate
          skipped.push({
            id: service.id,
            name: service.name,
            code: service.code,
            conflictsWith: existingService.name,
          });
          skippedCount++;
          console.log(`⚠️  Skipped service "${service.name}" (${service.code}): would conflict with "${existingService.name}" (${cleanCode})`);
          continue;
        }

        updates.push({
          id: service.id,
          name: service.name,
          oldCode: service.code,
          newCode: cleanCode,
        });

        await prisma.service.update({
          where: { id: service.id },
          data: { code: cleanCode },
        });

        updatedCount++;
        console.log(`✅ Updated service "${service.name}": "${service.code}" → "${cleanCode}"`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total services with codes: ${services.length}`);
    console.log(`   Services updated: ${updatedCount}`);
    console.log(`   Services skipped (duplicates): ${skippedCount}`);
    console.log(`   Services unchanged: ${services.length - updatedCount - skippedCount}`);

    if (updates.length > 0) {
      console.log('\n📝 Updated services:');
      updates.forEach((u) => {
        console.log(`   "${u.name}": "${u.oldCode}" → "${u.newCode}"`);
      });
    }

    if (skipped.length > 0) {
      console.log('\n⚠️  Skipped services (would create duplicates):');
      skipped.forEach((s) => {
        console.log(`   "${s.name}" (${s.code}) conflicts with "${s.conflictsWith}"`);
      });
      console.log('\n   These services need manual review - they may be duplicates that should be merged.');
    }

    console.log('\n✅ Service codes cleaned successfully!');
  } catch (error) {
    console.error('❌ Error cleaning service codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cleanServiceCodes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

