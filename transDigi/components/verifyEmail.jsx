import React, { useEffect, useState } from 'react';
import { get } from '../services/apiClient.js';

function VerifyEmail() {
  const [status, setStatus] = useState('pending'); // pending | success | error
  const [message, setMessage] = useState('Vérification en cours...');

  useEffect(() => {
    const hash = window.location.hash || '';
    const parts = hash.split('/'); // ['#', 'verifier', '<token>']
    const token = parts[2] || '';
    if (!token) {
      setStatus('error');
      setMessage('Token manquant.');
      return;
    }
    (async () => {
      try {
        setStatus('pending');
        setMessage('Vérification en cours...');
        const res = await get(`/auth/verify/${encodeURIComponent(token)}`);
        if (res?.success) {
          setStatus('success');
          setMessage(res?.message || 'Email vérifié avec succès.');
          setTimeout(() => { window.location.hash = '#/connexion'; }, 1200);
        } else {
          setStatus('error');
          setMessage(res?.message || 'Échec de la vérification.');
        }
      } catch (e) {
        setStatus('error');
        setMessage(e?.message || 'Erreur pendant la vérification.');
      }
    })();
  }, []);

  return (
    <section className="py-5 bg-body">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="p-4 border rounded-4 text-center">
              <h1 className="fw-bold mb-3">Vérification d'email</h1>
              <div className={`alert ${status === 'success' ? 'alert-success' : status === 'error' ? 'alert-danger' : 'alert-info'}`}>{message}</div>
              {status !== 'success' && (
                <a href="#/connexion" className="btn btn-outline-secondary">Aller à la connexion</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerifyEmail;
