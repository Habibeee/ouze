// src/controllers/admin.controller.js
const User = require('../models/User');
const Translataire = require('../models/Translataire');
const Admin = require('../models/Admin');
const { sendApprovalNotification, sendAccountStatusChange, sendAccountDeleted } = require('../utils/email.service');
const { sendUserApprovalNotification } = require('../utils/email.service');
const Notification = require('../models/Notification');
const { getIO } = require('../services/socket');

// ===== Helpers =====
const ensureSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({ success: false, message: 'Accès réservé au super administrateur' });
    return false;
  }
  return true;
};

// @desc    Mettre à jour l'email de l'admin connecté
// @route   PUT /api/admin/profile/email
// @access  Private (Admin)
const updateAdminEmail = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Email invalide' });
    }
    const exists = await Admin.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
    if (exists) return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    const admin = await Admin.findByIdAndUpdate(req.user._id, { email: email.toLowerCase() }, { new: true }).select('-motDePasse');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin non trouvé' });
    res.json({ success: true, message: 'Email mis à jour', admin: { id: admin._id, email: admin.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour email', error: error.message });
  }
};

// ================= Profil Admin (préférences) =================

// @desc    Récupérer le profil de l'admin connecté (préférences notifications)
// @route   GET /api/admin/profile
// @access  Private (Admin)
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select('-motDePasse');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin non trouvé' });
    const profile = {
      email: admin.email,
      nom: admin.nom,
      emailNotifications: !!admin.emailNotifications,
      pushNotifications: !!admin.pushNotifications,
      topics: {
        inscriptions: admin?.topics?.inscriptions ?? true,
        devis: admin?.topics?.devis ?? true,
        systeme: admin?.topics?.systeme ?? true,
      },
    };
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur profil admin', error: error.message });
  }
};

// @desc    Mettre à jour le profil de l'admin connecté (préférences notifications)
// @route   PUT /api/admin/profile
// @access  Private (Admin)
const updateAdminProfile = async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, topics } = req.body || {};
    const admin = await Admin.findById(req.user._id).select('-motDePasse');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin non trouvé' });
    if (typeof emailNotifications === 'boolean') admin.emailNotifications = emailNotifications;
    if (typeof pushNotifications === 'boolean') admin.pushNotifications = pushNotifications;
    if (topics && typeof topics === 'object') {
      admin.topics = {
        inscriptions: !!(topics.inscriptions ?? admin?.topics?.inscriptions),
        devis: !!(topics.devis ?? admin?.topics?.devis),
        systeme: !!(topics.systeme ?? admin?.topics?.systeme),
      };
    }
    await admin.save();
    res.json({ success: true, message: 'Profil mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour profil', error: error.message });
  }
};

// ================= Super Admin: Gestion des administrateurs =================

