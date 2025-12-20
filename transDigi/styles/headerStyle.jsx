export const headerStyles = {
  logo: { height: 84, width: 'auto' },
};

export const headerCss = `
  .navbar-compact { min-height: 64px; }
  @media (max-width: 991.98px) {
    .navbar-compact .nav-main { gap: 0.5rem !important; }
    /* Center nav content only when the collapse is open (allow toggle close to work) */
    .navbar-compact .navbar-collapse.show,
    .navbar-compact .navbar-collapse.collapsing {
      display: flex !important;
      flex-direction: column;
      align-items: center;
    }
    .navbar-compact .navbar-collapse.show .nav-main,
    .navbar-compact .navbar-collapse.collapsing .nav-main {
      width: 100%;
      justify-content: center !important;
      align-items: center !important;
    }
    .navbar-compact .navbar-collapse.show .nav-main .nav-link,
    .navbar-compact .navbar-collapse.collapsing .nav-main .nav-link {
      text-align: center;
    }
    /* Center the action buttons (Se connecter + theme) when open */
    .navbar-compact .navbar-collapse.show > .d-flex,
    .navbar-compact .navbar-collapse.collapsing > .d-flex {
      width: 100%;
      justify-content: center !important;
    }

    /* Dark theme: make hamburger icon (navbar-toggler) light on mobile */
    [data-theme="dark"] .navbar-compact .navbar-toggler { border-color: rgba(255,255,255,0.55) !important; }
    [data-theme="dark"] .navbar-compact .navbar-toggler .navbar-toggler-icon {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(255, 255, 255, 0.85)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e") !important;
    }
    /* Also lighten the Menu btn-link icon (lucide) on mobile when dark */
    [data-theme="dark"] .navbar-compact .btn.btn-link { color: #ffffff !important; }
  }
  @media (max-width: 991.98px) {
    .mobile-menu-toggle {
      display: flex !important;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      background: transparent;
      color: #0b5f8a;
    }
    
    [data-theme="dark"] .mobile-menu-toggle {
      color: #ffffff;
    }
    
    .navbar-compact .container-fluid { 
      padding-left: 1rem !important; 
      padding-right: 1rem !important; 
    }
    
    .navbar-compact .btn.px-4 { 
      padding-left: 1rem !important; 
      padding-right: 1rem !important; 
    }
  }
  @media (max-width: 575.98px) {
    .navbar-compact img[alt="TransDigiSN"] { height: 56px !important; }
  }
  @media (max-width: 420px) {
    .navbar-compact img[alt="TransDigiSN"] { height: 48px !important; }
  }

  /* Sidebar mobile menu */
  @media (max-width: 991.98px) {
    .mobile-menu-toggle {
      border-radius: 999px;
      border-width: 0;
      border-color: transparent;
      background-color: transparent;
      color: #000000;
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .mobile-menu-toggle:hover {
      background-color: transparent;
      border-color: transparent;
      color: #000000;
    }

    /* Icône du menu mobile en mode sombre : blanche */
    [data-theme="dark"] .navbar-compact .mobile-menu-toggle {
      background-color: transparent;
      border-color: transparent;
      color: #ffffff;
    }

    [data-theme="dark"] .navbar-compact .mobile-menu-toggle:hover {
      background-color: transparent;
      border-color: transparent;
      color: #ffffff;
    }

    .mobile-menu-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.35);
      z-index: 1040;
    }

    .mobile-menu-panel {
      position: fixed;
      top: 0;
      right: 0;
      height: auto;
      max-height: 60vh;
      width: 55%;
      max-width: 220px;
      background: #ffffff;
      z-index: 1050;
      padding: 1.5rem 1.25rem;
      box-shadow: -8px 0 24px rgba(15, 23, 42, 0.2);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .mobile-menu-links .mobile-menu-link {
      font-weight: 600;
      font-size: 1rem;
      color: #0b5f8a;
      padding-left: 0;
      padding-right: 0;
      text-decoration: none;
    }

    .mobile-menu-links .mobile-menu-link:hover {
      color: #063a55;
      text-decoration: none;
    }
  }

  /* Boutons du menu mobile plus étroits */
  .mobile-menu-primary-btn {
    min-width: 120px;
    border-radius: 999px;
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;
    align-self: flex-start;
  }

  .mobile-menu-theme-toggle {
    color: #0b5f8a;
    align-self: flex-start;
  }

  [data-theme="dark"] .mobile-menu-theme-toggle {
    color: #0b5f8a;
  }

  body.mobile-menu-open {
    overflow: hidden;
  }

  /* Menu mobile en mode sombre : panneau sombre, texte clair */
  [data-theme="dark"] .mobile-menu-panel {
    background: #0b1120;
    color: #ffffff;
  }

  [data-theme="dark"] .mobile-menu-panel .btn.btn-link,
  [data-theme="dark"] .mobile-menu-panel .mobile-menu-link {
    color: #e5e7eb !important;
  }

  [data-theme="dark"] .mobile-menu-panel .mobile-menu-link:hover {
    color: #ffffff !important;
  }
`;

