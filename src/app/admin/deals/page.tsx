'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
}

interface DealProduct {
  product: Product;
}

interface DealEvent {
  id: string;
  title: string;
  subtitle?: string;
  bannerImage?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  dealProducts: DealProduct[];
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealEvent[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DealEvent | null>(null);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dealsRes, productsRes] = await Promise.all([
        fetch('/api/deals'),
        fetch('/api/products?all=true'),
      ]);
      setDeals(await dealsRes.json());
      setAllProducts(await productsRes.json());
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormIsActive(true);
    setFormStartDate('');
    setFormEndDate('');
    setSelectedProductIds([]);
    setShowModal(true);
  };

  const openEdit = (deal: DealEvent) => {
    setEditing(deal);
    setFormTitle(deal.title);
    setFormSubtitle(deal.subtitle || '');
    setFormIsActive(deal.isActive);
    setFormStartDate(deal.startDate ? deal.startDate.split('T')[0] : '');
    setFormEndDate(deal.endDate ? deal.endDate.split('T')[0] : '');
    setSelectedProductIds(deal.dealProducts.map((dp) => dp.product.id));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return alert('타이틀을 입력해주세요.');

    const body = {
      id: editing?.id,
      title: formTitle,
      subtitle: formSubtitle || null,
      isActive: formIsActive,
      startDate: formStartDate || null,
      endDate: formEndDate || null,
      productIds: selectedProductIds,
    };

    try {
      const res = await fetch('/api/deals', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setShowModal(false);
      loadData();
    } catch {
      alert('저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/deals?id=${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">특가 이벤트 관리</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> 이벤트 추가
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>타이틀</th>
              <th>부제목</th>
              <th>상태</th>
              <th>상품 수</th>
              <th>기간</th>
              <th style={{ width: 100 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>
                  등록된 이벤트가 없습니다.
                </td>
              </tr>
            ) : (
              deals.map((deal) => (
                <tr key={deal.id}>
                  <td style={{ fontWeight: 600 }}>{deal.title}</td>
                  <td style={{ color: 'var(--slate-500)' }}>{deal.subtitle || '-'}</td>
                  <td>
                    <span className={`status-badge ${deal.isActive ? 'delivered' : 'cancelled'}`}>
                      {deal.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td>{deal.dealProducts.length}개</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    {deal.startDate ? new Date(deal.startDate).toLocaleDateString('ko-KR') : '-'}
                    {' ~ '}
                    {deal.endDate ? new Date(deal.endDate).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
                      <button className="action-btn" onClick={() => openEdit(deal)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(deal.id)}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Deal Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 800, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--slate-200)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{editing ? '이벤트 수정' : '이벤트 추가'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
              <div>
                <div className="admin-form-row">
                  <label className="admin-form-label">타이틀 * (예: (신한투자증권 임직원 특가) 화장지 2종)</label>
                  <input className="admin-form-input" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
                </div>

                <div className="admin-form-row">
                  <label className="admin-form-label">부제목</label>
                  <input className="admin-form-input" value={formSubtitle} onChange={(e) => setFormSubtitle(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ flex: 1 }}>
                    <label className="admin-form-label">시작일</label>
                    <input className="admin-form-input" type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="admin-form-label">종료일</label>
                    <input className="admin-form-input" type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
                  </div>
                </div>

                <label className="admin-form-toggle" style={{ marginBottom: 'var(--space-5)' }}>
                  <div className={`toggle-switch ${formIsActive ? 'active' : ''}`}
                    onClick={() => setFormIsActive(!formIsActive)} />
                  <span style={{ fontSize: '0.8125rem' }}>활성 상태</span>
                </label>
              </div>

              {/* Product selection */}
              <div>
                <label className="admin-form-label">연결 상품 ({selectedProductIds.length}개 선택)</label>
                <div
                  style={{
                    height: '240px',
                    overflowY: 'auto',
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2)',
                    background: '#fff'
                  }}
                >
                  {allProducts.map((p) => (
                    <label
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-2)',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        background: selectedProductIds.includes(p.id) ? 'var(--primary-50)' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        style={{ accentColor: 'var(--primary-600)' }}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                className="btn btn-primary" 
                style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white' }} 
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
