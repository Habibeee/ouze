import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isAdmin, isTrans, getAuth } from '../services/authStore.js';
import { 
  LayoutGrid, 
  Shield, 
  Users, 
  Truck, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Bell, 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  FileText,
  Menu,
  X,
  User
} from 'lucide-react';
import { adminStyles, adminCss } from '../styles/tableauBordAdminStyle.jsx';
import SideBare from './sideBare';
import { logout, get, listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount } from '../services/apiClient.js';
import GestionUtilisateurs from './gestionUtilisateur.jsx';
import GestionTransitaire from './gestionTransitaire.jsx';
import ValidationCompte from './validationCompte.jsx';
import HistoriqueDevis from './historiqueDevis.jsx';

const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('apercu');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [section, setSection] = useState('validation');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const avatarUrl = 'https://i.pravatar.cc/64?img=12';
  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawer, setDrawer] = useState({ title: '', content: null });

  // Temps relatif (français court)
  const relTime = (d) => {
    try {
      const ts = typeof d === 'string' ? new Date(d) : d;
      const diff = Date.now() - (ts?.getTime?.() || 0);
      if (!diff || diff < 0) return '';
      const sec = Math.floor(diff / 1000);
      if (sec < 5) return "À l'instant";
      if (sec < 60) return `Il y a ${sec} sec`;
      const min = Math.floor(sec / 60);
      if (min < 60) return `Il y a ${min} min`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `Il y a ${hr} h`;
      const day = Math.floor(hr / 24);
      if (day < 30) return `Il y a ${day} j`;
      const mon = Math.floor(day / 30);
      if (mon < 12) return `Il y a ${mon} mois`;
      const yr = Math.floor(mon / 12);
      return `Il y a ${yr} an${yr>1?'s':''}`;
    } catch { return ''; }
  };

  const formatDateTime = (d) => {
    try {
      const dt = typeof d === 'string' ? new Date(d) : d;
      return dt.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  // Guard: accès admin uniquement
  useEffect(() => {
    const { token } = getAuth();
    if (!token) {
      window.location.hash = '#/connexion';
      return;
    }
    if (!isAdmin()) {
      if (isTrans()) window.location.hash = '#/dashboard-transitaire';
      else window.location.hash = '#/dashboard-client';
    }
  }, []);

  const loadNotifs = async () => {
    try {
      setNotifLoading(true);
      const data = await listNotifications(10);
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setNotifs(items);
      setUnreadCount(items.filter(n=>!n.read).length);
    } catch (e) {
      // Si rate limited, attendre et réessayer discrètement
      if (e?.status === 429) {
        setTimeout(() => { loadNotifs().catch(()=>{}); }, 8000);
      }
    } finally { setNotifLoading(false); }
  };
  const onBellClick = async () => { setNotifOpen(o=>!o); if (!notifOpen) await loadNotifs(); };
  const onNotifClick = async (id, item) => {
    try {
      await markNotificationRead(id);
      setNotifs(prev => {
        const next = prev.map(n => (n.id === id || n._id === id) ? { ...n, read: true } : n);
        setUnreadCount(next.filter(n=>!n.read).length);
        return next;
      });
      // Ouvrir un modal de détails dans le dashboard admin (pas de redirection externe)
      setDetailItem(item || null);
      setDetailOpen(true);
    } catch {}
  };

  const onMarkAll = async () => { try { await markAllNotificationsRead(); setNotifs(prev => { const next = prev.map(n => ({ ...n, read: true })); setUnreadCount(0); return next; }); } catch {} };
  useEffect(() => {
    let timer;
    let backoff = 60000; // start at 60s
    const maxBackoff = 5 * 60 * 1000; // 5 minutes
    const poll = async () => {
      if (document.hidden) return; // pause when tab hidden
      try {
        const data = await getUnreadNotificationsCount();
        const c = (data?.count ?? data?.unread ?? data) || 0;
        setUnreadCount(Number(c) || 0);
        backoff = 90000; // normal cadence 90s on success
      } catch {
        backoff = Math.min(maxBackoff, Math.round((backoff || 60000) * 1.8));
      }
      if (timer) clearInterval(timer);
      timer = setInterval(poll, backoff || 90000);
    };
    const onVisibility = () => { if (!document.hidden) { poll(); } };
    document.addEventListener('visibilitychange', onVisibility);
    poll();
    return () => { document.removeEventListener('visibilitychange', onVisibility); if (timer) clearInterval(timer); };
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statsData, setStatsData] = useState({
    pending: 0,
    usersActive: 0,
    transVerified: 0,
    blocked: 0,
    series: [],
  });

  // Theme color helpers (global to component)
  const getCss = () => {
    try { return getComputedStyle(document.documentElement); } catch { return null; }
  };
  const cssVars = getCss();
  const colorText = (cssVars?.getPropertyValue('--text') || '#e5e7eb').trim();
  const colorMuted = (cssVars?.getPropertyValue('--muted') || '#9ca3af').trim();
  const colorBorder = (cssVars?.getPropertyValue('--border') || '#1f2937').trim();

  const stats = useMemo(() => ([
    { label: 'Comptes en attente', value: String(statsData.pending || 0), icon: Shield, bgColor: '#E3F2FD', iconColor: '#2196F3' },
    { label: 'Utilisateurs actifs', value: String(statsData.usersActive || 0), icon: Users, bgColor: '#E8F5E9', iconColor: '#28A745' },
    { label: 'Transitaires vérifiés', value: String(statsData.transVerified || 0), icon: Truck, bgColor: '#FFF3E0', iconColor: '#FF9800' },
    { label: 'Comptes bloqués', value: String(statsData.blocked || 0), icon: XCircle, bgColor: '#FFEBEE', iconColor: '#F44336' }
  ]), [statsData]);

  const chartRef = useRef(null);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        // Backend expose toutes les stats via /admin/statistiques
        const global = await get('/admin/statistiques');
        const s = global?.stats || global?.statistiques || {};
        const users = s.utilisateurs || {};
        const trans = s.translataires || {};
        const devis = s.devis || {};
        // Certains compteurs (bloqués) ne sont pas fournis; les mettre à 0 si absents
        const series = Array.isArray(devis.monthly) ? devis.monthly : (Array.isArray(devis.serie) ? devis.serie : []);
        const blockedCombined = (users.bloques || 0) + (trans.bloques || 0);
        const pendingCombined = (users.enAttente || 0) + (trans.enAttente || 0);
        setStatsData({
          pending: pendingCombined,
          usersActive: users.total || 0,
          transVerified: trans.approuves || 0,
          blocked: blockedCombined,
          series: (series || []).map(Number).filter(n => !isNaN(n)),
        });
      } catch (e) {
        if (e?.status === 429) {
          setError('Trop de requêtes. Nouvel essai dans quelques secondes...');
          // Retenter automatiquement après un court délai
          setTimeout(() => { fetchStats().catch(()=>{}); }, 7000);
        } else {
          setError(e?.message || 'Erreur de chargement des statistiques');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const handler = () => { fetchStats(); };
    window.addEventListener('admin:stats:dirty', handler);
    const statsTimer = setInterval(fetchStats, 60000);
    return () => { window.removeEventListener('admin:stats:dirty', handler); clearInterval(statsTimer); };
  }, []);

  const [recentActivities, setRecentActivities] = useState([]);
  const refreshActivities = async () => {
    try {
      const items = await listNotifications(6);
      const arr = Array.isArray(items?.items) ? items.items : (Array.isArray(items) ? items : []);
      const mapped = arr.slice(0,6).map(n => {
        const fallback = n?.data?.at || n?.data?.date || n?.updatedAt || null;
        const created = n?.createdAt || fallback;
        return {
        id: n.id || n._id || String(Math.random()),
        type: (n.type || '').toString().toLowerCase(),
        title: n.title || 'Notification',
        text: n.body || n.message || '',
        time: created ? relTime(new Date(created)) : '',
        createdAt: created,
        data: n.data || {},
      };});
      setRecentActivities(mapped);
    } catch {}
  };
  useEffect(() => {
    refreshActivities();
    const t = setInterval(refreshActivities, 60000);
    return () => { clearInterval(t); };
  }, []);

  // Temps réel via Socket.IO (CDN fallback)
  useEffect(() => {
    let socket;
    const connect = () => {
      try {
        const base = (window?.location?.origin || '').replace(/#.*$/, '');
        const ioGlobal = (window).io;
        if (!ioGlobal) return;
        socket = ioGlobal(base, { withCredentials: true, transports: ['websocket','polling'] });
        const onNotif = () => { refreshActivities(); setUnreadCount(c => (Number(c)||0) + 1); };
        const onDirty = () => { window.dispatchEvent(new Event('admin:stats:dirty')); };
        socket.on('notification:new', onNotif);
        socket.on('admin:stats:dirty', onDirty);
      } catch {}
    };
    if (!(window).io) {
      const s = document.createElement('script');
      s.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
      s.async = true;
      s.onload = connect;
      document.head.appendChild(s);
    } else {
      connect();
    }
    return () => { try { socket?.close(); } catch {} };
  }, []);

  const accountsToValidate = [
    { user: 'Jean Dupont', company: 'Logistique Mondiale', date: '2023-10-26', type: 'Transitaire' },
    { user: 'Marie Claire', company: 'Import SARL', date: '2023-10-25', type: 'Client' }
  ];

  const menuItems = [
    { id: 'apercu', label: 'Aperçu', icon: LayoutGrid },
    { id: 'validation', label: 'Validation des comptes', icon: Shield },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
    { id: 'transitaires', label: 'Transitaires', icon: Truck },
    { id: 'statistiques', label: 'Statistiques des devis', icon: TrendingUp }
  ];

  const [isLgUp, setIsLgUp] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 992 : true));
  useEffect(() => {
    const onResize = () => setIsLgUp(window.innerWidth >= 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
    <div className="d-flex" style={{ ...adminStyles.layout, backgroundColor: 'var(--bg)' }}>
      <style>{adminCss}</style>

      {/* Sidebar (SideBare) */}
      <SideBare
        topOffset={96}
        activeId={section}
        open={sidebarOpen}
        onOpenChange={(o)=>setSidebarOpen(!!o)}
        items={[
          { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
          { id: 'validation', label: 'Validation des comptes', icon: Shield },
          { id: 'clients', label: 'Clients', icon: Users },
          { id: 'transitaires', label: 'Transitaires', icon: Truck },
        ]}
        closeOnNavigate={false}
        defaultOpen={true}
        onNavigate={(id) => {
          setSection(id);
        }}
      />

      {/* Main Content */}
      <div className="flex-grow-1" style={{ marginLeft: isLgUp ? (sidebarOpen ? '240px' : '56px') : '0', transition: 'margin-left .25s ease', backgroundColor: 'var(--bg)' }}>
        <div className="d-flex justify-content-end align-items-center gap-2 position-relative">
          <button className="btn btn-link position-relative" onClick={onBellClick} aria-label="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{unreadCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className="card shadow-sm" style={{ position: 'absolute', top: '100%', right: 48, zIndex: 1050, minWidth: 320 }}>
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
                          <div className="small text-muted">{n.createdAt ? relTime(new Date(n.createdAt)) : ''}</div>
                          {(() => { const d = n.data || {}; const actor = d.actorName || d.userName || d.clientName || ''; const mail = d.actorEmail || d.userEmail || d.clientEmail || ''; const type = d.actorType || d.userType || ''; return (actor || mail || type) ? (
                            <div className="small text-muted">{actor}{actor && mail ? ' · ' : ''}{mail}{(actor||mail) && type ? ' · ' : ''}{type}</div>
                          ) : null; })()}
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
            <img 
              src={avatarUrl}
              alt="Profil"
              className="rounded-circle"
              style={{ width: 36, height: 36, objectFit: 'cover', border: '2px solid #e9ecef' }}
            />
          </button>
          {profileMenuOpen && (
            <div className="card shadow-sm" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1050, minWidth: '200px' }}>
              <div className="list-group list-group-flush">
                <button className="list-group-item list-group-item-action" onClick={() => { setProfileMenuOpen(false); window.location.hash = '#/modifier-profil'; }}>
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

        {/* Stats Cards */}
        <div className="container-fluid py-4 px-2 px-md-4">
          {section === 'clients' ? (
            <GestionUtilisateurs />
          ) : section === 'transitaires' ? (
            <GestionTransitaire />
          ) : section === 'validation' ? (
            <ValidationCompte />
          ) : (
            <>
            <div className="row g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
              {loading && (
                <div className="col-12"><div className="alert alert-light text-muted m-0">Chargement des statistiques...</div></div>
              )}
              {error && !loading && (
                <div className="col-12"><div className="alert alert-danger m-0">{error}</div></div>
              )}
              {!loading && stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="text-muted small mb-1">{stat.label}</div>
                            <div className="h2 fw-bold mb-0" style={{ color: 'var(--text)' }}>{stat.value}</div>
                          </div>
                          <div 
                            className="rounded-circle p-3"
                            style={{ backgroundColor: stat.bgColor }}
                          >
                            <Icon size={24} style={{ color: stat.iconColor }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="row g-2 g-md-3 g-lg-4">
              {/* Chart Section */}
              <div className="col-12 col-lg-8">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="card-title fw-bold m-0">Statistiques des devis</h5>
                    </div>
                    <div style={{ height: '280px', position: 'relative' }}>
                      <svg ref={chartRef} width="100%" height="280" viewBox="0 0 800 280" preserveAspectRatio="none">
                        {(() => {
                          const data = (statsData.series && statsData.series.length ? statsData.series : [5,8,12,15,13,19,24,22,27,30,28,34]);
                          const padding = 36;
                          const width = 800, height = 280;
                          const innerW = width - padding * 2; const innerH = height - padding * 2;
                          const maxVal = Math.max(1, Math.max(...data));
                          const barW = innerW / data.length * 0.6;
                          const gap = innerW / data.length * 0.4;
                          const monthNames = ['Jan','Fév','Mar','Avr','Mai','Jui','Jui','Aoû','Sep','Oct','Nov','Déc'];
                          const now = new Date();
                          const grid = [];
                          for (let i = 0; i <= 4; i++) {
                            const y = padding + (innerH * i) / 4;
                            const v = Math.round(((4 - i) * maxVal) / 4);
                            grid.push(<line key={`hl-${i}`} x1={padding} y1={y} x2={width - padding} y2={y} stroke={colorBorder} strokeWidth="1" />);
                            grid.push(<text key={`yt-${i}`} x={padding - 8} y={y + 4} textAnchor="end" fontSize="11" fill={colorMuted}>{v}</text>);
                          }
                          const bars = data.map((v, i) => {
                            const x = padding + i * (barW + gap);
                            const h = (v / maxVal) * innerH;
                            const y = padding + innerH - h;
                            const m = new Date(now.getFullYear(), now.getMonth() - (data.length - 1 - i), 1).getMonth();
                            return (
                              <g key={i}>
                                <rect x={x} y={y} width={barW} height={h} fill="#28A745" rx={4} />
                                <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="11" fill={colorText}>{v}</text>
                                <text x={x + barW / 2} y={height - padding + 14} textAnchor="middle" fontSize="11" fill={colorMuted}>{monthNames[m]}</text>
                              </g>
                            );
                          });
                          return (
                            <g>
                              <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke={colorBorder} strokeWidth="1" />
                              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={colorBorder} strokeWidth="1" />
                              {grid}
                              {bars}
                            </g>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Sous-cartes directement sous l'histogramme (empilées) */}
                <div className="row g-2 g-md-3 mt-2">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body py-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="m-0">Répartition par statut</h6>
                        </div>
                        {(() => {
                          const items = (recentActivities || []).filter(x => (x.type||'').includes('devis'));
                          const total = items.length || 1;
                          const enAttente = items.filter(x => x.type.includes('new')).length;
                          const accepte = items.filter(x => x.type.includes('response')).length;
                          const annule = items.filter(x => x.type.includes('cancel')).length;
                          const values = [accepte, enAttente, annule];
                          const colors = ['#28A745','#FFC107','#F44336'];
                          const labels = ['Accepté','En attente','Annulé'];
                          const R = 50, C = 2*Math.PI*R;
                          let acc = 0;
                          const arcs = values.map((v, i) => {
                            const len = C * (v/total);
                            const dash = `${len} ${C-len}`;
                            const el = (<circle key={i} r={R} cx={70} cy={70} fill="transparent" stroke={colors[i]} strokeWidth={12} strokeDasharray={dash} strokeDashoffset={-acc} />);
                            acc += len;
                            return el;
                          });
                          return (
                            <div className="d-flex align-items-center gap-3">
                              <svg width={140} height={140} viewBox="0 0 140 140">
                                <circle r={R} cx={70} cy={70} fill="transparent" stroke="#E5E7EB" strokeWidth={12} />
                                {arcs}
                                <text x={70} y={74} textAnchor="middle" fontSize="13" fill="#374151">{items.length}</text>
                              </svg>
                              <div className="d-flex flex-column gap-2">
                                {values.map((v,i)=>(
                                  <div key={i} className="d-flex align-items-center gap-2">
                                    <span style={{display:'inline-block',width:10,height:10,background:colors[i],borderRadius:2}}></span>
                                    <span className="small" style={{minWidth:90}}>{labels[i]}</span>
                                    <span className="small text-muted">{v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body py-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="m-0">Derniers devis</h6>
                        </div>
                        <table className="table table-sm align-middle mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '36%' }}>Transitaire</th>
                              <th style={{ width: '28%' }}>Client</th>
                              <th style={{ width: '18%' }}>Statut</th>
                              <th style={{ width: '18%' }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const rows = (recentActivities || []).filter(x => (x.type||'').includes('devis')).slice(0,5);
                              if (!rows.length) return (<tr><td colSpan={4} className="text-muted small">Aucun devis récent</td></tr>);
                              return rows.map((r,i) => {
                                const d = r.data || {};
                                const trans = d.translataireName || d.translataire || '';
                                const client = d.actorName || d.clientName || '';
                                const statut = r.type.includes('response') ? 'accepté' : r.type.includes('cancel') ? 'annulé' : 'en attente';
                                return (
                                  <tr key={r.id || i}>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{trans || '-'}</td>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{client || '-'}</td>
                                    <td className="pe-5" style={{ minWidth: 180 }}>
                                      <span className={`badge ${statut==='accepté'?'bg-success':statut==='annulé'?'bg-danger':'bg-warning text-dark'}`} style={{ marginRight: 32, padding: '6px 10px' }}>{statut}</span>
                                    </td>
                                    <td className="text-muted ps-4" style={{ whiteSpace: 'nowrap', paddingLeft: 24 }}>{r.time || ''}</td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Activité récente */}
              <div className="col-12 col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title fw-bold m-0">Activité récente</h5>
                    </div>
                    <div className="d-flex flex-column gap-3">
                      {recentActivities.length === 0 && (
                        <div className="text-muted small">Aucune activité récente.</div>
                      )}
                      {recentActivities.map((n) => {
                        const t = (n.type || 'info');
                        const meta = t.includes('success') || t.includes('approve') ? { bg:'#E8F5E9', ic:'#28A745', Icon: CheckCircle } :
                                     t.includes('danger') || t.includes('block') || t.includes('delete') ? { bg:'#FFEBEE', ic:'#F44336', Icon: XCircle } :
                                     t.includes('devis') ? { bg:'#FFF9E6', ic:'#FFC107', Icon: FileText } : { bg:'#E3F2FD', ic:'#2196F3', Icon: UserPlus };
                        const Icon = meta.Icon;
                        return (
                          <button key={n.id} className="d-flex gap-3 text-start btn btn-link p-0" onClick={() => { setDetailItem(n); setDetailOpen(true); }}>
                            <div className="rounded-circle p-2 flex-shrink-0" style={{ backgroundColor: meta.bg, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon size={20} style={{ color: meta.ic }} />
                            </div>
                            <div className="flex-grow-1">
                              <div className="small">{n.title}</div>
                              {n.text && <div className="text-muted small" style={{ whiteSpace: 'normal' }}>{n.text}</div>}
                              <div className="text-muted" style={{ fontSize: 12 }}>{n.time}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
    {/* Modal détails notification */}
    {detailOpen && (
      <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 2000 }} onClick={() => setDetailOpen(false)}>
        <div className="card shadow" style={{ maxWidth: 560, margin: '10vh auto', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h5 className="m-0">Détails de la notification</h5>
              <button className="btn-close" onClick={() => setDetailOpen(false)} aria-label="Fermer"></button>
            </div>
            {(() => {
              const n = detailItem || {};
              const d = n.data || {};
              const type = (n.type || '').toString().toLowerCase();
              const meta = type.includes('success') || type.includes('approve') ? { bg:'#E8F5E9', ic:'#28A745', Icon: CheckCircle } :
                          type.includes('danger') || type.includes('block') || type.includes('delete') ? { bg:'#FFEBEE', ic:'#F44336', Icon: XCircle } :
                          type.includes('devis') ? { bg:'#FFF9E6', ic:'#FFC107', Icon: FileText } : { bg:'#E3F2FD', ic:'#2196F3', Icon: UserPlus };
              const Icon = meta.Icon;
              return (
                <div className="d-flex gap-3">
                  <div className="rounded-circle p-2 flex-shrink-0" style={{ backgroundColor: meta.bg, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} style={{ color: meta.ic }} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{n.title || 'Notification'}</div>
                    {n.body && <div className="text-muted" style={{ whiteSpace: 'normal' }}>{n.body}</div>}
                    <div className="text-muted small">{n.createdAt ? relTime(new Date(n.createdAt)) : ''}</div>
                    {(() => {
                      const actor = d.actorName || d.userName || d.clientName || '';
                      const mail = d.actorEmail || d.userEmail || d.clientEmail || '';
                      const ty = d.actorType || d.userType || '';
                      return (actor || mail || ty) ? (
                        <div className="small text-muted mt-1">{actor}{actor && mail ? ' · ' : ''}{mail}{(actor||mail) && ty ? ' · ' : ''}{ty}</div>
                      ) : null;
                    })()}
                    {(d.devisId || d.translataireId) && (
                      <div className="mt-3 d-flex gap-2">
                        {d.devisId && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setDetailOpen(false);
                              setDrawer({
                                title: 'Détail du devis',
                                content: (
                                  <div>
                                    <div className="mb-2"><strong>ID devis:</strong> {String(d.devisId)}</div>
                                    {d.translataireId && <div className="mb-2"><strong>ID translataire:</strong> {String(d.translataireId)}</div>}
                                    {d.typeService && <div className="mb-2"><strong>Service:</strong> {String(d.typeService)}</div>}
                                    {d.devisDescription && <div className="mb-2"><strong>Description:</strong><br/>{String(d.devisDescription)}</div>}
                                    {d.montant && <div className="mb-2"><strong>Montant:</strong> {String(d.montant)}</div>}
                                    {d.reponse && <div className="mb-2"><strong>Réponse translataire:</strong><br/>{String(d.reponse)}</div>}
                                    <div className="text-muted small">Affichage interne (aucune redirection)</div>
                                  </div>
                                )
                              });
                              setDrawerOpen(true);
                            }}
                          >
                            Voir le devis (dans l'admin)
                          </button>
                        )}
                        {d.translataireId && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              setDetailOpen(false);
                              setDrawer({
                                title: 'Avis du transitaire',
                                content: (
                                  <div>
                                    <div className="mb-2"><strong>ID translataire:</strong> {String(d.translataireId)}</div>
                                    {typeof d.rating !== 'undefined' && <div className="mb-2"><strong>Note:</strong> {String(d.rating)}★</div>}
                                    {d.comment && <div className="mb-2"><strong>Commentaire:</strong><br/>{String(d.comment)}</div>}
                                    <div className="text-muted small">Affichage interne (aucune redirection)</div>
                                  </div>
                                )
                              });
                              setDrawerOpen(true);
                            }}
                          >
                            Voir les avis (dans l'admin)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    )}
    {/* Drawer détails (reste dans l'admin) */}
    {drawerOpen && (
      <>
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.25)', zIndex: 1999 }} onClick={() => setDrawerOpen(false)} />
        <div className="position-fixed top-0 end-0 h-100 bg-white shadow" style={{ width: 420, zIndex: 2001, overflowY: 'auto' }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="m-0">{drawer.title || 'Détails'}</h6>
            <button className="btn-close" onClick={() => setDrawerOpen(false)} aria-label="Fermer"></button>
          </div>
          <div className="p-3">
            {drawer.content || <div className="text-muted small">Aucun contenu</div>}
          </div>
        </div>
      </>
    )}
  </>
  );
};

export default AdminDashboard;
