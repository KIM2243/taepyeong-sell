// src/lib/tracking.ts

const API_KEY = process.env.TRACKING_API_KEY || '';
const IS_MOCK = false; // 테스트용 목업 데이터 비활성화 (실제 API 결과만 노출)

export const COURIER_CODES = [
  { code: '04', name: 'CJ대한통운', trackerId: 'kr.cjlogistics' },
  { code: '01', name: '우체국택배', trackerId: 'kr.epost' },
  { code: '05', name: '한진택배', trackerId: 'kr.hanjin' },
  { code: '08', name: '롯데택배', trackerId: 'kr.lotte' },
  { code: '06', name: '로젠택배', trackerId: 'kr.logen' },
];

export interface TrackingStatus {
  status: 'PREPARING' | 'SHIPPED' | 'DELIVERED';
  complete: boolean; // true if delivered
  level: number; // 1: 배송준비, 2: 집화, 3: 배송중, 4: 지점도착, 5: 배송출발, 6: 배송완료
  trackingDetails: Array<{
    timeString: string;
    where: string;
    kind: string;
  }>;
}

// 실시간 오픈 API 연동 (apis.tracker.delivery)
export async function getTrackingInfo(courierCode: string, trackingNo: string): Promise<TrackingStatus> {
  const courier = COURIER_CODES.find(c => c.code === courierCode);
  const cleanTrackingNo = trackingNo.replace(/[^0-9]/g, ''); // 숫자만 추출 (하이픈 제거)
  
  if (!courier || !courier.trackerId) {
    if (IS_MOCK) return getMockTrackingInfo(cleanTrackingNo);
    throw new Error('지원하지 않는 택배사입니다.');
  }

  try {
    const res = await fetch(`https://apis.tracker.delivery/carriers/${courier.trackerId}/tracks/${cleanTrackingNo}`);
    
    if (res.status === 404) {
      console.warn(`[Tracking API] Invoice ${cleanTrackingNo} not found. Falling back to mock if in dev.`);
      if (IS_MOCK) return getMockTrackingInfo(cleanTrackingNo);
      throw new Error('운송장 번호를 찾을 수 없습니다.');
    }

    if (!res.ok) {
      throw new Error(`API 응답 오류: ${res.status}`);
    }

    const data = await res.json();
    
    const stateId = data.state?.id || '';
    let status: 'PREPARING' | 'SHIPPED' | 'DELIVERED' = 'SHIPPED';
    let level = 3;
    let complete = false;

    if (stateId === 'delivered') {
      status = 'DELIVERED';
      level = 6;
      complete = true;
    } else if (stateId === 'information_received' || stateId === 'at_pickup') {
      status = 'PREPARING';
      level = stateId === 'at_pickup' ? 2 : 1;
    }

    const trackingDetails = (data.progresses || []).map((p: any) => {
      const date = new Date(p.time);
      const timeString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      return {
        timeString,
        where: p.location?.name || '위치 정보 없음',
        kind: p.description || p.status?.text || '상태 업데이트'
      };
    });

    // 역순 정렬 (최신이 위로 오도록)
    trackingDetails.reverse();

    return { status, complete, level, trackingDetails };
  } catch (error) {
    console.error('Failed to fetch tracking info:', error);
    if (IS_MOCK) return getMockTrackingInfo(trackingNo);
    throw error;
  }
}

// ---------------------------------------------------------
// Mock Implementation for Testing / Demo Purposes
// ---------------------------------------------------------
function getMockTrackingInfo(trackingNo: string): TrackingStatus {
  const lastChar = trackingNo.slice(-1);
  const isDelivered = lastChar === '1' || lastChar === '9';
  const isPreparing = lastChar === '0';

  let status: 'PREPARING' | 'SHIPPED' | 'DELIVERED' = 'SHIPPED';
  let level = 3;
  let complete = false;

  if (isDelivered) {
    status = 'DELIVERED';
    level = 6;
    complete = true;
  } else if (isPreparing) {
    status = 'PREPARING';
    level = 1;
  }

  const trackingDetails = [];
  
  if (level === 6) {
    trackingDetails.push({ timeString: '2026-06-25 15:00', where: '고객님', kind: '배송 완료' });
  }
  if (level >= 3) {
    trackingDetails.push({ timeString: '2026-06-25 08:30', where: '서울 강남', kind: '배송 출발 (기사님: 김태평)' });
    trackingDetails.push({ timeString: '2026-06-24 13:00', where: '옥천 HUB', kind: '간선 상차' });
  }
  if (level >= 1) {
    trackingDetails.push({ timeString: '2026-06-24 09:00', where: '경기 광주', kind: '집화 처리' });
  }

  return { status, complete, level, trackingDetails };
}
