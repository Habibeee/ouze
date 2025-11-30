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
import { get, post, logout, listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount, cancelDevis as cancelDevisApi, listMesDevis as listMesDevisApi, updateMonDevis, getMonDevisById, archiveDevis } from '../services/apiClient.js';
import { useToast } from './ui/ToastProvider.jsx';
import { getAuth, isAdmin as isAdminRole, isTrans as isTransRole } from '../services/authStore.js';

const ClientDashboard = () => {
  const toast = useToast();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLgUp, setIsLgUp] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 992 : true));
  const [section, setSection] = useState('dashboard'); // État pour gérer la section active
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(() => {
    // Vérifier si c'est une nouvelle session (premier chargement)
    return !sessionStorage.getItem('welcomeMessageShown');
  });
  const [userName, setUserName] = useState('');
  
  // Récupérer le nom de l'utilisateur au chargement du composant
  useEffect(() => {
    const user = getAuth();
    if (user && user.user) {
      setUserName(user.user.name || user.user.email.split('@')[0]);
    }
  }, []);

  // Gérer l'affichage du message de bienvenue
  useEffect(() => {
    if (showWelcomeMessage) {
      // Marquer comme affiché dans la session
      sessionStorage.setItem('welcomeMessageShown', 'true');
      
      // Cacher le message après 10 secondes
      const timer = setTimeout(() => {
        setShowWelcomeMessage(false);
      }, 10000);

      // Nettoyer le timer si le composant est démonté
      return () => clearTimeout(timer);
    }
  }, [showWelcomeMessage]);

  useEffect(() => {
    const onResize = () => setIsLgUp(window.innerWidth >= 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // Gestion de la section active basée sur l'URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateSection = () => {
      const h = (window.location.hash || '').split('?')[0];
      switch (h) {
        case '#/recherche-transitaire': 
          setSection('recherche');
          break;
        case '#/nouveau-devis': 
          setSection('devis');
          break;
        case '#/historique': 
          setSection('historique');
          break;
        case '#/profil-client': 
        case '#/profil-client/modifier': 
          setSection('profil');
          break;
        case '#/envois': 
          setSection('envois');
          break;
        case '#/dashboard-client': 
        default:
          setSection('dashboard');
      }
    };

    window.addEventListener('hashchange', updateSection);
    updateSection(); // Appel initial

    return () => window.removeEventListener('hashchange', updateSection);
  }, []);
  const chartId = 'clientActivityChart';
  const [chartFilter, setChartFilter] = useState('tous'); // tous|accepte|annule|attente|refuse
  const isGotoDevis = (typeof window !== 'undefined') && (() => {
    const h = (window.location.hash || '');
    return h.includes('goto=nouveau-devis') || h.startsWith('#/nouveau-devis') || h.includes('translataireName=');
  })();
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try { return localStorage.getItem('avatarUrl') || 'https://i.pravatar.cc/64?img=5'; } catch { return 'https://i.pravatar.cc/64?img=5'; }
  });
  useEffect(() => {
    const onStorage = () => {
      try { setAvatarUrl(localStorage.getItem('avatarUrl') || 'https://i.pravatar.cc/64?img=5'); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Charger la photo de profil depuis l'API et la mémoriser pour persistance entre sessions
  useEffect(() => {
    (async () => {
      try {
        const prof = await get('/users/profile');
        const url = prof?.user?.photoProfil;
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
      }
      if (hash.startsWith('#/historique')) setSection('historique');
      else if (hash.startsWith('#/dashboard-client')) setSection('dashboard');
      else if (hash.startsWith('#/nouveau-devis')) setSection('devis');
      else if (hash.startsWith('#/recherche-transitaire')) setSection('recherche');
      else if (hash.startsWith('#/envois')) setSection('envois');
      else if (hash.startsWith('#/profil-client')) setSection('profil');
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
    await fetchDevis({ page, limit });
    toast.success('Le devis a été annulé avec succès');
  } catch (e) {
    toast.error(e?.message || 'Erreur lors de l\'annulation du devis');
  } finally {
    setConfirmCancelId(null);
  }
};

const [isArchiving, setIsArchiving] = useState(false);

const handleArchive = async (id) => {
  if (!id) {
    toast.error('ID de devis manquant');
    return;
  }
  
  if (!window.confirm('Êtes-vous sûr de vouloir archiver ce devis ?')) {
    return;
  }
  
  setIsArchiving(true);
  try {
    const response = await archiveDevis(id);
    
    if (response && response.success === false) {
      throw new Error(response.message || 'Échec de l\'archivage du devis');
    }
    
    // Rafraîchir la liste des devis
    await fetchDevis({ page, limit });
    
    toast.success('Le devis a été archivé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'archivage du devis:', error);
    
    // Gestion des erreurs spécifiques
    if (error.response) {
      // Erreur avec réponse du serveur (4xx, 5xx)
      if (error.response.status === 404) {
        toast.error('La ressource demandée est introuvable. Veuillez réessayer.');
      } else if (error.response.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        // Rediriger vers la page de connexion si nécessaire
        window.location.href = '/connexion';
      } else {
        const errorMessage = error.response.data?.message || 'Une erreur est survenue lors de l\'archivage du devis';
        toast.error(errorMessage);
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      toast.error('Pas de réponse du serveur. Vérifiez votre connexion internet.');
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      toast.error(error.message || 'Erreur lors de la préparation de la requête');
    }
  } finally {
    setIsArchiving(false);
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
  try {
    const candidates = [
      'userName','username','name','prenom','firstName','fullName','displayName','email'
    ];
    for (const k of candidates) {
      const v = localStorage.getItem(k);
      if (v && v.trim()) return v.trim();
    }
  } catch {}
  return 'Bienvenue';
};
const userDisplayName = getUserDisplayName();

// Ajouter une classe au body pour gérer l'état du menu
useEffect(() => {
  const body = document.body;
  if (sidebarOpen) {
    body.classList.add('sidebar-open');
    body.classList.remove('sidebar-collapsed');
  } else {
    body.classList.add('sidebar-collapsed');
    body.classList.remove('sidebar-open');
  }
  
  // Nettoyer les classes au démontage
  return () => {
    body.classList.remove('sidebar-open', 'sidebar-collapsed');
  };
}, [sidebarOpen]);

return (
  <div className="d-flex" style={{ ...clientStyles.layout, backgroundColor: 'var(--bg)', position: 'relative' }}>
    <style>{clientCss}</style>
    <style>{
      `:root {
        --sidebar-width: ${sidebarOpen ? '240px' : '56px'};
        --content-transition: ${clientStyles.contentTransition};
      }`
    }</style>
    <SideBare
      defaultOpen={true}
      open={sidebarOpen}
      onOpenChange={(o) => setSidebarOpen(!!o)}
      activeId={section}
      items={[
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
        { id: 'recherche', label: 'Trouver un transitaire', icon: Search },
        { id: 'devis', label: 'Nouveau devis', icon: FileText },
        { id: 'historique-devis', label: 'Historique de devis', icon: FileText },
        { id: 'envois', label: 'Suivi des envois', icon: Truck },
        { id: 'fichiers-recus', label: 'Mes fichiers reçus', icon: FileText },
        { id: 'profil', label: 'Mon profil', icon: User },
      ]}
      onNavigate={(id) => {
        setSection(id);
        if (id === 'dashboard') {
          window.location.hash = '#/dashboard-client';
        } else if (id === 'recherche') {
          window.location.hash = '#/recherche-transitaire';
        } else if (id === 'devis') {
          window.location.hash = '#/nouveau-devis';
        } else if (id === 'envois') {
          window.location.hash = '#/envois';
        } else if (id === 'profil') {
          window.location.hash = '#/profil-client';
        } else if (id === 'historique-devis') {
          window.location.hash = '#/historique-devis';
        } else if (id === 'fichiers-recus') {
          window.location.hash = '#/mes-fichiers-recus';
        }
      }}
    />
  
    {/* Main Content */}
    <div className="flex-grow-1" style={{ 
      paddingLeft: 0, 
      minWidth: 0, 
      position: 'relative', 
      backgroundColor: 'var(--bg)',
      minHeight: 'calc(100vh - 96px)',
      marginTop: '96px'
    }}>
      {/* Header fixe en haut de la page */}
      <div className="w-100 d-flex align-items-center gap-2 px-2 px-md-3 py-2" style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: isLgUp ? (sidebarOpen ? '240px' : '56px') : '0',
        zIndex: 1000,
        backgroundColor: 'var(--card)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'left 0.3s ease',
        height: '64px',
        alignItems: 'center'
      }}>
        {/* Hamburger menu button - visible only on mobile */}
        {!isLgUp && (
          <button 
            className="btn btn-link p-1" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
            style={{ marginRight: 'auto' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        <div className="ms-auto d-flex align-items-center gap-2 position-relative">
          <button className="btn btn-link position-relative" onClick={onBellClick} aria-label="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{unreadCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className="card shadow-sm" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1050, minWidth: 320 }}>
              <div className="card-body p-0">
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                  <div className="fw-semibold">Notifications</div>
                  <button className="btn btn-sm btn-link" onClick={onMarkAll}>Tout marquer lu</button>
                </div>
                {notifLoading ? (
                  <div className="p-3 small text-muted">Chargement...</div>
                ) : (
                  <div className="list-group list-group-flush">
                    {(notifs.length ? notifs : []).map(n => (
                      <button key={n.id || n._id} className={`list-group-item list-group-item-action d-flex justify-content-between ${n.read ? '' : 'fw-semibold'}`} onClick={() => onNotifClick(n.id || n._id, n)}>
                        <div className="me-2" style={{ whiteSpace: 'normal', textAlign: 'left' }}>
                          <div>{n.title || 'Notification'}</div>
                          {n.body && <div className="small text-muted">{n.body}</div>}
                        </div>
                        {!n.read && <span className="badge bg-primary">Nouveau</span>}
                      </button>
                    ))}
                    {!notifs.length && <div className="p-3 small text-muted">Aucune notification</div>}
                  </div>
                )}
              </div>
            </div>
          )}
          <button className="btn p-0 border-0 bg-transparent" onClick={() => setProfileMenuOpen(!profileMenuOpen)} aria-label="Ouvrir menu profil">
            <img src={avatarUrl} alt="Profil" className="rounded-circle" style={{ width: 36, height: 36, objectFit: 'cover', border: '2px solid #e9ecef' }} />
          </button>
          {profileMenuOpen && (
            <div className="card shadow-sm" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1050, minWidth: '200px' }}>
              <div className="list-group list-group-flush">
                <button className="list-group-item list-group-item-action" onClick={() => { setProfileMenuOpen(false); setSection('profil'); }}>
                  Modifier profil
                </button>
                <button className="list-group-item list-group-item-action" onClick={() => { setProfileMenuOpen(false); window.location.hash = '#/modifierModpss'; }}>
                  Modifier mot de passe
                </button>
                <button className="list-group-item list-group-item-action text-danger" onClick={async () => { setProfileMenuOpen(false); try { await logout(); } finally { window.location.hash = '#/connexion'; } }}>
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container-fluid px-2 px-md-4 py-3 py-md-4" style={{ backgroundColor: 'var(--bg)' }}>
        {/* Toasts globaux gèrent désormais les messages */}
        {(() => {
          if (isGotoDevis) {
            return <NouveauDevis />;
          }
          switch(section) {
            case 'envois':
              return <TrackingApp />;
            case 'profil':
              return <ModofierProfClient />;
            case 'historique':
              return <HistoriqueDevis />;
            case 'recherche':
              return <RechercheTransitaire />;
            case 'devis':
              return <NouveauDevis />;
            case 'dashboard':
            default:
              return (
          <div className="default-wrap">
            {/* Welcome Section */}
            <div className="mb-4">
              <h1 className="h2 fw-bold mb-2">Bonjour, {userDisplayName} !</h1>
              <p className="text-muted">Voici un aperçu de votre activité récente.</p>
            </div>

            <div className="row g-2 g-md-3 g-lg-4">
              {/* Left Column */}
              <div className="col-12 col-lg-8">
                {/* Mes Devis Section */}
                <div className="card border-0 shadow-sm mb-4" style={{ backgroundColor: 'var(--card)' }}>
                  <div className="card-body" style={{ backgroundColor: 'var(--card)' }}>
                    <div className="d-flex flex-column align-items-center mb-4">
                      <h5 className="fw-bold mb-3">Mes devis</h5>
                      <div className="d-flex gap-2">
                        <button 
                          className={`btn btn-sm ${devisFilter==='tous' ? 'text-white bg-success' : 'text-dark'}`} 
                          style={{
                            backgroundColor: devisFilter==='tous' ? '' : 'transparent',
                            border: '1px solid #dee2e6',
                            minWidth: '80px',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1987541a'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = devisFilter==='tous' ? '#198754' : 'transparent'}
                          onClick={()=>setDevisFilter('tous')}
                        >
                          Tous
                        </button>
                        <button 
                          className={`btn btn-sm ${devisFilter==='accepte' ? 'text-white bg-success' : 'text-dark'}`}
                          style={{
                            backgroundColor: devisFilter==='accepte' ? '#198754' : 'transparent',
                            border: '1px solid #dee2e6',
                            minWidth: '80px',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1987541a'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = devisFilter==='accepte' ? '#198754' : 'transparent'}
                          onClick={()=>setDevisFilter('accepte')}
                        >
                          Acceptés
                        </button>
                        <button 
                          className={`btn btn-sm ${devisFilter==='attente' ? 'text-white bg-success' : 'text-dark'}`}
                          style={{
                            backgroundColor: devisFilter==='attente' ? '#198754' : 'transparent',
                            border: '1px solid #dee2e6',
                            minWidth: '80px',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1987541a'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = devisFilter==='attente' ? '#198754' : 'transparent'}
                          onClick={()=>setDevisFilter('attente')}
                        >
                          En attente
                        </button>
                      </div>
                    </div>
                    <div className="d-flex flex-column gap-3">
                      {devis.filter(item => devisFilter==='tous' ? true : item.status===devisFilter).map((item) => (
                        <div key={item.id} className="border rounded-3 p-2 p-md-3 shadow-sm" style={{ background:'var(--card)' }}>
                          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2">
                            <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className={`badge rounded-pill px-2 px-md-3 py-1 py-md-2 ${item.status === 'accepte' ? 'bg-success' : item.status === 'refuse' ? 'bg-danger' : item.status === 'annule' ? 'bg-secondary' : 'bg-warning text-dark' }`}>{item.statusLabel}</span>
                                <span className="text-muted small text-truncate" title={item.id} style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace', maxWidth: '150px' }}>#{String(item.id).slice(0,10)}…</span>
                              </div>
                              <div className="mt-2 fw-semibold" style={{ fontSize: '15px' }}>{item.routeLabel && item.routeLabel !== '-' ? item.routeLabel : 'Itinéraire non renseigné'}</div>
                              <div className="text-muted small">{item.date}</div>
                            </div>
                            <div className="d-flex flex-row flex-wrap align-items-start gap-2 flex-shrink-0">
                              <a 
                                className="btn btn-sm" 
                                href={`#/detail-devis-client?id=${encodeURIComponent(item.id)}`}
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#0d6efd',
                                  border: '1px solid #0d6efd',
                                  borderRadius: '6px',
                                  padding: '0.375rem 0.75rem',
                                  minWidth: '90px',
                                  transition: 'all 0.2s ease-in-out',
                                  height: '32px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = '#0d6efd';
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#0d6efd';
                                }}
                              >
                                Détail
                              </a>
                              {item.status === 'attente' && (
                                confirmCancelId === item.id ? (
                                  <button 
                                    className="btn btn-sm" 
                                    onClick={() => cancelDevis(item.id)}
                                    style={{
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: '1px solid #dc3545',
                                      borderRadius: '6px',
                                      padding: '0.375rem 0.75rem',
                                      minWidth: '100px',
                                      height: '32px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease-in-out'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.opacity = '0.85';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.opacity = '1';
                                    }}
                                  >
                                    Confirmer
                                  </button>
                                ) : (
                                  <>
                                    <button 
                                      className="btn btn-sm" 
                                      onClick={() => onOpenEdit(item)}
                                      style={{
                                        backgroundColor: 'transparent',
                                        color: '#0dcaf0',
                                        border: '1px solid #0dcaf0',
                                        borderRadius: '6px',
                                        padding: '0.375rem 0.75rem',
                                        minWidth: '90px',
                                        height: '32px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease-in-out'
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#0dcaf0';
                                        e.currentTarget.style.color = 'white';
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#0dcaf0';
                                      }}
                                    >
                                      Modifier
                                    </button>
                                    <button 
                                      className="btn btn-sm" 
                                      onClick={() => setConfirmCancelId(item.id)}
                                      style={{
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: '1px solid #dc3545',
                                        borderRadius: '6px',
                                        padding: '0.375rem 0.75rem',
                                        minWidth: '90px',
                                        height: '32px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease-in-out'
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.opacity = '0.9';
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                      }}
                                    >
                                      Annuler
                                    </button>
                                  </>
                                )
                              )}
                              <button
                                className="btn btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(item.id);
                                }}
                                disabled={isArchiving}
                                title="Archiver ce devis"
                                style={{
                                  backgroundColor: isArchiving ? 'transparent' : 'transparent',
                                  color: isArchiving ? '#6c757d' : '#fd7e14',
                                  border: isArchiving ? '1px solid #6c757d' : '1px solid #fd7e14',
                                  borderRadius: '6px',
                                  padding: '0.375rem 0.75rem',
                                  minWidth: '90px',
                                  height: '32px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease-in-out',
                                  opacity: isArchiving ? '0.7' : '1',
                                  cursor: isArchiving ? 'not-allowed' : 'pointer'
                                }}
                                onMouseOver={(e) => {
                                  if (!isArchiving) {
                                    e.currentTarget.style.backgroundColor = '#fd7e14';
                                    e.currentTarget.style.color = 'white';
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (!isArchiving) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#fd7e14';
                                  }
                                }}
                              >
                                {isArchiving ? (
                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                ) : null}
                                {isArchiving ? 'Archivage...' : 'Archiver'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 p-2 p-md-3 border-top">
                      <p className="text-muted small mb-0 text-center text-sm-start">Page {page} {total ? `sur ${Math.max(1, Math.ceil(total / limit))}` : ''}</p>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <select className="form-select form-select-sm" style={{ width: 80 }} value={limit} onChange={(e) => { const l = Number(e.target.value)||10; setLimit(l); setPage(1); fetchDevis({ page: 1, limit: l }); }}>
                          {[5,10,20,50].map(n => <option key={n} value={n}>{n}/p</option>)}
                        </select>
                        <nav>
                          <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => { if (page>1) { const p=page-1; setPage(p); fetchDevis({ page: p, limit }); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>Précédent</button>
                            </li>
                            <li className={`page-item ${total && page >= Math.ceil(total/limit) ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => { const max = total ? Math.ceil(total/limit) : page+1; if (!total || page < max) { const p=page+1; setPage(p); fetchDevis({ page: p, limit }); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>Suivant</button>
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
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold mb-0">Activité récente</h5>
                      <button className="btn btn-sm btn-link p-0" onClick={onBellClick}>Voir tout</button>
                    </div>
                    <div className="d-flex flex-column gap-3 p-3">
                      {showWelcomeMessage && (
                        <div className="alert alert-success alert-dismissible fade show mb-3" role="alert" style={{ maxWidth: '100%' }}>
                          Bonjour <strong>{userName}</strong>, Bienvenue !
                          <button type="button" className="btn-close" onClick={() => setShowWelcomeMessage(false)} aria-label="Fermer"></button>
                        </div>
                      )}
                      {recentActivities.length === 0 && (
                        <div className="text-muted small">Aucune activité récente.</div>
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
          );
          }
        })()}
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
