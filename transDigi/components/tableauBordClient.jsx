import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, Search, FileText, Truck, Clock, Settings, LogOut,
  CheckCircle, Mail, XCircle, X, User, Bell, MoreVertical, EyeOff, BellOff
} from 'lucide-react';
import { clientStyles, clientCss } from '../styles/tableauBordClientStyle.jsx';
import SideBare from './sideBare.jsx';
import RechercheTransitaire from './rechercheTransitaire.jsx';
import NouveauDevis from './nouveauDevis.jsx';
import NouveauDevisAdmin from './nouveauDevisAdmin.jsx';
import TrackingApp from './suiviEnvoi.jsx';
import ModofierProfClient from './modofierProfClient.jsx';
import HistoriqueDevis from './historiqueDevis.jsx';
import MesFichiersRecus from './mesFichiersRecus.jsx';
import { get, post, logout, listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount, cancelDevis as cancelDevisApi, listMesDevis as listMesDevisApi, updateMonDevis, getMonDevisById } from '../services/apiClient.js';
import { useToast } from './ui/ToastProvider.jsx';
import { getAuth, isAdmin as isAdminRole, isTrans as isTransRole } from '../services/authStore.js';
import { useI18n } from '../src/i18n.jsx';
import { useAuth } from '../services/authStore.js';
import { useNavigate, useLocation } from 'react-router-dom';

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
    if (h.startsWith('#/recherche-transitaire')) return 'recherche';
    if (h.startsWith('#/nouveau-devis-admin')) return 'devis-admin';
    if (h.startsWith('#/nouveau-devis')) return 'devis';
    if (h.startsWith('#/historique')) return 'historique';
    if (h.startsWith('#/profil-client')) return 'profil';
    if (h.startsWith('#/envois')) return 'envois';
    if (h.startsWith('#/fichiers-recus')) return 'fichiers';
    if (h.startsWith('#/dashboard-client')) return 'dashboard';
    return 'dashboard';
  });
  const chartId = 'clientActivityChart';
  const [chartFilter, setChartFilter] = useState('tous'); // tous|accepte|annule|attente|refuse
  const getStatusBadgeClass = (status) => {
    if (!status) return 'secondary';
    const s = status.toLowerCase();
    if (s.includes('accept')) return 'success';
    if (s.includes('refus') || s.includes('annul')) return 'danger';
    if (s.includes('attent') || s.includes('en cours')) return 'warning';
    return 'secondary';
  };
  const isGotoDevis = (typeof window !== 'undefined') && (() => {
    const h = (window.location.hash || '');
    return h.includes('goto=nouveau-devis') || h.startsWith('#/nouveau-devis?') || h.includes('translataireName=');
  })();
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try { return localStorage.getItem('avatarUrl') || ''; } catch { return ''; }
  });
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  useEffect(() => {
    const onStorage = () => {
      try { setAvatarUrl(localStorage.getItem('avatarUrl') || ''); } catch { }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Charger la photo de profil depuis l'API et la mÃ©moriser pour persistance entre sessions
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
          } catch { }
        }
        if (url && typeof url === 'string') {
          setAvatarUrl((prev) => {
            try { localStorage.setItem('avatarUrl', url); } catch { }
            return url;
          });
        }
      } catch { }
    })();
  }, []);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(null); // Pour gÃ©rer l'ouverture du menu d'options
  const [hiddenNotifs, setHiddenNotifs] = useState(new Set()); // Pour suivre les notifications masquÃ©es
  const [disabledNotifTypes, setDisabledNotifTypes] = useState(new Set()); // Pour dÃ©sactiver des types de notifications
  const loadNotifs = async () => {
    setNotifLoading(true);
    try {
      const data = await listNotifications(10);
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setNotifs(items);
      setUnreadCount(items.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setNotifLoading(false);
    }
  };
  const onBellClick = async () => { setNotifOpen((o) => !o); if (!notifOpen) await loadNotifs(); };
  const onNotifClick = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifs(prev => {
        const item = prev.find(n => n.id === id);
        const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
        setUnreadCount(next.filter(n => !n.read).length);
        // Router vers la ressource associÃ©e si connue
        try {
          const data = item?.data || {};
          if (data.devisId) {
            window.location.hash = `#/detail-devis-client?id=${encodeURIComponent(data.devisId)}`;
          } else if (data.translataireId) {
            // Ouvrir les avis du transitaire ciblÃ©
            const params = new URLSearchParams({ transId: String(data.translataireId), open: 'reviews' });
            window.location.hash = `#/recherche-transitaire?${params.toString()}`;
          }
        } catch { }
        return next;
      });
    } catch { }
  };
  // Masquer une notification spÃ©cifique
  const hideNotification = (id) => {
    setHiddenNotifs(prev => new Set([...prev, id]));
    setMenuOpen(null);
  };

  // DÃ©sactiver un type de notification
  const disableNotificationType = (type) => {
    setDisabledNotifTypes(prev => new Set([...prev, type]));
    setMenuOpen(null);
    // Ici, vous devriez Ã©galement appeler une API pour enregistrer cette prÃ©fÃ©rence
  };

  // VÃ©rifier si une notification doit Ãªtre affichÃ©e
  const shouldShowNotification = (notif) => {
    return !hiddenNotifs.has(notif.id) &&
      !(notif.type && disabledNotifTypes.has(notif.type));
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifs(prev => {
        const next = prev.map(n => ({ ...n, read: true }));
        setUnreadCount(0);
        return next;
      });
    } catch { }
  };
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
    // Guard: accÃ¨s client uniquement
    try {
      const { token } = getAuth();
      if (!token) {
        window.location.hash = '#/connexion';
      } else if (isAdminRole()) {
        window.location.hash = '#/tableau-bord-admin';
      } else if (isTransRole()) {
        window.location.hash = '#/dashboard-transitaire';
      }
    } catch { }

    const syncFromHash = () => {
      const hash = window.location.hash || '';
      const p = hash.split('?');
      if (p.length > 1) {
        const params = new URLSearchParams(p[1]);
        const goto = params.get('goto');
        if (goto === 'nouveau-devis') return setSection('devis-admin');
        if (goto === 'recherche-transitaire') return setSection('recherche');
        if (goto === 'historique') return setSection('historique');
        if (goto === 'envois') return setSection('envois');
        if (goto === 'profil-client') return setSection('profil');
        if (goto === 'fichiers') return setSection('fichiers');
      }
      if (hash.startsWith('#/historique')) setSection('historique');
      else if (hash.startsWith('#/dashboard-client')) setSection('dashboard');
      else if (hash.startsWith('#/nouveau-devis-admin')) setSection('devis-admin');
      else if (hash.startsWith('#/nouveau-devis')) setSection('devis');
      else if (hash.startsWith('#/recherche-transitaire')) setSection('recherche');
      else if (hash.startsWith('#/envois')) setSection('envois');
      else if (hash.startsWith('#/profil-client')) setSection('profil');
      else if (hash.startsWith('#/fichiers-recus')) setSection('fichiers');
    };
    const onHash = () => syncFromHash();
    window.addEventListener('hashchange', onHash);
    // Synchronisation immÃ©diate
    syncFromHash();
    // Si dÃ©jÃ  sur goto=nouveau-devis, forcer la section
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


  // Dessin de la courbe sur canvas (basÃ©e sur les devis rÃ©els des 12 derniers mois)
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const padding = 40;
    const maxVal = Math.max(1, Math.max(...counts)) * 1.2;
    const stepX = (width - padding * 2) / (counts.length - 1);

    // Fond (suivre le thÃ¨me)
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
          statusLabel: norm === 'accepte' ? 'AcceptÃ©' : norm === 'refuse' ? 'RefusÃ©' : norm === 'annule' ? 'AnnulÃ©' : 'En attente',
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
      const dateExp = dv.dateExpiration ? new Date(dv.dateExpiration).toISOString().slice(0, 10) : '';
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
const ClientDashboard = () => {
  // Charger 5 notifications récentes
  return (
    <div className="d-flex" style={{ ...clientStyles.layout, backgroundColor: 'var(--bg)' }}>
      <style>{clientCss}</style>
      <SideBare
        defaultOpen={true}
        open={sidebarOpen}
        hideItemsWhenCollapsed={true}
        disableMobileOverlay={true}
        onOpenChange={(o) => setSidebarOpen(!!o)}
        activeId={section}
        items={[
          { id: 'dashboard', label: t('client.sidebar.dashboard'), icon: LayoutGrid },
          { id: 'recherche', label: t('client.sidebar.search_forwarder'), icon: Search },
          { id: 'devis-admin', label: t('client.sidebar.new_quote'), icon: FileText },
          { id: 'historique', label: t('client.sidebar.history'), icon: Clock },
          { id: 'envois', label: t('client.sidebar.shipments'), icon: Truck },
          { id: 'fichiers', label: t('client.sidebar.files_received'), icon: FileText },
          { id: 'profil', label: t('client.sidebar.profile'), icon: User },
        ]}
        onNavigate={(id) => {
          setSection(id);
          if (id === 'dashboard') {
            window.location.hash = '#/dashboard-client';
          } else if (id === 'recherche') {
            window.location.hash = '#/recherche-transitaire';
          } else if (id === 'devis-admin') {
            window.location.hash = '#/nouveau-devis-admin';
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
      <div className="flex-grow-1" style={{ marginLeft: isLgUp ? (sidebarOpen ? '240px' : '56px') : '0', transition: 'margin 0.3s ease', backgroundColor: 'var(--bg)' }}>
        {/* En-tête avec barre de navigation */}
        <div className="w-100 d-flex justify-content-between align-items-center gap-2 px-2 px-md-3 py-2 bg-body border-bottom" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--card)' }}>
          <div className="d-flex align-items-center gap-2">
            {!isLgUp && (
              <button
                className="btn btn-link p-1 me-1"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ color: 'var(--text)' }}
              >
                <Menu size={24} />
              </button>
            )}
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px', padding: '4px 6px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="rounded-circle"
              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            />
          ) : (
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              {userInitials || <User size={20} />}
            </div>
          )}
          <button
            className="btn btn-link p-1"
            onClick={onProfileClick}
            style={{ color: 'var(--text)' }}
          >
            <User size={24} />
          </button>
          <button
            className="btn btn-link p-1"
            onClick={onLogout}
            style={{ color: 'var(--text)' }}
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">ActivitÃ</h5>
        </div>
      </div>
    </div>
  </div>
);

export default ClientDashboard;