import React, { useState } from 'react';
import { post } from '../services/apiClient.js';
import { useI18n } from '../src/i18n.jsx';

function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('user'); // user | translataire
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!isEmail(email)) { setErr(t('forgot.msg.invalid_email')); return; }
    try {
      setLoading(true);
      const res = await post('/auth/forgot-password', { email: email.trim().toLowerCase(), userType });
      setMsg(res?.message || t('forgot.msg.success'));
    } catch (e) {
      setErr(e?.message || t('forgot.msg.error'));
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
              <h1 className="fw-bold mb-3">{t('forgot.title')}</h1>
              <p className="text-muted">{t('forgot.subtitle')}</p>
              {msg && <div className="alert alert-success">{msg}</div>}
              {err && <div className="alert alert-danger">{err}</div>}
              <form className="d-grid gap-3" onSubmit={onSubmit}>
                <div>
                  <label className="form-label">{t('forgot.email.label')}</label>
                  <input type="email" className="form-control" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder={t('forgot.email.placeholder')} />
                </div>
                <div>
                  <label className="form-label">{t('forgot.type.label')}</label>
                  <select className="form-select" value={userType} onChange={(e)=>setUserType(e.target.value)}>
                    <option value="user">{t('forgot.type.user')}</option>
                    <option value="translataire">{t('forgot.type.forwarder')}</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !email}>
                  {loading ? t('forgot.submit.sending') : t('forgot.submit')}
                </button>
                <div className="small text-muted">{t('forgot.hint')}</div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
