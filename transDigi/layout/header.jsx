import React, { useEffect, useState } from 'react';
import { headerStyles, headerCss } from '../styles/headerStyle.jsx';
import { ArrowLeft, LogOut, Menu } from 'lucide-react';
import { getAuth, clearAuth } from '../services/authStore';
import { useI18n } from '../src/i18n.jsx';

function Header() {
  const [theme, setTheme] = useState('light');
  const { lang, setLang, t } = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm fixed-top w-100 navbar-compact" style={{ marginBottom: '0' }}>
        <style>{headerCss}</style>
        <div className="container-fluid px-3 px-md-4">
          <a className="navbar-brand d-flex align-items-center" href="#/">
            <img src={'/logo1.png'} alt="TransDigiSN" style={headerStyles.logo} />
          </a>

          {/* Bouton menu mobile */}
          <button 
            className="mobile-menu-toggle d-lg-none" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>

          {/* Menu desktop (visible uniquement sur grand écran) */}
          <div className="d-none d-lg-flex align-items-center ms-auto">
            <ul className="navbar-nav me-4 me-lg-5 me-xl-5 mb-0 nav-main gap-3">
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

            <div className="d-flex align-items-center gap-3">
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
              
              <div className="d-flex align-items-center" aria-label="Language switcher">
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
              
              <button
                type="button"
                onClick={toggleTheme}
                className="btn fw-semibold px-3"
                style={{
                  backgroundColor: theme === 'dark' ? '#f8f9fa' : '#212529',
                  color: theme === 'dark' ? '#212529' : '#f8f9fa',
                  border: 'none'
                }}
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
      </nav>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="mobile-menu-overlay" 
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1039
            }}
          />
          <div 
            className="mobile-menu-panel"
            style={{
              position: 'fixed',
              top: '64px',
              right: 0,
              bottom: 0,
              width: '280px',
              backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
              boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
              zIndex: 1040,
              transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s ease-in-out',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <a 
              className="mobile-menu-link" 
              href="#/" 
              style={{
                color: theme === 'dark' ? '#ffffff' : '#0b5f8a',
                textDecoration: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '0.375rem',
                fontWeight: '600',
                display: 'block',
                transition: 'all 0.2s'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.home')}
            </a>
            <a 
              className="mobile-menu-link" 
              href="#/apropos" 
              style={{
                color: theme === 'dark' ? '#ffffff' : '#0b5f8a',
                textDecoration: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '0.375rem',
                fontWeight: '600',
                display: 'block',
                transition: 'all 0.2s'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.about')}
            </a>
            <a 
              className="mobile-menu-link" 
              href="#/contact" 
              style={{
                color: theme === 'dark' ? '#ffffff' : '#0b5f8a',
                textDecoration: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '0.375rem',
                fontWeight: '600',
                display: 'block',
                transition: 'all 0.2s'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.contact')}
            </a>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${theme === 'dark' ? '#333' : '#eee'}` }}>
              <button
                type="button"
                className={`btn w-100 mb-3 ${isLoggedIn ? 'btn-outline-danger' : 'btn-success'}`}
                onClick={() => {
                  if (isLoggedIn) {
                    clearAuth();
                    window.location.hash = '#/connexion';
                    window.location.reload();
                  } else {
                    window.location.hash = '#/connexion';
                  }
                  setIsMobileMenuOpen(false);
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

              <div className="d-flex align-items-center justify-content-between mb-3">
                <div style={{ color: theme === 'dark' ? '#ffffff' : '#0b5f8a', fontWeight: '600' }}>
                  {t('language')}:
                </div>
                <div className="d-flex align-items-center">
                  <button 
                    onClick={() => {
                      setLang('fr');
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: lang === 'fr' ? (theme === 'dark' ? '#ffffff' : '#0b5f8a') : (theme === 'dark' ? '#9ca3af' : '#6c757d'),
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: lang === 'fr' ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(11, 95, 138, 0.1)') : 'transparent'
                    }}
                  >
                    FR
                  </button>
                  <span style={{ margin: '0 4px', color: theme === 'dark' ? '#9ca3af' : '#6c757d' }}>/</span>
                  <button 
                    onClick={() => {
                      setLang('en');
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: lang === 'en' ? (theme === 'dark' ? '#ffffff' : '#0b5f8a') : (theme === 'dark' ? '#9ca3af' : '#6c757d'),
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: lang === 'en' ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(11, 95, 138, 0.1)') : 'transparent'
                    }}
                  >
                    EN
                  </button>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between">
                <div style={{ color: theme === 'dark' ? '#ffffff' : '#0b5f8a', fontWeight: '600' }}>
                  {t('theme')}:
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                  className="btn"
                  style={{
                    backgroundColor: theme === 'dark' ? '#f8f9fa' : '#212529',
                    color: theme === 'dark' ? '#212529' : '#f8f9fa',
                    border: 'none',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {theme === 'dark' ? (
                    <>
                      <i className="bi bi-brightness-high"></i>
                      <span>Clair</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-moon-stars"></i>
                      <span>Sombre</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Header;
