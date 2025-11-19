export const transitareStyles = {
  layout: { minHeight: '100vh', backgroundColor: 'var(--bg)' },
  sidebar: { width: '280px', position: 'fixed', height: '100vh', overflowY: 'auto', zIndex: 1000 },
  mainMarginLg: '280px',
  primary: '#0EA5E9',
};

export const transitareCss = `
  /* ========================================
     🎨 STYLES RESPONSIVE - DASHBOARD TRANSITAIRE
     ======================================== */

  /* Base styles */
  :root { --sidebar-width: 280px; }

  * {
    box-sizing: border-box;
  }
  body {
    overflow-x: hidden;
  }

  .card {
    background-color: var(--card) !important;
  }

  .card-body {
    background-color: var(--card) !important;
  }

  /* Titres principaux du dashboard transitaire :
     - mode clair : texte foncé bien contrasté
     - mode sombre : ajusté plus bas avec !important */
  .forwarder-main-title,
  .forwarder-stats-title {
    color: #111827 !important;
  }

  .card h1, .card h2, .card h3, .card h4, .card h5, .card h6,
  .card .h1, .card .h2, .card .h3, .card .h4, .card .h5, .card .h6 {
    color: var(--text) !important;
  }

  .flex-grow-1 {
    min-width: 0;
  }

  .input-group-text { 
    border-right: 0; 
  }

  .form-control:focus { 
    border-color: #0EA5E9; 
    box-shadow: 0 0 0 0.2rem rgba(14, 165, 233, 0.25); 
  }

  .card { 
    transition: transform 0.2s ease, box-shadow 0.2s ease; 
  }

  .card:hover {
    transform: translateY(-2px);
  }

  .btn {
    transition: opacity 0.2s ease;
  }

  .btn:hover { 
    opacity: 0.9; 
  }

  /* ========================================
     📱 RESPONSIVE BREAKPOINTS
     ======================================== */

  /* ✅ Extra Small Screens (< 360px) */
  @media (max-width: 359.98px) {
    .container-fluid {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }

    .card-body {
      padding: 0.5rem !important;
    }

    h1, .h1 {
      font-size: 1.1rem !important;
      line-height: 1.3;
      word-break: break-word;
    }

    h2, .h2 {
      font-size: 1rem !important;
      line-height: 1.3;
      word-break: break-word;
    }

    h3, .h3 {
      font-size: 0.95rem !important;
      line-height: 1.3;
    }

    h5, .h5 {
      font-size: 0.9rem !important;
      word-break: break-word;
    }

    .text-muted.small {
      font-size: 0.75rem !important;
    }

    .btn {
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
      white-space: nowrap;
    }

    .btn-sm {
      padding: 0.2rem 0.4rem;
      font-size: 0.7rem;
    }

    .badge {
      font-size: 0.65rem;
      padding: 0.2rem 0.4rem;
    }

    .table {
      font-size: 0.7rem;
    }

    .table th,
    .table td {
      padding: 0.4rem 0.2rem !important;
      word-break: break-word;
    }

    .form-control,
    .form-select {
      font-size: 0.75rem !important;
      padding: 0.4rem !important;
    }

    .input-group-text {
      padding: 0.4rem !important;
      font-size: 0.75rem;
    }
  }

  /* ✅ Mobile (< 576px) */
  @media (max-width: 575.98px) {
    body, html {
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }

    .container-fluid {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }

    .card {
      border-radius: 0.5rem !important;
      margin-bottom: 0.75rem;
    }

    .card-body {
      padding: 1rem !important;
    }

    h1, .h1 {
      font-size: 1.5rem !important;
    }

    h2, .h2 {
      font-size: 1.35rem !important;
    }

    h3, .h3 {
      font-size: 1.25rem !important;
    }

    h5, .h5 {
      font-size: 1.1rem !important;
    }

    /* Header sticky */
    .bg-white.border-bottom {
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    /* Stats cards */
    .row.g-2 {
      --bs-gutter-x: 0.5rem !important;
      --bs-gutter-y: 0.5rem !important;
    }

    /* Buttons */
    .btn {
      font-size: 0.9rem;
    }

    .btn-sm {
      padding: 0.35rem 0.6rem;
      font-size: 0.85rem;
    }

    /* Badges */
    .badge {
      font-size: 0.75rem;
      padding: 0.35rem 0.6rem;
    }

    /* Table responsive */
    .table-responsive {
      margin: 0 -0.5rem;
    }

    .table {
      font-size: 0.85rem;
    }

    .table thead th {
      padding: 0.75rem 0.5rem !important;
      font-size: 0.75rem;
      white-space: nowrap;
    }

    .table tbody td {
      padding: 0.75rem 0.5rem !important;
    }

    /* Hide some table columns on mobile */
    .table th:nth-child(3),
    .table td:nth-child(3),
    .table th:nth-child(4),
    .table td:nth-child(4) {
      display: none;
    }

    /* Tabs wrap */
    .d-flex.gap-2.flex-wrap {
      gap: 0.5rem !important;
    }

    .d-flex.gap-2.flex-wrap .btn {
      font-size: 0.85rem;
      padding: 0.4rem 0.8rem;
    }

    /* Search input */
    .input-group {
      max-width: 100% !important;
      margin-top: 0.5rem;
    }

    /* Pagination */
    .pagination {
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .page-link {
      padding: 0.35rem 0.6rem;
      font-size: 0.85rem;
    }

    /* Modal/Offcanvas */
    .offcanvas {
      max-width: 95vw !important;
    }

    .modal-dialog {
      max-width: 95vw !important;
      margin: 0.5rem auto;
    }
  }

  /* ✅ Tablette (576px - 767px) */
  @media (min-width: 576px) and (max-width: 767.98px) {
    .container-fluid {
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
    }

    .card-body {
      padding: 1.5rem !important;
    }

    h1, .h1 {
      font-size: 1.75rem !important;
    }

    /* Show 3rd column but hide 4th */
    .table th:nth-child(4),
    .table td:nth-child(4) {
      display: none;
    }
  }

  /* ✅ Desktop Small (768px - 991px) */
  @media (min-width: 768px) and (max-width: 991.98px) {
    .container-fluid {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }

    .card-body {
      padding: 1.5rem !important;
    }
  }

  /* ✅ Prevent hover effects on touch devices */
  @media (hover: none) {
    .card:hover {
      transform: none;
    }
  }

  .table-hover tbody tr:hover { 
    background-color: var(--bs-table-hover-bg); 
  }

  /* ✅ Extra Small Screens (< 360px) */
  @media (max-width: 359.98px) {
    .container-fluid {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }

    .card-body {
      padding: 0.5rem !important;
    }

    h1, .h1 { font-size: 1.25rem !important; }
    h2, .h2 { font-size: 1.1rem !important; }
    h5, .h5 { font-size: 0.85rem !important; }

    .btn {
      padding: 0.25rem 0.4rem;
      font-size: 0.75rem;
    }

    .badge {
      font-size: 0.65rem;
      padding: 0.2rem 0.4rem;
    }

    .row.g-3 {
      --bs-gutter-x: 0.25rem !important;
      --bs-gutter-y: 0.5rem !important;
    }
  }

  /* ✅ Mobile (< 576px) */
  @media (max-width: 575.98px) {
    body, html {
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }

    .d-flex.bg-body {
      overflow-x: hidden !important;
    }

    .flex-grow-1.bg-body {
      width: 100% !important;
      max-width: 100vw !important;
      overflow-x: hidden !important;
    }

    .container-fluid {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }

    .card {
      margin-bottom: 0.75rem;
      border-radius: .5rem;
      max-width: 100%;
      overflow: hidden;
    }

    .card-body {
      padding: 0.75rem !important;
    }

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

    h1.h2, h2 { 
      font-size: 1.35rem; 
    }

    .badge { 
      font-size: .7rem; 
      padding: 0.25rem 0.5rem;
    }

    .btn { 
      padding: .35rem .6rem; 
      font-size: .9rem; 
    }

    .btn-sm {
      padding: .25rem .5rem;
      font-size: .8rem;
    }

    .border.rounded-3.p-3 { 
      padding: .75rem !important; 
    }

    .table { 
      font-size: 0.85rem; 
    }

    .table thead th, .table tbody td { 
      padding: .5rem .35rem; 
      white-space: nowrap;
    }

    /* Hide some columns on mobile */
    .table thead th:nth-child(3),
    .table tbody td:nth-child(3) {
      display: none;
    }

    .modal-dialog { 
      max-width: 95vw; 
      margin: .5rem auto; 
    }

    .modal-content { 
      border-radius: .5rem; 
    }

    .offcanvas-end.show { 
      width: 100% !important; 
      max-width: 100% !important; 
    }

    .form-select, .form-control { 
      font-size: .9rem; 
    }

    .pagination {
      gap: .25rem;
      flex-wrap: wrap;
    }

    .pagination .page-link {
      padding: .25rem .5rem;
      font-size: 0.85rem;
    }

    .input-group {
      max-width: 100% !important;
    }
  }

  /* ✅ Tablette (576px - 767px) */
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

    h1.h2 { 
      font-size: 1.5rem; 
    }

    .badge { 
      font-size: .75rem; 
    }

    .card { 
      border-radius: .5rem; 
    }

    .btn { 
      padding: .35rem .6rem; 
      font-size: .9rem; 
    }

    .table {
      font-size: 0.9rem;
    }
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

    h1.h2 { 
      font-size: 1.35rem; 
    }

    .badge { 
      font-size: .7rem; 
    }

    .card { 
      border-radius: .5rem; 
    }

    .btn { 
      padding: .35rem .6rem; 
      font-size: .9rem; 
    }

    .table { 
      font-size: 0.875rem; 
    }

    .pagination { 
      flex-wrap: wrap; 
    }

    .pagination .page-link { 
      padding: .25rem .5rem; 
    }

    .row.g-3 { 
      --bs-gutter-x: 1rem; 
      --bs-gutter-y: 1rem; 
    }
  }

  /* ✅ Desktop Medium (992px - 1199px) */
  @media (min-width: 992px) and (max-width: 1199.98px) {
    .container-fluid {
      padding-left: 1.25rem;
      padding-right: 1.25rem;
    }

    .card .card-body { 
      padding: 1rem 1rem; 
    }
  }

  /* ✅ Desktop Large (≥ 1200px) */
  @media (min-width: 1200px) {
    .container-fluid {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }

    .card .card-body {
      padding: 1.5rem;
    }
  }

  /* ========================================
     🎨 ANIMATIONS
     ======================================== */

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
    background-color: var(--bs-card-bg);
    color: var(--bs-card-color);
  }

  /* ========================================
     🎨 DARK MODE
     ======================================== */

  @media (prefers-color-scheme: dark) {
    .card {
      background-color: var(--bs-dark);
      color: var(--bs-light);
    }

    .table-hover tbody tr:hover {
      background-color: var(--bs-table-hover-bg);
    }

    .text-muted {
      color: var(--bs-dark-muted) !important;
    }

    /* Forcer les titres principaux en clair sur le dashboard transitaire en mode sombre */
    .forwarder-main-title,
    .forwarder-stats-title {
      color: var(--bs-light) !important;
    }
  }
`;
