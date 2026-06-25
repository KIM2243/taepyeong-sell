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

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/categories error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
