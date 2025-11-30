// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadPhoto,
  searchTranslataires,
  demandeDevis,
  getMesDevis,
  getMonDevisById,
  annulerDevis,
  updateMonDevis,
  deleteMonDevis,
  archiverDevis,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { upload, uploadAny } = require('../middleware/upload.middleware');

// Protéger toutes les routes
router.use(protect);
router.use(authorize('user'));

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Utilisateurs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Mettre à jour le profil
 *     tags: [Utilisateurs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Diallo
 *               prenom:
 *                 type: string
 *                 example: Moussa
 *               telephone:
 *                 type: string
 *                 example: +221771234567
 *               adresse:
 *                 type: string
 *                 example: Dakar, Sénégal
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 */
router.put('/profile', updateProfile);

/**
 * @swagger
 * /users/photo:
 *   put:
 *     summary: Télécharger/Modifier la photo de profil
 *     tags: [Utilisateurs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Image de profil (JPG, PNG, max 5MB)
 *     responses:
 *       200:
 *         description: Photo téléchargée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 photoUrl:
 *                   type: string
 *                   example: https://example.com/uploads/photo.jpg
 *       400:
 *         description: Fichier invalide
 */
router.put('/photo', upload.single('photo'), uploadPhoto);

/**
 * @swagger
 * /users/search-translataires:
 *   get:
 *     summary: Rechercher des translataires
 *     tags: [Utilisateurs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: typeService
 *         schema:
 *           type: string
 *           enum: [maritime, routier, aerien]
 *         description: Filtrer par type de service
 *         example: maritime
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom d'entreprise
 *         example: Trans Express
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre de résultats par page
 *     responses:
 *       200:
 *         description: Liste des translataires trouvés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 translataires:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Translataire'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Non authentifié
 */
router.get('/search-translataires', searchTranslataires);

/**
 * @swagger
 * /users/demande-devis/{translatireId}:
 *   post:
 *     summary: Envoyer une demande de devis à un translataire
 *     tags: [Utilisateurs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: translatireId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du translataire
 *         example: 507f1f77bcf86cd799439012
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - typeService
 *               - description
 *             properties:
 *               typeService:
 *                 type: string
 *                 enum: [maritime, routier, aerien]
 *                 example: maritime
 *               description:
 *                 type: string
 *                 example: Transport de 2 conteneurs 40 pieds de Dakar vers Abidjan
 *               dateDepart:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-01"
 *               dateArrivee:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-15"
 *               fichier:
 *                 type: string
 *                 format: binary
 *                 description: Pièce jointe pour la demande (PDF, DOCX, image)
 *     responses:
 *       201:
 *         description: Demande de devis envoyée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Demande de devis envoyée
 *                 devis:
 *                   $ref: '#/components/schemas/Devis'
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Translataire non trouvé
 */
router.post('/demande-devis/:translatireId', uploadAny.array('fichier'), demandeDevis);

/**
 * @swagger
 * /users/mes-devis:
 *   get:
 *     summary: Récupérer tous mes devis
 *     tags: [Utilisateurs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [en_attente, accepte, refuse]
 *         description: Filtrer par statut
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Liste de mes devis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 devis:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Devis'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Non authentifié
 */
router.get('/mes-devis', getMesDevis);

// Récupérer un devis spécifique appartenant au client connecté
router.get('/devis/:id', getMonDevisById);

// Archiver un devis
router.put('/devis/:id/archive', archiverDevis);

// Mettre à jour un devis (client)
router.put('/devis/:id', uploadAny.single('fichier'), updateMonDevis);

// Supprimer définitivement un devis (client)
router.delete('/devis/:id', deleteMonDevis);

/**
 * @swagger
 * /users/devis/{devisId}/cancel:
 *   put:
 *     summary: Annuler un devis en attente
 *     tags: [Utilisateurs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: devisId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Devis annulé
 *       400:
 *         description: Le devis n'est pas annulable
 *       404:
 *         description: Devis non trouvé
 */
router.put('/devis/:devisId/cancel', annulerDevis);

/**
 * @swagger
 * /users/debug/cloudinary-upload:
 *   post:
 *     summary: Route de diagnostic - tester upload Cloudinary directement
 *     tags: [Debug]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fichier:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload réussi
 *       400:
 *         description: Erreur d'upload
 */
router.post('/debug/cloudinary-upload', uploadAny.single('fichier'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier reçu' });
    }
    console.log('[DEBUG] Fichier reçu:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: !!req.file.buffer
    });
    const { uploadFileToCloudinary } = require('../middleware/upload.middleware');
    const url = await uploadFileToCloudinary(req.file, 'debug/test');
    return res.status(200).json({
      success: true,
      message: 'Upload réussi',
      url
    });
  } catch (e) {
    console.error('[DEBUG] Erreur upload:', e);
    return res.status(400).json({
      success: false,
      message: 'Erreur upload',
      error: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
});

module.exports = router;