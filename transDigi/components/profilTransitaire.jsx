import React, { useState } from 'react';
import { profilTransitaireCss } from '../styles/profilTransitaireStyle.jsx';
import SideBare from './sideBare';
import { LayoutGrid, User } from 'lucide-react';
import { get, put, putForm } from '../services/apiClient.js';

const ProfilTransitaire = () => {
  const [logoPreview, setLogoPreview] = useState(() => {
    try { return localStorage.getItem('transLogoUrl') || ''; } catch { return ''; }
  });

  // On mount, try to load logo from API and sync to localStorage for persistence
  React.useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await get('/translataires/profile').catch(async () => {
          try { return await get('/translataires/me'); } catch { return null; }
        });
        const url = res?.logo || res?.photoProfil || res?.photoUrl || res?.photo || '';
        if (url && typeof url === 'string') {
          setLogoPreview(url);
          try { localStorage.setItem('transLogoUrl', url); } catch {}
        }
      } catch {}
    };
    if (!logoPreview) loadLogo();
  }, []);
  const [logoFile, setLogoFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [fieldErr, setFieldErr] = useState({ email: '', phone: '' });
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());
  const isPhone = (v) => /^\+?\d[\d\s.-]{7,}$/.test(String(v||'').trim());
  const normalizePhone = (v) => String(v||'').replace(/[^\d+]/g, '');
  const [formData, setFormData] = useState({
    companyName: 'Transporter Inc.',
    email: 'contact@transporter.com',
    phone: '+33 1 23 45 67 89',
    address: '123 Rue de la Logistique, 75001 Paris, France',
    services: 'Transport maritime, fret aérien, logistique d’entreposage, dédouanement.'
  });

  const onChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        setLogoPreview(dataUrl);
        try { if (dataUrl) localStorage.setItem('transLogoUrl', dataUrl); } catch {}
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr(''); setFieldErr({ email: '', phone: '' });
    try {
      setSaving(true);
      // Mettre à jour les informations de profil avant l'upload logo
      try {
        // validations simples côté front
        const next = { email: '', phone: '' };
        if (formData.email && !isEmail(formData.email)) next.email = 'E‑mail invalide';
        if (formData.phone && !isPhone(formData.phone)) next.phone = 'Téléphone invalide';
        if (next.email || next.phone) { setFieldErr(next); throw new Error('Validation'); }

        await put('/translataires/profile', {
          nomEntreprise: formData.companyName,
          email: formData.email,
          telephone: normalizePhone(formData.phone),
          adresse: formData.address,
          services: formData.services,
        });
        setMsg('Informations mises à jour');
      } catch (e) {
        if (e?.status === 409) {
          const m = (e?.message || '').toLowerCase();
          if (m.includes('mail') || m.includes('email')) setFieldErr((p)=>({ ...p, email: 'Cet e‑mail est déjà utilisé' }));
          if (m.includes('phone') || m.includes('télé') || m.includes('tel') || m.includes('telephone')) setFieldErr((p)=>({ ...p, phone: 'Ce téléphone est déjà utilisé' }));
          // ne pas throw pour permettre l'upload du logo si fourni
        } else if (e?.message !== 'Validation') {
          throw e;
        }
      }
      if (logoFile) {
        const fd = new FormData();
        fd.append('photo', logoFile);
        const res = await putForm('/translataires/photo', fd);
        setMsg(res?.message || 'Logo mis à jour');
        try {
          const url = (res?.url || res?.photoUrl || res?.photo || logoPreview || '').toString();
          if (url) localStorage.setItem('transLogoUrl', url);
        } catch {}
      } else {
        setMsg('Informations mises à jour');
      }
    } catch (e) {
      setErr(e?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const [isLgUp, setIsLgUp] = React.useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 992 : true));
  
  React.useEffect(() => {
    const onResize = () => setIsLgUp(window.innerWidth >= 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="d-flex bg-light" style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <SideBare
        topOffset={96}
        activeId="profil"
        closeOnNavigate={false}
        defaultOpen={true}
        open={sidebarOpen}
        onOpenChange={(o)=>setSidebarOpen(!!o)}
        items={[
          { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
          { id: 'profil', label: 'Mon profil', icon: User },
        ]}
        onNavigate={(id) => {
          if (id === 'dashboard') window.location.hash = '#/dashboard-transitaire';
          if (id === 'profil') window.location.hash = '#/profile';
        }}
      />
      <style>{profilTransitaireCss}</style>
      <div className="flex-grow-1 bg-light" style={{ marginLeft: isLgUp ? (sidebarOpen ? '240px' : '56px') : '0', transition: 'margin-left .25s ease', minWidth: 0, width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
        {/* Header with hamburger button */}
        {!isLgUp && (
          <div className="w-100 d-flex align-items-center gap-2 px-2 py-2 bg-white border-bottom" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
            <button 
              className="btn btn-link p-1" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
        
        <div className="container-fluid px-2 px-md-4 py-3 py-md-4">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10 col-xl-8">
            <h2 className="h3 h2-md fw-bold mb-2 mb-md-3 titre-page">Profil de l'entreprise</h2>
            <p className="text-muted small mb-3 mb-md-4">Mettez à jour les informations de votre entreprise visibles par les clients.</p>

            <form className="card border-0 shadow-sm rounded-3 overflow-hidden" onSubmit={onSubmit}>
              <div className="card-body p-2 p-md-4 p-lg-5">
                <div className="row g-2 g-md-4 align-items-center mb-3">
                  <div className="col-12">
                    <div className="fw-semibold text-muted">Informations générales</div>
                  </div>
                  <div className="col-12 col-sm-auto">
                    <div className="avatar-uploader">
                      {logoPreview ? (
                        <img src={logoPreview} alt="logo" className="rounded-circle border" style={{ width: 72, height: 72, objectFit: 'cover' }} />
                      ) : (
                        <div className="rounded-circle border d-flex align-items-center justify-content-center bg-white" style={{ width: 72, height: 72 }}>
                          <span className="text-muted">📦</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-12 col-sm">
                    <div className="d-flex flex-wrap gap-2">
                      <label className="btn btn-outline-secondary btn-sm">
                        Choisir un photo
                        <input type="file" accept="image/*" onChange={onUpload} hidden />
                      </label>
                      <span className="text-muted small align-self-center">No file chosen</span>
                    </div>
                  </div>
                </div>
                {msg && <div className="alert alert-success py-2">{msg}</div>}
                {err && <div className="alert alert-danger py-2">{err}</div>}

                <div className="mb-4">
                  <label className="form-label fw-semibold">Nom de l’entreprise</label>
                  <input type="text" className="form-control" value={formData.companyName} onChange={(e) => onChange('companyName', e.target.value)} />
                </div>

                <div className="fw-semibold text-muted mb-2">Coordonnées</div>
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small">Email de contact</label>
                    <input type="email" className={`form-control ${fieldErr.email ? 'is-invalid' : ''}`} value={formData.email} onChange={(e) => onChange('email', e.target.value)} />
                    {fieldErr.email && <div className="invalid-feedback d-block">{fieldErr.email}</div>}
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small">Téléphone</label>
                    <input type="text" className={`form-control ${fieldErr.phone ? 'is-invalid' : ''}`} value={formData.phone} onChange={(e) => onChange('phone', normalizePhone(e.target.value))} onKeyDown={(e)=>{ const allowed = /[0-9+]/; if (e.key.length===1 && !allowed.test(e.key)) e.preventDefault(); }} />
                    {fieldErr.phone && <div className="invalid-feedback d-block">{fieldErr.phone}</div>}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Adresse</label>
                  <input type="text" className="form-control" value={formData.address} onChange={(e) => onChange('address', e.target.value)} />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold small">Services Proposés</label>
                  <textarea className="form-control" rows={4} value={formData.services} onChange={(e) => onChange('services', e.target.value)} />
                </div>

                <div className="d-flex gap-3 justify-content-end">
                  <button type="button" className="btn btn-danger" disabled={saving}>Annuler</button>
                  <button type="submit" className="btn btn-primary btn-success" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilTransitaire;
