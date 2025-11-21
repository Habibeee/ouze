/**
 * Service d'envoi d'emails via l'API REST de Brevo
 * Utilise l'API v3 de Brevo pour l'envoi d'emails transactionnels
 */

const fetch = require('node-fetch');

// Configuration de l'API Brevo
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (!BREVO_API_KEY) {
  console.warn('Avertissement: Aucune clé API Brevo trouvée dans les variables d\'environnement');
}

/**
 * Vérifie la connexion à l'API Brevo
 */
async function verifyConnection() {
  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Échec de la connexion à l\'API Brevo');
    }

    const data = await response.json();
    return { 
      success: true,
      email: data.email,
      plan: data.plan?.map(p => p.type).join(', ') || 'Aucun plan actif'
    };
  } catch (error) {
    console.error('Erreur de connexion à l\'API Brevo:', error);
    return { 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }
}

/**
 * Envoi d'un email via l'API REST de Brevo
 * @param {string|string[]} to - Adresse email ou tableau d'adresses email des destinataires
 * @param {string} subject - Sujet de l'email
 * @param {string} html - Contenu HTML de l'email
 * @param {string} [text] - Contenu texte de l'email (optionnel)
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
const sendEmail = async (to, subject, html, text = '') => {
  if (!BREVO_API_KEY) {
    const error = 'Clé API Brevo non configurée';
    console.error(error);
    return { success: false, error };
  }

  const emailData = {
    sender: {
      name: process.env.BREVO_FROM_NAME || 'TransDigi',
      email: process.env.BREVO_FROM_EMAIL || 'no-reply@votredomaine.com'
    },
    to: Array.isArray(to) 
      ? to.map(email => ({ email }))
      : [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text || html.replace(/<[^>]*>?/gm, ''),
    replyTo: {
      email: process.env.BREVO_REPLY_TO || 'contact@votredomaine.com',
      name: process.env.BREVO_FROM_NAME || 'TransDigi Support'
    }
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Échec de l\'envoi de l\'email');
    }

    console.log('Email envoyé avec succès à:', to);
    return {
      success: true,
      messageId: responseData.messageId,
      data: responseData
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return {
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }
};

/**
 * Envoie un email d'approbation de compte
 * @param {string} email - Adresse email du destinataire
 * @param {string} username - Nom d'utilisateur
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
const sendApprovalEmail = async (email, username) => {
  const subject = 'Votre compte a été approuvé';
  const html = `
    <h1>Bienvenue sur TransDigi, ${username} !</h1>
    <p>Votre compte a été approuvé avec succès.</p>
    <p>Vous pouvez maintenant vous connecter et commencer à utiliser nos services.</p>
    <p>Cordialement,<br>L'équipe TransDigi</p>
  `;

  return sendEmail(email, subject, html);
};

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param {string} email - Adresse email du destinataire
 * @param {string} resetToken - Jeton de réinitialisation
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  if (!process.env.FRONTEND_URL) {
    console.warn('FRONTEND_URL n\'est pas défini dans les variables d\'environnement');
  }
  
  const resetUrl = `${process.env.FRONTEND_URL || 'https://votresite.com'}/reset-password?token=${resetToken}`;
  const subject = 'Réinitialisation de votre mot de passe';
  const html = `
    <h1>Réinitialisation de votre mot de passe</h1>
    <p>Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien ci-dessous :</p>
    <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
    <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
    <p>Cordialement,<br>L'équipe TransDigi</p>
  `;

  return sendEmail(email, subject, html);
};

// Export des fonctions du module
module.exports = {
  sendEmail,
  sendApprovalEmail,
  sendPasswordResetEmail,
  testConnection: verifyConnection
};