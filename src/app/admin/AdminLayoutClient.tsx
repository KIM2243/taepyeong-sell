'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Settings,
  LogOut,
  Grid,
  Briefcase
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/partners', label: '파트너(B2B) 관리', icon: Briefcase },
  { href: '/admin/categories', label: '카테고리 관리', icon: Grid },
  { href: '/admin/products', label: '상품 관리', icon: Package },
  { href: '/admin/deals', label: '특가 이벤트', icon: Tag },
  { href: '/admin/orders', label: '주문 관리', icon: ShoppingCart },
  { href: '/admin/settings', label: '설정', icon: Settings },
];

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setAuthenticated(false);
      return;
    }

    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      if (!res.ok) {
        router.push('/admin/login');
        return;
      }
      setAuthenticated(true);
    } catch {
      router.push('/admin/login');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  // Login page - no sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (authenticated === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading-spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="logo-group">
            <div className="sidebar-logo-text">T</div>
            <div className="sidebar-brand-info">
              <span className="brand-name">태평프레시</span>
              <span className="brand-role">특가몰 관리 시스템</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section-label">MENU</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="sidebar-link logout-link"
            onClick={handleLogout}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <LogOut size={18} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      <main className="admin-body">
        <header className="admin-topbar">
          <div className="topbar-inner">
            <div className="topbar-title">태평프레시 특가몰 관리자</div>
            <div className="topbar-right">
              <div className="topbar-user">
                <div className="user-avatar">A</div>
                <div className="user-info">
                  <span className="user-name">관리자</span>
                  <span className="user-role">System Admin</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-page-wrap">
          <div className="admin-page-container">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
