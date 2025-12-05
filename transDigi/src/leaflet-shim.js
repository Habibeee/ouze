// Exporte l'objet L global
export const L = window.L || {};

// Exporte les composants couramment utilisés
export const MapContainer = ({ children }) => children;
export const TileLayer = () => null;
export const Marker = () => null;
export const Popup = () => null;
export const useMap = () => window.L ? window.L.map('map') : null;

export default L;
