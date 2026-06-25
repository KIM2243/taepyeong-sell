'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  order: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [catName, setCatName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!catName.trim()) return;

    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, order: categories.length }),
      });
      setCatName('');
      loadData();
    } catch (err) {
      console.error('Category create error:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('카테고리를 삭제하면 해당 카테고리의 상품도 함께 처리됩니다. 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error('Category delete error:', err);
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
        <h1 className="admin-page-title">카테고리 관리</h1>
      </div>

      <div className="admin-form-card" style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-2)' }}>
        <input
          className="admin-form-input"
          placeholder="새 카테고리명"
          value={catName}
          onChange={(e) => setCatName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
          style={{ maxWidth: 300 }}
        />
        <button className="btn btn-primary" onClick={handleCreateCategory}>추가</button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>카테고리명</th>
              <th style={{ width: 100 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td style={{ fontWeight: 500 }}>{cat.name}</td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <button className="action-btn delete" onClick={() => handleDeleteCategory(cat.id)}>
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={2} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '20px 0' }}>
                  등록된 카테고리가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
