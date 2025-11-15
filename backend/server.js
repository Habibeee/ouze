// Charger dotenv en tout début
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const http = require('http');
const { initSocket } = require('./src/services/socket');
const Admin = require('./src/models/Admin');

const PORT = process.env.PORT || 5000;

// Connexion à MongoDB Atlas
connectDB();

// Assurer la présence d'un compte admin par défaut
async function ensureDefaultAdmin() {
  const email = 'diallo6498h@gmail.com';
  const password = 'Admin123';
  try {
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log(`ℹ️ Admin par défaut déjà présent (${email})`);
      return;
    }
    const admin = new Admin({
      nom: 'Admin',
      email,
      motDePasse: password,
      role: 'admin',
      permissions: [
        'gerer_utilisateurs',
        'gerer_translataires',
        'valider_comptes',
        'bloquer_comptes',
        'voir_statistiques',
        'gerer_admins'
      ],
    });
    await admin.save();
    console.log(`✅ Admin par défaut créé (${email})`);
  } catch (err) {
    console.error('❌ Erreur lors de la création de l\'admin par défaut :', err.message || err);
  }
}

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
  ensureDefaultAdmin();
});
