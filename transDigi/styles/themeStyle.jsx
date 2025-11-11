export const themeCss = `
  :root {
    --bg: #ffffff;
    --text: #111827;
    --muted: #6b7280;
    --card: #ffffff;
    --border: #e5e7eb;
    --primary: #28A745;
    --success: #28A745;
    --danger: #DC2626;
    --profile-hero-bg: linear-gradient(135deg, #0b5f8a 0%, #1976d2 100%);
    --hero-btn-bg: #FFC107;
    --hero-btn-color: #000000;
    --cta-bg: #0b5f8a;
    /* Synchroniser Bootstrap */
    --bs-body-bg: var(--bg);
    --bs-body-color: var(--text);
    --bs-card-bg: var(--card);
    --bs-border-color: var(--border);
  }
  [data-theme="dark"] {
    --bg: #0b1220;
    --text: #e5e7eb;
    --muted: #9ca3af;
    --card: #111827;
    --border: #1f2937;
    --primary: #34d399;
    --success: #34d399;
    --danger: #f87171;
    --profile-hero-bg: linear-gradient(135deg, #0a2540 0%, #0b5f8a 100%);
    --hero-btn-bg: #F59E0B;
    --hero-btn-color: #000000;
    --cta-bg: #0f172a;
    /* Synchroniser Bootstrap */
    --bs-body-bg: var(--bg);
    --bs-body-color: var(--text);
    --bs-card-bg: var(--card);
    --bs-border-color: var(--border);
  }
  body { background-color: var(--bg); color: var(--text); }
  .card { background-color: var(--card); border-color: var(--border); }
  .table thead th { border-color: var(--border); color: var(--text); }
  .table tbody td { border-color: var(--border); }
  .link-primary { color: var(--primary) !important; }
  .btn-primary { background-color: var(--primary); border-color: var(--primary); }

  /* Tous les titres h2 en bleu */
  h2 { color: #0b5f8a !important; }

  /* Forcer les zones blanches Bootstrap à suivre le thème */
  .bg-white, .navbar.bg-white, .card.bg-white { background-color: var(--card) !important; }
  .text-dark { color: var(--text) !important; }
  .border, .navbar, .card, .table, .form-control, .form-select { border-color: var(--border) !important; }
  .bg-body { background-color: var(--bg) !important; }
  .text-muted { color: var(--muted) !important; }

  /* Bouton clair en dark mode */
  [data-theme="dark"] .btn-light {
    background-color: #1f2937 !important;
    border-color: #374151 !important;
    color: #e5e7eb !important;
  }
  [data-theme="dark"] .btn-outline-secondary { border-color: #374151 !important; color: #e5e7eb !important; }
  [data-theme="dark"] .btn-outline-secondary:hover { background-color: #111827 !important; }

  /* Corps et sections claires en dark mode */
  [data-theme="dark"] body { background-color: var(--bg) !important; color: var(--text) !important; }
  [data-theme="dark"] .bg-light { background-color: #0f172a !important; }
  [data-theme="dark"] .bg-body { background-color: var(--bg) !important; }
  [data-theme="dark"] main, [data-theme="dark"] .container, [data-theme="dark"] .container-fluid { background-color: transparent !important; }

  /* Inputs en dark mode */
  [data-theme="dark"] .form-control, [data-theme="dark"] .form-select {
    background-color: #0b1220 !important;
    color: var(--text) !important;
    border-color: var(--border) !important;
  }
  [data-theme="dark"] .form-control::placeholder { color: var(--muted) !important; }

  /* Tables en dark mode */
  [data-theme="dark"] .table { color: var(--text); }
  [data-theme="dark"] .table thead { background-color: #0f172a; }
  [data-theme="dark"] .table tbody tr { background-color: #0b1220; }
  [data-theme="dark"] .table thead th, 
  [data-theme="dark"] .table tbody td { color: var(--text) !important; }
`;
