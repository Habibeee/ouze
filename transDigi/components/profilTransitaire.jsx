import React, { useState } from 'react';
import { profilTransitaireCss } from '../styles/profilTransitaireStyle.jsx';
import SideBare from './sideBare';
import { LayoutGrid, User } from 'lucide-react';
import { get, put, putForm } from '../services/apiClient.js';

const ProfilTransitaire = () => {
  // Suppression de la gestion de l'image de profil pour utiliser un cercle coloré avec initiales
  const [userInitials, setUserInitials] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Récupérer les initiales du nom de l'entreprise
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await get('/translataires/profile').catch(async () => {
          try { return await get('/translataires/me'); } catch { return null; }
        });
        if (res) {
          const name = res.nomEntreprise || res.companyName || '';
          const email = res.email || '';
          setUserEmail(email);
          
          // Générer les initiales à partir du nom de l'entreprise
          const initials = name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
          
          setUserInitials(initials);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      }
    };
    
    loadProfile();
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [fieldErr, setFieldErr] = useState({ email: '', phone: '' });
  const [isLgUp, setIsLgUp] = useState(window.innerWidth >= 992);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Gestion du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      setIsLgUp(window.innerWidth >= 992);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());
  const isPhone = (v) => /^\+?\d[\d\s.-]{7,}$/.test(String(v||'').trim());
  const normalizePhone = (v) => String(v||'').replace(/[^\d+]/g, '');

  const SECTOR_OPTIONS = [
    { id: 'transport-maritime', label: 'Transport maritime', serviceCode: 'maritime' },
    { id: 'fret-aerien', label: 'Fret aérien', serviceCode: 'aerien' },
    { id: 'logistique-entreposage', label: 'Logistique d\'entreposage', serviceCode: null },
    { id: 'dedouanement', label: 'Dédouanement', serviceCode: null },
    { id: 'transport-aerien', label: 'Transport aérien', serviceCode: 'aerien' },
    { id: 'transport-routier', label: 'Transport routier', serviceCode: 'routier' },
  ];

  const [formData, setFormData] = useState({
    companyName: 'Transporter Inc.',
    email: 'contact@transporter.com',
    phone: '+33 1 23 45 67 89',
    address: '123 Rue de la Logistique, 75001 Paris, France',
    sectors: [],
  });

  const onChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSector = (id) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.sectors) ? prev.sectors : [];
      const exists = current.includes(id);
      const next = exists ? current.filter((s) => s !== id) : [...current, id];
      return { ...prev, sectors: next };
    });
  };

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await get('/translataires/profile').catch(async () => {
          try { return await get('/translataires/me'); } catch { return null; }
        });
        if (!res) return;

        const rawServices = Array.isArray(res.services) && res.services.length
          ? res.services
          : (typeof res.secteurActivite === 'string' ? res.secteurActivite.split(',') : []);
        const serviceLabels = Array.isArray(rawServices)
          ? rawServices.map((s) => String(s).trim()).filter(Boolean)
          : [];
        const sectorIds = SECTOR_OPTIONS
          .filter((opt) => serviceLabels.includes(opt.label))
          .map((opt) => opt.id);

        setFormData((prev) => ({
          ...prev,
          companyName: res.nomEntreprise || res.companyName || prev.companyName,
          email: res.email || prev.email,
          phone: res.telephone || res.phone || prev.phone,
          address: res.adresse || res.address || prev.address,
          sectors: sectorIds.length ? sectorIds : prev.sectors,
        }));
      } catch {}
    };
    loadProfile();
  }, []);

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

        const selectedIds = Array.isArray(formData.sectors) ? formData.sectors : [];
        const selectedOptions = SECTOR_OPTIONS.filter((opt) => selectedIds.includes(opt.id));
        const servicesLabels = selectedOptions.map((o) => o.label);
        const typeServices = Array.from(new Set(selectedOptions.map((o) => o.serviceCode).filter(Boolean)));
        const secteurActivite = servicesLabels.length ? servicesLabels.join(', ') : 'Aucun secteur renseigné';

        await put('/translataires/profile', {
          nomEntreprise: formData.companyName,
          email: formData.email,
          telephone: normalizePhone(formData.phone),
          adresse: formData.address,
          services: servicesLabels,
          secteurActivite,
          typeServices,
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

  // Fonction pour obtenir le nom d'affichage
  const getDisplayName = () => {
    return formData.companyName || 'Transitaire';
  };
  
  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    // Implémentez la logique de déconnexion ici
    window.location.hash = '/connexion';
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fc' }}>
      <SideBare
        defaultOpen={true}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        activeId="profil"
        items={[
          { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
          { id: 'profil', label: 'Mon profil', icon: User },
        ]}
        onNavigate={(id) => {
          if (id === 'dashboard') window.location.hash = '#/dashboard-transitaire';
          if (id === 'profil') window.location.hash = '#/profile';
        }}
      />
      
      {/* En-tête avec notifications et profil */}
      <div className="position-fixed top-0 end-0 p-3 d-flex align-items-center gap-3" style={{ zIndex: 1000, marginLeft: sidebarOpen ? '240px' : '56px' }}>
        {/* Bouton de notification */}
        <div className="position-relative">
          <button
            className={`btn btn-light position-relative p-2 ${notifOpen ? 'active' : ''}`}
            onClick={() => setNotifOpen(!notifOpen)}
            style={{ borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px', padding: '4px 6px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Menu déroulant des notifications */}
          {notifOpen && (
            <div 
              className="dropdown-menu show" 
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '8px',
                backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,.15)',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '0.5rem 0'
              }}
            >
              <div className="px-3 py-2 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Notifications</h6>
                  <button 
                    className="btn btn-link p-0 text-muted"
                    onClick={() => {}}
                  >
                    <small>Marquer tout comme lu</small>
                  </button>
                </div>
              </div>
              <div className="text-center py-4">
                <p className="text-muted mb-0">Aucune notification</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Bouton de profil */}
        <div className="position-relative">
          <button
            className="btn btn-link text-decoration-none p-0"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            style={{ color: 'inherit' }}
          >
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              {userInitials || <User size={20} />}
            </div>
          </button>
          
          {/* Menu déroulant du profil */}
          {profileMenuOpen && (
            <div 
              className="dropdown-menu dropdown-menu-end show" 
              style={{ 
                position: 'absolute', 
                right: 0, 
                marginTop: '8px', 
                zIndex: 1000, 
                minWidth: '200px',
                backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,.15)',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <div className="dropdown-header d-flex flex-column align-items-center py-3">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mb-2" style={{ width: '64px', height: '64px' }}>
                  {userInitials || <User size={28} />}
                </div>
                <div className="text-center">
                  <div className="fw-bold">{getDisplayName()}</div>
                  <div className="text-muted small">{userEmail || ''}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item d-flex align-items-center gap-2">
                <User size={16} /> Mon profil
              </button>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item d-flex align-items-center gap-2 text-danger"
                onClick={handleLogout}
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .dropdown-menu {
          --bs-dropdown-bg: white;
          --bs-dropdown-link-color: #212529;
          --bs-dropdown-link-hover-color: #1e2125;
          --bs-dropdown-link-hover-bg: #f8f9fa;
        }
        .dropdown-item {
          padding: 0.5rem 1rem;
        }
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
      `}</style>
      <div className="flex-grow-1 bg-light" style={{ 
        marginLeft: window.innerWidth >= 992 ? (sidebarOpen ? '240px' : '56px') : '0', 
        marginTop: '60px',
        transition: 'margin-left .25s ease', 
        minWidth: 0, 
        width: 'calc(100% - ' + (window.innerWidth >= 992 ? (sidebarOpen ? '240px' : '56px') : '0') + ')', 
        maxWidth: '100vw', 
        overflowX: 'hidden' 
      }}>
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
                  <div className="d-flex flex-column align-items-center mb-4">
                    <div className="position-relative mb-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center" 
                        style={{
                          width: '120px', 
                          height: '120px',
                          backgroundColor: '#4e73df',
                          color: 'white',
                          fontSize: '40px',
                          fontWeight: 'bold',
                          border: '3px solid #fff',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}
                      >
                        {userInitials || <User size={48} />}
                      </div>
                    </div>
                    <div className="w-100">
                      <div className="row">
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
              </div>
            </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold small">Secteurs d'activité</label>
                  <div className="border rounded-3 p-3">
                    {SECTOR_OPTIONS.map((opt) => (
                      <div key={opt.id} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={opt.id}
                          checked={Array.isArray(formData.sectors) && formData.sectors.includes(opt.id)}
                          onChange={() => toggleSector(opt.id)}
                        />
                        <label className="form-check-label" htmlFor={opt.id}>
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
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
