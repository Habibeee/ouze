import React, { useState } from 'react';
import { post } from '../services/apiClient.js';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('user'); // user | translataire
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!isEmail(email)) { setErr("Adresse e‑mail invalide"); return; }
    try {
      setLoading(true);
      const res = await post('/auth/forgot-password', { email: email.trim().toLowerCase(), userType });
      setMsg(res?.message || 'Email de réinitialisation envoyé (si le compte existe).');
    } catch (e) {
      setErr(e?.message || 'Erreur lors de la demande.');
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
              <h1 className="fw-bold mb-3">Mot de passe oublié</h1>
              <p className="text-muted">Entrez votre e‑mail pour recevoir un lien de réinitialisation.</p>
              {msg && <div className="alert alert-success">{msg}</div>}
              {err && <div className="alert alert-danger">{err}</div>}
              <form className="d-grid gap-3" onSubmit={onSubmit}>
                <div>
                  <label className="form-label">Adresse e‑mail</label>
                  <input type="email" className="form-control" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="vous@exemple.com" />
                </div>
                <div>
                  <label className="form-label">Type de compte</label>
                  <select className="form-select" value={userType} onChange={(e)=>setUserType(e.target.value)}>
                    <option value="user">Client</option>
                    <option value="translataire">Transitaire</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !email}>
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
                <div className="small text-muted">Vous recevrez un e‑mail si un compte correspond à cette adresse.</div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
