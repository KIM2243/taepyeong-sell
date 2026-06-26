'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ChevronLeft, Image as ImageIcon, Plus, Trash2, Edit2, X, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function AdminPartnerDetailPage({ params }: { params: { id: string } }) {
  const [partner, setPartner] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // overrides = [ { productId, customName, isHidden, options: [ { productOptionId, customSalePrice } ] } ]
  const [overrides, setOverrides] = useState<any[]>([]);

  // Modal for adding products
  const [showProductModal, setShowProductModal] = useState(false);

  // Modal for editing options of a product
  const [editingOverride, setEditingOverride] = useState<any>(null);
  const [tempOverride, setTempOverride] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [partnerRes, productsRes] = await Promise.all([
        fetch(`/api/partners/${params.id}`),
        fetch('/api/products?all=true')
      ]);
      const pData = await partnerRes.json();
      const prData = await productsRes.json();
      
      setPartner(pData);
      setAllProducts(prData);

      // Initialize overrides state
      if (pData.overrides) {
        setOverrides(pData.overrides.map((ov: any) => ({
          productId: ov.productId,
          customName: ov.customName || '',
          isHidden: ov.isHidden,
          options: ov.optionOverrides.map((oo: any) => ({
            productOptionId: oo.productOptionId,
            customSalePrice: oo.customSalePrice || '',
            customDiscountRate: oo.customDiscountRate || 0
          }))
        })));
      }
    } catch (e) {
      console.error(e);
      alert('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePartnerInfo = async (field: string, value: any) => {
    setPartner((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      await fetch(`/api/partners/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partner)
      });
      alert('기본 정보가 저장되었습니다.');
    } catch {
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOverrides = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/partners/${params.id}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: overrides.map(ov => ({
            ...ov,
            options: ov.options.map((o: any) => ({
              ...o,
              customSalePrice: o.customSalePrice ? parseInt(o.customSalePrice) : null,
              customDiscountRate: o.customDiscountRate !== null && o.customDiscountRate !== undefined ? parseInt(o.customDiscountRate) : null
            }))
          }))
        })
      });
      if (!res.ok) throw new Error();
      alert('상품 단가/설정이 저장되었습니다.');
      loadData();
    } catch {
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      handleUpdatePartnerInfo(fieldName, data.url);
    } catch {
      alert('업로드 실패');
    }
  };

  const handleAddProducts = (productIds: string[]) => {
    const newOverrides = [...overrides];
    productIds.forEach(id => {
      if (!newOverrides.find(o => o.productId === id)) {
        newOverrides.push({
          productId: id,
          customName: '',
          isHidden: false,
          options: [] // To be filled when editing
        });
      }
    });
    setOverrides(newOverrides);
    setShowProductModal(false);
  };

  if (loading) return <div style={{ padding: 40 }}>로딩중...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => router.push('/admin/partners')}><ChevronLeft size={16} /></button>
          <h1 className="admin-page-title">{partner.name} 관리</h1>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href={`/p/${partner.slug}`} target="_blank" rel="noreferrer" className="btn btn-secondary">접속 링크 열기</a>
        </div>
      </div>

      <div className="admin-form-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>UI 커스텀 및 기본 설정</h3>
          <button className="btn btn-primary" onClick={handleSaveInfo} disabled={saving}><Save size={14} /> 저장</button>
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          {/* Left: Input Form */}
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 구역 A */}
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--slate-50)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--slate-700)' }}>[영역 A] 좌측 상단 로고 (GNB)</h4>
              
              <div className="admin-form-row" style={{ marginBottom: '12px' }}>
                <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>로고 이미지 (기본 'P' 아이콘 대체)</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {partner.logoImageUrl && (
                    <img src={partner.logoImageUrl} alt="로고" style={{ height: 40, border: '1px solid var(--border)', borderRadius: '4px' }} />
                  )}
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '4px 8px', fontSize: '0.8rem' }}>
                    <ImageIcon size={12} /> 업로드
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'logoImageUrl')} />
                  </label>
                  {partner.logoImageUrl && (
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleUpdatePartnerInfo('logoImageUrl', null)}>삭제</button>
                  )}
                </div>
              </div>

              <div className="admin-form-row" style={{ marginBottom: '12px' }}>
                <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>로고 텍스트 (예: 태평프레시 CJ ENM)</label>
                <input className="admin-form-input" value={partner.logoText || ''} onChange={e => handleUpdatePartnerInfo('logoText', e.target.value)} placeholder="미입력 시 파트너명 사용" />
              </div>
              
              <div className="admin-form-row" style={{ marginBottom: 0 }}>
                <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>로고 서브텍스트 (예: 임직원 전용)</label>
                <input className="admin-form-input" value={partner.logoSubtext || ''} onChange={e => handleUpdatePartnerInfo('logoSubtext', e.target.value)} placeholder="미입력 시 '전용몰' 사용" />
              </div>
            </div>

            {/* 구역 B */}
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--slate-50)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--slate-700)' }}>[영역 B] 메인 배너</h4>

              <div className="admin-form-row" style={{ marginBottom: '12px' }}>
                <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>배너 이미지 (통이미지 사용 시)</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {partner.bannerImage && (
                    <img src={partner.bannerImage} alt="배너" style={{ height: 60, border: '1px solid var(--border)' }} />
                  )}
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '4px 8px', fontSize: '0.8rem' }}>
                    <ImageIcon size={12} /> 업로드
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'bannerImage')} />
                  </label>
                  {partner.bannerImage && (
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleUpdatePartnerInfo('bannerImage', null)}>삭제</button>
                  )}
                </div>
              </div>

              <div className="admin-form-row" style={{ marginBottom: '12px' }}>
                <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>배너 메인 타이틀</label>
                <input className="admin-form-input" value={partner.bannerTitle || ''} onChange={e => handleUpdatePartnerInfo('bannerTitle', e.target.value)} placeholder="미입력 시 파트너명 사용" />
              </div>

              <div className="admin-form-row" style={{ marginBottom: 0 }}>
                <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>배너 서브 타이틀</label>
                <input className="admin-form-input" value={partner.bannerSubtitle || ''} onChange={e => handleUpdatePartnerInfo('bannerSubtitle', e.target.value)} placeholder="미입력 시 기본 문구 사용" />
              </div>
            </div>

            {/* 구역 C */}
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--slate-50)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--slate-700)' }}>[영역 C] 주문서(장바구니) 영역</h4>
              
              <div className="admin-form-row" style={{ marginBottom: 0 }}>
                <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>상단 타이틀 (예: CJ ENM)</label>
                <input className="admin-form-input" value={partner.cartTitle || ''} onChange={e => handleUpdatePartnerInfo('cartTitle', e.target.value)} placeholder="미입력 시 파트너명 사용" />
              </div>
            </div>

            {/* 기타 설정 */}
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--slate-700)' }}>기타 접속 설정</h4>
              <div className="admin-form-row" style={{ marginBottom: '12px' }}>
                <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>접속 암호(Access Code)</label>
                <input className="admin-form-input" value={partner.accessCode || ''} onChange={e => handleUpdatePartnerInfo('accessCode', e.target.value)} placeholder="비워둘 시 누구나 접속 가능" />
              </div>
              <div className="admin-form-row" style={{ marginBottom: 0 }}>
                <label className="admin-form-label" style={{ fontSize: '0.8rem' }}>접속 유지 기간</label>
                <select className="admin-form-select" value={partner.accessDuration ?? 30} onChange={e => handleUpdatePartnerInfo('accessDuration', parseInt(e.target.value))}>
                  <option value={0}>브라우저 종료 시 만료</option>
                  <option value={1}>1일</option>
                  <option value={7}>7일</option>
                  <option value={30}>30일 (기본)</option>
                  <option value={365}>365일 (1년)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Right: Live Preview Panel */}
          <div style={{ flex: '1.2', border: '2px solid var(--primary)', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', position: 'sticky', top: '24px' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>Live Preview</span>
              <span style={{ fontWeight: 'normal', fontSize: '0.8rem', opacity: 0.8 }}>실제 반영 화면 미리보기</span>
            </div>
            
            <div style={{ padding: '16px' }}>
              {/* Fake Browser Window */}
              <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                
                {/* [영역 A] GNB */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {partner.logoImageUrl ? (
                      <img src={partner.logoImageUrl} alt="logo" style={{ width: 24, height: 24, borderRadius: '4px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: 24, height: 24, borderRadius: '4px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>P</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--slate-800)' }}>{partner.logoText || partner.name || '태평프레시'}</span>
                      <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{partner.logoSubtext || '전용몰'}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 12, height: 12, border: '1px solid currentColor', borderRadius: '50%' }}></span> 배송조회
                  </div>
                </div>

                {/* Content Area */}
                <div style={{ display: 'flex', background: '#f8fafc', padding: '20px', gap: '20px', minHeight: '300px' }}>
                  
                  {/* Left Column (Banner + Products) */}
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* [영역 B] Banner */}
                    <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(135deg, #2c3e50, #3498db)', display: 'flex', alignItems: 'center', padding: '0 30px' }}>
                      {partner.bannerImage ? (
                        <img src={partner.bannerImage} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                      ) : (
                        <div style={{ zIndex: 1, color: 'white' }}>
                          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{partner.bannerTitle || partner.name || '파트너명'}</h1>
                          <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>{partner.bannerSubtitle || '임직원 및 회원 전용 특별 할인 혜택'}</p>
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 12, left: 12, background: '#1e293b', color: '#f59e0b', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', zIndex: 2 }}>PARTNER ONLY</div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: 'var(--slate-800)' }}>전용 특가 상품</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: 'white', borderRadius: '8px', height: '100px', border: '1px solid #e2e8f0', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                           <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '4px' }}></div>
                           <div style={{ width: '60%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                        </div>
                        <div style={{ background: 'white', borderRadius: '8px', height: '100px', border: '1px solid #e2e8f0', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                           <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '4px' }}></div>
                           <div style={{ width: '60%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Cart Panel) */}
                  <div style={{ flex: 1 }}>
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      {/* [영역 C] Cart Title */}
                      <div style={{ background: 'var(--primary)', padding: '12px', color: 'white' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', marginBottom: '8px' }}>
                          {partner.cartTitle || partner.name || '파트너명'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>상품을 선택해주세요</div>
                      </div>
                      
                      <div style={{ padding: '30px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--slate-400)', gap: '8px' }}>
                        <ShoppingCart size={24} />
                        <span style={{ fontSize: '10px' }}>왼쪽에서 상품을 클릭하세요</span>
                      </div>

                      <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '12px', fontWeight: 'bold', color: 'var(--slate-600)' }}>
                          <span>결제 예정 금액</span>
                          <span style={{ color: 'var(--primary)', fontSize: '14px' }}>0원</span>
                        </div>
                        <button style={{ width: '100%', background: '#e11d48', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>결제하기</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>파트너 전용 상품 및 단가 설정</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            <button className="btn btn-secondary" onClick={() => setShowProductModal(true)}><Plus size={14} /> 상품 추가</button>
            <button className="btn btn-primary" onClick={handleSaveOverrides} disabled={saving}><Save size={14} /> 단가 저장</button>
          </div>
        </div>
        
        <p className="form-hint" style={{ marginBottom: 16 }}>
          이 파트너몰에 노출될 상품을 추가하고, 기존 글로벌 단가 대신 **파트너 전용 단가(덮어쓰기)**를 설정하세요.
        </p>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>원본 상품명</th>
                <th>파트너 전용 상품명 (옵션)</th>
                <th>글로벌 판매가</th>
                <th>설정된 단가 (옵션 수)</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {overrides.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>설정된 상품이 없습니다.</td>
                </tr>
              ) : (
                overrides.map((ov, idx) => {
                  const product = allProducts.find(p => p.id === ov.productId);
                  if (!product) return null;
                  const defaultOpt = product.options?.find((o:any) => o.isDefault) || product.options?.[0];
                  
                  return (
                    <tr key={idx}>
                      <td>{product.name}</td>
                      <td>
                        <input className="admin-form-input" style={{ width: '100%', padding: '4px 8px' }} value={ov.customName} onChange={(e) => {
                          const newOv = [...overrides];
                          newOv[idx].customName = e.target.value;
                          setOverrides(newOv);
                        }} placeholder="비워둘 시 원본 사용" />
                      </td>
                      <td>{defaultOpt?.salePrice?.toLocaleString()}원</td>
                      <td>
                        {ov.options.length > 0 ? <span style={{color:'var(--primary)'}}>{ov.options.length}개 옵션 단가 변경됨</span> : <span style={{color:'var(--slate-400)'}}>변경 없음 (원본 단가)</span>}
                      </td>
                      <td>
                        <select className="admin-form-select" style={{ padding: '4px 8px' }} value={ov.isHidden ? '1' : '0'} onChange={(e) => {
                          const newOv = [...overrides];
                          newOv[idx].isHidden = e.target.value === '1';
                          setOverrides(newOv);
                        }}>
                          <option value="0">노출</option>
                          <option value="1">숨김</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
                          <button className="action-btn" onClick={() => { setEditingOverride(ov); setTempOverride(JSON.parse(JSON.stringify(ov))); }}><Edit2 size={14} /> 단가 설정</button>
                          <button className="action-btn delete" onClick={() => setOverrides(overrides.filter((_, i) => i !== idx))}><Trash2 size={14} color="#ef4444" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Option Override Modal */}
      {editingOverride && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 600, width: '90%', background: '#ffffff', padding: '24px', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--slate-200)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>단가 설정 (옵션별)</h3>
              <button onClick={() => { setEditingOverride(null); setTempOverride(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
                <X size={24} />
              </button>
            </div>
            <p className="form-hint" style={{ marginBottom: 16 }}>비워둘 경우 글로벌 단가가 적용됩니다.</p>
            
            <table className="admin-table">
              <thead>
                <tr>
                  <th>옵션명</th>
                  <th>글로벌 단가</th>
                  <th style={{ textAlign: 'center' }}>파트너 단가 (Override)</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.find(p => p.id === tempOverride?.productId)?.options?.map((opt: any) => {
                  const currentOvOpt = tempOverride.options.find((o:any) => o.productOptionId === opt.id);
                  const priceVal = currentOvOpt?.customSalePrice || '';

                  return (
                    <tr key={opt.id}>
                      <td>{opt.name} {opt.isDefault && '(기본)'}</td>
                      <td>{opt.originalPrice.toLocaleString()}원</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            className="admin-form-input"
                            style={{ width: 110, padding: '4px 8px', textAlign: 'right' }}
                            value={priceVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newTemp = { ...tempOverride, options: [...tempOverride.options] };
                              
                              const optIndex = newTemp.options.findIndex((o:any) => o.productOptionId === opt.id);
                              
                              let calculatedDiscount = 0;
                              if (val && !isNaN(Number(val)) && opt.originalPrice > 0) {
                                calculatedDiscount = Math.max(0, Math.round((1 - Number(val) / opt.originalPrice) * 100));
                              }

                              if (optIndex >= 0) {
                                newTemp.options[optIndex].customSalePrice = val;
                                newTemp.options[optIndex].customDiscountRate = val ? calculatedDiscount : 0;
                              } else if (val) {
                                newTemp.options.push({ productOptionId: opt.id, customSalePrice: val, customDiscountRate: calculatedDiscount });
                              }
                              
                              if (!val) {
                                newTemp.options = newTemp.options.filter((o:any) => o.productOptionId !== opt.id);
                              } else {
                                newTemp.options = newTemp.options.filter((o:any) => o.customSalePrice !== '');
                              }
                              setTempOverride(newTemp);
                            }}
                            placeholder="할인가"
                          /> 
                          <span style={{ color: 'var(--slate-600)', fontSize: '0.9rem', flexShrink: 0 }}>원</span>
                          
                          <span style={{ color: '#e11d48', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px', flexShrink: 0 }}>
                            (
                            <input
                              type="number"
                              className="admin-form-input"
                              style={{ width: 50, padding: '2px 4px', textAlign: 'right', color: '#e11d48', fontWeight: 'bold', border: '1px solid #fda4af', height: '26px' }}
                              value={currentOvOpt?.customDiscountRate !== undefined && currentOvOpt?.customDiscountRate !== null ? currentOvOpt.customDiscountRate : ''}
                              onChange={(e) => {
                                const rateVal = e.target.value;
                                const newTemp = { ...tempOverride, options: [...tempOverride.options] };
                                const optIndex = newTemp.options.findIndex((o:any) => o.productOptionId === opt.id);
                                
                                let calculatedPrice = '';
                                if (rateVal && !isNaN(Number(rateVal)) && opt.originalPrice > 0) {
                                  const rate = Math.min(100, Math.max(0, Number(rateVal)));
                                  calculatedPrice = String(Math.round(opt.originalPrice * (1 - rate / 100)));
                                }

                                if (optIndex >= 0) {
                                  newTemp.options[optIndex].customDiscountRate = rateVal;
                                  if (calculatedPrice) {
                                    newTemp.options[optIndex].customSalePrice = calculatedPrice;
                                  }
                                } else if (rateVal) {
                                  newTemp.options.push({ productOptionId: opt.id, customSalePrice: calculatedPrice, customDiscountRate: rateVal });
                                }
                                
                                if (!rateVal && !calculatedPrice) {
                                  newTemp.options = newTemp.options.filter((o:any) => o.productOptionId !== opt.id);
                                }
                                setTempOverride(newTemp);
                              }}
                              placeholder="0"
                            />
                            % 할인)
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white' }} onClick={() => { setEditingOverride(null); setTempOverride(null); }}>닫기</button>
              <button className="btn btn-primary" onClick={() => {
                const newOv = [...overrides];
                const ovIndex = newOv.findIndex(o => o.productId === tempOverride.productId);
                if (ovIndex >= 0) newOv[ovIndex] = tempOverride;
                setOverrides(newOv);
                setEditingOverride(null);
                setTempOverride(null);
              }}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selector Modal */}
      {showProductModal && (
        <ProductSelectorModal
          allProducts={allProducts}
          alreadySelected={overrides.map(o => o.productId)}
          onClose={() => setShowProductModal(false)}
          onSelect={handleAddProducts}
        />
      )}
    </div>
  );
}

// Simple Product Selector Modal Component
function ProductSelectorModal({ allProducts, alreadySelected, onClose, onSelect }: any) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 500, width: '90%', background: '#ffffff', padding: '24px', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--slate-200)', paddingBottom: '16px', marginBottom: '24px' }}>
          <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>상품 추가</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
            <X size={24} />
          </button>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          {allProducts.filter((p:any) => !alreadySelected.includes(p.id)).map((p:any) => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--slate-100)' }}>
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={(e) => {
                  if (e.target.checked) setSelected([...selected, p.id]);
                  else setSelected(selected.filter(id => id !== p.id));
                }}
              />
              <span>{p.name}</span>
            </label>
          ))}
          {allProducts.filter((p:any) => !alreadySelected.includes(p.id)).length === 0 && (
            <div style={{ color: 'var(--slate-400)', textAlign: 'center', padding: 20 }}>추가할 상품이 없습니다.</div>
          )}
        </div>
        <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white' }} onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={() => onSelect(selected)}>선택 추가</button>
        </div>
      </div>
    </div>
  );
}
