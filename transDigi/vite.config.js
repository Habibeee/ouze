import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      // Les alias sont supprimés pour éviter les problèmes de résolution
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
    host: '0.0.0.0',
    fs: {
      // Permettre de servir des fichiers depuis node_modules
      allow: ['..']
    }
  },
  preview: {
    port: 10000,
    host: '0.0.0.0',
    allowedHosts: ['trans-digi-front-end.onrender.com']
  },
  optimizeDeps: {
    // Désactiver l'optimisation pour éviter les problèmes de résolution
    exclude: ['leaflet', 'react-leaflet']
  },
  define: {
    'process.env': {}
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          bootstrap: ['bootstrap', 'react-bootstrap']
          // Ne pas inclure leaflet dans manualChunks
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    },
    chunkSizeWarningLimit: 1000
  }
});
