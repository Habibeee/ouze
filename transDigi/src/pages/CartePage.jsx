import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';
import MapView from '../components/MapView';

const CartePage = () => {
  const navigate = useNavigate();
  const position = [48.8566, 2.3522]; // Position par défaut (Paris)
  
  // Créer un marqueur pour la position actuelle
  const markers = [{
    id: 'current-location',
    position: { lat: position[0], lng: position[1] },
    popup: {
      title: 'Votre position',
      content: (
        <div>
          <p className="mb-1">
            <span className="me-1">📍</span>
            Paris, France
          </p>
        </div>
      )
    }
  }];
  
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
          <MapView 
            center={position}
            zoom={12}
            markers={markers}
            className="rounded"
          />
        </div>
      </div>
      
      <div className="mt-3 text-muted text-center">
        <small>Utilisez la molette de la souris pour zoomer/dézoomer et le clic gauche pour vous déplacer</small>
      </div>
    </div>
  );
};

export default CartePage;
