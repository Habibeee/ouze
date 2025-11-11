export const modofierProfClientCss = `
  /* Brand tokens */
  :root {
    --brand-green: #28A745;
    --brand-yellow: #FFC107;
    --brand-blue: #007BFF;
    --brand-gray: #5C757D;
  }

  .brand-title { color: var(--text); }

  .brand-primary {
    background-color: var(--brand-blue) !important;
    border-color: var(--brand-blue) !important;
  }

  .profile-avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: var(--card);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 8px;
  }

  .section-title { color: var(--text); margin-bottom: 12px; }

  .input-with-icon .input-group-text { background-color: var(--card); border-right: 0; color: var(--text); }
  .input-with-icon .form-control {
    border-left: 0;
  }
  .form-control:focus, .form-select:focus { border-color: var(--bs-primary); box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25); }

  .icon-toggle {
    border-left: 0;
  }
`;
