import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ensuring Company Details menu item exists...');

  // Find the Settings group by key
  const settingsGroup = await prisma.menuGroup.findUnique({ where: { key: 'settings' } });
  if (!settingsGroup) {
    throw new Error('Settings menu group not found. Run full menu seed first.');
  }

  // Upsert the menu item by key
  const item = await prisma.menuItem.upsert({
    where: { key: 'company_details' },
    update: {
      name: 'Company Details',
      path: '/settings/company-details',
      icon: 'FaBuilding',
      iconColor: '#6B7280',
      isActive: true,
      isExternal: false,
    },
    create: {
      groupId: settingsGroup.id,
      name: 'Company Details',
      key: 'company_details',
      path: '/settings/company-details',
      icon: 'FaBuilding',
      iconColor: '#6B7280',
      order: 3,
      isActive: true,
      isExternal: false,
    },
  });

  console.log('✅ Menu item ensured:', item.path);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


