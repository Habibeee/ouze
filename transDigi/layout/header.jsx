import React, { useEffect, useState } from 'react';
import { headerStyles, headerCss } from '../styles/headerStyle.jsx';
import { Menu, ArrowLeft, X } from 'lucide-react';
import { useI18n } from '../src/i18n.jsx';

function Header({ showSidebarToggle = false, onToggleSidebar, hideNavbarToggler = false }) {
  const [theme, setTheme] = useState('light');
  const { lang, setLang, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
    document.body.classList.toggle('theme-dark', saved === 'dark');
  }, []);

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
              <a className="btn fw-semibold px-4" href="#/connexion" style={{ backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '6px' }}>{t('nav.login')}</a>
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
          {/* Bouton hamburger mobile à droite */}
          {!hideNavbarToggler && (
            <button
              type="button"
              className="btn btn-outline-secondary ms-1 d-lg-none mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t('aria.toggle.navigation')}
            >
              <Menu size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Menu mobile type sidebar */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="mobile-menu-panel">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <a href="#/" onClick={(e) => { e.preventDefault(); navigateHash('#/'); }} className="d-flex align-items-center gap-2 text-decoration-none">
                <img src={'/logo1.png'} alt="TransDigiSN" style={{ height: 48, width: 'auto' }} />
              </a>
              <button
                type="button"
                className="btn btn-link p-1 text-dark"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={t('aria.close')}
              >
                <X size={26} />
              </button>
            </div>
            <ul className="list-unstyled mb-4 mobile-menu-links">
              <li>
                <button type="button" className="btn btn-link w-100 text-start mobile-menu-link" onClick={() => navigateHash('#/')}>{t('nav.home')}</button>
              </li>
              <li>
                <button type="button" className="btn btn-link w-100 text-start mobile-menu-link" onClick={() => navigateHash('#/apropos')}>{t('nav.about')}</button>
              </li>
              <li>
                <button type="button" className="btn btn-link w-100 text-start mobile-menu-link" onClick={() => navigateHash('#/contact')}>{t('nav.contact')}</button>
              </li>
            </ul>
            <div className="d-flex flex-column gap-3 mt-auto">
              <button
                type="button"
                className="btn btn-success w-100 fw-semibold"
                onClick={() => navigateHash('#/connexion')}
              >
                {t('nav.login')}
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

export default Header;
