import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Search, FileText, Truck, CheckCircle, Bell, User
} from 'lucide-react';
import { clientStyles, clientCss } from '../styles/tableauBordClientStyle.jsx';
import Sidebar from './sideBare.jsx';
import RechercheTransitaire from './rechercheTransitaire.jsx';
import NouveauDevis from './nouveauDevis.jsx';
import TrackingApp from './suiviEnvoi.jsx';
import ModofierProfClient from './modofierProfClient.jsx';
import HistoriqueDevis from './historiqueDevis.jsx';
import { get, listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount, archiveDevis as archiveDevisApi } from '../services/apiClient.js';
import { useToast } from './ui/ToastProvider.jsx';
import { getAuth, clearAuth } from '../services/authStore.js';

const ClientDashboard = () => {
  const toast = useToast();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLgUp, setIsLgUp] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 992 : true));
  const [section, setSection] = useState('dashboard');
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(() => {
    return !sessionStorage.getItem('welcomeMessageShown');
  });
  const [userName, setUserName] = useState('');
  const [devis, setDevis] = useState([]);
  const [devisLoading, setDevisLoading] = useState(true);
  const [devisError, setDevisError] = useState(null);
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
  const [isArchiving, setIsArchiving] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isGotoDevis, setIsGotoDevis] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('https://ui-avatars.com/api/?name=U&background=random');

  useEffect(() => {
    const user = getAuth();
    if (user && user.user) {
      setUserName(user.user.name || user.user.email.split('@')[0]);
    }
  }, []);

  useEffect(() => {
    if (showWelcomeMessage) {
      sessionStorage.setItem('welcomeMessageShown', 'true');
      const timer = setTimeout(() => {
        setShowWelcomeMessage(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeMessage]);

  useEffect(() => {
    const onResize = () => setIsLgUp(window.innerWidth >= 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
        case '#/historique-devis':
          setSection('historique-devis');
          break;
        case '#/profil-client': 
        case '#/profil-client/modifier': 
          setSection('profil');
          break;
        case '#/envois': 
          setSection('envois');
          break;
        case '#/mes-fichiers-recus':
          setSection('fichiers-recus');
          break;
        case '#/dashboard-client': 
        case '':
        default:
          setSection('dashboard');
      }
    };

    window.addEventListener('hashchange', updateSection);
    updateSection();
    return () => window.removeEventListener('hashchange', updateSection);
  }, []);

  const onViewDevis = (id) => {
    window.location.hash = `#/detail-devis-client?id=${id}`;
  };

  const fetchDevis = async (opts) => {
    try {
      setDevisLoading(true);
      setDevisError('');
      const curPage = opts?.page || page;
      const curLimit = opts?.limit || limit;
      const res = await get('/devis');
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
    } finally { 
      setDevisLoading(false); 
    }
  };

  useEffect(() => { 
    fetchDevis({ page: 1, limit }); 
  }, []);

  const onOpenEdit = async (d) => {
    setEditId(d.id);
    setEditOpen(true);
    setEditLoading(true);
    try {
      const res = await get(`/devis/${d.id}`);
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
    } finally { 
      setEditLoading(false); 
    }
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
      await post(`/devis/${editId}`, fd);
      setEditOpen(false);
      await fetchDevis({ page: 1, limit });
      toast.success('Demande mise à jour');
    } catch (e) {
      toast.error(e?.message || 'Échec de la mise à jour');
    } finally { 
      setEditLoading(false); 
    }
  };

  const cancelDevis = async (id) => {
    if (confirmCancelId !== id) {
      setConfirmCancelId(id);
      setTimeout(() => { 
        setConfirmCancelId(prev => prev === id ? null : prev); 
      }, 4000);
      return;
    }
    try {
      await post(`/devis/${id}/cancel`);
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
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    };
    
    fetchNotifications();
    
    return () => {
      isMounted = false;
    };
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
                    {devis.filter(d => d.status === 'attente').length}
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
                    {devis.filter(d => d.status === 'accepte').length}
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

      <div className="card mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Mes devis</h5>
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => setSection('historique-devis')}
          >
            Voir tout
          </button>
        </div>
        <div className="card-body p-0">
          {devisLoading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-2 mb-0 text-muted">Chargement de vos devis...</p>
            </div>
          ) : devisError ? (
            <div className="alert alert-danger m-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {devisError}
            </div>
          ) : devis.length === 0 ? (
            <div className="text-center p-4">
              <i className="bi bi-inbox text-muted" style={{fontSize: '2rem', opacity: 0.5}}></i>
              <p className="mt-2 mb-0 text-muted">Aucun devis trouvé</p>
              <button 
                className="btn btn-primary mt-3"
                onClick={() => setSection('devis')}
              >
                Créer un devis
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devis.slice(0, 5).map((devisItem) => (
                    <tr key={devisItem.id}>
                      <td className="align-middle">
                        <div className="fw-medium">Devis {devisItem.reference || 'N/A'}</div>
                        <small className="text-muted">{devisItem.routeLabel}</small>
                      </td>
                      <td className="align-middle">
                        {new Date(devisItem.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="align-middle">
                        <span className={`badge bg-${devisItem.status === 'accepte' ? 'success' : 
                                         devisItem.status === 'attente' ? 'warning' : 'secondary'}`}>
                          {devisItem.statusLabel}
                        </span>
                      </td>
                      <td className="text-end align-middle">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onViewDevis(devisItem.id)}
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {devis.length > 0 && (
          <div className="card-footer bg-white text-end">
            <button 
              className="btn btn-link text-primary p-0"
              onClick={() => setSection('historique-devis')}
            >
              Voir tous les devis <i className="bi bi-arrow-right ms-1"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="d-flex" style={{ ...clientStyles.layout, backgroundColor: 'var(--bg)', position: 'relative' }}>
      <style>{clientCss}</style>
      <style>{
        `:root {
          --sidebar-width: ${sidebarOpen ? '240px' : '56px'};
          --content-transition: ${clientStyles.contentTransition};
        }`
      }</style>
      <Sidebar
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
      
      <div className="flex-grow-1" style={{ 
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
            <div className="position-relative">
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
            </div>
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
              <div 
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e9ecef',
                  borderRadius: '50%',
                  color: '#6c757d',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
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
                  <button className="list-group-item list-group-item-action text-danger" onClick={async () => { setProfileMenuOpen(false); try { clearAuth(); } finally { window.location.hash = '#/connexion'; } }}>
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
                return <TrackingApp />;
              case 'profil':
                return <ModofierProfClient />;
              case 'historique':
              case 'historique-devis':
                return <HistoriqueDevis />;
              case 'recherche':
                return <RechercheTransitaire />;
              case 'devis':
                return <NouveauDevis />;
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