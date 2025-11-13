import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authGoogleRoutes from './routes/authGoogle.js';
import authRegisterRoutes from './routes/authRegister.js';
import authLoginRoutes from './routes/authLogin.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Debug endpoint to check environment variables
app.get('/debug/env', (req, res) => {
  res.json({
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Défini' : '❌ Manquant',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ Défini' : '❌ Manquant',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ Défini' : '❌ Manquant',
    PORT: process.env.PORT || '4000'
  });
});

// OAuth routes
app.use(authGoogleRoutes);

// Registration routes
app.use(authRegisterRoutes);

// Login routes
app.use(authLoginRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route non trouvée' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
