export const suiviEnvoiCss = `
  .nav-tabs .nav-link.active {
    background-color: transparent;
  }
  .dropdown .btn-light {
    border: 1px solid #e9ecef;
  }
  .badge {
    font-weight: 600;
  }
  /* Shipment card */
  .shipment-card {
    border-color: #e9ecef !important;
  }
  .carrier-pill {
    display: inline-block;
    background-color: #e3f2fd;
    color: #0d6efd;
    border-radius: 9999px;
    padding: 4px 10px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .progress-thick {
    height: 8px !important;
    background-color: #e9ecef;
  }
  .progress-green {
    background-color: #28A745 !important;
  }
  /* Timeline */
  .timeline {
    position: relative;
    padding-left: 18px;
  }
  .timeline-item {
    position: relative;
    gap: 12px;
    margin-bottom: 18px;
  }
  .timeline-axis {
    width: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .timeline-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #d0d5dd; /* gris clair */
    margin-top: 4px;
  }
  .timeline-dot.is-current {
    background-color: #28A745; /* vert */
    box-shadow: 0 0 0 3px rgba(40,167,69,0.2);
  }
  .timeline-line {
    width: 2px;
    background-color: #e5e7eb; /* gris clair */
    flex: 1;
    margin-top: 6px;
  }
  .timeline-content p {
    margin: 0;
  }
  .timeline-content .fw-bold {
    font-size: 0.95rem;
  }
  .timeline-content .small {
    color: #6c757d !important;
  }
`;
