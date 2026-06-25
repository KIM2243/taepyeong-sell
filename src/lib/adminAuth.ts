import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function verifyAdminIP(req: NextRequest): Promise<boolean> {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const masterIp = process.env.MASTER_IP;
  
  if (masterIp && ip === masterIp) return true;

  const isEnabled = await prisma.siteSetting.findUnique({ where: { key: 'admin_ip_whitelist_enabled' } });
  if (isEnabled?.value === 'true') {
    const whitelist = await prisma.siteSetting.findUnique({ where: { key: 'admin_ip_whitelist' } });
    const allowedIps = whitelist?.value?.split(',').map(x => x.trim()) || [];
    
    if (process.env.NODE_ENV === 'development') {
      allowedIps.push('127.0.0.1', '::1');
    }

    if (!allowedIps.includes(ip)) {
      return false;
    }
  }

  return true;
}
