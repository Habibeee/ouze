import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  Bell, User, Menu, X, 
  MapPin, Clock, 
  CheckCircle, XCircle, AlertCircle,
  RefreshCw, List, Loader2, LogOut,
  ChevronDown, Settings
} from 'lucide-react';

// Composant de chargement pour la carte
const MapLoading = () => (
  <div className="d-flex align-items-center justify-content-center bg-light rounded" style={{ height: '500px' }}>
    <Loader2 className="spinner-border text-primary" />
    <span className="ms-2 text-muted">Chargement de la carte...</span>
  </div>
);

// Composant SideBare simplifié
const SideBare = ({ activeId, onNavigate, open, onOpenChange }) => (
  <div className={`sidebar ${open ? 'open' : 'closed'}`} style={{
    position: 'fixed',
    top: '64px',
    left: 0,
    width: open ? '240px' : '56px',
    height: 'calc(100vh - 64px)',
    backgroundColor: '#fff',
    borderRight: '1px solid #e9ecef',
    transition: 'width 0.3s ease',
    zIndex: 30,
    overflowY: 'auto'
  }}>
    <div className="p-3">
      <button 
        className={`btn w-100 mb-3 ${activeId === 'dashboard' ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => onNavigate('dashboard')}
      >
        {open ? '📊 Tableau de bord' : '📊'}
      </button>
      <button 
        className={`btn w-100 ${activeId === 'envois' ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => onNavigate('envois')}
      >
        {open ? '📦 Expéditions' : '📦'}
      </button>
    </div>
  </div>
);

// Icône de carte personnalisée
const MapIconCustom = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
    <line x1="9" y1="3" x2="9" y2="18"></line>
    <line x1="15" y1="6" x2="15" y2="21"></line>
  </svg>
);

