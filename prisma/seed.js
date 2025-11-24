const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminEmail = 'admin@nutriwell.com';
    const adminPassword = 'Admin123!'; // Change this password

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (existingAdmin) {
        console.log('✅ Admin user already exists:', adminEmail);
        console.log('   Use this email to login');
        return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.user.create({
        data: {
            email: adminEmail,
            username: 'admin',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'NutriWell',
            role: 'ADMIN',
            isVerified: true,
            isActive: true,
        },
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   IMPORTANT: Change this password after first login!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
