// src/controllers/admin.controller.js
const User = require('../models/User');
const Translataire = require('../models/Translataire');
const Admin = require('../models/Admin');
const { sendApprovalNotification, sendAccountStatusChange, sendAccountDeleted } = require('../utils/email.service');
const { sendUserApprovalNotification } = require('../utils/email.service');
const Notification = require('../models/Notification');
const { getIO } = require('../services/socket');

// ===== Helpers =====
const ensureSuperAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({ success: false, message: 'Accès réservé au super administrateur' });
    return false;
  }
  return true;
};

// @desc    Mettre à jour l'email de l'admin connecté
// @route   PUT /api/admin/profile/email
// @access  Private (Admin)
exports.updateAdminEmail = async (req, res) => {
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
exports.getAdminProfile = async (req, res) => {
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
exports.updateAdminProfile = async (req, res) => {
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
exports.listAdmins = async (req, res) => {
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
exports.createAdmin = async (req, res) => {
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
exports.updateAdminStatus = async (req, res) => {
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
exports.deleteAdminAccount = async (req, res) => {
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
exports.changeAdminPassword = async (req, res) => {
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
exports.getAllUsers = async (req, res) => {
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
// @route   GET /api/admin/devis/:id
// @access  Private (Admin)
exports.getDevisById = async (req, res) => {
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

    // Masquer côté admin les devis issus de "Nouveau devis"
    const originFlag = (devis.devisOrigin || '').toString();
    if (originFlag === 'nouveau-devis') {
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


// @desc    Obtenir les devis traités
// @route   GET /api/admin/devis
// @access  Private (Admin)
exports.getAllDevis = async (req, res) => {
  try {
    const translataires = await Translataire.find()
      .populate('devis.client', 'nom prenom email')
      .select('nomEntreprise devis');

    let allDevis = [];
    translataires.forEach(trans => {
      trans.devis.forEach(devis => {
        const originFlag = (devis.devisOrigin || '').toString();
        // Masquer côté admin les devis issus de "Nouveau devis" (réservés à DakarTerminal)
        if (originFlag === 'nouveau-devis') return;
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