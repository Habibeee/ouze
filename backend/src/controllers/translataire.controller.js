// src/controllers/translataire.controller.js
// ============================================
const Translataire = require('../models/Translataire');
const { uploadToCloudinary, uploadFileToCloudinary } = require('../middleware/upload.middleware');
const Notification = require('../models/Notification');
const { getIO } = require('../services/socket');
const User = require('../models/User');
const { sendDevisAcceptedToClient, sendAdminDevisResponseEmail } = require('../utils/email.service');
const Admin = require('../models/Admin');

// @desc    Obtenir le profil du translataire
// @route   GET /api/translataires/profile
// @access  Private (Translataire)
exports.getProfile = async (req, res) => {
  try {
    const translataire = await Translataire.findById(req.user.id)
      .populate('devis.client', 'nom prenom email telephone');
    
    res.json({
      success: true,
      translataire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le profil
// @route   PUT /api/translataires/profile
// @access  Private (Translataire)
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      nomEntreprise: req.body.nomEntreprise,
      telephoneEntreprise: req.body.telephoneEntreprise,
      adresse: req.body.adresse,
      ville: req.body.ville,
      region: req.body.region,
      codePostal: req.body.codePostal,
      secteurActivite: req.body.secteurActivite,
      typeServices: req.body.typeServices,
      description: req.body.description,
      anneesExperience: req.body.anneesExperience
    };

    const translataire = await Translataire.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      translataire
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
// @route   PUT /api/translataires/photo
// @access  Private (Translataire)
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }

    const photoUrl = await uploadToCloudinary(req.file, 'translataires');

    const translataire = await Translataire.findByIdAndUpdate(
      req.user.id,
      { photoProfil: photoUrl },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Photo de profil mise à jour',
      photoProfil: translataire.photoProfil
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload',
      error: error.message
    });
  }
};

