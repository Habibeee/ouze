require('dotenv').config();
const mongoose = require('mongoose');
const Translataire = require('../src/models/Translataire');

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI n’est pas défini dans ton .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connecté à MongoDB');

  const translataires = await Translataire.find({});
  let updatedDevisCount = 0;

  for (const t of translataires) {
    let modified = false;

    (t.devis || []).forEach((d) => {
      const originFlag = (d.devisOrigin || '').toString();
      const isFromNouveau = originFlag === 'nouveau-devis';

      if (isFromNouveau && d.visiblePourTranslataire !== false) {
        d.visiblePourTranslataire = false;
        modified = true;
        updatedDevisCount++;
      }
    });

    if (modified) {
      await t.save();
      console.log(`✔ Translataire ${t.nomEntreprise} mis à jour`);
    }
  }

  console.log(`✅ Nettoyage terminé. Devis mis à jour : ${updatedDevisCount}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Erreur pendant le script:', err);
  process.exit(1);
});
