import React, { useMemo, useState } from 'react';
import { put } from '../services/apiClient.js';
import { useI18n } from '../src/i18n.jsx';

function ResetPassword() {
  const { t } = useI18n();
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
    if (!pwd || pwd.length < 8) return t('reset.validate.min');
    if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) return t('reset.validate.complexity');
    if (pwd !== pwd2) return t('reset.validate.mismatch');
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    const v = validate();
    if (v) { setErr(v); return; }
    if (!token) { setErr(t('reset.msg.invalid_link')); return; }
    try {
      setLoading(true);
      const res = await put(`/auth/reset-password/${encodeURIComponent(token)}`, { motDePasse: pwd, password: pwd, newPassword: pwd });
      setMsg(res?.message || t('reset.msg.success'));
      setTimeout(() => { window.location.hash = '#/connexion'; }, 1000);
    } catch (e) {
      setErr(e?.message || t('reset.msg.error'));
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
              <h1 className="fw-bold mb-3">{t('reset.title')}</h1>
              {msg && <div className="alert alert-success">{msg}</div>}
              {err && <div className="alert alert-danger">{err}</div>}
              <form className="d-grid gap-3" onSubmit={onSubmit}>
                <div>
                  <label className="form-label">{t('reset.new.label')}</label>
                  <input type="password" className="form-control" value={pwd} onChange={(e)=>setPwd(e.target.value)} placeholder="••••••••" />
                  <div className="small text-muted">{t('reset.new.hint')}</div>
                </div>
                <div>
                  <label className="form-label">{t('reset.confirm.label')}</label>
                  <input type="password" className="form-control" value={pwd2} onChange={(e)=>setPwd2(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !pwd || !pwd2}>
                  {loading ? t('reset.submit.sending') : t('reset.submit')}
                </button>
                <div className="small text-muted">{t('reset.redirect.hint')}</div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResetPassword;
