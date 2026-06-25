'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Copy, Home, Truck } from 'lucide-react';

interface OrderResult {
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  depositorName: string;
  settings: Record<string, string>;
}

export default function OrderCompletePage() {
  const router = useRouter();
  const [result, setResult] = useState<OrderResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('orderResult');
    if (!stored) {
      router.push('/');
      return;
    }
    setResult(JSON.parse(stored));
  }, [router]);

  const copyOrderNumber = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result) return null;

  const createdDate = new Date(result.createdAt);
  const formattedDate = `${createdDate.getFullYear()}-${(createdDate.getMonth()+1).toString().padStart(2,'0')}-${createdDate.getDate().toString().padStart(2,'0')} ${createdDate.getHours().toString().padStart(2,'0')}:${createdDate.getMinutes().toString().padStart(2,'0')}:${createdDate.getSeconds().toString().padStart(2,'0')}`;

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
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
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
            <CheckCircle size={48} color="var(--primary-600)" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--slate-800)', marginBottom: '16px' }}>
            고객님의 주문이 완료 되었습니다.
          </h1>
          <p style={{ color: 'var(--slate-500)', lineHeight: '1.6', fontSize: '0.95rem' }}>
            주문내역 및 배송에 관한 안내는 주문번호를 통하여만<br />
            확인 가능하오니 분실하지 않도록 주의 부탁드립니다.
          </p>
        </div>

        {/* Order Meta Box */}
        <div style={{
          background: '#f1f5f9',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 32px',
          marginBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--slate-600)', fontWeight: '600' }}>주문번호</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--slate-800)', letterSpacing: '0.5px' }}>
                {result.orderNumber}
              </span>
              <button
                onClick={copyOrderNumber}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: copied ? '#16a34a' : 'var(--slate-500)',
                  border: `1.5px solid ${copied ? '#bbf7d0' : 'var(--slate-300)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: copied ? '#f0fdf4' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <Copy size={12} />
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--slate-600)', fontWeight: '600' }}>주문일자</span>
            <span style={{ color: 'var(--slate-700)', fontWeight: '600' }}>{formattedDate}</span>
          </div>
        </div>

        {/* Payment Details Title */}
        <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--slate-800)', marginBottom: '16px', borderBottom: '2px solid var(--slate-800)', paddingBottom: '16px' }}>
          결제 정보
        </h2>

        {/* Payment Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginBottom: '48px' }}>
          <div className="payment-info-row">
            <span className="payment-label">결제 예정 금액</span>
            <span className="payment-value amount">KRW {result.totalAmount.toLocaleString()}</span>
          </div>
          <div className="payment-info-row">
            <span className="payment-label">결제방법</span>
            <span className="payment-value" style={{ fontWeight: '600' }}>무통장 입금</span>
          </div>
          <div className="payment-info-row">
            <span className="payment-label">입금자명</span>
            <span className="payment-value" style={{ fontWeight: '600' }}>{result.depositorName || '-'}</span>
          </div>
          <div className="payment-info-row" style={{ borderBottom: 'none' }}>
            <span className="payment-label">입금은행</span>
            <div className="payment-value" style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary-700)', marginBottom: '6px' }}>
                하나은행 371-910035-71704
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--slate-600)', fontWeight: '600' }}>
                예금주: 주식회사 태평프레시
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px' }}>
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
            onClick={() => router.push('/tracking')}
            style={{
              flex: 1,
              padding: '20px 0',
              background: 'var(--primary-600)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              color: '#fff',
              fontSize: '1.05rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(0, 91, 130, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Truck size={20} />
            배송조회하기
          </button>
        </div>
      </div>
    </div>
  );
}
