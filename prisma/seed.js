const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin
  const hashedPassword = await bcrypt.hash('1212', 10);
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });
  console.log('✅ Admin created:', admin.username);

  // Create default settings
  const defaultSettings = [
    { key: 'bank_info', value: '하나은행 371-910035-71704 주식회사 태평프레시' },
    { key: 'notify_emails', value: '365@tpfresh.com' },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
    console.log(`✅ Setting: ${setting.key} = ${setting.value}`);
  }

  // Create sample categories
  const categories = [
    { name: '화장지/물티슈', order: 0, slug: 'tissue-wipes' },
    { name: '세제/섬유유연제', order: 1, slug: 'detergent-softener' },
    { name: '식품', order: 2, slug: 'food' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    console.log(`✅ Category: ${cat.name}`);
  }

  // Create sample products
  const category1 = await prisma.category.findUnique({ where: { name: '화장지/물티슈' } });
  if (category1) {
    const products = [
      {
        name: '부드러운 프리미엄 화장지 30롤',
        spec: '3겹 30m',
        description: '<p>먼지 없는 프리미엄 화장지입니다. 피부 자극 테스트를 완료했습니다.</p>',
        categoryId: category1.id,
        mallType: 'SELL',
        isActive: true,
        options: {
          create: [
            { name: '기본 1팩 (30롤)', originalPrice: 20000, salePrice: 15000, discountRate: 25, isDefault: true, stock: 100 },
            { name: '대용량 2팩 (60롤)', originalPrice: 40000, salePrice: 28000, discountRate: 30, isDefault: false, stock: 50 },
          ]
        }
      },
      {
        name: '촉촉한 퓨어 아기 물티슈 10팩',
        spec: '70매 x 10팩',
        description: '<p>안전한 성분으로 만든 아기 물티슈입니다. 자연 유래 추출물 함유.</p>',
        categoryId: category1.id,
        mallType: 'SELL',
        isActive: true,
        options: {
          create: [
            { name: '1박스 (10팩)', originalPrice: 18000, salePrice: 12900, discountRate: 28, isDefault: true, stock: 200 },
          ]
        }
      }
    ];

    for (const prod of products) {
      const existing = await prisma.product.findFirst({ where: { name: prod.name } });
      if (!existing) {
        const created = await prisma.product.create({ data: prod });
        console.log(`✅ Product: ${created.name}`);
      } else {
        console.log(`⏩ Product already exists: ${prod.name}`);
      }
    }
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
