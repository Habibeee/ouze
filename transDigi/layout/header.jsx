import React, { useEffect, useState } from 'react';
import { headerStyles, headerCss } from '../styles/headerStyle.jsx';
import { Menu, ArrowLeft } from 'lucide-react';
import { useI18n } from '../src/i18n.jsx';

function Header({ showSidebarToggle = false, onToggleSidebar, hideNavbarToggler = false }) {
  const [theme, setTheme] = useState('light');
  const { lang, setLang, t } = useI18n();

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
            className="btn btn-link me-2"
            onClick={() => typeof onToggleSidebar === 'function' && onToggleSidebar()}
            aria-label={t('aria.toggle.sidebar')}
          >
            <Menu size={20} />
          </button>
        )}
        <a className="navbar-brand d-flex flex-column align-items-start gap-0" href="#/">
          <img src={'/logo1.png'} alt="TransDigiSN" style={headerStyles.logo} />
              {/* <strong style={{ color: '#28A745', lineHeight: 1 }}>TransdigiSN</strong> */}

        </a>
        {!hideNavbarToggler && (
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
        )}

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav ms-auto me-4 me-lg-5 me-xl-5 mb-2 mb-lg-0 nav-main gap-3">
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
            <div className="btn-group ms-2" role="group" aria-label="Language switcher">
              <button
                type="button"
                className={`btn btn-outline-secondary px-3 ${lang === 'fr' ? 'active' : ''}`}
                onClick={() => setLang('fr')}
              >
                FR
              </button>
              <button
                type="button"
                className={`btn btn-outline-secondary px-3 ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
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
      </div>
    </nav>
  );
}

export default Header;
