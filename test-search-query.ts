import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSearch() {
  console.log('Testing search for "DAHUA"...');
  
  // Test 1: Simple contains
  const results1 = await prisma.product.findMany({
    where: {
      name: { contains: 'DAHUA' }
    },
    take: 5,
    select: {
      id: true,
      name: true,
      code1: true,
      code2: true
    }
  });
  
  console.log('\n1. Contains "DAHUA" (uppercase):');
  console.log(`Found ${results1.length} products`);
  results1.forEach(p => console.log(`  - ${p.name}`));
  
  // Test 2: lowercase
  const results2 = await prisma.product.findMany({
    where: {
      name: { contains: 'dahua' }
    },
    take: 5,
    select: {
      id: true,
      name: true
    }
  });
  
  console.log('\n2. Contains "dahua" (lowercase):');
  console.log(`Found ${results2.length} products`);
  results2.forEach(p => console.log(`  - ${p.name}`));
  
  // Test 3: Check all products with "DAH" anywhere
  const results3 = await prisma.product.findMany({
    where: {
      name: { contains: 'DAH' }
    },
    take: 10,
    select: {
      id: true,
      name: true
    }
  });
  
  console.log('\n3. Contains "DAH" (partial):');
  console.log(`Found ${results3.length} products`);
  results3.forEach(p => console.log(`  - ${p.name}`));
  
  await prisma.$disconnect();
}

testSearch().catch(console.error);
