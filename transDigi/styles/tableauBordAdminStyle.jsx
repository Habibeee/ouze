// ✅ STYLES RESPONSIVE POUR DASHBOARD ADMIN

export const adminStyles = {
  layout: { 
    minHeight: '100vh', 
    backgroundColor: 'var(--bg)'
  },
  sidebar: { 
    width: '280px', 
    position: 'fixed', 
    height: '100vh', 
    overflowY: 'auto', 
    zIndex: 1000 
  },
  logoCircle: { 
    width: '48px', 
    height: '48px', 
    backgroundColor: '#28A745' 
  },
  activeMenuBtn: { 
    backgroundColor: '#28A745', 
    color: '#ffffff' 
  },
  inactiveMenuBtn: { 
    backgroundColor: 'transparent', 
    color: 'var(--text)'
  },
  menuBtnBase: { 
    border: 'none', 
    padding: '12px 16px', 
    borderRadius: '8px' 
  },
  statIconCircle: { 
    borderRadius: '9999px', 
    padding: '12px' 
  },
  topBadge: { 
    fontSize: '10px' 
  },
  mainContent: {},
};

export const adminCss = `
  /* ========================================
     🎨 STYLES RESPONSIVE - DASHBOARD ADMIN
     ======================================== */

  /* Base global styles */
  * {
    box-sizing: border-box;
  }

  body {
    overflow-x: hidden;
  }

  .flex-grow-1 {
    min-width: 0;
  }

  .card {
    background-color: var(--card) !important;
  }

  .card-body {
    background-color: var(--card) !important;
  }

  .card h1, .card h2, .card h3, .card h4, .card h5, .card h6,
  .card .h1, .card .h2, .card .h3, .card .h4, .card .h5, .card .h6 {
    color: var(--text) !important;
  }

  /* ✅ Extra Small Screens (< 360px) */
  @media (max-width: 359.98px) {
    .container-fluid {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }

    .row {
      --bs-gutter-x: 0.25rem !important;
      --bs-gutter-y: 0.5rem !important;
    }

    .row > * {
      padding-left: 0.125rem !important;
      padding-right: 0.125rem !important;
    }

    .card-body {
      padding: 0.5rem !important;
    }

    h2, .h2 { font-size: 1.1rem !important; }
    h5, .h5 { font-size: 0.85rem !important; }
    h6, .h6 { font-size: 0.8rem !important; }

    .rounded-circle.p-3 {
      padding: 0.35rem !important;
      width: 32px !important;
      height: 32px !important;
    }

    .rounded-circle.p-3 svg {
      width: 16px !important;
      height: 16px !important;
    }
  }

  /* ✅ Mobile First - Base (< 576px) */
  @media (max-width: 575.98px) {
    /* Prevent horizontal scroll */
    body, html {
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }

    .d-flex {
      overflow-x: hidden !important;
    }

    .flex-grow-1 {
      width: 100% !important;
      max-width: 100vw !important;
      overflow-x: hidden !important;
    }
    /* Réduction padding sur mobile */
    .container-fluid {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }

    /* Cards stats en pleine largeur */
    .card {
      margin-bottom: 0.75rem;
      max-width: 100%;
      overflow: hidden;
    }

    /* Réduire les marges des cards */
    .card-body {
      padding: 0.75rem !important;
    }

    /* Stats cards responsive */
    .row {
      --bs-gutter-x: 0.5rem !important;
      --bs-gutter-y: 0.5rem !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .row > * {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }

    .row.g-2, .row.g-3, .row.g-4 {
      --bs-gutter-x: 0.5rem !important;
      --bs-gutter-y: 0.5rem !important;
    }

    .row.g-2 > *, .row.g-3 > *, .row.g-4 > * {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }

    /* Titres plus petits sur mobile */
    h1, .h1 { font-size: 1.5rem; }
    h2, .h2 { font-size: 1.25rem !important; }
    h3, .h3 { font-size: 1.1rem; }
    h5, .h5 { font-size: 0.95rem; }
    h6, .h6 { font-size: 0.875rem; }

    /* Texte des stats plus compact */
    .text-muted.small {
      font-size: 0.75rem !important;
    }

    /* Icônes stats plus petites */
    .rounded-circle.p-3 {
      padding: 0.5rem !important;
      width: 36px !important;
      height: 36px !important;
    }

    .rounded-circle.p-3 svg {
      width: 18px !important;
      height: 18px !important;
    }

    /* Boutons en pleine largeur sur mobile */
    .btn-group {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .btn-group .btn {
      width: 100%;
      border-radius: 0.375rem !important;
      margin-bottom: 0.5rem;
    }

    /* Header responsive */
    .d-flex.justify-content-end.align-items-center.gap-2 {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }

    /* Dropdown notifications plus petit */
    .card.shadow-sm[style*="minWidth: 320"] {
      min-width: 280px !important;
      max-width: calc(100vw - 1rem) !important;
      right: 0.5rem !important;
    }
  }

  /* ✅ Tablettes (576px - 767px) */
  @media (min-width: 576px) and (max-width: 767.98px) {
    .container-fluid {
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
    }

    .row {
      --bs-gutter-x: 0.75rem !important;
      --bs-gutter-y: 0.75rem !important;
    }

    .card-body {
      padding: 1rem !important;
    }

    /* Stats en 2 colonnes sur tablette */
    .stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }

    h2, .h2 { font-size: 1.35rem !important; }
  }

  /* ✅ Desktop Small (768px - 991px) */
  @media (min-width: 768px) and (max-width: 991.98px) {
    .container-fluid {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }

    .row {
      --bs-gutter-x: 1rem !important;
      --bs-gutter-y: 1rem !important;
    }

    .card-body {
      padding: 1.25rem !important;
    }

    /* Sidebar overlay sur tablette */
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }
  }

  /* ✅ Mobile - Sidebar Overlay */
  @media (max-width: 991.98px) {
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }

    /* Masquer certaines colonnes des tableaux */
    .table thead th:nth-child(3),
    .table tbody td:nth-child(3) {
      display: none;
    }
  }

  /* ✅ Desktop (≥ 992px) */
  @media (min-width: 992px) {
    .container-fluid {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }

    /* Layout 2 colonnes visible */
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* ========================================
     📊 COMPOSANTS COMMUNS
     ======================================== */

  /* Hover sur cartes */
  .card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .card:hover {
    transform: translateY(-2px);
  }

  /* Hover sur boutons */
  .btn:hover {
    opacity: 0.9;
  }

  /* Tables responsive */
  .table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table {
    min-width: 600px; /* Force une largeur minimale */
  }

  /* Hover lignes de tableaux */
  .table-hover tbody tr:hover {
    background-color: var(--bs-table-hover-bg);
  }

  /* Tables sur mobile */
  @media (max-width: 575.98px) {
    .table {
      min-width: 100%;
      font-size: 0.8rem;
    }

    .table thead th,
    .table tbody td {
      padding: 0.5rem 0.25rem;
      white-space: nowrap;
    }

    .table-sm thead th,
    .table-sm tbody td {
      padding: 0.35rem 0.2rem;
      font-size: 0.75rem;
    }
  }

  /* Scrollbar custom pour les dropdowns */
  .list-group-flush {
    max-height: 400px;
    overflow-y: auto;
  }

  .list-group-flush::-webkit-scrollbar {
    width: 6px;
  }

  .list-group-flush::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .list-group-flush::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  .list-group-flush::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Badges responsive */
  .badge {
    font-size: 0.75rem;
    padding: 0.35em 0.65em;
  }

  @media (max-width: 575.98px) {
    .badge {
      font-size: 0.7rem;
      padding: 0.25em 0.5em;
    }
  }

  /* ========================================
     🎨 GRAPHIQUES RESPONSIVE
     ======================================== */

  /* SVG Charts responsive */
  svg {
    max-width: 100%;
    height: auto;
  }

  /* Container pour éviter débordement */
  .chart-container {
    position: relative;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Chart responsive sur mobile */
  @media (max-width: 575.98px) {
    svg[viewBox] {
      width: 100% !important;
      height: auto !important;
    }
    
    .card-body > div[style*="height: 280px"] {
      height: 220px !important;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
  }

  /* ========================================
     📱 NOTIFICATIONS DROPDOWN
     ======================================== */

  /* Dropdown notifications responsive */
  .notification-dropdown {
    max-width: 90vw;
    max-height: 70vh;
    overflow-y: auto;
  }

  @media (max-width: 575.98px) {
    .notification-dropdown {
      position: fixed !important;
      top: 60px !important;
      left: 10px !important;
      right: 10px !important;
      width: auto !important;
    }
  }

  /* ========================================
     🎯 PROFILE MENU RESPONSIVE
     ======================================== */

  @media (max-width: 575.98px) {
    .profile-menu-dropdown {
      position: fixed !important;
      top: 60px !important;
      right: 10px !important;
      left: auto !important;
      min-width: 200px;
    }
  }

  /* ========================================
     ⚡ ANIMATIONS & TRANSITIONS
     ======================================== */

  /* Transition douce pour sidebar */
  .sidebar-transition {
    transition: margin-left 0.25s ease-in-out;
  }

  /* Fade in pour les cards */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .card {
    animation: fadeIn 0.3s ease-in-out;
  }

  /* Loading spinner */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  /* ========================================
     🌓 DARK MODE SUPPORT (Optionnel)
     ======================================== */

  @media (prefers-color-scheme: dark) {
    .text-muted { color: var(--muted) !important; }
  }

  /* ========================================
     🔧 UTILITIES RESPONSIVE
     ======================================== */

  /* Espacements adaptatifs */
  .gap-responsive {
    gap: 0.5rem;
  }

  @media (min-width: 768px) {
    .gap-responsive {
      gap: 1rem;
    }
  }

  @media (min-width: 992px) {
    .gap-responsive {
      gap: 1.5rem;
    }
  }

  /* Padding responsive pour containers */
  .container-padding-responsive {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  @media (min-width: 768px) {
    .container-padding-responsive {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
  }

  /* Text responsive */
  .text-responsive {
    font-size: 0.875rem;
  }

  @media (min-width: 768px) {
    .text-responsive {
      font-size: 1rem;
    }
  }

  /* ========================================
     🎨 PRINT STYLES (Bonus)
     ======================================== */

  @media print {
    .sidebar,
    .btn,
    .notification-dropdown,
    .profile-menu-dropdown {
      display: none !important;
    }

    .main-content {
      margin-left: 0 !important;
    }

    .card {
      page-break-inside: avoid;
    }
  }
`;
