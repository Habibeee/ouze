// src/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../controllers/notification.controller');

// protéger toutes les routes de notifications
router.use(protect);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Liste des notifications du compte connecté
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Liste des notifications
 */
router.get('/', getNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Compteur des notifications non lues
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Compteur non lus
 */
router.get('/unread-count', getUnreadCount);

/**
 * @swagger
 * /notifications/mark-read:
 *   post:
 *     summary: Marquer des notifications comme lues
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
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
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/mark-read', markAsRead);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   post:
 *     summary: Marquer toutes les notifications comme lues
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/mark-all-read', markAllAsRead);

module.exports = router;
