declare module 'react-leaflet' {
  import { ComponentType } from 'react';
  import { MapContainerProps, TileLayerProps, MarkerProps, PopupProps } from 'react-leaflet';
  
  export const MapContainer: ComponentType<MapContainerProps>;
  export const TileLayer: ComponentType<TileLayerProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Popup: ComponentType<PopupProps>;
  
  // Ajoutez d'autres composants que vous utilisez
  export * from 'react-leaflet';
}
