import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 스위트트래커 등 배송조회 API의 웹훅(Callback) 엔드포인트
export async function POST(req: Request) {
  try {
    // 제공업체에 따라 JSON 또는 Form Data 형태로 수신될 수 있음
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await req.json().catch(() => ({}));
    } else {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        body = Object.fromEntries(formData.entries());
      }
    }

    const trackingNo = body.invoiceNo || body.t_invoice || body.trackingNumber;
    const level = body.level || body.status; 

    if (!trackingNo) {
      return NextResponse.json({ success: false, msg: 'No tracking number provided' }, { status: 400 });
    }

    // 해당 운송장 번호를 가진 주문 검색 (최근 주문 우선)
    const order = await prisma.order.findFirst({
      where: { trackingNo },
      orderBy: { createdAt: 'desc' }
    });

    if (!order) {
      return NextResponse.json({ success: false, msg: 'Order not found' }, { status: 404 });
    }

    let newStatus = order.status;
    const parsedLevel = parseInt(level);
    
    // 스위트트래커 기준 level: 1(배송준비), 2(집화), 3(배송중), 4(지점도착), 5(배송출발), 6(배송완료)
    if (parsedLevel === 6) {
      newStatus = 'DELIVERED';
    } else if (parsedLevel >= 2 && parsedLevel <= 5) {
      newStatus = 'SHIPPED';
    } else if (body.status === 'DELIVERED' || body.status === 'SHIPPED') {
      // 일반적인 영문 상태값도 지원
      newStatus = body.status;
    }

    if (newStatus !== order.status) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus }
      });
      console.log(`[Webhook] Order ${order.orderNumber} status updated to ${newStatus} (Tracking: ${trackingNo})`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ success: false, msg: 'Internal server error' }, { status: 500 });
  }
}
