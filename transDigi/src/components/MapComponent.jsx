import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correction pour les icônes manquantes
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});

const MapComponent = ({ 
  position = [51.505, -0.09], 
  zoom = 13, 
  style = { height: '400px', width: '100%' } 
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      // Création de la carte
      mapInstance.current = L.map(mapRef.current, {
        center: position,
        zoom: zoom,
        scrollWheelZoom: false
      });

      // Ajout de la couche de tuiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);

      // Ajout du marqueur
      markerRef.current = L.marker(position)
        .addTo(mapInstance.current)
        .bindPopup('Votre position')
        .openPopup();
    }

    // Nettoyage
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [position, zoom]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        ...style,
        minHeight: '400px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
};

export default MapComponent;
