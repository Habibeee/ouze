import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correction pour les icônes manquantes avec imports statiques
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
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
    // Éviter la double initialisation
    if (mapInstance.current) return;

    if (mapRef.current) {
      // Création de la carte
      mapInstance.current = L.map(mapRef.current, {
        center: position,
        zoom: zoom,
        scrollWheelZoom: true
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
  }, []); // Dépendances vides pour éviter la réinitialisation

  // Mettre à jour la position si elle change
  useEffect(() => {
    if (mapInstance.current && markerRef.current) {
      mapInstance.current.setView(position, zoom);
      markerRef.current.setLatLng(position);
    }
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