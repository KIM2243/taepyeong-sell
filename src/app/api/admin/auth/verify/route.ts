import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyAdminIP } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const isIpAllowed = await verifyAdminIP(req);
    if (!isIpAllowed) {
      return NextResponse.json({ error: '접근이 거부된 IP입니다.' }, { status: 403 });
    }

    const body = await req.json();
    const { tempToken, code, adminId } = body;

    const verification = await prisma.adminVerificationCode.findUnique({
      where: { tempToken }
    });

    if (!verification) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 });
    }

    if (verification.code !== code) {
      return NextResponse.json({ error: '인증 코드가 일치하지 않습니다.' }, { status: 400 });
    }

    if (verification.expiresAt < new Date()) {
      return NextResponse.json({ error: '인증 코드의 유효 시간이 만료되었습니다.' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Delete used verification code
    await prisma.adminVerificationCode.delete({ where: { id: verification.id } });

    return NextResponse.json({ success: true, username: admin.username });
  } catch (error) {
    console.error('POST /api/admin/auth/verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
