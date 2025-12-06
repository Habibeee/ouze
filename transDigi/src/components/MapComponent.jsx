import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ 
  position = [14.6928, -17.4467], 
  zoom = 7, 
  style = { height: '400px' } 
}) => {
  return (
    <div style={style}>
      <MapContainer 
        center={position} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        key={`${position[0]}-${position[1]}-${zoom}`}
      >
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