const ClientDashboard = () => {
  // États principaux
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapView, setMapView] = useState(false); // Démarrer en vue liste
  const [selectedExpedition, setSelectedExpedition] = useState(null);
  
  // États pour les expéditions
  const [expeditions, setExpeditions] = useState([
    {
      id: 1,
      reference: 'EXP-2023-001',
      destination: 'Dakar, Sénégal',
      date_estimee: '15/12/2023',
      statut: 'en_cours',
      derniere_mise_a_jour: new Date().toLocaleString('fr-FR'),
      position: { lat: 14.7167, lng: -17.4677 },
      adresse: 'Rue 10, Dakar Plateau',
      client: 'Client 1',
      type: 'Colis standard',
      poids: '2.5 kg'
    },
    {
      id: 2,
      reference: 'EXP-2023-002',
      destination: 'Thiès, Sénégal',
      date_estimee: '10/12/2023',
      statut: 'en_retard',
      derniere_mise_a_jour: new Date().toLocaleString('fr-FR'),
      position: { lat: 14.7915, lng: -16.9359 },
      adresse: 'Avenue Lamine Gueye, Thiès',
      client: 'Client 2',
      type: 'Document',
      poids: '0.5 kg'
    },
    {
      id: 3,
      reference: 'EXP-2023-003',
      destination: 'Saint-Louis, Sénégal',
      date_estimee: '20/12/2023',
      statut: 'en_transit',
      derniere_mise_a_jour: new Date().toLocaleString('fr-FR'),
      position: { lat: 16.0179, lng: -16.5119 },
      adresse: 'Place Faidherbe',
      client: 'Client 3',
      type: 'Colis express',
      poids: '1.2 kg'
    }
  ]);
  const [expeditionsLoading, setExpeditionsLoading] = useState(false);
  const [expeditionsError, setExpeditionsError] = useState(null);

  // États pour les notifications et profil
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([
    { id: 1, type: 'info', message: 'Nouvelle expédition créée', time: 'Il y a 5 min' },
    { id: 2, type: 'success', message: 'Livraison effectuée', time: 'Il y a 1h' }
  ]);
  const [unreadCount, setUnreadCount] = useState(2);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userName, setUserName] = useState('Utilisateur');

  // Fonction pour récupérer les expéditions
  const fetchExpeditions = async () => {
    setExpeditionsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExpeditionsError(null);
    } catch (error) {
      console.error('Erreur:', error);
      setExpeditionsError('Impossible de charger les expéditions. Veuillez réessayer plus tard.');
    } finally {
      setExpeditionsLoading(false);
    }
  };

  // Fonction pour formater le statut des expéditions
  const formatExpeditionStatus = (status) => {
    const statusMap = {
      'en_cours': 'En cours',
      'en_transit': 'En transit',
      'livré': 'Livré',
      'en_retard': 'En retard'
    };
    return statusMap[status] || status;
  };

  const getExpeditionStatusColor = (status) => {
    switch (status) {
      case 'en_cours': return 'primary';
      case 'en_transit': return 'info';
      case 'livré': return 'success';
      case 'en_retard': return 'danger';
      default: return 'secondary';
    }
  };

  // Gestion du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Rendu de la section des expéditions
  const renderExpeditionsSection = () => (
    <div className="card mb-4 shadow-sm">
      <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <h5 className="mb-0">Suivi des expéditions en temps réel</h5>
        <div className="d-flex">
          <div className="btn-group me-2" role="group">
            <button 
              className={`btn btn-sm ${mapView ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setMapView(true)}
              title="Vue carte"
            >
              <MapIconCustom size={16} />
            </button>
            <button 
              className={`btn btn-sm ${!mapView ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setMapView(false)}
              title="Vue liste"
            >
              <List size={16} />
            </button>
          </div>
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={fetchExpeditions}
            disabled={expeditionsLoading}
            title="Rafraîchir"
          >
            {expeditionsLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {expeditionsLoading ? (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement des expéditions...</span>
            </div>
          </div>
        ) : expeditionsError ? (
          <div className="alert alert-warning">
            <AlertCircle size={16} className="me-2" />
            {expeditionsError}
            <button 
              className="btn btn-sm btn-link p-0 ms-2" 
              onClick={fetchExpeditions}
            >
              Réessayer
            </button>
          </div>
        ) : expeditions.length === 0 ? (
          <div className="text-muted p-4 text-center">
            Aucune expédition en cours pour le moment
          </div>
        ) : mapView ? (
          <div className="alert alert-info">
            <AlertCircle size={16} className="me-2" />
            La carte interactive nécessite la bibliothèque Leaflet. En mode démo, utilisez la vue liste.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Référence</th>
                  <th>Destination</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Poids</th>
                  <th>Statut</th>
                  <th>Date estimée</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expeditions.map((expedition) => (
                  <tr 
                    key={expedition.id} 
                    className={selectedExpedition === expedition.id ? 'table-active' : ''}
                    onClick={() => setSelectedExpedition(expedition.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="fw-medium">{expedition.reference}</td>
                    <td>
                      <MapPin size={14} className="me-1 text-muted" />
                      {expedition.destination}
                    </td>
                    <td>{expedition.client}</td>
                    <td>{expedition.type}</td>
                    <td>{expedition.poids}</td>
                    <td>
                      <span className={`badge bg-${getExpeditionStatusColor(expedition.statut)}`}>
                        {formatExpeditionStatus(expedition.statut)}
                      </span>
                    </td>
                    <td>
                      <Clock size={14} className="me-1 text-muted" />
                      <small>{expedition.date_estimee}</small>
                    </td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Détails de l'expédition ${expedition.reference}`);
                        }}
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {selectedExpedition && (
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="mb-2">Détails de l'expédition sélectionnée</h6>
                {expeditions.filter(e => e.id === selectedExpedition).map(exp => (
                  <div key={exp.id}>
                    <p className="mb-1"><strong>Référence:</strong> {exp.reference}</p>
                    <p className="mb-1"><strong>Adresse complète:</strong> {exp.adresse}</p>
                    <p className="mb-1"><strong>Dernière mise à jour:</strong> {exp.derniere_mise_a_jour}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div>
      <h2 className="mb-4">Tableau de bord</h2>
      
      {/* Statistiques rapides */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Expéditions en cours</h6>
              <h3 className="mb-0">{expeditions.filter(e => e.statut === 'en_cours').length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">En transit</h6>
              <h3 className="mb-0">{expeditions.filter(e => e.statut === 'en_transit').length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">En retard</h6>
              <h3 className="mb-0 text-danger">{expeditions.filter(e => e.statut === 'en_retard').length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total</h6>
              <h3 className="mb-0">{expeditions.length}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {renderExpeditionsSection()}
    </div>
  );

  const globalStyles = `
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .main-container {
      min-height: 100vh;
      padding-top: 64px;
    }
    
    .main-content {
      margin-left: 240px;
      transition: margin-left 0.3s ease;
      padding: 1.5rem;
      min-height: calc(100vh - 64px);
    }
    
    .main-content.sidebar-collapsed {
      margin-left: 56px;
    }
    
    @media (max-width: 991.98px) {
      .main-content {
        margin-left: 0 !important;
      }
      
      .sidebar {
        transform: translateX(-100%);
      }
      
      .sidebar.open {
        transform: translateX(0);
      }
    }
    
    .navbar {
      position: fixed;
      top: 0;
      right: 0;
      left: 0;
      z-index: 40;
      height: 64px;
      background-color: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .dropdown-menu.show {
      display: block;
    }
  `;

  return (
    <>
      <style>{globalStyles}</style>
      
      <div className="main-container">
        <nav className="navbar navbar-expand-lg navbar-light bg-white">
          <div className="container-fluid">
            <button 
              className="btn btn-link text-dark d-lg-none me-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            
            <span className="navbar-brand mb-0 h1">🚚 LogiTrack</span>
            
            <div className="d-flex align-items-center ms-auto">
              <div className="position-relative me-3">
                <button 
                  className="btn btn-light position-relative"
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {notifOpen && (
                  <div className="dropdown-menu dropdown-menu-end show position-absolute" style={{ minWidth: '300px', right: 0 }}>
                    <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                      <h6 className="mb-0">Notifications</h6>
                      <button 
                        className="btn btn-sm btn-link text-dark"
                        onClick={() => setNotifOpen(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {notifs.length > 0 ? (
                      notifs.map(notif => (
                        <div key={notif.id} className="dropdown-item">
                          <div className="d-flex">
                            <div className="me-2">
                              {notif.type === 'success' ? (
                                <CheckCircle size={16} className="text-success" />
                              ) : notif.type === 'error' ? (
                                <XCircle size={16} className="text-danger" />
                              ) : (
                                <Bell size={16} className="text-primary" />
                              )}
                            </div>
                            <div>
                              <div className="small">{notif.message}</div>
                              <div className="text-muted small">{notif.time}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted">
                        Aucune notification
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="dropdown">
                <button 
                  className="btn btn-light d-flex align-items-center"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                    style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="ms-2 d-none d-md-inline">{userName}</span>
                  <ChevronDown size={16} className="ms-1" />
                </button>
                
                {profileMenuOpen && (
                  <div className="dropdown-menu dropdown-menu-end show position-absolute" style={{ right: 0 }}>
                    <button className="dropdown-item" onClick={() => { setActiveSection('profil'); setProfileMenuOpen(false); }}>
                      <User size={16} className="me-2" />
                      Mon profil
                    </button>
                    <button className="dropdown-item">
                      <Settings size={16} className="me-2" />
                      Paramètres
                    </button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item text-danger">
                      <LogOut size={16} className="me-2" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
        
        <SideBare 
          activeId={activeSection}
          onNavigate={(section) => {
            setActiveSection(section);
            if (window.innerWidth < 992) setSidebarOpen(false);
          }}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />
        
        <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <div className="container-fluid">
            {activeSection === 'dashboard' && renderDashboard()}
            {activeSection === 'envois' && (
              <div>
                <h2 className="mb-4">Mes Expéditions</h2>
                {renderExpeditionsSection()}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDashboard;