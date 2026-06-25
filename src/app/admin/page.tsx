'use client';

import { useEffect, useState, useMemo } from 'react';
import { ShoppingCart, DollarSign, Clock, TrendingUp } from 'lucide-react';
import SalesChart from './components/SalesChart';

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  totalOrders: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  ordererName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  partner: { id: string; name: string } | null;
}

interface Partner {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '입금 대기',
  PAID: '입금 확인',
  PREPARING: '상품 준비',
  SHIPPED: '배송중',
  DELIVERED: '배송 완료',
  CANCELLED: '취소',
};

export default function AdminDashboard() {
  const [allOrders, setAllOrders] = useState<RecentOrder[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [ordersRes, partnersRes] = await Promise.all([
        fetch('/api/orders?admin=true'),
        fetch('/api/partners')
      ]);
      
      const orders = await ordersRes.json();
      const partnersList = await partnersRes.json();

      if (Array.isArray(orders)) {
        setAllOrders(orders);
      }
      if (Array.isArray(partnersList)) {
        setPartners(partnersList);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (selectedPartnerId === 'ALL') return allOrders;
    return allOrders.filter(o => o.partner && o.partner.id === selectedPartnerId);
  }, [allOrders, selectedPartnerId]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = filteredOrders.filter(
      (o: RecentOrder) => new Date(o.createdAt) >= today
    );

    return {
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum: number, o: RecentOrder) => sum + o.totalAmount, 0),
      pendingOrders: filteredOrders.filter((o: RecentOrder) => o.status === 'PENDING').length,
      totalOrders: filteredOrders.length,
    };
  }, [filteredOrders]);

  const recentOrders = useMemo(() => {
    return filteredOrders.slice(0, 10);
  }, [filteredOrders]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="loading-spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="admin-page-title">대시보드</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--slate-600)', fontWeight: 500 }}>유입 파트너 필터:</span>
          <select 
            className="form-control" 
            style={{ width: '200px', margin: 0 }}
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
          >
            <option value="ALL">전체 보기</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">
            <ShoppingCart size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            오늘 주문
          </div>
          <div className="stat-card-value">{stats.todayOrders}건</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            <DollarSign size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            오늘 매출
          </div>
          <div className="stat-card-value">KRW {stats.todayRevenue.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            <Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            입금 대기
          </div>
          <div className="stat-card-value" style={{ color: stats.pendingOrders > 0 ? 'var(--amber-600)' : undefined }}>
            {stats.pendingOrders}건
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            전체 주문
          </div>
          <div className="stat-card-value">{stats.totalOrders}건</div>
        </div>
      </div>

      <SalesChart orders={filteredOrders} />

      {/* Recent Orders */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
        최근 주문
      </h2>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>주문번호</th>
              <th>주문자</th>
              <th>유입 파트너</th>
              <th>금액</th>
              <th>상태</th>
              <th>주문일시</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                  아직 주문이 없습니다.
                </td>
              </tr>
            ) : (
              recentOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>{order.orderNumber}</td>
                  <td>{order.ordererName}</td>
                  <td>
                    {order.partner ? (
                      <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{order.partner.name}</span>
                    ) : (
                      <span style={{ color: 'var(--slate-400)' }}>-</span>
                    )}
                  </td>
                  <td>KRW {order.totalAmount.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${order.status.toLowerCase()}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                    {new Date(order.createdAt).toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
