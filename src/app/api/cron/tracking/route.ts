import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTrackingInfo } from '@/lib/tracking';

const prisma = new PrismaClient();

// Vercel Cron 또는 기타 스케줄러에서 주기적으로 호출할 엔드포인트
export async function GET(req: Request) {
  // 실제 프로덕션 환경에서는 인증 헤더를 체크하는 로직을 추가하는 것이 좋습니다.
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

  try {
    // 배송중이거나 상품준비중인 주문들 조회
    const activeOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PREPARING', 'SHIPPED']
        }
      },
      include: { items: true }
    });

    let updatedCount = 0;
    const errors = [];

    // 동시 요청으로 인한 API Rate Limit 방지를 위해 순차 처리
    for (const order of activeOrders) {
      // 주문 및 개별 상품의 모든 송장번호 수집
      const trackingPairs = new Set<string>();
      
      const addPairs = (c?: string | null, t?: string | null) => {
        if (!c || !t) return;
        const couriers = c.split(',').map(s => s.trim()).filter(Boolean);
        const trackings = t.split(',').map(s => s.trim()).filter(Boolean);
        for (let i = 0; i < Math.max(couriers.length, trackings.length); i++) {
          const courier = couriers[i] || couriers[0];
          const tracking = trackings[i] || trackings[0];
          if (courier && tracking) {
            trackingPairs.add(`${courier}::${tracking}`);
          }
        }
      };

      addPairs(order.courier, order.trackingNo);
      for (const item of order.items) {
        addPairs(item.courier, item.trackingNo);
      }

      if (trackingPairs.size === 0) continue;

      try {
        const statuses = await Promise.all(
          Array.from(trackingPairs).map(async (pair) => {
            const [courier, tracking] = pair.split('::');
            const info = await getTrackingInfo(courier, tracking);
            return info.status;
          })
        );

        // 상태 집계 로직: 
        // 하나라도 배송중(SHIPPED)이면 주문 상태는 SHIPPED
        // 모두 배송완료(DELIVERED)이면 주문 상태는 DELIVERED
        let newStatus = order.status;
        if (statuses.every(s => s === 'DELIVERED')) {
          newStatus = 'DELIVERED';
        } else if (statuses.some(s => s === 'SHIPPED' || s === 'DELIVERED')) {
          newStatus = 'SHIPPED';
        }
        
        if (newStatus !== order.status) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: newStatus }
          });
          updatedCount++;
          console.log(`[Cron] Order ${order.orderNumber} updated to ${newStatus}`);
        }
      } catch (err: any) {
        console.error(`[Cron] Failed to update order ${order.orderNumber}:`, err.message);
        errors.push({ order: order.orderNumber, error: err.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: activeOrders.length, 
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, msg: 'Internal server error' }, { status: 500 });
  }
}
