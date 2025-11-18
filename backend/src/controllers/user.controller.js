// src/controllers/user.controller.js
const User = require('../models/User');
const Translataire = require('../models/Translataire');
const { uploadToCloudinary, uploadFileToCloudinary } = require('../middleware/upload.middleware');
const { sendNewDevisToTranslataire, sendAdminNewDevisEmail, sendAdminDevisCancelledEmail } = require('../utils/email.service');

const Notification = require('../models/Notification');
const Admin = require('../models/Admin');
const { getIO } = require('../services/socket');

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un devis (client)
// @route   PUT /api/users/devis/:id
// @access  Private
exports.updateMonDevis = async (req, res) => {
  try {
    const id = String(req.params.id || '');
    if (!id || id.length < 12) return res.status(400).json({ success: false, message: 'ID invalide' });

    const translataire = await Translataire.findOne({ 'devis._id': id, 'devis.client': req.user.id });
    if (!translataire) return res.status(404).json({ success: false, message: 'Devis non trouvé' });

    const devis = translataire.devis.id(id);
    if (!devis) return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    // Autoriser la modification seulement si en attente
    if ((devis.statut || devis.status || 'en_attente') !== 'en_attente') {
      return res.status(400).json({ success: false, message: 'Ce devis ne peut plus être modifié' });
    }

    // Champs autorisés (si fournis)
    const b = req.body || {};
    const setIf = (keyApi, keyBody) => { if (b[keyBody] !== undefined && b[keyBody] !== null && String(b[keyBody]).length) devis[keyApi] = b[keyBody]; };
    setIf('typeService', 'typeService');
    setIf('description', 'description');
    setIf('origin', 'origin');
    setIf('destination', 'destination');
    setIf('dateExpiration', 'dateExpiration');
    // Champs additionnels optionnels
    setIf('weight', 'weight');
    setIf('packageType', 'packageType');
    setIf('length', 'length');
    setIf('width', 'width');
    setIf('height', 'height');
    setIf('pickupAddress', 'pickupAddress');
    setIf('pickupDate', 'pickupDate');
    setIf('deliveryAddress', 'deliveryAddress');
    setIf('deliveryDate', 'deliveryDate');
    setIf('notes', 'notes');
    if (b['specialRequirements[dangerous]'] !== undefined) {
      devis.specialRequirements = devis.specialRequirements || {};
      devis.specialRequirements.dangerous = String(b['specialRequirements[dangerous]']).toLowerCase() === 'true';
    }
    if (b['specialRequirements[temperature]'] !== undefined) {
      devis.specialRequirements = devis.specialRequirements || {};
      devis.specialRequirements.temperature = String(b['specialRequirements[temperature]']).toLowerCase() === 'true';
    }
    if (b['specialRequirements[fragile]'] !== undefined) {
      devis.specialRequirements = devis.specialRequirements || {};
      devis.specialRequirements.fragile = String(b['specialRequirements[fragile]']).toLowerCase() === 'true';
    }

    // Pièce jointe facultative de mise à jour
    if (req.file) {
      try {
        const fileUrl = await uploadFileToCloudinary(req.file, 'devis/updates');
        devis.clientFichier = fileUrl;
      } catch (e) {
        return res.status(400).json({ success: false, message: "Erreur d'upload de la pièce jointe", error: e.message });
      }
    }

    await translataire.save();

    return res.json({ success: true, message: 'Devis mis à jour', devis });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur mise à jour devis', error: error.message });
  }
};

// @desc    Mettre à jour le profil
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      nom: req.body.nom,
      prenom: req.body.prenom,
      telephone: req.body.telephone,
      informationsPersonnelles: req.body.informationsPersonnelles
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
};

// @desc    Upload photo de profil
// @route   PUT /api/users/photo
// @access  Private
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }

    // Upload vers Cloudinary
    const photoUrl = await uploadToCloudinary(req.file, 'users');

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { photoProfil: photoUrl },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Photo de profil mise à jour',
      photoProfil: user.photoProfil
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload',
      error: error.message
    });
  }
};

// @desc    Rechercher des translataires
// @route   GET /api/users/search-translataires
// @access  Private
exports.searchTranslataires = async (req, res) => {
  try {
    const { typeService, ville, recherche } = req.query;

    let query = { isApproved: true };

    if (typeService) {
      query.typeServices = typeService;
    }

    if (ville) {
      query.ville = new RegExp(ville, 'i');
    }

    if (recherche) {
      query.$or = [
        { nomEntreprise: new RegExp(recherche, 'i') },
        { secteurActivite: new RegExp(recherche, 'i') }
      ];
    }

    const translataires = await Translataire.find(query)
      .select('-motDePasse -verificationToken -devis -formulaires')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: translataires.length,
      translataires
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message
    });
  }
};

