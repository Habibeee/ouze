import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: 'leaflet',
        replacement: resolve(__dirname, 'node_modules/leaflet')
      },
      {
        find: 'react-leaflet',
        replacement: resolve(__dirname, 'node_modules/react-leaflet')
      }
    ]
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/global.scss";`
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['leaflet', 'react-leaflet']
    },
    commonjsOptions: {
      esmExternals: ['leaflet', 'react-leaflet']
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['trans-digi-front-end.onrender.com']
  },
  server: {
    port: 3000,
    open: true
  }
})
