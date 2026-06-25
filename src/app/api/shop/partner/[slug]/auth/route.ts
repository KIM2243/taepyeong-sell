import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { accessCode } = await req.json();

    const partner = await prisma.partner.findUnique({
      where: { slug: params.slug },
      select: { accessCode: true, isActive: true, accessDuration: true }
    });

    if (!partner || !partner.isActive) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    if (!partner.accessCode) {
      return NextResponse.json({ success: true });
    }

    if (partner.accessCode !== accessCode) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    // Set cookie
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };

    if (partner.accessDuration && partner.accessDuration > 0) {
      cookieOptions.maxAge = 60 * 60 * 24 * partner.accessDuration;
    }

    cookies().set(`partner_access_${params.slug}`, 'true', cookieOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Partner auth error:', error);
    return NextResponse.json({ error: '인증 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
