// src/models/Translataire.js
// ============================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const devisSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  typeService: {
    type: String,
    enum: ['maritime', 'routier', 'aerien'],
    required: true
  },
  description: String,
  // Lieux demandés par le client
  origin: String,
  destination: String,
  montantEstime: Number,
  // Pièce jointe principale fournie par le client lors de la demande (compatibilité historique)
  clientFichier: String,
  // Liste complète des pièces jointes fournies par le client (nouveau)
  clientFichiers: [String],
  // Réponse du translataire (texte) et pièce jointe éventuelle
  reponse: String,
  reponseFichier: String,
  statut: {
    type: String,
    enum: ['en_attente', 'accepte', 'refuse', 'expire', 'annule'],
    default: 'en_attente'
  },
  dateExpiration: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const translatireSchema = new mongoose.Schema({
  // Informations professionnelles
  nomEntreprise: {
    type: String,
    required: [true, 'Le nom de l\'entreprise est requis']
  },
  ninea: {
    type: String,
    required: [true, 'Le NINEA est requis'],
    unique: true
  },
  telephoneEntreprise: {
    type: String,
    required: [true, 'Le téléphone de l\'entreprise est requis']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true
  },
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: 6,
    select: false
  },
  secteurActivite: String,
  
  // Localisation
  adresse: String,
  ville: String,
  region: String,
  codePostal: String,
  
  // Services
  typeServices: [{
    type: String,
    enum: ['maritime', 'routier', 'aerien']
  }],
  
  // Informations complémentaires
  photoProfil: String,
  description: String,
  anneesExperience: Number,
  
  // Formulaires de marchandises
  formulaires: [{
    typeMarchandise: String,
    poids: Number,
    destination: String,
    dateLivraison: Date,
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Devis
  devis: [devisSchema],
  
  // Statistiques
  nombreDevisEnvoyes: {
    type: Number,
    default: 0
  },
  nombreDevisTraites: {
    type: Number,
    default: 0
  },
  // Notes et avis
  avgRating: {
    type: Number,
    default: 0
  },
  ratingsCount: {
    type: Number,
    default: 0
  },
  // Note définie par l'administrateur (1 à 5 étoiles)
  adminRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  // Vérification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  
  // Validation admin
  isApproved: {
    type: Boolean,
    default: false
  },
  // Statuts de compte
  isBlocked: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash du mot de passe
translatireSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});

translatireSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.motDePasse);
};

module.exports = mongoose.model('Translataire', translatireSchema);