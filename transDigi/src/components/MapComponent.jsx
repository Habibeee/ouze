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
  position = [14.6928, -17.4467], 
  zoom = 7, 
  style = { height: '400px', width: '100%' } 
}) => {
  // Configuration propre des icônes UNE SEULE FOIS
  useEffect(() => {
    const DefaultIcon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);
  return (
    <div style={{ ...style, borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        key={`${position[0]}-${position[1]}`}   
        center={position}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={position} zoom={zoom} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <Marker position={position}>
          <Popup>Votre position</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapComponent;