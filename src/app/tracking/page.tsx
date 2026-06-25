'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Truck, CheckCircle, Clock, Home } from 'lucide-react';
import { COURIER_CODES } from '@/lib/tracking';

interface OrderItem {
  productName: string;
  optionName: string;
  quantity: number;
  totalPrice: number;
}

interface TrackingDetail {
  timeString: string;
  where: string;
  kind: string;
}

interface Order {
  orderNumber: string;
  ordererName: string;
  status: string;
  totalAmount: number;
  trackingNo?: string;
  courier?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  trackingDetails?: TrackingDetail[];
}

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING: { label: '입금 대기', icon: <Clock size={20} />, color: 'var(--amber-500)' },
  PAID: { label: '입금 확인', icon: <CheckCircle size={20} />, color: 'var(--primary-600)' },
  PREPARING: { label: '상품 준비중', icon: <Package size={20} />, color: 'var(--primary-600)' },
  SHIPPED: { label: '배송중', icon: <Truck size={20} />, color: '#16a34a' },
  DELIVERED: { label: '배송 완료', icon: <CheckCircle size={20} />, color: '#16a34a' },
  CANCELLED: { label: '주문 취소', icon: <Clock size={20} />, color: 'var(--accent)' },
};

const STATUS_STEPS = ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'];

