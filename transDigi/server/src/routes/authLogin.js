import express from 'express';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../storage.js';

const router = express.Router();

const { JWT_SECRET } = process.env;

// Vérifier que JWT_SECRET est défini
if (!JWT_SECRET) {
  console.error('❌ ERREUR: JWT_SECRET n\'est pas défini dans les variables d\'environnement');
}

// POST /auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Validation
    if (!email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe obligatoires'
      });
    }

    // Chercher l'utilisateur
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe (en production, utiliser bcrypt!)
    if (user.motDePasse !== motDePasse) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier JWT_SECRET
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET manquant lors de la création du token');
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur: configuration manquante'
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        uid: user.id, 
        role: user.role, 
        userType: user.userType 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        role: user.role,
        prenom: user.prenom,
        nom: user.nom,
        nomEntreprise: user.nomEntreprise
      }
    });
  } catch (e) {
    console.error('Erreur lors de la connexion:', e);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
});

export default router;
