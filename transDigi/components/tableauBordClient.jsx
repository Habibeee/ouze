import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Search, FileText, Truck, Clock, Settings, LogOut,
  CheckCircle, Mail, XCircle, X, User, Bell
} from 'lucide-react';
import { clientStyles, clientCss } from '../styles/tableauBordClientStyle.jsx';
import SideBare from './sideBare.jsx';
import RechercheTransitaire from './rechercheTransitaire.jsx';
import NouveauDevis from './nouveauDevis.jsx';
import TrackingApp from './suiviEnvoi.jsx';
import ModofierProfClient from './modofierProfClient.jsx';
import HistoriqueDevis from './historiqueDevis.jsx';
import MesFichiersRecus from './mesFichiersRecus.jsx';
import { get, post, logout, listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount, cancelDevis as cancelDevisApi, listMesDevis as listMesDevisApi, updateMonDevis, getMonDevisById } from '../services/apiClient.js';
import { useToast } from './ui/ToastProvider.jsx';
import { getAuth, isAdmin as isAdminRole, isTrans as isTransRole } from '../services/authStore.js';
import { useI18n } from '../src/i18n.jsx';

const ClientDashboard = () => {
  const toast = useToast();
  const { t } = useI18n();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLgUp, setIsLgUp] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 992 : true));
  
  useEffect(() => {
    const onResize = () => setIsLgUp(window.innerWidth >= 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [section, setSection] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const h = (window.location.hash || '').split('?')[0];
    switch (h) {
      case '#/recherche-transitaire': return 'recherche';
      case '#/nouveau-devis': return 'devis';
      case '#/historique': return 'historique';
      case '#/profil-client': return 'profil';
      case '#/envois': return 'envois';
      case '#/fichiers-recus': return 'fichiers';
      case '#/dashboard-client': return 'dashboard';
      default: return 'dashboard';
    }
    if (h.startsWith('#/profil-client')) return 'profil';
    return 'dashboard';
  });
  const chartId = 'clientActivityChart';
  const [chartFilter, setChartFilter] = useState('tous'); // tous|accepte|annule|attente|refuse
  const isGotoDevis = (typeof window !== 'undefined') && (() => {
    const h = (window.location.hash || '');
    return h.includes('goto=nouveau-devis') || h.startsWith('#/nouveau-devis') || h.includes('translataireName=');
  })();
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try { return localStorage.getItem('avatarUrl') || ''; } catch { return ''; }
  });
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  useEffect(() => {
    const onStorage = () => {
      try { setAvatarUrl(localStorage.getItem('avatarUrl') || ''); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Charger la photo de profil depuis l'API et la mémoriser pour persistance entre sessions
  useEffect(() => {
    (async () => {
      try {
        const prof = await get('/users/profile');
        const user = prof?.user || {};
        const url = user.photoProfil;
        const nom = (user.nom || '').toString().trim();
        const prenom = (user.prenom || '').toString().trim();
        const full = (prenom + ' ' + nom).trim() || (user.email || '');
        if (full) {
          setUserName(full);
          try {
            const parts = full.split(' ').filter(Boolean);
            const first = (parts[0] || '').charAt(0) || '';
            const last = (parts[1] || '').charAt(0) || '';
            const initials = (first + last || first || '').toUpperCase();
            setUserInitials(initials);
          } catch {}
        }
        if (url && typeof url === 'string') {
          setAvatarUrl((prev) => {
            try { localStorage.setItem('avatarUrl', url); } catch {}
            return url;
          });
        }
      } catch {}
    })();
  }, []);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const loadNotifs = async () => {
    try { setNotifLoading(true); const data = await listNotifications(10); const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []); setNotifs(items); setUnreadCount(items.filter(n=>!n.read).length); } catch {} finally { setNotifLoading(false); }
  };
  const onBellClick = async () => { setNotifOpen((o)=>!o); if (!notifOpen) await loadNotifs(); };
  const onNotifClick = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifs(prev => {
        const item = prev.find(n => n.id === id);
        const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
        setUnreadCount(next.filter(n=>!n.read).length);
        // Router vers la ressource associée si connue
        try {
          const data = item?.data || {};
          if (data.devisId) {
            window.location.hash = `#/detail-devis-client?id=${encodeURIComponent(data.devisId)}`;
          } else if (data.translataireId) {
            // Ouvrir les avis du transitaire ciblé
            const params = new URLSearchParams({ transId: String(data.translataireId), open: 'reviews' });
            window.location.hash = `#/recherche-transitaire?${params.toString()}`;
          }
        } catch {}
        return next;
      });
    } catch {}
  };
  const onMarkAll = async () => { try { await markAllNotificationsRead(); setNotifs(prev => { const next = prev.map(n => ({ ...n, read: true })); setUnreadCount(0); return next; }); } catch {} };
  useEffect(() => {
    let timer;
    let backoff = 90000; // start at 90s
    const maxBackoff = 5 * 60 * 1000; // 5 minutes
    const poll = async () => {
      if (document.hidden) return; // pause when tab hidden
      try {
        const data = await getUnreadNotificationsCount();
        const c = (data?.count ?? data?.unread ?? data) || 0;
        setUnreadCount(Number(c) || 0);
        backoff = 90000; // normal cadence on success
      } catch {
        backoff = Math.min(maxBackoff, Math.round((backoff || 90000) * 1.8));
      }
      if (timer) clearInterval(timer);
      timer = setInterval(poll, backoff || 90000);
    };
    const onVisibility = () => { if (!document.hidden) { poll(); } };
    document.addEventListener('visibilitychange', onVisibility);
    poll();
    return () => { document.removeEventListener('visibilitychange', onVisibility); if (timer) clearInterval(timer); };
  }, []);

  // Sync section with current hash for proper navigation between pages
  useEffect(() => {
    // Guard: accès client uniquement
    try {
      const { token } = getAuth();
      if (!token) {
        window.location.hash = '#/connexion';
      } else if (isAdminRole()) {
        window.location.hash = '#/tableau-bord-admin';
      } else if (isTransRole()) {
        window.location.hash = '#/dashboard-transitaire';
      }
    } catch {}

    const syncFromHash = () => {
      const hash = window.location.hash || '';
      const p = hash.split('?');
      if (p.length > 1) {
        const params = new URLSearchParams(p[1]);
        const goto = params.get('goto');
        if (goto === 'nouveau-devis') return setSection('devis');
        if (goto === 'recherche-transitaire') return setSection('recherche');
        if (goto === 'historique') return setSection('historique');
        if (goto === 'envois') return setSection('envois');
        if (goto === 'profil-client') return setSection('profil');
        if (goto === 'fichiers') return setSection('fichiers');
      }
      if (hash.startsWith('#/historique')) setSection('historique');
      else if (hash.startsWith('#/dashboard-client')) setSection('dashboard');
      else if (hash.startsWith('#/nouveau-devis')) setSection('devis');
      else if (hash.startsWith('#/recherche-transitaire')) setSection('recherche');
      else if (hash.startsWith('#/envois')) setSection('envois');
      else if (hash.startsWith('#/profil-client')) setSection('profil');
      else if (hash.startsWith('#/fichiers-recus')) setSection('fichiers');
    };
    const onHash = () => syncFromHash();
    window.addEventListener('hashchange', onHash);
    // Synchronisation immédiate
    syncFromHash();
    // Si déjà sur goto=nouveau-devis, forcer la section
    if ((window.location.hash || '').includes('goto=nouveau-devis')) {
      setSection('devis');
    }
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // NOTE: Graph effect moved below state declarations to avoid TDZ on 'devis'

  const [devis, setDevis] = useState([]);
  const [devisLoading, setDevisLoading] = useState(false);
  const [devisError, setDevisError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [acceptedShipments, setAcceptedShipments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [devisFilter, setDevisFilter] = useState('tous');
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [editTypeService, setEditTypeService] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFiles, setEditFiles] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editOrigin, setEditOrigin] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editDateExpiration, setEditDateExpiration] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editPackageType, setEditPackageType] = useState('');
  const [editLength, setEditLength] = useState('');
  const [editWidth, setEditWidth] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editPickupAddress, setEditPickupAddress] = useState('');
  const [editPickupDate, setEditPickupDate] = useState('');
  const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDangerous, setEditDangerous] = useState(false);
  const [editTemperature, setEditTemperature] = useState(false);
  const [editFragile, setEditFragile] = useState(false);


  // Dessin de la courbe sur canvas (basée sur les devis réels des 12 derniers mois)
  useEffect(() => {
    if (section !== 'dashboard') return;
    const canvas = document.getElementById(chartId);
    if (!canvas) return;

    // Construire les 12 derniers mois et compter selon filtre
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ y: d.getFullYear(), m: d.getMonth() });
    }
    const matchFilter = (st) => chartFilter === 'tous' ? true : st === chartFilter;
    const counts = months.map(({ y, m }) => {
      return devis.filter(d => {
        const dt = new Date(d.date || d.createdAt || Date.now());
        const st = (d.status || '').toString().toLowerCase();
        return dt.getFullYear() === y && dt.getMonth() === m && matchFilter(st);
      }).length;
    });

    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : 800;
    const height = 300;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);

    const padding = 40;
    const maxVal = Math.max(1, Math.max(...counts)) * 1.2;
    const stepX = (width - padding * 2) / (counts.length - 1);

    // Fond (suivre le thème)
    ctx.clearRect(0, 0, width, height);
    const cssVars = getComputedStyle(document.documentElement);
    const cardBg = (cssVars.getPropertyValue('--card') || '#ffffff').trim();
    ctx.fillStyle = cardBg || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Grille horizontale
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + ((height - padding * 2) * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Courbe
    const toY = (v) => height - padding - (v / maxVal) * (height - padding * 2);
    ctx.strokeStyle = clientStyles.primary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    counts.forEach((v, i) => {
      const x = padding + i * stepX;
      const y = toY(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Zone sous la courbe
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(14,165,233,0.25)');
    gradient.addColorStop(1, 'rgba(14,165,233,0)');
    ctx.fillStyle = gradient;
    ctx.lineTo(padding + (counts.length - 1) * stepX, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();
  }, [section, devis, chartFilter]);

const fetchDevis = async (opts) => {
  try {
    setDevisLoading(true);
    setDevisError('');
    const curPage = opts?.page || page;
    const curLimit = opts?.limit || limit;
    const res = await listMesDevisApi({ page: curPage, limit: curLimit });
    const list = (res?.devis || res?.items || res || []);
    const rows = list.map(d => {
      const raw = (d.statut || d.status || '').toString().toLowerCase();
      const norm = raw.includes('appr') || raw.includes('accept') ? 'accepte'
                : raw.includes('refus') ? 'refuse'
                : raw.includes('annul') ? 'annule'
                : 'attente';
      return {
        id: d.id || d._id || '',
        routeLabel: d.route || d.itineraire || d.trajet || '-',
        status: norm,
        statusLabel: norm === 'accepte' ? 'Accepté' : norm === 'refuse' ? 'Refusé' : norm === 'annule' ? 'Annulé' : 'En attente',
        createdAt: d.createdAt || d.date || Date.now(),
        date: new Date(d.createdAt || d.date || Date.now()).toLocaleDateString('fr-FR')
      };
    });
    setDevis(rows);
    setTotal(Number(res?.total || res?.count || 0) || (Array.isArray(res?.devis) ? Number(res.devis.length) : rows.length * (curPage || 1)));
  } catch (e) {
    if (e?.status === 429) {
      setDevisError('');
      setTimeout(() => { fetchDevis({ page, limit }); }, 3000);
    } else {
      setDevisError(e?.message || 'Erreur de chargement des devis');
    }
  } finally { setDevisLoading(false); }
};

useEffect(() => { fetchDevis({ page: 1, limit }); }, []);

const onOpenEdit = async (d) => {
  setEditId(d.id);
  setEditOpen(true);
  setEditLoading(true);
  try {
    const res = await getMonDevisById(d.id);
    const dv = res?.devis || res || {};
    const typeService = dv.typeService || dv.type || '';
    const description = dv.description || dv.remarque || '';
    const origin = dv.origin || dv.origine || '';
    const destination = dv.destination || dv.route || '';
    const dateExp = dv.dateExpiration ? new Date(dv.dateExpiration).toISOString().slice(0,10) : '';
    const weight = dv.weight || dv.poids || '';
    const packageType = dv.packageType || dv.emballage || '';
    const length = dv.length || dv.longueur || '';
    const width = dv.width || dv.largeur || '';
    const height = dv.height || dv.hauteur || '';
    const pickupAddress = dv.pickupAddress || origin || '';
    const deliveryAddress = dv.deliveryAddress || destination || '';
    const pickupDate = dv.pickupDate || dateExp || '';
    const deliveryDate = dv.deliveryDate || '';
    const notes = dv.notes || '';
    const special = dv.specialRequirements || {};
    setEditTypeService(typeService || '');
    setEditDescription(description || '');
    setEditOrigin(origin || '');
    setEditDestination(destination || '');
    setEditDateExpiration(dateExp || '');
    setEditWeight(String(weight || ''));
    setEditPackageType(String(packageType || ''));
    setEditLength(String(length || ''));
    setEditWidth(String(width || ''));
    setEditHeight(String(height || ''));
    setEditPickupAddress(String(pickupAddress || ''));
    setEditPickupDate(String(pickupDate || ''));
    setEditDeliveryAddress(String(deliveryAddress || ''));
    setEditDeliveryDate(String(deliveryDate || ''));
    setEditNotes(String(notes || ''));
    setEditDangerous(!!(special.dangerous));
    setEditTemperature(!!(special.temperature));
    setEditFragile(!!(special.fragile));
    setEditFiles([]);
  } catch (e) {
    // fallback sans commentaires
    setEditTypeService('');
    setEditDescription('');
    setEditOrigin('');
    setEditDestination('');
    setEditDateExpiration('');
    setEditWeight('');
    setEditPackageType('');
    setEditLength('');
    setEditWidth('');
    setEditHeight('');
    setEditPickupAddress('');
    setEditPickupDate('');
    setEditDeliveryAddress('');
    setEditDeliveryDate('');
    setEditNotes('');
    setEditDangerous(false);
    setEditTemperature(false);
    setEditFragile(false);
  } finally { setEditLoading(false); }
};

const onSubmitEdit = async () => {
  try {
    setEditLoading(true);
    const fd = new FormData();
    if (editTypeService) fd.append('typeService', editTypeService);
    if (editDescription) fd.append('description', editDescription);
    if (editOrigin) fd.append('origin', editOrigin);
    if (editDestination) fd.append('destination', editDestination);
    if (editDateExpiration) fd.append('dateExpiration', editDateExpiration);
    if (editWeight) fd.append('weight', editWeight);
    if (editPackageType) fd.append('packageType', editPackageType);
    if (editLength) fd.append('length', editLength);
    if (editWidth) fd.append('width', editWidth);
    if (editHeight) fd.append('height', editHeight);
    if (editPickupAddress) fd.append('pickupAddress', editPickupAddress);
    if (editPickupDate) fd.append('pickupDate', editPickupDate);
    if (editDeliveryAddress) fd.append('deliveryAddress', editDeliveryAddress);
    if (editDeliveryDate) fd.append('deliveryDate', editDeliveryDate);
    if (editNotes) fd.append('notes', editNotes);
    fd.append('specialRequirements[dangerous]', editDangerous ? 'true' : 'false');
    fd.append('specialRequirements[temperature]', editTemperature ? 'true' : 'false');
    fd.append('specialRequirements[fragile]', editFragile ? 'true' : 'false');
    if (editFiles && editFiles.length) Array.from(editFiles).forEach(f => f && fd.append('fichier', f));
    await updateMonDevis(editId, fd);
    setEditOpen(false);
    await fetchDevis({ page: 1, limit });
    toast.success('Demande mise à jour');
  } catch (e) {
    toast.error(e?.message || 'Échec de la mise à jour');
  } finally { setEditLoading(false); }
};

const cancelDevis = async (id) => {
  if (confirmCancelId !== id) {
    setConfirmCancelId(id);
    setTimeout(() => { setConfirmCancelId(prev => prev === id ? null : prev); }, 4000);
    return;
  }
  try {
    await cancelDevisApi(id);
    setConfirmCancelId(null);
    await fetchDevis();
    toast.success('Devis annulé avec succès.');
  } catch (e) {
    setConfirmCancelId(null);
    toast.error(e?.message || 'Erreur lors de l\'annulation');
  }
};

// Charger 5 notifications récentes pour la colonne "Activité récente"
useEffect(() => {
  (async () => {
    try {
      const items = await listNotifications(5);
      const arr = Array.isArray(items?.items) ? items.items : (Array.isArray(items) ? items : []);
      const mapped = arr.slice(0,5).map(n => ({
        id: n.id || n._id || String(Math.random()),
        type: (n.type || '').toString().toLowerCase(),
        title: n.title || 'Notification',
        text: n.body || n.message || '',
        time: n.createdAt ? new Date(n.createdAt).toLocaleString() : '',
        data: n.data || {},
        read: !!n.read,
      }));
      setRecentActivities(mapped);
    } catch {}
  })();
}, []);

const getUserDisplayName = () => {
  if (userName && userName.trim()) return userName.trim();
  try {
    const candidates = [
      'userName','username','name','prenom','firstName','fullName','displayName','email'
    ];
    for (const k of candidates) {
      const v = localStorage.getItem(k);
      if (v && v.trim()) return v.trim();
    }
  } catch {}
  return 'Utilisateur';
};
const userDisplayName = getUserDisplayName();

const [showIntroWelcome, setShowIntroWelcome] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => {
    setShowIntroWelcome(false);
  }, 10000);
  return () => clearTimeout(timer);
}, []);

