import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
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
  // États principaux
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLgUp, setIsLgUp] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [mapView, setMapView] = useState(true); // true pour la carte, false pour la liste
  const [selectedExpedition, setSelectedExpedition] = useState(null);
  const mapRef = useRef(null);
  
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

  // Autres états existants...
  const [devis, setDevis] = useState([]);
  const [devisLoading, setDevisLoading] = useState(false);
  const [devisError, setDevisError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [userName, setUserName] = useState('Utilisateur');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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

  // ... (conservez les autres fonctions existantes)

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
  const renderExpeditionsSection = () => (
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

  // ... (conservez le reste de votre code existant)

  // Dans le rendu du tableau de bord, remplacez l'ancienne section des expéditions par :
  const renderDashboard = () => (
    <div className="container-fluid p-4">
      {/* ... autres parties du tableau de bord ... */}
      
      {renderExpeditionsSection()}
      
      {/* ... reste du contenu du tableau de bord ... */}
    </div>
  );

  // ... (conservez le reste de votre code existant)

  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: '#f8f9fa', position: 'relative' }}>
      <style>{`
        .sidebar-open {
          overflow: hidden;
        }
        .sidebar-collapsed .sidebar {
          width: 56px;
        }
      `}</style>
      
      {/* ... reste de votre rendu existant ... */}
      
      {renderDashboard()}
    </div>
  );
};

export default ClientDashboard