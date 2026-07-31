import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { verifyAdminIP } from '@/lib/adminAuth';

// POST: 비밀번호 초기화 요청 (인증 코드 발송)
export async function POST(req: NextRequest) {
  try {
    const isIpAllowed = await verifyAdminIP(req);
    if (!isIpAllowed) {
      return NextResponse.json({ error: '접근이 거부된 IP입니다.' }, { status: 403 });
    }

    const body = await req.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: '아이디를 입력해주세요.' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      // 보안: 존재 여부를 노출하지 않음
      return NextResponse.json({ error: '등록된 이메일로 인증 코드를 발송할 수 없습니다.' }, { status: 400 });
    }

    if (!admin.email) {
      return NextResponse.json({ 
        error: '해당 계정에 이메일이 등록되어 있지 않습니다. 서버에서 직접 초기화해주세요. (npm run db:reset-pw)' 
      }, { status: 400 });
    }

    // 기존 미사용 코드 삭제 (cleanup)
    await prisma.adminVerificationCode.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const tempToken = crypto.randomUUID();

    await prisma.adminVerificationCode.create({
      data: {
        code,
        tempToken,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5분 유효
      }
    });

    // 이메일 발송
    if (process.env.SMTP_HOST) {
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
          to: admin.email,
          subject: '[태평프레시] 관리자 비밀번호 초기화 인증 코드',
          text: `관리자 비밀번호 초기화 인증 코드는 [${code}] 입니다.\n5분 내에 입력해주세요.\n\n본인이 요청하지 않은 경우 이 이메일을 무시해주세요.`,
        });
      } catch (err) {
        console.error('Password reset email send error:', err);
        return NextResponse.json({ error: '이메일 발송에 실패했습니다.' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'SMTP 설정이 되어있지 않습니다.' }, { status: 500 });
    }

    // 이메일 마스킹 (예: ad***@tpfresh.com)
    const emailParts = admin.email.split('@');
    const maskedLocal = emailParts[0].substring(0, 2) + '***';
    const maskedEmail = maskedLocal + '@' + emailParts[1];

    return NextResponse.json({ 
      success: true, 
      tempToken, 
      maskedEmail,
      message: '인증 코드가 이메일로 발송되었습니다.' 
    });
  } catch (error) {
    console.error('POST /api/admin/auth/reset error:', error);
    return NextResponse.json({ error: '비밀번호 초기화 요청에 실패했습니다.' }, { status: 500 });
  }
}

// PUT: 새 비밀번호 설정
export async function PUT(req: NextRequest) {
  try {
    const isIpAllowed = await verifyAdminIP(req);
    if (!isIpAllowed) {
      return NextResponse.json({ error: '접근이 거부된 IP입니다.' }, { status: 403 });
    }

    const body = await req.json();
    const { tempToken, code, newPassword } = body;

    if (!tempToken || !code || !newPassword) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: '비밀번호는 4자 이상이어야 합니다.' }, { status: 400 });
    }

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
      // 만료된 코드 삭제
      await prisma.adminVerificationCode.delete({ where: { id: verification.id } });
      return NextResponse.json({ error: '인증 코드의 유효 시간이 만료되었습니다. 다시 요청해주세요.' }, { status: 400 });
    }

    // 비밀번호 업데이트 (모든 admin 중 첫 번째 — 단일 관리자 시스템)
    const admins = await prisma.admin.findMany({ take: 1 });
    if (admins.length === 0) {
      return NextResponse.json({ error: '관리자 계정을 찾을 수 없습니다.' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: admins[0].id },
      data: { password: hashedPassword }
    });

    // 사용된 인증 코드 삭제
    await prisma.adminVerificationCode.delete({ where: { id: verification.id } });

    return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error('PUT /api/admin/auth/reset error:', error);
    return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 500 });
  }
}
