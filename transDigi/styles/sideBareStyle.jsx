export const sideBareStyles = {
  sidebar: { width: '240px', position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto', zIndex: 1000, backgroundColor: 'var(--card)', color: 'var(--text)' },
  primary: '#28A745',
  menuBtnBase: { border: 'none', padding: '12px 16px', borderRadius: '8px' },
  activeMenuBtn: { backgroundColor: '#0EA5E9', color: '#ffffff' },
  inactiveMenuBtn: { backgroundColor: 'transparent', color: 'var(--text)' }
};

export const sideBareCss = `
  /* ========================================
     🎨 STYLES RESPONSIVE - SIDEBAR
     ======================================== */

  /* Base styles */
  .sidebare-shadow { 
    box-shadow: 0 0 0 1px rgba(0,0,0,0.04), 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); 
  }

  .sidebare-btn {
    transition: all 0.2s ease;
  }

  .sidebare-btn:hover { 
    opacity: 0.95;
    transform: translateX(2px);
  }

  .sidebare-label { 
    white-space: nowrap; 
  }

  [data-theme="dark"] .sidebare-shadow { 
    box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 10px 15px -3px rgba(0,0,0,0.6), 0 4px 6px -4px rgba(0,0,0,0.6); 
  }

  /* ✅ Mobile (< 992px) - Sidebar overlay */
  @media (max-width: 991.98px) {
    .sidebare-sm { 
      font-size: 0.9rem; 
    }

    /* Sidebar overlay mode */
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999;
      backdrop-filter: blur(2px);
    }

    /* Sidebar mobile */
    [style*="position: fixed"][style*="width: 240px"] {
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    /* Sidebar open state */
    .sidebar-open {
      transform: translateX(0) !important;
    }
  }

  /* ✅ Mobile (< 576px) - Compact sidebar */
  @media (max-width: 575.98px) {
    .sidebare-btn {
      padding: 10px 12px !important;
      font-size: 0.85rem;
    }

    .sidebare-label {
      font-size: 0.85rem;
    }

    /* Icons smaller on mobile */
    .sidebare-btn svg {
      width: 18px !important;
      height: 18px !important;
    }
  }

  /* ✅ Desktop (≥ 992px) - Fixed sidebar */
  @media (min-width: 992px) {
    .sidebar-overlay {
      display: none !important;
    }
  }

  /* ========================================
     🎨 ANIMATIONS
     ======================================== */

  @keyframes slideIn {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .sidebar-open {
    animation: slideIn 0.3s ease-out;
  }

  /* ========================================
     🎨 SCROLLBAR
     ======================================== */

  [style*="overflowY: auto"]::-webkit-scrollbar {
    width: 6px;
  }

  [style*="overflowY: auto"]::-webkit-scrollbar-track {
    background: transparent;
  }

  [style*="overflowY: auto"]::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  [style*="overflowY: auto"]::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  [data-theme="dark"] [style*="overflowY: auto"]::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }

  [data-theme="dark"] [style*="overflowY: auto"]::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;
