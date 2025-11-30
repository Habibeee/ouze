import React from 'react';
import { Menu, ArrowLeft } from 'lucide-react';

function Header({ showSidebarToggle = false, onToggleSidebar, hideNavbarToggler = false }) {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = '/';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm fixed-top w-100 navbar-compact" style={{ zIndex: 1030 }}>
      <div className="container-fluid px-1 py-0">
        <button
          type="button"
          className="btn btn-link me-1 d-lg-none"
          onClick={handleBack}
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </button>
        
        {showSidebarToggle && (
          <button
            type="button"
            className="btn btn-link me-2 d-none d-lg-inline-flex"
            onClick={onToggleSidebar}
            aria-label="Basculer la barre latérale"
          >
            <Menu size={20} />
          </button>
        )}

        <a className="navbar-brand d-flex flex-column align-items-start gap-0" href="#/">
          <span className="text-primary fw-bold">TransDigiSN</span>
        </a>

        <div className="ms-auto d-flex align-items-center gap-2">
          <div className="d-none d-lg-flex align-items-center gap-3">
            <ul className="navbar-nav me-4 me-lg-5 me-xl-5 mb-0 nav-main gap-3">
              <li className="nav-item">
                <a className="nav-link fw-semibold" href="#/" style={{ color: '#0b5f8a' }}>Accueil</a>
              </li>
              <li className="nav-item">
                <a className="nav-link fw-semibold" href="#/apropos" style={{ color: '#0b5f8a' }}>À propos</a>
              </li>
              <li className="nav-item">
                <a className="nav-link fw-semibold" href="#/contact" style={{ color: '#0b5f8a' }}>Contact</a>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2">
              <a href="#/connexion" className="btn fw-semibold px-4 btn-success">
                Connexion
              </a>
            </div>
          </div>

          {!hideNavbarToggler && (
            <button
              type="button"
              className="btn btn-outline-secondary ms-1 d-inline-flex d-lg-none"
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;
