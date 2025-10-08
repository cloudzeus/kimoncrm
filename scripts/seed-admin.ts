import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdminUser() {
  try {
    console.log('🌱 Seeding admin user...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'gkozyris@gmail.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('72541969', 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'gkozyris@gmail.com',
        passwordHash: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully:');
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
    console.log('   ID:', adminUser.id);

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedAdminUser()
  .then(() => {
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
