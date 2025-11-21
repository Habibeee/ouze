const brevo = require('@getbrevo/brevo');
const defaultClient = brevo.ApiClient.instance;

// Configure API key authorization: api-key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY || 'REMOVED';

const apiInstance = new brevo.TransactionalEmailsApi();

const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.textContent = textContent || htmlContent.replace(/<[^>]*>?/gm, '');
  
  sendSmtpEmail.sender = {
    name: process.env.BREVO_FROM_NAME || 'TransDigi',
    email: process.env.BREVO_FROM_EMAIL || 'no-reply@votredomaine.com'
  };
  
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.replyTo = {
    email: process.env.BREVO_REPLY_TO || 'contact@votredomaine.com',
    name: process.env.BREVO_FROM_NAME || 'TransDigi Support'
  };

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email envoyé avec succès:', data);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error.response?.body || error.message);
    return { 
      success: false, 
      error: error.response?.body || error.message,
      code: error.code
    };
  }
};

// Fonction pour envoyer un email d'approbation de compte
exports.sendApprovalEmail = async (email, username) => {
  const subject = 'Votre compte a été approuvé';
  const htmlContent = `
    <h1>Bienvenue sur TransDigi, ${username} !</h1>
    <p>Votre compte a été approuvé avec succès.</p>
    <p>Vous pouvez maintenant vous connecter et commencer à utiliser nos services.</p>
    <p>Cordialement,<br>L'équipe TransDigi</p>
  `;

  return sendEmail(email, subject, htmlContent);
};

// Fonction pour envoyer un email de réinitialisation de mot de passe
exports.sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Réinitialisation de votre mot de passe';
  const htmlContent = `
    <h1>Réinitialisation de votre mot de passe</h1>
    <p>Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien ci-dessous :</p>
    <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
    <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
    <p>Cordialement,<br>L'équipe TransDigi</p>
  `;

  return sendEmail(email, subject, htmlContent);
};

// Fonction générique pour envoyer des emails
exports.sendEmail = sendEmail;