// @desc    Lister les admins
// @route   GET /api/admin/admins
// @access  Private (Super Admin)
const listAdmins = async (req, res) => {
  try {
    if (!ensureSuperAdmin(req, res)) return;
    const { page = 1, limit = 20 } = req.query;
    const admins = await Admin.find().select('-motDePasse').skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
    const total = await Admin.countDocuments();
    res.json({ success: true, admins, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur listing admins', error: error.message });
  }
};

// @desc    Créer un admin
// @route   POST /api/admin/admins
// @access  Private (Super Admin)
const createAdmin = async (req, res) => {
  try {
    if (!ensureSuperAdmin(req, res)) return;
    const { nom, email, motDePasse, telephone, role = 'admin', permissions = [] } = req.body;
    if (!nom || !email || !motDePasse) return res.status(400).json({ success: false, message: 'nom, email et motDePasse requis' });
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    const admin = await Admin.create({ nom, email, motDePasse, telephone, role, permissions });
    res.status(201).json({ success: true, admin: { id: admin._id, nom: admin.nom, email: admin.email, role: admin.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur création admin', error: error.message });
  }
};

// @desc    Mettre à jour le statut d'un admin (block/unblock/archive/unarchive)
// @route   PUT /api/admin/admins/:id/status
// @access  Private (Super Admin)
const updateAdminStatus = async (req, res) => {
  try {
    if (!ensureSuperAdmin(req, res)) return;
    const { id } = req.params;
    const { action } = req.body; // block | unblock | archive | unarchive
    if (!['block', 'unblock', 'archive', 'unarchive'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action invalide' });
    }
    const update = {};
    if (action === 'block') update.isBlocked = true;
    if (action === 'unblock') update.isBlocked = false;
    if (action === 'archive') update.isArchived = true;
    if (action === 'unarchive') update.isArchived = false;
    const admin = await Admin.findByIdAndUpdate(id, update, { new: true }).select('-motDePasse');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin non trouvé' });
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour statut admin', error: error.message });
  }
};

// @desc    Supprimer un admin
// @route   DELETE /api/admin/admins/:id
// @access  Private (Super Admin)
const deleteAdminAccount = async (req, res) => {
  try {
    if (!ensureSuperAdmin(req, res)) return;
    const { id } = req.params;
    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin non trouvé' });
    await Admin.findByIdAndDelete(id);
    res.json({ success: true, message: 'Admin supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur suppression admin', error: error.message });
  }
};

// @desc    Modifier mon mot de passe (admin)
// @route   PUT /api/admin/profile/password
// @access  Private (Admin)
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Champs requis' });
    const admin = await Admin.findById(req.user._id).select('+motDePasse');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin non trouvé' });
    const ok = await admin.matchPassword(currentPassword);
    if (!ok) return res.status(400).json({ success: false, message: 'Mot de passe actuel invalide' });
    admin.motDePasse = newPassword; // hash via pre-save
    await admin.save();
    res.json({ success: true, message: 'Mot de passe mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur changement mot de passe', error: error.message });
  }
};

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isVerified } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { nom: new RegExp(search, 'i') },
        { prenom: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// @desc    Obtenir un devis par ID (vue admin)
// @route   GET /api/admin/devis/:id
// @access  Private (Admin)
const getDevisById = async (req, res) => {
  try {
    const id = String(req.params.id || '');
    if (!id || id.length < 12) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const translataire = await Translataire.findOne({ 'devis._id': id })
      .populate('devis.client', 'nom prenom email telephone')
      .select('nomEntreprise devis');

    if (!translataire) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    const devis = translataire.devis.id(id);
    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    const dto = {
      ...devis.toObject(),
      translataire: {
        id: translataire._id,
        nom: translataire.nomEntreprise
      },
      origin: devis.origin || devis.origine,
      destination: devis.destination || devis.route
    };

    return res.json({ success: true, devis: dto });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur récupération devis', error: error.message });
  }
};

// @desc    Mettre à jour le statut d'un devis (admin)
// @route   PUT /api/admin/devis/:id
// @access  Private (Admin)
const updateDevisStatus = async (req, res) => {
  try {
    const id = String(req.params.id || '');
    if (!id || id.length < 12) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const { statut } = req.body || {};
    if (!statut) {
      return res.status(400).json({ success: false, message: 'statut requis' });
    }

    const allowedStatus = ['en_attente', 'accepte', 'refuse', 'expire', 'annule', 'archive', 'traite'];
    if (!allowedStatus.includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const translataire = await Translataire.findOne({ 'devis._id': id }).select('nomEntreprise devis');
    if (!translataire) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    const devis = translataire.devis.id(id);
    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    devis.statut = statut;
    await translataire.save();

    return res.json({ success: true, message: 'Statut du devis mis à jour', devis: devis.toObject() });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur mise à jour devis', error: error.message });
  }
};

// @desc    Définir la note admin d'un translataire (1 à 5)
// @route   PUT /api/admin/translataires/:id/rating
// @access  Private (Admin)
const setTranslataireRating = async (req, res) => {
  try {
    const { id } = req.params;
    let { rating } = req.body || {};
    if (rating === undefined || rating === null) {
      return res.status(400).json({ success: false, message: 'rating requis' });
    }
    rating = Number(rating);
    if (Number.isNaN(rating)) {
      return res.status(400).json({ success: false, message: 'rating doit être un nombre' });
    }
    // Clamp entre 0 et 5, par pas de 0.5 max
    if (rating < 0) rating = 0;
    if (rating > 5) rating = 5;
    rating = Math.round(rating * 2) / 2;

    const translataire = await Translataire.findByIdAndUpdate(
      id,
      { adminRating: rating },
      { new: true }
    ).select('-motDePasse');

    if (!translataire) {
      return res.status(404).json({ success: false, message: 'Translataire non trouvé' });
    }

    res.json({ success: true, message: 'Note mise à jour', translataire });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la note', error: error.message });
  }
};

// @desc    Approuver un utilisateur (client)
// @route   PUT /api/admin/users/:id/approve
// @access  Private (Admin)
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    user.isApproved = true;
    await user.save();

    // Email de notification d'approbation
    let emailStatus = { sent: false, error: null };
    try {
      const displayName = `${user.prenom || ''} ${user.nom || ''}`.trim();
      console.log(`[APPROVAL-EMAIL] Envoi email approbation user: ${user.email}`);
      await sendUserApprovalNotification(user.email, displayName);
      emailStatus.sent = true;
      console.log(`[APPROVAL-EMAIL] Email approbation envoyé avec succès à ${user.email}`);
    } catch (e) {
      emailStatus.error = e.message;
      console.error(`[APPROVAL-EMAIL] Erreur envoi email approbation user ${user.email}:`, {
        message: e.message,
        code: e.code,
        errno: e.errno,
        syscall: e.syscall,
        stack: e.stack
      });
    }

    // Créer une notification in-app
    try {
      const notif = await Notification.create({
        recipientId: user._id,
        recipientType: 'user',
        type: 'approval',
        title: 'Compte approuvé',
        message: 'Votre compte a été approuvé. Vous pouvez vous connecter.',
        data: { approvedBy: req.user._id, at: new Date() }
      });
      try { getIO().to(`user:${user._id}`).emit('notification:new', notif); } catch {}
    } catch (e) {
      console.error('Erreur création notification approval (user):', e.message);
    }

    const responseMessage = `Utilisateur approuvé${emailStatus.sent ? ' - Email envoyé' : emailStatus.error ? ` - Erreur email: ${emailStatus.error}` : ' - Email non envoyé'}`;
    return res.json({ success: true, message: responseMessage, user, emailStatus });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'approbation', error: error.message });
  }
};

// @desc    Obtenir tous les translataires
// @route   GET /api/admin/translataires
// @access  Private (Admin)
const getAllTranslataires = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isApproved, isVerified } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { nomEntreprise: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { ninea: new RegExp(search, 'i') }
      ];
    }
    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    const translataires = await Translataire.find(query)
      .select('-motDePasse')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Translataire.countDocuments(query);

    res.json({
      success: true,
      translataires,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalTranslataires: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// @desc    Approuver/Rejeter/Suspendre un translataire
// @route   PUT /api/admin/translataires/:id/approve
// @access  Private (Admin)
const approveTranslataire = async (req, res) => {
  try {
    const translataire = await Translataire.findById(req.params.id);

    if (!translataire) {
      return res.status(404).json({
        success: false,
        message: 'Translataire non trouvé'
      });
    }

    const { statut, commentaire } = req.body;

    if (!['approuve', 'rejete', 'suspendu'].includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide. Utiliser approuve, rejete ou suspendu.' });
    }

    let emailFn = null;
    let notifPayload = { type: '', title: '', message: '' };

    if (statut === 'approuve') {
      translataire.isApproved = true;
      translataire.isBlocked = false;
      translataire.isArchived = false;
      translataire.approvedBy = req.user.id;
      translataire.approvedAt = Date.now();
      emailFn = () => sendApprovalNotification(translataire.email, translataire.nomEntreprise);
      notifPayload = {
        type: 'approval',
        title: 'Compte approuvé',
        message: 'Votre compte a été approuvé. Vous pouvez vous connecter.'
      };
    } else if (statut === 'rejete') {
      translataire.isApproved = false;
      translataire.isBlocked = true; // empêcher l’accès
      emailFn = () => sendAccountStatusChange({
        email: translataire.email,
        displayName: translataire.nomEntreprise,
        userType: 'translataire',
        status: 'reject',
        reason: commentaire
      });
      notifPayload = {
        type: 'reject',
        title: 'Compte rejeté',
        message: `Votre compte a été rejeté.${commentaire ? ' Raison: ' + commentaire : ''}`
      };
    } else if (statut === 'suspendu') {
      translataire.isApproved = true;
      translataire.isBlocked = true;
      emailFn = () => sendAccountStatusChange({
        email: translataire.email,
        displayName: translataire.nomEntreprise,
        userType: 'translataire',
        status: 'suspend',
        reason: commentaire
      });
      notifPayload = {
        type: 'suspend',
        title: 'Compte suspendu',
        message: `Votre compte a été suspendu.${commentaire ? ' Raison: ' + commentaire : ''}`
      };
    }

    await translataire.save();

    // Email de statut
    let emailStatus = { sent: false, error: null };
    try {
      console.log(`[APPROVAL-EMAIL] Envoi email pour ${translataire.nomEntreprise} (${statut})`);
      await emailFn();
      emailStatus.sent = true;
      console.log(`[APPROVAL-EMAIL] Email envoyé avec succès à ${translataire.email}`);
    } catch (e) {
      emailStatus.error = e.message;
      console.error(`[APPROVAL-EMAIL] Erreur envoi email à ${translataire.email}:`, {
        message: e.message,
        code: e.code,
        errno: e.errno,
        syscall: e.syscall,
        stack: e.stack
      });
    }

    // Notification in-app
    try {
      const notif = await Notification.create({
        recipientId: translataire._id,
        recipientType: 'translataire',
        type: notifPayload.type,
        title: notifPayload.title,
        message: notifPayload.message,
        data: { by: req.user._id, reason: commentaire || null, at: new Date() }
      });
      try { getIO().to(`translataire:${translataire._id}`).emit('notification:new', notif); } catch {}
    } catch (e) {
      console.error('Erreur création notification statut (translataire):', e.message);
    }

    const responseMessage = `Translataire ${statut}${emailStatus.sent ? ' - Email envoyé' : emailStatus.error ? ` - Erreur email: ${emailStatus.error}` : ' - Email non envoyé'}`;
    res.json({ 
      success: true, 
      message: responseMessage, 
      translataire,
      emailStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation',
      error: error.message
    });
  }
};

// @desc    Bloquer/Débloquer un compte
// @route   PUT /api/admin/:userType/:id/block
// @access  Private (Admin)
const toggleBlockAccount = async (req, res) => {
  try {
    const { userType, id } = req.params;
    const { isBlocked } = req.body;

    let account;
    if (userType === 'user') {
      account = await User.findByIdAndUpdate(
        id,
        { isBlocked },
        { new: true }
      );
    } else if (userType === 'translataire') {
      account = await Translataire.findByIdAndUpdate(
        id,
        { isBlocked },
        { new: true }
      );
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Compte non trouvé'
      });
    }

    // Envoyer email de notification de statut
    try {
      const displayName = userType === 'user' ? `${account.prenom || ''} ${account.nom || ''}`.trim() : account.nomEntreprise;
      await sendAccountStatusChange({
        email: account.email,
        displayName,
        userType,
        status: isBlocked ? 'block' : 'unblock',
        reason: req.body.raison
      });
    } catch (e) {
      console.error('Erreur envoi email statut (block/unblock):', e.message);
    }

    // Notification in-app
    try {
      const notif = await Notification.create({
        recipientId: account._id,
        recipientType: userType,
        type: isBlocked ? 'block' : 'unblock',
        title: isBlocked ? 'Compte bloqué' : 'Compte débloqué',
        message: isBlocked ? 'Votre compte a été bloqué par l\'administrateur.' : 'Votre compte a été débloqué par l\'administrateur.',
        data: { by: req.user._id, reason: req.body.raison || null, at: new Date() }
      });
      try { getIO().to(`${userType}:${account._id}`).emit('notification:new', notif); } catch {}
    } catch (e) {
      console.error('Erreur création notification (block/unblock):', e.message);
    }

    res.json({
      success: true,
      message: isBlocked ? 'Compte bloqué' : 'Compte débloqué',
      account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'opération',
      error: error.message
    });
  }
};

