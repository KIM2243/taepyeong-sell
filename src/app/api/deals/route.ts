import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 특가 이벤트 목록 또는 활성 이벤트
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const active = searchParams.get('active');
    const id = searchParams.get('id');

    if (id) {
      const deal = await prisma.dealEvent.findUnique({
        where: { id },
        include: {
          dealProducts: {
            include: {
              product: {
                include: { options: { orderBy: { isDefault: 'desc' } }, category: true },
              },
            },
          },
        },
      });
      return NextResponse.json(deal);
    }

    const deals = await prisma.dealEvent.findMany({
      where: active === 'true' ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        dealProducts: {
          include: {
            product: {
              include: { options: true },
            },
          },
        },
      },
    });
    return NextResponse.json(deals);
  } catch (error) {
    console.error('GET /api/deals error:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

// POST: 특가 이벤트 생성 (어드민)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deal = await prisma.dealEvent.create({
      data: {
        title: body.title,
        subtitle: body.subtitle || null,
        bannerImage: body.bannerImage || null,
        isActive: body.isActive ?? true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        dealProducts: body.productIds
          ? {
              create: body.productIds.map((pid: string) => ({
                productId: pid,
              })),
            }
          : undefined,
      },
      include: { dealProducts: { include: { product: true } } },
    });
    return NextResponse.json(deal);
  } catch (error) {
    console.error('POST /api/deals error:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}

// PUT: 특가 이벤트 수정 (어드민)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Update deal
    await prisma.dealEvent.update({
      where: { id: body.id },
      data: {
        title: body.title,
        subtitle: body.subtitle,
        bannerImage: body.bannerImage,
        isActive: body.isActive,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    // Update product connections if provided
    if (body.productIds) {
      await prisma.dealEventProduct.deleteMany({
        where: { dealEventId: body.id },
      });
      await prisma.dealEventProduct.createMany({
        data: body.productIds.map((pid: string) => ({
          dealEventId: body.id,
          productId: pid,
        })),
      });
    }

    const updated = await prisma.dealEvent.findUnique({
      where: { id: body.id },
      include: { dealProducts: { include: { product: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/deals error:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

// DELETE: 특가 이벤트 삭제 (어드민)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.dealEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/deals error:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