// @desc    Envoyer une demande de devis
// @route   POST /api/users/demande-devis/:translatireId
// @access  Private
exports.demandeDevis = async (req, res) => {
  try {
    const { typeService, description, dateExpiration, translataireName, origin, destination, devisOrigin } = req.body;
    let translataire = null;
    if (req.params.translatireId && String(req.params.translatireId).length >= 12) {
      try { translataire = await Translataire.findById(req.params.translatireId); } catch {}
    }
    if (!translataire && translataireName) {
      translataire = await Translataire.findOne({ nomEntreprise: new RegExp(`^${translataireName}$`, 'i') });
    }

    if (!translataire) {
      return res.status(404).json({
        success: false,
        message: 'Translataire non trouvé'
      });
    }

    if (!translataire.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Ce translataire n\'est pas encore approuvé'
      });
    }

    // Ajouter le devis au translataire
    const devis = {
      client: req.user.id,
      typeService,
      description,
      dateExpiration: dateExpiration || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours par défaut
    };
    if (origin) devis.origin = origin;
    if (destination) devis.destination = destination;

    // Pièces jointes facultatives du client (support multi-fichiers)
    const files = Array.isArray(req.files) && req.files.length ? req.files : (req.file ? [req.file] : []);
    if (files.length) {
      try {
        const urls = [];
        for (const f of files) {
          console.log(`[UPLOAD] Tentative d'upload fichier: ${f.originalname}, taille: ${f.size} bytes, type: ${f.mimetype}`);
          try {
            const url = await uploadFileToCloudinary(f, 'devis/demandes');
            if (url) {
              console.log(`[UPLOAD] Succès: ${f.originalname} -> ${url}`);
              urls.push(url);
            }
          } catch (uploadErr) {
            console.error(`[UPLOAD] Erreur pour ${f.originalname}:`, uploadErr.message);
            throw uploadErr;
          }
        }
        if (urls.length) {
          devis.clientFichiers = urls;
          // Compatibilité : conserver le premier fichier dans clientFichier
          devis.clientFichier = urls[0];
        }
      } catch (e) {
        console.error('[UPLOAD] Erreur globale:', e.message);
        return res.status(400).json({ 
          success: false, 
          message: "Erreur lors de l'upload des pièces jointes. Veuillez vérifier les fichiers et réessayer.",
          details: e.message 
        });
      }
    }

    translataire.devis.push(devis);
    await translataire.save();

    // Notifier les admins: nouvelle demande de devis envoyée (via recherche ou via nouveau devis)
    try {
      // Récupérer infos du client pour enrichir la notif et l'email
      const client = await User.findById(req.user.id).select('nom prenom email');
      const clientName = `${client?.prenom || ''} ${client?.nom || ''}`.trim() || 'Client';
      const admins = await Admin.find({}, '_id email');
      const notifs = await Notification.insertMany(admins.map(a => ({
        recipientId: a._id,
        recipientType: 'admin',
        type: 'devis_new',
        title: 'Nouvelle demande de devis',
        message: `${clientName} a envoyé une demande de devis à ${translataire.nomEntreprise}.`,
        data: {
          translataireId: translataire._id,
          translataireName: translataire.nomEntreprise,
          clientId: req.user.id,
          typeService,
          devisDescription: description,
          actorName: clientName,
          actorEmail: client?.email || ''
        }
      })));
      try { notifs.forEach(n => getIO().to(`admin:${n.recipientId}`).emit('notification:new', n)); } catch {}
      // Emails aux admins
      try {
        await Promise.all((admins || []).map(a => a?.email ? sendAdminNewDevisEmail(a.email, {
          translataireNom: translataire.nomEntreprise,
          clientName,
          clientEmail: client?.email || '',
          typeService,
          description
        }) : Promise.resolve()));
      } catch {}
    } catch (e) {
      console.error('Erreur notification admin (nouvelle demande devis):', e.message);
    }

    // Email au translataire pour l'informer de la nouvelle demande de devis
    // Pour un devis créé depuis "Nouveau devis" (devisOrigin === 'nouveau-devis'),
    // on ne notifie pas directement le translataire: seul l'admin reçoit l'information.
    if ((devisOrigin || '').toString() !== 'nouveau-devis') {
      try {
        const client = await User.findById(req.user.id).select('nom prenom email');
        await sendNewDevisToTranslataire(translataire.email, {
          clientName: `${client?.prenom || ''} ${client?.nom || ''}`.trim() || 'Client',
          typeService,
          description,
          fichierUrl: devis.clientFichier || null,
          translataireNom: translataire.nomEntreprise
        });
      } catch (e) {
        // ne pas bloquer la création du devis si l'email échoue
        console.error('Erreur envoi email nouvelle demande devis:', e.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Demande de devis envoyée',
      devis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la demande',
      error: error.message
    });
  }
};

