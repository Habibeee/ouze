export const indexStyles = {
  // Hero section heights (adjust when header height changes)
  heroSection: { 
    minHeight: '100vh', 
    margin: '0', 
    padding: '0',
    position: 'relative',
    top: '0',
    left: '0',
    width: '100%',
    overflow: 'hidden'
  },
  heroInner: { 
    minHeight: '100vh',
    margin: '0',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2
  },
  // Images
  coverImg: { objectFit: 'cover' },
  // Service icons - Nouvelles couleurs de la charte
  serviceIconBlue: { width: 56, height: 56, background: 'var(--bs-primary)' }, // Bleu principal
  serviceIconOrange: { width: 56, height: 56, background: 'var(--bs-warning)' }, // Jaune
  serviceIconGreen: { width: 56, height: 56, background: 'var(--bs-success)' }, // Vert principal
  // Avatars (testimonials)
  avatar: { width: 48, height: 48 },
  // Emoji icon size inside service cards
  emojiIcon: { fontSize: 24 },
  // Nouvelles couleurs de la charte graphique
  colors: {
    green: 'var(--bs-success)',
    yellow: 'var(--bs-warning)',
    blue: 'var(--bs-primary)',
    gray: 'var(--bs-secondary)',
    lightGreen: '#eafaf0',
    lightYellow: '#fff8e6',
    lightBlue: '#e6f2ff',
  }
};

export const COLORS = {
  green: 'var(--bs-success)',
  yellow: 'var(--bs-warning)',
  blue: 'var(--bs-primary)'
};

