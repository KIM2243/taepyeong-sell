'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OrderItemData {
  productId: string;
  productOptionId: string;
  productName: string;
  optionName: string;
  quantity: number;
  unitPrice: number;
}

interface OrderData {
  items: OrderItemData[];
  totalAmount: number;
  dealEventId: string | null;
  dealTitle: string | null;
  settings: Record<string, string>;
  partnerId?: string | null;
}

declare global {
  interface Window {
    daum: {
      Postcode: new (config: {
        oncomplete: (data: { zonecode: string; address: string }) => void;
      }) => { open: () => void };
    };
  }
}

export default function OrderPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorKey, setErrorKey] = useState(0);

  const renderError = (field: string) => {
    if (!errors[field]) return null;
    return <div key={`${errorKey}-${field}`} className="field-error-msg">{errors[field]}</div>;
  };

  // 주문자 정보
  const [ordererName, setOrdererName] = useState('');
  const [ordererZipCode, setOrdererZipCode] = useState('');
  const [ordererAddress, setOrdererAddress] = useState('');
  const [ordererAddressDetail, setOrdererAddressDetail] = useState('');
  const [ordererPhone1, setOrdererPhone1] = useState('010');
  const [ordererPhone2, setOrdererPhone2] = useState('');
  const [ordererPhone3, setOrdererPhone3] = useState('');
  const [orderPassword, setOrderPassword] = useState('');
  const [orderPasswordConfirm, setOrderPasswordConfirm] = useState('');

  // 배송 정보
  const [shippingType, setShippingType] = useState<'same' | 'new'>('same');
  const [receiverName, setReceiverName] = useState('');
  const [receiverZipCode, setReceiverZipCode] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverAddressDetail, setReceiverAddressDetail] = useState('');
  const [receiverPhone1, setReceiverPhone1] = useState('010');
  const [receiverPhone2, setReceiverPhone2] = useState('');
  const [receiverPhone3, setReceiverPhone3] = useState('');
  const [shippingMemo, setShippingMemo] = useState('');

  // 개인정보 동의
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // 결제 정보
  const [depositorName, setDepositorName] = useState('');
  const [cashReceiptApply, setCashReceiptApply] = useState(false);
  const [personalType, setPersonalType] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');
  const [cashReceiptPhone1, setCashReceiptPhone1] = useState('010');
  const [cashReceiptPhone2, setCashReceiptPhone2] = useState('');
  const [cashReceiptPhone3, setCashReceiptPhone3] = useState('');
  const [businessNumber1, setBusinessNumber1] = useState('');
  const [businessNumber2, setBusinessNumber2] = useState('');
  const [businessNumber3, setBusinessNumber3] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('orderData');
    if (!stored) {
      router.push('/');
      return;
    }
    setOrderData(JSON.parse(stored));

    // Load Daum Postcode script
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [router]);

  const openAddressSearch = (type: 'orderer' | 'receiver') => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        if (type === 'orderer') {
          setOrdererZipCode(data.zonecode);
          setOrdererAddress(data.address);
        } else {
          setReceiverZipCode(data.zonecode);
          setReceiverAddress(data.address);
        }
      },
    }).open();
  };

  const validateAndScroll = () => {
    const newErrors: Record<string, string> = {};
    let firstErrorId = '';

    const addError = (field: string, id: string, msg: string) => {
      if (!firstErrorId) firstErrorId = id;
      newErrors[field] = msg;
    };

    if (!ordererName.trim()) addError('ordererName', 'ordererName', '주문하시는 분의 이름을 입력해주세요.');
    if (!ordererZipCode) addError('ordererZipCode', 'ordererZipCode', '주소를 입력해주세요.');
    if (!ordererPhone1 || !ordererPhone2 || !ordererPhone3) addError('ordererPhone', 'ordererPhone', '휴대전화 번호를 모두 입력해주세요.');
    if (!orderPassword.trim() || orderPassword.length < 4) {
      addError('orderPassword', 'orderPassword', '비밀번호를 4자리 이상 입력해주세요.');
    } else if (orderPassword !== orderPasswordConfirm) {
      addError('orderPasswordConfirm', 'orderPasswordConfirm', '비밀번호가 일치하지 않습니다.');
    } 
    
    if (shippingType === 'new') {
      if (!receiverName.trim()) addError('receiverName', 'receiverName', '받으시는 분의 이름을 입력해주세요.');
      if (!receiverZipCode) addError('receiverZipCode', 'receiverZipCode', '배송지 주소를 입력해주세요.');
      if (!receiverPhone1 || !receiverPhone2 || !receiverPhone3) addError('receiverPhone', 'receiverPhone', '받으시는 분의 휴대전화 번호를 모두 입력해주세요.');
    }

    if (!privacyConsent) addError('privacyConsent', 'privacyConsent', '개인정보 수집 및 이용에 동의해주세요.');

    if (!depositorName.trim()) addError('depositorName', 'depositorName', '입금자명을 입력해주세요.');

    if (cashReceiptApply) {
      if (personalType === 'PERSONAL') {
        if (!cashReceiptPhone1 || !cashReceiptPhone2 || !cashReceiptPhone3) addError('cashReceiptPhone', 'cashReceiptPhone', '현금영수증 발급용 휴대전화 번호를 입력해주세요.');
      } else {
        if (!businessNumber1 || !businessNumber2 || !businessNumber3) addError('businessNumber', 'businessNumber', '사업자등록번호를 입력해주세요.');
      }
    }

    setErrors(newErrors);
    setErrorKey(prev => prev + 1);

    if (firstErrorId) {
      return { id: firstErrorId, msg: '필수 입력 항목을 모두 작성해주세요.' };
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!orderData) return;

    const error = validateAndScroll();
    if (error) {
      setSubmitError(error.msg);
      const el = document.getElementById(error.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }
    setSubmitError('');

    const finalReceiverName = shippingType === 'same' ? ordererName : receiverName;
    const finalReceiverPhone = shippingType === 'same'
      ? `${ordererPhone1}-${ordererPhone2}-${ordererPhone3}`
      : `${receiverPhone1}-${receiverPhone2}-${receiverPhone3}`;
    const finalReceiverZipCode = shippingType === 'same' ? ordererZipCode : receiverZipCode;
    const finalReceiverAddress = shippingType === 'same' ? ordererAddress : receiverAddress;
    const finalReceiverAddressDetail = shippingType === 'same' ? ordererAddressDetail : receiverAddressDetail;

    setSubmitting(true);

    try {
      const body = {
        ordererName,
        ordererPhone: `${ordererPhone1}-${ordererPhone2}-${ordererPhone3}`,
        ordererZipCode,
        ordererAddress,
        ordererAddressDetail,
        orderPassword,
        receiverName: finalReceiverName,
        receiverPhone: finalReceiverPhone,
        receiverZipCode: finalReceiverZipCode,
        receiverAddress: finalReceiverAddress,
        receiverAddressDetail: finalReceiverAddressDetail,
        shippingMemo: shippingMemo || null,
        totalAmount: orderData.totalAmount,
        depositorName: depositorName || null,
        privacyConsent,
        cashReceiptType: cashReceiptApply ? personalType : 'NONE',
        cashReceiptPhone: cashReceiptApply && personalType === 'PERSONAL'
          ? `${cashReceiptPhone1}-${cashReceiptPhone2}-${cashReceiptPhone3}`
          : null,
        businessNumber: cashReceiptApply && personalType === 'BUSINESS'
          ? `${businessNumber1}-${businessNumber2}-${businessNumber3}`
          : null,
        dealEventId: orderData.dealEventId,
        partnerId: orderData.partnerId,
        items: orderData.items,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Order failed');

      const order = await res.json();

      // Store order result for complete page
      sessionStorage.setItem('orderResult', JSON.stringify({
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        depositorName: depositorName,
        settings: orderData.settings,
      }));

      sessionStorage.removeItem('orderData');
      router.push('/order/complete');
    } catch (err) {
      console.error('Order error:', err);
      alert('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderData) return null;

  const bankInfo = orderData.settings?.bank_info || '하나은행 371-910035-71704 주식회사 태평프레시';

  return (
    <div className="order-page">
      <h1 className="order-page-title">주문/배송정보 페이지</h1>

      {/* 1. 주문자 정보 */}
      <div className="form-section">
        <h2 className="form-section-title">
          <span className="section-icon">1</span>
          주문자 정보
        </h2>

        <div className="form-row" style={{ alignItems: 'flex-start' }}>
          <label className="form-label" style={{ paddingTop: '18px' }}>주문하시는 분<span className="required">*</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              id="ordererName"
              className="form-input md"
              type="text"
              value={ordererName}
              onChange={(e) => setOrdererName(e.target.value)}
              placeholder="이름"
            />
            {renderError('ordererName')}
          </div>
        </div>

        <div className="form-row" style={{ alignItems: 'flex-start' }}>
          <label className="form-label" style={{ paddingTop: '18px' }}>주소<span className="required">*</span></label>
          <div className="form-address-group">
            <div className="form-address-row">
              <input
                id="ordererZipCode"
                className="form-input sm"
                type="text"
                value={ordererZipCode}
                readOnly
                placeholder="우편번호"
              />
              <button className="btn-zip-search" onClick={() => openAddressSearch('orderer')}>
                우편번호
              </button>
            </div>
            <input
              className="form-input"
              type="text"
              value={ordererAddress}
              readOnly
              placeholder="기본주소"
            />
            <input
              className="form-input"
              type="text"
              value={ordererAddressDetail}
              onChange={(e) => setOrdererAddressDetail(e.target.value)}
              placeholder="나머지 주소"
            />
            {renderError('ordererZipCode')}
          </div>
        </div>

        <div className="form-row" style={{ alignItems: 'flex-start' }}>
          <label className="form-label" style={{ paddingTop: '18px' }}>휴대전화<span className="required">*</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="form-phone-group" id="ordererPhone">
              <input
                className="form-input sm"
                type="text"
                maxLength={3}
                value={ordererPhone1}
                onChange={(e) => setOrdererPhone1(e.target.value.replace(/\D/g, ''))}
              />
              <span className="separator">-</span>
              <input
                className="form-input sm"
                type="text"
                maxLength={4}
                value={ordererPhone2}
                onChange={(e) => setOrdererPhone2(e.target.value.replace(/\D/g, ''))}
              />
              <span className="separator">-</span>
              <input
                className="form-input sm"
                type="text"
                maxLength={4}
                value={ordererPhone3}
                onChange={(e) => setOrdererPhone3(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            {renderError('ordererPhone')}
          </div>
        </div>

        <div className="form-row" style={{ alignItems: 'flex-start' }}>
          <label className="form-label" style={{ paddingTop: '18px' }}>주문조회 비밀번호<span className="required">*</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              id="orderPassword"
              className="form-input md"
              type="password"
              maxLength={10}
              value={orderPassword}
              onChange={(e) => setOrderPassword(e.target.value)}
              placeholder="주문조회 시 필요합니다. 4자리 이상의 숫자를 기재해주세요"
            />
            {renderError('orderPassword')}
            
            <input
              id="orderPasswordConfirm"
              className="form-input md"
              type="password"
              maxLength={10}
              value={orderPasswordConfirm}
              onChange={(e) => setOrderPasswordConfirm(e.target.value)}
              placeholder="주문조회 비밀번호 재입력"
            />
            {renderError('orderPasswordConfirm')}
          </div>
        </div>
      </div>

      {/* 2. 배송 정보 */}
      <div className="form-section">
        <h2 className="form-section-title">
          <span className="section-icon">2</span>
          배송 정보
        </h2>

        <div className="form-row">
          <label className="form-label">배송지 선택</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="shippingType"
                checked={shippingType === 'same'}
                onChange={() => setShippingType('same')}
              />
              주문자 정보와 동일
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="shippingType"
                checked={shippingType === 'new'}
                onChange={() => setShippingType('new')}
              />
              새로운 배송지
            </label>
          </div>
        </div>

        {shippingType === 'new' && (
          <>
            <div className="form-row" style={{ alignItems: 'flex-start' }}>
              <label className="form-label" style={{ paddingTop: '18px' }}>받으시는 분<span className="required">*</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  id="receiverName"
                  className="form-input"
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                />
                {renderError('receiverName')}
              </div>
            </div>
            <div className="form-row" style={{ alignItems: 'flex-start' }}>
              <label className="form-label" style={{ paddingTop: '18px' }}>주소<span className="required">*</span></label>
              <div className="form-address-group">
                <div className="form-address-row">
                  <input id="receiverZipCode" className="form-input sm" type="text" value={receiverZipCode} readOnly placeholder="우편번호" />
                  <button className="btn-zip-search" onClick={() => openAddressSearch('receiver')}>우편번호</button>
                </div>
                <input className="form-input" type="text" value={receiverAddress} readOnly placeholder="기본주소" />
                <input
                  className="form-input"
                  type="text"
                  value={receiverAddressDetail}
                  onChange={(e) => setReceiverAddressDetail(e.target.value)}
                  placeholder="나머지 주소"
                />
                {renderError('receiverZipCode')}
              </div>
            </div>
            <div className="form-row" style={{ alignItems: 'flex-start' }}>
              <label className="form-label" style={{ paddingTop: '18px' }}>휴대전화<span className="required">*</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="form-phone-group" id="receiverPhone">
                  <input className="form-input sm" type="text" maxLength={3} value={receiverPhone1} onChange={(e) => setReceiverPhone1(e.target.value.replace(/\D/g, ''))} />
                  <span className="separator">-</span>
                  <input className="form-input sm" type="text" maxLength={4} value={receiverPhone2} onChange={(e) => setReceiverPhone2(e.target.value.replace(/\D/g, ''))} />
                  <span className="separator">-</span>
                  <input className="form-input sm" type="text" maxLength={4} value={receiverPhone3} onChange={(e) => setReceiverPhone3(e.target.value.replace(/\D/g, ''))} />
                </div>
                {renderError('receiverPhone')}
              </div>
            </div>
          </>
        )}

        <div className="form-row" style={{ alignItems: 'flex-start' }}>
          <label className="form-label" style={{ paddingTop: '18px' }}>배송메세지</label>
          <input
            className="form-input"
            type="text"
            value={shippingMemo}
            onChange={(e) => setShippingMemo(e.target.value)}
            placeholder="배송 시 요청사항"
          />
        </div>
      </div>

      {/* 3. 개인정보 수집 및 이용 동의 */}
      <div className="form-section">
        <h2 className="form-section-title">
          <span className="section-icon">3</span>
          개인정보 수집 및 이용 동의
        </h2>

        <table className="privacy-table">
          <thead>
            <tr>
              <th>목적</th>
              <th>이름, 주소, 휴대전화 번호</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>수집 및 이용 목적</td>
              <td>이름, 주소, 휴대전화의 번호</td>
            </tr>
            <tr>
              <td>수집 및 이용 목적</td>
              <td>상품 주문 확인 및 배송</td>
            </tr>
            <tr>
              <td>보유 및 이용기간</td>
              <td><span className="highlight">상품 배송 후 1개월</span></td>
            </tr>
          </tbody>
        </table>

        <label className="checkbox-option">
          <input
            id="privacyConsent"
            type="checkbox"
            checked={privacyConsent}
            onChange={(e) => setPrivacyConsent(e.target.checked)}
          />
          개인정보 수집 및 이용에 동의합니다. <span className="required">*</span>
        </label>
        <div style={{ textAlign: 'center' }}>
          {renderError('privacyConsent')}
        </div>
      </div>

      {/* 4. 결제 정보 */}
      <div className="form-section">
        <h2 className="form-section-title">
          <span className="section-icon">4</span>
          결제 정보
        </h2>

        <div className="payment-info-row">
          <span className="payment-label">결제 예정 금액</span>
          <span className="payment-value amount">KRW {orderData.totalAmount.toLocaleString()}</span>
        </div>

        <div className="payment-info-row">
          <span className="payment-label">결제방법</span>
          <span className="payment-value">무통장 입금</span>
        </div>

        <div className="payment-info-row" style={{ alignItems: 'flex-start' }}>
          <span className="payment-label" style={{ paddingTop: '18px' }}>입금자명<span className="required">*</span></span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              id="depositorName"
              className="form-input md"
              type="text"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="입금자명"
            />
            {renderError('depositorName')}
          </div>
        </div>

        <div className="payment-info-row">
          <span className="payment-label">입금은행</span>
          <div className="payment-value" style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-700)', marginBottom: '4px' }}>
              하나은행 371-910035-71704
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--slate-600)', fontWeight: '600' }}>
              예금주: 주식회사 태평프레시
            </div>
          </div>
        </div>

        <div className="payment-info-row">
          <span className="payment-label">현금영수증</span>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="cashReceipt"
                checked={!cashReceiptApply}
                onChange={() => setCashReceiptApply(false)}
              />
              미신청
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="cashReceipt"
                checked={cashReceiptApply}
                onChange={() => setCashReceiptApply(true)}
              />
              신청하기
            </label>
          </div>
        </div>

        {cashReceiptApply && (
          <>
            <div className="payment-info-row">
              <span className="payment-label">구분<span className="required">*</span></span>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="receiptType"
                    checked={personalType === 'PERSONAL'}
                    onChange={() => setPersonalType('PERSONAL')}
                  />
                  개인
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="receiptType"
                    checked={personalType === 'BUSINESS'}
                    onChange={() => setPersonalType('BUSINESS')}
                  />
                  사업자
                </label>
              </div>
            </div>

            {personalType === 'PERSONAL' && (
              <div className="payment-info-row" style={{ alignItems: 'flex-start' }}>
                <span className="payment-label" style={{ paddingTop: '18px' }}>휴대전화<span className="required">*</span></span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="form-phone-group" id="cashReceiptPhone">
                    <input className="form-input sm" type="text" maxLength={3} value={cashReceiptPhone1} onChange={(e) => setCashReceiptPhone1(e.target.value.replace(/\D/g, ''))} />
                    <span className="separator">-</span>
                    <input className="form-input sm" type="text" maxLength={4} value={cashReceiptPhone2} onChange={(e) => setCashReceiptPhone2(e.target.value.replace(/\D/g, ''))} />
                    <span className="separator">-</span>
                    <input className="form-input sm" type="text" maxLength={4} value={cashReceiptPhone3} onChange={(e) => setCashReceiptPhone3(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  {renderError('cashReceiptPhone')}
                </div>
              </div>
            )}

            {personalType === 'BUSINESS' && (
              <div className="payment-info-row" style={{ alignItems: 'flex-start' }}>
                <span className="payment-label" style={{ paddingTop: '18px' }}>사업자번호<span className="required">*</span></span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="form-phone-group" id="businessNumber">
                    <input className="form-input sm" type="text" maxLength={3} value={businessNumber1} onChange={(e) => setBusinessNumber1(e.target.value.replace(/\D/g, ''))} />
                    <span className="separator">-</span>
                    <input className="form-input sm" type="text" maxLength={2} value={businessNumber2} onChange={(e) => setBusinessNumber2(e.target.value.replace(/\D/g, ''))} />
                    <span className="separator">-</span>
                    <input className="form-input sm" type="text" maxLength={5} value={businessNumber3} onChange={(e) => setBusinessNumber3(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  {renderError('businessNumber')}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {submitError && (
        <div key={`submit-${errorKey}`} style={{
          padding: '16px',
          background: 'var(--accent-light)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent-dark)',
          fontWeight: '700',
          textAlign: 'center',
          marginTop: 'var(--space-6)',
          animation: 'hideAfterDelay 1.5s forwards'
        }}>
          ⚠️ {submitError}
        </div>
      )}

      {/* Submit Button */}
      <button
        className="btn-submit-order"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="loading-spinner" /> 주문 처리 중...
          </span>
        ) : (
          '결제하기'
        )}
      </button>
    </div>
  );
}
