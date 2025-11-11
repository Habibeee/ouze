export const gestionUtilisateurCss = `
  .form-control:focus,
  .form-select:focus {
    border-color: #28A745;
    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
  }
  
  .form-check-input:checked {
    background-color: #28A745;
    border-color: #28A745;
  }
  
  .form-check-input:focus {
    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
  }
  
  .btn-outline-secondary:hover {
    background-color: #F8F9FA;
    border-color: #DEE2E6;
  }
  
  .card {
    transition: transform 0.2s;
  }
  
  .table-hover tbody tr:hover {
    background-color: #F8F9FA;
  }
  
  .page-link {
    color: #28A745;
  }
  
  .page-link:hover {
    background-color: #E8F5E9;
    border-color: #28A745;
  }
  
  .btn:hover {
    opacity: 0.9;
  }
  
  @media (max-width: 767.98px) {
    .table {
      font-size: 0.875rem;
    }
  }
`;
