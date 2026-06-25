const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inserting Dummy Data...');

  // 1. Create a Category
  const catGift = await prisma.category.upsert({
    where: { slug: 'premium-gift' },
    update: { mallType: 'SELL' },
    create: { name: '프리미엄 선물세트', slug: 'premium-gift', order: 0, mallType: 'SELL' },
  });
  
  const catFresh = await prisma.category.upsert({
    where: { slug: 'fresh-food' },
    update: { mallType: 'SELL' },
    create: { name: '초신선 식품', slug: 'fresh-food', order: 1, mallType: 'SELL' },
  });

  // 2. Create Deal Event
  const deal = await prisma.dealEvent.create({
    data: {
      title: '임직원 전용! 한가위 특가 기획전',
      subtitle: '최대 60% 할인 및 무료배송',
      bannerImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop',
      isActive: true,
    }
  });

  // 3. Create Products with Options
  const products = [
    {
      name: '태평 1++ 프리미엄 한우 선물세트 (1.2kg)',
      desc: '명절 선물로 최고의 선택! 마블링이 살아있는 최상급 한우',
      image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?q=80&w=600&auto=format&fit=crop',
      catId: catGift.id,
      isBest: true,
      options: [
        { name: '구이용 세트 (1.2kg)', original: 250000, sale: 189000, discount: 24, isDefault: true },
        { name: '혼합 세트 (1.5kg)', original: 290000, sale: 219000, discount: 24, isDefault: false },
      ]
    },
    {
      name: '자연산 송이버섯 프리미엄 세트 (500g)',
      desc: '자연의 향을 그대로 담은 최고급 자연산 송이버섯',
      image: 'https://images.unsplash.com/photo-1595856465492-7f2868da3498?q=80&w=600&auto=format&fit=crop',
      catId: catGift.id,
      isBest: false,
      options: [
        { name: '1등급 송이 (500g)', original: 150000, sale: 99000, discount: 34, isDefault: true },
      ]
    },
    {
      name: '유기농 샤인머스켓 3수 세트',
      desc: '당도 20Brix 이상 보장! 달콤한 망고향 가득 샤인머스켓',
      image: 'https://images.unsplash.com/photo-1602058097126-f7fbdfd6ac84?q=80&w=600&auto=format&fit=crop',
      catId: catFresh.id,
      isBest: true,
      options: [
        { name: '특품 3수 (2kg 내외)', original: 45000, sale: 28900, discount: 35, isDefault: true },
      ]
    },
    {
      name: '제주 자연산 은갈치 특대 3미',
      desc: '제주 앞바다에서 낚시로 잡아 올린 최상급 은갈치',
      image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=600&auto=format&fit=crop',
      catId: catFresh.id,
      isBest: false,
      options: [
        { name: '특대 3미 (1.5kg 이상)', original: 85000, sale: 49000, discount: 42, isDefault: true },
      ]
    }
  ];

  for (const p of products) {
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        description: p.desc,
        imageUrl: p.image,
        isActive: true,
        isBestSeller: p.isBest,
        isSale: true,
        order: 0,
        categoryId: p.catId,
        mallType: 'SELL',
        options: {
          create: p.options.map(o => ({
            name: o.name,
            originalPrice: o.original,
            salePrice: o.sale,
            discountRate: o.discount,
            isDefault: o.isDefault,
            stock: 999,
          }))
        }
      }
    });

    // Link to deal
    await prisma.dealEventProduct.create({
      data: {
        dealEventId: deal.id,
        productId: prod.id,
      }
    });
  }

  console.log('✅ Dummy data successfully injected!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
