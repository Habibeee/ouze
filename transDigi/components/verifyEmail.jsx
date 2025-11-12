import React, { useEffect, useState } from 'react';
import { get } from '../services/apiClient.js';
import { useI18n } from '../src/i18n.jsx';

function VerifyEmail() {
  const { t } = useI18n();
  const [status, setStatus] = useState('pending'); // pending | success | error
  const [message, setMessage] = useState(t('verify.pending'));

  useEffect(() => {
    const hash = window.location.hash || '';
    const parts = hash.split('/'); // ['#', 'verifier', '<token>']
    const token = parts[2] || '';
    if (!token) {
      setStatus('error');
      setMessage(t('verify.token_missing'));
      return;
    }
    (async () => {
      try {
        setStatus('pending');
        setMessage(t('verify.pending'));
        const res = await get(`/auth/verify/${encodeURIComponent(token)}`);
        if (res?.success) {
          setStatus('success');
          setMessage(res?.message || t('verify.success'));
          setTimeout(() => { window.location.hash = '#/connexion'; }, 1200);
        } else {
          setStatus('error');
          setMessage(res?.message || t('verify.error'));
        }
      } catch (e) {
        setStatus('error');
        setMessage(e?.message || t('verify.error_generic'));
      }
    })();
  }, []);

  return (
    <section className="py-5 bg-body">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="p-4 border rounded-4 text-center">
              <h1 className="fw-bold mb-3">{t('verify.title')}</h1>
              <div className={`alert ${status === 'success' ? 'alert-success' : status === 'error' ? 'alert-danger' : 'alert-info'}`}>{message}</div>
              {status !== 'success' && (
                <a href="#/connexion" className="btn btn-outline-secondary">{t('verify.go_login')}</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerifyEmail;
