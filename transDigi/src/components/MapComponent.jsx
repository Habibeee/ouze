import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';

// Chemins vers les icônes dans le dossier public
const iconUrl = '/leaflet-images/marker-icon.png';
const iconRetinaUrl = '/leaflet-images/marker-icon-2x.png';
const shadowUrl = '/leaflet-images/marker-shadow.png';

// Composant pour gérer la position de la carte
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const MapComponent = ({ 
  position = [51.505, -0.09], 
  zoom = 13, 
  style = { height: '400px', width: '100%' } 
}) => {
  // Configuration des icônes Leaflet
  useEffect(() => {
    // Supprimer toute configuration existante
    delete L.Icon.Default.prototype._getIconUrl;
    
    // Créer un nouvel icône personnalisé
    const DefaultIcon = L.icon({
      iconRetinaUrl: iconRetinaUrl,
      iconUrl: iconUrl,
      shadowUrl: shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    // Définir l'icône par défaut
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);
  return (
    <div style={{ ...style, borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={position} zoom={zoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>Votre position</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapComponent;