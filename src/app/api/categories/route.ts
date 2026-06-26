import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 카테고리 목록 (상품 포함)
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { mallType: 'SELL' },
      orderBy: { order: 'asc' },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { isDefault: 'desc' } } },
        },
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST: 카테고리 생성 (어드민)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = body.name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-') + '-' + Date.now();
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: slug,
        order: body.order ?? 0,
        mallType: 'SELL',
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error('POST /api/categories error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// PUT: 카테고리 수정 (어드민)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const existingCategory = await prisma.category.findFirst({ where: { id: body.id, mallType: 'SELL' } });
    if (!existingCategory) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });

    const category = await prisma.category.update({
      where: { id: body.id },
      data: {
        name: body.name,
        order: body.order,
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error('PUT /api/categories error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE: 카테고리 삭제 (어드민)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existingCategory = await prisma.category.findFirst({ where: { id, mallType: 'SELL' } });
    if (!existingCategory) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });

    // 카테고리에 속한 상품들도 모두 삭제 (단, OrderItem이 있는 경우 Prisma 에러가 발생할 수 있음)
    // OrderItem이 있는 상품의 삭제 정책에 따라 추후 soft-delete(isActive=false)로 변경할 수도 있습니다.
    await prisma.$transaction([
      prisma.product.deleteMany({ where: { categoryId: id, mallType: 'SELL' } }),
      prisma.category.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/categories error:', error);
    // 외래키 참조 에러(예: 주문 내역이 있는 상품을 삭제하려 할 때) 처리
    if (error.code === 'P2003') {
      return NextResponse.json({ error: '해당 카테고리에 이미 주문된 상품이 있어 삭제할 수 없습니다.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
