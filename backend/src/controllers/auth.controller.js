const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Translataire = require('../models/Translataire');
const Admin = require('../models/Admin');
const { sendVerificationEmail, sendPasswordResetEmail, sendAdminNewRegistrationEmail } = require('../utils/email.service');
const TokenBlacklist = require('../models/TokenBlacklist');
const Notification = require('../models/Notification');
const { getIO } = require('../services/socket');
const { OAuth2Client } = require('google-auth-library');

// Helper: normaliser un numéro en format local (derniers 9 chiffres)
const normalizeLocalPhone = (value) => {
  if (!value) return value;
  const digits = String(value).replace(/\D/g, '');
  // Garder les 9 derniers chiffres (format local sans indicatif)
  return digits.length > 9 ? digits.slice(-9) : digits;
};

// Helper: échapper une chaîne pour l'utiliser dans une RegExp
const escapeRegExp = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ===================== Renvoyer email de vérification =====================
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Email invalide' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    let userType = 'client';
    if (!user) {
      user = await Translataire.findOne({ email: email.toLowerCase() });
      userType = 'translataire';
    }

    // Pour éviter l'énumération des emails, retourner success même si aucun compte
    if (!user) {
      return res.json({ success: true, message: 'Email de vérification renvoyé (si un compte existe).' });
    }

    if (user.isVerified) {
      return res.json({ success: true, message: 'Ce compte est déjà vérifié.' });
    }

    if (!user.verificationToken) {
      const token = crypto.randomBytes(32).toString('hex');
      user.verificationToken = token;
      await user.save();
    }

    try {
      await sendVerificationEmail(user.email, user.verificationToken, userType);
    } catch (e) {
      // Ne pas exposer les détails d'erreur aux clients
      return res.status(500).json({ success: false, message: "Échec de renvoi de l'email" });
    }

    return res.json({ success: true, message: 'Email de vérification renvoyé.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur lors du renvoi', error: error.message });
  }
};

// Helper: construire une condition de recherche tolérante (+221 ou local)
const phoneSearchCondition = (field, input) => {
  const local = normalizeLocalPhone(input);
  return {
    $or: [
      { [field]: local },
      { [field]: `+221${local}` }
    ]
  };
};

// Générer JWT Token
const generateToken = (id, userType) => {
  return jwt.sign({ id, userType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// ===================== Connexion Google =====================
exports.googleLogin = async (req, res) => {
  try {
    const { idToken, userType = 'user' } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'idToken requis' });
    if (userType !== 'user') return res.status(400).json({ success: false, message: 'Connexion Google supportée pour user uniquement' });

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload.email;
    const emailVerified = payload.email_verified;
    const name = payload.name || '';

    if (!email || !emailVerified) {
      return res.status(400).json({ success: false, message: 'Email Google invalide/non vérifié' });
    }

    let user = await User.findOne({ email }).select('+motDePasse');
    if (!user) {
      // Créer un compte client minimal avec validation email OK mais attente d'approbation admin
      const [prenom, ...rest] = name.split(' ');
      const nom = rest.join(' ');
      const randomPass = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        nom: nom || '',
        prenom: prenom || '',
        email,
        telephone: '',
        motDePasse: randomPass,
        isVerified: true,
        isApproved: false
      });
    }

    // Note: pour les clients (user), l'approbation admin n'est plus requise

    const token = generateToken(user._id, 'user');
    return res.json({ success: true, token, userType: 'user', user: { id: user._id, email: user.email, nom: user.nom, prenom: user.prenom, isVerified: user.isVerified } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur connexion Google', error: error.message });
  }
};

// ===================== Déconnexion =====================
exports.logout = async (req, res) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token manquant' });
    }

    // Décoder pour récupérer l'expiration (sans vérifier la signature pour lire le payload)
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return res.status(400).json({ success: false, message: 'Token invalide' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(decoded.exp * 1000);

    await TokenBlacklist.create({
      tokenHash,
      userId: decoded.id,
      userType: decoded.userType,
      expiresAt
    });

    return res.json({ success: true, message: 'Déconnecté. Token révoqué.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur lors de la déconnexion', error: error.message });
  }
};