export default function TrackingPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [password, setPassword] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!orderNumber.trim() || !password.trim()) {
      setError('주문번호와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(
        `/api/orders?orderNumber=${encodeURIComponent(orderNumber)}&password=${encodeURIComponent(password)}`
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '주문을 찾을 수 없습니다.');
        return;
      }

      const data = await res.json();
      setOrder(data);
    } catch {
      setError('조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '80px 20px',
      background: '#f8fafc'
    }}>
      <div style={{
        background: '#fff',
        width: '100%',
        maxWidth: '640px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        padding: '56px 40px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'var(--primary-50)',
            borderRadius: '50%',
            marginBottom: '24px'
          }}>
            <Package size={48} color="var(--primary-600)" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--slate-800)', marginBottom: '16px' }}>
            배송조회
          </h1>
          <p style={{ color: 'var(--slate-500)', lineHeight: '1.6', fontSize: '0.95rem' }}>
            주문번호와 비밀번호를 입력하여<br />
            주문 및 배송 상태를 확인해 보세요.
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: 'var(--slate-700)', marginBottom: '8px' }}>주문번호</label>
            <input
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '1rem',
                border: '1.5px solid var(--slate-200)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--slate-200)'}
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="예: 20260623-0001"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: 'var(--slate-700)', marginBottom: '8px' }}>주문조회 비밀번호</label>
            <input
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '1rem',
                border: '1.5px solid var(--slate-200)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--slate-200)'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="주문 시 설정한 비밀번호"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '700', marginTop: '4px' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                flex: 1,
                padding: '20px 0',
                background: '#fff',
                border: '1.5px solid var(--slate-200)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--slate-700)',
                fontSize: '1.05rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--slate-400)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--slate-200)'}
            >
              <Home size={20} />
              쇼핑 계속하기
            </button>
            <button 
              onClick={handleSearch} 
              disabled={loading}
              style={{
                flex: 1,
                padding: '20px 0',
                background: 'var(--primary-600)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(0, 91, 130, 0.2)',
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" /> 조회 중...
                </>
              ) : (
                <>
                  <Search size={20} /> 조회하기
                </>
              )}
            </button>
          </div>
        </div>

        {/* Order Result */}
        {order && (
          <div style={{ marginTop: '48px', borderTop: '2px dashed var(--slate-200)', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--slate-800)', marginBottom: '24px' }}>
              주문 상태
            </h2>

            <div style={{
              background: '#f8fafc',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 24px',
              border: '1.5px solid var(--slate-100)',
              marginBottom: '32px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {/* Progress bar background */}
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '10%',
                    right: '10%',
                    height: '4px',
                    background: 'var(--slate-200)',
                    zIndex: 0,
                    borderRadius: '2px'
                  }}
                />
                {/* Progress bar active */}
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '10%',
                    width: `${Math.max(0, currentStepIndex / (STATUS_STEPS.length - 1)) * 80}%`,
                    height: '4px',
                    background: '#16a34a',
                    zIndex: 1,
                    transition: 'width 0.5s ease-in-out',
                    borderRadius: '2px'
                  }}
                />

                {STATUS_STEPS.map((step, idx) => {
                  const info = STATUS_MAP[step];
                  const isActive = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step} style={{ textAlign: 'center', zIndex: 2, flex: 1 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: isActive ? '#16a34a' : '#fff',
                          border: isActive ? 'none' : '2px solid var(--slate-200)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          color: isActive ? '#fff' : 'var(--slate-400)',
                          transition: 'all 0.3s',
                          boxShadow: isCurrent ? '0 0 0 6px rgba(22, 163, 74, 0.15)' : 'none',
                        }}
                      >
                        {info.icon}
                      </div>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? 'var(--slate-800)' : 'var(--slate-400)',
                        }}
                      >
                        {info.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Tracking Number */}
              {order.trackingNo && (
                <div
                  style={{
                    marginTop: '32px',
                    background: '#fff',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.95rem',
                    border: '1.5px dashed var(--slate-200)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--slate-700)'
                  }}
                >
                  <Truck size={18} color="var(--primary-600)" />
                  <strong style={{ color: 'var(--slate-800)' }}>운송장 번호:</strong> 
                  <span style={{ fontWeight: '600', color: 'var(--primary-600)' }}>
                    {order.courier && `[${COURIER_CODES.find(c => c.code === order.courier)?.name || order.courier}] `}{order.trackingNo}
                  </span>
                </div>
              )}

              {/* Tracking Details Timeline */}
              {order.trackingDetails && order.trackingDetails.length > 0 && (
                <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '2px dashed var(--slate-200)' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--slate-800)', marginBottom: '24px' }}>
                    상세 배송 이력
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.trackingDetails.map((detail, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                        <div style={{ 
                          minWidth: '70px', 
                          fontSize: '0.8rem', 
                          color: 'var(--slate-500)', 
                          paddingTop: '4px',
                          textAlign: 'right',
                          lineHeight: '1.4'
                        }}>
                          {detail.timeString.split(' ')[0]}<br/>
                          <strong style={{ color: 'var(--slate-700)', fontSize: '0.85rem' }}>{detail.timeString.split(' ')[1]}</strong>
                        </div>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: idx === order.trackingDetails!.length - 1 ? 'var(--primary-600)' : 'var(--slate-300)',
                          marginTop: '8px',
                          position: 'relative',
                          zIndex: 2,
                          boxShadow: idx === order.trackingDetails!.length - 1 ? '0 0 0 4px rgba(0, 91, 130, 0.15)' : 'none'
                        }}>
                          {idx < order.trackingDetails!.length - 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '12px',
                              left: '5px',
                              width: '2px',
                              height: '48px',
                              background: 'var(--slate-200)',
                              zIndex: 1
                            }} />
                          )}
                        </div>
                        <div style={{ flex: 1, paddingBottom: '24px' }}>
                          <div style={{ fontWeight: '800', color: 'var(--slate-800)', fontSize: '0.95rem', marginBottom: '4px' }}>
                            {detail.kind}
                          </div>
                          <div style={{ color: 'var(--slate-500)', fontSize: '0.85rem', fontWeight: '500' }}>
                            {detail.where}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Details Title */}
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--slate-800)', marginBottom: '16px', borderBottom: '2px solid var(--slate-800)', paddingBottom: '16px' }}>
              주문 내역
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginBottom: '32px' }}>
              <div className="payment-info-row">
                <span className="payment-label">주문번호</span>
                <span className="payment-value" style={{ fontWeight: 800, letterSpacing: '0.5px' }}>{order.orderNumber}</span>
              </div>
              <div className="payment-info-row">
                <span className="payment-label">주문자</span>
                <span className="payment-value" style={{ fontWeight: 600 }}>{order.ordererName}</span>
              </div>
              <div className="payment-info-row" style={{ borderBottom: 'none' }}>
                <span className="payment-label">주문일시</span>
                <span className="payment-value" style={{ fontWeight: 600 }}>{new Date(order.createdAt).toLocaleString('ko-KR')}</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-lg)', padding: '24px 32px', border: '1.5px solid var(--slate-100)' }}>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: idx < order.items.length - 1 ? '1px solid var(--slate-200)' : 'none',
                  }}
                >
                  <div style={{ paddingRight: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--slate-800)', marginBottom: '4px' }}>{item.productName}</div>
                    <div style={{ color: 'var(--slate-500)', fontSize: '0.85rem', fontWeight: 500 }}>
                      옵션: {item.optionName} <span style={{ margin: '0 4px' }}>|</span> 수량: {item.quantity}개
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--slate-800)', whiteSpace: 'nowrap' }}>
                    KRW {item.totalPrice.toLocaleString()}
                  </div>
                </div>
              ))}

              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '20px',
                  borderTop: '2px dashed var(--slate-300)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-700)' }}>총 결제 금액</span>
                <span style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--primary-700)' }}>
                  KRW {order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
