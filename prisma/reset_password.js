const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Resetting admin password...');
  
  const hashedPassword = await bcrypt.hash('1212', 10);
  
  let admin = await prisma.admin.findUnique({ where: { username: 'admin' } });
  if (admin) {
    await prisma.admin.update({
      where: { username: 'admin' },
      data: { password: hashedPassword }
    });
    console.log('✅ Admin password has been reset to: 1212');
  } else {
    await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword,
      }
    });
    console.log('✅ Admin user created with password: 1212');
  }

  console.log('🎉 Password reset complete! (No other data was modified)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
