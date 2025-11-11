export const profilTransitaireCss = `
  /* ========================================
     🎨 BASE STYLES
     ======================================== */
  
  * {
    box-sizing: border-box;
  }

  body, html {
    overflow-x: hidden !important;
    max-width: 100vw !important;
  }

  .d-flex.bg-light {
    overflow-x: hidden !important;
    max-width: 100vw !important;
  }

  .container-fluid {
    max-width: 100% !important;
    overflow-x: hidden !important;
  }

  .row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .card {
    max-width: 100%;
    overflow: hidden;
  }

  .titre-page {
    color: #0b5f8a;
  }
  
  .btn-cta {
    background-color: #ff6a00;
    border-color: #ff6a00;
  }
  
  .btn-cta:hover {
    background-color: #e65f00;
    border-color: #e65f00;
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

    h2, .h2, .titre-page {
      font-size: 1.1rem !important;
      line-height: 1.3;
      word-break: break-word;
    }

    p.text-muted {
      font-size: 0.8rem !important;
      line-height: 1.4;
    }

    .fw-semibold.text-muted {
      font-size: 0.85rem !important;
    }

    .form-control,
    .form-select,
    textarea {
      font-size: 0.8rem !important;
      padding: 0.4rem 0.5rem !important;
      min-height: 36px;
    }

    .form-label {
      font-size: 0.8rem !important;
      margin-bottom: 0.25rem !important;
    }

    .btn {
      padding: 0.35rem 0.6rem;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .btn-sm {
      padding: 0.25rem 0.4rem;
      font-size: 0.75rem;
    }

    .avatar-uploader img,
    .avatar-uploader > div {
      width: 56px !important;
      height: 56px !important;
    }

    .alert {
      padding: 0.4rem !important;
      font-size: 0.75rem !important;
    }

    .row.g-2 {
      --bs-gutter-x: 0.25rem !important;
      --bs-gutter-y: 0.25rem !important;
    }
  }

  /* ✅ Mobile (< 576px) */
  @media (max-width: 575.98px) {
    body, html {
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }

    .flex-grow-1.bg-light {
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }

    .container-fluid {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
      max-width: 100% !important;
    }

    .row {
      margin-left: 0 !important;
      margin-right: 0 !important;
      max-width: 100% !important;
    }

    .col-12 {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }

    .card {
      border-radius: 0.5rem !important;
    }

    .card-body {
      padding: 1rem !important;
    }

    h2, .h2 {
      font-size: 1.5rem !important;
    }

    .titre-page {
      font-size: 1.35rem !important;
      line-height: 1.3;
      word-break: break-word;
      hyphens: auto;
    }

    p.text-muted {
      font-size: 0.85rem !important;
      line-height: 1.4;
      word-break: break-word;
    }

    .fw-semibold.text-muted {
      font-size: 0.9rem !important;
      word-break: break-word;
    }

    /* Form controls */
    .form-control,
    .form-select,
    textarea {
      font-size: 0.85rem !important;
      padding: 0.5rem 0.6rem !important;
      word-break: break-word;
    }

    .form-label {
      font-size: 0.85rem !important;
      margin-bottom: 0.3rem !important;
      word-break: break-word;
    }

    /* Avatar */
    .avatar-uploader img,
    .avatar-uploader > div {
      width: 64px !important;
      height: 64px !important;
    }

    /* Buttons */
    .btn {
      font-size: 0.9rem;
    }

    .btn-sm {
      padding: 0.35rem 0.6rem;
      font-size: 0.85rem;
    }

    /* Button group at bottom */
    .d-flex.gap-3.justify-content-end {
      flex-direction: column !important;
      gap: 0.5rem !important;
    }

    .d-flex.gap-3.justify-content-end .btn {
      width: 100%;
    }

    /* Row spacing */
    .row.g-3 {
      --bs-gutter-x: 0.5rem !important;
      --bs-gutter-y: 0.5rem !important;
    }

    .row.g-4 {
      --bs-gutter-x: 0.5rem !important;
      --bs-gutter-y: 0.75rem !important;
    }

    /* Alerts */
    .alert {
      padding: 0.5rem !important;
      font-size: 0.85rem;
    }

    /* Text wrapping */
    .text-muted.small {
      word-break: break-word;
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

    h2, .h2 {
      font-size: 1.75rem !important;
    }
  }

  /* ✅ Desktop Small (768px - 991px) */
  @media (min-width: 768px) and (max-width: 991.98px) {
    .container-fluid {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }

    .card-body {
      padding: 2rem !important;
    }
  }

  /* ✅ Prevent text overflow */
  @media (max-width: 991.98px) {
    .titre-page {
      word-break: break-word;
      hyphens: auto;
    }

    .form-control,
    textarea {
      max-width: 100%;
    }
  }
`;
