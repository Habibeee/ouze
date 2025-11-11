export const validationCompteCss = `
  /* ========================================
     🎨 STYLES RESPONSIVE - VALIDATION COMPTES
     ======================================== */

  /* Base styles */
  .page-title { 
    color: #0b5f8a; 
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
  }

  .badge-type { 
    padding: 6px 12px; 
    border-radius: 999px; 
    font-weight: 600; 
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .badge-type.client { 
    background: #e3f2fd; 
    color: #1976d2; 
  }

  .badge-type.transitaire { 
    background: #fff3e0; 
    color: #f57c00; 
  }

  .toolbar .form-select, 
  .toolbar .btn, 
  .toolbar .form-control { 
    height: 40px; 
  }

  .input-group-text {
    border-right: 0;
    background-color: #fff;
  }

  .form-control:focus {
    border-color: #0EA5E9;
    box-shadow: 0 0 0 0.2rem rgba(14, 165, 233, 0.25);
  }

  .card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .btn:hover {
    opacity: 0.9;
  }

  .table-hover tbody tr:hover {
    background-color: #F8F9FA;
  }

  /* ✅ Extra Small Screens (< 360px) */
  @media (max-width: 359.98px) {
    .container-fluid {
      padding-left: 0.25rem !important;
      padding-right: 0.25rem !important;
    }

    .page-title {
      font-size: 1.1rem !important;
    }

    .card-body {
      padding: 0.5rem !important;
    }

    .toolbar {
      gap: 0.5rem !important;
    }

    .toolbar .form-select,
    .toolbar .form-control {
      font-size: 0.85rem;
      height: 36px !important;
    }

    .btn-sm {
      padding: 0.2rem 0.4rem;
      font-size: 0.75rem;
    }

    .table {
      font-size: 0.75rem;
    }

    .table thead th,
    .table tbody td {
      padding: 0.35rem 0.25rem;
    }

    .badge-type {
      font-size: 0.65rem;
      padding: 4px 8px;
    }
  }

  /* ✅ Mobile (< 576px) */
  @media (max-width: 575.98px) {
    body, html {
      overflow-x: hidden !important;
    }

    .container-fluid {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }

    .page-title {
      font-size: 1.35rem;
      margin-bottom: 1rem;
    }

    .card {
      margin-bottom: 0.75rem;
      border-radius: 0.5rem;
    }

    .card-body {
      padding: 0.75rem !important;
    }

    .toolbar {
      gap: 0.5rem;
    }

    .toolbar .input-group {
      max-width: 100% !important;
    }

    .toolbar .form-select,
    .toolbar .form-control {
      font-size: 0.9rem;
      height: 38px !important;
    }

    .toolbar .d-flex.gap-2 {
      width: 100%;
    }

    .toolbar .form-select {
      flex: 1;
    }

    /* Table responsive */
    .table {
      font-size: 0.85rem;
    }

    .table thead th,
    .table tbody td {
      padding: 0.5rem 0.35rem;
      white-space: nowrap;
    }

    .table thead th:nth-child(3),
    .table tbody td:nth-child(3) {
      display: none;
    }

    /* Buttons responsive */
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }

    .btn-group .btn {
      padding: 0.35rem 0.6rem;
    }

    /* Badge responsive */
    .badge-type {
      font-size: 0.7rem;
      padding: 4px 8px;
    }

    /* Avatar smaller */
    .rounded-circle {
      width: 32px !important;
      height: 32px !important;
      font-size: 11px !important;
    }

    /* Alert responsive */
    .alert {
      padding: 0.5rem;
      font-size: 0.85rem;
    }

    /* Footer pagination */
    .d-flex.flex-column.flex-sm-row {
      gap: 0.5rem;
    }

    .d-flex.flex-column.flex-sm-row small {
      font-size: 0.75rem;
    }
  }

  /* ✅ Tablette (576px - 767px) */
  @media (min-width: 576px) and (max-width: 767.98px) {
    .container-fluid {
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
    }

    .page-title {
      font-size: 1.5rem;
    }

    .card-body {
      padding: 1rem !important;
    }

    .toolbar .input-group {
      max-width: 100%;
    }

    .table {
      font-size: 0.9rem;
    }

    .table thead th,
    .table tbody td {
      padding: 0.6rem 0.5rem;
    }
  }

  /* ✅ Desktop Small (768px - 991px) */
  @media (min-width: 768px) and (max-width: 991.98px) {
    .container-fluid {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }

    .page-title {
      font-size: 1.65rem;
    }

    .card-body {
      padding: 1.25rem !important;
    }

    .toolbar .input-group {
      max-width: 450px;
    }

    .table {
      font-size: 0.95rem;
    }
  }

  /* ✅ Desktop Large (≥ 992px) */
  @media (min-width: 992px) {
    .container-fluid {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }

    .page-title {
      font-size: 1.75rem;
    }

    .toolbar .input-group {
      max-width: 420px;
    }

    .table {
      font-size: 1rem;
    }

    .table thead th,
    .table tbody td {
      padding: 0.75rem 1rem;
    }
  }

  /* ========================================
     🎨 ANIMATIONS & TRANSITIONS
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

  .alert {
    animation: fadeIn 0.2s ease-in-out;
  }

  /* ========================================
     🎨 DARK MODE SUPPORT
     ======================================== */

  @media (prefers-color-scheme: dark) {
    .card {
      background-color: #1e1e1e;
      color: #ffffff;
    }

    .table-hover tbody tr:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }

    .text-muted {
      color: #9ca3af !important;
    }

    .bg-light {
      background-color: #2d2d2d !important;
    }
  }

  /* ========================================
     🎨 PRINT STYLES
     ======================================== */

  @media print {
    .btn,
    .toolbar,
    .alert {
      display: none !important;
    }

    .card {
      box-shadow: none !important;
      border: 1px solid #ddd !important;
    }

    .table {
      page-break-inside: avoid;
    }
  }
`;
