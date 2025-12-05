import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from '../leaflet-shim';

// Composant pour gérer le contenu de la carte
const MapContent = ({ position, zoom, onMapReady, children }) => {
  const map = useMap();
  const [mapInitialized, setMapInitialized] = useState(false);
  const markerRef = useRef(null);

  useEffect(() => {
    if (map && !mapInitialized && window.L) {
      // Configure la vue initiale
      map.setView(position, zoom);
      
      // Ajoute une couche de tuiles par défaut
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Ajoute un marqueur par défaut
      markerRef.current = L.marker(position)
        .addTo(map)
        .bindPopup('Votre position')
        .openPopup();
      
      // Signale que la carte est prête
      onMapReady(map, markerRef.current);
      setMapInitialized(true);
    }
    
    // Nettoyage
    return () => {
      if (map) {
        // Supprime le marqueur s'il existe
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
          markerRef.current = null;
        }
        
        // Nettoie les couches de tuiles
        map.eachLayer(layer => {
          if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
          }
        });
      }
    };
  }, [map, position, zoom, onMapReady, mapInitialized]);
  
  return null;
};

const MapComponent = ({ 
  position = [51.505, -0.09], 
  zoom = 13, 
  style = { height: '400px', width: '100%' },
  children
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  // Fonction pour charger Leaflet de manière asynchrone
  const loadLeaflet = async () => {
    if (typeof window === 'undefined') return;
    
    // Vérifie si Leaflet est déjà chargé
    if (window.L) {
      setMapReady(true);
      return;
    }
    
    // Charge Leaflet de manière asynchrone
    try {
      if (window.loadLeaflet) {
        await window.loadLeaflet();
        setMapReady(true);
      } else {
        throw new Error('La fonction loadLeaflet n\'est pas disponible');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de Leaflet:', error);
      setError('Impossible de charger la carte. Veuillez réessayer plus tard.');
    }
  };

  // Charge Leaflet au montage du composant
  useEffect(() => {
    loadLeaflet();
    
    // Écouteur d'événement personnalisé pour le chargement de Leaflet
    const handleLeafletLoaded = () => setMapReady(true);
    window.addEventListener('leaflet:loaded', handleLeafletLoaded);
    
    return () => {
      window.removeEventListener('leaflet:loaded', handleLeafletLoaded);
      
      // Nettoyage de la carte lors du démontage
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);
  
  // Gestionnaire lorsque la carte est prête
  const handleMapReady = (map, marker) => {
    mapInstance.current = map;
    markerRef.current = marker;
  };
  
  // Affiche un message d'erreur s'il y en a un
  if (error) {
    return (
      <div style={style} className="d-flex align-items-center justify-content-center">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }
  
  // Affiche un indicateur de chargement tant que Leaflet n'est pas prêt
  if (!mapReady) {
    return (
      <div style={style} className="d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement de la carte...</span>
        </div>
      </div>
    );
  }
  
  // Rendu de la carte
  return (
    <div style={style} ref={mapRef}>
      <MapContainer 
        center={position} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <MapContent 
          position={position} 
          zoom={zoom} 
          onMapReady={handleMapReady}
        />
        {children}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
