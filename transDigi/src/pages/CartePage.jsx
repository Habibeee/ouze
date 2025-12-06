import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';

// Composants Leaflet chargés dynamiquement
const MapContainer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })));
const TileLayer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })));
const Marker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Marker })));
const Popup = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Popup })));

// Composant de chargement
const MapLoading = () => (
  <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
    <span className="ml-2 text-gray-600">Chargement de la carte...</span>
  </div>
);

const CartePage = () => {
  const navigate = useNavigate();
  const position = [48.8566, 2.3522]; // Position par défaut (Paris)
  
  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-4">
        <Button 
          variant="light" 
          className="me-3"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </Button>
        <h2>Localisation sur la carte</h2>
      </div>
      
      <div className="card shadow-sm">
        <div className="card-body p-0" style={{ height: '70vh' }}>
          <Suspense fallback={<MapLoading />}>
            <MapContainer 
              center={position} 
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              key={`carte-page-${position[0]}-${position[1]}`}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <Marker position={position}>
                <Popup>Votre position</Popup>
              </Marker>
            </MapContainer>
          </Suspense>
        </div>
      </div>
      
      <div className="mt-3 text-muted text-center">
        <small>Utilisez la molette de la souris pour zoomer/dézoomer et le clic gauche pour vous déplacer</small>
      </div>
    </div>
  );
};

export default CartePage;
