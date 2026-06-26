'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';

interface ProductOption {
  id?: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  discountRate: number;
  stock: number;
  isDefault: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  isBestSeller: boolean;
  isSale: boolean;
  isFreeShipping: boolean;
  order: number;
  categoryId: string;
  options: ProductOption[];
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  order: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product form
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formIsSale, setFormIsSale] = useState(false);
  const [formIsFreeShipping, setFormIsFreeShipping] = useState(false);
  const [formOrder, setFormOrder] = useState(0);
  const [formGlobalPrice, setFormGlobalPrice] = useState<number>(0);
  const [formOptionId, setFormOptionId] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, catsRes] = await Promise.all([
        fetch('/api/products?all=true'),
        fetch('/api/categories'),
      ]);
      const [productsData, catsData] = await Promise.all([
        productsRes.json(),
        catsRes.json(),
      ]);
      setProducts(productsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormImageUrl('');
    setFormCategoryId(categories[0]?.id || '');
    setFormIsActive(true);
    setFormIsBestSeller(false);
    setFormIsSale(false);
    setFormIsFreeShipping(false);
    setFormOrder(0);
    setFormGlobalPrice(0);
    setFormOptionId(undefined);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormImageUrl(product.imageUrl || '');
    setFormCategoryId(product.categoryId);
    setFormIsActive(product.isActive);
    setFormIsBestSeller(product.isBestSeller);
    setFormIsSale(product.isSale);
    setFormIsFreeShipping(product.isFreeShipping ?? false);
    setFormOrder(product.order);
    const defaultOpt = product.options?.find((o: any) => o.isDefault) || product.options?.[0];
    setFormGlobalPrice(defaultOpt?.originalPrice || 0);
    setFormOptionId(defaultOpt?.id);
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.url) {
        setFormImageUrl(data.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 옵션 관련 함수들(addOption, removeOption, updateOption)은 단일 글로벌 단가 정책으로 인해 삭제되었습니다.

  const handleSaveProduct = async () => {
    if (!formName.trim()) return alert('상품명을 입력해주세요.');
    if (!formCategoryId) return alert('카테고리를 선택해주세요.');
    if (formGlobalPrice <= 0) return alert('글로벌 단가(정가)를 0원 초과로 입력해주세요.');

    const body = {
      id: editingProduct?.id,
      name: formName,
      description: formDescription || null,
      imageUrl: formImageUrl || null,
      categoryId: formCategoryId,
      isActive: formIsActive,
      isBestSeller: formIsBestSeller,
      isSale: formIsSale,
      isFreeShipping: formIsFreeShipping,
      order: formOrder,
      options: [
        {
          id: formOptionId,
          name: '기본',
          originalPrice: formGlobalPrice,
          salePrice: formGlobalPrice,
          discountRate: 0,
          stock: 99999,
          isDefault: true
        }
      ],
    };

    try {
      const res = await fetch('/api/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Save failed');

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Save error:', err);
      alert('저장에 실패했습니다.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error('Delete error:', err);
    }
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
        <h1 className="admin-page-title">상품 관리</h1>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> 상품 추가
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>순서</th>
              <th>이미지</th>
              <th>상품명</th>
              <th>카테고리</th>
              <th>옵션 수</th>
              <th>가격 범위</th>
              <th>상태</th>
              <th>표시</th>
              <th style={{ width: 100 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const prices = product.options.map((o) => o.salePrice);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              return (
                <tr key={product.id}>
                  <td>{product.order}</td>
                  <td>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>📦</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{product.name}</td>
                  <td>{product.category?.name}</td>
                  <td>{product.options.length}개</td>
                  <td style={{ fontSize: '0.75rem' }}>
                    {prices.length > 0 && (
                      <>
                        {minPrice === maxPrice
                          ? `KRW ${minPrice.toLocaleString()}`
                          : `KRW ${minPrice.toLocaleString()} ~ ${maxPrice.toLocaleString()}`}
                      </>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${product.isActive ? 'delivered' : 'cancelled'}`}
                    >
                      {product.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td>
                    {product.isBestSeller && (
                      <span className="status-badge paid" style={{ marginRight: 4 }}>BEST</span>
                    )}
                    {product.isSale && (
                      <span className="status-badge pending" style={{ marginRight: 4 }}>SALE</span>
                    )}
                    {product.isFreeShipping && (
                      <span className="status-badge" style={{ background: '#3b82f6', color: 'white' }}>무료배송</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
                      <button className="action-btn" onClick={() => openEditModal(product)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 800, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--slate-200)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{editingProduct ? '상품 수정' : '상품 추가'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4) var(--space-6)' }}>
              <div className="admin-form-row" style={{ margin: 0 }}>
                <label className="admin-form-label">상품명 *</label>
                <input className="admin-form-input" placeholder="365Plus 점보롤 300m 일반" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>

              <div className="admin-form-row" style={{ margin: 0 }}>
                <label className="admin-form-label">카테고리 *</label>
                <select
                  className="admin-form-select admin-form-input"
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                >
                  <option value="">선택</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-row" style={{ margin: 0, gridColumn: '1 / 2' }}>
                <label className="admin-form-label">설명</label>
                <textarea
                  className="admin-form-input admin-form-textarea"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ height: '160px', resize: 'none' }}
                />
              </div>

              <div className="admin-form-row" style={{ margin: 0, gridColumn: '2 / 3' }}>
                <label className="admin-form-label">이미지</label>
                {formImageUrl ? (
                  <div className="image-preview" style={{ height: '160px' }}>
                    <img src={formImageUrl} alt="" style={{ height: '100%', objectFit: 'contain' }}/>
                    <button className="remove-btn" onClick={() => setFormImageUrl('')}><X size={12} /></button>
                  </div>
                ) : (
                  <label className="image-upload-area" style={{ height: '160px' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    <div className="upload-icon"><Upload size={24} /></div>
                    <div className="upload-text">{uploading ? '업로드 중...' : '이미지를 선택하세요'}</div>
                    <div className="upload-hint" style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '4px' }}>권장 사이즈: 1:1 비율 (예: 800x800)</div>
                  </label>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
              <div className="admin-form-row" style={{ margin: 0, width: '120px' }}>
                <label className="admin-form-label" style={{ marginBottom: '4px' }}>순서</label>
                <input
                  className="admin-form-input"
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 'var(--space-6)', justifyContent: 'flex-end', paddingTop: '18px' }}>
                <label className="admin-form-toggle" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>스토어 노출 (활성)</span>
                  <div className={`toggle-switch ${formIsActive ? 'active' : ''}`}
                    onClick={() => setFormIsActive(!formIsActive)} />
                </label>
                <label className="admin-form-toggle" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>BEST 뱃지 표시</span>
                  <div className={`toggle-switch ${formIsBestSeller ? 'active' : ''}`}
                    onClick={() => setFormIsBestSeller(!formIsBestSeller)} />
                </label>
                <label className="admin-form-toggle" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>SALE 뱃지 표시</span>
                  <div className={`toggle-switch ${formIsSale ? 'active' : ''}`}
                    onClick={() => setFormIsSale(!formIsSale)} />
                </label>
                <label className="admin-form-toggle" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>무료배송 뱃지</span>
                  <div className={`toggle-switch ${formIsFreeShipping ? 'active' : ''}`}
                    onClick={() => setFormIsFreeShipping(!formIsFreeShipping)} />
                </label>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{ background: 'var(--slate-50)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
                <label className="admin-form-label" style={{ margin: 0, marginBottom: '8px' }}>글로벌 단가 (정가)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input
                    className="admin-form-input"
                    type="number"
                    style={{ width: '200px' }}
                    value={formGlobalPrice}
                    onChange={(e) => setFormGlobalPrice(Number(e.target.value))}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>원</span>
                </div>
                <p className="form-hint" style={{ marginTop: '8px' }}>이 상품의 기준 단가입니다. 파트너 전용몰에서의 최종 할인가 및 할인율은 파트너 관리 메뉴에서 개별 설정합니다.</p>
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
              <button className="btn btn-primary" onClick={handleSaveProduct}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
