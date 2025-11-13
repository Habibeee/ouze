import express from 'express';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser, userExists } from '../storage.js';

const router = express.Router();

const { JWT_SECRET } = process.env;

// Vérifier que JWT_SECRET est défini
if (!JWT_SECRET) {
  console.error('❌ ERREUR: JWT_SECRET n\'est pas défini dans les variables d\'environnement');
}

// POST /auth/register/client
router.post('/auth/register/client', async (req, res) => {
  try {
    const { prenom, nom, email, telephone, motDePasse } = req.body;

    // Validation
    if (!prenom || !nom || !email || !telephone || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires'
      });
    }

    // Vérifier si l'email existe déjà
    if (userExists(email)) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer l'utilisateur
    const userId = `client:${Date.now()}`;
    const user = createUser(email, {
      id: userId,
      prenom,
      nom,
      telephone,
      motDePasse, // En production, hasher ceci!
      userType: 'client',
      role: 'user',
      createdAt: new Date()
    });

    // Créer le token JWT
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET manquant lors de la création du token');
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur: configuration manquante'
      });
    }
    
    const token = jwt.sign(
      { uid: userId, role: 'user', userType: 'client' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie. Veuillez vérifier votre email.',
      token,
      user: {
        id: userId,
        prenom,
        nom,
        email,
        userType: 'client'
      }
    });
  } catch (e) {
    console.error('Erreur lors de l\'inscription client:', e);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

// POST /auth/register/translataire
router.post('/auth/register/translataire', async (req, res) => {
  try {
    const {
      nomEntreprise,
      ninea,
      telephoneEntreprise,
      email,
      motDePasse,
      secteurActivite,
      typeServices
    } = req.body;

    // Validation
    if (!nomEntreprise || !ninea || !telephoneEntreprise || !email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Vérifier si l'email existe déjà
    if (userExists(email)) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer l'utilisateur
    const userId = `transitaire:${Date.now()}`;
    const user = createUser(email, {
      id: userId,
      nomEntreprise,
      ninea,
      telephoneEntreprise,
      motDePasse, // En production, hasher ceci!
      secteurActivite,
      typeServices: typeServices || [],
      userType: 'transitaire',
      role: 'transitaire',
      status: 'pending_approval', // L'admin doit approuver
      createdAt: new Date()
    });

    // Créer le token JWT
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET manquant lors de la création du token');
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur: configuration manquante'
      });
    }
    
    const token = jwt.sign(
      { uid: userId, role: 'transitaire', userType: 'transitaire' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie. En attente d\'approbation.',
      token,
      user: {
        id: userId,
        nomEntreprise,
        email,
        userType: 'transitaire',
        status: 'pending_approval'
      }
    });
  } catch (e) {
    console.error('Erreur lors de l\'inscription transitaire:', e);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

export default router;
