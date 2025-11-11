import React, { useEffect, useState } from 'react';
import { redirectByRole } from '../services/authStore.js';

function OAuthCallback() {
  const [msg, setMsg] = useState('Traitement de la connexion...');
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
        setMsg('Token manquant. Veuillez réessayer.');
        setTimeout(() => { window.location.hash = '#/connexion'; }, 1200);
        return;
      }
      try { localStorage.setItem('token', token); } catch {}
      try { if (role) localStorage.setItem('role', role); } catch {}
      try { if (userType) localStorage.setItem('userType', userType); } catch {}
      setMsg('Connexion réussie, redirection...');
      setTimeout(() => { redirectByRole(); }, 200);
    } catch (e) {
      setMsg('Erreur lors du traitement.');
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
