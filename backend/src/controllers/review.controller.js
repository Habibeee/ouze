// src/controllers/review.controller.js
const Review = require('../models/Review');
const Translataire = require('../models/Translataire');
const Notification = require('../models/Notification');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { sendAdminNewReviewEmail } = require('../utils/email.service');
const { uploadFileToCloudinary } = require('../middleware/upload.middleware');
const { getIO } = require('../services/socket');

async function recalcTranslataireRatings(translataireId) {
  const agg = await Review.aggregate([
    { $match: { translataireId: Translataire.db.base.Types.ObjectId.createFromHexString(String(translataireId)), isApproved: true } },
    { $group: { _id: '$translataireId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const avg = agg[0]?.avg || 0;
  const count = agg[0]?.count || 0;
  await Translataire.findByIdAndUpdate(translataireId, { avgRating: Math.round(avg * 10) / 10, ratingsCount: count });
}

exports.createReview = async (req, res) => {
  try {
    const { translataireId, rating, comment } = req.body;

    const translataire = await Translataire.findById(translataireId);
    if (!translataire || !translataire.isApproved) {
      return res.status(404).json({ success: false, message: 'Translataire non trouvé ou non approuvé' });
    }

    const data = {
      translataireId,
      userId: req.user._id,
      rating: Number(rating),
      comment
    };

    // Upload attachments if present
    if (req.files && req.files.length > 0) {
      const urls = [];
      for (const f of req.files) {
        const url = await uploadFileToCloudinary(f, 'reviews');
        urls.push(url);
      }
      data.attachments = urls;
    }

    const review = await Review.create(data);

    await recalcTranslataireRatings(translataireId);

    // Notify translataire
    try {
      const notif = await Notification.create({
        recipientId: translataire._id,
        recipientType: 'translataire',
        type: 'review_new',
        title: 'Nouvel avis reçu',
        message: `Vous avez reçu une nouvelle note (${data.rating}⭐).`,
        data: { translataireId, userId: req.user._id, reviewId: review._id }
      });
      try { getIO().to(`translataire:${translataire._id}`).emit('notification:new', notif); } catch {}
    } catch (e) { console.error('Notif translataire review_new:', e.message); }

    // Notify admins (optional)
    try {
      // Récupérer nom/email du client auteur
      const client = await User.findById(req.user._id).select('nom prenom email');
      const userName = `${client?.prenom || ''} ${client?.nom || ''}`.trim() || '';
      const admins = await Admin.find({}, '_id email');
      const notifs = await Notification.insertMany(admins.map(a => ({
        recipientId: a._id,
        recipientType: 'admin',
        type: 'review_new',
        title: 'Nouvel avis client',
        message: `${userName || 'Un client'} a noté ${translataire.nomEntreprise} (${data.rating}⭐).`,
        data: { translataireId, userId: req.user._id, reviewId: review._id, actorName: userName, actorEmail: client?.email || '' }
      })));
      try { notifs.forEach(n => getIO().to(`admin:${n.recipientId}`).emit('notification:new', n)); } catch {}
      // Email aux admins
      try {
        await Promise.all((admins || []).map(a => a?.email ? sendAdminNewReviewEmail(a.email, {
          translataireNom: translataire.nomEntreprise,
          rating: data.rating,
          comment,
          userName,
          userEmail: client?.email || '',
          reviewId: review._id,
          translataireId
        }) : Promise.resolve()));
      } catch {}
    } catch (e) { console.error('Notif admin review_new:', e.message); }

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur création avis', error: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    if (String(review.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const updates = {};
    if (req.body.rating !== undefined) updates.rating = Number(req.body.rating);
    if (req.body.comment !== undefined) updates.comment = req.body.comment;

    // Append attachments if provided
    if (req.files && req.files.length > 0) {
      const urls = [];
      for (const f of req.files) {
        const url = await uploadFileToCloudinary(f, 'reviews');
        urls.push(url);
      }
      updates.$push = { attachments: { $each: urls } };
    }

    const updated = await Review.findByIdAndUpdate(review._id, updates, { new: true });
    await recalcTranslataireRatings(review.translataireId);

    res.json({ success: true, review: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour avis', error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    if (String(review.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await Review.findByIdAndDelete(review._id);
    await recalcTranslataireRatings(review.translataireId);

    res.json({ success: true, message: 'Avis supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur suppression avis', error: error.message });
  }
};

exports.getReviewsByTranslataire = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent', minRating } = req.query;
    const filter = { translataireId: req.params.translataireId, isApproved: true };
    if (minRating) filter.rating = { $gte: Number(minRating) };

    const sortMap = { recent: { createdAt: -1 }, rating: { rating: -1 } };

    const [items, total, trans] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'nom prenom')
        .sort(sortMap[sort] || sortMap.recent)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Review.countDocuments(filter),
      Translataire.findById(req.params.translataireId).select('avgRating ratingsCount')
    ]);

    res.json({ success: true, items, total, avgRating: trans?.avgRating || 0, ratingsCount: trans?.ratingsCount || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur récupération avis', error: error.message });
  }
};

exports.getMyReview = async (req, res) => {
  try {
    const review = await Review.findOne({ translataireId: req.params.translataireId, userId: req.user._id });
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur récupération avis', error: error.message });
  }
};