// @desc    Obtenir les demandes de devis (avec filtrage par statut)
// @route   GET /api/translataires/devis
// @access  Private (Translataire)
exports.getDevis = async (req, res) => {
  try {
    const translataire = await Translataire.findById(req.user.id)
      .populate('devis.client', 'nom prenom email telephone');

    if (!translataire) {
      return res.status(404).json({ success: false, message: 'Translataire non trouvé' });
    }

    const rawStatut = (req.query.statut || '').toString().toLowerCase().trim();

    let devis = translataire.devis || [];
    if (rawStatut) {
      devis = devis.filter(d => {
        const s = (d.statut || d.status || 'en_attente').toString().toLowerCase();
        return s === rawStatut;
      });
    }

    return res.json({
      success: true,
      count: devis.length,
      devis
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// @desc    Répondre à un devis ou mettre à jour son statut (accepte / archive)
// @route   PUT /api/translataires/devis/:devisId
// @access  Private (Translataire)
exports.repondreDevis = async (req, res) => {
  try {
    const { montantEstime, statut } = req.body;

    const translataire = await Translataire.findById(req.user.id);
    const devis = translataire.devis.id(req.params.devisId);

    if (!devis) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé'
      });
    }

    // Autoriser uniquement les statuts attendus : 'accepte' (réponse) ou 'archive' (archivage)
    const allowedStatus = ['accepte', 'archive'];
    if (statut && !allowedStatus.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide. Seuls 'accepte' ou 'archive' sont autorisés pour cette route."
      });
    }

    // Si accepté, le montant estimé est requis
    if (statut === 'accepte' && (montantEstime === undefined || montantEstime === null)) {
      return res.status(400).json({
        success: false,
        message: "Le champ 'montantEstime' est requis lorsque le devis est accepté."
      });
    }

    if (montantEstime !== undefined) devis.montantEstime = montantEstime;
    if (req.body.reponse !== undefined) devis.reponse = req.body.reponse;
    // Pièce jointe facultative envoyée au client
    if (req.file) {
      try {
        const fileUrl = await uploadFileToCloudinary(req.file, 'devis/reponses');
        devis.reponseFichier = fileUrl;
      } catch (e) {
        return res.status(400).json({ success: false, message: "Erreur d'upload de la pièce jointe de réponse", error: e.message });
      }
    }
    if (statut === 'accepte') devis.statut = 'accepte';
    if (statut === 'archive') devis.statut = 'archive';

    // Mettre à jour les statistiques uniquement pour les devis acceptés
    if (statut === 'accepte') {
      translataire.nombreDevisTraites += 1;
    }

    await translataire.save();

    // Notifier le client lorsque le devis est accepté
    if (statut === 'accepte' && devis.client) {
      try {
        const notif = await Notification.create({
          recipientId: devis.client,
          recipientType: 'user',
          type: 'devis_accepted',
          title: 'Votre demande de devis a été acceptée',
          message: `Le translataire a accepté votre demande${devis.montantEstime ? ` avec un montant de ${devis.montantEstime}` : ''}.`,
          data: { translataireId: translataire._id, devisId: devis._id, reponse: devis.reponse || null, at: new Date() }
        });
        try { getIO().to(`user:${devis.client}`).emit('notification:new', notif); } catch {}
      } catch (e) {
        console.error('Erreur notification client (devis accepté):', e.message);
      }

      // Email au client
      try {
        const client = await User.findById(devis.client).select('nom prenom email');
        await sendDevisAcceptedToClient(client.email, {
          clientName: `${client?.prenom || ''} ${client?.nom || ''}`.trim() || 'Client',
          translataireNom: translataire.nomEntreprise,
          montant: devis.montantEstime,
          reponse: devis.reponse || '',
          fichierUrl: devis.reponseFichier || null
        });
      } catch (e) {
        console.error('Erreur envoi email client (devis accepté):', e.message);
      }

      // Notifier les admins de la réponse du translataire
      try {
        const admins = await Admin.find({}, '_id email');
        const notifs = await Notification.insertMany(admins.map(a => ({
          recipientId: a._id,
          recipientType: 'admin',
          type: 'devis_response',
          title: 'Réponse à une demande de devis',
          message: `${translataire.nomEntreprise} a accepté une demande de devis.`,
          data: { translataireId: translataire._id, clientId: devis.client, devisId: devis._id, montant: devis.montantEstime, actorName: translataire.nomEntreprise }
        })));
        try { notifs.forEach(n => getIO().to(`admin:${n.recipientId}`).emit('notification:new', n)); } catch {}
        // Email aux admins
        try {
          await Promise.all((admins || []).map(a => a?.email ? sendAdminDevisResponseEmail(a.email, {
            translataireNom: translataire.nomEntreprise,
            montant: devis.montantEstime,
            devisId: devis._id
          }) : Promise.resolve()));
        } catch {}
      } catch (e) {
        console.error('Erreur notification admin (réponse devis):', e.message);
      }
    }

    res.json({
      success: true,
      message: 'Devis mis à jour',
      devis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
};

// @desc    Enregistrer un formulaire de marchandise
// @route   POST /api/translataires/formulaires
// @access  Private (Translataire)
exports.ajouterFormulaire = async (req, res) => {
  try {
    const { typeMarchandise, poids, destination, dateLivraison, clientId } = req.body;

    const translataire = await Translataire.findById(req.user.id);

    const formulaire = {
      typeMarchandise,
      poids,
      destination,
      dateLivraison,
      client: clientId
    };

    translataire.formulaires.push(formulaire);
    await translataire.save();

    res.status(201).json({
      success: true,
      message: 'Formulaire ajouté',
      formulaire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques
// @route   GET /api/translataires/statistiques
// @access  Private (Translataire)
exports.getStatistiques = async (req, res) => {
  try {
    const translataire = await Translataire.findById(req.user.id);

    const stats = {
      nombreDevisTotal: translataire.devis.length,
      nombreDevisEnAttente: translataire.devis.filter(d => d.statut === 'en_attente').length,
      nombreDevisAcceptes: translataire.devis.filter(d => d.statut === 'accepte').length,
      nombreDevisRefuses: translataire.devis.filter(d => d.statut === 'refuse').length,
      nombreDevisEnvoyes: translataire.nombreDevisEnvoyes,
      nombreDevisTraites: translataire.nombreDevisTraites,
      nombreFormulaires: translataire.formulaires.length,
      tauxAcceptation: translataire.devis.length > 0 
        ? ((translataire.devis.filter(d => d.statut === 'accepte').length / translataire.devis.length) * 100).toFixed(2)
        : 0
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};