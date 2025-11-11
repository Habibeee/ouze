export const modifierMdpStyles = {
  section: { minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 96, paddingBottom: 32 },
  card: { borderRadius: 16, background: 'var(--bs-body-bg)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
  iconWrap: { width: 56, height: 56, backgroundColor: '#E6F2FF', color: '#0d6efd' },
  title: { color: '#0b2a64' },
  submitBtn: { backgroundColor: '#28a745', color: '#fff' },
  backBtn: { backgroundColor: '#0d6efd', color: '#fff' },
  link: { color: '#0d6efd' },
};

export const modifierMdpCss = `
  @media (max-width: 576px) {
    section { padding-top: 80px !important; }
  }
`;