return (
  <div className="d-flex" style={{ ...clientStyles.layout, backgroundColor: 'var(--bg)' }}>
    <style>{clientCss}</style>
    
    {/* Sidebar */}
    <SideBare
      topOffset={96}
      closeOnNavigate={!isLgUp}
      defaultOpen={true}
      open={sidebarOpen}
      hideItemsWhenCollapsed={true}
      disableMobileOverlay={true}
      onOpenChange={(o)=>setSidebarOpen(!!o)}
      activeId={section}
      items={[
        { id: 'dashboard', label: t('client.sidebar.dashboard'), icon: LayoutGrid },
        { id: 'recherche', label: t('client.sidebar.search_forwarder'), icon: Search },
        { id: 'devis', label: t('client.sidebar.new_quote'), icon: FileText },
        { id: 'historique', label: t('client.sidebar.history'), icon: Clock },
        { id: 'envois', label: t('client.sidebar.shipments'), icon: Truck },
        { id: 'fichiers', label: 'Mes fichiers reçus', icon: FileText },
        { id: 'profil', label: t('client.sidebar.profile'), icon: User },
      ]}
      onNavigate={(id) => {
        setSection(id);
        if (id === 'dashboard') {
          window.location.hash = '#/dashboard-client';
        } else if (id === 'recherche') {
          window.location.hash = '#/recherche-transitaire';
        } else if (id === 'devis') {
          window.location.hash = '#/nouveau-devis';
        } else if (id === 'historique') {
          window.location.hash = '#/historique';
        } else if (id === 'envois') {
          window.location.hash = '#/envois';
        } else if (id === 'fichiers') {
          window.location.hash = '#/fichiers-recus';
        } else if (id === 'profil') {
          window.location.hash = '#/profil-client';
        }
      }}
    />
  
    {/* Main Content */}
    <div className="flex-grow-1" style={{ marginLeft: isLgUp ? (sidebarOpen ? '240px' : '56px') : '0 !important', transition: 'margin-left .25s ease', paddingLeft: 0, minWidth: 0, width: '100%', maxWidth: '100vw', overflowX: 'hidden', position: 'relative', backgroundColor: 'var(--bg)' }}>
      {/* Header interne : menu + notifications + profil */}
      <div className="w-100 d-flex justify-content-between align-items-center gap-2 px-2 px-md-3 py-2">
        {/* Hamburger menu button - visible only on mobile */}
        {!isLgUp && (
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
        )}
        <div className="d-flex align-items-center gap-2 position-relative ms-auto">
          <button className="btn btn-link position-relative" onClick={onBellClick} aria-label={t('client.header.notifications')}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{unreadCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className="card shadow-sm" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1050, minWidth: 320 }}>
              <div className="card-body p-0">
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                  <div className="fw-semibold">{t('client.header.notifications')}</div>
                  <button className="btn btn-sm btn-link" onClick={onMarkAll}>{t('client.header.mark_all_read')}</button>
                </div>
                {notifLoading ? (
                  <div className="p-3 small text-muted">{t('client.header.loading')}</div>
                ) : (
                  <div className="list-group list-group-flush">
                    {(notifs.length ? notifs : []).map(n => (
                      <button key={n.id || n._id} className={`list-group-item list-group-item-action d-flex justify-content-between ${n.read ? '' : 'fw-semibold'}`} onClick={() => onNotifClick(n.id || n._id, n)}>
                        <div className="me-2" style={{ whiteSpace: 'normal', textAlign: 'left' }}>
                          <div>{n.title || t('client.header.notifications')}</div>
                          {n.body && <div className="small text-muted">{n.body}</div>}
                        </div>
                        {!n.read && <span className="badge bg-primary">Nouveau</span>}
                      </button>
                    ))}
                    {!notifs.length && <div className="p-3 small text-muted">{t('client.header.no_notifications')}</div>}
                  </div>
                )}
              </div>
            </div>
          )}
          <button className="btn p-0 border-0 bg-transparent" onClick={() => setProfileMenuOpen(!profileMenuOpen)} aria-label={t('client.header.open_profile_menu')}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profil"
                className="rounded-circle"
                style={{ width: 36, height: 36, objectFit: 'cover', border: '2px solid #e9ecef' }}
              />
            ) : (
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, border: '2px solid #e9ecef', backgroundColor: '#E9ECEF' }}
              >
                <span style={{ fontWeight: 600, color: '#495057', fontSize: 14 }}>
                  {(userInitials || '').trim() || (userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'U')}
                </span>
              </div>
            )}
          </button>
          {profileMenuOpen && (
            <div className="card shadow-sm" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1050, minWidth: '200px' }}>
              <div className="list-group list-group-flush">
                <button className="list-group-item list-group-item-action" onClick={() => { setProfileMenuOpen(false); setSection('profil'); }}>
                  {t('client.header.menu.edit_profile')}
                </button>
                <button className="list-group-item list-group-item-action" onClick={() => { setProfileMenuOpen(false); window.location.hash = '#/modifierModpss'; }}>
                  {t('client.header.menu.edit_password')}
                </button>
                <button className="list-group-item list-group-item-action text-danger" onClick={async () => { setProfileMenuOpen(false); try { await logout(); } finally { window.location.hash = '#/connexion'; } }}>
                  {t('client.header.menu.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container-fluid px-2 px-md-4 py-3 py-md-4" style={{ backgroundColor: 'var(--bg)' }}>
        {/* Bouton retour vers le dashboard sur mobile, pour les autres sections */}
        {(isGotoDevis || section !== 'dashboard') && (
          <div className="d-md-none mb-3">
            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={() => { setSection('dashboard'); window.location.hash = '#/dashboard-client'; }}
            >
              Retour au tableau de bord
            </button>
          </div>
        )}

        {/* Toasts globaux gèrent désormais les messages */}
        {isGotoDevis ? (
          <NouveauDevis />
        ) : section === 'envois' ? (
          <TrackingApp />
        ) : section === 'fichiers' ? (
          <MesFichiersRecus />
        ) : section === 'profil' ? (
          <ModofierProfClient />
        ) : section === 'historique' ? (
          <HistoriqueDevis />
        ) : section === 'recherche' ? (
          <RechercheTransitaire />
        ) : section === 'devis' ? (
          <NouveauDevis />
        ) : (
          <div className="default-wrap">
            {/* Welcome Section */}
            <div className="mb-4">
              {showIntroWelcome && (
                <h1 className="h2 fw-bold mb-2">
                  Bonjour, {userDisplayName} !
                </h1>
              )}
              <p className="text-muted">{t('client.welcome.subtitle')}</p>
              <div className="small mt-2 p-2 p-md-3 rounded-3" style={{ backgroundColor: '#E0F2FE', color: '#0F172A' }}>
                <strong>Information :</strong>{' '}
                Votre devis peut être envoyé à tous les transitaires via la page <strong>Nouveau devis</strong>,<br />
                ou vous pouvez choisir un transitaire spécifique depuis la page <strong>Rechercher un transitaire</strong>.
              </div>
            </div>

            <div className="row g-2 g-md-3 g-lg-4">
              {/* Left Column */}
              <div className="col-12 col-lg-8">
                {/* Mes Devis Section */}
                <div className="card border-0 shadow-sm mb-4" style={{ backgroundColor: 'var(--card)' }}>
                  <div className="card-body" style={{ backgroundColor: 'var(--card)' }}>
                    <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
                      <h5 className="fw-bold mb-0">{t('client.quotes.title')}</h5>
                      <div className="d-flex flex-row flex-wrap align-items-center client-filter-group mt-1 mt-sm-0 gap-2">
                        <button
                          className={`btn btn-sm client-filter-btn client-filter-all ${devisFilter==='tous' ? 'client-filter-active' : ''}`}
                          onClick={()=>setDevisFilter('tous')}
                        >
                          {t('client.quotes.filter.all')}
                        </button>
                        <button
                          className={`btn btn-sm client-filter-btn client-filter-accepted ${devisFilter==='accepte' ? 'client-filter-active' : ''}`}
                          onClick={()=>setDevisFilter('accepte')}
                        >
                          {t('client.quotes.filter.accepted')}
                        </button>
                        <button
                          className={`btn btn-sm client-filter-btn client-filter-pending ${devisFilter==='attente' ? 'client-filter-active' : ''}`}
                          onClick={()=>setDevisFilter('attente')}
                        >
                          {t('client.quotes.filter.pending')}
                        </button>
                      </div>
                    </div>
                    <div className="d-flex flex-column gap-3">
                      {devis.filter(item => devisFilter==='tous' ? true : item.status===devisFilter).map((item) => (
                        <div key={item.id} className="border rounded-3 p-2 p-md-3 shadow-sm" style={{ background:'var(--card)' }}>
                          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2">
                            <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className={`badge rounded-pill px-2 px-md-3 py-1 py-md-2 ${item.status === 'accepte' ? 'bg-success' : item.status === 'refuse' ? 'bg-danger' : item.status === 'annule' ? 'bg-danger' : 'bg-warning text-dark' }`}>
                                  {item.status === 'accepte'
                                    ? t('client.quotes.status.accepted')
                                    : item.status === 'refuse'
                                      ? t('client.quotes.status.refused')
                                      : item.status === 'annule'
                                        ? t('client.quotes.status.canceled')
                                        : item.status === 'attente'
                                          ? t('client.quotes.status.waiting')
                                          : item.statusLabel}
                                </span>
                                <span className="text-muted small text-truncate" title={item.id} style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace', maxWidth: '150px' }}>#{String(item.id).slice(0,10)}…</span>
                              </div>
                              <div className="mt-2 fw-semibold" style={{ fontSize: '15px' }}>{item.routeLabel && item.routeLabel !== '-' ? item.routeLabel : t('client.quotes.route_missing')}</div>
                              <div className="text-muted small">{item.date}</div>
                            </div>
                            <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-start gap-2 flex-shrink-0 client-quote-actions text-end text-sm-start">
                              <a
                                className="btn btn-sm btn-outline-secondary btn-client-detail align-self-end align-self-sm-start"
                                style={{ minWidth: '120px' }}
                                href={`#/detail-devis-client?id=${encodeURIComponent(item.id)}`}
                              >
                                {t('client.quotes.detail')}
                              </a>
                              {item.status === 'attente' && (
                                confirmCancelId === item.id ? (
                                  <button
                                    className="btn btn-sm btn-danger btn-client-cancel-confirm align-self-end align-self-sm-start"
                                    style={{ minWidth: '120px' }}
                                    onClick={() => cancelDevis(item.id)}
                                  >
                                    {t('client.quotes.cancel.confirm')}
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      className="btn btn-sm btn-outline-primary btn-client-edit align-self-end align-self-sm-start"
                                      style={{ minWidth: '120px' }}
                                      onClick={() => onOpenEdit(item)}
                                    >
                                      {t('client.quotes.edit')}
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger btn-client-cancel align-self-end align-self-sm-start"
                                      style={{ minWidth: '120px' }}
                                      onClick={() => cancelDevis(item.id)}
                                    >
                                      {t('client.quotes.cancel')}
                                    </button>
                                  </>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 p-2 p-md-3 border-top">
                      <p className="text-muted small mb-0 text-center text-sm-start">{t('client.quotes.pagination.label')} {page} {total ? ` / ${Math.max(1, Math.ceil(total / limit))}` : ''}</p>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <select className="form-select form-select-sm" style={{ width: 80 }} value={limit} onChange={(e) => { const l = Number(e.target.value)||10; setLimit(l); setPage(1); fetchDevis({ page: 1, limit: l }); }}>
                          {[5,10,20,50].map(n => <option key={n} value={n}>{n}/p</option>)}
                        </select>
                        <nav>
                          <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => { if (page>1) { const p=page-1; setPage(p); fetchDevis({ page: p, limit }); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>{t('client.quotes.pagination.prev')}</button>
                            </li>
                            <li className={`page-item ${total && page >= Math.ceil(total/limit) ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => { const max = total ? Math.ceil(total/limit) : page+1; if (!total || page < max) { const p=page+1; setPage(p); fetchDevis({ page: p, limit }); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>{t('client.quotes.pagination.next')}</button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>

                
              </div>

              {/* Right Column */}
              <div className="col-12 col-lg-4">
                {/* Recent Activity */}
                <div className="card border-0 shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
                  <div className="card-body" style={{ backgroundColor: 'var(--card)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">{t('client.activity.title')}</h5>
                      <button className="btn btn-sm btn-link" onClick={onBellClick}>{t('client.activity.view_all')}</button>
                    </div>
                    <div className="d-flex flex-column gap-3">
                      {recentActivities.length === 0 && (
                        <div className="text-muted small">{t('client.activity.none')}</div>
                      )}
                      {recentActivities.map((a) => {
                        const isSuccess = a.type.includes('approve') || a.type.includes('appr') || a.type.includes('success');
                        const bgColor = isSuccess ? '#E8F5E9' : '#E3F2FD';
                        const iconColor = isSuccess ? '#28A745' : '#2196F3';
                        const Icon = isSuccess ? CheckCircle : Mail;
                        return (
                          <div key={a.id} className="d-flex gap-3">
                            <div className="rounded-circle p-2 flex-shrink-0" style={{ backgroundColor: bgColor, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon size={20} style={{ color: iconColor }} />
                            </div>
                            <div className="flex-grow-1">
                              <div className="small">{a.title}</div>
                              {a.text && <div className="text-muted small" style={{ whiteSpace: 'normal' }}>{a.text}</div>}
                              <div className="text-muted" style={{ fontSize: '12px' }}>{a.time}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {editOpen && (
          <>
            <div className="modal fade show" style={{ display:'block' }} tabIndex="-1" role="dialog" aria-modal="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Modifier la demande</h5>
                    <button type="button" className="btn-close" onClick={()=>setEditOpen(false)} aria-label="Fermer"></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Type de service</label>
                      <select className="form-select" value={editTypeService} onChange={(e)=>setEditTypeService(e.target.value)}>
                        <option value="">(inchangé)</option>
                        <option value="aerien">Aérien</option>
                        <option value="maritime">Maritime</option>
                        <option value="routier">Routier</option>
                        <option value="ferroviaire">Ferroviaire</option>
                      </select>
                    </div>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">Origine</label>
                        <input type="text" className="form-control" placeholder="Adresse d'enlèvement" value={editOrigin} onChange={(e)=>setEditOrigin(e.target.value)} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Destination</label>
                        <input type="text" className="form-control" placeholder="Adresse de livraison" value={editDestination} onChange={(e)=>setEditDestination(e.target.value)} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Date d'expiration</label>
                        <input type="date" className="form-control" value={editDateExpiration} onChange={(e)=>setEditDateExpiration(e.target.value)} />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label">Poids total (kg)</label>
                        <input type="number" className="form-control" value={editWeight} onChange={(e)=>setEditWeight(e.target.value)} />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label">Type d'emballage</label>
                        <select className="form-select" value={editPackageType} onChange={(e)=>setEditPackageType(e.target.value)}>
                          <option value="">(inchangé)</option>
                          <option value="palettes">Palettes</option>
                          <option value="cartons">Cartons</option>
                          <option value="caisses">Caisses</option>
                          <option value="containers">Containers</option>
                        </select>
                      </div>
                      <div className="col-4 col-md-2">
                        <label className="form-label">Longueur (cm)</label>
                        <input type="number" className="form-control" value={editLength} onChange={(e)=>setEditLength(e.target.value)} />
                      </div>
                      <div className="col-4 col-md-2">
                        <label className="form-label">Largeur (cm)</label>
                        <input type="number" className="form-control" value={editWidth} onChange={(e)=>setEditWidth(e.target.value)} />
                      </div>
                      <div className="col-4 col-md-2">
                        <label className="form-label">Hauteur (cm)</label>
                        <input type="number" className="form-control" value={editHeight} onChange={(e)=>setEditHeight(e.target.value)} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Adresse d'enlèvement</label>
                        <input type="text" className="form-control" value={editPickupAddress} onChange={(e)=>setEditPickupAddress(e.target.value)} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Date d'enlèvement</label>
                        <input type="date" className="form-control" value={editPickupDate} onChange={(e)=>setEditPickupDate(e.target.value)} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Adresse de livraison</label>
                        <input type="text" className="form-control" value={editDeliveryAddress} onChange={(e)=>setEditDeliveryAddress(e.target.value)} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Date de livraison</label>
                        <input type="date" className="form-control" value={editDeliveryDate} onChange={(e)=>setEditDeliveryDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows="4" placeholder="Détaillez votre demande" value={editDescription} onChange={(e)=>setEditDescription(e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Exigences supplémentaires</label>
                      <div className="d-flex gap-3 flex-wrap">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="editDangerous" checked={editDangerous} onChange={(e)=>setEditDangerous(e.target.checked)} />
                          <label className="form-check-label" htmlFor="editDangerous">Matières dangereuses</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="editTemperature" checked={editTemperature} onChange={(e)=>setEditTemperature(e.target.checked)} />
                          <label className="form-check-label" htmlFor="editTemperature">Contrôle de température</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="editFragile" checked={editFragile} onChange={(e)=>setEditFragile(e.target.checked)} />
                          <label className="form-check-label" htmlFor="editFragile">Fragile</label>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Notes additionnelles</label>
                      <textarea className="form-control" rows="3" placeholder="Notes optionnelles" value={editNotes} onChange={(e)=>setEditNotes(e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Pièces jointes (optionnel)</label>
                      <input className="form-control" type="file" multiple onChange={(e)=>setEditFiles(e.target.files)} />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={()=>setEditOpen(false)} disabled={editLoading}>Annuler</button>
                    <button type="button" className="btn btn-primary" onClick={onSubmitEdit} disabled={editLoading || !editId}>{editLoading ? 'Enregistrement…' : 'Enregistrer'}</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show" onClick={()=>setEditOpen(false)}></div>
          </>
        )}
      </div>
    </div>
  </div>
);
};

export default ClientDashboard;
