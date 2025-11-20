const express = require('express');
const router = express.Router();
const { transporter, verifySMTP } = require('../utils/email.service');
const dns = require('dns');

/**
 * @route GET /api/test/smtp
 * @description Tester la connexion SMTP
 * @access Public
 */
router.get('/smtp', async (req, res) => {
  try {
    // 1. Vérifier la résolution DNS
    let dnsResults;
    try {
      dnsResults = await dns.promises.resolve('smtp-relay.brevo.com');
    } catch (dnsError) {
      return res.status(500).json({
        success: false,
        message: 'Erreur de résolution DNS',
        error: dnsError.message
      });
    }

    // 2. Vérifier la connexion SMTP
    const smtpConfig = {
      host: transporter.options.host,
      port: transporter.options.port,
      secure: transporter.options.secure,
      hasAuth: !!transporter.options.auth.user && !!transporter.options.auth.pass
    };

    try {
      await transporter.verify();
      
      // 3. Essayer d'envoyer un email test
      const testEmail = {
        from: `"Test SMTP" <${process.env.BREVO_FROM_EMAIL || 'test@example.com'}>`,
        to: process.env.ADMIN_EMAIL || 'admin@example.com',
        subject: 'Test de connexion SMTP',
        text: 'Ceci est un email de test pour vérifier la connexion SMTP.',
        html: '<h1>Test de connexion SMTP</h1><p>Ceci est un email de test pour vérifier la connexion SMTP.</p>'
      };

      const info = await transporter.sendMail(testEmail);
      
      return res.json({
        success: true,
        message: 'Connexion SMTP réussie et email de test envoyé',
        dns: dnsResults,
        smtpConfig,
        messageId: info.messageId
      });
      
    } catch (smtpError) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la connexion SMTP',
        error: smtpError.message,
        stack: process.env.NODE_ENV === 'development' ? smtpError.stack : undefined,
        dns: dnsResults,
        smtpConfig
      });
    }
    
  } catch (error) {
    console.error('Erreur lors du test SMTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du test SMTP',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
