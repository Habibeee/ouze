import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(__dirname, '../node_modules/leaflet/dist/images');
const destDir = path.join(__dirname, '../public/leaflet-images');

// Créer le répertoire de destination s'il n'existe pas
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Liste des fichiers à copier
const filesToCopy = [
  'marker-icon.png',
  'marker-icon-2x.png',
  'marker-shadow.png'
];

// Copier les fichiers
filesToCopy.forEach(file => {
  const sourceFile = path.join(sourceDir, file);
  const destFile = path.join(destDir, file);
  
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, destFile);
    console.log(`Copié: ${sourceFile} -> ${destFile}`);
  } else {
    console.warn(`Fichier source introuvable: ${sourceFile}`);
  }
});

console.log('Copie des ressources Leaflet terminée !');
