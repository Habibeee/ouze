import React, { useState } from 'react';
import { profilTransitaireCss } from '../styles/profilTransitaireStyle.jsx';
import SideBare from './sideBare';
import { LayoutGrid, User } from 'lucide-react';
import { get, putForm } from '../services/apiClient.js';

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
    setMsg(''); setErr('');
    try {
      setSaving(true);
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

  return (
    <div className="d-flex bg-light" style={{ minHeight: '100vh' }}>
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
      <div className="container-fluid px-3 px-md-4 py-4 flex-grow-1" style={{ marginLeft: sidebarOpen ? '240px' : '56px', transition: 'margin-left .25s ease' }}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-8">
            <h2 className="fw-bold mb-3 titre-page">Profil de l’entreprise</h2>
            <p className="text-muted mb-4">Mettez à jour les informations de votre entreprise visibles par les clients.</p>

            <form className="card border-0 shadow-sm rounded-4 overflow-hidden" onSubmit={onSubmit}>
              <div className="card-body p-3 p-md-4 p-lg-5">
                <div className="row g-4 align-items-center mb-3">
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
                    <input type="email" className="form-control" value={formData.email} onChange={(e) => onChange('email', e.target.value)} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small">Téléphone</label>
                    <input type="text" className="form-control" value={formData.phone} onChange={(e) => onChange('phone', e.target.value)} />
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
  );
};

export default ProfilTransitaire;
