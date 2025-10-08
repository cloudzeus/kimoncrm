import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default VAT rate
  const vatRate = await prisma.vatRate.upsert({
    where: { id: 'default-vat' },
    update: {},
    create: {
      id: 'default-vat',
      name: 'Standard VAT Rate',
      rate: 24.00,
      softoneCode: '1',
    },
  });

  // Create default unit
  const unit = await prisma.unit.upsert({
    where: { code: 'PCS' },
    update: {},
    create: {
      code: 'PCS',
      name: 'Pieces',
      softoneCode: '1',
    },
  });

  // Create default country
  const country = await prisma.country.upsert({
    where: { iso2: 'GR' },
    update: {},
    create: {
      iso2: 'GR',
      name: 'Greece',
      softoneCode: '1',
    },
  });

  // Create default category
  const category = await prisma.category.upsert({
    where: { id: 'default-category' },
    update: {},
    create: {
      id: 'default-category',
      name: 'General',
      softoneCode: '1',
    },
  });

  // Create default brand
  const brand = await prisma.brand.upsert({
    where: { name: 'Generic' },
    update: {},
    create: {
      name: 'Generic',
      softoneCode: '1',
    },
  });

  // Create default manufacturer
  const manufacturer = await prisma.manufacturer.upsert({
    where: { name: 'Generic Manufacturer' },
    update: {},
    create: {
      name: 'Generic Manufacturer',
      softoneCode: '1',
    },
  });

  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      code: 'MAIN',
      name: 'Main Branch',
      address: '123 Main Street, Athens, Greece',
      phone: '+30 210 1234567',
      email: 'info@aic-crm.com',
    },
  });

  // Create default department
  const department = await prisma.department.upsert({
    where: { id: 'default-dept' },
    update: {},
    create: {
      id: 'default-dept',
      name: 'General',
      emailGroup: 'general@aic-crm.com',
    },
  });

  // Create default work position
  const workPosition = await prisma.workPosition.upsert({
    where: { id: 'default-pos' },
    update: {},
    create: {
      id: 'default-pos',
      title: 'Employee',
      departmentId: department.id,
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aic-crm.com' },
    update: {},
    create: {
      email: 'admin@aic-crm.com',
      name: 'Administrator',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      departmentId: department.id,
      workPositionId: workPosition.id,
      branchId: branch.id, // Associate admin with main branch
    },
  });

  // Create SoftOne endpoints
  const endpoints = [
    {
      method: 'getCustomers',
      url: `${process.env.SOFTONE_BASE_URL}/customers`,
    },
    {
      method: 'getProducts',
      url: `${process.env.SOFTONE_BASE_URL}/products`,
    },
    {
      method: 'insertQuote',
      url: `${process.env.SOFTONE_BASE_URL}/quotes`,
    },
    {
      method: 'insertOrder',
      url: `${process.env.SOFTONE_BASE_URL}/orders`,
    },
    {
      method: 'getInventory',
      url: `${process.env.SOFTONE_BASE_URL}/inventory`,
    },
    {
      method: 'updateInventory',
      url: `${process.env.SOFTONE_BASE_URL}/inventory/update`,
    },
  ];

  for (const endpoint of endpoints) {
    await prisma.softoneEndpoint.upsert({
      where: { method: endpoint.method },
      update: { url: endpoint.url },
      create: endpoint,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user created: admin@aic-crm.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
