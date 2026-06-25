import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      include: {
        overrides: {
          include: {
            product: true,
            optionOverrides: true
          }
        }
      }
    });
    
    if (!partner) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(partner);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    
    // Check slug duplication if it changed
    if (body.slug) {
      const existing = await prisma.partner.findFirst({
        where: { slug: body.slug, id: { not: params.id } }
      });
      if (existing) {
        return NextResponse.json({ error: '이미 존재하는 URL 영문 주소(Slug)입니다.' }, { status: 400 });
      }
    }

    const partner = await prisma.partner.update({
      where: { id: params.id },
      data: {
        name: body.name,
        slug: body.slug,
        logoText: body.logoText,
        logoSubtext: body.logoSubtext,
        bannerImage: body.bannerImage,
        accessCode: body.accessCode,
        isActive: body.isActive,
      }
    });
    return NextResponse.json(partner);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.partner.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
