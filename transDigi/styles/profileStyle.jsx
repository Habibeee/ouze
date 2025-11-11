export const profileStyles = {
  section: { paddingTop: 300, marginTop: -100 },
  hero: {
    background: 'var(--profile-hero-bg)',
    color: '#fff',
    borderRadius: 0,
    paddingTop:140,
    marginTop: 64,
    // Full-bleed background across viewport width
    marginLeft: 'calc(50% - 50vw)',
    marginRight: 'calc(50% - 50vw)'
  },
  heroBtn: {
    backgroundColor: 'var(--hero-btn-bg)',
    color: 'var(--hero-btn-color)',
    border: 'none',
    borderRadius: 10,
  },
  card: {
    background: 'var(--bs-body-bg)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
  },
  statCard: {
    background: 'var(--bs-body-bg)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: '50%',
    objectFit: 'cover',
    objectPosition: 'center top',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
  },
  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#e9ecef',
    fontSize: 42,
    color: '#3b3b3b',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
  },
  cta: {
    background: 'var(--cta-bg)',
    color: '#fff',
    borderRadius: 12,
  },
  ctaBtn: {
    backgroundColor: '#FFC107',
    color: '#000',
    border: 'none',
    borderRadius: 10,
  }
};
