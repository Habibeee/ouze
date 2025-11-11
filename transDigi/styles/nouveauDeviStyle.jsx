export const nouveauDevisCss = `
  /* ========================================
     🎨 GLOBAL OVERFLOW PREVENTION
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
    max-width: 100% !important;
  }

  .card {
    border-radius: 16px !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }
  
  .card.shadow-sm:hover {
    box-shadow: 0 0.75rem 1.5rem rgba(0,0,0,.08) !important;
  }

  .form-control,
  .form-select {
    border-radius: 12px !important;
    padding: 12px 14px !important;
    min-height: 52px;
    color: var(--text);
    background-color: var(--card);
  }
  .form-control-lg,
  .form-select-lg {
    min-height: 56px;
    font-size: 1rem;
  }
  .form-control:focus,
  .form-select:focus {
    border-color: var(--bs-primary);
    box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
  }

  .form-check-input:checked {
    background-color: #28A745;
    border-color: #28A745;
  }

  .form-check-input:focus {
    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .border-dashed {
    border-style: dashed !important;
  }

  .btn:hover {
    opacity: 0.9;
  }

  .section-title {
    letter-spacing: -.01em;
  }

  .input-group .input-group-text {
    border-radius: 12px !important;
  }

  .input-group {
    display: flex;
    align-items: stretch;
    flex-wrap: nowrap !important;
    gap: 0;
  }

  .input-group .form-control,
  .input-group .input-group-text {
    height: 56px;
  }

  /* Dimension row sizing fixes */
  .dimension-row .input-group {
    width: 100%;
  }
  .dimension-row .input-group .form-control {
    flex: 1 1 auto !important;
    width: 100% !important;
    min-width: 0;
  }

  /* Dimension row bigger, pill-like controls */
  .dimension-row .form-control,
  .dimension-row .form-select,
  .dimension-row .input-group-text {
    height: 64px !important;
    min-height: 64px !important;
    border-radius: 16px !important;
    font-size: 1.05rem;
    padding: 14px 16px !important;
  }
  .dimension-row .unit-addon {
    border-radius: 16px !important;
    font-weight: 600;
  }

  /* Ensure digits are clearly visible in dimension inputs */
  .dim-input {
    color: var(--text) !important;
    background-color: var(--card) !important;
    font-size: 1.05rem !important;
    font-weight: 500;
    line-height: 1.4;
    caret-color: var(--text);
  }

  /* Remove number spinners for cleaner UI */
  .dim-input::-webkit-outer-spin-button,
  .dim-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .dim-input[type="number"] {
    -moz-appearance: textfield;
  }

  /* Normalize select appearance to align with inputs */
  .dimension-row .form-select.dim-input {
    height: 64px !important;
    min-height: 64px !important;
    padding-top: 14px !important;
    padding-bottom: 14px !important;
    line-height: 1.4 !important;
    background-position: right 12px center; /* dropdown arrow position */
  }

  .progress {
    background-color: var(--border);
    border-radius: 999px;
  }

  .form-control::placeholder {
    color: var(--muted);
    opacity: 1;
  }

  .input-group .form-control {
    position: relative;
    z-index: 1;
  }

  .unit-addon {
    background-color: var(--card);
    color: var(--text);
    font-weight: 600;
    white-space: nowrap;
    padding-inline: 14px;
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
  }

  /* ========================================
     🎨 RESPONSIVE STYLES
     ======================================== */

  /* ✅ Extra Small Screens (< 360px) */
  @media (max-width: 359.98px) {
    body, html {
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }

    .container {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
      max-width: 100% !important;
    }

    .card {
      border-radius: 8px !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .card-body {
      padding: 0.75rem !important;
    }

    h1, .h1, .display-5 {
      font-size: 1.25rem !important;
    }

    h5, .h5 {
      font-size: 1rem !important;
    }

    .form-control,
    .form-select {
      min-height: 40px !important;
      font-size: 0.875rem !important;
      padding: 8px 10px !important;
    }

    .dimension-row .form-control,
    .dimension-row .form-select {
      height: 44px !important;
      min-height: 44px !important;
      font-size: 0.85rem !important;
    }

    .btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }

    .col-6 {
      padding-left: 0.125rem !important;
      padding-right: 0.125rem !important;
    }
  }

  /* ✅ Mobile (< 576px) */
  @media (max-width: 575.98px) {
    body, html {
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }

    .container {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
      max-width: 100% !important;
    }

    .card {
      border-radius: 12px !important;
    }

    .card-body {
      padding: 1rem !important;
    }

    h1, .h1, .display-5 {
      font-size: 1.5rem !important;
    }

    h5, .h5 {
      font-size: 1.1rem !important;
    }

    .form-control,
    .form-select {
      min-height: 44px !important;
      font-size: 0.95rem !important;
      padding: 10px 12px !important;
    }

    .form-control-lg,
    .form-select-lg {
      min-height: 48px !important;
      font-size: 0.95rem !important;
    }

    .form-label {
      font-size: 0.9rem !important;
    }

    /* Dimension inputs on mobile */
    .dimension-row .form-control,
    .dimension-row .form-select,
    .dimension-row .input-group-text {
      height: 48px !important;
      min-height: 48px !important;
      border-radius: 12px !important;
      font-size: 0.9rem !important;
      padding: 10px 12px !important;
    }

    .dimension-row .form-select.dim-input {
      height: 48px !important;
      min-height: 48px !important;
      padding-top: 10px !important;
      padding-bottom: 10px !important;
    }

    .dim-input {
      font-size: 0.9rem !important;
    }

    /* Buttons */
    .btn {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .btn-lg {
      padding: 0.6rem 1.2rem;
      font-size: 0.95rem;
    }

    /* Progress bar */
    .progress {
      height: 6px !important;
    }

    /* Form text smaller */
    .form-text {
      font-size: 0.8rem;
    }

    /* Section spacing */
    .mb-5 {
      margin-bottom: 2rem !important;
    }

    .mb-4 {
      margin-bottom: 1.5rem !important;
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

    h1, .h1, .display-5 {
      font-size: 1.75rem !important;
    }

    .form-control,
    .form-select {
      min-height: 48px !important;
    }

    .dimension-row .form-control,
    .dimension-row .form-select,
    .dimension-row .input-group-text {
      height: 56px !important;
      min-height: 56px !important;
      font-size: 1rem !important;
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

  /* ✅ Prevent overflow on all screens */
  @media (max-width: 991.98px) {
    .bg-body {
      overflow-x: hidden !important;
      max-width: 100vw !important;
    }

    .row {
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .col-6 {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }
  }
`;
