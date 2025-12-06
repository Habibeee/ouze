import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      'leaflet': 'leaflet',
      'react-leaflet': 'react-leaflet'
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/global.scss";`
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0'
  },
  preview: {
    port: 10000, // Utilisation du même port que dans le script start
    host: '0.0.0.0',
    allowedHosts: ['trans-digi-front-end.onrender.com']
  },
  optimizeDeps: {
    exclude: ['leaflet']
  },
  define: {
    'process.env': {}
  },
  build: {
    rollupOptions: {
      // Ne pas externaliser les dépendances que nous voulons inclure dans les chunks
      external: [],
      output: {
        manualChunks: {
          // Découpage des chunks pour optimiser le chargement
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Ne pas inclure leaflet dans manualChunks car il est géré différemment
        },
        // Configuration pour les dépendances externes
        globals: {
          'leaflet': 'L',
          'react-leaflet': 'ReactLeaflet'
        }
      }
    },
    commonjsOptions: {
      // Forcer la transformation des modules CommonJS en ES modules
      transformMixedEsModules: true,
      // Exclure leaflet de la transformation CommonJS
      exclude: ['node_modules/leaflet/**']
    },
    // Augmente la limite d'avertissement pour la taille des chunks
    chunkSizeWarningLimit: 1000
  }
});
