// src/models/AdminDevis.js
// Devis créés via le flux "Nouveau devis" (admin-only), non rattachés à un transitaire

const mongoose = require('mongoose');

const adminDevisSchema = new mongoose.Schema({
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
  origin: String,
  destination: String,
  montantEstime: Number,
  // Pièce jointe principale fournie par le client
  clientFichier: String,
  // Liste complète des pièces jointes
  clientFichiers: [String],
  // Réponse / traitement admin éventuel
  reponse: String,
  reponseFichier: String,
  reponseFichiers: [String],
  statut: {
    type: String,
    enum: ['en_attente', 'accepte', 'refuse', 'expire', 'annule', 'archive', 'traite'],
    default: 'en_attente'
  },
  dateExpiration: Date,
  devisOrigin: {
    type: String,
    default: 'nouveau-devis'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminDevis', adminDevisSchema);
