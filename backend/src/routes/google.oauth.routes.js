// OAuth Google (Option A - redirection)
const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI, // ex: http://localhost:5000/auth/google/callback
  FRONTEND_URL,        // ex: http://localhost:5173
  JWT_SECRET
} = process.env;

function warnMissing(name){ if (!process.env[name]) console.warn(`[OAuth] Missing env ${name}`); }
['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REDIRECT_URI','FRONTEND_URL','JWT_SECRET'].forEach(warnMissing);

const oauth2Client = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: GOOGLE_REDIRECT_URI,
});

// GET /auth/google -> redirige vers Google
router.get('/auth/google', (req, res) => {
  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['openid','email','profile'],
    });
    return res.redirect(url);
  } catch (e) {
    console.error('auth/google error', e);
    return res.status(500).json({ success:false, message:'Erreur redirection Google' });
  }
});

// GET /auth/google/callback -> échange code, émet JWT app, redirige vers front
router.get('/auth/google/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ success:false, message:'Code manquant' });

    // Échange code -> tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Récup profil
    const { data: profile } = await oauth2Client.request({ url: 'https://www.googleapis.com/oauth2/v3/userinfo' });
    const email = (profile?.email || '').toLowerCase();
    const sub = profile?.sub;

    // TODO: remplace par une vraie recherche/creation en base
    const user = await fakeFindOrCreateUser(email, sub, profile);
    const role = user.role || 'user';
    const userType = user.userType || role;

    // Génère un JWT applicatif (même secret que le reste de l'app)
    const token = jwt.sign({ uid: user.id, role, userType }, JWT_SECRET, { expiresIn: '7d' });

    const front = FRONTEND_URL || 'http://localhost:5173';
    const url = new URL(front);
    url.hash = `/oauth-callback?token=${encodeURIComponent(token)}&role=${encodeURIComponent(role)}&userType=${encodeURIComponent(userType)}`;
    return res.redirect(url.toString());
  } catch (e) {
    console.error('Google OAuth callback error:', e);
    const front = FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${front}#/connexion?err=google_oauth_failed`);
  }
});

async function fakeFindOrCreateUser(email, sub, profile){
  // Intègre ici ta DB (Mongo/Mongoose) pour findOne({ email }) puis update/insert et retourner role/userType
  return {
    id: `google:${sub || email}`,
    email,
    role: 'user',
    userType: 'user',
    name: profile?.name || ''
  };
}

module.exports = router;
