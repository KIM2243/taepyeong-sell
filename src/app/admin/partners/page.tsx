'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/partners');
      setPartners(await res.json());
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formSlug.trim()) {
      return alert('기업명과 고유 링크(Slug)를 입력해주세요.');
    }

    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, slug: formSlug, isActive: formIsActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '생성 실패');
      
      setShowModal(false);
      setFormName('');
      setFormSlug('');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 파트너사를 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) return;
    try {
      await fetch(`/api/partners/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('삭제 실패');
    }
  };

  if (loading) return <div style={{ padding: 40 }}>로딩중...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">파트너(B2B) 관리</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> 신규 파트너 추가
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>기업명</th>
              <th>고유 링크</th>
              <th>상태</th>
              <th>설정된 상품 수</th>
              <th>누적 주문 수</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>등록된 파트너사가 없습니다.</td>
              </tr>
            ) : (
              partners.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td><a href={`/p/${p.slug}`} target="_blank" style={{color: 'var(--primary-600)', textDecoration: 'underline'}}>/p/{p.slug}</a></td>
                  <td>
                    <span className={`status-badge ${p.isActive ? 'paid' : 'pending'}`}>
                      {p.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td>{p._count?.overrides || 0}개</td>
                  <td>{p._count?.orders || 0}건</td>
                  <td>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
                      <button className="action-btn" onClick={() => router.push(`/admin/partners/${p.id}`)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(p.id)}>
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--slate-200)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>신규 파트너사 추가</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
                <X size={24} />
              </button>
            </div>
            <div className="admin-form-row">
              <label className="admin-form-label">기업명</label>
              <input className="admin-form-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="예: 삼성전자 임직원몰" />
            </div>
            
            <div className="admin-form-row">
              <label className="admin-form-label">고유 링크 (영문/숫자)</label>
              <input className="admin-form-input" value={formSlug} onChange={e => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="예: samsung" />
              <p className="form-hint" style={{marginTop: 4}}>이 값은 URL로 사용됩니다. (예: /p/samsung)</p>
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">활성화 여부</label>
              <select className="admin-form-select" value={formIsActive ? '1' : '0'} onChange={e => setFormIsActive(e.target.value === '1')}>
                <option value="1">활성</option>
                <option value="0">비활성</option>
              </select>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                className="btn btn-primary" 
                style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white' }} 
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>생성하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
