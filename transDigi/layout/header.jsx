import React, { useEffect, useState } from 'react';
import { headerStyles, headerCss } from '../styles/headerStyle.jsx';
import { ArrowLeft, LogOut } from 'lucide-react';
import { getAuth, clearAuth } from '../services/authStore';
import { useI18n } from '../src/i18n.jsx';

function Header() {
  const [theme, setTheme] = useState('light');
  const { lang, setLang, t } = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fonction pour vérifier l'état de connexion
  const checkAuth = () => {
    const { token } = getAuth();
    const isAuthenticated = !!token;
    setIsLoggedIn(isAuthenticated);
    return isAuthenticated;
  };

  useEffect(() => {
    // Gestion du thème
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
    document.body.classList.toggle('theme-dark', saved === 'dark');
    
    // Vérification initiale de l'authentification
    checkAuth();
    
    // Vérifier périodiquement l'état de connexion
    const authCheckInterval = setInterval(checkAuth, 1000);
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(authCheckInterval);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.dataset.theme = next;
    document.body.classList.toggle('theme-dark', next === 'dark');
  };
  
  const handleBack = () => {
    try {
      if (window.history.length > 1) window.history.back();
      else window.location.hash = '/#/'
    } catch {}
  };
  
  const navigateHash = (hash) => {
    window.location.hash = hash;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm fixed-top w-100 navbar-compact">
      <style>{headerCss}</style>
      <div className="container-fluid px-1 py-0">
        <button
          type="button"
          className="btn btn-link me-1 d-lg-none"
          onClick={handleBack}
          aria-label={t('aria.back')}
        >
          <ArrowLeft size={20} />
        </button>

        <a className="navbar-brand d-flex flex-column align-items-start gap-0" href="#/">
          <img src={'/logo1.png'} alt="TransDigiSN" style={headerStyles.logo} />
        </a>

        <div className="ms-auto d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-3">
            <ul className="navbar-nav me-4 me-lg-5 me-xl-5 mb-0 nav-main gap-3 d-none d-lg-flex">
              <li className="nav-item">
                <a className="nav-link fw-semibold" href="#/" style={{ color: '#0b5f8a' }}>{t('nav.home')}</a>
              </li>
              <li className="nav-item">
                <a className="nav-link fw-semibold" href="#/apropos" style={{ color: '#0b5f8a' }}>{t('nav.about')}</a>
              </li>
              <li className="nav-item">
                <a className="nav-link fw-semibold" href="#/contact" style={{ color: '#0b5f8a' }}>{t('nav.contact')}</a>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className={`btn fw-semibold px-4 ${isLoggedIn ? 'btn-outline-danger' : 'btn-success'}`}
                onClick={() => {
                  if (isLoggedIn) {
                    clearAuth();
                    window.location.hash = '#/connexion';
                    window.location.reload();
                  } else {
                    window.location.hash = '#/connexion';
                  }
                }}
              >
                {isLoggedIn ? (
                  <>
                    <LogOut size={16} className="me-1" />
                    {t('nav.logout')}
                  </>
                ) : (
                  t('nav.login')
                )}
              </button>
              
              <div className="ms-2 d-flex align-items-center" aria-label="Language switcher">
                <span
                  onClick={() => setLang('fr')}
                  style={{
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: lang === 'fr' ? '#0b5f8a' : '#6c757d',
                    marginRight: '4px'
                  }}
                >
                  FR
                </span>
                <span style={{ margin: '0 2px', color: '#6c757d' }}>/</span>
                <span
                  onClick={() => setLang('en')}
                  style={{
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: lang === 'en' ? '#0b5f8a' : '#6c757d',
                    marginLeft: '4px'
                  }}
                >
                  EN
                </span>
              </div>
              
              <div className="d-flex align-items-center ms-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`btn fw-semibold px-3 ${theme === 'dark' ? 'btn-light' : 'btn-dark'}`}
                  aria-label={t('aria.toggle.theme')}
                >
                  {theme === 'dark' ? (
                    <i className="bi bi-brightness-high"></i>
                  ) : (
                    <i className="bi bi-moon-stars"></i>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;
