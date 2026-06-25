const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Fixing Admin password...');
  
  // Update admin password to '1212'
  const hashedPassword = await bcrypt.hash('1212', 10);
  
  // Find admin by username
  let admin = await prisma.admin.findUnique({ where: { username: 'admin' } });
  if (admin) {
    await prisma.admin.update({
      where: { username: 'admin' },
      data: { password: hashedPassword }
    });
    console.log('✅ Admin password has been reset to 1212');
  } else {
    await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword,
      }
    });
    console.log('✅ Admin user created with password 1212');
  }

  // Delete products that have options (taepyeong-sell products)
  const sellProducts = await prisma.product.findMany({
    where: { options: { some: {} } }
  });
  
  if (sellProducts.length > 0) {
    const ids = sellProducts.map(p => p.id);
    await prisma.productOption.deleteMany({});
    await prisma.product.deleteMany({
      where: { id: { in: ids } }
    });
    console.log(`✅ Deleted ${sellProducts.length} sell-specific products.`);
  } else {
    console.log('✅ No sell-specific products to delete.');
  }

  console.log('🎉 Reset complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
