//scripts/test-connection.js
// Script pour tester la connexion à MongoDB et les services
// ============================================
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testConnections() {
  console.log('🧪 Test des connexions...\n');

  // Test MongoDB
  console.log('1️⃣  Test MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ MongoDB connecté avec succès');
    console.log(`   📊 Base de données: ${mongoose.connection.name}`);
    await mongoose.connection.close();
  } catch (error) {
    console.log('   ❌ Erreur MongoDB:', error.message);
  }

  // Test Cloudinary
  console.log('\n2️⃣  Test Cloudinary...');
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    await cloudinary.api.ping();
    console.log('   ✅ Cloudinary configuré avec succès');
    console.log(`   ☁️  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  } catch (error) {
    console.log('   ❌ Erreur Cloudinary:', error.message);
  }

  // Test Email
  console.log('\n3️⃣  Test Email (Gmail)...');
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.verify();
    console.log('   ✅ Service email configuré avec succès');
    console.log(`   📧 Email: ${process.env.EMAIL_USER}`);
  } catch (error) {
    console.log('   ❌ Erreur Email:', error.message);
  }

  // Test variables d'environnement
  console.log('\n4️⃣  Vérification des variables d\'environnement...');
  const requiredVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRE',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS',
    'FRONTEND_URL'
  ];

  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length === 0) {
    console.log('   ✅ Toutes les variables d\'environnement sont configurées');
  } else {
    console.log('   ⚠️  Variables manquantes:');
    missingVars.forEach(v => console.log(`      - ${v}`));
  }

  console.log('\n✅ Tests terminés !');
}

testConnections();