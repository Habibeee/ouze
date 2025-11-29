import React, { useEffect, useState } from 'react';
import { headerStyles, headerCss } from './styles/headerStyle.jsx';
import { Menu, ArrowLeft, X, MoreVertical, LogOut } from 'lucide-react';
import { getAuth, clearAuth } from './services/authStore';
import { useI18n } from './i18n.jsx';

function Header({ showSidebarToggle = false, onToggleSidebar, hideNavbarToggler = false }) {
  const [theme, setTheme] = useState('light');
  const { lang, setLang, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Vérifier si c'est la page d'accueil pour appliquer un style différent
  const isHomePage = window.location.hash === '#' || 
                   window.location.hash === '#/' || 
                   window.location.hash === '';

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
    document.body.classList.toggle('theme-dark', saved === 'dark');
    
    const checkAuth = () => {
      const { token } = getAuth();
      setIsLoggedIn(!!token);
    };
    
    // Vérifier l'état de connexion au chargement
    checkAuth();

    // Écouter les changements d'état de connexion
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const handleLogout = () => {
    clearAuth();
    window.location.hash = '#/connexion';
    window.location.reload();
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.dataset.theme = next;
    document.body.classList.toggle('theme-dark', next === 'dark');
  };
  const applyTheme = (next) => {
    if (next === theme) return;
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.dataset.theme = next;
    document.body.classList.toggle('theme-dark', next === 'dark');
  };
  const handleBack = () => {
    try {
      if (window.history.length > 1) window.history.back();
      else window.location.hash = '#/'
    } catch {}
  };
  const navigateHash = (hash) => {
    try {
      window.location.hash = hash;
    } finally {
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    try {
      document.body.classList.toggle('mobile-menu-open', mobileMenuOpen);
    } catch {}
  }, [mobileMenuOpen]);

  return (
    <nav className={`navbar navbar-expand-lg navbar-light ${isHomePage ? 'bg-transparent position-absolute top-0 start-0 end-0' : 'bg-white border-bottom shadow-sm fixed-top'} w-100 navbar-compact`} style={{ zIndex: 1030 }}>
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
        {showSidebarToggle && (
          <button
            type="button"
            className="btn btn-link me-2 d-none d-lg-inline-flex"
            onClick={() => typeof onToggleSidebar === 'function' && onToggleSidebar()}
            aria-label={t('aria.toggle.sidebar')}
          >
            <Menu size={20} />
          </button>
        )}
        <a className="navbar-brand d-flex flex-column align-items-start gap-0" href="#/">
          <img src={'/logo1.png'} alt="TransDigiSN" style={headerStyles.logo} />
        </a>

        <div className="ms-auto d-flex align-items-center gap-2">
          {/* Nav / actions desktop */}
          <div className="d-none d-lg-flex align-items-center gap-3">
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

            <div className="d-flex align-items-center gap-2">
              {isLoggedIn ? (
                <button
                  type="button"
                  className="btn fw-semibold px-4 btn-outline-danger"
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="me-1" />
                  {t('nav.logout')}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn fw-semibold px-4 btn-success"
                  onClick={() => window.location.hash = '#/connexion'}
                >
                  {t('nav.login')}
                </button>
              )}
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
                  {theme === 'dark' ? <i className="bi bi-brightness-high"></i> : <i className="bi bi-moon-stars"></i>}
                </button>
              </div>
            </div>
          </div>
          {/* Bouton hamburger mobile à droite (caché sur desktop) */}
          {!hideNavbarToggler && (
            <button
              type="button"
              className="btn btn-outline-secondary ms-1 d-inline-flex d-lg-none mobile-menu-toggle"
              onClick={() => {
                try {
                  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                    navigator.vibrate(50);
                  }
                } catch {}
                setMobileMenuOpen(true);
              }}
              aria-label={t('aria.toggle.navigation')}
            >
              <MoreVertical size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Nav inline sous le header désactivée (menu mobile géré par la sidebar) */}
      <div className="w-100 d-none border-top bg-white">
        <div className="container-fluid px-3 py-2 d-flex justify-content-center gap-3 small">
          <button type="button" className="btn btn-link p-0" onClick={() => navigateHash('#/')}>{t('nav.home')}</button>
          <button type="button" className="btn btn-link p-0" onClick={() => navigateHash('#/apropos')}>{t('nav.about')}</button>
          <button type="button" className="btn btn-link p-0" onClick={() => navigateHash('#/contact')}>{t('nav.contact')}</button>
        </div>
      </div>

      {/* Menu mobile type sidebar */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="mobile-menu-panel">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <span className="fw-semibold" style={{ color: '#0b5f8a' }}>Menu</span>
              <button
                type="button"
                className="btn btn-link p-1 text-dark"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={t('aria.close')}
              >
                <ArrowLeft size={26} />
              </button>
            </div>
            <ul className="list-unstyled mb-1 mobile-menu-links">
              <li>
                <button
                  type="button"
                  className="btn btn-link w-100 text-start mobile-menu-link fw-semibold"
                  onClick={() => navigateHash('#/')}
                >
                  {t('nav.home')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="btn btn-link w-100 text-start mobile-menu-link fw-semibold"
                  onClick={() => navigateHash('#/apropos')}
                >
                  {t('nav.about')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="btn btn-link w-100 text-start mobile-menu-link fw-semibold"
                  onClick={() => navigateHash('#/contact')}
                >
                  {t('nav.contact')}
                </button>
              </li>
            </ul>
            <div className="d-flex flex-column gap-3 mt-3">
              <div className="d-flex align-items-center small" aria-label="Language switcher mobile">
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
                className="btn btn-link p-0 mobile-menu-theme-toggle"
                aria-label={t('aria.toggle.theme')}
              >
                {theme === 'dark' ? (
                  <i className="bi bi-brightness-high"></i>
                ) : (
                  <i className="bi bi-moon-stars"></i>
                )}
              </button>
              <button
                type="button"
                className={`btn fw-semibold px-4 py-2 mobile-menu-primary-btn ${isLoggedIn ? 'btn-outline-danger' : 'btn-success'}`}
                onClick={() => {
                  if (isLoggedIn) {
                    clearAuth();
                    window.location.hash = '#/';
                    window.location.reload();
                  } else {
                    navigateHash('#/connexion');
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
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

export default Header;
