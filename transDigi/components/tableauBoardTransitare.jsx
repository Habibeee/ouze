import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../src/toast.jsx';
import { getAuth, isAdmin as isAdminRole, isTrans as isTransRole } from '../services/authStore.js';
import { 
  LayoutGrid,
  User,
  Settings,
  HelpCircle,
  Search,
  Bell,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  Eye,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { transitareStyles, transitareCss } from '../styles/tableauBoardTransitareStyle.jsx';
import SideBare from './sideBare';
import { logout, listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount, listTransitaireDevis, respondDevisTransitaire, getTransitaireStats, get, archiveDevisTransitaire } from '../services/apiClient.js';
import { useI18n } from '../src/i18n.jsx';

// Force le téléchargement pour les URLs Cloudinary (fl_attachment)
const toDownloadUrl = (url, name) => {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.hostname.includes('res.cloudinary.com')) return url;
  } catch {
    return url;
  }
  if (url.includes('/upload/')) {
    const safeName = (name || 'fichier').toString().replace(/[^a-z0-9._-]/gi, '_');
    const parts = url.split('/upload/');
    return `${parts[0]}/upload/fl_attachment:${safeName}/${parts[1]}`;
  }
  return url;
};

const TransitaireDashboard = () => {
  const [activeTab, setActiveTab] = useState('en-attente');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLgUp, setIsLgUp] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 992 : true));
  const { info, success } = useToast();
  const { t } = useI18n();
  const [searchFilter, setSearchFilter] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeSideItem, setActiveSideItem] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const h = window.location.hash;
    if (h === '#/profile') return 'profil';
    if (h === '#/historique-transitaire') return 'historique-devis';
    return 'dashboard';
  });
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try { return localStorage.getItem('transLogoUrl') || ''; } catch { return ''; }
  });
  const [transName, setTransName] = useState('');
  const [transInitials, setTransInitials] = useState('');
  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenNotifIdsRef = useRef(new Set());
  const loadNotifs = async () => { try { setNotifLoading(true); const data = await listNotifications(10); const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []); const seen = seenNotifIdsRef.current; const newly = items.filter(n => n && n.id && !seen.has(n.id)); newly.forEach(n => { seen.add(n.id); const t = (n.title||'').toString(); const b = (n.body||'').toString(); const txt = t || b || 'Notification'; if (!/refus/i.test(t) && !/refus/i.test(b)) { info(txt); } }); setNotifs(items); setUnreadCount(items.filter(n=>!n.read).length); } catch {} finally { setNotifLoading(false); } };
  const onBellClick = async () => { setNotifOpen(o=>!o); if (!notifOpen) await loadNotifs(); };
  const onNotifClick = async (id) => { try { await markNotificationRead(id); setNotifs(prev => { const next = prev.map(n => n.id === id ? { ...n, read: true } : n); setUnreadCount(next.filter(n=>!n.read).length); return next; }); } catch {} };
  const onMarkAll = async () => { try { await markAllNotificationsRead(); setNotifs(prev => { const next = prev.map(n => ({ ...n, read: true })); setUnreadCount(0); return next; }); } catch {} };
  useEffect(() => {
    const onResize = () => setIsLgUp(window.innerWidth >= 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let timer;
    let backoff = 30000; // start at 30s
    const maxBackoff = 5 * 60 * 1000; // 5 minutes
    const poll = async () => {
      if (document.hidden) return; // pause when tab hidden
      try {
        const data = await getUnreadNotificationsCount();
        const c = (data?.count ?? data?.unread ?? data) || 0;
        setUnreadCount(Number(c) || 0);
        backoff = 45000; // 45s on success
      } catch {
        backoff = Math.min(maxBackoff, Math.round((backoff || 30000) * 1.8));
      }
      if (timer) clearInterval(timer);
      timer = setInterval(poll, backoff || 45000);
    };
    const onVisibility = () => { if (!document.hidden) { poll(); } };
    document.addEventListener('visibilitychange', onVisibility);
    poll();
    return () => { document.removeEventListener('visibilitychange', onVisibility); if (timer) clearInterval(timer); };
  }, []);

  useEffect(() => {
    // Guard: accès transitaire uniquement
    try {
      const { token } = getAuth();
      if (!token) {
        window.location.hash = '#/connexion';
      } else if (isAdminRole()) {
        window.location.hash = '#/dashboard-admin';
      } else if (!isTransRole()) {
        window.location.hash = '#/dashboard-client';
      }
    } catch {}

    const syncFromHash = () => {
      const hash = window.location.hash;
      if (hash === '#/profile') setActiveSideItem('profil');
      else if (hash === '#/historique-transitaire') setActiveSideItem('historique-devis');
      else if (hash === '#/dashboard-transitaire') setActiveSideItem('dashboard');
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    const onStorage = () => { try { setAvatarUrl(localStorage.getItem('transLogoUrl') || 'https://i.pravatar.cc/64?img=22'); } catch {} };
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('hashchange', syncFromHash); window.removeEventListener('storage', onStorage); };
  }, []);

  // Load logo & name from API on mount to persist across relogin
  useEffect(() => {
    (async () => {
      try {
        const res = await get('/translataires/profile').catch(async () => {
          try { return await get('/translataires/me'); } catch { return null; }
        });
        const name = (res?.nomEntreprise || res?.name || res?.company || '').toString().trim();
        if (name) {
          setTransName(name);
          try {
            const parts = name.split(' ').filter(Boolean);
            const first = (parts[0] || '').charAt(0) || '';
            const last = (parts[1] || '').charAt(0) || '';
            const initials = (first + last || first || '').toUpperCase();
            setTransInitials(initials);
          } catch {}
        }
        const url = res?.logo || res?.photoProfil || res?.photoUrl || res?.photo || '';
        if (url && typeof url === 'string') {
          setAvatarUrl(url);
          try { localStorage.setItem('transLogoUrl', url); } catch {}
        }
      } catch {}
    })();
  }, []);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [stats, setStats] = useState([
    { label: 'Total Devis Reçus', value: '-' },
    { label: "Taux d'Acceptation", value: '-' },
    { label: 'Devis en Attente', value: '-' }
  ]);

  const [tabs, setTabs] = useState([
    { id: 'en-attente', label: 'En attente', count: 0 },
    { id: 'en-cours', label: 'En cours', count: 0 },
    { id: 'traites', label: 'Traités', count: 0 }
  ]);

  const normStatus = (raw) => {
    const s = (raw || '').toString().toLowerCase();
    if (s.includes('attente') || s.includes('pending')) return 'en-attente';
    if (s.includes('accept') || s.includes('accepte')) return 'en-cours';
    if (s.includes('refus') || s.includes('rej') || s.includes('annul')) return 'traites';
    if (s.includes('cours') || s.includes('progress')) return 'en-cours';
    if (s.includes('trait')) return 'traites';
    return 'en-attente';
  };

  const statusBadge = (status) => {
    if (status === 'en-attente') return { bg: '#FFF3E0', fg: '#F57C00', label: 'En attente' };
    if (status === 'en-cours') return { bg: '#E3F2FD', fg: '#1976D2', label: 'En cours' };
    return { bg: '#E8F5E9', fg: '#28A745', label: 'Traité' };
  };

  const asClientLabel = (c) => {
    if (!c) return '-';
    if (typeof c === 'string') return c;
    if (typeof c === 'object') {
      const nom = c.nom || c.lastName || c.lastname || '';
      const prenom = c.prenom || c.firstName || c.firstname || '';
      const email = c.email || '';
      const phone = c.telephone || c.phone || '';
      const name = `${prenom} ${nom}`.trim();
      return name || email || phone || c._id || '-';
    }
    try { return String(c); } catch { return '-'; }
  };

  const asRouteLabel = (r) => {
    if (!r) return '-';
    if (typeof r === 'string') return r;
    if (typeof r === 'object') {
      const from = r.origine || r.depart || r.from || r.source || '';
      const to = r.destination || r.arrivee || r.to || r.target || '';
      if (from || to) return `${from || '-'} → ${to || '-'}`;
    }
    try { return String(r); } catch { return '-'; }
  };

  const routeFromDevis = (d) => {
    // Essayer objet route sinon champs à la racine
    const label = asRouteLabel(d?.route || d?.itineraire || d?.trajet || d?.shipping || d?.chemin);
    if (label && label !== '-' && !label.includes('[object')) return label;
    const from = d?.origin || d?.origine || d?.depart || d?.from || d?.source;
    const to = d?.destination || d?.arrivee || d?.to || d?.target;
    if (from && to) return `${from} → ${to}`;
    if (to) return to;
    if (from) return from;
    const alt = d?.description || d?.typeService;
    return alt ? String(alt) : '-';
  };

  const fetchDevis = async (opts) => {
    try {
      setLoading(true);
      setError('');
      const curPage = opts?.page || page;
      const curLimit = opts?.limit || limit;
      const curStatus = opts?.status || activeTab;
      const res = await listTransitaireDevis({ page: curPage, limit: curLimit, status: curStatus, search: searchFilter });
      const list = (res?.items || res?.devis || res || []);
      const mapped = list.map((d) => {
        const st = normStatus(d.status || d.statut);
        return {
          id: d.id || d._id || '',
          client: asClientLabel(
            d.client || d.clientInfo || d.demandeur || d.createdBy || d.owner || d.user || d.clientName
          ),
          date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : (d.date || ''),
          route: routeFromDevis(d),
          status: st,
          // Conserver l'objet brut pour afficher tous les détails dans le panneau
          raw: d,
        };
      });
      const onlyCur = mapped.filter(r => r.status === curStatus);
      setRows(onlyCur);
      setTotal(Number(res?.total || res?.count || 0) || onlyCur.length * (curPage || 1));
      // Ne pas rafraîchir les stats à chaque fetch pour éviter les 429
    } catch (e) {
      setError(e?.message || 'Erreur de chargement');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDevis({ page: 1, limit, status: activeTab }); }, [activeTab]);
  useEffect(() => { const t = setTimeout(() => fetchDevis({ page: 1, limit, status: activeTab }), 600); return () => clearTimeout(t); }, [searchFilter]);

  const lastStatsAtRef = useRef(0);
  const updateStats = async () => {
    const now = Date.now();
    // Throttle: max une fois toutes les 60s sauf appel explicite après action
    if (now - lastStatsAtRef.current < 60000) return;
    lastStatsAtRef.current = now;
    try {
      const s = await getTransitaireStats();
      const t = s?.stats || s?.statistiques || s || {};
      let totalDevis = t.nombreDevisTotal ?? t.totalDevis ?? t.total ?? t.total_devis ?? t.count;
      let enAttente = t.nombreDevisEnAttente ?? t.devisEnAttente ?? t.enAttente ?? t.en_attente ?? t.pending;
      let acceptes = t.nombreDevisAcceptes ?? t.devisAcceptes ?? t.acceptes ?? t.accepte ?? t.accepted;
      let traites = t.nombreDevisTraites ?? t.traite ?? t.traites ?? null;
      let refuses = t.nombreDevisRefuses ?? t.devisRefuses ?? t.refuses ?? t.refuse ?? t.rejected;
      const tauxStr = t.tauxAcceptation;

      const hasNumbers = (v) => v !== undefined && v !== null && !isNaN(Number(v));

      if (!hasNumbers(enAttente) || !hasNumbers(acceptes) || !hasNumbers(refuses) || !hasNumbers(totalDevis)) {
        // Fallback: calcul par appels liste
        const [rA, rC, rT] = await Promise.all([
          listTransitaireDevis({ status: 'en-attente', page: 1, limit: 1 }),
          listTransitaireDevis({ status: 'en-cours', page: 1, limit: 1 }),
          listTransitaireDevis({ status: 'traites', page: 1, limit: 1 }),
        ]);
        const countFrom = (res) => Number(res?.total || res?.count || (Array.isArray(res?.items) ? res.items.length : Array.isArray(res?.devis) ? res.devis.length : Array.isArray(res) ? res.length : 0));
        enAttente = hasNumbers(enAttente) ? enAttente : countFrom(rA);
        acceptes = hasNumbers(acceptes) ? acceptes : countFrom(rC);
        refuses = hasNumbers(refuses) ? refuses : countFrom(rT);
        totalDevis = hasNumbers(totalDevis) ? totalDevis : (Number(enAttente||0) + Number(acceptes||0) + Number(refuses||0));
      }

      const taux = (typeof tauxStr === 'string' && tauxStr.length)
        ? `${tauxStr.replace(/\s*%?$/, '')}%`
        : ((Number(totalDevis)||0) > 0 ? Math.round((Number(acceptes)||0) * 100 / Number(totalDevis)) + '%' : '-');
      setStats([
        { label: 'Total Devis Reçus', value: totalDevis != null ? String(totalDevis) : '-' },
        { label: "Taux d'Acceptation", value: taux },
        { label: 'Devis en Attente', value: enAttente != null ? String(enAttente) : '-' },
      ]);
      setTabs((prev) => prev.map(t =>
        t.id === 'en-attente' ? { ...t, count: Number(enAttente||0) }
        : t.id === 'en-cours' ? { ...t, count: Number(acceptes||0) }
        : t.id === 'traites' ? { ...t, count: Number((traites ?? refuses) || 0) }
        : t
      ));
    } catch {
      // Fallback total si stats indisponibles: ne rien casser, laisser '-'
    }
  };

  // Charger statistiques réelles au montage
  useEffect(() => { updateStats().catch(()=>{}); }, []);

  const onArchive = async (id) => {
    if (!id) return;
    if (!window.confirm("Archiver ce devis ? Il disparaîtra de la liste principale mais restera accessible dans l'historique.")) return;
    try {
      await archiveDevisTransitaire(id);
      await fetchDevis();
      try { lastStatsAtRef.current = 0; await updateStats(); } catch {}
    } catch (e) {
      alert(e?.message || "Erreur lors de l'archivage");
    }
  };

  const [respondOpen, setRespondOpen] = useState(false);
  const [respondDevisId, setRespondDevisId] = useState(null);
  const [respAmount, setRespAmount] = useState('');
  const [respMessage, setRespMessage] = useState('');
  const [respFiles, setRespFiles] = useState([]);
  const [respLoading, setRespLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const triggerClientFileDownload = (urlRaw, name) => {
    if (!urlRaw) return;
    const safeName = (name || 'fichier').toString();
    const url = toDownloadUrl(urlRaw, safeName);
    if (!url) return;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      try { window.open(url, '_blank'); } catch {}
    }
  };

  const onOpenRespond = (id) => { setRespondDevisId(id); setRespAmount(''); setRespMessage(''); setRespFiles([]); setRespondOpen(true); };
  const onSubmitRespond = async () => {
    try {
      setRespLoading(true);
      const files = Array.from(respFiles || []).filter(Boolean);
      await respondDevisTransitaire(respondDevisId, { amount: Number(respAmount || 0), message: respMessage, attachments: files });
      setRespondOpen(false);
      await fetchDevis();
      try { lastStatsAtRef.current = 0; await updateStats(); } catch {}
    } catch (e) {
      alert(e?.message || 'Erreur lors de la réponse');
    } finally { setRespLoading(false); }
  };

  const getStatusActions = (status, id) => {
    switch (status) {
      case 'en-attente':
        return (
          <>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => { const it = rows.find(r=>r.id===id); setDetailItem(it||null); setDetailOpen(true); }}>
              Détails
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => onOpenRespond(id)}>
              Répondre
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => onArchive(id)}>
              Archiver
            </button>
          </>
        );
      case 'en-cours':
        return (
          <>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { const it = rows.find(r=>r.id===id); setDetailItem(it||null); setDetailOpen(true); }}>
              Détails
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => onOpenRespond(id)}>
              Répondre
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => onArchive(id)}>
              Archiver
            </button>
          </>
        );
      case 'traite':
        return (
          <>
             <button className="btn btn-sm btn-outline-secondary" onClick={() => { const it = rows.find(r=>r.id===id); setDetailItem(it||null); setDetailOpen(true); }}>
              Détails
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => onOpenRespond(id)}>
              Répondre
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => onArchive(id)}>
              Archiver
            </button>
          </>
        );
      default:
       
    }
  };

  

  return (
    <div className="d-flex" style={{ ...transitareStyles.layout, backgroundColor: 'var(--bg)' }}>
      <style>{transitareCss}</style>
      {/* Sidebar (SideBare) */}
      <SideBare
        topOffset={96}
        closeOnNavigate={false}
        defaultOpen={true}
        open={sidebarOpen}
        onOpenChange={(o)=>setSidebarOpen(!!o)}
        activeId={activeSideItem}
        items={[
          { id: 'dashboard', label: t('forwarder.sidebar.dashboard'), icon: LayoutGrid },
          { id: 'historique-devis', label: 'Historique des devis', icon: Clock },
          { id: 'profil', label: t('forwarder.sidebar.profile'), icon: User },
        ]}
        onNavigate={(id) => {
          setActiveSideItem(id);
          if (id === 'dashboard') {
            window.location.hash = '#/dashboard-transitaire';
          } else if (id === 'historique-devis') {
            window.location.hash = '#/historique-transitaire';
          } else if (id === 'profil') {
            window.location.hash = '#/profile';
          }
        }}
      />

      {/* Main Content */}
      <div className="flex-grow-1" style={{ marginLeft: isLgUp ? (sidebarOpen ? '240px' : '56px') : '0', transition: 'margin-left .25s ease', minWidth: 0, width: '100%', maxWidth: '100vw', overflowX: 'hidden', backgroundColor: 'var(--bg)' }}>
        {/* Header with icons */}
        <div className="w-100 d-flex justify-content-between align-items-center gap-2 px-2 px-md-3 py-2 bg-body border-bottom" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
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
          <div className="d-flex align-items-center gap-2 ms-auto">
            <button
              className="btn btn-link position-relative"
              style={{ color: 'var(--bs-body-color)' }}
              onClick={onBellClick}
              aria-label={t('forwarder.header.notifications')}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{unreadCount}</span>}
            </button>
            {notifOpen && (
              <div className="card shadow-sm" style={{ position: 'absolute', top: '100%', right: 48, zIndex: 1050, minWidth: 320 }}>
                <div className="card-body p-0">
                  <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                    <div className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{t('forwarder.header.notifications')}</div>
                    <button className="btn btn-sm btn-link" onClick={onMarkAll}>{t('forwarder.header.mark_all_read')}</button>
                  </div>
                  {notifLoading ? (
                    <div className="p-3 small text-muted">{t('forwarder.header.loading')}</div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {(notifs.length ? notifs : []).map(n => (
                        <button key={n.id} className={`list-group-item list-group-item-action d-flex justify-content-between ${n.read ? '' : 'fw-semibold'}`} onClick={() => onNotifClick(n.id)}>
                          <div className="me-2" style={{ whiteSpace: 'normal', textAlign: 'left' }}>
                            <div>{n.title || t('forwarder.header.notifications')}</div>
                            {n.body && <div className="small text-muted">{n.body}</div>}
                          </div>
                          {!n.read && <span className="badge bg-primary">Nouveau</span>}
                        </button>
                      ))}
                      {!notifs.length && <div className="p-3 small text-muted">{t('forwarder.header.no_notifications')}</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
            <button className="btn p-0 border-0 bg-transparent" onClick={() => setProfileMenuOpen(!profileMenuOpen)} aria-label={t('forwarder.header.open_profile_menu')}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profil"
                  className="rounded-circle border"
                  style={{ width: 36, height: 36, objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-body-secondary border"
                  style={{ width: 36, height: 36 }}
                >
                  <span className="text-body" style={{ fontWeight: 600, fontSize: 14 }}>
                    {(transInitials || '').trim() || (transName ? transName.charAt(0).toUpperCase() : 'T')}
                  </span>
                </div>
              )}
            </button>
            {profileMenuOpen && (
              <div className="card shadow-sm" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1050, minWidth: '200px' }}>
                <div className="list-group list-group-flush">
                  <button className="list-group-item list-group-item-action" onClick={() => { setProfileMenuOpen(false); window.location.hash = '#/profile'; }}>
                    {t('forwarder.header.menu.edit_profile')}
                  </button>
                  <button className="list-group-item list-group-item-action" onClick={() => { setProfileMenuOpen(false); window.location.hash = '#/changer-mot-de-passe'; }}>
                    {t('forwarder.header.menu.edit_password')}
                  </button>
                  <button className="list-group-item list-group-item-action text-danger" onClick={async () => { setProfileMenuOpen(false); try { await logout(); } finally { window.location.hash = '#/connexion'; } }}>
                    {t('forwarder.header.menu.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="container-fluid px-2 px-md-4 py-3 py-md-4">
          {/* Page Title */}
          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3 mb-md-4">
            <h1 className="h3 h2-md fw-bold mb-0 text-body forwarder-main-title">{t('forwarder.page.title')}</h1>
            <button className="btn btn-outline-secondary btn-sm" onClick={async ()=>{ try { await fetchDevis({ page:1, limit, status: activeTab }); lastStatsAtRef.current = 0; await updateStats(); } catch {} }}>{t('forwarder.page.refresh')}</button>
          </div>

          {/* Stats Section */}
          <div className="mb-3 mb-md-4">
            <h5 className="fw-semibold mb-3 text-body forwarder-stats-title">{t('forwarder.stats.title')}</h5>
            <div className="row g-2 g-md-3">
              {stats.map((stat, index) => (
                <div key={index} className="col-12 col-sm-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100 forwarder-stats-card">
                    <div className="card-body p-3">
                      <div className="small mb-2" style={{ color: 'var(--bs-body-color)' }}>{stat.label}</div>
                      <div className="h3 fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>{stat.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Devis Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {/* Tabs */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
                <div className="d-flex gap-2 flex-wrap">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`btn ${activeTab === tab.id ? 'text-white' : 'btn-light'}`}
                      style={{ backgroundColor: activeTab === tab.id ? transitareStyles.primary : undefined, border: 'none' }}
                    >
                      {tab.id === 'en-attente' ? t('forwarder.tabs.pending') : tab.id === 'en-cours' ? t('forwarder.tabs.in_progress') : t('forwarder.tabs.processed')} ({tab.count})
                    </button>
                  ))}
                </div>
                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <span className="input-group-text bg-body-secondary border-end-0">
                    <Search size={18} />
                  </span>
                  <input type="text" className="form-control border-start-0" placeholder={t('forwarder.search.placeholder')} value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} />
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4 py-3">{t('forwarder.table.header.id')}</th>
                      <th className="py-3">{t('forwarder.table.header.client')}</th>
                      <th className="py-3">{t('forwarder.table.header.date')}</th>
                      <th className="py-3">{t('forwarder.table.header.route')}</th>
                      <th className="py-3">{t('forwarder.table.header.status')}</th>
                      <th className="py-3">{t('forwarder.table.header.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan="6" className="py-4 text-center text-muted">{t('forwarder.table.loading')}</td>
                      </tr>
                    )}
                    {!loading && error && (
                      <tr>
                        <td colSpan="6" className="py-4 text-center text-danger">{t('forwarder.table.error')}</td>
                      </tr>
                    )}
                    {!loading && !error && rows.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-4 text-center text-muted">{t('forwarder.table.empty')}</td>
                      </tr>
                    )}
                    {!loading && !error && rows.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 fw-semibold">{item.id}</td>
                        <td className="py-3">{item.client}</td>
                        <td className="py-3 text-body">{item.date}</td>
                        <td className="py-3 text-body">{item.route}</td>
                        <td className="py-3">
                          <span className="badge px-3 py-2" style={{ backgroundColor: statusBadge(item.status).bg, color: statusBadge(item.status).fg, fontWeight: '500' }}>
                            {statusBadge(item.status).label}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="d-flex gap-2">{getStatusActions(item.status, item.id)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <p className="text-muted small mb-0">{t('forwarder.table.pagination.label')} {page} {total ? ` / ${Math.max(1, Math.ceil(total / limit))}` : ''}</p>
                <div className="d-flex align-items-center gap-2">
                  <select className="form-select form-select-sm" style={{ width: 80 }} value={limit} onChange={(e)=>{ const l=Number(e.target.value)||10; setLimit(l); setPage(1); fetchDevis({ page:1, limit:l }); }}>
                    {[5,10,20,50].map(n => <option key={n} value={n}>{n}/p</option>)}
                  </select>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${page<=1?'disabled':''}`}>
                        <button className="page-link" onClick={()=>{ if(page>1){ const p=page-1; setPage(p); fetchDevis({ page:p, limit }); window.scrollTo({ top:0, behavior:'smooth' }); } }}>{t('forwarder.table.pagination.prev')}</button>
                      </li>
                      <li className={`page-item ${total && page>=Math.ceil(total/limit)?'disabled':''}`}>
                        <button className="page-link" onClick={()=>{ const max = total?Math.ceil(total/limit):page+1; if(!total || page<max){ const p=page+1; setPage(p); fetchDevis({ page:p, limit }); window.scrollTo({ top:0, behavior:'smooth' }); } }}>{t('forwarder.table.pagination.next')}</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
          {/* Modal Réponse Devis */}
          {respondOpen && (
            <>
              <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Répondre au devis</h5>
                      <button type="button" className="btn-close" onClick={() => setRespondOpen(false)} aria-label="Fermer"></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Montant de la contre‑offre</label>
                        <input type="number" className="form-control" placeholder="Ex: 150000" value={respAmount} onChange={(e)=>setRespAmount(e.target.value)} min="0" />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Message</label>
                        <textarea className="form-control" rows="4" placeholder="Détails de l'offre, délais, conditions..." value={respMessage} onChange={(e)=>setRespMessage(e.target.value)} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Pièces jointes (optionnel)</label>
                        <input type="file" className="form-control" multiple onChange={(e)=>setRespFiles(e.target.files)} />
                        <div className="form-text">PDF, images… Plusieurs fichiers possibles.</div>
                      </div>
                      {error && <div className="alert alert-danger py-2 mt-2">{error}</div>}
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setRespondOpen(false)} disabled={respLoading}>Annuler</button>
                      <button type="button" className="btn btn-primary" style={{ backgroundColor: transitareStyles.primary, borderColor: transitareStyles.primary }} onClick={onSubmitRespond} disabled={respLoading || !respondDevisId}>
                        {respLoading ? 'Envoi…' : 'Envoyer la réponse'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show" onClick={() => setRespondOpen(false)}></div>
            </>
          )}
          {/* Drawer Détails Devis */}
          {detailOpen && (
            <>
              <div className="offcanvas offcanvas-end show" style={{ visibility: 'visible', width: '420px' }} tabIndex="-1" aria-modal="true" role="dialog">
                <div className="offcanvas-header">
                  <h5 className="offcanvas-title">Détails du devis</h5>
                  <button type="button" className="btn-close text-reset" aria-label="Fermer" onClick={() => setDetailOpen(false)}></button>
                </div>
                <div className="offcanvas-body">
                  {detailItem ? (
                    (() => {
                      const raw = detailItem.raw || {};
                      const typeService = raw.typeService || '-';
                      const description = raw.description || '';
                      const origin = raw.origin || raw.origine || '';
                      const destination = raw.destination || raw.arrivee || '';
                      const montant = raw.montantEstime;
                      const clientFiles = Array.isArray(raw.clientFichiers)
                        ? raw.clientFichiers
                        : (raw.clientFichiers ? [raw.clientFichiers] : (raw.clientFichier ? [raw.clientFichier] : []));
                      const hasFiles = clientFiles && clientFiles.length;
                      return (
                        <>
                          <div className="mb-3">
                            <div className="text-muted small">ID</div>
                            <div className="fw-semibold">{detailItem.id}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Client</div>
                            <div className="fw-semibold">{detailItem.client}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Type de service</div>
                            <div className="fw-semibold">{typeService}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Origine</div>
                            <div className="fw-semibold">{origin || '-'}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Destination</div>
                            <div className="fw-semibold">{destination || '-'}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Itinéraire</div>
                            <div className="fw-semibold">{detailItem.route}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Date</div>
                            <div className="fw-semibold">{detailItem.date}</div>
                          </div>
                          {description && (
                            <div className="mb-3">
                              <div className="text-muted small">Description</div>
                              <div>{description}</div>
                            </div>
                          )}
                          {typeof montant !== 'undefined' && montant !== null && (
                            <div className="mb-3">
                              <div className="text-muted small">Montant estimé (client)</div>
                              <div className="fw-semibold">{String(montant)}</div>
                            </div>
                          )}
                          {hasFiles && (
                            <div className="mb-3">
                              <div className="text-muted small">Pièces jointes du client</div>
                              <ul className="small mb-0">
                                {clientFiles.map((f, idx) => {
                                  const urlRaw = (f && typeof f === 'object') ? (f.url || f.link || f.location) : f;
                                  const name = (f && typeof f === 'object') ? (f.name || f.filename || f.originalName || `Fichier ${idx + 1}`) : `Fichier ${idx + 1}`;
                                  const url = toDownloadUrl(urlRaw, name);
                                  return url ? (
                                    <li key={idx}>
                                      <button
                                        type="button"
                                        className="btn btn-link p-0 align-baseline"
                                        onClick={() => triggerClientFileDownload(urlRaw, name)}
                                      >
                                        {name}
                                      </button>
                                    </li>
                                  ) : null;
                                })}
                              </ul>
                            </div>
                          )}
                          <div className="mb-4">
                            <div className="text-muted small">Statut</div>
                            <span className="badge px-3 py-2" style={{ backgroundColor: statusBadge(detailItem.status).bg, color: statusBadge(detailItem.status).fg }}>{statusBadge(detailItem.status).label}</span>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-outline-secondary" onClick={() => setDetailOpen(false)}>Fermer</button>
                            <button className="btn btn-primary" style={{ backgroundColor: transitareStyles.primary, borderColor: transitareStyles.primary }} onClick={() => { setDetailOpen(false); onOpenRespond(detailItem.id); }}>Répondre</button>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-muted">Aucune donnée</div>
                  )}
                </div>
              </div>
              <div className="offcanvas-backdrop fade show" onClick={() => setDetailOpen(false)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransitaireDashboard;
