import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOrderNotification } from '@/lib/mailer';
import { formatDate } from '@/lib/utils';
import { getTrackingInfo } from '@/lib/tracking';

// POST: 주문 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Generate order number: YYYYMMDD-NNNN
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;

    // Count today's orders
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayCount = await prisma.order.count({
      where: {
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
    });

    const orderNumber = `${dateStr}-${(todayCount + 1).toString().padStart(4, '0')}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        ordererName: body.ordererName,
        ordererPhone: body.ordererPhone,
        ordererZipCode: body.ordererZipCode,
        ordererAddress: body.ordererAddress,
        ordererAddressDetail: body.ordererAddressDetail || null,
        orderPassword: body.orderPassword,
        receiverName: body.receiverName,
        receiverPhone: body.receiverPhone,
        receiverZipCode: body.receiverZipCode,
        receiverAddress: body.receiverAddress,
        receiverAddressDetail: body.receiverAddressDetail || null,
        shippingMemo: body.shippingMemo || null,
        totalAmount: body.totalAmount,
        paymentMethod: 'BANK_TRANSFER',
        depositorName: body.depositorName || null,
        privacyConsent: body.privacyConsent ?? false,
        cashReceiptType: body.cashReceiptType || 'NONE',
        cashReceiptPhone: body.cashReceiptPhone || null,
        businessNumber: body.businessNumber || null,
        dealEventId: body.dealEventId || null,
        partnerId: body.partnerId || null,
        status: 'PENDING',
        items: {
          create: body.items.map((item: {
            productId: string;
            productOptionId: string;
            productName: string;
            optionName: string;
            quantity: number;
            unitPrice: number;
          }) => ({
            productId: item.productId,
            productOptionId: item.productOptionId,
            productName: item.productName,
            optionName: item.optionName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Send email notification to admin
    try {
      const notifyEmails = await prisma.siteSetting.findUnique({
        where: { key: 'notify_emails' },
      });
      const emails = notifyEmails?.value?.split(',').map((e) => e.trim()).filter(Boolean) || [];
      if (emails.length > 0) {
        await sendOrderNotification(emails, {
          orderNumber: order.orderNumber,
          ordererName: order.ordererName,
          ordererPhone: order.ordererPhone,
          totalAmount: order.totalAmount,
          items: order.items.map((item) => ({
            productName: item.productName,
            optionName: item.optionName,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          })),
          createdAt: formatDate(order.createdAt),
        });
      }
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// GET: 주문 조회 (주문번호 + 비밀번호) 또는 전체 목록 (어드민)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber');
    const password = searchParams.get('password');
    const admin = searchParams.get('admin');
    const id = searchParams.get('id');

    // Single order by ID (admin)
    if (id) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true, dealEvent: true },
      });
      return NextResponse.json(order);
    }

    // Customer tracking query
    if (orderNumber && password) {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber,
          orderPassword: password,
        },
        include: { items: true },
      });

      if (!order) {
        return NextResponse.json({ error: '주문을 찾을 수 없습니다. 주문번호와 비밀번호를 확인해주세요.' }, { status: 404 });
      }

      // Fetch tracking details if available
      let trackingDetails = null;
      if (order.trackingNo && order.courier) {
        try {
          const tInfo = await getTrackingInfo(order.courier, order.trackingNo);
          trackingDetails = tInfo.trackingDetails;
          
          // Optionally auto-update status if it changed
          if (tInfo.status !== order.status) {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: tInfo.status }
            });
            order.status = tInfo.status;
          }
        } catch (e) {
          console.error('Failed to fetch tracking info on GET:', e);
        }
      }

      return NextResponse.json({ ...order, trackingDetails });
    }

    // Admin: all orders
    if (admin === 'true') {
      const status = searchParams.get('status');
      const orders = await prisma.order.findMany({
        where: status ? { status } : {},
        orderBy: { createdAt: 'desc' },
        include: { items: true, dealEvent: true, partner: true },
      });
      return NextResponse.json(orders);
    }

    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// PUT: 주문 상태 변경 (어드민)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    let finalStatus = body.status;

    // 만약 운송장 번호와 택배사가 존재하면 실제 배송 상태를 API에서 가져와서 우선 적용
    if (body.trackingNo && body.courier) {
      try {
        const tInfo = await getTrackingInfo(body.courier, body.trackingNo);
        finalStatus = tInfo.status;
      } catch (e) {
        console.warn('Failed to sync tracking info on save, using manual status', e);
      }
    }

    // items 정보가 배열로 들어오면 개별 아이템 업데이트 수행
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        if (item.id) {
          await prisma.orderItem.update({
            where: { id: item.id },
            data: {
              trackingNo: item.trackingNo || null,
              courier: item.courier || null,
            }
          });
        }
      }
    }

    const order = await prisma.order.update({
      where: { id: body.id },
      data: {
        status: finalStatus,
        trackingNo: body.trackingNo, // 주문 단위 대표 운송장 (하위 호환성)
        courier: body.courier,
        depositorName: body.depositorName,
      },
      include: { items: true },
    });
    return NextResponse.json(order);
  } catch (error) {
    console.error('PUT /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// DELETE: 주문 삭제 (어드민)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
