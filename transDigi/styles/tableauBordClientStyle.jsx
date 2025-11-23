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
    background-color: var(--card);
    color: var(--text);
  }

  /* Cartes de devis dans "Mes devis" */
  .default-wrap .client-quotes-list {
    row-gap: 1rem;
  }

  .default-wrap .client-quote-card {
    width: 100%;
    max-width: 100%;
    box-shadow: 0 6px 16px rgba(15,23,42,0.10);
    background-color: var(--card);
    margin-bottom: 0.75rem;
  }

  /* Filtres "Tous / Acceptés / En attente" - dashboard client */
  .default-wrap .client-filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .default-wrap .client-filter-group .client-filter-btn {
    border-radius: 999px;
    font-weight: 500;
    padding-inline: 1.1rem;
    border-width: 1px;
    border-style: solid;
    background-color: transparent;
    color: inherit;
  }

  .default-wrap .client-filter-all {
    border-color: #16a34a;
    color: #16a34a;
  }

  .default-wrap .client-filter-accepted {
    border-color: #0ea5e9;
    color: #0ea5e9;
  }

  .default-wrap .client-filter-pending {
    border-color: #f97316;
    color: #f97316;
  }

  /* état survol commun */
  .default-wrap .client-filter-btn:hover {
    color: #ffffff;
  }

  /* Bouton actif : légère mise en avant sans fond coloré persistant pour "Tous" et "En attente" */
  .default-wrap .client-filter-btn.client-filter-active {
    box-shadow: 0 0 0 1px rgba(15,23,42,0.05);
  }

  /* "Tous" : seulement hover en vert */
  .default-wrap .client-filter-all:hover {
    background-color: #16a34a;
  }

  /* "Acceptés" : on garde un fond bleu en actif pour bien signaler le filtre sélectionné */
  .default-wrap .client-filter-accepted.client-filter-active,
  .default-wrap .client-filter-accepted:hover {
    background-color: #0ea5e9;
  }

  /* "En attente" : seulement hover en orange (plus de fond jaune persistant) */
  .default-wrap .client-filter-pending:hover {
    background-color: #f97316;
  }

  .card-body {
    background-color: var(--card);
  }

  .card h1, .card h2, .card h3, .card h4, .card h5, .card h6,
  .card .h1, .card .h2, .card .h3, .card .h4, .card .h5, .card .h6 {
    color: var(--text);
  }

  .card:hover {
    transform: translateY(-2px);
  }

  .btn {
    transition: opacity 0.2s ease, background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }

  .btn:hover { 
    opacity: 0.95; 
  }

  /* Boutons d'action sur les cartes de devis */
  .default-wrap .client-quote-actions .btn {
    min-width: 90px;
  }

  /* Boutons d'action : fond coloré, hover blanc avec bordure + texte colorés */
  .default-wrap .btn-client-detail {
    background-color: #4b5563;   /* gris foncé */
    border-color: #4b5563;
    color: #ffffff;
  }

  .default-wrap .btn-client-detail:hover {
    background-color: #ffffff;
    color: #4b5563;
    border-color: #4b5563;
  }

  .default-wrap .btn-client-edit {
    background-color: #0ea5e9;   /* bleu */
    border-color: #0ea5e9;
    color: #ffffff;
  }

  .default-wrap .btn-client-edit:hover {
    background-color: #ffffff;
    color: #0ea5e9;
    border-color: #0ea5e9;
  }

  .default-wrap .btn-client-cancel,
  .default-wrap .btn-client-cancel-confirm {
    background-color: #ef4444;   /* rouge */
    border-color: #ef4444;
    color: #ffffff;
  }

  .default-wrap .btn-client-cancel:hover,
  .default-wrap .btn-client-cancel-confirm:hover {
    background-color: #ffffff;
    color: #ef4444;
    border-color: #ef4444;
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

    /* Ne pas casser tous les .d-flex (pour le header),
       uniquement ceux à l'intérieur du contenu principal */
    .default-wrap .d-flex {
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

    /* Ne pas toucher tous les .d-flex pour éviter de couper le header (cloche + avatar).
       On limite l'overflow hidden aux blocs de contenu interne. */
    .default-wrap .d-flex {
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

    /* Buttons in devis cards - smaller on mobile */
    .default-wrap .btn-sm {
      font-size: 0.72rem;
      padding: 0.22rem 0.45rem;
      white-space: nowrap;
    }

    /* Filtres "Tous / Acceptés / En attente" sur mobile : 3 boutons de même largeur */
    .default-wrap .client-filter-group {
      width: 100%;
      gap: 0.5rem;
    }

    .default-wrap .client-filter-group .client-filter-btn {
      flex: 1 1 0;
      min-width: 0;
      text-align: center;
      padding-inline: 0.75rem;
    }

    /* Cartes "Mes devis" sur mobile */
    .default-wrap .border.rounded-3.p-2,
    .default-wrap .border.rounded-3.p-2.p-md-3 {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .default-wrap .client-quote-actions {
      width: 100%;
      justify-content: space-between;
      flex-wrap: nowrap;
      gap: 0.6rem; /* plus d’espace entre les 3 boutons */
    }

    .default-wrap .client-quote-actions .btn {
      flex: 1 1 0;
      min-width: 0 !important; /* même largeur pour Détail / Modifier / Annuler */
      text-align: center;
      padding: 0.25rem 0.5rem;
      font-size: 0.72rem;
      margin-right: 0.3rem;
    }

    .default-wrap .client-quote-actions .btn:last-child {
      margin-right: 0;
    }

    /* Si une seule action (ex : devis accepté), le bouton prend toute la ligne */
    .default-wrap .client-quote-actions .btn:only-child {
      flex-basis: 100%;
      margin-right: 0;
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
      background-color: var(--card);
      color: var(--text);
    }

    .text-muted {
      color: #9ca3af !important;
    }
  }
`;

