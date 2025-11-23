import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, User, Mail, Phone, MapPin, LayoutGrid, FileText, Clock, Truck, Search as SearchIcon } from 'lucide-react';
import { modofierProfClientCss } from '../styles/modofierProfClientStyle.jsx';
import { get, put, putForm } from '../services/apiClient.js';
import { useI18n } from '../src/i18n.jsx';

const ModofierProfClient = () => {
  const { t } = useI18n();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    address: '',
    phone: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(() => {
    try { return localStorage.getItem('avatarUrl') || ''; } catch { return ''; }
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [fieldErr, setFieldErr] = useState({ email: '', phone: '' });

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());
  const isPhone = (v) => /^\+?\d[\d\s.-]{7,}$/.test(String(v||'').trim());
  const normalizePhone = (v) => String(v||'').replace(/[^\d+]/g, '');

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Charger le profil réel
  useEffect(() => {
    const run = async () => {
      try {
        setErr('');
        const data = await get('/users/profile');
        const u = data?.user || data || {};
        setForm(prev => ({
          ...prev,
          lastName: u.nom || '',
          firstName: u.prenom || '',
          address: u.informationsPersonnelles || '',
          phone: u.telephone || '',
          email: u.email || prev.email || ''
        }));
        if (!avatarPreview && u.photoProfil) {
          setAvatarPreview(u.photoProfil);
          try { localStorage.setItem('avatarUrl', u.photoProfil); } catch {}
        }
      } catch (e) {
        setErr(e?.message || t('client.profile.error.load'));
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr(''); setFieldErr({ email: '', phone: '' });
    // validations simples
    const nextFieldErr = { email: '', phone: '' };
    if (form.email && !isEmail(form.email)) nextFieldErr.email = t('client.profile.error.email_invalid');
    if (form.phone && !isPhone(form.phone)) nextFieldErr.phone = t('client.profile.error.phone_invalid');
    if (nextFieldErr.email || nextFieldErr.phone) { setFieldErr(nextFieldErr); return; }
    try {
      setSaving(true);
      // Mettre à jour les informations de profil (côté API attend: nom, prenom, telephone, informationsPersonnelles)
      await put('/users/profile', {
        nom: form.lastName,
        prenom: form.firstName,
        telephone: normalizePhone(form.phone),
        informationsPersonnelles: form.address,
      });
      if (avatarFile) {
        const fd = new FormData();
        fd.append('photo', avatarFile);
        const res = await putForm('/users/photo', fd);
        setMsg(res?.message || t('client.profile.msg.photo_updated'));
        try {
          const url = (res?.url || res?.photoUrl || res?.photo || avatarPreview || '').toString();
          if (url) localStorage.setItem('avatarUrl', url);
        } catch {}
      }
      if (!avatarFile) setMsg(t('client.profile.msg.updated'));
    } catch (e) {
      if (e?.status === 409) {
        const m = (e?.message || '').toLowerCase();
        if (m.includes('mail') || m.includes('email')) setFieldErr((p)=>({ ...p, email: t('client.profile.error.email_taken') }));
        if (m.includes('phone') || m.includes('télé') || m.includes('tel') || m.includes('telephone')) setFieldErr((p)=>({ ...p, phone: t('client.profile.error.phone_taken') }));
      } else {
        setErr(e?.message || t('client.profile.error.save'));
      }
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(url);
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview('');
    const input = document.getElementById('avatarInput');
    if (input) input.value = '';
  };

  return (
    <div className="bg-body" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <style>{modofierProfClientCss}</style>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-8">
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="display-6 fw-bold brand-title">Modifier mon profil</h1>
              <div className="profile-avatar mx-auto" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Photo de profil" style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style={{ width: '96px', height: '96px', fontWeight: '600' }}>
                    {(form.firstName?.[0] || '').toUpperCase()}{(form.lastName?.[0] || '').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <input id="avatarInput" type="file" accept="image/*" className="d-none" onChange={onAvatarChange} />
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => document.getElementById('avatarInput').click()}>{t('client.profile.buttons.choose_photo')}</button>
                {avatarPreview && (
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearAvatar}>{t('client.profile.buttons.remove_photo')}</button>
                )}
              </div>
            </div>
            {msg && <div className="alert alert-success py-2 text-center">{msg}</div>}
            {err && <div className="alert alert-danger py-2 text-center">{err}</div>}

            {/* Card */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-md-5">
                <form onSubmit={handleSubmit}>
                  {/* Informations personnelles */}
                  <h6 className="section-title">{t('client.profile.section.personal')}</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">{t('client.profile.field.last_name')}</label>
                      <div className="input-group input-with-icon">
                        <span className="input-group-text"><User size={18} /></span>
                        <input type="text" className="form-control" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">{t('client.profile.field.first_name')}</label>
                      <div className="input-group input-with-icon">
                        <span className="input-group-text"><User size={18} /></span>
                        <input type="text" className="form-control" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold small">{t('client.profile.field.address')}</label>
                      <div className="input-group input-with-icon">
                        <span className="input-group-text"><MapPin size={18} /></span>
                        <input type="text" className="form-control" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">{t('client.profile.field.phone')}</label>
                      <div className="input-group input-with-icon">
                        <span className="input-group-text"><Phone size={18} /></span>
                        <input type="tel" className={`form-control ${fieldErr.phone ? 'is-invalid' : ''}`} value={form.phone} onChange={(e) => handleChange('phone', normalizePhone(e.target.value))} onKeyDown={(e)=>{ const allowed = /[0-9+]/; if (e.key.length===1 && !allowed.test(e.key)) e.preventDefault(); }} />
                      </div>
                      {fieldErr.phone && <div className="invalid-feedback d-block">{fieldErr.phone}</div>}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">{t('client.profile.field.email')}</label>
                      <div className="input-group input-with-icon">
                        <span className="input-group-text"><Mail size={18} /></span>
                        <input type="email" className={`form-control ${fieldErr.email ? 'is-invalid' : ''}`} value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                      </div>
                      {fieldErr.email && <div className="invalid-feedback d-block">{fieldErr.email}</div>}
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Sécurité */}
                  <h6 className="section-title">{t('client.profile.section.security')}</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label fw-semibold small">{t('client.profile.field.current_password')}</label>
                      <div className="input-group input-with-icon">
                        <input type={showCurrent ? 'text' : 'password'} className="form-control" placeholder={t('client.profile.field.current_password.placeholder')} value={form.currentPassword} onChange={(e) => handleChange('currentPassword', e.target.value)} />
                        <button type="button" className="btn btn-light icon-toggle" onClick={() => setShowCurrent(s => !s)}>
                          {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">{t('client.profile.field.new_password')}</label>
                      <div className="input-group input-with-icon">
                        <input type={showNew ? 'text' : 'password'} className="form-control" placeholder={t('client.profile.field.new_password.placeholder')} value={form.newPassword} onChange={(e) => handleChange('newPassword', e.target.value)} />
                        <button type="button" className="btn btn-light icon-toggle" onClick={() => setShowNew(s => !s)}>
                          {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">{t('client.profile.field.confirm_password')}</label>
                      <div className="input-group input-with-icon">
                        <input type={showConfirm ? 'text' : 'password'} className="form-control" placeholder={t('client.profile.field.confirm_password.placeholder')} value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} />
                        <button type="button" className="btn btn-light icon-toggle" onClick={() => setShowConfirm(s => !s)}>
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="d-flex flex-column flex-sm-row gap-3 justify-content-end">
                    <button type="button" className="btn btn-outline-secondary" disabled={saving}>{t('client.profile.actions.cancel')}</button>
                    <button type="submit" className="btn btn-primary brand-primary" disabled={saving}>{saving ? t('client.profile.actions.saving') : t('client.profile.actions.save')}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModofierProfClient;
