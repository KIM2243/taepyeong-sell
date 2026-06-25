import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 상품 목록 또는 단건 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const dealId = searchParams.get('dealId');
    const all = searchParams.get('all'); // admin: include inactive

    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          options: { orderBy: { isDefault: 'desc' } },
          category: true,
        },
      });
      return NextResponse.json(product);
    }

    // If dealId, get products for that deal
    if (dealId) {
      const dealProducts = await prisma.dealEventProduct.findMany({
        where: { dealEventId: dealId },
        include: {
          product: {
            include: {
              options: { orderBy: { isDefault: 'desc' } },
              category: true,
            },
          },
        },
      });
      return NextResponse.json(dealProducts.map((dp) => dp.product));
    }

    const products = await prisma.product.findMany({
      where: all === 'true' ? { mallType: 'SELL', options: { some: {} } } : { mallType: 'SELL', isActive: true, options: { some: {} } },
      orderBy: { order: 'asc' },
      include: {
        options: { orderBy: { isDefault: 'desc' } },
        category: true,
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST: 상품 생성 (어드민)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        isActive: body.isActive ?? true,
        isBestSeller: body.isBestSeller ?? false,
        isSale: body.isSale ?? false,
        order: body.order ?? 0,
        categoryId: body.categoryId,
        mallType: 'SELL',
        options: body.options
          ? {
              create: body.options.map((opt: {
                name: string;
                originalPrice: number;
                salePrice: number;
                discountRate?: number;
                stock?: number;
                isDefault?: boolean;
              }) => ({
                name: opt.name,
                originalPrice: opt.originalPrice,
                salePrice: opt.salePrice,
                discountRate: opt.discountRate ?? 0,
                stock: opt.stock ?? 9999,
                isDefault: opt.isDefault ?? false,
              })),
            }
          : undefined,
      },
      include: { options: true, category: true },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PUT: 상품 수정 (어드민)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Update product basic info
    await prisma.product.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        isActive: body.isActive,
        isBestSeller: body.isBestSeller,
        isSale: body.isSale,
        order: body.order,
        categoryId: body.categoryId,
      },
    });

    // Update options if provided
    if (body.options) {
      const existingOptions = await prisma.productOption.findMany({ where: { productId: body.id } });
      const incomingIds = body.options.map((o: any) => o.id).filter(Boolean);

      // Try to delete options that were removed (ignore errors if foreign key fails)
      const optionsToDelete = existingOptions.filter((o: any) => !incomingIds.includes(o.id));
      for (const opt of optionsToDelete) {
        try {
          await prisma.productOption.delete({ where: { id: opt.id } });
        } catch (e) {
          console.warn('Could not delete option, possibly referenced by order', opt.id);
        }
      }

      // Upsert incoming options
      for (const opt of body.options) {
        if (opt.id) {
          await prisma.productOption.update({
            where: { id: opt.id },
            data: {
              name: opt.name,
              originalPrice: opt.originalPrice,
              salePrice: opt.salePrice,
              discountRate: opt.discountRate ?? 0,
              stock: opt.stock ?? 9999,
              isDefault: opt.isDefault ?? false,
            }
          });
        } else {
          await prisma.productOption.create({
            data: {
              name: opt.name,
              originalPrice: opt.originalPrice,
              salePrice: opt.salePrice,
              productId: body.id,
              discountRate: opt.discountRate ?? 0,
              stock: opt.stock ?? 9999,
              isDefault: opt.isDefault ?? false,
            }
          });
        }
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id: body.id },
      include: { options: true, category: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/products error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE: 상품 삭제 (어드민)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/products error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
