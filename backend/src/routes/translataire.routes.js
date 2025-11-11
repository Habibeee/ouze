// src/routes/translataire.routes.js
const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadPhoto,
  getDevis,
  repondreDevis,
  ajouterFormulaire,
  getStatistiques
} = require('../controllers/translataire.controller');
const { protect, authorize, checkApproval } = require('../middleware/auth.middleware');
const { upload, uploadAny } = require('../middleware/upload.middleware');

// Protéger toutes les routes
router.use(protect);
router.use(authorize('translataire'));

/**
 * @swagger
 * /translataires/profile:
 *   get:
 *     summary: Récupérer le profil du translataire
 *     tags: [Translataires]
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
 *                 translataire:
 *                   $ref: '#/components/schemas/Translataire'
 *       401:
 *         description: Non authentifié
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /translataires/profile:
 *   put:
 *     summary: Mettre à jour le profil du translataire
 *     tags: [Translataires]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomEntreprise:
 *                 type: string
 *                 example: Trans Express SARL
 *               telephoneEntreprise:
 *                 type: string
 *                 example: +221338765432
 *               adresse:
 *                 type: string
 *                 example: Port de Dakar
 *               secteurActivite:
 *                 type: string
 *                 example: Transport maritime
 *               typeServices:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [maritime, routier, aerien]
 *                 example: [maritime, routier]
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       401:
 *         description: Non authentifié
 */
router.put('/profile', updateProfile);

/**
 * @swagger
 * /translataires/photo:
 *   put:
 *     summary: Télécharger/Modifier le logo de l'entreprise
 *     tags: [Translataires]
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
 *                 description: Logo de l'entreprise (JPG, PNG, max 5MB)
 *     responses:
 *       200:
 *         description: Logo téléchargé avec succès
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
 *       400:
 *         description: Fichier invalide
 */
router.put('/photo', upload.single('photo'), uploadPhoto);

/**
 * @swagger
 * /translataires/devis:
 *   get:
 *     summary: Récupérer toutes les demandes de devis reçues
 *     description: Accessible uniquement aux translataires approuvés
 *     tags: [Translataires]
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
 *         description: Liste des devis reçus
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
 *       403:
 *         description: Translataire non approuvé
 */
router.get('/devis', checkApproval, getDevis);

/**
 * @swagger
 * /translataires/devis/{devisId}:
 *   put:
 *     summary: Répondre à une demande de devis
 *     description: Accepter ou refuser un devis avec montant et commentaire
 *     tags: [Translataires]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: devisId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du devis
 *         example: 507f1f77bcf86cd799439013
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [accepte]
 *                 example: accepte
 *               montant:
 *                 type: number
 *                 example: 500000
 *                 description: Montant proposé (requis si statut = accepte)
 *               reponse:
 *                 type: string
 *                 example: Nous pouvons prendre en charge votre demande dans les délais
 *               fichier:
 *                 type: string
 *                 format: binary
 *                 description: Pièce jointe (PDF/DOCX/Image) envoyée au client
 *     responses:
 *       200:
 *         description: Réponse enregistrée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 devis:
 *                   $ref: '#/components/schemas/Devis'
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Devis non trouvé
 */
router.put('/devis/:devisId', checkApproval, uploadAny.single('fichier'), repondreDevis);

/**
 * @swagger
 * /translataires/formulaires:
 *   post:
 *     summary: Ajouter des formulaires/documents
 *     description: Uploader des documents nécessaires pour les translataires
 *     tags: [Translataires]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - typeFormulaire
 *               - contenu
 *             properties:
 *               typeFormulaire:
 *                 type: string
 *                 example: Licence de transport
 *               contenu:
 *                 type: object
 *                 description: Contenu du formulaire
 *               fichiers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: URLs des fichiers uploadés
 *     responses:
 *       201:
 *         description: Formulaire ajouté avec succès
 *       403:
 *         description: Translataire non approuvé
 */
router.post('/formulaires', checkApproval, ajouterFormulaire);

/**
 * @swagger
 * /translataires/statistiques:
 *   get:
 *     summary: Récupérer les statistiques du translataire
 *     description: Nombre de devis reçus, acceptés, refusés, chiffre d'affaires
 *     tags: [Translataires]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statistiques:
 *                   type: object
 *                   properties:
 *                     totalDevis:
 *                       type: integer
 *                       example: 25
 *                     devisEnAttente:
 *                       type: integer
 *                       example: 5
 *                     devisAcceptes:
 *                       type: integer
 *                       example: 15
 *                     devisRefuses:
 *                       type: integer
 *                       example: 5
 *                     chiffreAffaires:
 *                       type: number
 *                       example: 7500000
 *       403:
 *         description: Translataire non approuvé
 */
router.get('/statistiques', checkApproval, getStatistiques);

module.exports = router;