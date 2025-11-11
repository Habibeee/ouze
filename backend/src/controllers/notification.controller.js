// src/controllers/notification.controller.js
const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const filter = { recipientId: req.user._id, recipientType: req.userType };

    const [items, total, unread] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false })
    ]);

    res.json({ success: true, items, total, unread });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des notifications', error: error.message });
  }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipientId: req.user._id, recipientType: req.userType, isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors du comptage des notifications', error: error.message });
  }
};

// POST /api/notifications/mark-read { ids: [] }
exports.markAsRead = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Liste d\'IDs requise' });
    }
    const filter = { _id: { $in: ids }, recipientId: req.user._id, recipientType: req.userType };
    const result = await Notification.updateMany(filter, { $set: { isRead: true } });
    res.json({ success: true, matched: result.matchedCount ?? result.n, modified: result.modifiedCount ?? result.nModified });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour', error: error.message });
  }
};

// POST /api/notifications/mark-all-read
exports.markAllAsRead = async (req, res) => {
  try {
    const filter = { recipientId: req.user._id, recipientType: req.userType, isRead: false };
    const result = await Notification.updateMany(filter, { $set: { isRead: true } });
    res.json({ success: true, matched: result.matchedCount ?? result.n, modified: result.modifiedCount ?? result.nModified });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour', error: error.message });
  }
};
