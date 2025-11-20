const express = require('express');
const router = express.Router();
const { verifySmtp } = require('../utils/email.service');

// Route publique protégée? keep it protected by admin in case of sensitive info
// For simplicity it is protected by existing protect middleware when mounted under /api
router.get('/smtp-test', async (req, res) => {
  try {
    const r = await verifySmtp();
    return res.json({ success: true, message: 'SMTP OK', details: r });
  } catch (e) {
    console.error('[DEBUG] SMTP verify error:', e && (e.message || e));
    return res.status(500).json({ success: false, message: 'SMTP verify failed', error: e && (e.message || String(e)), stack: e && e.stack });
  }
});

module.exports = router;
