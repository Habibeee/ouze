export const gestionTransitaireCss = `
  .toolbar .form-select,
  .toolbar .form-control {
    max-width: 260px;
  }
  .badge-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 12px;
  }
  .badge-status.success { background: #E8F5E9; color: #28A745; }
  .badge-status.danger { background: #FFEBEE; color: #F44336; }
  .badge-status.secondary { background: #ECEFF1; color: #607D8B; }
  .table thead th { white-space: nowrap; }
  .actions .btn { padding: 6px 10px; }
`;
