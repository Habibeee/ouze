// Ce fichier sert de pont entre Leaflet chargé via CDN et votre application

// Vérifie si Leaflet est disponible globalement
let L;
let MapContainer, TileLayer, Marker, Popup, useMap;

if (typeof window !== 'undefined' && window.L) {
  L = window.L;
  
  // Définit les composants
  MapContainer = ({ children }) => children;
  TileLayer = () => null;
  Marker = () => null;
  Popup = () => null;
  useMap = () => window.L.map('map');
} else {
  console.error('Leaflet n\'a pas été chargé correctement. Assurez-vous que le CDN Leaflet est inclus avant ce script.');
  
  // Définit des fonctions vides pour éviter les erreurs
  const noop = () => null;
  MapContainer = noop;
  TileLayer = noop;
  Marker = noop;
  Popup = noop;
  useMap = noop;
  L = {};
}

// Exporte les composants
export { MapContainer, TileLayer, Marker, Popup, useMap };

export default L;