// ===================== Inscription Client =====================
exports.registerClient = async (req, res) => {
  try {
    console.log('📝 registerClient called with:', req.body);
    const { nom, prenom, email, telephone, motDePasse } = req.body;

    console.log('🔍 Checking if user exists:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      nom,
      prenom,
      email,
      telephone: normalizeLocalPhone(telephone),
      motDePasse,
      verificationToken
    });

    // Envoyer l'email de vérification EN ARRIÈRE-PLAN (ne pas attendre)
    sendVerificationEmail(email, verificationToken, 'client').catch(e => {
      console.error('Erreur envoi email vérification (client):', e.message);
    });

    // Notifier les admins EN ARRIÈRE-PLAN (ne pas attendre)
    Admin.find({}, '_id email emailNotifications topics').then(admins => {
      Notification.insertMany(admins.map(a => ({
        recipientId: a._id,
        recipientType: 'admin',
        type: 'account_pending',
        title: 'Nouveau client en attente de validation',
        message: `${prenom || ''} ${nom || ''} vient de s'inscrire (client).`,
        data: { userId: user._id, userType: 'user', email }
      }))).then(notifs => {
        try { notifs.forEach(n => getIO().to(`admin:${n.recipientId}`).emit('notification:new', n)); } catch {}
      }).catch(e => console.error('Erreur insertion notifications:', e.message));
      
      // Emails aux admins selon préférences
      Promise.all((admins || []).map(async (a) => {
        if (!a?.email) return;
        const wantsEmail = (a.emailNotifications !== false) && (a?.topics?.inscriptions !== false);
        if (!wantsEmail) return;
        try {
          await sendAdminNewRegistrationEmail(a.email, { type: 'client', displayName: `${prenom || ''} ${nom || ''}`.trim(), userEmail: email });
        } catch {}
      })).catch(e => console.error('Erreur emails admins:', e.message));
    }).catch(e => console.error('Erreur notification admin (nouveau client):', e.message));

    const token = generateToken(user._id, 'user');

    res.status(201).json({
      success: true,
      message: 'Inscription réussie. Veuillez vérifier votre email.',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('❌ Erreur registerClient:', error);
    const isValidation = error?.name === 'ValidationError';
    res.status(isValidation ? 400 : 500).json({
      success: false,
      message: isValidation ? 'Champs invalides' : 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// ===================== Inscription Translataire =====================
exports.registerTranslataire = async (req, res) => {
  try {
    const {
      nomEntreprise,
      ninea,
      telephoneEntreprise,
      email,
      motDePasse,
      secteurActivite,
      typeServices
    } = req.body;

    // Normalisations
    const emailNorm = (email || '').trim().toLowerCase();
    const nineaNorm = (ninea || '').trim().toUpperCase();

    // Vérification doublons (insensible à la casse)
    const existingTranslataire = await Translataire.findOne({
      $or: [
        { email: { $regex: `^${escapeRegExp(emailNorm)}$`, $options: 'i' } },
        { ninea: { $regex: `^${escapeRegExp(nineaNorm)}$`, $options: 'i' } }
      ]
    });
    if (existingTranslataire) {
      const dupField = (existingTranslataire.email && existingTranslataire.email.toLowerCase() === emailNorm)
        ? 'email' : ((existingTranslataire.ninea || '').toUpperCase() === nineaNorm ? 'ninea' : 'email/ninea');
      return res.status(400).json({
        success: false,
        message: dupField === 'email' ? 'Cet email est déjà utilisé' : (dupField === 'ninea' ? 'Ce NINEA est déjà utilisé' : 'Cet email ou NINEA est déjà utilisé')
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const translataire = await Translataire.create({
      nomEntreprise,
      ninea: nineaNorm,
      telephoneEntreprise: normalizeLocalPhone(telephoneEntreprise),
      email: emailNorm,
      motDePasse,
      secteurActivite,
      typeServices,
      verificationToken
    });

    // Envoyer l'email de vérification EN ARRIÈRE-PLAN (ne pas attendre)
    sendVerificationEmail(email, verificationToken, 'translataire').catch(e => {
      console.error('Erreur envoi email vérification (translataire):', e.message);
    });

    // Notifier les admins EN ARRIÈRE-PLAN (ne pas attendre)
    Admin.find({}, '_id email emailNotifications topics').then(admins => {
      Notification.insertMany(admins.map(a => ({
        recipientId: a._id,
        recipientType: 'admin',
        type: 'account_pending',
        title: 'Nouveau translataire en attente de validation',
        message: `${nomEntreprise} vient de s'inscrire (translataire).`,
        data: { userId: translataire._id, userType: 'translataire', email }
      }))).then(notifs => {
        try { notifs.forEach(n => getIO().to(`admin:${n.recipientId}`).emit('notification:new', n)); } catch {}
      }).catch(e => console.error('Erreur insertion notifications:', e.message));
      
      // Emails aux admins selon préférences
      Promise.all((admins || []).map(async (a) => {
        if (!a?.email) return;
        const wantsEmail = (a.emailNotifications !== false) && (a?.topics?.inscriptions !== false);
        if (!wantsEmail) return;
        try {
          await sendAdminNewRegistrationEmail(a.email, { type: 'translataire', companyName: nomEntreprise || '', userEmail: email });
        } catch {}
      })).catch(e => console.error('Erreur emails admins:', e.message));
    }).catch(e => console.error('Erreur notification admin (nouveau translataire):', e.message));

    const token = generateToken(translataire._id, 'translataire');

    res.status(201).json({
      success: true,
      message: 'Inscription réussie. En attente d\'approbation par un administrateur.',
      token,
      translataire: {
        id: translataire._id,
        nomEntreprise: translataire.nomEntreprise,
        email: translataire.email,
        isVerified: translataire.isVerified,
        isApproved: translataire.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// ===================== Connexion =====================
exports.login = async (req, res) => {
  try {
    // Normaliser et accepter des alias pour éviter les 400 liés aux variations de noms
    const body = req.body || {};
    let { email, telephone, telephoneEntreprise, motDePasse, userType, username, password } = body;
    // Alias pour mot de passe
    if (!motDePasse && typeof password === 'string') motDePasse = password;
    // Alias pour identifiant unique
    if (!email && typeof username === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) email = username;
    if (!telephone && typeof username === 'string' && /^\+?\d[\d\s.-]{7,}$/.test(username)) telephone = username;
    // Trim et normalisation
    if (typeof email === 'string') email = email.trim().toLowerCase();
    if (typeof telephone === 'string') telephone = telephone.trim();
    if (typeof telephoneEntreprise === 'string') telephoneEntreprise = telephoneEntreprise.trim();
    if (typeof motDePasse === 'string') motDePasse = motDePasse.trim();
    // Ignorer tout userType fourni pour forcer l'auto-détection côté serveur
    if (typeof userType !== 'undefined') {
      try { console.info('[AUTH] login: userType fourni côté client (ignoré)'); } catch {}
    }
    userType = undefined;
    try {
      const keys = Object.keys(body || {});
      console.info('[AUTH] login: champs reçus =', keys.filter(k => k !== 'motDePasse' && k !== 'password'));
    } catch {}

    if ((!email && !telephone && !telephoneEntreprise) || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Email ou téléphone et mot de passe requis'
      });
    }

    let user;
    let type;

    const tryFind = async () => {
      // Si userType fourni, respecter l’ordre demandé
      if (userType === 'client') {
        const search = email ? { email } : phoneSearchCondition('telephone', telephone);
        const u = await User.findOne(search).select('+motDePasse');
        return { user: u, type: 'user' };
      }
      if (userType === 'translataire') {
        const search = email ? { email } : phoneSearchCondition('telephoneEntreprise', telephoneEntreprise || telephone);
        const u = await Translataire.findOne(search).select('+motDePasse');
        return { user: u, type: 'translataire' };
      }
      if (userType === 'admin') {
        const search = email ? { email } : phoneSearchCondition('telephone', telephone);
        const u = await Admin.findOne(search).select('+motDePasse');
        return { user: u, type: 'admin' };
      }
      // Auto-détection: Admin -> User -> Translataire (évite confliter avec un translataire bloqué si le client est valide)
      if (email || telephone) {
        let u = await Admin.findOne(email ? { email } : phoneSearchCondition('telephone', telephone)).select('+motDePasse');
        if (u) return { user: u, type: 'admin' };
        u = await User.findOne(email ? { email } : phoneSearchCondition('telephone', telephone)).select('+motDePasse');
        if (u) return { user: u, type: 'user' };
        u = await Translataire.findOne(email ? { email } : phoneSearchCondition('telephoneEntreprise', telephoneEntreprise || telephone)).select('+motDePasse');
        if (u) return { user: u, type: 'translataire' };
      }
      return { user: null, type: undefined };
    };

    ({ user, type } = await tryFind());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    const isMatch = await user.matchPassword(motDePasse);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Refuser la connexion si le compte est bloqué/archivé (pour user/translataire)
    if ((type === 'user' || type === 'translataire') && (user.isBlocked || user.isArchived)) {
      return res.status(403).json({
        success: false,
        message: user.isBlocked ? 'Compte bloqué' : 'Compte archivé'
      });
    }

    // Exiger approbation admin uniquement pour les transitaires
    if ((type === 'translataire') && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Compte en attente d\'approbation par un administrateur'
      });
    }

    const token = generateToken(user._id, type);

    res.json({
      success: true,
      token,
      userType: type,
      user: {
        id: user._id,
        email: user.email,
        ...(type === 'user' && {
          nom: user.nom,
          prenom: user.prenom,
          isVerified: user.isVerified
        }),
        ...(type === 'translataire' && {
          nomEntreprise: user.nomEntreprise,
          isVerified: user.isVerified,
          isApproved: user.isApproved
        }),
        ...(type === 'admin' && {
          nom: user.nom,
          role: user.role
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// ===================== Vérification Email =====================
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    let user = await User.findOne({ verificationToken: token });
    let userType = 'client';

    if (!user) {
      user = await Translataire.findOne({ verificationToken: token });
      userType = 'translataire';
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email vérifié avec succès',
      userType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: error.message
    });
  }
};

// ===================== Mot de passe oublié =====================
exports.forgotPassword = async (req, res) => {
  try {
    const { email, userType } = req.body;

    let user;
    if (userType === 'client') {
      user = await User.findOne({ email });
    } else if (userType === 'translataire') {
      user = await Translataire.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    await user.save();
    await sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: 'Email de réinitialisation envoyé'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email',
      error: error.message
    });
  }
};

// ===================== Réinitialisation mot de passe =====================
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    let user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      user = await Translataire.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    user.motDePasse = req.body.motDePasse;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation',
      error: error.message
    });
  }
};
