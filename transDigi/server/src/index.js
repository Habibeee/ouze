import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authGoogleRoutes from './routes/authGoogle.js';
import authRegisterRoutes from './routes/authRegister.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// OAuth routes
app.use(authGoogleRoutes);

// Registration routes
app.use(authRegisterRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route non trouvée' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
