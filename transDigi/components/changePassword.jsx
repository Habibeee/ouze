import React, { useState } from 'react';
import { put } from '../services/apiClient.js';

function ChangePassword() {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const validate = () => {
    if (!oldPwd) return "Ancien mot de passe requis";
    if (!newPwd || newPwd.length < 8) return 'Au moins 8 caractères';
    if (!/[A-Za-z]/.test(newPwd) || !/\d/.test(newPwd)) return 'Incluez 1 lettre et 1 chiffre';
    if (newPwd !== newPwd2) return 'Les mots de passe ne correspondent pas';
    if (newPwd === oldPwd) return 'Le nouveau mot de passe doit être différent de l\'ancien';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    const v = validate();
    if (v) { setErr(v); return; }
    try {
      setLoading(true);
      const res = await put('/auth/change-password', {
        ancienMotDePasse: oldPwd,
        oldPassword: oldPwd,
        currentPassword: oldPwd,
        motDePasse: newPwd,
        password: newPwd,
        newPassword: newPwd,
      });
      setMsg(res?.message || 'Mot de passe modifié.');
      setOldPwd(''); setNewPwd(''); setNewPwd2('');
      setTimeout(() => { window.location.hash = '#/'; }, 800);
    } catch (e) {
      setErr(e?.message || 'Erreur lors de la modification.');
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
              <h1 className="fw-bold mb-3">Changer le mot de passe</h1>
              {msg && <div className="alert alert-success">{msg}</div>}
              {err && <div className="alert alert-danger">{err}</div>}
              <form className="d-grid gap-3" onSubmit={onSubmit}>
                <div>
                  <label className="form-label">Ancien mot de passe</label>
                  <input type="password" className="form-control" value={oldPwd} onChange={(e)=>setOldPwd(e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                  <label className="form-label">Nouveau mot de passe</label>
                  <input type="password" className="form-control" value={newPwd} onChange={(e)=>setNewPwd(e.target.value)} placeholder="••••••••" />
                  <div className="small text-muted">Au moins 8 caractères, 1 lettre et 1 chiffre.</div>
                </div>
                <div>
                  <label className="form-label">Confirmer le nouveau mot de passe</label>
                  <input type="password" className="form-control" value={newPwd2} onChange={(e)=>setNewPwd2(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChangePassword;
