// src/models/Admin.js
// ============================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  telephone: String,
  motDePasse: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'gerer_utilisateurs',
      'gerer_translataires',
      'valider_comptes',
      'bloquer_comptes',
      'voir_statistiques',
      'gerer_admins'
    ]
  }],
  // Préférences notifications (facultatif)
  emailNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: false },
  topics: {
    inscriptions: { type: Boolean, default: true },
    devis: { type: Boolean, default: true },
    systeme: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

adminSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
});

adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.motDePasse);
};

module.exports = mongoose.model('Admin', adminSchema);