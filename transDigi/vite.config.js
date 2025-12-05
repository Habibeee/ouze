import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      'leaflet': resolve(__dirname, 'src/leaflet-shim.js'),
      'react-leaflet': resolve(__dirname, 'node_modules/react-leaflet')
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
    port: 4173,
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
      external: ['leaflet']
    },
    commonjsOptions: {
      esmExternals: ['leaflet']
    }
  }
});
