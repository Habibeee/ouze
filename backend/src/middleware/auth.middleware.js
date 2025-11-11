// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Translataire = require('../models/Translataire');
const Admin = require('../models/Admin');
const crypto = require('crypto');
const TokenBlacklist = require('../models/TokenBlacklist');

// Protéger les routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé, token manquant'
    });
  }

  try {
    // Vérifier si le token est blacklisté (déconnecté)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklisted = await TokenBlacklist.findOne({ tokenHash });
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token révoqué, veuillez vous reconnecter'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Déterminer le type d'utilisateur
    if (decoded.userType === 'user') {
      req.user = await User.findById(decoded.id);
    } else if (decoded.userType === 'translataire') {
      req.user = await Translataire.findById(decoded.id);
    } else if (decoded.userType === 'admin') {
      req.user = await Admin.findById(decoded.id);
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Refuser l'accès si le compte est bloqué/archivé (sauf admin)
    if (decoded.userType !== 'admin' && (req.user.isBlocked || req.user.isArchived)) {
      return res.status(403).json({
        success: false,
        message: req.user.isBlocked ? 'Compte bloqué' : 'Compte archivé'
      });
    }

    req.userType = decoded.userType;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// Restreindre par type d'utilisateur
exports.authorize = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.userType)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé pour le type d'utilisateur: ${req.userType}`
      });
    }
    next();
  };
};

// Vérifier si le translataire est approuvé
exports.checkApproval = async (req, res, next) => {
  if (req.userType === 'translataire' && !req.user.isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Votre compte est en attente d\'approbation par un administrateur'
    });
  }
  next();
};