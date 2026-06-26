import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 파트너사 목록 조회
export async function GET(req: NextRequest) {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { overrides: true, orders: true }
        }
      }
    });
    return NextResponse.json(partners);
  } catch (error) {
    console.error('GET /api/partners error:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}

// POST: 파트너사 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Slug 중복 체크
    const existing = await prisma.partner.findUnique({
      where: { slug: body.slug }
    });
    if (existing) {
      return NextResponse.json({ error: '이미 존재하는 URL 영문 주소(Slug)입니다.' }, { status: 400 });
    }

    const partner = await prisma.partner.create({
      data: {
        name: body.name,
        slug: body.slug,
        logoText: body.logoText || null,
        logoSubtext: body.logoSubtext || null,
        logoImageUrl: body.logoImageUrl || null,
        bannerImage: body.bannerImage || null,
        bannerTitle: body.bannerTitle || null,
        bannerSubtitle: body.bannerSubtitle || null,
        cartTitle: body.cartTitle || null,
        isActive: body.isActive ?? true,
      }
    });
    return NextResponse.json(partner);
  } catch (error) {
    console.error('POST /api/partners error:', error);
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 });
  }
}
