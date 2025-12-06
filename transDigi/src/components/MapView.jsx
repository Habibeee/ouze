import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Composants Leaflet chargés dynamiquement
const MapContainer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })));
const TileLayer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })));
const Marker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Marker })));
const Popup = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Popup })));

// Composant de chargement
const MapLoading = () => (
  <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    <span className="ml-2 text-gray-600">Chargement de la carte...</span>
  </div>
);

const MapView = ({
  center = [14.4974, -14.4524],
  zoom = 7,
  markers = [],
  onMarkerClick = () => {},
  selectedMarkerId = null,
  style = { height: '500px', width: '100%' },
  className = ''
}) => {
  // Générer une clé unique basée sur la position et le zoom pour forcer le remontage du composant
  const mapKey = `map-${center[0]}-${center[1]}-${zoom}`;

  return (
    <div className={`position-relative ${className}`} style={style}>
      <Suspense fallback={<MapLoading />}>
        <MapContainer 
          key={mapKey}
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {markers.map((marker) => (
            <Marker 
              key={marker.id}
              position={[marker.position.lat, marker.position.lng]}
              eventHandlers={{
                click: () => onMarkerClick(marker.id)
              }}
            >
              {marker.popup && (
                <Popup>
                  <div className="expedition-info-window">
                    {marker.popup.title && <h6 className="mb-1 fw-bold">{marker.popup.title}</h6>}
                    {marker.popup.content}
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </Suspense>

      {/* Styles pour la carte */}
      <style jsx global>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        .expedition-info-window {
          min-width: 200px;
        }
        .expedition-info-window h6 {
          color: #0d6efd;
        }
      `}</style>
    </div>
  );
};

export default MapView;
