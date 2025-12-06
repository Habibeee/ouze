import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import App from './App.jsx'

// Nettoyage du root avant le rendu pour éviter l'erreur React #31
const rootElement = document.getElementById('root');

if (rootElement) {
  // Vider complètement le contenu existant
  rootElement.innerHTML = '';
  
  // Créer et monter l'application
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}