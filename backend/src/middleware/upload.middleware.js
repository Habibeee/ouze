// src/middleware/upload.middleware.js
// ============================================
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration Multer pour stockage en mémoire
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accepter uniquement les images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

// Taille max par fichier configurable via l'env `MAX_UPLOAD_FILE_SIZE` (octets)
const DEFAULT_MAX_UPLOAD = 50 * 1024 * 1024; // 50 MB
const MAX_UPLOAD_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_FILE_SIZE, 10) || DEFAULT_MAX_UPLOAD;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE
  }
});

// Multer générique (tous types de fichiers)
const uploadAny = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE // limite par fichier
  }
});

// Upload vers Cloudinary
exports.uploadToCloudinary = async (file, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `transdigisn/${folder}`,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
};

// Upload tout type de fichier (pdf, docx, images, etc.)
exports.uploadFileToCloudinary = async (file, folder) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error('Fichier invalide ou manquant'));
    }
    // Vérifier que Cloudinary est configuré
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[CLOUDINARY] Configuration manquante:', {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
      });
      return reject(new Error('Cloudinary non configuré (clés manquantes)'));
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `transdigisn/${folder}`,
        resource_type: 'auto',
        max_file_size: 10 * 1024 * 1024, // 10 MB
        timeout: 60000 // 60 secondes de timeout
      },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY] Erreur upload:', {
            message: error.message || 'Pas de message',
            code: error.http_code || error.code,
            status: error.status,
            fullError: error.toString()
          });
          reject(new Error(`Cloudinary: ${error.message || error.toString() || 'Erreur inconnue'}`));
        } else if (!result || !result.secure_url) {
          console.error('[CLOUDINARY] Réponse invalide:', result);
          reject(new Error('Cloudinary a retourné une réponse invalide'));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.on('error', (err) => {
      console.error('[CLOUDINARY] Stream error:', {
        message: err.message,
        code: err.code,
        fullError: err.toString()
      });
      reject(new Error(`Upload stream error: ${err.message || err.toString()}`));
    });
    uploadStream.end(file.buffer);
  });
};

exports.upload = upload;
exports.uploadAny = uploadAny;