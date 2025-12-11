import React, { useState, useEffect, useRef, Suspense, lazy, useLayoutEffect } from 'react';
import { 
  Bell, User, Search, Menu, X, 
  FileText, Truck, MapPin, Clock, 
  CheckCircle, XCircle, Archive, ChevronRight,
  Download, Printer, Share2, Filter,
  ChevronDown, ChevronUp, MoreVertical,
  Settings, LayoutGrid, MessageSquare, AlertCircle,
  RefreshCw, Map as MapIcon, List, Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import '../src/styles/leaflet.css';
import SideBare from './sideBare.jsx';

// Import direct des composants Leaflet
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Composant de chargement
const MapLoading = () => (
  <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    <span className="ml-2 text-gray-600">Chargement de la carte...</span>
  </div>
);

const ClientDashboard = () => {
  // Fonction pour gérer le clic sur une notification
  const handleNotificationClick = (notif) => {
    // Marquer comme lu si nécessaire
    if (!notif.lu) {
      // Mettre à jour l'état local
      setNotifs(notifs.map(n => 
        n.id === notif.id ? { ...n, lu: true } : n
      ));
      // Mettre à jour le compteur de notifications non lues
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    // Fermer le menu des notifications
    setNotifOpen(false);
  };

  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifs(notifs.map(n => ({ ...n, lu: true })));
    setUnreadCount(0);
  };

  // États principaux
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLgUp, setIsLgUp] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [mapView, setMapView] = useState(true); // true pour la carte, false pour la liste
  const [selectedExpedition, setSelectedExpedition] = useState(null);
  const mapRef = useRef(null);

  // Gestion du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      const isLarge = window.innerWidth >= 992;
      setIsLgUp(isLarge);
      setIsMobile(window.innerWidth <= 768);
      
      // Sur les grands écrans, forcer la sidebar à être ouverte
      if (isLarge) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Appel initial
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mise à jour de la largeur de la sidebar dans les variables CSS
  useLayoutEffect(() => {
    try {
      const val = sidebarOpen ? '240px' : '56px';
      document.documentElement.style.setProperty('--sidebar-width', val);
    } catch (e) {
      console.error('Erreur lors de la mise à jour de la largeur de la sidebar:', e);
    }
  }, [sidebarOpen]);

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
    }
  ]);
  const [expeditionsLoading, setExpeditionsLoading] = useState(false);
  const [expeditionsError, setExpeditionsError] = useState(null);

  // États pour les notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState('Utilisateur');

  // Autres états existants...
  const [devis, setDevis] = useState([]);
  const [devisLoading, setDevisLoading] = useState(false);
  const [devisError, setDevisError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);

  // Fonction pour récupérer les expéditions
  const fetchExpeditions = async () => {
    setExpeditionsLoading(true);
    try {
      // Simulation de chargement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Pour un déploiement réel, utilisez :
      // const response = await fetch('/api/expeditions/en-cours');
      // if (!response.ok) throw new Error('Erreur lors de la récupération des expéditions');
      // const data = await response.json();
      // setExpeditions(data);
      
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

  // Autres fonctions existantes...
  const getExpeditionStatusColor = (status) => {
    switch (status) {
      case 'en_cours': return 'primary';
      case 'en_transit': return 'info';
      case 'livré': return 'success';
      case 'en_retard': return 'danger';
      default: return 'secondary';
    }
  };

  // Effet pour charger les expéditions au montage
  useEffect(() => {
    fetchExpeditions();
    // Mettre à jour les expéditions toutes les 5 minutes
    const interval = setInterval(fetchExpeditions, 5 * 60 * 1000);
    
    // Nettoyage lors du démontage du composant
    return () => {
      clearInterval(interval);
      // Nettoyage de la carte si elle existe
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Rendu de la section des expéditions avec la carte
  const renderExpeditionsSection = () => {
    return (
      <div className="card mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Suivi des expéditions en temps réel</h5>
          <div className="d-flex">
            <div className="btn-group me-2" role="group">
              <button 
                className={`btn btn-sm ${mapView ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setMapView(true)}
                title="Vue carte"
              >
                <MapIcon size={16} />
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
        
        {expeditionsLoading ? (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement des expéditions...</span>
            </div>
          </div>
        ) : expeditionsError ? (
          <div className="alert alert-warning m-3">
            <AlertCircle className="me-2" />
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
          // Vue Carte (UN SEUL MapContainer)
          <div className="position-relative" style={{ height: '500px' }}>
            <Suspense fallback={<MapLoading />}>
              <div style={{ height: '100%', width: '100%' }}>
                <MapContainer 
                  key="map-container"
                  center={[14.4974, -14.4524]} 
                  zoom={7} 
                  style={{ height: '100%', width: '100%' }}
                  whenCreated={(map) => {
                    // Nettoyage de la carte précédente si elle existe
                    if (mapRef.current) {
                      mapRef.current.remove();
                    }
                    // Stocke la référence de la nouvelle carte
                    mapRef.current = map;
                  }}
                  preferCanvas={true}
                  zoomControl={true}
                  attributionControl={true}
                  doubleClickZoom={true}
                  closePopupOnClick={true}
                  dragging={true}
                  zoomSnap={0.5}
                  zoomDelta={0.5}
                  trackResize={true}
                  touchZoom={true}
                  scrollWheelZoom={true}
                  tap={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {expeditions.map((expedition) => (
                    <Marker 
                      key={expedition.id} 
                      position={[expedition.position.lat, expedition.position.lng]}
                      eventHandlers={{
                        click: () => setSelectedExpedition(expedition.id === selectedExpedition ? null : expedition.id)
                      }}
                    >
                      <Popup>
                        <div className="expedition-info-window">
                          <h6 className="mb-1 fw-bold">{expedition.reference}</h6>
                          <p className="mb-1">
                            <MapPin size={14} className="me-1" />
                            {expedition.destination}
                          </p>
                          <p className="mb-1">
                            <Clock size={14} className="me-1" />
                            Livraison estimée: {expedition.date_estimee}
                          </p>
                          <p className="mb-1">
                            <strong>Client:</strong> {expedition.client}
                          </p>
                          <p className="mb-1">
                            <strong>Type:</strong> {expedition.type} ({expedition.poids})
                          </p>
                          <span className={`badge bg-${getExpeditionStatusColor(expedition.statut)}`}>
                            {formatExpeditionStatus(expedition.statut)}
                          </span>
                          <p className="text-muted small mt-2 mb-0">
                            Dernière mise à jour: {expedition.derniere_mise_a_jour}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </Suspense>

            {/* Styles pour la carte */}
            <style jsx global>{`
              .leaflet-container {
                width: 100%;
                height: 100%;
                z-index: 1;
              }
              .expedition-info-window {
                min-width: 200px;
              }
              .expedition-info-window h6 {
                color: #0d6efd;
              }
            `}</style>
            
            {/* Légende de la carte */}
            <div className="position-absolute bottom-0 end-0 m-3 p-2 bg-white rounded shadow-sm" style={{ zIndex: 1000 }}>
              <div className="d-flex flex-column">
                <small className="mb-1 fw-bold">Légende:</small>
                <div className="d-flex align-items-center mb-1">
                  <span className="badge bg-primary me-2" style={{width: '20px', height: '10px'}}></span>
                  <small>En cours</small>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <span className="badge bg-danger me-2" style={{width: '20px', height: '10px'}}></span>
                  <small>En retard</small>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <span className="badge bg-info me-2" style={{width: '20px', height: '10px'}}></span>
                  <small>En transit</small>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-success me-2" style={{width: '20px', height: '10px'}}></span>
                  <small>Livré</small>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Vue Liste
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
                  <th>Dernière mise à jour</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expeditions.map((expedition) => (
                  <tr 
                    key={expedition.id} 
                    className={`expedition-list-item ${selectedExpedition === expedition.id ? 'table-active' : ''}`}
                    onClick={() => {
                      setSelectedExpedition(expedition.id);
                      if (window.innerWidth <= 768) {
                        setMapView(true);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="fw-medium">{expedition.reference}</td>
                    <td>{expedition.destination}</td>
                    <td>{expedition.client}</td>
                    <td>{expedition.type}</td>
                    <td>{expedition.poids}</td>
                    <td>
                      <span className={`badge bg-${getExpeditionStatusColor(expedition.statut)}`}>
                        {formatExpeditionStatus(expedition.statut)}
                      </span>
                    </td>
                    <td><small>{expedition.derniere_mise_a_jour}</small></td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Voir détails:', expedition.id);
                        }}
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
    );
  };

  // Rendu principal du tableau de bord
  const renderDashboard = () => {
    return (
      <div className="container-fluid p-4">
        {renderExpeditionsSection()}
        {/* ... reste du contenu du tableau de bord ... */}
      </div>
    );
  };

  // Rendu principal du composant
  return (
    <div>
      <style jsx global>{`
        :root {
          --sidebar-width: 240px;
          --header-height: 64px;
        }
        
        .sidebar {
          width: var(--sidebar-width);
          transition: width 0.2s ease-in-out;
        }
        
        .sidebar-collapsed {
          width: 56px;
        }
        
        .main-content {
          margin-left: var(--sidebar-width);
          transition: margin 0.2s ease-in-out;
        }
        
        @media (max-width: 991px) {
          .main-content {
            margin-left: 0;
          }
          
          .sidebar {
            position: fixed;
            z-index: 40;
            height: 100vh;
            transform: translateX(-100%);
            transition: transform 0.2s ease-in-out;
          }
          
          .sidebar-open {
            transform: translateX(0);
          }
          
          .sidebar-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 30;
          }
          
          .sidebar-overlay-open {
            display: block;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 flex flex-row">
        {/* Sidebar */}
        <SideBare 
          activeId={section}
          onNavigate={(id) => {
            setSection(id);
            // Fermer le menu sur mobile après la navigation
            if (isMobile) {
              setSidebarOpen(false);
            }
          }}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          isMobile={isMobile}
        />
        
        {/* Contenu principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* En-tête */}
          <header className="bg-white shadow-sm z-10">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <div className="flex items-center">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="mr-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  {section === 'dashboard' && 'Tableau de bord'}
                  {section === 'recherche' && 'Trouver un transitaire'}
                  {section === 'devis' && 'Nouveau devis'}
                  {section === 'historique-devis' && 'Historique des devis'}
                  {section === 'historique' && 'Historique'}
                  {section === 'envois' && 'Suivi des envois'}
                  {section === 'profil' && 'Mon profil'}
                </h1>
              </div>
              
              {/* Icônes de notification et de profil */}
              <div className="flex items-center space-x-4">
                {/* Bouton de notification */}
                <div className="relative">
                  <button 
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
                  >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Menu déroulant des notifications */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
                      <div className="p-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                          <button 
                            onClick={() => setNotifOpen(false)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifLoading ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                          </div>
                        ) : notifs.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {notifs.map((notif) => (
                              <div 
                                key={notif.id} 
                                className={`p-3 hover:bg-gray-50 cursor-pointer ${!notif.lu ? 'bg-blue-50' : ''}`}
                                onClick={() => handleNotificationClick(notif)}
                              >
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 pt-0.5">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Bell className="h-5 w-5 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900">{notif.titre}</p>
                                    <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notif.date).toLocaleString('fr-FR')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            Aucune notification
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
                        <button 
                          onClick={markAllAsRead}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          disabled={unreadCount === 0}
                        >
                          Tout marquer comme lu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Bouton de profil */}
                <div className="relative">
                  <button 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Ouvrir le menu utilisateur</span>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  
                  {/* Menu déroulant du profil */}
                  {profileMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                          <div className="font-medium">{userName}</div>
                          <div className="text-xs text-gray-500 truncate">Client</div>
                        </div>
                        <a
                          href="#/profil"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Mon profil
                        </a>
                        <a
                          href="#/parametres"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Paramètres
                        </a>
                        <div className="border-t border-gray-100"></div>
                        <button
                          onClick={() => {
                            // Déconnexion
                            localStorage.removeItem('authToken');
                            window.location.href = '#/connexion';
                          }}
                          className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
          
          {/* Contenu principal */}
          <main className="flex-1 overflow-y-auto">
            {renderDashboard()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;