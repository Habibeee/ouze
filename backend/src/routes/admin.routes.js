// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllTranslataires,
  approveTranslataire,
  approveUser,
  toggleBlockAccount,
  deleteAccount,
  getStatistiques,
  getDashboardUsers,
  getDashboardTranslataires,
  getAllDevis,
  getDevisById,
  updateDevisStatus,
  bulkAccountsAction,
  listAdmins,
  createAdmin,
  updateAdminStatus,
  deleteAdminAccount,
  changeAdminPassword,
  getAdminProfile,
  updateAdminProfile,
  updateAdminEmail,
  setTranslataireRating
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Protéger toutes les routes admin
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Liste de tous les utilisateurs (clients)
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom, prénom ou email
 *       - in: query
 *         name: isBlocked
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut bloqué
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *       403:
 *         description: Accès refusé (non admin)
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /admin/users/{id}/approve:
 *   put:
 *     summary: Approuver un utilisateur (client)
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à approuver
 *     responses:
 *       200:
 *         description: Utilisateur approuvé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/users/:id/approve', approveUser);

/**
 * @swagger
 * /admin/dashboard/users:
 *   get:
 *     summary: Statistiques dashboard utilisateurs
 *     description: Nombre total, nouveaux inscrits, utilisateurs actifs
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     nouveaux:
 *                       type: integer
 *                     actifs:
 *                       type: integer
 *                     bloques:
 *                       type: integer
 */
router.get('/dashboard/users', getDashboardUsers);

/**
 * @swagger
 * /admin/translataires:
 *   get:
 *     summary: Liste de tous les translataires
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [en_attente, approuve, rejete, suspendu]
 *         description: Filtrer par statut d'approbation
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom d'entreprise
 *     responses:
 *       200:
 *         description: Liste des translataires
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
 */
router.get('/translataires', getAllTranslataires);

/**
 * @swagger
 * /admin/dashboard/translataires:
 *   get:
 *     summary: Statistiques dashboard translataires
 *     description: Nombre total, en attente d'approbation, approuvés, suspendus
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques translataires
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     enAttente:
 *                       type: integer
 *                     approuves:
 *                       type: integer
 *                     rejetes:
 *                       type: integer
 *                     suspendus:
 *                       type: integer
 */
router.get('/dashboard/translataires', getDashboardTranslataires);

/**
 * @swagger
 * /admin/translataires/{id}/approve:
 *   put:
 *     summary: Approuver ou rejeter un translataire
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du translataire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [approuve, rejete, suspendu]
 *                 example: approuve
 *               commentaire:
 *                 type: string
 *                 example: Tous les documents sont conformes
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 translataire:
 *                   $ref: '#/components/schemas/Translataire'
 *       404:
 *         description: Translataire non trouvé
 */
router.put('/translataires/:id/approve', approveTranslataire);

// Définir la note admin d'un translataire (1 à 5)
router.put('/translataires/:id/rating', setTranslataireRating);

/**
 * @swagger
 * /admin/{userType}/{id}/block:
 *   put:
 *     summary: Bloquer ou débloquer un compte
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, translataire]
 *         description: Type d'utilisateur
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               raison:
 *                 type: string
 *                 example: Comportement inapproprié
 *     responses:
 *       200:
 *         description: Compte bloqué/débloqué
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Compte bloqué avec succès
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:userType/:id/block', toggleBlockAccount);

/**
 * @swagger
 * /admin/{userType}/{id}:
 *   delete:
 *     summary: Supprimer un compte définitivement
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, translataire]
 *         description: Type d'utilisateur
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Compte supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Compte supprimé définitivement
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete('/:userType/:id', deleteAccount);

/**
 * @swagger
 * /admin/{userType}/bulk/{action}:
 *   post:
 *     summary: Opérations en masse sur des comptes (bloquer, débloquer, archiver, désarchiver, supprimer)
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, translataire]
 *         description: Type d'utilisateur ciblé
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [block, unblock, archive, unarchive, delete]
 *         description: Action à appliquer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64fa1c2e9b1a2c3d4e5f6789", "64fa1c2e9b1a2c3d4e5f6790"]
 *     responses:
 *       200:
 *         description: Opération effectuée
 *       400:
 *         description: Paramètres invalides
 */
router.post('/:userType/bulk/:action', bulkAccountsAction);

/**
 * @swagger
 * /admin/statistiques:
 *   get:
 *     summary: Statistiques globales de la plateforme
 *     description: Vue d'ensemble complète (utilisateurs, translataires, devis, revenus)
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques globales
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
 *                     utilisateurs:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         nouveaux:
 *                           type: integer
 *                     translataires:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         enAttente:
 *                           type: integer
 *                         actifs:
 *                           type: integer
 *                     devis:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         enAttente:
 *                           type: integer
 *                         traites:
 *                           type: integer
 *                     chiffreAffaires:
 *                       type: number
 *                       example: 15000000
 */
router.get('/statistiques', getStatistiques);

/**
 * @swagger
 * /admin/devis:
 *   get:
 *     summary: Liste de tous les devis de la plateforme
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [en_attente, accepte, refuse]
 *       - in: query
 *         name: typeService
 *         schema:
 *           type: string
 *           enum: [maritime, routier, aerien]
 *     responses:
 *       200:
 *         description: Liste de tous les devis
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
 */
router.get('/devis', getAllDevis);

// Détail d'un devis (admin)
router.get('/devis/:id', getDevisById);

// Mettre à jour le statut d'un devis (admin)
router.put('/devis/:id', updateDevisStatus);

/**
 * @swagger
 * /admin/admins:
 *   get:
 *     summary: Lister les administrateurs
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des admins
 */
router.get('/admins', listAdmins);

/**
 * @swagger
 * /admin/admins:
 *   post:
 *     summary: Créer un administrateur
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, email, motDePasse]
 *             properties:
 *               nom: { type: string }
 *               email: { type: string, format: email }
 *               motDePasse: { type: string, format: password }
 *               telephone: { type: string }
 *               role: { type: string, enum: [admin, super_admin], default: admin }
 *               permissions: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Admin créé
 */
router.post('/admins', createAdmin);

/**
 * @swagger
 * /admin/admins/{id}/status:
 *   put:
 *     summary: Mettre à jour le statut d'un administrateur (block/unblock/archive/unarchive)
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [block, unblock, archive, unarchive]
 *     responses:
 *       200:
 *         description: Statut mis à jour
 */
router.put('/admins/:id/status', updateAdminStatus);

/**
 * @swagger
 * /admin/admins/{id}:
 *   delete:
 *     summary: Supprimer un administrateur
 *     tags: [Administration]
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
 *         description: Admin supprimé
 */
router.delete('/admins/:id', deleteAdminAccount);

/**
 * @swagger
 * /admin/profile/password:
 *   put:
 *     summary: Modifier le mot de passe de l'administrateur connecté
 *     tags: [Administration]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour
 */
router.put('/profile/password', changeAdminPassword);

// Profil admin (préférences notifications)
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/profile/email', updateAdminEmail);

module.exports = router;