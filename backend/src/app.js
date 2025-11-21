const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 👇 AJOUT SWAGGER
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// Required on Render/any reverse proxy so rate limiting & IP detection work with X-Forwarded-For
app.set('trust proxy', 1);

// Sécurité
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(` ${req.method} ${req.path}`);
  // Log file upload details
  if (req.method === 'POST' && req.path.includes('demande-devis')) {
    console.log(`[UPLOAD-INIT] Requête POST demande-devis reçue. Content-Type: ${req.headers['content-type']}`);
  }
  next();
});

// Middleware pour capturer erreurs Multer
app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    console.error('[MULTER] Erreur: Fichier trop volumineux', { size: err.limit });
    return res.status(400).json({ success: false, message: `Fichier trop volumineux (max: ${err.limit / 1024 / 1024} MB)` });
  }
  if (err && err.code === 'LIMIT_FILE_COUNT') {
    console.error('[MULTER] Erreur: Trop de fichiers');
    return res.status(400).json({ success: false, message: 'Trop de fichiers' });
  }
  next(err);
});

// Rate limiting (configurable)
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '', 10) || (15 * 60 * 1000);
const max = parseInt(process.env.RATE_LIMIT_MAX || '', 10) || 100;
const limiter = rateLimit({
  windowMs,
  max,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => process.env.NODE_ENV === 'development' && (process.env.RATE_LIMIT_DISABLE_DEV === 'true')
});

app.use('/api/', limiter);

// ============================================
// 👇 SWAGGER DOCUMENTATION
// ============================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #667eea; font-size: 2.5rem; }
    .swagger-ui .opblock-tag { 
      color: #667eea;
      border-bottom: 2px solid #667eea;
      font-size: 1.5rem;
    }
  `,
  customSiteTitle: 'TransDigiSN API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'none',
    persistAuthorization: true,
    filter: true,
    tryItOutEnabled: true
  }
}));

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const devisRoutes = require('./routes/translataire.routes');
const notificationRoutes = require('./routes/notification.routes');
const testRoutes = require('./routes/test.routes');

app.use('/', require('./routes/google.oauth.routes'));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/translataires', require('./routes/translataire.routes'));
app.use('/api/admin', adminRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/test', testRoutes);
app.use('/api/reviews', require('./routes/review.routes'));
// Debug routes (SMTP/connectivity checks)
app.use('/api/debug', require('./routes/debug.routes'));

// Route de test (mise à jour avec lien vers la doc)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API TransDigiSN',
    version: '1.0.0',
    documentation: '/api-docs', // 👈 Lien vers la doc
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      translataires: '/api/translataires',
      admin: '/api/admin'
    }
  });
});

// Servir le frontend (build Vite) si présent
const FRONT_DIST = path.join(__dirname, '../../transDigi/dist');
const FRONT_INDEX = path.join(FRONT_DIST, 'index.html');
if (fs.existsSync(FRONT_INDEX)) {
  app.use(express.static(FRONT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) return next();
    res.sendFile(FRONT_INDEX);
  });
} else {
  try { console.info('[WEB] No frontend build found, skipping static serve'); } catch {}
}

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;