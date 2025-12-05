import React from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import { Button } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';

const CartePage = () => {
  const navigate = useNavigate();
  
  // Position par défaut (Paris)
  const position = [48.8566, 2.3522];
  
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
          <MapComponent 
            position={position} 
            zoom={12}
            style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}
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
