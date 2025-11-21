// src/utils/email.service.js
const { 
  sendEmail: brevoSendEmail,
  sendApprovalEmail: brevoSendApprovalEmail,
  sendPasswordResetEmail 
} = require('./brevo.service');

/**
 * Envoie un email via l'API Brevo
 * @param {Object} mailOptions - Les options de l'email
 * @param {string} mailOptions.to - L'adresse email du destinataire
 * @param {string} mailOptions.subject - Le sujet de l'email
 * @param {string} mailOptions.html - Le contenu HTML de l'email
 * @param {string} [mailOptions.text] - Le contenu texte de l'email (optionnel)
 * @returns {Promise<Object>} - Un objet contenant les informations d'envoi
 */
const sendEmail = async (mailOptions) => {
  const { to, subject, html, text } = mailOptions;
  
  try {
    const result = await brevoSendEmail(to, subject, html, text);
    return {
      accepted: [to],
      rejected: [],
      envelope: { 
        from: process.env.BREVO_FROM_EMAIL || 'no-reply@votredomaine.com', 
        to: [to] 
      },
      messageId: result.messageId,
      response: '250 Message sent successfully'
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

/**
 * Vérifie la connexion à l'API Brevo
 * @returns {Promise<boolean>} - True si la connexion est établie, false sinon
 */
const verifySMTP = async () => {
  console.log('🔍 Vérification de la connexion à l\'API Brevo...');
  
  try {
    // Vérification DNS
    const dns = require('dns');
    const dnsResult = await dns.promises.resolve('smtp-relay.brevo.com');
    console.log('✅ Résolution DNS réussie:', dnsResult);
    
    // Test d'envoi d'email factice (mais avec une adresse invalide pour éviter l'envoi réel)
    try {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test de connexion API Brevo',
        text: 'Ceci est un test de connexion',
        html: '<p>Ceci est un test de connexion</p>'
      });
    } catch (apiError) {
      // On s'attend à une erreur car l'adresse est invalide, mais cela confirme que l'API est joignable
      if (apiError.message.includes('Invalid email address')) {
        console.log('✅ Connexion à l\'API Brevo réussie');
        return true;
      }
      throw apiError;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Échec de la connexion à l\'API Brevo:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return false;
  }
};

/**
 * Envoie une notification d'approbation de compte
 * @param {string} email - Adresse email du destinataire
 * @param {string} displayName - Nom à afficher
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
const sendApprovalNotification = async (email, displayName) => {
  return brevoSendApprovalEmail(email, displayName);
};

/**
 * Envoie une notification de changement de statut de compte
 * @param {Object} options - Options de la notification
 * @param {string} options.email - Adresse email du destinataire
 * @param {string} options.displayName - Nom à afficher
 * @param {string} options.userType - Type d'utilisateur (client/translataire)
 * @param {string} options.status - Statut du compte (reject/suspend/delete)
 * @param {string} [options.reason] - Raison du changement de statut
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
const sendAccountStatusChange = async ({ email, displayName, userType, status, reason = '' }) => {
  let subject, html;
  
  switch (status) {
    case 'reject':
      subject = 'Votre compte a été rejeté';
      html = `
        <h1>Compte rejeté</h1>
        <p>Bonjour ${displayName},</p>
        <p>Votre compte ${userType} a été rejeté par l'administrateur.</p>
        ${reason ? `<p>Raison : ${reason}</p>` : ''}
        <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.</p>
        <p>Cordialement,<br>L'équipe TransDigi</p>
      `;
      break;
      
    case 'suspend':
      subject = 'Votre compte a été suspendu';
      html = `
        <h1>Compte suspendu</h1>
        <p>Bonjour ${displayName},</p>
        <p>Votre compte ${userType} a été suspendu par l'administrateur.</p>
        ${reason ? `<p>Raison : ${reason}</p>` : ''}
        <p>Pour plus d'informations, veuillez contacter le support.</p>
        <p>Cordialement,<br>L'équipe TransDigi</p>
      `;
      break;
      
    default:
      throw new Error('Statut de notification non pris en charge');
  }
  
  return sendEmail({ to: email, subject, html });
};

/**
 * Envoie une notification de suppression de compte
 * @param {Object} options - Options de la notification
 * @param {string} options.email - Adresse email du destinataire
 * @param {string} options.displayName - Nom à afficher
 * @param {string} options.userType - Type d'utilisateur (client/translataire)
 * @param {string} [options.reason] - Raison de la suppression
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
const sendAccountDeleted = async ({ email, displayName, userType, reason = '' }) => {
  const subject = 'Votre compte a été supprimé';
  const html = `
    <h1>Compte supprimé</h1>
    <p>Bonjour ${displayName},</p>
    <p>Votre compte ${userType} a été supprimé par l'administrateur.</p>
    ${reason ? `<p>Raison : ${reason}</p>` : ''}
    <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.</p>
    <p>Cordialement,<br>L'équipe TransDigi</p>
  `;
  
  return sendEmail({ to: email, subject, html });
};

// Exporter les fonctions pour maintenir la compatibilité
module.exports = {
  sendEmail,
  sendApprovalEmail: brevoSendApprovalEmail,
  sendPasswordResetEmail,
  verifySMTP,
  sendApprovalNotification,
  sendAccountStatusChange,
  sendAccountDeleted
};
