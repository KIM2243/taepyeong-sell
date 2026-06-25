'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OrderData {
  createdAt: string;
  totalAmount: number;
  status: string;
}

interface SalesChartProps {
  orders: OrderData[];
}

export default function SalesChart({ orders }: SalesChartProps) {
  const chartData = useMemo(() => {
    // 1. Generate the last 7 days array
    const dataMap = new Map<string, { revenue: number; count: number }>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      dataMap.set(dateStr, { revenue: 0, count: 0 });
    }

    // 2. Aggregate orders
    orders.forEach((order) => {
      // Exclude cancelled orders from revenue if needed, or include them? Usually we exclude CANCELLED
      if (order.status === 'CANCELLED') return;

      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);

      // Check if it's within the last 7 days
      const diffTime = today.getTime() - orderDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 6) {
        const dateStr = `${orderDate.getMonth() + 1}/${orderDate.getDate()}`;
        const existing = dataMap.get(dateStr);
        if (existing) {
          existing.revenue += order.totalAmount;
          existing.count += 1;
        }
      }
    });

    // 3. Convert to array for Recharts
    return Array.from(dataMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      count: data.count,
    }));
  }, [orders]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid var(--slate-200)',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--slate-800)' }}>{label}</p>
          <p style={{ margin: '0 0 4px 0', color: 'var(--primary)', fontWeight: 500 }}>
            매출: KRW {payload[0].value.toLocaleString()}
          </p>
          <p style={{ margin: 0, color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            주문: {payload[0].payload.count}건
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: 'var(--radius-lg)', 
      border: '1px solid var(--slate-200)',
      padding: 'var(--space-6)',
      marginBottom: 'var(--space-6)',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
    }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>최근 7일 매출 추이</h2>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginTop: '4px' }}>
          취소된 주문을 제외한 누적 결제/입금 대기 금액입니다.
        </p>
      </div>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--slate-500)', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--slate-500)', fontSize: 12 }}
              tickFormatter={(value) => `₩${(value / 10000).toLocaleString()}만`}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--primary)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
