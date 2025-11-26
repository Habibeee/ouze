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

const ClientDashboard = () => {
  const toast = useToast();
  const { t } = useI18n();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLgUp, setIsLgUp] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 992 : true));

  // Fonction pour obtenir le nom d'affichage de l'utilisateur
  const getUserDisplayName = () => {
    try {
      const auth = getAuth();
      if (auth?.user?.displayName) return auth.user.displayName;
      if (auth?.user?.prenom || auth?.user?.nom) {
        return `${auth.user.prenom || ''} ${auth.user.nom || ''}`.trim();
      }
      return auth?.user?.email || 'Utilisateur';
    } catch {
      return 'Utilisateur';
    }
  };

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
      try { setAvatarUrl(localStorage.getItem('avatarUrl') || ''); } catch {}
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
  const notifRef = React.createRef(null);
  const [menuOpen, setMenuOpen] = useState(null); // Pour gÃ©rer l'ouverture du menu d'options
  const [hiddenNotifs, setHiddenNotifs] = useState(new Set()); // Pour suivre les notifications masquÃ©es
  const [disabledNotifTypes, setDisabledNotifTypes] = useState(new Set()); // Pour dÃ©sactiver des types de notifications
  const loadNotifs = async () => {
    try { setNotifLoading(true); const data = await listNotifications(10); const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []); setNotifs(items); setUnreadCount(items.filter(n=>!n.read).length); } catch {} finally { setNotifLoading(false); }
  };
  // Fermer le menu des notifications lors d'un clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const onBellClick = async (e) => {
    e.stopPropagation();
    const newState = !notifOpen;
    setNotifOpen(newState);
    if (newState) {
      await loadNotifs();
    } else {
      // Marquer les notifications comme lues lorsqu'on ferme le menu
      if (notifs.some(n => !n.read)) {
        const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
        unreadIds.forEach(id => markNotificationRead(id));
      }
    }
  };
  const onNotifClick = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifs(prev => {
        const item = prev.find(n => n.id === id);
        const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
        setUnreadCount(next.filter(n=>!n.read).length);
        // Router vers la ressource associÃ©e si connue
        try {
          const data = item?.data || {};
          if (data.devisId) {
            window.location.hash = `#/detail-devis-client?id=${encodeURIComponent(data.devisId)}`;
          } else if (data.translataireId) {
            // Ouvrir les avis du transitaire ciblÃ
            const params = new URLSearchParams({ transId: String(data.translataireId), open: 'reviews' });
            window.location.hash = `#/recherche-transitaire?${params.toString()}`;
          }
        } catch {}
        return next;
      });
    } catch {}
  };
  // Masquer une notification spÃcifique
  const hideNotification = (id) => {
    setHiddenNotifs(prev => new Set([...prev, id]));
    setMenuOpen(null);
  };

  // DÃsactiver un type de notification
  const disableNotificationType = (type) => {
    setDisabledNotifTypes(prev => new Set([...prev, type]));
    setMenuOpen(null);
    // Ici, vous devriez Ãgalement appeler une API pour enregistrer cette prÃfÃrence
  };

  // VÃrifier si une notification doit Ãªtre affichÃe
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
    } catch {} 
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
    } catch {}

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
    // Synchronisation immÃdiate
    syncFromHash();
    // Si dÃjÃ  sur goto=nouveau-devis, forcer la section
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
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [stats, setStats] = useState({});
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

  // Fonction pour gérer le clic sur le profil
  const onProfileClick = () => {
    setSection('profil');
    window.location.hash = '#/profil-client';
  };

  // Fonction pour gérer la déconnexion
  const onLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Récupérer l'email de l'utilisateur
  const userEmail = getAuth()?.user?.email || '';
  const userDisplayName = getUserDisplayName();

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
      const arr = Array.isArray(items?.items)
        ? items.items
        : Array.isArray(items)
        ? items
        : [];

      const mapped = arr
        .filter(n =>
          shouldShowNotification({
            id: n.id || n._id || String(Math.random()),
            type: n.type || 'general',
          })
        )
        .slice(0, 5)
        .map(n => ({
          id: n.id || n._id || String(Math.random()),
          title: n.title || 'Nouvelle notification',
          message: n.body || n.message || '',
          date: n.createdAt ? new Date(n.createdAt) : new Date(),
          read: n.read || false,
          type: n.type || 'general',
          data: n.data || {},
        }));

      setRecentActivities(mapped);
    } catch (e) {
      console.error("Erreur chargement notifications", e);
    }
  })();
}, []);

  return (
    <div className="d-flex" style={{ ...clientStyles.layout, backgroundColor: 'var(--bg)' }}>
      <style>{clientCss}</style>
      <SideBare
        defaultOpen={true}
        open={sidebarOpen}
        hideItemsWhenCollapsed={true}
        disableMobileOverlay={true}
        onOpenChange={(o)=>setSidebarOpen(!!o)}
        activeId={section}
        items={[
          { id: 'dashboard', label: t('client.sidebar.dashboard'), icon: LayoutGrid },
          { id: 'recherche', label: t('client.sidebar.search_forwarder'), icon: Search },
          { id: 'devis-admin', label: t('client.sidebar.new_quote'), icon: FileText },
          { id: 'historique', label: t('client.sidebar.history'), icon: Clock },
          { id: 'envois', label: t('client.sidebar.shipments'), icon: Truck },
          { id: 'fichiers', label: t('client.sidebar.files_received'), icon: FileText },
          { id: 'profil', label: t('client.sidebar.profile'), icon: User }
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
            <h1 className="h5 mb-0 d-none d-md-block">
              {section === 'dashboard' && t('client.dashboard.title')}
              {section === 'recherche' && t('client.search.title')}
              {section === 'devis' && t('client.quotes.new')}
              {section === 'devis-admin' && t('client.quotes.new')}
              {section === 'historique' && t('client.history.title')}
              {section === 'envois' && t('client.shipments.title')}
              {section === 'fichiers' && t('client.files.title')}
              {section === 'profil' && t('client.profile.title')}
            </h1>
          </div>
          <div className="d-flex align-items-center gap-2">
            {/* Bouton de notification */}
            <div className="position-relative" ref={notifRef}>
              <button
                className={`btn btn-light position-relative p-2 ${notifOpen ? 'active' : ''}`}
                onClick={onBellClick}
                style={{ borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px', padding: '4px 6px' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div 
                  className="dropdown-menu show" 
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    backgroundColor: 'var(--bs-gray-800)',
                    border: '1px solid var(--bs-gray-700)',
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
                        onClick={onMarkAll}
                      >
                        <small>Marquer tout comme lu</small>
                      </button>
                    </div>
                  </div>
                  <div className="list-group list-group-flush">
                    {/* Notification client - Compte approuvé */}
                    <div className="list-group-item list-group-item-action bg-light">
                      <div className="d-flex justify-content-between">
                        <h6 className="mb-1">Compte approuvé</h6>
                        <small className="text-muted">23/11/2025</small>
                      </div>
                      <p className="mb-1 small">Votre compte a été approuvé. Vous pouvez vous connecter.</p>
                    </div>

                    {/* Notification client - Devis accepté */}
                    <div className="list-group-item list-group-item-action">
                      <div className="d-flex justify-content-between">
                        <h6 className="mb-1">Votre demande de devis a été acceptée</h6>
                        <small className="text-muted">23/11/2025</small>
                      </div>
                      <p className="mb-1 small">Le translataire a accepté votre demande avec un montant de 2 000 000 FCFA.</p>
                    </div>

                    {/* Notification client - Devis accepté */}
                    <div className="list-group-item list-group-item-action">
                      <div className="d-flex justify-content-between">
                        <h6 className="mb-1">Votre demande de devis a été acceptée</h6>
                        <small className="text-muted">22/11/2025</small>
                      </div>
                      <p className="mb-1 small">Le translataire a accepté votre demande avec un montant de 15 000 000 FCFA.</p>
                    </div>

                    {/* Notifications dynamiques depuis l'API */}
                    {notifs.map((notif, index) => (
                      <div 
                        key={`api-${index}`}
                        className={`list-group-item list-group-item-action ${!notif.read ? 'bg-light' : ''}`}
                        style={{ borderLeft: 'none', borderRight: 'none' }}
                        onClick={() => onNotifClick(notif.id)}
                      >
                        <div className="d-flex justify-content-between">
                          <h6 className="mb-1">{notif.title}</h6>
                          <small className="text-muted">
                            {new Date(notif.date).toLocaleDateString()}
                          </small>
                        </div>
                        <p className="mb-1 small">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Menu profil */}
            <div className="position-relative">
              <button
                className="btn btn-link text-decoration-none p-0"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                style={{ color: 'var(--text)' }}
              >
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
              </button>
              {profileMenuOpen && (
                <div className="dropdown-menu dropdown-menu-end show" style={{ position: 'absolute', right: 0, marginTop: '8px', zIndex: 1000, minWidth: '200px' }}>
                  <div className="dropdown-header d-flex flex-column align-items-center py-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="rounded-circle mb-2"
                        style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mb-2" style={{ width: '64px', height: '64px' }}>
                        {userInitials || <User size={28} />}
                      </div>
                    )}
                    <div className="text-center">
                      <div className="fw-bold">{getUserDisplayName()}</div>
                      <div className="text-muted small">{userEmail || ''}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item d-flex align-items-center gap-2" onClick={onProfileClick}>
                    <User size={16} /> {t('client.profile.title')}
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item d-flex align-items-center gap-2 text-danger" onClick={onLogout}>
                    <LogOut size={16} /> {t('client.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Activité récente</h5>
            <button className="btn btn-link p-0" onClick={onMarkAll}>
              <small>Marquer tout comme lu</small>
            </button>
          </div>
          <div className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {recentActivities.map((activity, index) => (
              <div 
                key={index} 
                className={`list-group-item list-group-item-action ${!activity.read ? 'fw-bold' : ''}`}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <div 
                  className="d-flex w-100 justify-content-between"
                  onClick={() => onNotifClick(activity.id)}
                >
                  <h6 className="mb-1">{activity.title}</h6>
                  <div className="d-flex align-items-center">
                    <small className="text-muted me-2">
                      {activity.date.toLocaleDateString()}
                    </small>
                    <div className="dropdown">
                      <button 
                        className="btn btn-link p-0 text-muted" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === activity.id ? null : activity.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen === activity.id && (
                        <div 
                          className="dropdown-menu show" 
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '30px',
                            backgroundColor: 'var(--bs-gray-800)',
                            border: '1px solid var(--bs-gray-700)',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '220px'
                          }}
                        >
                          <button 
                            className="dropdown-item text-white d-flex align-items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              hideNotification(activity.id);
                            }}
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <EyeOff size={16} />
                            <span>Masquer cette notification</span>
                          </button>
                          <button 
                            className="dropdown-item text-white d-flex align-items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activity.type) {
                                disableNotificationType(activity.type);
                              }
                            }}
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <BellOff size={16} />
                            <span>Désactiver ce type de notification</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p 
                  className="mb-1"
                  onClick={() => onNotifClick(activity.id)}
                >
                  {activity.message}
                </p>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="text-center py-4 text-muted">
                Aucune activité récente
              </div>
            )}
          </div>
        </div>
        
        <style jsx>{`
          .dropdown-menu {
            --bs-dropdown-bg: var(--bs-gray-800);
            --bs-dropdown-link-color: var(--bs-white);
            --bs-dropdown-link-hover-color: var(--bs-white);
            --bs-dropdown-link-hover-bg: var(--bs-gray-700);
          }
          .dropdown-item {
            padding: 0.5rem 1rem;
          }
          .dropdown-item:hover {
            background-color: var(--bs-gray-700);
          }
        `}</style> 
        {/* Contenu principal */}
        <div className="container-fluid px-3 px-md-4 py-3">
          {section === 'dashboard' ? (
            <div className="row">
              {/* Section principale - Gauche */}
              <div className="col-12 col-lg-8">
                {/* Carte de bienvenue */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <h2 className="h4 fw-bold mb-3">
                      {t('client.dashboard.welcome')}, {userDisplayName} !
                    </h2>
                    <p className="text-muted mb-0">
                      {t('client.dashboard.subtitle')}
                    </p>
                  </div>
                </div>

                {/* Mes devis récents */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">Mes devis récents</h5>
                      <a href="#/historique" className="btn btn-sm btn-link">
                        Voir tout
                      </a>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead>
                          <tr>
                            <th>Référence</th>
                            <th>Client</th>
                            <th>Statut</th>
                            <th>Date</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentQuotes && recentQuotes.length > 0 ? (
                            recentQuotes.map((quote, index) => (
                              <tr key={index}>
                                <td>{quote.reference || `DEVIS-${quote.id}`}</td>
                                <td>{quote.clientName || 'N/A'}</td>
                                <td>
                                  <span className={`badge bg-${getStatusBadgeClass(quote.status)}`}>
                                    {quote.status}
                                  </span>
                                </td>
                                <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                                <td className="text-end">
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => onOpenEdit(quote)}
                                  >
                                    Voir
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center py-4 text-muted">
                                Aucun devis récent
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section de droite - Activité récente et statistiques */}
              <div className="col-12 col-lg-4">
                {/* Activité récente */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">Activité récente</h5>
                      <button 
                        className="btn btn-link p-0" 
                        onClick={onBellClick}
                        title="Voir toutes les notifications"
                      >
                        <Bell size={18} />
                      </button>
                    </div>
                    <div className="d-flex flex-column gap-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {recentActivities && recentActivities.length > 0 ? (
                        recentActivities.map((activity, index) => (
                          <div key={index} className="d-flex gap-2 p-2 rounded" style={{ backgroundColor: 'var(--bs-gray-100)' }}>
                            <div className="flex-shrink-0">
                              <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                                <Bell size={18} className="text-primary" />
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <div className="small fw-medium">{activity.title}</div>
                              <div className="small text-muted">{activity.text}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {new Date(activity.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-3 text-muted">
                          Aucune activité récente
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistiques rapides */}
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="fw-bold mb-3">Statistiques</h5>
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Devis en attente</span>
                        <span className="badge bg-warning text-dark">
                          {stats?.pendingQuotes || 0}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Devis acceptés</span>
                        <span className="badge bg-success">
                          {stats?.acceptedQuotes || 0}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Devis refusés</span>
                        <span className="badge bg-danger">
                          {stats?.rejectedQuotes || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {section === 'recherche' && <RechercheTransitaire />}
              {section === 'devis' && <NouveauDevis />}
              {section === 'devis-admin' && <NouveauDevisAdmin />}
              {section === 'historique' && <HistoriqueDevis />}
              {section === 'envois' && <TrackingApp />}
              {section === 'fichiers' && <MesFichiersRecus />}
              {section === 'profil' && <ModofierProfClient />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;