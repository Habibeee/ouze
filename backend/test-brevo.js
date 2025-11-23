require('dotenv').config();
const { 
  sendEmail, 
  sendApprovalEmail, 
  sendPasswordResetEmail,
  testConnection 
} = require('./src/utils/brevo.service');

// Fonction pour afficher les résultats de manière lisible
function logResult(operation, result) {
  console.log('\n' + '='.repeat(60));
  console.log(`RÉSULTAT DU TEST: ${operation}`);
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log('✅ SUCCÈS');
    if (result.email) console.log('Email du compte:', result.email);
    if (result.plan) console.log('Plan actif:', result.plan);
    if (result.data) {
      console.log('Données reçues:', JSON.stringify(result.data, null, 2));
    }
  } else {
    console.error('❌ ÉCHEC');
    console.error('Erreur:', result.error);
    if (result.details) {
      console.error('Détails:', JSON.stringify(result.details, null, 2));
    }
  }
  console.log('='.repeat(60) + '\n');
}

async function runTests() {
  try {
    console.log('🚀 Démarrage des tests du service Brevo API\n');
    
    // Vérification des variables d'environnement requises
    const requiredVars = ['BREVO_API_KEY', 'BREVO_FROM_EMAIL'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Variables d\'environnement manquantes :', missingVars.join(', '));
      console.log('\nConfiguration requise dans .env :');
      console.log('BREVO_API_KEY=votre_clé_api_brevo');
      console.log('BREVO_FROM_EMAIL=no-reply@votredomaine.com');
      console.log('BREVO_FROM_NAME="TransDigi" (optionnel)');
      console.log('BREVO_REPLY_TO=contact@votredomaine.com (optionnel)');
      console.log('FRONTEND_URL=http://localhost:3000 (pour les liens de réinitialisation)');
      return;
    }
    
    // 1. Test de connexion à l'API Brevo
    console.log('1. Test de connexion à l\'API Brevo...');
    const connectionTest = await testConnection();
    logResult('Connexion SMTP', connectionTest);
    
    if (!connectionTest.success) {
      console.error('❌ Impossible de se connecter au serveur SMTP. Vérifiez vos identifiants SMTP.');
      return;
    }
    
    // 2. Test d'envoi d'email simple
    console.log('\n2. Test d\'envoi d\'email simple...');
    const testEmail = process.env.TEST_EMAIL || 'votre.email@exemple.com';
    const simpleEmail = await sendEmail(
      testEmail,
      'Test du service Brevo SMTP',
      `
        <h1>Test d'envoi d'email via SMTP</h1>
        <p>Ceci est un email de test envoyé depuis le service Brevo SMTP.</p>
        <p>Date: ${new Date().toLocaleString()}</p>
      `,
      'Ceci est un email de test envoyé depuis le service Brevo SMTP.'
    );
    
    logResult('Email simple', simpleEmail);
    
    // 3. Test d'envoi d'email d'approbation
    console.log('\n3. Test d\'envoi d\'email d\'approbation...');
    const approvalEmail = await sendApprovalEmail(testEmail, 'UtilisateurTest');
    logResult('Email d\'approbation', approvalEmail);
    
    // 4. Test d'envoi d'email de réinitialisation
    console.log('\n4. Test d\'envoi d\'email de réinitialisation...');
    const resetToken = 'test-token-' + Math.random().toString(36).substr(2, 9);
    const resetEmail = await sendPasswordResetEmail(testEmail, resetToken);
    logResult('Email de réinitialisation', resetEmail);
    
    console.log('\n✅ Tous les tests ont été exécutés avec succès !');
    console.log('Vérifiez votre boîte mail pour confirmer la réception des emails.');
    
  } catch (error) {
    console.error('\n❌ Une erreur inattendue est survenue :');
    console.error(error);
  }
}

// Exécution des tests
runTests();
