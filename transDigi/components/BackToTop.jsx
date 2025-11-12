import React, { useEffect, useState } from 'react';

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      try {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        setVisible(y > 200);
      } catch {}
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Remonter en haut"
      onClick={handleClick}
      className="btn btn-primary shadow"
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '24px',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        zIndex: 1040,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <i className="bi bi-arrow-up" aria-hidden="true"></i>
    </button>
  );
}

export default BackToTop;