// @desc    Obtenir l'historique des devis
// @route   GET /api/users/mes-devis
// @access  Private
exports.getMesDevis = async (req, res) => {
  try {
    const statutFilter = (req.query.statut || '').toString().toLowerCase();
    const translataires = await Translataire.find({
      'devis.client': req.user.id
    }).select('nomEntreprise devis');

    let mesDevis = [];
    translataires.forEach(trans => {
      let devisClient = trans.devis.filter(d => d.client.toString() === req.user.id.toString());
      if (statutFilter) {
        devisClient = devisClient.filter(d => (d.statut || d.status || 'en_attente').toString().toLowerCase().includes(statutFilter));
      }
      mesDevis = mesDevis.concat(devisClient.map(d => ({
        ...d.toObject(),
        translataire: trans.nomEntreprise,
        origin: d.origin || d.origine || undefined,
        destination: d.destination || d.route || undefined
      })));
    });

    res.json({
      success: true,
      count: mesDevis.length,
      devis: mesDevis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// @desc    Obtenir un devis par ID (appartenant à l'utilisateur connecté)
// @route   GET /api/users/devis/:id
// @access  Private
exports.getMonDevisById = async (req, res) => {
  try {
    const id = String(req.params.id || '');
    if (!id || id.length < 12) return res.status(400).json({ success: false, message: 'ID invalide' });

    const translataire = await Translataire.findOne({ 'devis._id': id, 'devis.client': req.user.id }).select('nomEntreprise devis');
    if (!translataire) return res.status(404).json({ success: false, message: 'Devis non trouvé' });

    const devis = translataire.devis.id(id);
    if (!devis) return res.status(404).json({ success: false, message: 'Devis non trouvé' });

    const dto = {
      ...devis.toObject(),
      translataire: translataire.nomEntreprise,
      origin: devis.origin || devis.origine,
      destination: devis.destination || devis.route,
    };

    return res.json({ success: true, devis: dto });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur récupération devis', error: error.message });
  }
};

// @desc    Annuler un devis (client)
// @route   PUT /api/users/devis/:devisId/cancel
// @access  Private
exports.annulerDevis = async (req, res) => {
  try {
    const devisId = req.params.devisId;

    const translataire = await Translataire.findOne({
      'devis._id': devisId,
      'devis.client': req.user.id
    });

    if (!translataire) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    const devis = translataire.devis.id(devisId);
    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    if (devis.statut !== 'en_attente') {
      return res.status(400).json({ success: false, message: 'Ce devis ne peut plus être annulé' });
    }

    devis.statut = 'annule';
    await translataire.save();

    // Notifier le translataire
    try {
      const notif = await Notification.create({
        recipientId: translataire._id,
        recipientType: 'translataire',
        type: 'devis_cancelled',
        title: 'Devis annulé',
        message: 'Le client a annulé sa demande de devis.',
        data: { devisId, clientId: req.user.id, at: new Date() }
      });
      try { getIO().to(`translataire:${translataire._id}`).emit('notification:new', notif); } catch {}
    } catch (e) {
      console.error('Erreur notification translataire (annulation devis):', e.message);
    }

    // Notifier les admins
    try {
      const client = await User.findById(req.user.id).select('nom prenom');
      const clientName = `${client?.prenom || ''} ${client?.nom || ''}`.trim() || 'Client';
      const admins = await Admin.find({}, '_id email');
      const notifs = await Notification.insertMany(admins.map(a => ({
        recipientId: a._id,
        recipientType: 'admin',
        type: 'devis_cancelled',
        title: 'Devis annulé',
        message: `${clientName} a annulé un devis chez ${translataire.nomEntreprise}.`,
        data: { devisId, translataireId: translataire._id, translataireName: translataire.nomEntreprise, clientId: req.user.id, at: new Date(), actorName: clientName }
      })));
      try { notifs.forEach(n => getIO().to(`admin:${n.recipientId}`).emit('notification:new', n)); } catch {}
      // Emails aux admins
      try {
        await Promise.all((admins || []).map(a => a?.email ? sendAdminDevisCancelledEmail(a.email, {
          translataireNom: translataire.nomEntreprise,
          clientName,
          devisId
        }) : Promise.resolve()));
      } catch {}
    } catch (e) {
      console.error('Erreur notification admin (annulation devis):', e.message);
    }

    return res.json({ success: true, message: 'Devis annulé' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation', error: error.message });
  }
};

// @desc    Supprimer définitivement un devis (client)
// @route   DELETE /api/users/devis/:id
// @access  Private
exports.deleteMonDevis = async (req, res) => {
  try {
    const id = String(req.params.id || '');
    if (!id || id.length < 12) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    // Trouver le translataire qui contient ce devis pour ce client
    const translataire = await Translataire.findOne({ 'devis._id': id, 'devis.client': req.user.id });
    if (!translataire) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    const devis = translataire.devis.id(id);
    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    // Suppression directe du sous-document
    devis.remove();
    await translataire.save();

    return res.json({ success: true, message: 'Devis supprimé définitivement' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur lors de la suppression', error: error.message });
  }
};