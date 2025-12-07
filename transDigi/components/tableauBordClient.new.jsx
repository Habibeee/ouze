import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  Bell, User, Search, Menu, X, 
  FileText, Truck, MapPin, Clock, 
  CheckCircle, XCircle, 
  ChevronDown, 
  Settings, LogOut
} from 'lucide-react';
import SideBare from './sideBare';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Composant de chargement
const MapLoading = () => (
  <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-2 text-gray-600">Chargement de la carte...</span>
  </div>
);

const ClientDashboard = () => {
  // États principaux
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLgUp, setIsLgUp] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : true);
  const [mapView, setMapView] = useState(true);
  const [selectedExpedition, setSelectedExpedition] = useState(null);
  const mapRef = useRef(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // États pour les notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs] = useState([]);
  const [unreadCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // États pour les expéditions
  const [expeditions] = useState([
    {
      id: 1,
      reference: 'EXP-2023-001',
      destination: 'Dakar, Sénégal',
      date_estimee: '15/12/2023',
      statut: 'en_cours',
      derniere_mise_a_jour: new Date().toLocaleString('fr-FR'),
      position: { lat: 14.7167, lng: -17.4677 },
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
      client: 'Client 2',
      type: 'Document',
      poids: '0.5 kg'
    }
  ]);

  // Gestion du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      const isLg = window.innerWidth >= 992;
      setIsLgUp(isLg);
      if (isLg) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fonction pour formater le statut des expéditions
  const formatExpeditionStatus = (status) => {
    switch (status) {
      case 'en_cours': return 'En cours';
      case 'en_retard': return 'En retard';
      case 'livre': return 'Livré';
      default: return status;
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getExpeditionStatusColor = (status) => {
    switch (status) {
      case 'en_cours': return 'primary';
      case 'en_retard': return 'danger';
      case 'livre': return 'success';
      default: return 'secondary';
    }
  };

  // Rendu de la section des expéditions
  const renderExpeditionsSection = () => (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Suivi des expéditions</h5>
        <div className="btn-group">
          <button 
            className={`btn btn-sm ${mapView ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setMapView(true)}
          >
            <MapPin size={16} className="me-1" /> Carte
          </button>
          <button 
            className={`btn btn-sm ${!mapView ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setMapView(false)}
          >
            <List size={16} className="me-1" /> Liste
          </button>
        </div>
      </div>
      <div className="card-body p-0">
        {mapView ? (
          <div className="position-relative" style={{ height: '500px' }}>
            <Suspense fallback={<MapLoading />}>
              <MapContainer 
                center={[14.4974, -14.4524]} 
                zoom={7} 
                style={{ height: '100%', width: '100%' }}
                whenCreated={map => { mapRef.current = map; }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {expeditions.map(expedition => (
                  <Marker 
                    key={expedition.id}
                    position={[expedition.position.lat, expedition.position.lng]}
                  >
                    <Popup>
                      <div>
                        <h6 className="fw-bold">{expedition.reference}</h6>
                        <p className="mb-1">{expedition.destination}</p>
                        <p className="mb-1">
                          <small className="text-muted">
                            Livraison: {expedition.date_estimee}
                          </small>
                        </p>
                        <span className={`badge bg-${getExpeditionStatusColor(expedition.statut)}`}>
                          {formatExpeditionStatus(expedition.statut)}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Suspense>
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
                </tr>
              </thead>
              <tbody>
                {expeditions.map(expedition => (
                  <tr key={expedition.id}>
                    <td>{expedition.reference}</td>
                    <td>{expedition.destination}</td>
                    <td>{expedition.client}</td>
                    <td>{expedition.type}</td>
                    <td>{expedition.poids}</td>
                    <td>
                      <span className={`badge bg-${getExpeditionStatusColor(expedition.statut)}`}>
                        {formatExpeditionStatus(expedition.statut)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Rendu du tableau de bord
  const renderDashboard = () => (
    <div className="container-fluid p-4">
      <h2 className="mb-4">Tableau de bord</h2>
      {renderExpeditionsSection()}
    </div>
  );

  // Styles globaux
  const globalStyles = `
    body {
      overflow-x: hidden;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    
    #root {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .main-container {
      display: flex;
      flex: 1;
      position: relative;
      padding-top: 64px;
    }
    
    .main-content {
      flex: 1;
      margin-left: 240px;
      transition: margin 0.3s ease;
      min-height: calc(100vh - 64px);
      padding: 1.5rem;
      overflow-x: hidden;
      background-color: #f8f9fa;
    }
    
    .main-content.sidebar-collapsed {
      margin-left: 64px;
    }
    
    @media (max-width: 991.98px) {
      .main-content {
        margin-left: 0 !important;
      }
    }
    
    .navbar {
      position: fixed;
      top: 0;
      right: 0;
      left: 0;
      z-index: 40;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      height: 64px;
      background-color: #fff;
    }
    
    .dropdown-menu {
      z-index: 1000;
    }
  `;

  return (
    <div className="main-container">
      <style jsx global>{globalStyles}</style>
      
      {/* En-tête */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container-fluid">
          <button 
            className="btn btn-link text-dark d-lg-none me-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
          
          <div className="d-flex align-items-center ms-auto">
            {/* Bouton de notification */}
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
                <div 
                  className="dropdown-menu dropdown-menu-end show"
                  style={{ minWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}
                >
                  <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                    <h6 className="mb-0">Notifications</h6>
                    <button 
                      className="btn btn-sm btn-link"
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
                              <CheckCircle className="text-success" />
                            ) : notif.type === 'error' ? (
                              <XCircle className="text-danger" />
                            ) : (
                              <Bell className="text-primary" />
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
            
            {/* Menu utilisateur */}
            <div className="dropdown">
              <button 
                className="btn btn-light d-flex align-items-center"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <div 
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                  style={{ width: '32px', height: '32px' }}
                >
                  {localStorage.getItem('userName')?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="ms-2 d-none d-md-inline">
                  {localStorage.getItem('userName') || 'Utilisateur'}
                </span>
                <ChevronDown size={16} className="ms-1" />
              </button>
              
              {profileMenuOpen && (
                <div className="dropdown-menu dropdown-menu-end show">
                  <button 
                    className="dropdown-item" 
                    onClick={() => {
                      setActiveSection('profil');
                      setProfileMenuOpen(false);
                    }}
                  >
                    <User size={16} className="me-2" />
                    Mon profil
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
      
      {/* Menu latéral */}
      <SideBare 
        activeId={activeSection}
        onNavigate={setActiveSection}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        collapsible={true}
        disableMobileOverlay={false}
      />
      
      {/* Contenu principal */}
      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {activeSection === 'dashboard' ? renderDashboard() : null}
        {activeSection === 'expeditions' ? renderExpeditionsSection() : null}
      </div>
    </div>
  );
};

export default ClientDashboard;
