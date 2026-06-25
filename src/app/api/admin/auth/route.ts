import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import { verifyAdminIP } from '@/lib/adminAuth';

// POST: 로그인
export async function POST(req: NextRequest) {
  try {
    const isIpAllowed = await verifyAdminIP(req);
    if (!isIpAllowed) {
      return NextResponse.json({ error: '접근이 거부된 IP입니다.' }, { status: 403 });
    }

    const body = await req.json();
    const { username, password } = body;

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    // Check 2FA
    const is2faEnabled = await prisma.siteSetting.findUnique({ where: { key: 'admin_2fa_enabled' } });
    
    if (is2faEnabled?.value === 'true') {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const tempToken = crypto.randomUUID();
      
      await prisma.adminVerificationCode.create({
        data: {
          code,
          tempToken,
          expiresAt: new Date(Date.now() + 60 * 1000) // 1 min expiry
        }
      });

      const emailsSetting = await prisma.siteSetting.findUnique({ where: { key: 'admin_2fa_emails' } });
      const toEmails = emailsSetting?.value?.split(',').map(x => x.trim()) || [];
      
      if (toEmails.length > 0 && process.env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        });
        
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: toEmails.join(', '),
            subject: '[태평프레시] 관리자 로그인 2차 인증 코드',
            text: `관리자 로그인 2차 인증 코드는 [${code}] 입니다. 1분 내에 입력해주세요.`,
          });
        } catch (err) {
          console.error('Email send error:', err);
        }
      }

      return NextResponse.json({ require2FA: true, tempToken, adminId: admin.id });
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

    return NextResponse.json({ success: true, username: admin.username });
  } catch (error) {
    console.error('POST /api/admin/auth error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

// GET: 세션 확인
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.value },
    });

    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, username: admin.username });
  } catch (error) {
    console.error('GET /api/admin/auth error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// DELETE: 로그아웃
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/auth error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
