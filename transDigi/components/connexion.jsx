import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../src/toast.jsx';
import { connexionStyles, connexionCss } from '../styles/connexionStyle.jsx';
import { login as apiLogin } from '../services/apiClient.js';
import { redirectByRole } from '../services/authStore.js';
import { post } from '../services/apiClient.js';
import { putForm } from '../services/apiClient.js';
import { useI18n } from '../src/i18n.jsx';

const GOOGLE_CLIENT_ID = (import.meta?.env?.VITE_GOOGLE_CLIENT_ID || '').trim();

function Connexion() {
  const { success, error: toastError, info } = useToast();
  const { t } = useI18n();
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [gLoading, setGLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const gsiDivRef = useRef(null);
  const [gsiInfo, setGsiInfo] = useState({ cid: !!GOOGLE_CLIENT_ID, ready: false, children: 0 });
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const clientId = GOOGLE_CLIENT_ID;
    if (!clientId) return; // pas de Google ID configuré
    // injecter le script si absent
    const ensureScript = () => {
      try { console.info('[GSI] ensureScript: start, clientId?', !!clientId); } catch {}
      if (!document.getElementById('google-gsi')) {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        s.id = 'google-gsi';
        s.onload = () => { try { console.info('[GSI] script onload'); } catch {}; initGsi(clientId); };
        document.head.appendChild(s);
      } else {
        try { console.info('[GSI] script already present'); } catch {}
        initGsi(clientId);
      }
    };

    function initGsi(cid, attempt = 0) {
      try {
        const ready = !!(window.google && window.google.accounts && window.google.accounts.id);
        const host = gsiDivRef.current || document.getElementById('gsi-btn');
        try { console.info('[GSI] init attempt', attempt, 'ready?', ready, 'host?', !!host); } catch {}
        try { window.__GSI_READY__ = ready; window.__CID__ = cid; } catch {}
        try { setGsiInfo((prev) => ({ ...prev, ready })); } catch {}
        try {
          window.handleGsiCredential = async (resp) => {
            if (!resp?.credential) return;
            try {
              setGLoading(true);
              setAuthError('');
              const data = await post('/auth/google', { idToken: resp.credential, userType: 'user' });
              const token = (data?.token || '').trim();
              if (!token) throw new Error(data?.message || 'Connexion Google échouée');
              localStorage.setItem('token', token);
              localStorage.setItem('role', (data?.role || data?.user?.role || 'user'));
              localStorage.setItem('userType', (data?.userType || 'user'));
              redirectByRole();
            } catch (err) {
              setAuthError(err?.message || 'Connexion Google échouée');
            } finally {
              setGLoading(false);
            }
          };
        } catch {}
        if (!ready || !host) {
          if (attempt < 10) {
            setTimeout(() => initGsi(cid, attempt + 1), 300);
          }
          return;
        }
        try { console.info('[GSI] initialize'); } catch {}
        window.google.accounts.id.initialize({
          client_id: cid,
          callback: async (resp) => {
            if (!resp?.credential) return;
            try {
              setGLoading(true);
              setAuthError('');
              const data = await post('/auth/google', { idToken: resp.credential, userType: 'user' });
              const token = (data?.token || '').trim();
              if (!token) throw new Error(data?.message || 'Connexion Google échouée');
              try { console.info('[GSI] callback: token reçu, longueur', token.length); } catch {}
              localStorage.setItem('token', token);
              localStorage.setItem('role', (data?.role || data?.user?.role || 'user'));
              localStorage.setItem('userType', (data?.userType || 'user'));
              redirectByRole();
            } catch (err) {
              try { console.error('[GSI] callback error', err); } catch {}
              setAuthError(err?.message || 'Connexion Google échouée');
            } finally {
              setGLoading(false);
            }
          },
          cancel_on_tap_outside: true,
        });
        try { console.info('[GSI] renderButton'); } catch {}
        window.google.accounts.id.renderButton(host, { theme: 'outline', size: 'large', type: 'standard', text: 'continue_with' });
        // Vérifier après rendu si le bouton est bien injecté
        setTimeout(() => {
          try {
            const h = gsiDivRef.current || document.getElementById('gsi-btn');
            const children = h ? h.children.length : 0;
            console.info('[GSI] post-render: host children =', children);
            setGsiInfo((prev) => ({ ...prev, children }));
            if (!children && attempt < 10) {
              console.warn('[GSI] bouton non rendu, retry...');
              initGsi(cid, attempt + 1);
            }
          } catch {}
        }, 400);
      } catch {}
    }
    ensureScript();
  }, []);

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => /^\+?\d[\d\s.-]{7,}$/.test(v);
  const validateEmailOrPhone = (v) => {
    if (!v.trim()) return t('contact.validation.email.required');
    // Assouplir: accepter tout identifiant non vide; le backend validera réellement
    return '';
  };
  const validatePassword = (v) => {
    if (!v) return t('contact.validation.message.required');
    if (v.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (cooldown > 0) return;
    const emailErr = validateEmailOrPhone(email);
    const pwdErr = validatePassword(password);
    setErrors({ email: emailErr, password: pwdErr });
    if (emailErr || pwdErr) return;
    try {
      setLoading(true);
      const ident = (email || '').trim();
      // Laisser le backend auto-détecter le type (admin -> user -> translataire)
      const payload = isEmail(ident)
        ? { email: ident, motDePasse: password }
        : { telephone: ident, motDePasse: password };
      const data = await apiLogin(payload);
      const token = (data?.token || data?.accessToken || '').trim();
      if (!token) throw new Error(data?.message || t('login.errors.invalid_creds'));
      localStorage.setItem('token', token);
      const respUserType = (data?.userType || '').toLowerCase();
      const apiRole = (data?.user?.role || data?.role || '').toLowerCase();
      const finalType = (apiRole || respUserType || '').toLowerCase();
      try { if (finalType) localStorage.setItem('userType', finalType); } catch {}
      try { if (apiRole) localStorage.setItem('role', apiRole); } catch {}
      // IDs pour scoper les requêtes
      try {
        const userId = (data?.user?._id || data?.user?.id || data?._id || data?.id || '').toString();
        if (userId) localStorage.setItem('userId', userId);
        const translataireId = (data?.translataire?._id || data?.translataire?.id || data?.profile?._id || '').toString();
        if (translataireId) localStorage.setItem('translataireId', translataireId);
      } catch {}
      // Auto-upload d'une photo en attente (inscription) si présente
      try {
        const pendingKey = finalType.startsWith('trans') ? 'pendingPhoto:translataire' : (finalType.includes('admin') ? '' : 'pendingPhoto:user');
        if (pendingKey) {
          const dataUrl = localStorage.getItem(pendingKey);
          if (dataUrl && dataUrl.startsWith('data:')) {
            const toBlob = async (du) => {
              const res = await fetch(du);
              return await res.blob();
            };
            const blob = await toBlob(dataUrl);
            const fd = new FormData();
            fd.append('photo', blob, 'photo.png');
            const ep = finalType.startsWith('trans') ? '/translataires/photo' : '/users/photo';
            const up = await putForm(ep, fd);
            const url = (up?.url || up?.photoUrl || up?.photo || '').toString();
            if (finalType.startsWith('trans')) {
              localStorage.setItem('transLogoUrl', url || dataUrl);
            } else if (!finalType.includes('admin')) {
              localStorage.setItem('avatarUrl', url || dataUrl);
            }
            localStorage.removeItem(pendingKey);
          }
        }
      } catch {}
      // Définir l'indicateur de nouvelle session pour afficher le message de bienvenue
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('isNewSession', 'true');
      }
      redirectByRole();
    } catch (err) {
      const raw = (err?.message || '').toLowerCase();
      let friendly = t('login.errors.auth_failed');
      if (err?.status === 429) {
        friendly = t('login.errors.too_many_attempts');
        // démarrer un cooldown de 10s
        try {
          const start = 10;
          setCooldown(start);
          const id = setInterval(() => {
            setCooldown((c) => {
              if (c <= 1) { clearInterval(id); return 0; }
              return c - 1;
            });
          }, 1000);
        } catch {}
      }
      if (raw.includes('bloqué')) friendly = t('login.errors.blocked');
      else if (raw.includes('archivé')) friendly = t('login.errors.archived');
      else if (raw.includes("en attente d'approbation") || raw.includes('attente d’approbation')) friendly = t('login.errors.pending_approval');
      else if (raw.includes('invalides') || raw.includes('invalide')) friendly = t('login.errors.invalid_creds');
      else if (raw.includes('non vérifié') || raw.includes('verifier')) friendly = t('login.errors.email_unverified');
      setAuthError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
      setResending(true);
      await post('/auth/resend-verification', { email: email.trim().toLowerCase() });
      success(t('login.resend.success'));
    } catch (e) {
      toastError(e?.message || t('login.resend.error'));
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <style>{connexionCss}</style>
      <section className="login-section" style={connexionStyles.section}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-sm-10 col-md-8 col-lg-6">
              <div className="login-card">
                <div className="header">
                  <h1>{t('login.header.title')}</h1>
                  <p>{t('login.header.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="email">{t('login.fields.identifier.label')}</label>
                    <div className="input-wrapper">
                      <span className="icon">
                        <i className="fa fa-envelope"></i>
                      </span>
                      <input
                        type="text"
                        id="email"
                        placeholder={t('login.fields.identifier.placeholder')}
                        value={email}
                        autoComplete="username"
                        onChange={(e) => {
                          const v = e.target.value;
                          setEmail(v);
                          setErrors((er) => ({ ...er, email: validateEmailOrPhone(v) }));
                        }}
                        onBlur={() => setErrors((er) => ({ ...er, email: validateEmailOrPhone(email) }))}
                        aria-invalid={!!errors.email}
                        aria-describedby="emailHelp"
                      />
                    </div>
                    {errors.email && <div id="emailHelp" className="text-danger small mt-1">{errors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">{t('login.fields.password.label')}</label>
                    <div className="input-wrapper">
                      <span className="icon">
                        <i className="fa fa-lock"></i>
                      </span>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        id="password"
                        placeholder={t('login.fields.password.placeholder')}
                        value={password}
                        autoComplete="current-password"
                        onChange={(e) => {
                          const v = e.target.value;
                          setPassword(v);
                          setErrors((er) => ({ ...er, password: validatePassword(v) }));
                        }}
                        onBlur={() => setErrors((er) => ({ ...er, password: validatePassword(password) }))}
                        aria-invalid={!!errors.password}
                        aria-describedby="pwdHelp pwdCriteria"
                      />
                      <span className="toggle-password" onClick={() => setShowPwd(s => !s)} role="button" aria-label={showPwd ? t('login.password.aria.hide') : t('login.password.aria.show')}>
                        <i className="fa fa-eye"></i>
                      </span>
                    </div>
                    {errors.password && <div id="pwdHelp" className="text-danger small mt-1">{errors.password}</div>}
                    <div id="pwdCriteria" className="password-hint">{t('login.password.hint')}</div>
                  </div>

                  <div className="form-options">
                    <label className="remember-me">
                      <input type="checkbox" />
                      <span>{t('login.remember')}</span>
                    </label>
                    <a href="#/mot-de-passe-oublie" className="forgot-password">{t('login.forgot')}</a>
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading || cooldown>0 || !email || !password}>
                    {cooldown>0 ? `${t('login.retry_in')} ${cooldown}s` : t('login.submit')}
                  </button>

                  {authError && <div className="text-danger small">{authError}</div>}
                  {authError && /non vérifié|verifier/i.test(authError) && (
                    <div className="mt-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm" disabled={resending || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)} onClick={resendVerification}>
                        {resending ? t('login.resend.sending') : t('login.resend.btn')}
                      </button>
                    </div>
                  )}

                  <div className="signup-link">
                    {t('login.signup.prompt')} <a href="#/signup">{t('login.signup.link')}</a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Connexion;
