'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ViewMode = 'login' | '2fa' | 'reset-request' | 'reset-verify' | 'reset-done';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [subtitle, setSubtitle] = useState('태평프레시 특가몰 관리 시스템');
  const [successMsg, setSuccessMsg] = useState('');

  // 2FA states
  const [tempToken, setTempToken] = useState('');
  const [adminId, setAdminId] = useState('');
  const [code, setCode] = useState('');

  // Password reset states
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [resetUsername, setResetUsername] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetTempToken, setResetTempToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.login_subtitle) setSubtitle(data.login_subtitle);
    }).catch(console.error);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (viewMode === '2fa') {
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
        setViewMode('2fa');
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

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resetUsername }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '요청에 실패했습니다.');
        return;
      }

      setResetTempToken(data.tempToken);
      setMaskedEmail(data.maskedEmail);
      setViewMode('reset-verify');
      setSuccessMsg(`${data.maskedEmail}(으)로 인증 코드가 발송되었습니다.`);
    } catch {
      setError('요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/auth/reset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken: resetTempToken, code: resetCode, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '비밀번호 변경에 실패했습니다.');
        return;
      }

      setViewMode('reset-done');
    } catch {
      setError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setViewMode('login');
    setError('');
    setSuccessMsg('');
    setResetUsername('');
    setResetCode('');
    setResetTempToken('');
    setNewPassword('');
    setConfirmPassword('');
    setMaskedEmail('');
    setCode('');
    setTempToken('');
    setAdminId('');
  };

  const getTitle = () => {
    switch (viewMode) {
      case '2fa': return '2차 인증';
      case 'reset-request': return '비밀번호 찾기';
      case 'reset-verify': return '비밀번호 재설정';
      case 'reset-done': return '비밀번호 변경 완료';
      default: return '관리자 로그인';
    }
  };

  const getSubtitle = () => {
    switch (viewMode) {
      case '2fa': return '이메일로 발송된 6자리 인증 코드를 입력해주세요.';
      case 'reset-request': return '관리자 아이디를 입력하면 등록된 이메일로 인증 코드를 발송합니다.';
      case 'reset-verify': return `${maskedEmail}(으)로 발송된 인증 코드와 새 비밀번호를 입력해주세요.`;
      case 'reset-done': return '비밀번호가 성공적으로 변경되었습니다.';
      default: return subtitle;
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-img-box" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>T</div>
          <h1>{getTitle()}</h1>
          <p>{getSubtitle()}</p>
        </div>

        {/* 로그인 폼 */}
        {viewMode === 'login' && (
          <form className="login-form" onSubmit={handleLogin}>
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

            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? '확인 중...' : '로그인'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => { setViewMode('reset-request'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #2563eb)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          </form>
        )}

        {/* 2FA 인증 폼 */}
        {viewMode === '2fa' && (
          <form className="login-form" onSubmit={handleLogin}>
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

            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? '확인 중...' : '인증하기'}
            </button>
          </form>
        )}

        {/* 비밀번호 찾기 - 아이디 입력 */}
        {viewMode === 'reset-request' && (
          <form className="login-form" onSubmit={handleResetRequest}>
            <div className="input-field">
              <label htmlFor="reset-username">아이디</label>
              <div className="input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input
                  id="reset-username"
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="관리자 아이디"
                  autoComplete="username"
                />
              </div>
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? '발송 중...' : '인증 코드 발송'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={backToLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  padding: 0,
                }}
              >
                ← 로그인으로 돌아가기
              </button>
            </div>
          </form>
        )}

        {/* 비밀번호 찾기 - 코드 + 새 비밀번호 입력 */}
        {viewMode === 'reset-verify' && (
          <form className="login-form" onSubmit={handleResetVerify}>
            {successMsg && (
              <p style={{ color: '#22c55e', fontSize: '0.85rem', textAlign: 'center', marginBottom: '8px' }}>
                {successMsg}
              </p>
            )}

            <div className="input-field">
              <label htmlFor="reset-code">인증 코드</label>
              <div className="input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="reset-code"
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6자리 인증 코드"
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <div className="input-field">
              <label htmlFor="new-password">새 비밀번호</label>
              <div className="input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (4자 이상)"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="input-field">
              <label htmlFor="confirm-password">비밀번호 확인</label>
              <div className="input-with-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 다시 입력"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                onClick={backToLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  padding: 0,
                }}
              >
                ← 로그인으로 돌아가기
              </button>
            </div>
          </form>
        )}

        {/* 비밀번호 변경 완료 */}
        {viewMode === 'reset-done' && (
          <div className="login-form">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
              <p style={{ color: '#22c55e', fontWeight: 600, marginBottom: '4px' }}>
                비밀번호가 변경되었습니다.
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                새 비밀번호로 로그인해주세요.
              </p>
            </div>

            <button
              className="btn-login"
              type="button"
              onClick={backToLogin}
            >
              로그인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
