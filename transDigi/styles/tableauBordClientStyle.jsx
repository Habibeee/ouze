export const clientStyles = {
  layout: { minHeight: '100vh', backgroundColor: 'var(--bg)' },
  sidebar: { width: '280px', position: 'fixed', height: '100vh', overflowY: 'auto', zIndex: 1000 },
  primary: '#0EA5E9',
  mainMarginLg: '280px',
  menuBtnBase: { border: 'none', padding: '12px 16px', borderRadius: '8px' },
  activeMenuBtn: { backgroundColor: '#0EA5E9', color: '#ffffff' },
  inactiveMenuBtn: { backgroundColor: 'transparent', color: 'var(--text)' },
};

export const clientCss = `
  /* ========================================
     🎨 STYLES RESPONSIVE - DASHBOARD CLIENT
     ======================================== */

  /* Base styles */
  :root { --sidebar-width: 280px; }

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
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    background-color: #ffffff !important;
  }

  .card-body {
    background-color: #ffffff !important;
  }

  .card h1, .card h2, .card h3, .card h4, .card h5, .card h6,
  .card .h1, .card .h2, .card .h3, .card .h4, .card .h5, .card .h6 {
    color: #212529 !important;
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

  .table-hover tbody tr:hover { 
    background-color: #F8F9FA; 
  }

  /* ✅ Force no margin on mobile/tablet */
  @media (max-width: 991.98px) {
    .flex-grow-1 {
      margin-left: 0 !important;
      padding-left: 0 !important;
    }

    .d-flex {
      display: block !important;
    }
  }

  /* ✅ Extra Small Screens (< 360px) */
  @media (max-width: 359.98px) {
    .flex-grow-1 {
      margin-left: 0 !important;
      padding-left: 0 !important;
    }

    .container-fluid {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }

    .default-wrap .card-body {
      padding: 0.5rem !important;
    }

    .default-wrap h1, .default-wrap .h1 { font-size: 1.25rem !important; }
    .default-wrap h2, .default-wrap .h2 { font-size: 1.1rem !important; }
    .default-wrap h5, .default-wrap .h5 { font-size: 0.85rem !important; }

    .default-wrap .btn {
      padding: 0.25rem 0.4rem;
      font-size: 0.75rem;
    }

    h5, .h5 {
      font-size: 0.9rem !important;
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
      font-size: 0.65rem !important;
      padding: 0.2rem 0.4rem !important;
    }

    .text-muted.small {
      font-size: 0.75rem !important;
    }

    .default-wrap .border.rounded-3 {
      padding: 0.5rem !important;
    }

    .default-wrap .btn-group .btn {
      font-size: 0.7rem;
      padding: 0.25rem 0.4rem;
    }
  }

  /* Mobile (< 576px) */
  @media (max-width: 575.98px) {
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
      margin-left: 0 !important;
      padding-left: 0 !important;
    }

    .container-fluid {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }

    .default-wrap .card {
      margin-bottom: 0.75rem;
      border-radius: .5rem;
      max-width: 100%;
      overflow: hidden;
    }

    .default-wrap .card-body {
      padding: 0.75rem !important;
    }

    .default-wrap .row {
      --bs-gutter-x: 0.5rem !important;
      --bs-gutter-y: 0.5rem !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .default-wrap .row > * {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }

    .default-wrap h1.h2, .default-wrap h2 { 
      font-size: 1.35rem; 
    }

    .default-wrap .badge { 
      font-size: .7rem; 
      padding: 0.25rem 0.5rem;
    }

    .default-wrap .btn-group .btn { 
      padding: .25rem .5rem; 
      font-size: .8rem; 
    }

    .default-wrap .list-group-item { 
      padding: .5rem .75rem; 
    }

    .default-wrap .border.rounded-3.p-3 { 
      padding: .75rem !important; 
    }

    .default-wrap .d-flex.align-items-start.gap-2 > .btn { 
      padding: .25rem .5rem; 
    }

    .default-wrap .pagination { 
      gap: .25rem;
      flex-wrap: wrap;
    }

    .default-wrap .pagination .page-link {
      padding: .25rem .5rem;
      font-size: 0.85rem;
    }

    .modal-dialog { 
      max-width: 95vw; 
      margin: .5rem auto; 
    }

    .modal-content { 
      border-radius: .5rem; 
    }

    .form-select, .form-control { 
      font-size: .9rem; 
    }

    .table {
      font-size: 0.85rem;
    }

    .table thead th,
    .table tbody td {
      padding: 0.5rem 0.35rem;
      white-space: nowrap;
    }

    /* Hide some columns on mobile */
    .table thead th:nth-child(3),
    .table tbody td:nth-child(3) {
      display: none;
    }

    /* Devis cards responsive */
    .default-wrap .border.rounded-3 {
      padding: 0.75rem !important;
    }

    .default-wrap .btn-group {
      width: 100%;
    }

    .default-wrap .btn-group .btn {
      flex: 1;
      font-size: 0.8rem;
      padding: 0.35rem 0.5rem;
    }

    /* Badge responsive */
    .default-wrap .badge.rounded-pill {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem !important;
    }

    /* Buttons in devis cards */
    .default-wrap .btn-sm {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      white-space: nowrap;
    }
  }

  /* ✅ Tablette (576px - 767px) */
  @media (min-width: 576px) and (max-width: 767.98px) {
    .flex-grow-1 {
      margin-left: 0 !important;
    }

    .container-fluid {
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
    }

    .default-wrap .row {
      --bs-gutter-x: 0.75rem !important;
      --bs-gutter-y: 0.75rem !important;
    }

    .default-wrap .card-body {
      padding: 1rem !important;
    }

    .default-wrap h1.h2 { 
      font-size: 1.5rem; 
    }

    .default-wrap .badge { 
      font-size: .75rem; 
    }

    .default-wrap .card { 
      border-radius: .5rem; 
    }

    .default-wrap .btn-group .btn { 
      padding: .35rem .6rem; 
      font-size: .85rem; 
    }

    .default-wrap .list-group-item { 
      padding: .6rem .85rem; 
    }

    .table {
      font-size: 0.9rem;
    }
  }

  /* ✅ Desktop Small (768px - 991px) */
  @media (min-width: 768px) and (max-width: 991.98px) {
    .flex-grow-1 {
      margin-left: 0 !important;
    }

    .container-fluid {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }

    .default-wrap .row {
      --bs-gutter-x: 1rem !important;
      --bs-gutter-y: 1rem !important;
    }

    .default-wrap .card-body {
      padding: 1.25rem !important;
    }

    .table { 
      font-size: 0.875rem; 
    }

    .default-wrap .row.g-4 { 
      --bs-gutter-x: 1rem; 
      --bs-gutter-y: 1rem; 
    }

    .pagination { 
      flex-wrap: wrap; 
    }

    .pagination .page-link { 
      padding: .25rem .5rem; 
    }
  }

  /* ✅ Desktop Medium (992px - 1199px) */
  @media (min-width: 992px) and (max-width: 1199.98px) {
    .container-fluid {
      padding-left: 1.25rem;
      padding-right: 1.25rem;
    }

    .default-wrap .card .card-body { 
      padding: 1rem 1rem; 
    }
  }

  /* ✅ Desktop Large (≥ 1200px) */
  @media (min-width: 1200px) {
    .container-fluid {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }

    .default-wrap .card .card-body {
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
  }

  /* ========================================
     🎨 DARK MODE
     ======================================== */

  @media (prefers-color-scheme: dark) {
    .card {
      background-color: #1e1e1e;
      color: #ffffff;
    }

    .text-muted {
      color: #9ca3af !important;
    }
  }
`;

