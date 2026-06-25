'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ChevronLeft, Image as ImageIcon, Plus, Trash2, Edit2, X } from 'lucide-react';
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      handleUpdatePartnerInfo('bannerImage', data.url);
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
          <h3 style={{ margin: 0 }}>기본 설정 (로고/배너)</h3>
          <button className="btn btn-primary" onClick={handleSaveInfo} disabled={saving}><Save size={14} /> 저장</button>
        </div>

        <div className="admin-form-row">
          <label className="admin-form-label">로고 텍스트</label>
          <input className="admin-form-input" value={partner.logoText || ''} onChange={e => handleUpdatePartnerInfo('logoText', e.target.value)} placeholder="예: 삼성전자특가몰" />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">로고 서브텍스트</label>
          <input className="admin-form-input" value={partner.logoSubtext || ''} onChange={e => handleUpdatePartnerInfo('logoSubtext', e.target.value)} placeholder="예: 임직원 전용" />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">파트너몰 접속 암호(Access Code)</label>
          <input className="admin-form-input" value={partner.accessCode || ''} onChange={e => handleUpdatePartnerInfo('accessCode', e.target.value)} placeholder="비워둘 시 누구나 접속 가능 (예: samsung123)" />
          <p className="form-hint" style={{ marginTop: 4 }}>
            암호를 설정하면, 파트너몰 접속 시 해당 암호를 입력해야만 상품을 볼 수 있습니다.
          </p>
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">파트너몰 접속 유지 기간</label>
          <select className="admin-form-select" value={partner.accessDuration ?? 30} onChange={e => handleUpdatePartnerInfo('accessDuration', parseInt(e.target.value))}>
            <option value={0}>브라우저 종료 시 만료 (보안 높음)</option>
            <option value={1}>1일</option>
            <option value={7}>7일</option>
            <option value={30}>30일 (기본)</option>
            <option value={365}>365일 (1년)</option>
          </select>
          <p className="form-hint" style={{ marginTop: 4 }}>
            한 번 암호를 입력한 후 얼마 동안 접속 상태를 유지할지 설정합니다.
          </p>
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">메인 배너 이미지</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {partner.bannerImage && (
              <img src={partner.bannerImage} alt="배너" style={{ height: 100, border: '1px solid var(--border)' }} />
            )}
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <ImageIcon size={14} /> 업로드
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
            {partner.bannerImage && (
              <button className="btn btn-secondary" onClick={() => handleUpdatePartnerInfo('bannerImage', null)}>삭제</button>
            )}
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
          <div className="modal" style={{ maxWidth: 600, width: '90%' }} onClick={(e) => e.stopPropagation()}>
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
                  <th>파트너 단가 (Override)</th>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <input
                            type="number"
                            className="admin-form-input"
                            style={{ width: 120, padding: '4px 8px' }}
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
                                newTemp.options[optIndex].customDiscountRate = calculatedDiscount;
                              } else {
                                newTemp.options.push({ productOptionId: opt.id, customSalePrice: val, customDiscountRate: calculatedDiscount });
                              }
                              
                              // Remove if empty
                              newTemp.options = newTemp.options.filter((o:any) => o.customSalePrice !== '');
                              setTempOverride(newTemp);
                            }}
                            placeholder="할인가 입력"
                          /> 원
                          {currentOvOpt?.customDiscountRate > 0 && (
                            <span style={{ color: '#e11d48', fontWeight: 'bold', fontSize: '0.85rem' }}>
                              ({currentOvOpt.customDiscountRate}% 할인)
                            </span>
                          )}
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
      <div className="modal" style={{ maxWidth: 500, width: '90%' }} onClick={(e) => e.stopPropagation()}>
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
