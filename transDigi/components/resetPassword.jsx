import React, { useMemo, useState } from 'react';
import { put } from '../services/apiClient.js';

function ResetPassword() {
  const token = useMemo(() => {
    const hash = window.location.hash || '';
    // Support formats: '#/reinitialiser/<token>' or '#/reinitialiser?token=<token>'
    const m1 = hash.match(/^#\/reinitialiser\/([^?]+)/);
    if (m1 && m1[1]) return m1[1];
    const m2 = hash.match(/^#\/reinitialiser\?(.+)$/);
    if (m2 && m2[1]) {
      const qs = new URLSearchParams(m2[1]);
      const t = qs.get('token');
      if (t) return t;
    }
    return '';
  }, []);
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const validate = () => {
    if (!pwd || pwd.length < 8) return 'Au moins 8 caractères';
    if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) return 'Incluez 1 lettre et 1 chiffre';
    if (pwd !== pwd2) return 'Les mots de passe ne correspondent pas';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    const v = validate();
    if (v) { setErr(v); return; }
    if (!token) { setErr('Lien invalide.'); return; }
    try {
      setLoading(true);
      const res = await put(`/auth/reset-password/${encodeURIComponent(token)}`, { motDePasse: pwd, password: pwd, newPassword: pwd });
      setMsg(res?.message || 'Mot de passe réinitialisé.');
      setTimeout(() => { window.location.hash = '#/connexion'; }, 1000);
    } catch (e) {
      setErr(e?.message || 'Erreur lors de la réinitialisation. Si le lien a expiré, demandez un nouveau lien.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-5 bg-body">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="p-4 p-md-5 border rounded-4">
              <h1 className="fw-bold mb-3">Réinitialiser le mot de passe</h1>
              {msg && <div className="alert alert-success">{msg}</div>}
              {err && <div className="alert alert-danger">{err}</div>}
              <form className="d-grid gap-3" onSubmit={onSubmit}>
                <div>
                  <label className="form-label">Nouveau mot de passe</label>
                  <input type="password" className="form-control" value={pwd} onChange={(e)=>setPwd(e.target.value)} placeholder="••••••••" />
                  <div className="small text-muted">Au moins 8 caractères, 1 lettre et 1 chiffre.</div>
                </div>
                <div>
                  <label className="form-label">Confirmer le mot de passe</label>
                  <input type="password" className="form-control" value={pwd2} onChange={(e)=>setPwd2(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !pwd || !pwd2}>
                  {loading ? 'Réinitialisation...' : 'Réinitialiser'}
                </button>
                <div className="small text-muted">Vous serez redirigé vers la page de connexion.</div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResetPassword;
