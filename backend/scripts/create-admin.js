// scripts/create-admin.js
// Script pour créer un administrateur initial
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const existingAdmin = await Admin.findOne({ email: 'admin@transdigisn.com' });
    if (existingAdmin) {
      console.log('⚠️  Un admin existe déjà avec cet email');
      process.exit(0);
    }

    const admin = await Admin.create({
      nom: 'Super Admin',
      email: 'admin@transdigisn.com',
      telephone: '+221771234567',
      motDePasse: 'Admin123!',
      role: 'super_admin',
      permissions: [
        'gerer_utilisateurs',
        'gerer_translataires',
        'valider_comptes',
        'bloquer_comptes',
        'voir_statistiques',
        'gerer_admins'
      ]
    });

    console.log('✅ Admin créé avec succès !');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Mot de passe: Admin123!');
    console.log('⚠️  CHANGEZ CE MOT DE PASSE IMMÉDIATEMENT !');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createAdmin();