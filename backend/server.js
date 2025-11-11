// Charger dotenv en tout début
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const http = require('http');
const { initSocket } = require('./src/services/socket');

const PORT = process.env.PORT || 5000;

// Connexion à MongoDB Atlas
connectDB();

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
});
