// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const {
  registerClient,
  registerTranslataire,
  login,
  googleLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  resendVerification
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /auth/register/client:
 *   post:
 *     summary: Inscription d'un nouveau client
 *     description: Créer un compte client et recevoir un token JWT
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - telephone
 *               - motDePasse
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Diallo
 *               prenom:
 *                 type: string
 *                 example: Moussa
 *               email:
 *                 type: string
 *                 format: email
 *                 example: moussa@example.com
 *               telephone:
 *                 type: string
 *                 example: +221771234567
 *               adresse:
 *                 type: string
 *                 example: Dakar, Sénégal
 *               motDePasse:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *     responses:
 *       201:
 *         description: Inscription réussie
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
 *                   example: Inscription réussie. Veuillez vérifier votre email.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides ou email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register/client', registerClient);

/**
 * @swagger
 * /auth/register/translataire:
 *   post:
 *     summary: Inscription d'un translataire
 *     description: Créer un compte translataire (entreprise)
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomEntreprise
 *               - ninea
 *               - telephoneEntreprise
 *               - email
 *               - motDePasse
 *               - typeServices
 *             properties:
 *               nomEntreprise:
 *                 type: string
 *                 example: Trans Express SARL
 *               ninea:
 *                 type: string
 *                 example: "123456789"
 *               telephoneEntreprise:
 *                 type: string
 *                 example: +221338765432
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contact@transexpress.sn
 *               motDePasse:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               secteurActivite:
 *                 type: string
 *                 example: Transport maritime
 *               adresse:
 *                 type: string
 *                 example: Port de Dakar
 *               typeServices:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [maritime, routier, aerien]
 *                 example: [maritime, routier]
 *     responses:
 *       201:
 *         description: Inscription réussie, en attente d'approbation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 translataire:
 *                   $ref: '#/components/schemas/Translataire'
 *       400:
 *         description: Email ou NINEA déjà utilisé
 */
router.post('/register/translataire', registerTranslataire);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion
 *     description: Se connecter et obtenir un token JWT
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - motDePasse
 *               - userType
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: moussa@example.com
 *               motDePasse:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               userType:
 *                 type: string
 *                 enum: [user, translataire, admin]
 *                 example: user
 *                 description: Type d'utilisateur (user pour client)
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: Token JWT à utiliser pour les requêtes authentifiées
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 userType:
 *                   type: string
 *                   example: user
 *                 user:
 *                   type: object
 *                   description: Informations de l'utilisateur
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Connexion avec Google (clients)
 *     description: Vérifie l'idToken Google et connecte/crée le compte client (compte soumis à approbation admin)
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Jeton Google ID reçu côté front
 *               userType:
 *                 type: string
 *                 enum: [user]
 *                 default: user
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       403:
 *         description: Compte en attente d'approbation
 */
router.post('/google', googleLogin);

/**
 * @swagger
 * /auth/verify/{token}:
 *   get:
 *     summary: Vérifier l'email
 *     description: Vérifier l'email avec le token reçu par email
 *     tags: [Authentification]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de vérification reçu par email
 *         example: abc123def456ghi789
 *     responses:
 *       200:
 *         description: Email vérifié avec succès
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
 *                   example: Email vérifié avec succès
 *       400:
 *         description: Token invalide ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verify/:token', verifyEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Mot de passe oublié
 *     description: Demander un lien de réinitialisation de mot de passe par email
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - userType
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: moussa@example.com
 *               userType:
 *                 type: string
 *                 enum: [user, translataire]
 *                 example: user
 *                 description: Type d'utilisateur
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Email de réinitialisation envoyé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   put:
 *     summary: Réinitialiser le mot de passe
 *     description: Définir un nouveau mot de passe avec le token reçu par email
 *     tags: [Authentification]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de réinitialisation
 *         example: abc123def456ghi789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - motDePasse
 *             properties:
 *               motDePasse:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: nouveaumotdepasse123
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Mot de passe réinitialisé
 *       400:
 *         description: Token invalide ou expiré
 */
router.put('/reset-password/:token', resetPassword);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Renvoyer l'email de vérification
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de vérification renvoyé (si un compte existe)
 */
router.post('/resend-verification', resendVerification);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion et révocation du token courant
 *     description: Ajoute le token JWT courant à la blacklist. Toute requête suivante avec ce token sera refusée.
 *     tags: [Authentification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non autorisé ou token invalide
 */
router.post('/logout', protect, logout);

module.exports = router;