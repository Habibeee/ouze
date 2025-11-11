export const historiqueDevisCss = `
  :root {
    --brand-green: #28A745;
    --brand-yellow: #FFC107;
    --brand-blue: #007BFF;
    --text-muted: #6c757d;
  }

  .filter-select {
    min-width: 190px;
  }

  .quotes-table thead th {
    color: #6b7280;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }
  .quotes-table tbody td {
    border-top: 1px solid #f1f5f9;
  }

  .badge-status {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .badge-status.success {
    background: #E8F5E9;
    color: var(--brand-green);
  }
  .badge-status.warning {
    background: #FFF8E1;
    color: #F59E0B;
  }
  .badge-status.danger {
    background: #FEE2E2;
    color: #DC2626;
  }
  .badge-status.muted {
    background: #E5E7EB;
    color: #374151;
  }
`;
