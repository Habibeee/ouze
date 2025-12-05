import React, { useState, useEffect } from 'react';
import { 
  Bell, User, Search, Menu, X, 
  FileText, Truck, MapPin, Clock, 
  CheckCircle, XCircle, Archive, ChevronRight,
  Download, Printer, Share2, Filter,
  ChevronDown, ChevronUp, MoreVertical,
  Settings, LayoutGrid, MessageSquare
} from 'lucide-react';
import { toast } from 'react-toastify';
import SideBare from './SideBare';

const ClientDashboard = () => {
  // États principaux
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLgUp, setIsLgUp] = useState(window.innerWidth >= 992);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // États pour les devis
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [devis, setDevis] = useState([]);
  const [devisLoading, setDevisLoading] = useState(false);
  const [devisError, setDevisError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // États pour les notifications et utilisateur
  const [recentActivities, setRecentActivities] = useState([]);
  const [userName, setUserName] = useState('Utilisateur');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isGotoDevis, setIsGotoDevis] = useState(false);

  // Styles personnalisés
  const clientStyles = {
    tableCell: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '200px',
      display: 'inline-block',
      verticalAlign: 'middle'
    },
    layout: {
      minHeight: '100vh',
    },
    contentTransition: 'margin-left 0.3s ease',
  };

  const clientCss = `
    .sidebar-open {
      overflow: hidden;
    }
    .sidebar-collapsed .sidebar {
      width: 56px;
    }
  `;

  // Fonctions API (à adapter selon votre backend)
  const cancelDevisApi = async (id) => {
    const response = await fetch(`/api/devis/${id}/cancel`, { method: 'POST' });
    if (!response.ok) throw new Error('Erreur lors de l\'annulation');
    return await response.json();
  };

  const archiveDevisApi = async (id) => {
    const response = await fetch(`/api/devis/${id}/archive`, { method: 'POST' });
    if (!response.ok) throw new Error('Erreur lors de l\'archivage');
    return await response.json();
  };

  const listNotifications = async (limit) => {
    const response = await fetch(`/api/notifications?limit=${limit}`);
    if (!response.ok) throw new Error('Erreur lors du chargement des notifications');
    return await response.json();
  };

  const logout = async () => {
    localStorage.clear();
    sessionStorage.clear();
  };

  const fetchDevis = async ({ page, limit }) => {
    setDevisLoading(true);
    try {
      const response = await fetch(`/api/devis?page=${page}&limit=${limit}`);
      const data = await response.json();
      setDevis(data.items || []);
      setDevisError(null);
    } catch (error) {
      setDevisError('Erreur lors du chargement des devis');
      console.error(error);
    } finally {
      setDevisLoading(false);
    }
  };

  // Gestion des devis
  const cancelDevis = async (id) => {
    if (confirmCancelId !== id) {
      setConfirmCancelId(id);
      setTimeout(() => { 
        setConfirmCancelId(prev => prev === id ? null : prev); 
      }, 4000);
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
      const response = await archiveDevisApi(id);
      
      if (response && response.success === false) {
        throw new Error(response.message || 'Échec de l\'archivage du devis');
      }
      
      await fetchDevis({ page, limit });
      toast.success('Le devis a été archivé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'archivage du devis:', error);
      
      if (error.response) {
        if (error.response.status === 404) {
          toast.error('La ressource demandée est introuvable. Veuillez réessayer.');
        } else if (error.response.status === 401) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          window.location.href = '/connexion';
        } else {
          const errorMessage = error.response.data?.message || 'Une erreur est survenue lors de l\'archivage du devis';
          toast.error(errorMessage);
        }
      } else if (error.request) {
        toast.error('Pas de réponse du serveur. Vérifiez votre connexion internet.');
      } else {
        toast.error(error.message || 'Erreur lors de la préparation de la requête');
      }
    } finally {
      setIsArchiving(false);
    }
  };

  const archiverDevis = (id) => {
    setDevis(prevDevis => prevDevis.filter(devis => devis.id !== id));
  };

  const annulerDevis = (id) => {
    setDevis(prevDevis => 
      prevDevis.map(devis => 
        devis.id === id 
          ? { ...devis, status: 'Annulé' } 
          : devis
      )
    );
  };

  // Gestionnaires d'événements
  const onViewDevis = (id) => {
    console.log('Voir devis:', id);
  };

  const onBellClick = () => {
    setNotifOpen(!notifOpen);
  };

  const onMarkAll = () => {
    console.log('Marquer toutes les notifications comme lues');
  };

  const onNotifClick = (id, notif) => {
    console.log('Notification cliquée:', id, notif);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'en attente':
      case 'attente':
        return 'bg-warning';
      case 'approuvé':
      case 'accepte':
        return 'bg-success';
      case 'rejeté':
      case 'rejete':
        return 'bg-danger';
      case 'en transit':
        return 'bg-primary';
      case 'livré':
        return 'bg-info';
      case 'annulé':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  };

  // Effects
  useEffect(() => {
    let isMounted = true;
    
    const fetchNotifications = async () => {
      try {
        const items = await listNotifications(5);
        if (!isMounted) return;
        
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
        setNotifs(mapped);
        setUnreadCount(mapped.filter(n => !n.read).length);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    };
    
    fetchNotifications();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    fetchDevis({ page, limit });
  }, [page, limit]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsLgUp(width >= 992);
      setIsMobile(width <= 768);
      if (width > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const body = document.body;
    if (sidebarOpen) {
      body.classList.add('sidebar-open');
      body.classList.remove('sidebar-collapsed');
    } else {
      body.classList.add('sidebar-collapsed');
      body.classList.remove('sidebar-open');
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        body.classList.remove('sidebar-open', 'sidebar-collapsed');
      }
    };
  }, [sidebarOpen]);

  // Rendu du tableau de bord
  const renderDashboard = () => (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="h2 mb-2">Tableau de bord</h1>
          <p className="text-muted">Bienvenue, {userName || 'Utilisateur'}</p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Devis en attente</h6>
                  <h3 className="mb-0">
                    {devis.filter(d => d.status === 'attente' || d.status === 'En attente').length}
                  </h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <FileText className="text-primary" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Devis acceptés</h6>
                  <h3 className="mb-0">
                    {devis.filter(d => d.status === 'accepte' || d.status === 'Approuvé').length}
                  </h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <CheckCircle className="text-success" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Envois en cours</h6>
                  <h3 className="mb-0">0</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <Truck className="text-warning" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Derniers devis</h5>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary">
              <Filter size={16} className="me-1" />
              Filtres
            </button>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => setSection('devis')}
            >
              Voir tout
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '15%' }}>Référence</th>
                  <th style={{ width: '20%' }}>Destination</th>
                  <th style={{ width: '15%' }}>Date</th>
                  <th style={{ width: '15%' }}>Statut</th>
                  <th style={{ width: '15%' }}>Montant</th>
                  <th className="text-end" style={{ width: '20%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devisLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                    </td>
                  </tr>
                ) : devisError ? (
                  <tr>
                    <td colSpan="6" className="text-center text-danger py-4">
                      {devisError}
                    </td>
                  </tr>
                ) : devis.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      Aucun devis trouvé
                    </td>
                  </tr>
                ) : (
                  devis.slice(0, 5).map((devisItem) => (
                    <tr key={devisItem.id}>
                      <td style={{ ...clientStyles.tableCell, width: '15%' }} title={devisItem.reference || devisItem.id || 'N/A'}>
                        {devisItem.reference || devisItem.id || 'N/A'}
                      </td>
                      <td style={{ width: '20%' }}>
                        <div className="d-flex align-items-center" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <MapPin size={14} className="me-1 text-muted flex-shrink-0" />
                          <span className="text-truncate" style={{ display: 'inline-block', maxWidth: 'calc(100% - 20px)' }} title={devisItem.destination || 'N/A'}>
                            {devisItem.destination || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td style={{ width: '15%' }} title={devisItem.date || (devisItem.createdAt ? new Date(devisItem.createdAt).toLocaleDateString('fr-FR') : 'N/A')}>
                        {devisItem.date || (devisItem.createdAt ? new Date(devisItem.createdAt).toLocaleDateString('fr-FR') : 'N/A')}
                      </td>
                      <td style={{ width: '15%' }}>
                        <span className={`badge ${getStatusClass(devisItem.status)}`} style={{ whiteSpace: 'nowrap' }}>
                          {devisItem.statusLabel || devisItem.status}
                        </span>
                      </td>
                      <td className="fw-bold" style={{ width: '15%' }}>{devisItem.amount || devisItem.montant || 'N/A'}</td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => onViewDevis(devisItem.id)}
                          >
                            Voir
                          </button>
                          {(devisItem.status === 'attente' || devisItem.status === 'En attente') && (
                            <>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => annulerDevis(devisItem.id)}
                              >
                                Annuler
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleArchive(devisItem.id)}
                                disabled={isArchiving}
                              >
                                {isArchiving ? 'Archivage...' : 'Archiver'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-body border-top">
          <div className="d-flex justify-content-between align-items-center text-muted">
            <div>Affichage de 1 à {Math.min(devis.length, 5)} sur {devis.length} entrées</div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Précédent
              </button>
              <button className="btn btn-sm btn-secondary">
                {page}
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(p => p + 1)}>
                Suivant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="d-flex min-vh-100" style={{ ...clientStyles.layout, backgroundColor: 'var(--bg)', position: 'relative' }}>
      <style>{clientCss}</style>
      <style>{
        `:root {
          --sidebar-width: ${sidebarOpen ? '240px' : '56px'};
          --content-transition: ${clientStyles.contentTransition};
        }`
      }</style>
      
      <SideBare
        activeId={section}
        onOpenChange={setSidebarOpen}
        open={sidebarOpen}
        isLgUp={isLgUp}
        collapsible={true}
        closeOnNavigate={!isLgUp}
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

      {/* Overlay pour mobile */}
      {sidebarOpen && isMobile && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          onClick={closeSidebar}
          style={{zIndex: 1010}}
        />
      )}
    
      <div className="flex-grow-1" style={{ 
        paddingLeft: 0, 
        minWidth: 0, 
        position: 'relative', 
        backgroundColor: 'var(--bg)',
        minHeight: 'calc(100vh - 96px)',
        marginTop: '96px'
      }}>
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
          {!isLgUp && (
            <button 
              className="btn btn-link p-1" 
              onClick={toggleSidebar}
              aria-label="Toggle menu"
              style={{ marginRight: 'auto' }}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          
          <div className="d-none d-md-flex align-items-center bg-light rounded-pill px-3 mx-auto" style={{width: '24rem'}}>
            <Search size={18} className="text-muted me-2" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="form-control border-0 bg-transparent"
            />
          </div>
          
          <div className="ms-auto d-flex align-items-center gap-2 position-relative">
            <button 
              className="btn btn-link position-relative p-1" 
              onClick={onBellClick} 
              aria-label="Notifications"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Bell size={24} className="text-dark" />
              {unreadCount > 0 && (
                <span 
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: '0.6rem', padding: '0.2rem 0.35rem' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
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
                            {n.text && <div className="small text-muted">{n.text}</div>}
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
            <button 
              className="btn p-0 border-0 bg-transparent position-relative" 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)} 
              aria-label="Ouvrir menu profil"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #e9ecef',
                padding: '2px',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#adb5bd';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e9ecef';
              }}
            >
              <img 
                src={avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName || 'U') + '&background=random'} 
                alt="Profil" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName || 'U') + '&background=random';
                }}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '50%'
                }} 
              />
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

        <div className="container-fluid px-2 px-md-4 py-3 py-md-4" style={{ backgroundColor: 'var(--bg)' }}>
          {(() => {
            if (isGotoDevis) {
              return <NouveauDevis />;
            }
            switch(section) {
              case 'envois':
              case 'profil':
              case 'historique':
              case 'historique-devis':
              case 'recherche':
              case 'devis':
                return (
                  <div className="alert alert-info m-4">
                    <h4>Fonctionnalité en cours de développement</h4>
                    <p>Cette section sera bientôt disponible.</p>
                  </div>
                );
              case 'dashboard':
              default:
                return renderDashboard();
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;