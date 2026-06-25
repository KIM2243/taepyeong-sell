import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import AdminLayoutClient from './AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1';

  // IP Whitelist Check
  const masterIp = process.env.MASTER_IP;
  if (!masterIp || ip !== masterIp) {
    const isEnabled = await prisma.siteSetting.findUnique({ where: { key: 'admin_ip_whitelist_enabled' } });
    if (isEnabled?.value === 'true') {
      const whitelist = await prisma.siteSetting.findUnique({ where: { key: 'admin_ip_whitelist' } });
      const allowedIps = whitelist?.value?.split(',').map(x => x.trim()) || [];
      // Also always allow 127.0.0.1 and ::1 in development for safety
      if (process.env.NODE_ENV === 'development') {
        allowedIps.push('127.0.0.1', '::1');
      }

      if (!allowedIps.includes(ip)) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#334155' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>접근이 거부되었습니다.</h1>
            <p>이 IP 주소({ip})는 관리자 페이지에 접근할 수 없습니다.</p>
          </div>
        );
      }
    }
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
