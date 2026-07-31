import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET: 현재 관리자 이메일 조회
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.value },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ email: admin.email || '' });
  } catch (error) {
    console.error('GET /api/admin/email error:', error);
    return NextResponse.json({ error: 'Failed to get email' }, { status: 500 });
  }
}

// PUT: 관리자 이메일 등록/변경
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.value },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email } = body;

    // 간단한 이메일 유효성 검사
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '유효한 이메일 주소를 입력해주세요.' }, { status: 400 });
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { email: email || null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/admin/email error:', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}
