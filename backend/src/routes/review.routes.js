// src/routes/review.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { uploadAny } = require('../middleware/upload.middleware');
const { createReview, updateReview, deleteReview, getReviewsByTranslataire, getMyReview } = require('../controllers/review.controller');

/**
 * @swagger
 * tags:
 *   - name: Avis
 *     description: Gestion des avis et notes des transitaires
 */

/**
 * @swagger
 * /reviews/translataire/{translataireId}:
 *   get:
 *     summary: Lister les avis d'un translataire
 *     tags: [Avis]
 *     parameters:
 *       - in: path
 *         name: translataireId
 *         required: true
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, rating]
 *           default: recent
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *     responses:
 *       200:
 *         description: Liste des avis et statistiques
 */
// Toutes les routes nécessitent auth, sauf la liste publique
router.get('/translataire/:translataireId', getReviewsByTranslataire);

router.use(protect);
router.use(authorize('user'));

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Créer un avis sur un translataire
 *     tags: [Avis]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - translataireId
 *               - rating
 *             properties:
 *               translataireId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Avis créé
 */
// Créer un avis (pièces jointes optionnelles)
router.post('/', uploadAny.array('attachments', 5), createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Mettre à jour mon avis
 *     tags: [Avis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Avis mis à jour
 */
// Modifier mon avis
router.put('/:id', uploadAny.array('attachments', 5), updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Supprimer mon avis
 *     tags: [Avis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Avis supprimé
 */
// Supprimer mon avis
router.delete('/:id', deleteReview);

/**
 * @swagger
 * /reviews/mine/{translataireId}:
 *   get:
 *     summary: Récupérer mon avis pour un translataire
 *     tags: [Avis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: translataireId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mon avis (s'il existe)
 */
// Récupérer mon avis sur un translataire
router.get('/mine/:translataireId', getMyReview);

module.exports = router;
