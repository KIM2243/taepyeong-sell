'use client';

import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');

  // Admin email
  const [adminEmail, setAdminEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    loadSettings();
    loadAdminEmail();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminEmail = async () => {
    try {
      const res = await fetch('/api/admin/email');
      const data = await res.json();
      if (data.email) setAdminEmail(data.email);
    } catch (err) {
      console.error('Load admin email error:', err);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error();
      setMessage('설정이 저장되었습니다.');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMessage('');

    if (!currentPassword || !newPassword) {
      setPwMessage('현재 비밀번호와 새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 4) {
      setPwMessage('비밀번호는 4자리 이상이어야 합니다.');
      return;
    }

    try {
      const res = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPwMessage(data.error || '비밀번호 변경에 실패했습니다.');
        return;
      }

      setPwMessage('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMessage(''), 3000);
    } catch {
      setPwMessage('비밀번호 변경에 실패했습니다.');
    }
  };

  const handleSaveEmail = async () => {
    setEmailSaving(true);
    setEmailMessage('');

    try {
      const res = await fetch('/api/admin/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEmailMessage(data.error || '이메일 저장에 실패했습니다.');
        return;
      }

      setEmailMessage('이메일이 저장되었습니다.');
      setTimeout(() => setEmailMessage(''), 3000);
    } catch {
      setEmailMessage('이메일 저장에 실패했습니다.');
    } finally {
      setEmailSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      updateSetting('main_banner_image', data.url);
    } catch {
      alert('이미지 업로드에 실패했습니다.');
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
        <h1 className="admin-page-title">설정</h1>
      </div>

      {/* Site Layout Settings */}
      <div className="admin-form-card">
        <h3>디자인 및 레이아웃 설정</h3>
        
        <div className="admin-form-row">
          <label className="admin-form-label">로고 텍스트</label>
          <input
            className="admin-form-input"
            value={settings.site_logo_text || ''}
            onChange={(e) => updateSetting('site_logo_text', e.target.value)}
            placeholder="기본값: 태평특가몰"
          />
          <p className="form-hint" style={{ marginTop: 4 }}>
            좌측 상단 메인 로고 영역에 표시될 텍스트입니다. (비워둘 시 기본값 노출)
          </p>
        </div>

        <div className="admin-form-row">
          <label className="admin-form-label">로고 서브텍스트</label>
          <input
            className="admin-form-input"
            value={settings.site_logo_subtext || ''}
            onChange={(e) => updateSetting('site_logo_subtext', e.target.value)}
            placeholder="기본값: 임직원 전용몰"
          />
          <p className="form-hint" style={{ marginTop: 4 }}>
            메인 로고 우측에 작게 표시될 서브텍스트입니다.
          </p>
        </div>

        <div className="admin-form-row">
          <label className="admin-form-label">메인 배너 이미지</label>
          <div style={{ marginTop: '8px' }}>
            {settings.main_banner_image ? (
              <div className="image-preview" style={{ height: '160px', width: '100%', maxWidth: '400px' }}>
                <img src={settings.main_banner_image} alt="" style={{ height: '100%', objectFit: 'contain' }}/>
                <button className="remove-btn" onClick={() => updateSetting('main_banner_image', '')}><X size={12} /></button>
              </div>
            ) : (
              <label className="image-upload-area" style={{ height: '160px', width: '100%', maxWidth: '400px' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                <div style={{ color: 'var(--slate-400)' }}>클릭하여 이미지 업로드</div>
              </label>
            )}
          </div>
          <p className="form-hint" style={{ marginTop: 4 }}>
            메인 화면 상단에 고정 노출될 배너 이미지입니다. 업로드 시 다른 배너보다 최우선 적용됩니다.
          </p>
        </div>
      </div>

      {/* Bank Account */}
      <div className="admin-form-card">
        <h3>입금 계좌 정보</h3>
        <div className="admin-form-row">
          <label className="admin-form-label">은행/계좌 정보</label>
          <input
            className="admin-form-input"
            value={settings.bank_info || ''}
            onChange={(e) => updateSetting('bank_info', e.target.value)}
            placeholder="예: 하나은행 371-910035-71704 주식회사 태평프레시"
          />
          <p className="form-hint" style={{ marginTop: 4 }}>
            주문/결제 페이지에 표시되는 입금 계좌 정보입니다.
          </p>
        </div>
      </div>

      {/* Notification Emails */}
      <div className="admin-form-card">
        <h3>주문 알림 이메일</h3>
        <div className="admin-form-row">
          <label className="admin-form-label">알림 받을 이메일 (쉼표로 구분)</label>
          <input
            className="admin-form-input"
            value={settings.notify_emails || ''}
            onChange={(e) => updateSetting('notify_emails', e.target.value)}
            placeholder="예: admin@tpfresh.com, sales@tpfresh.com"
          />
          <p className="form-hint" style={{ marginTop: 4 }}>
            새 주문이 접수되면 이 이메일로 알림이 발송됩니다.
          </p>
        </div>
      </div>

      {/* SMTP Settings */}
      <div className="admin-form-card">
        <h3>이메일 발송 설정 (SMTP)</h3>
        <div className="admin-form-row">
          <label className="admin-form-label">SMTP 호스트</label>
          <input
            className="admin-form-input"
            value={settings.smtp_info || ''}
            onChange={(e) => updateSetting('smtp_info', e.target.value)}
            placeholder="환경변수(.env)에서 설정"
            disabled
          />
          <p className="form-hint" style={{ marginTop: 4 }}>
            SMTP 설정은 .env 파일에서 관리합니다. (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
          </p>
        </div>
      </div>

      {/* Login Page Setting */}
      <div className="admin-form-card">
        <h3>로그인 페이지 설정</h3>
        <div className="admin-form-row">
          <label className="admin-form-label">관리자 페이지 이름 (로그인 화면 표시)</label>
          <input
            className="admin-form-input"
            value={settings.login_subtitle || ''}
            onChange={(e) => updateSetting('login_subtitle', e.target.value)}
            placeholder="예: 태평프레시 특가몰 관리 시스템"
          />
          <p className="form-hint" style={{ marginTop: 4 }}>
            관리자 로그인 페이지의 로고 아래에 표시되는 문구입니다.
          </p>
        </div>
      </div>

      {/* Security Settings */}
      <div className="admin-form-card">
        <h3 style={{ color: 'var(--red-600)' }}>관리자 보안 설정</h3>
        
        <div className="admin-form-row" style={{ borderBottom: '1px solid var(--slate-200)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              id="admin_ip_whitelist_enabled"
              checked={settings.admin_ip_whitelist_enabled === 'true'}
              onChange={(e) => updateSetting('admin_ip_whitelist_enabled', e.target.checked ? 'true' : 'false')}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="admin_ip_whitelist_enabled" className="admin-form-label" style={{ margin: 0, fontWeight: 700 }}>IP 화이트리스트 사용</label>
          </div>
          <p className="form-hint" style={{ marginTop: 4, marginBottom: 8 }}>
            체크 시 아래 등록된 IP에서만 관리자 페이지 접속이 허용됩니다. (주의: 설정 시 본인 IP도 등록해야 접속 가능)
          </p>
          <textarea
            className="admin-form-textarea"
            value={settings.admin_ip_whitelist || ''}
            onChange={(e) => updateSetting('admin_ip_whitelist', e.target.value)}
            placeholder="예: 123.456.789.000, 111.222.333.444 (쉼표로 구분)"
            rows={3}
            disabled={settings.admin_ip_whitelist_enabled !== 'true'}
          />
        </div>

        <div className="admin-form-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              id="admin_2fa_enabled"
              checked={settings.admin_2fa_enabled === 'true'}
              onChange={(e) => updateSetting('admin_2fa_enabled', e.target.checked ? 'true' : 'false')}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="admin_2fa_enabled" className="admin-form-label" style={{ margin: 0, fontWeight: 700 }}>이메일 2차 인증(2FA) 사용</label>
          </div>
          <p className="form-hint" style={{ marginTop: 4, marginBottom: 8 }}>
            로그인 시 아래 이메일로 6자리 인증 코드를 발송합니다.
          </p>
          <textarea
            className="admin-form-textarea"
            value={settings.admin_2fa_emails || ''}
            onChange={(e) => updateSetting('admin_2fa_emails', e.target.value)}
            placeholder="예: admin@example.com (쉼표로 구분)"
            rows={2}
            disabled={settings.admin_2fa_enabled !== 'true'}
          />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>
          <Save size={16} />
          {saving ? '저장 중...' : '설정 저장'}
        </button>
        {message && (
          <span
            style={{
              marginLeft: 'var(--space-3)',
              fontSize: '0.8125rem',
              color: message.includes('실패') ? 'var(--red-500)' : 'var(--green-600)',
            }}
          >
            {message}
          </span>
        )}
      </div>

      {/* Admin Email */}
      <div className="admin-form-card">
        <h3>관리자 이메일 등록</h3>
        <p className="form-hint" style={{ marginBottom: '16px' }}>
          비밀번호 분실 시 이메일 인증을 통해 비밀번호를 초기화할 수 있습니다. 반드시 수신 가능한 이메일을 등록해주세요.
        </p>
        <div className="admin-form-row">
          <label className="admin-form-label">이메일 주소</label>
          <input
            className="admin-form-input"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="예: admin@tpfresh.com"
            style={{ maxWidth: 400 }}
          />
        </div>

        <button className="btn btn-secondary" onClick={handleSaveEmail} disabled={emailSaving}>
          {emailSaving ? '저장 중...' : '이메일 저장'}
        </button>
        {emailMessage && (
          <span
            style={{
              marginLeft: 'var(--space-3)',
              fontSize: '0.8125rem',
              color: emailMessage.includes('실패') ? 'var(--red-500)' : 'var(--green-600)',
            }}
          >
            {emailMessage}
          </span>
        )}
      </div>

      {/* Password Change */}
      <div className="admin-form-card">
        <h3>관리자 비밀번호 변경</h3>
        <div className="admin-form-row">
          <label className="admin-form-label">현재 비밀번호</label>
          <input
            className="admin-form-input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">새 비밀번호</label>
          <input
            className="admin-form-input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">비밀번호 확인</label>
          <input
            className="admin-form-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

        <button className="btn btn-secondary" onClick={handleChangePassword}>
          비밀번호 변경
        </button>
        {pwMessage && (
          <span
            style={{
              marginLeft: 'var(--space-3)',
              fontSize: '0.8125rem',
              color: pwMessage.includes('실패') || pwMessage.includes('않') ? 'var(--red-500)' : 'var(--green-600)',
            }}
          >
            {pwMessage}
          </span>
        )}
      </div>
    </div>
  );
}
