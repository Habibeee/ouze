// scripts/seed-database.js
// Script pour peupler la base de données avec des données de test
// ============================================
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Translataire = require('../src/models/Translataire');
const Admin = require('../src/models/Admin');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connecté à MongoDB');

    // Nettoyer la base de données
    console.log('🧹 Nettoyage de la base de données...');
    await User.deleteMany({});
    await Translataire.deleteMany({});
    await Admin.deleteMany({});

    // Créer des utilisateurs clients
    console.log('👥 Création des clients...');
    const users = await User.create([
      {
        nom: 'Diallo',
        prenom: 'Moussa',
        email: 'moussa.diallo@example.com',
        telephone: '+221771234567',
        motDePasse: 'password123',
        isVerified: true,
        informationsPersonnelles: {
          adresse: 'Dakar Plateau, Rue 10',
          codePostal: '10000',
          ville: 'Dakar',
          pays: 'Sénégal'
        }
      },
      {
        nom: 'Ndiaye',
        prenom: 'Fatou',
        email: 'fatou.ndiaye@example.com',
        telephone: '+221772345678',
        motDePasse: 'password123',
        isVerified: true,
        informationsPersonnelles: {
          adresse: 'Thiès Centre',
          codePostal: '20000',
          ville: 'Thiès',
          pays: 'Sénégal'
        }
      },
      {
        nom: 'Sow',
        prenom: 'Amadou',
        email: 'amadou.sow@example.com',
        telephone: '+221773456789',
        motDePasse: 'password123',
        isVerified: true,
        informationsPersonnelles: {
          adresse: 'Saint-Louis, Quartier Nord',
          codePostal: '30000',
          ville: 'Saint-Louis',
          pays: 'Sénégal'
        }
      }
    ]);
    console.log(`✅ ${users.length} clients créés`);

    // Créer des translataires
    console.log('🚢 Création des translataires...');
    const translataires = await Translataire.create([
      {
        nomEntreprise: 'Trans Express SARL',
        ninea: '0012345678',
        telephoneEntreprise: '+221338765432',
        email: 'contact@transexpress.sn',
        motDePasse: 'password123',
        secteurActivite: 'Transport maritime et logistique',
        adresse: 'Zone industrielle, Route de Rufisque',
        ville: 'Dakar',
        region: 'Dakar',
        codePostal: '10500',
        typeServices: ['maritime', 'routier'],
        description: 'Leader du transport maritime au Sénégal depuis 15 ans',
        anneesExperience: 15,
        isVerified: true,
        isApproved: true,
        nombreDevisEnvoyes: 45,
        nombreDevisTraites: 38
      },
      {
        nomEntreprise: 'Afrique Logistique SA',
        ninea: '0023456789',
        telephoneEntreprise: '+221339876543',
        email: 'info@afriquelogistique.sn',
        motDePasse: 'password123',
        secteurActivite: 'Transport routier et aérien',
        adresse: 'Pikine, Zone industrielle',
        ville: 'Pikine',
        region: 'Dakar',
        codePostal: '11000',
        typeServices: ['routier', 'aerien'],
        description: 'Spécialiste du transport terrestre et aérien',
        anneesExperience: 8,
        isVerified: true,
        isApproved: true,
        nombreDevisEnvoyes: 32,
        nombreDevisTraites: 28
      },
      {
        nomEntreprise: 'Sénégal Transit',
        ninea: '0034567890',
        telephoneEntreprise: '+221335432109',
        email: 'contact@senegaltransit.sn',
        motDePasse: 'password123',
        secteurActivite: 'Transit et dédouanement',
        adresse: 'Port Autonome de Dakar',
        ville: 'Dakar',
        region: 'Dakar',
        codePostal: '10100',
        typeServices: ['maritime', 'routier', 'aerien'],
        description: 'Expert en opérations de transit toutes destinations',
        anneesExperience: 20,
        isVerified: true,
        isApproved: true,
        nombreDevisEnvoyes: 67,
        nombreDevisTraites: 59
      },
      {
        nomEntreprise: 'West Africa Cargo',
        ninea: '0045678901',
        telephoneEntreprise: '+221336543210',
        email: 'contact@westafricacargo.sn',
        motDePasse: 'password123',
        secteurActivite: 'Fret international',
        adresse: 'Liberté 6, Avenue Bourguiba',
        ville: 'Dakar',
        region: 'Dakar',
        codePostal: '10200',
        typeServices: ['maritime', 'aerien'],
        description: 'Réseau international de fret maritime et aérien',
        anneesExperience: 12,
        isVerified: true,
        isApproved: false, // En attente d'approbation
        nombreDevisEnvoyes: 0,
        nombreDevisTraites: 0
      }
    ]);
    console.log(`✅ ${translataires.length} translataires créés`);

    // Ajouter des devis aux translataires
    console.log('📋 Ajout de devis...');
    const transExpress = translataires[0];
    transExpress.devis.push(
      {
        client: users[0]._id,
        typeService: 'maritime',
        description: 'Transport de 50 conteneurs de Dakar à Abidjan',
        montantEstime: 5000000,
        statut: 'accepte',
        dateExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        client: users[1]._id,
        typeService: 'routier',
        description: 'Livraison de marchandises diverses Dakar-Thiès',
        montantEstime: 500000,
        statut: 'en_attente',
        dateExpiration: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      }
    );
    await transExpress.save();

    // Créer un administrateur
    console.log('👨‍💼 Création de l\'administrateur...');
    const admin = await Admin.create({
      nom: 'Admin Principal',
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
    console.log('✅ Admin créé');

    console.log('\n🎉 Base de données peuplée avec succès !');
    console.log('\n📝 Comptes de test créés :');
    console.log('\n👥 CLIENTS :');
    users.forEach(user => {
      console.log(`   - ${user.email} / password123`);
    });
    console.log('\n🚢 TRANSLATAIRES :');
    translataires.forEach(trans => {
      console.log(`   - ${trans.email} / password123 ${trans.isApproved ? '(Approuvé)' : '(En attente)'}`);
    });
    console.log('\n👨‍💼 ADMIN :');
    console.log(`   - ${admin.email} / Admin123!`);
    console.log('\n⚠️  CHANGEZ CES MOTS DE PASSE EN PRODUCTION !');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seedDatabase();