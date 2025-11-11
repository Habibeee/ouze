import express from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const router = express.Router();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI, // ex: http://localhost:4000/auth/google/callback
  FRONT_URL,           // ex: http://localhost:5173
  JWT_SECRET
} = process.env;

function requiredEnv(name) {
  if (!process.env[name]) console.warn(`[OAuth] Missing env ${name}`);
}
requiredEnv('GOOGLE_CLIENT_ID');
requiredEnv('GOOGLE_CLIENT_SECRET');
requiredEnv('GOOGLE_REDIRECT_URI');
requiredEnv('FRONT_URL');
requiredEnv('JWT_SECRET');

// GET /auth/google -> redirect to Google OAuth consent
router.get('/auth/google', (req, res) => {
  try {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: 'csrf_optional'
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (e) {
    console.error('auth/google error', e);
    return res.status(500).json({ success: false, message: 'Erreur redirection Google' });
  }
});

// GET /auth/google/callback -> exchange code, create app token, redirect to front
router.get('/auth/google/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ success: false, message: 'Code manquant' });

    // Exchange code -> tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Token exchange failed:', tokens);
      throw new Error(tokens.error || 'Exchange token error');
    }

    // Get user profile
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = await infoRes.json();
    const email = (profile?.email || '').toLowerCase();
    const sub = profile?.sub;

    // TODO: replace with real user lookup/creation in your DB
    const user = await fakeFindOrCreateUser(email, sub, profile);
    const role = user.role || 'user';
    const userType = user.userType || role;

    // Issue app JWT
    const appToken = jwt.sign(
      { uid: user.id, role, userType },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect back to the front callback
    const cb = new URL(FRONT_URL);
    cb.hash = `/oauth-callback?token=${encodeURIComponent(appToken)}&role=${encodeURIComponent(role)}&userType=${encodeURIComponent(userType)}`;
    return res.redirect(cb.toString());
  } catch (e) {
    console.error('Google OAuth callback error:', e);
    return res.redirect(`${FRONT_URL}#/connexion?err=google_oauth_failed`);
  }
});

// Minimal in-memory user mock
async function fakeFindOrCreateUser(email, sub, profile) {
  // In a real app, query your DB here.
  // For now, return a dummy user id and default role/userType.
  return {
    id: `google:${sub || email}`,
    email,
    role: 'user',
    userType: 'user',
    name: profile?.name || ''
  };
}

export default router;
