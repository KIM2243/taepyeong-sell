import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { products } = await req.json();
    // products = [{ productId, customName, isHidden, options: [{ productOptionId, customSalePrice }] }]
    
    const partnerId = params.id;

    // 1. Delete all existing overrides for this partner to recreate them cleanly
    // (Or we can upsert one by one. Recreating is easier for bulk edits, but deleting cascades to optionOverrides)
    await prisma.partnerProductOverride.deleteMany({
      where: { partnerId }
    });

    // 2. Re-insert
    for (const p of products) {
      const override = await prisma.partnerProductOverride.create({
        data: {
          partnerId,
          productId: p.productId,
          customName: p.customName || null,
          customDesc: p.customDesc || null,
          customImage: p.customImage || null,
          isHidden: p.isHidden || false,
        }
      });

      if (p.options && p.options.length > 0) {
        await prisma.partnerOptionOverride.createMany({
          data: p.options.map((o: any) => ({
            overrideId: override.id,
            productOptionId: o.productOptionId,
            customSalePrice: o.customSalePrice,
            customDiscountRate: o.customDiscountRate,
          }))
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Partner products PUT error:', error);
    return NextResponse.json({ error: 'Failed to update partner products' }, { status: 500 });
  }
}