// @desc    Supprimer un compte
// @route   DELETE /api/admin/:userType/:id
// @access  Private (Admin)
const deleteAccount = async (req, res) => {
  try {
    const { userType, id } = req.params;
    const Model = userType === 'user' ? User : userType === 'translataire' ? Translataire : null;
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Type d\'utilisateur invalide' });
    }

    const account = await Model.findById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Compte non trouvé'
      });
    }

    // Créer une notification avant suppression (si on veut notifier par email, déjà fait)
    try {
      const notif = await Notification.create({
        recipientId: account._id,
        recipientType: userType,
        type: 'delete',
        title: 'Compte supprimé',
        message: 'Votre compte a été supprimé par l\'administrateur.',
        data: { by: req.user._id, reason: req.body.raison || null, at: new Date() }
      });
      try { getIO().to(`${userType}:${account._id}`).emit('notification:new', notif); } catch {}
    } catch (e) {
      console.error('Erreur création notification (delete):', e.message);
    }

    await Model.findByIdAndDelete(id);

    // Email de suppression de compte
    try {
      const displayName = userType === 'user' ? `${account.prenom || ''} ${account.nom || ''}`.trim() : account.nomEntreprise;
      await sendAccountDeleted({
        email: account.email,
        displayName,
        userType,
        reason: req.body.raison
      });
    } catch (e) {
      console.error('Erreur envoi email suppression:', e.message);
    }

    res.json({
      success: true,
      message: 'Compte supprimé'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques globales
// @route   GET /api/admin/statistiques
// @access  Private (Admin)
const getStatistiques = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const usersBlocked = await User.countDocuments({ isBlocked: true });
    const usersPending = await User.countDocuments({ isApproved: false });

    const totalTranslataires = await Translataire.countDocuments();
    const translatairesPendants = await Translataire.countDocuments({ isApproved: false });
    const translatairesApprouves = await Translataire.countDocuments({ isApproved: true });
    const translatairesBlocked = await Translataire.countDocuments({ isBlocked: true });

    // Statistiques par type de service
    const serviceStats = await Translataire.aggregate([
      { $unwind: '$typeServices' },
      { $group: { _id: '$typeServices', count: { $sum: 1 } } }
    ]);

    // Utilisateurs récents (7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersLastWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    const newTranslatairesLastWeek = await Translataire.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Total des devis
    const allTranslataires = await Translataire.find();
    const totalDevis = allTranslataires.reduce((acc, t) => acc + t.devis.length, 0);
    const devisEnAttente = allTranslataires.reduce(
      (acc, t) => acc + t.devis.filter(d => d.statut === 'en_attente').length, 0
    );

    res.json({
      success: true,
      stats: {
        utilisateurs: {
          total: totalUsers,
          bloques: usersBlocked,
          enAttente: usersPending,
          nouveauxCetteSemaine: newUsersLastWeek
        },
        translataires: {
          total: totalTranslataires,
          approuves: translatairesApprouves,
          enAttente: translatairesPendants,
          bloques: translatairesBlocked,
          nouveauxCetteSemaine: newTranslatairesLastWeek
        },
        services: serviceStats,
        devis: {
          total: totalDevis,
          enAttente: devisEnAttente
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// @desc    Obtenir la liste des utilisateurs (pour tableau de bord)
// @route   GET /api/admin/dashboard/users
// @access  Private (Admin)
const getDashboardUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('nom prenom email telephone isVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// @desc    Obtenir la liste des translataires (pour tableau de bord)
// @route   GET /api/admin/dashboard/translataires
// @access  Private (Admin)
const getDashboardTranslataires = async (req, res) => {
  try {
    const translataires = await Translataire.find()
      .select('nomEntreprise email ninea isApproved isVerified typeServices createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      translataires
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// @desc    Obtenir les devis traités
// @route   GET /api/admin/devis
// @access  Private (Admin)
const getAllDevis = async (req, res) => {
  try {
    const translataires = await Translataire.find()
      .populate('devis.client', 'nom prenom email')
      .select('nomEntreprise devis');

    let allDevis = [];
    translataires.forEach(trans => {
      trans.devis.forEach(devis => {
        allDevis.push({
          ...devis.toObject(),
          translataire: {
            id: trans._id,
            nom: trans.nomEntreprise
          }
        });
      });
    });

    // Trier par date
    allDevis.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: allDevis.length,
      devis: allDevis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// @desc    Opérations en masse: block/unblock/archive/unarchive/delete
// @route   POST /api/admin/:userType/bulk/:action
// @access  Private (Admin)
const bulkAccountsAction = async (req, res) => {
  try {
    const { userType, action } = req.params;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Liste d\'IDs requise' });
    }

    const Model = userType === 'user' ? User : userType === 'translataire' ? Translataire : null;
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Type d\'utilisateur invalide' });
    }

    // Récupérer les comptes pour email (avant modification/suppression)
    const docs = await Model.find({ _id: { $in: ids } }).select('email nom prenom nomEntreprise');

    let result;
    switch (action) {
      case 'block':
        result = await Model.updateMany({ _id: { $in: ids } }, { $set: { isBlocked: true } });
        break;
      case 'unblock':
        result = await Model.updateMany({ _id: { $in: ids } }, { $set: { isBlocked: false } });
        break;
      case 'archive':
        result = await Model.updateMany({ _id: { $in: ids } }, { $set: { isArchived: true } });
        break;
      case 'unarchive':
        result = await Model.updateMany({ _id: { $in: ids } }, { $set: { isArchived: false } });
        break;
      case 'delete':
        result = await Model.deleteMany({ _id: { $in: ids } });
        break;
      default:
        return res.status(400).json({ success: false, message: 'Action invalide' });
    }

    // Envoi d'emails (non bloquant pour la réponse en cas d'échec)
    (async () => {
      try {
        if (['block', 'unblock', 'archive', 'unarchive'].includes(action)) {
          await Promise.all(docs.map(d => {
            const displayName = userType === 'user' ? `${d.prenom || ''} ${d.nom || ''}`.trim() : d.nomEntreprise;
            return sendAccountStatusChange({
              email: d.email,
              displayName,
              userType,
              status: action,
              reason: req.body.raison
            });
          }));
        } else if (action === 'delete') {
          await Promise.all(docs.map(d => {
            const displayName = userType === 'user' ? `${d.prenom || ''} ${d.nom || ''}`.trim() : d.nomEntreprise;
            return sendAccountDeleted({
              email: d.email,
              displayName,
              userType,
              reason: req.body.raison
            });
          }));
        }
      } catch (e) {
        console.error('Erreur envoi emails bulk:', e.message);
      }
    })();

    // Création des notifications in-app en masse (non bloquant)
    (async () => {
      try {
        if (['block', 'unblock', 'archive', 'unarchive'].includes(action)) {
          const titleMap = { block: 'Compte bloqué', unblock: 'Compte débloqué', archive: 'Compte archivé', unarchive: 'Compte désarchivé' };
          const messageMap = {
            block: 'Votre compte a été bloqué par l\'administrateur.',
            unblock: 'Votre compte a été débloqué par l\'administrateur.',
            archive: 'Votre compte a été archivé par l\'administrateur.',
            unarchive: 'Votre compte a été désarchivé par l\'administrateur.'
          };
          const notifs = await Notification.insertMany(docs.map(d => ({
            recipientId: d._id,
            recipientType: userType,
            type: action,
            title: titleMap[action],
            message: messageMap[action],
            data: { by: req.user._id, reason: req.body.raison || null, at: new Date() }
          })));
          try { notifs.forEach(n => getIO().to(`${userType}:${n.recipientId}`).emit('notification:new', n)); } catch {}
        } else if (action === 'delete') {
          const notifs = await Notification.insertMany(docs.map(d => ({
            recipientId: d._id,
            recipientType: userType,
            type: 'delete',
            title: 'Compte supprimé',
            message: 'Votre compte a été supprimé par l\'administrateur.',
            data: { by: req.user._id, reason: req.body.raison || null, at: new Date() }
          })));
          try { notifs.forEach(n => getIO().to(`${userType}:${n.recipientId}`).emit('notification:new', n)); } catch {}
        }
      } catch (e) {
        console.error('Erreur création notifications bulk:', e.message);
      }
    })();

    return res.json({
      success: true,
      action,
      matched: result.matchedCount ?? result.n ?? 0,
      modified: result.modifiedCount ?? result.nModified ?? 0
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'opération en masse', error: error.message });
  }
};