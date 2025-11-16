export const transitaireStyles = {
  app: { backgroundColor: 'var(--bg)', minHeight: '100vh' },
  brandSquare: { width: '40px', height: '40px', backgroundColor: '#28A745' },
  publishBtn: { backgroundColor: '#0EA5E9', color: '#ffffff' },
  avatar: { width: '36px', height: '36px', backgroundColor: '#FFB74D' },
  heroTitle: { },
  cardHover: { transition: 'transform 0.2s, box-shadow 0.2s', backgroundColor: '#F3F4F6' },
  companyLogo: { width: '60px', height: '60px', fontSize: '18px' },
  verified: { color: '#28A745' },
  serviceBadge: { backgroundColor: 'var(--card)', color: 'var(--text)' },
  primaryBtn: { backgroundColor: '#0EA5E9', color: '#ffffff' },
};

export const transitaireCss = `
  /* ========================================
     🎨 GLOBAL STYLES
     ======================================== */
  
  * {
    box-sizing: border-box;
  }

  body, html {
    overflow-x: hidden !important;
    max-width: 100vw !important;
  }

  .bg-body {
    overflow-x: hidden !important;
    max-width: 100vw !important;
  }

  .container {
    max-width: 100% !important;
    overflow-x: hidden !important;
  }

  .row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .input-group-text { 
    border-right: 0; 
  }
  
  .form-control:focus { 
    border-color: #0EA5E9; 
    box-shadow: 0 0 0 0.2rem rgba(14, 165, 233, 0.25); 
  }
  
  .card { 
    transition: transform 0.2s, box-shadow 0.2s;
    max-width: 100%;
    overflow: hidden;
  }
  
  .card:hover { 
    transform: translateY(-4px); 
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important; 
  }
  
  .btn:hover { 
    opacity: 0.9; 
  }
  
  .page-link { 
    color: var(--text); 
  }
  
  .page-link:hover { 
    background-color: var(--card); 
    border-color: var(--border); 
  }

  /* ========================================
     🎨 RESPONSIVE STYLES
     ======================================== */

  /* ✅ Extra Small Screens (< 360px) */
  @media (max-width: 359.98px) {
    .container {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }

    .card-body {
      padding: 0.75rem !important;
    }

    h1, .h1, .display-4 {
      font-size: 1.25rem !important;
    }

    .form-control, .form-select {
      font-size: 0.875rem !important;
      padding: 0.5rem !important;
    }

    .input-group-text {
      padding: 0.5rem !important;
    }

    .btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
  }

  /* ✅ Mobile (< 576px) */
  @media (max-width: 575.98px) {
    body, html {
      overflow-x: hidden !important;
    }

    .container {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }

    .card {
      margin-bottom: 0.75rem;
      border-radius: 0.5rem !important;
    }

    .card-body {
      padding: 1rem !important;
    }

    h1, .h1, .display-4 {
      font-size: 1.5rem !important;
    }

    .text-muted.fs-5 {
      font-size: 0.95rem !important;
    }

    .form-control, .form-select {
      font-size: 0.9rem !important;
    }

    .input-group {
      margin-bottom: 0.5rem;
    }

    .btn {
      width: 100%;
      padding: 0.6rem 1rem;
    }

    .btn-sm {
      padding: 0.35rem 0.6rem;
      font-size: 0.85rem;
    }

    /* Search button full width on mobile */
    .col-12.col-md-3 .btn {
      width: 100%;
    }

    /* Cards grid */
    .row.g-4 {
      --bs-gutter-x: 0.5rem !important;
      --bs-gutter-y: 0.75rem !important;
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

    /* Modal */
    .modal-dialog {
      max-width: 95vw !important;
      margin: 0.5rem auto;
    }

    .modal-content {
      border-radius: 0.5rem;
    }

    .modal-body {
      padding: 1rem !important;
    }

    /* Company logo smaller on mobile */
    .rounded-circle[style*="width: 60px"] {
      width: 48px !important;
      height: 48px !important;
      font-size: 16px !important;
    }

    /* Service badges wrap */
    .d-flex.gap-2.flex-wrap {
      gap: 0.5rem !important;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }
  }

  /* ✅ Tablette (576px - 767px) */
  @media (min-width: 576px) and (max-width: 767.98px) {
    .container {
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
    }

    .card-body {
      padding: 1.5rem !important;
    }

    h1, .h1, .display-4 {
      font-size: 1.75rem !important;
    }
  }

  /* ✅ Desktop Small (768px - 991px) */
  @media (min-width: 768px) and (max-width: 991.98px) {
    .container {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }

    .card-body {
      padding: 2rem !important;
    }
  }

  /* ✅ Prevent card hover on touch devices */
  @media (hover: none) {
    .card:hover {
      transform: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
    }
  }
`;

