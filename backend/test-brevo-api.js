require('dotenv').config();
const fetch = require('node-fetch');

async function testBrevoApi() {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Aucune clé API Brevo trouvée dans les variables d\'environnement');
    return;
  }

  console.log('🔑 Clé API détectée (début)');
  console.log('Test de connexion à l\'API Brevo...');

  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'accept': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erreur de l\'API:', data);
      return;
    }

    console.log('✅ Connexion réussie à l\'API Brevo');
    console.log('Compte email:', data.email);
    console.log('Plan actif:', data.plan?.map(p => p.type).join(', ') || 'Aucun');
    
  } catch (error) {
    console.error('❌ Erreur lors de la connexion à l\'API Brevo:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Détails de la réponse:', error.response.data);
    }
  }
}

testBrevoApi();
