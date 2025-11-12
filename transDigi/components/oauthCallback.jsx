import React, { useEffect, useState } from 'react';
import { redirectByRole } from '../services/authStore.js';
import { useI18n } from '../src/i18n.jsx';

function OAuthCallback() {
  const { t } = useI18n();
  const [msg, setMsg] = useState(t('oauth.processing'));
  useEffect(() => {
    try {
      const href = window.location.href || '';
      const hash = window.location.hash || '';
      // Support both /oauth-callback?token=...&role=... and #/oauth-callback?token=...
      const qs = (() => {
        const qFromHash = hash.includes('?') ? hash.split('?')[1] : '';
        if (qFromHash) return new URLSearchParams(qFromHash);
        const u = new URL(href);
        return u.searchParams;
      })();
      const token = (qs.get('token') || qs.get('access_token') || '').trim();
      const role = (qs.get('role') || '').trim().toLowerCase();
      const userType = (qs.get('userType') || role || '').trim().toLowerCase();
      if (!token) {
        setMsg(t('oauth.token_missing'));
        setTimeout(() => { window.location.hash = '#/connexion'; }, 1200);
        return;
      }
      try { localStorage.setItem('token', token); } catch {}
      try { if (role) localStorage.setItem('role', role); } catch {}
      try { if (userType) localStorage.setItem('userType', userType); } catch {}
      setMsg(t('oauth.success'));
      setTimeout(() => { redirectByRole(); }, 200);
    } catch (e) {
      setMsg(t('oauth.error'));
      setTimeout(() => { window.location.hash = '#/connexion'; }, 1200);
    }
  }, []);

  return (
    <section className="py-5 bg-body">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="p-4 border rounded-4 text-center">
              <div className="spinner-border text-success mb-3" role="status" aria-hidden="true"></div>
              <div>{msg}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OAuthCallback;
