'use client';

import { useEffect, useState } from 'react';
import { Eye, X, Search, Filter, Trash2 } from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  optionName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  trackingNo?: string | null;
  courier?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  ordererName: string;
  ordererPhone: string;
  ordererAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  totalAmount: number;
  status: string;
  depositorName?: string;
  trackingNo?: string;
  courier?: string;
  cashReceiptType: string;
  items: OrderItem[];
  createdAt: string;
  dealEvent?: { title: string } | null;
  partner?: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '입금 대기' },
  { value: 'PAID', label: '입금 확인' },
  { value: 'PREPARING', label: '상품 준비' },
  { value: 'SHIPPED', label: '배송중' },
  { value: 'DELIVERED', label: '배송 완료' },
  { value: 'CANCELLED', label: '취소' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: '입금 대기',
  PAID: '입금 확인',
  PREPARING: '상품 준비',
  SHIPPED: '배송중',
  DELIVERED: '배송 완료',
  CANCELLED: '취소',
};

import { COURIER_CODES } from '@/lib/tracking';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit fields
  const [editStatus, setEditStatus] = useState('');
  const [editTrackingNo, setEditTrackingNo] = useState('');
  const [editCourier, setEditCourier] = useState('');
  const [editItems, setEditItems] = useState<Record<string, { trackingNo: string; courier: string }[]>>({});

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;
    if (statusFilter) {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.ordererName.toLowerCase().includes(q) ||
          o.ordererPhone.includes(q)
      );
    }
    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchQuery]);

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders?admin=true');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditTrackingNo(order.trackingNo || '');
    setEditCourier(order.courier || '');
    
    const itemsMap: Record<string, { trackingNo: string; courier: string }[]> = {};
    order.items.forEach(item => {
      if (item.id) {
        const couriers = (item.courier || '').split(',').map(s => s.trim());
        const trackings = (item.trackingNo || '').split(',').map(s => s.trim());
        
        const arr = [];
        for (let i = 0; i < item.quantity; i++) {
          arr.push({
            courier: couriers[i] || couriers[0] || '',
            trackingNo: trackings[i] || trackings[0] || '',
          });
        }
        itemsMap[item.id] = arr;
      }
    });
    setEditItems(itemsMap);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      const itemsPayload = Object.entries(editItems).map(([itemId, arr]) => {
        const couriers = arr.map(a => a.courier).join(',');
        const trackings = arr.map(a => a.trackingNo).join(',');
        return {
          id: itemId,
          trackingNo: trackings.replace(/,+$/, '') || null,
          courier: couriers.replace(/,+$/, '') || null,
        };
      });

      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: editStatus,
          trackingNo: editTrackingNo || null,
          courier: editCourier || null,
          items: itemsPayload,
        }),
      });

      if (!res.ok) throw new Error();

      setSelectedOrder(null);
      loadOrders();
    } catch {
      alert('업데이트에 실패했습니다.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('경고: 개인정보 보호법에 의거하여 영구 삭제됩니다.\n정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error();
      
      alert('주문 내역이 삭제되었습니다.');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      loadOrders();
    } catch {
      alert('주문 삭제에 실패했습니다.');
    }
  };

  const handleQuickStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error();
      loadOrders();
    } catch {
      alert('상태 변경에 실패했습니다.');
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
        <h1 className="admin-page-title">주문 관리</h1>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Filter size={14} color="var(--slate-400)" />
          <select
            className="admin-form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, maxWidth: 300 }}>
          <Search size={14} color="var(--slate-400)" />
          <input
            className="admin-form-input"
            placeholder="주문번호, 이름, 전화번호 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', alignSelf: 'center' }}>
          총 {filteredOrders.length}건
        </span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>주문번호</th>
              <th>주문자</th>
              <th>유입 파트너</th>
              <th>상품</th>
              <th>금액</th>
              <th>상태</th>
              <th>입금자</th>
              <th>운송장</th>
              <th>주문일시</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>
                  주문이 없습니다.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.ordererName}</td>
                  <td style={{ color: 'var(--primary-600)' }}>
                    {order.partner ? order.partner.name : '기본몰'}
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.items.map((i) => i.productName).join(', ')}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    KRW {order.totalAmount.toLocaleString()}
                  </td>
                  <td>
                    {['PENDING', 'PAID', 'PREPARING', 'CANCELLED'].includes(order.status) ? (
                      <select 
                        className={`admin-form-select status-badge ${order.status.toLowerCase()}`}
                        value={order.status}
                        onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                        style={{ padding: '2px 24px 2px 8px', height: 'auto', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, border: 'none', appearance: 'auto', cursor: 'pointer' }}
                      >
                        <option value="PENDING">입금 대기</option>
                        <option value="PAID">결제 완료</option>
                        <option value="PREPARING">상품 준비중</option>
                        <option value="CANCELLED">주문 취소</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    )}
                  </td>
                  <td style={{ color: order.depositorName ? 'inherit' : 'var(--slate-400)' }}>
                    {order.depositorName || '-'}
                  </td>
                  <td>
                    {(() => {
                      const trackings = order.items.flatMap(i => (i.trackingNo || '').split(',').map(s => s.trim()).filter(Boolean));
                      if (trackings.length > 0) {
                        return trackings.length === 1 ? trackings[0] : `개별 발송 (${trackings.length}건)`;
                      }
                      return order.trackingNo || '-';
                    })()}
                  </td>
                  <td>
                    {new Date(order.createdAt).toLocaleString('ko-KR', {
                      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
                      <button className="action-btn" onClick={() => openDetail(order)}>
                        <Eye size={14} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeleteOrder(order.id)}>
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--slate-200)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>주문 상세 - {selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
                <X size={24} />
              </button>
            </div>

            {/* Order Info */}
            <div className="admin-form-card" style={{ marginBottom: 'var(--space-4)' }}>
              <h3>주문 정보</h3>
              <div className="payment-info-row">
                <span className="payment-label">주문자</span>
                <span className="payment-value">{selectedOrder.ordererName} ({selectedOrder.ordererPhone})</span>
              </div>
              <div className="payment-info-row">
                <span className="payment-label">주문자 주소</span>
                <span className="payment-value">{selectedOrder.ordererAddress}</span>
              </div>
              <div className="payment-info-row">
                <span className="payment-label">받는 분</span>
                <span className="payment-value">{selectedOrder.receiverName} ({selectedOrder.receiverPhone})</span>
              </div>
              <div className="payment-info-row">
                <span className="payment-label">배송 주소</span>
                <span className="payment-value">{selectedOrder.receiverAddress}</span>
              </div>
              {selectedOrder.dealEvent && (
                <div className="payment-info-row">
                  <span className="payment-label">특가 이벤트</span>
                  <span className="payment-value">{selectedOrder.dealEvent.title}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="admin-form-card" style={{ marginBottom: 'var(--space-4)' }}>
              <h3>상품 내역</h3>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="payment-info-row" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid var(--slate-100)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span className="payment-label" style={{ fontSize: '0.75rem' }}>
                      {item.productName}<br />
                      <span style={{ color: 'var(--slate-400)' }}>{item.optionName} × {item.quantity}</span>
                    </span>
                    <span className="payment-value" style={{ fontWeight: 700 }}>
                      KRW {item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                  {item.id && editItems[item.id] && editItems[item.id].map((tInfo, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', marginTop: '4px', background: '#f8fafc', padding: '8px', borderRadius: '4px' }}>
                      <select
                        className="admin-form-select"
                        value={tInfo.courier}
                        onChange={(e) => {
                          const newArr = [...editItems[item.id!]];
                          newArr[i].courier = e.target.value;
                          setEditItems(prev => ({ ...prev, [item.id!]: newArr }));
                        }}
                        style={{ width: '140px', padding: '6px 8px', fontSize: '0.75rem' }}
                      >
                        <option value="">택배사 선택</option>
                        {COURIER_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                        <option value="ETC">기타</option>
                      </select>
                      <input
                        className="admin-form-input"
                        value={tInfo.trackingNo}
                        onChange={(e) => {
                          const newArr = [...editItems[item.id!]];
                          newArr[i].trackingNo = e.target.value;
                          setEditItems(prev => ({ ...prev, [item.id!]: newArr }));
                        }}
                        placeholder={`운송장 번호 입력 (${i + 1}/${item.quantity}개)`}
                        style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem' }}
                      />
                    </div>
                  ))}
                </div>
              ))}
              <div className="payment-info-row" style={{ paddingTop: 'var(--space-3)' }}>
                <span className="payment-label" style={{ fontWeight: 700 }}>합계</span>
                <span className="payment-value amount">KRW {selectedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Status Update & Bulk Tracking */}
            <div className="admin-form-card">
              <h3>상태 및 일괄 송장 등록</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '16px' }}>
                아래 입력칸은 주문 내 모든 상품의 운송장 번호를 한 번에 통일할 때 사용합니다.
              </p>

              <div className="admin-form-row">
                <label className="admin-form-label">일괄 택배사</label>
                <select
                  className="admin-form-select"
                  value={editCourier}
                  onChange={(e) => setEditCourier(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">선택 (일괄 적용 시 사용)</option>
                  {COURIER_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                  <option value="ETC">기타</option>
                </select>
              </div>

              <div className="admin-form-row">
                <label className="admin-form-label">일괄 운송장 번호</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <input
                    className="admin-form-input"
                    value={editTrackingNo}
                    onChange={(e) => setEditTrackingNo(e.target.value)}
                    placeholder="운송장 번호 입력"
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (!editCourier || !editTrackingNo) return alert('택배사와 운송장 번호를 입력해주세요.');
                      const newItemsMap = { ...editItems };
                      Object.keys(newItemsMap).forEach(key => {
                        newItemsMap[key] = [{ courier: editCourier, trackingNo: editTrackingNo }];
                      });
                      setEditItems(newItemsMap);
                    }}
                  >
                    일괄 적용
                  </button>
                </div>
              </div>

              <div className="admin-form-row" style={{ marginTop: '16px' }}>
                <label className="admin-form-label">주문 상태</label>
                <select
                  className="admin-form-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                className="btn btn-secondary"
                style={{ color: '#ef4444', borderColor: '#ef4444', marginRight: 'auto' }} 
                onClick={() => handleDeleteOrder(selectedOrder.id)}
              >
                영구 삭제
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedOrder(null)}
              >
                닫기
              </button>
              <button className="btn btn-primary" onClick={handleUpdateOrder}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
