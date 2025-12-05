// @ts-nocheck
// Vérifie si nous sommes dans un environnement navigateur
const isBrowser = typeof window !== 'undefined';

// Initialise L comme un objet vide si non défini
let L = {};

if (isBrowser) {
  // Si Leaflet est disponible globalement, on l'utilise
  if (window.L) {
    L = window.L;
    
    // Correction pour les icônes manquantes
    if (L.Icon && L.Icon.Default) {
      delete L.Icon.Default.prototype._getIconUrl;
      
      // Configuration des URLs des icônes
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }
  } else {
    console.warn('Leaflet n\'est pas disponible globalement. Assurez-vous que le CDN est correctement chargé.');
  }
}

// Composants de base pour React-Leaflet
// Utilisation de createElement au lieu de JSX pour éviter les problèmes de transformation
const createElement = (tag, props, ...children) => {
  if (typeof document === 'undefined') return null;
  const element = document.createElement(tag);
  
  // Gestion des props
  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key === 'className') {
        element.className = value;
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key !== 'children') {
        element.setAttribute(key, value);
      }
    });
  }
  
  // Gestion des enfants
  children.forEach(child => {
    if (Array.isArray(child)) {
      child.forEach(c => appendChild(element, c));
    } else {
      appendChild(element, child);
    }
  });
  
  return element;
};

const appendChild = (parent, child) => {
  if (child === null || child === undefined) return;
  
  if (typeof child === 'string' || typeof child === 'number') {
    parent.appendChild(document.createTextNode(String(child)));
  } else if (child instanceof Node) {
    parent.appendChild(child);
  } else if (typeof child === 'object' && child !== null) {
    // Si c'est un objet React (par exemple, un composant), on essaie de le rendre
    if (child.$$typeof && child.props) {
      // C'est un élément React, on le laisse gérer par React
      return child;
    }
    console.warn('Type d\'enfant non géré:', child);
  }
};

export const MapContainer = (props) => {
  if (!isBrowser) return null;
  
  const { children, style, ...rest } = props || {};
  const containerStyle = {
    height: '100%',
    width: '100%',
    ...(style || {})
  };
  
  return createElement('div', { ...rest, style: containerStyle }, children);
};

export const TileLayer = () => null; // Le rendu est géré par l'effet dans le composant parent

export const Marker = () => null; // Le rendu est géré par l'effet dans le composant parent

export const Popup = ({ children }) => {
  if (!isBrowser) return null;
  return createElement('div', { className: 'leaflet-popup' }, children);
};

export const useMap = () => {
  if (!isBrowser || !window.L || !window.L.map) return () => null;
  
  return (container, options) => {
    if (!container || !(container instanceof HTMLElement)) return null;
    return window.L.map(container, options);
  };
};

// Exporte l'objet L global
export { L };

export default L;
