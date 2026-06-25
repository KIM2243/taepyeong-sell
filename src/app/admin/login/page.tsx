'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [subtitle, setSubtitle] = useState('태평프레시 특가몰 관리 시스템');

  const [require2FA, setRequire2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [adminId, setAdminId] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.login_subtitle) setSubtitle(data.login_subtitle);
    }).catch(console.error);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (require2FA) {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/admin/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempToken, code, adminId }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || '인증에 실패했습니다.');
          return;
        }
        router.push('/admin');
      } catch {
        setError('인증 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '로그인에 실패했습니다.');
        return;
      }

      const data = await res.json();
      if (data.require2FA) {
        setRequire2FA(true);
        setTempToken(data.tempToken);
        setAdminId(data.adminId);
      } else {
        router.push('/admin');
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-img-box" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>T</div>
          <h1>{require2FA ? '2차 인증' : '관리자 로그인'}</h1>
          <p>{require2FA ? '이메일로 발송된 6자리 인증 코드를 입력해주세요.' : subtitle}</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {!require2FA ? (
            <>
              <div className="input-field">
                <label htmlFor="username">아이디</label>
                <div className="input-with-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="관리자 아이디"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="input-field">
                <label htmlFor="password">비밀번호</label>
                <div className="input-with-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="input-field">
              <label htmlFor="code">인증 코드</label>
              <div className="input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="code"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6자리 숫자"
                  autoComplete="one-time-code"
                />
              </div>
            </div>
          )}

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button className="btn-login" type="submit" disabled={loading}>
            {loading ? '확인 중...' : (require2FA ? '인증하기' : '로그인')}
          </button>
        </form>
      </div>
    </div>
  );
}
