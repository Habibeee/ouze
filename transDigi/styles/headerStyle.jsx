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
  @media (max-width: 575.98px) {
    .navbar-compact .container-fluid { padding-left: .5rem !important; padding-right: .5rem !important; }
    .navbar-compact .btn.px-4 { padding-left: .75rem !important; padding-right: .75rem !important; }
  }
  @media (max-width: 575.98px) {
    .navbar-compact img[alt="TransDigiSN"] { height: 56px !important; }
  }
  @media (max-width: 420px) {
    .navbar-compact img[alt="TransDigiSN"] { height: 48px !important; }
  }
`;

