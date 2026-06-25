'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Truck, Star, Tag, Plus, Minus, X } from 'lucide-react';

interface ProductOption {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  discountRate: number;
  stock: number;
  isDefault: boolean;
}

interface CartItem {
  product: any;
  selectedOption: ProductOption;
  quantity: number;
}

export default function PartnerStorefrontPage({ params }: { params: { slug: string } }) {
  const [partner, setPartner] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const [authRequired, setAuthRequired] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [params.slug]);

  const loadData = async () => {
    try {
      const [partnerRes, settingsRes] = await Promise.all([
        fetch(`/api/shop/partner/${params.slug}`),
        fetch('/api/settings')
      ]);

      if (!partnerRes.ok) {
        if (partnerRes.status === 404) {
          alert('존재하지 않거나 비활성화된 파트너몰입니다.');
          router.push('/');
          return;
        }
        throw new Error('Failed to load partner data');
      }
      const data = await partnerRes.json();
      
      if (data.authRequired) {
        setAuthRequired(true);
        setPartner(data.partner);
        return;
      }
      
      setPartner(data.partner);
      setProducts(data.products);
      setSettings(await settingsRes.json());
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = useCallback((product: any) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      const defaultOption = product?.options?.find((o: any) => o.isDefault) || product?.options?.[0];
      if (!defaultOption) return prev;
      return [...prev, { product, selectedOption: defaultOption, quantity: 1 }];
    });
  }, []);

  const handleOptionChange = useCallback((productId: string, option: ProductOption) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, selectedOption: option }
          : item
      )
    );
  }, []);

  const handleQuantityChange = useCallback((productId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      })
    );
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.selectedOption.salePrice * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    const orderData = {
      items: cartItems.map((item) => ({
        productId: item.product.id,
        productOptionId: item.selectedOption.id,
        productName: item.product.name,
        optionName: item.selectedOption.name,
        quantity: item.quantity,
        unitPrice: item.selectedOption.salePrice,
      })),
      totalAmount,
      partnerId: partner.id, // 파트너 ID 주입
      settings,
    };
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    router.push('/order');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!partner) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`/api/shop/partner/${params.slug}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || '인증에 실패했습니다.');
        return;
      }
      setLoading(true);
      setAuthRequired(false);
      loadData();
    } catch {
      setAuthError('인증 중 오류가 발생했습니다.');
    }
  };

  if (authRequired) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--slate-50)' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          {partner?.bannerImage ? (
            <img src={partner.bannerImage} alt="logo" style={{ maxHeight: 60, marginBottom: 24, objectFit: 'contain' }} />
          ) : (
            <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: 'var(--primary)' }}>
              {partner?.logoText || partner?.name} <span style={{ fontSize: 16, color: 'var(--slate-500)', fontWeight: 'normal' }}>{partner?.logoSubtext || '전용몰'}</span>
            </div>
          )}
          
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>접속 비밀번호를 입력해주세요</h2>
          <p style={{ fontSize: 14, color: 'var(--slate-500)', marginBottom: 24 }}>이 사이트는 지정된 임직원 및 관계자만 접속 가능합니다.</p>
          
          <form onSubmit={handleAuth}>
            <input
              type="password"
              placeholder="비밀번호"
              className="admin-form-input"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              style={{ width: '100%', marginBottom: 16, padding: '12px', fontSize: 16, textAlign: 'center' }}
            />
            {authError && <div style={{ color: 'var(--red-500)', fontSize: 14, marginBottom: 16 }}>{authError}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 16, justifyContent: 'center' }}>
              접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="top-header">
        <div className="top-header-inner">
          <div className="top-logo-group" onClick={() => router.push(`/p/${params.slug}`)} style={{ cursor: 'pointer' }}>
            <div className="top-logo-icon" style={{ backgroundColor: 'var(--primary)' }}>P</div>
            <span className="top-logo-text">{partner.logoText || partner.name} <span className="top-logo-sub">{partner.logoSubtext || '전용몰'}</span></span>
          </div>
          <button className="top-tracking-btn" onClick={() => router.push('/tracking')}>
            <Truck size={14} style={{ marginRight: 6 }} /> 배송조회
          </button>
        </div>
      </div>

      <div className="shop-layout">
        <div className="product-section">
          <div className="hero-banner-container">
            {partner.bannerImage ? (
              <img src={partner.bannerImage} alt={partner.name} className="hero-banner-img" />
            ) : (
              <div className="hero-banner-placeholder" style={{ background: 'linear-gradient(135deg, #2c3e50, #3498db)' }}>
                <div className="hero-banner-text">
                  <h1 className="hero-title">{partner.name}</h1>
                  <p className="hero-subtitle">임직원 및 회원 전용 특별 할인 혜택</p>
                </div>
              </div>
            )}
            <div className="hero-overlay-badge" style={{ backgroundColor: '#2c3e50' }}>PARTNER ONLY</div>
          </div>

          <h2 className="section-title" style={{ marginTop: 40 }}>전용 특가 상품</h2>
          
          <div className="product-grid">
            {products.length === 0 ? (
              <div style={{ padding: '40px 0', color: 'var(--slate-500)', gridColumn: '1 / -1', textAlign: 'center' }}>
                아직 등록된 전용 상품이 없습니다.
              </div>
            ) : (
              products.map((product) => {
                const isInCart = cartItems.some((item) => item.product.id === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isInCart={isInCart}
                    onClick={() => handleProductClick(product)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Order Panel */}
        <div className="order-panel">
          <div className="order-panel-header">
            <div className="deal-title">{partner.name}</div>
            <h2>
              {cartItems.length > 0
                ? `선택 상품 ${cartItems.length}종`
                : '상품을 선택해주세요'}
            </h2>
          </div>

          <div className="order-panel-body">
            {cartItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-icon">
                  <ShoppingCart size={40} strokeWidth={1} />
                </div>
                <p className="empty-text">왼쪽에서 상품을 클릭하여 추가해주세요</p>
              </div>
            ) : (
              <>
                {cartItems.map((item, index) => (
                  <div key={item.product.id}>
                    {/* Step label */}
                    <div className="option-group">
                      <div className="option-group-label">
                        <span className="step-num">{index + 1}</span>
                        {item.product.options.length > 1 ? '브랜드 선택 / 가격변경' : '선택 상품'}
                      </div>

                      {/* Option buttons */}
                      {item.product.options.length > 1 && (
                        <div className="option-buttons">
                          {item.product.options.map((opt: any) => (
                            <button
                              key={opt.id}
                              className={`option-btn ${
                                item.selectedOption.id === opt.id ? 'active' : ''
                              }`}
                              onClick={() => handleOptionChange(item.product.id, opt)}
                            >
                              {opt.discountRate > 0 && (
                                <span className="option-discount">{opt.discountRate}% 할인</span>
                              )}
                              <span>{opt.name.length > 12 ? opt.name.substring(0, 12) + '...' : opt.name}</span>
                              <span className="option-price">
                                {opt.originalPrice !== opt.salePrice && (
                                  <span className="original-price">KRW {opt.originalPrice.toLocaleString()}</span>
                                )}
                                <span className="sale-price">KRW {opt.salePrice.toLocaleString()}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cart item details */}
                    <div className="cart-item">
                      <div className="cart-item-name">
                        {item.product.name}
                        <span className="option-label">{item.selectedOption.name}</span>
                      </div>
                      <div className="qty-selector">
                        <button
                          className="qty-btn"
                          onClick={() => handleQuantityChange(item.product.id, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => handleQuantityChange(item.product.id, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="cart-item-price">
                        {(item.selectedOption.salePrice * item.quantity).toLocaleString()}원
                      </div>
                    </div>

                    {/* Remove button */}
                    <div style={{ textAlign: 'right', marginBottom: 'var(--space-4)' }}>
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--slate-400)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <X size={12} /> 삭제
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="order-panel-footer">
            <div className="order-total">
              <span className="order-total-label">결제 예정 금액</span>
              <span className="order-total-price">
                {totalAmount.toLocaleString()}원
              </span>
            </div>
            <button
              className="btn-checkout"
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
            >
              결제하기
            </button>
            <button
              className="btn-tracking"
              onClick={() => router.push('/tracking')}
            >
              <Truck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              배송조회하기
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{
        marginTop: '60px',
        padding: '40px 20px',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        color: '#94a3b8',
        fontSize: '0.8rem',
        textAlign: 'center',
        lineHeight: '1.6'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            상호 : (주)태평프레시 <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            사업자등록번호 : 865-86-03320 <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            대표 : 김종윤 <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            주소 : 서울특별시 중랑구 용마산로 419, 4층 401호
          </div>
          <div>
            TEL : 02-6954-7988 <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            FAX : 02-6958-7987 <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            Email : 365@tpfresh.com
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
            <span>© 2026 Taepyeong Fresh. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
}

// Product Card Component
function ProductCard({
  product,
  isInCart,
  onClick,
}: {
  product: any;
  isInCart: boolean;
  onClick: () => void;
}) {
  const defaultOption = product.options.find((o: any) => o.isDefault) || product.options[0];

  return (
    <div
      className={`product-card ${isInCart ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="product-card-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--slate-100), var(--slate-200))',
              fontSize: '2rem',
            }}
          >
            📦
          </div>
        )}
      </div>
      <div className="product-card-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
          <div className="product-card-name" style={{ margin: 0 }}>{product.name}</div>
          {defaultOption?.discountRate > 0 && (
            <div style={{ backgroundColor: '#e11d48', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', flexShrink: 0, marginTop: '2px' }}>
              {defaultOption.discountRate}%
            </div>
          )}
        </div>
        {defaultOption && (
          <div className="product-card-price" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {defaultOption.salePrice.toLocaleString()}원
            </span>
            {defaultOption.originalPrice !== defaultOption.salePrice && (
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textDecoration: 'line-through' }}>
                {defaultOption.originalPrice.toLocaleString()}원
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
