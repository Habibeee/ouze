// ============================================
// scripts/clear-database.js
// Script pour vider la base de données
// ============================================
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../src/models/User');
const Translataire = require('../src/models/Translataire');
const Admin = require('../src/models/Admin');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function clearDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connecté à MongoDB');

    rl.question('⚠️  ATTENTION ! Cela va supprimer TOUTES les données. Continuer ? (oui/non) : ', async (answer) => {
      if (answer.toLowerCase() === 'oui') {
        console.log('🧹 Suppression en cours...');
        
        await User.deleteMany({});
        console.log('✅ Utilisateurs supprimés');
        
        await Translataire.deleteMany({});
        console.log('✅ Translataires supprimés');
        
        await Admin.deleteMany({});
        console.log('✅ Admins supprimés');
        
        console.log('✅ Base de données vidée avec succès !');
      } else {
        console.log('❌ Opération annulée');
      }
      
      rl.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    rl.close();
    process.exit(1);
  }
}

clearDatabase();