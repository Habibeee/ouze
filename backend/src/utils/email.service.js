// src/utils/email.service.js
const nodemailer = require('nodemailer');

// Créer le transporteur
const port = Number(process.env.EMAIL_PORT) || 587;
const secure = (String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true') || port === 465;
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port,
  secure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Vérifier la configuration SMTP au démarrage (log uniquement)
// Désactivé temporairement car l'email n'est pas configuré
// try {
//   transporter.verify().then(() => {
//     console.info(`[MAIL] SMTP ready on ${process.env.EMAIL_HOST || 'smtp.gmail.com'}:${port} secure=${secure}`);
//   }).catch((e) => {
//     console.error('[MAIL] SMTP verify failed:', e?.message || e);
//   });
// } catch {}

// Envoyer email de vérification
exports.sendVerificationEmail = async (email, token, userType) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/#/verifier/${token}`;

  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Vérification de votre compte TransDigiSN',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; 
                      color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚢 TransDigiSN</h1>
              <p>Plateforme de Gestion des Translataires</p>
            </div>
            <div class="content">
              <h2>Bienvenue sur TransDigiSN !</h2>
              <p>Merci de vous être inscrit${userType === 'translataire' ? ' en tant que translataire' : ''}.</p>
              <p>Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
              <center>
                <a href="${verificationUrl}" class="button">Vérifier mon compte</a>
              </center>
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              ${userType === 'translataire' ? '<p><strong>Note :</strong> Après la vérification, votre compte devra être approuvé par un administrateur avant de pouvoir accéder à toutes les fonctionnalités.</p>' : ''}
            </div>
            <div class="footer">
              <p>&copy; 2025 TransDigiSN. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Email aux administrateurs: réponse/acceptation de devis par un transitaire
exports.sendAdminDevisResponseEmail = async (email, { translataireNom, montant, devisId } = {}) => {
  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Réponse à une demande de devis (Admin)',
    html: `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 10px 18px; background: #0d6efd; color: #fff; text-decoration: none; border-radius: 4px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2>Réponse à une demande de devis</h2></div>
          <div class="content">
            <p><strong>Translataire:</strong> ${translataireNom || ''}</p>
            ${montant !== undefined ? `<p><strong>Montant proposé:</strong> ${montant}</p>` : ''}
            <p><a class="btn" href="${process.env.FRONTEND_URL}/#/detail-devis${devisId ? `?id=${devisId}` : ''}">Ouvrir dans le tableau de bord</a></p>
          </div>
        </div>
      </body></html>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Email aux administrateurs: annulation d’un devis par le client
exports.sendAdminDevisCancelledEmail = async (email, { translataireNom, clientName, devisId } = {}) => {
  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🛑 Devis annulé (Admin)',
    html: `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 10px 18px; background: #0d6efd; color: #fff; text-decoration: none; border-radius: 4px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2>Devis annulé</h2></div>
          <div class="content">
            <p><strong>Translataire:</strong> ${translataireNom || ''}</p>
            ${clientName ? `<p><strong>Client:</strong> ${clientName}</p>` : ''}
            <p><a class="btn" href="${process.env.FRONTEND_URL}/#/detail-devis${devisId ? `?id=${devisId}` : ''}">Ouvrir dans le tableau de bord</a></p>
          </div>
        </div>
      </body></html>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Email aux administrateurs: nouvelle demande de devis
exports.sendAdminNewDevisEmail = async (email, { translataireNom, clientName, clientEmail, typeService, description, devisId } = {}) => {
  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '📩 Nouvelle demande de devis (Admin)',
    html: `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0d6efd; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 10px 18px; background: #0d6efd; color: #fff; text-decoration: none; border-radius: 4px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2>Nouvelle demande de devis</h2></div>
          <div class="content">
            <p><strong>Translataire:</strong> ${translataireNom || ''}</p>
            <p><strong>Client:</strong> ${clientName || ''} ${clientEmail ? `(${clientEmail})` : ''}</p>
            ${typeService ? `<p><strong>Type de service:</strong> ${typeService}</p>` : ''}
            ${description ? `<p><strong>Description:</strong><br/>${description}</p>` : ''}
            <p><a class="btn" href="${process.env.FRONTEND_URL}/#/detail-devis${devisId ? `?id=${devisId}` : ''}">Ouvrir dans le tableau de bord</a></p>
          </div>
        </div>
      </body></html>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Email aux administrateurs: nouvel avis client
exports.sendAdminNewReviewEmail = async (email, { translataireNom, rating, comment, userName, userEmail, reviewId, translataireId } = {}) => {
  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '⭐ Nouvel avis client (Admin)',
    html: `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #212529; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 10px 18px; background: #0d6efd; color: #fff; text-decoration: none; border-radius: 4px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2>Nouvel avis client</h2></div>
          <div class="content">
            <p><strong>Translataire:</strong> ${translataireNom || ''}</p>
            <p><strong>Client:</strong> ${userName || ''} ${userEmail ? `(${userEmail})` : ''}</p>
            <p><strong>Note:</strong> ${rating != null ? `${rating}★` : ''}</p>
            ${comment ? `<p><strong>Commentaire:</strong><br/>${comment}</p>` : ''}
            <p><a class="btn" href="${process.env.FRONTEND_URL}/#/recherche-transitaire?transId=${translataireId || ''}&open=reviews">Voir les avis</a></p>
          </div>
        </div>
      </body></html>
    `
  };
  await transporter.sendMail(mailOptions);
};

// ================= Admin: Notifications par email =================
// Envoyer un email aux administrateurs lors d'une nouvelle inscription
exports.sendAdminNewRegistrationEmail = async (email, { type = 'client', displayName = '', companyName = '', userEmail = '' } = {}) => {
  const isTrans = type === 'translataire';
  const subject = isTrans ? 'Nouveau translataire en attente de validation' : 'Nouveau client en attente de validation';
  const title = isTrans ? 'Nouveau translataire' : 'Nouveau client';
  const nameLine = isTrans ? `<p><strong>Entreprise:</strong> ${companyName || displayName || ''}</p>` : `<p><strong>Nom:</strong> ${displayName || ''}</p>`;
  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0d6efd; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 10px 18px; background: #0d6efd; color: #fff; text-decoration: none; border-radius: 4px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2>${title} en attente</h2></div>
          <div class="content">
            ${nameLine}
            ${userEmail ? `<p><strong>Email:</strong> ${userEmail}</p>` : ''}
            <p>Rendez-vous dans votre tableau de bord pour valider le compte.</p>
            <p><a class="btn" href="${process.env.FRONTEND_URL}/#/dashboard-admin">Ouvrir le tableau de bord</a></p>
          </div>
        </div>
      </body></html>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Notifier un changement de statut de compte (block/unblock/archive/unarchive/reject/suspend)
exports.sendAccountStatusChange = async ({ email, displayName, userType, status, reason }) => {
  const titleMap = {
    block: { title: 'Compte bloqué', color: '#dc3545' },
    unblock: { title: 'Compte débloqué', color: '#28a745' },
    archive: { title: 'Compte archivé', color: '#6c757d' },
    unarchive: { title: 'Compte désarchivé', color: '#0d6efd' },
    reject: { title: 'Compte rejeté', color: '#dc3545' },
    suspend: { title: 'Compte suspendu', color: '#ffc107' }
  };
  const meta = titleMap[status] || { title: 'Mise à jour de votre compte', color: '#667eea' };

  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${meta.title} — TransDigiSN`,
    html: `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${meta.color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2>${meta.title}</h2></div>
          <div class="content">
            <p>Bonjour ${displayName || ''},</p>
            <p>Le statut de votre compte ${userType === 'translataire' ? 'translataire' : 'utilisateur'} a été mis à jour: <strong>${meta.title}</strong>.</p>
            ${reason ? `<p><strong>Raison:</strong> ${reason}</p>` : ''}
            <p>Si vous pensez qu'il s'agit d'une erreur, veuillez répondre à cet email.</p>
          </div>
        </div>
      </body></html>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Notifier une suppression de compte
exports.sendAccountDeleted = async ({ email, displayName, userType, reason }) => {
  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Compte supprimé — TransDigiSN',
    html: `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #343a40; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2>Compte supprimé</h2></div>
          <div class="content">
            <p>Bonjour ${displayName || ''},</p>
            <p>Votre compte ${userType === 'translataire' ? 'translataire' : 'utilisateur'} a été supprimé par l'administrateur.</p>
            ${reason ? `<p><strong>Raison:</strong> ${reason}</p>` : ''}
            <p>Si vous avez des questions, répondez à cet email.</p>
          </div>
        </div>
      </body></html>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Nouvelle demande de devis -> email au translataire
exports.sendNewDevisToTranslataire = async (email, { clientName, typeService, description, fichierUrl, translataireNom }) => {
  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '📩 Nouvelle demande de devis',
    html: `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 10px 18px; background: #667eea; color: #fff; text-decoration: none; border-radius: 4px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2>Nouvelle demande de devis</h2></div>
          <div class="content">
            <p><strong>Translataire:</strong> ${translataireNom}</p>
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Type de service:</strong> ${typeService}</p>
            <p><strong>Description:</strong><br/>${description || ''}</p>
            ${fichierUrl ? `<p><strong>Pièce jointe du client:</strong> <a href="${fichierUrl}">Voir le fichier</a></p>` : ''}
            <p>
              <a class="btn" href="${process.env.FRONTEND_URL}/#/dashboard-transitaire">Ouvrir la plateforme</a>
            </p>
          </div>
        </div>
      </body></html>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Devis accepté -> email au client
exports.sendDevisAcceptedToClient = async (email, { clientName, translataireNom, montant, reponse, fichierUrl }) => {
  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Votre devis a été accepté',
    html: `
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 10px 18px; background: #28a745; color: #fff; text-decoration: none; border-radius: 4px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h2>Devis accepté</h2></div>
          <div class="content">
            <p>Bonjour ${clientName},</p>
            <p>Le translataire <strong>${translataireNom}</strong> a accepté votre demande de devis.</p>
            ${montant !== undefined ? `<p><strong>Montant proposé:</strong> ${montant}</p>` : ''}
            ${reponse ? `<p><strong>Message du translataire:</strong><br/>${reponse}</p>` : ''}
            ${fichierUrl ? `<p><strong>Pièce jointe du translataire:</strong> <a href="${fichierUrl}">Voir le fichier</a></p>` : ''}
            <p>
              <a class="btn" href="${process.env.FRONTEND_URL}/#/historique">Voir mes devis</a>
            </p>
          </div>
        </div>
      </body></html>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Envoyer notification d'approbation de compte utilisateur (client)
exports.sendUserApprovalNotification = async (email, displayName) => {
  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Votre compte a été approuvé !',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                      color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #28a745; 
                      color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Compte Approuvé !</h1>
            </div>
            <div class="content">
              <h2>Félicitations ${displayName || ''} !</h2>
              <p>Votre compte a été approuvé par notre équipe. Vous pouvez maintenant vous connecter et utiliser la plateforme.</p>
              <center>
                <a href="${process.env.FRONTEND_URL}/#/connexion" class="button">Se connecter</a>
              </center>
            </div>
            <div class="footer">
              <p>&copy; 2025 TransDigiSN. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};


// Envoyer email de réinitialisation de mot de passe
exports.sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/#/reinitialiser/${token}`;

  const mailOptions = {
    from: `TransDigiSN <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #dc3545; 
                      color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Réinitialisation du mot de passe</h1>
            </div>
            <div class="content">
              <h2>Vous avez demandé à réinitialiser votre mot de passe</h2>
              <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
              <center>
                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              </center>
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Important :</strong> Ce lien expire dans 30 minutes. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 TransDigiSN. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Envoyer notification d'approbation de compte translataire
exports.sendApprovalNotification = async (email, nomEntreprise) => {
  try {
    console.log(`[APPROVAL-EMAIL] Config check:`, {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? '***configured***' : 'MISSING',
      FRONTEND_URL: process.env.FRONTEND_URL
    });

    const mailOptions = {
      from: `TransDigiSN <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Votre compte a été approuvé !',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                        color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #28a745; 
                        color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Compte Approuvé !</h1>
              </div>
              <div class="content">
                <h2>Félicitations ${nomEntreprise} !</h2>
                <p>Votre compte translataire a été approuvé par notre équipe administrative.</p>
                <p>Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme :</p>
                <ul>
                  <li>Recevoir et répondre aux demandes de devis</li>
                  <li>Gérer vos formulaires de marchandises</li>
                  <li>Consulter vos statistiques</li>
                  <li>Et bien plus encore...</li>
                </ul>
                <center>
                  <a href="${process.env.FRONTEND_URL}/login" class="button">Se connecter</a>
                </center>
              </div>
              <div class="footer">
                <p>&copy; 2025 TransDigiSN. Tous droits réservés.</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    console.log(`[APPROVAL-EMAIL] Avant sendMail:`, { to: email, subject: mailOptions.subject });
    await transporter.sendMail(mailOptions);
    console.log(`[APPROVAL-EMAIL] ✓ Email envoyé avec succès`);
  } catch (e) {
    console.error(`[APPROVAL-EMAIL] ✗ Erreur lors du sendMail:`, {
      message: e.message,
      code: e.code,
      command: e.command,
      response: e.response,
      stack: e.stack
    });
    throw e;
  }
};

// Expose une fonction de vérification du transporteur SMTP pour debug
exports.verifySmtp = async () => {
  try {
    await transporter.verify();
    return { ok: true };
  } catch (e) {
    // propager l'erreur pour permettre au caller d'inspecter le message complet
    throw e;
  }
};