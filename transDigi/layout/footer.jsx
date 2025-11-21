 import React from 'react';

function Footer() {
  const isDashboard = (() => {
    try {
      const hash = (window.location.hash || '#/').split('?')[0];
      return hash === '#/dashboard-client' || hash === '#/dashboard-transitaire' || hash === '#/dashboard-admin';
    } catch {
      return false;
    }
  })();

  const scrollToHow = (e) => {
    e.preventDefault();
    const go = () => {
      const el = document.getElementById('how-client');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    try {
      if (window.location.hash !== '#/' && window.location.hash !== '') {
        window.location.hash = '#/';
        setTimeout(go, 150);
      } else {
        go();
      }
    } catch {
      // ignorer les erreurs de navigation
    }
  };

  return (
    <footer className="bg-white border-top w-100 app-footer">
      <style>{`
        @media (max-width: 575.98px) {
          .app-footer { font-size: .9rem; }
          .app-footer h6 { font-size: .95rem; margin-bottom: .25rem; }
          .app-footer .container-fluid { padding: 1rem 1rem !important; }
          .app-footer .row { row-gap: .75rem !important; }
          .app-footer .list-unstyled { gap: .25rem !important; }
          .app-footer a { color: #5C757D; }
          .app-footer .brand { gap: .5rem !important; }
          .app-footer .brand img { height: 30px !important; width: auto !important; }
          .app-footer .legal { font-size: .8rem; padding: .75rem 1rem; }
        }
      `}</style>
      {isDashboard ? (
        <>
          <div className="container-fluid py-4 px-0">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 mx-0">
              <div className="d-flex align-items-center gap-2 mb-2 brand">
                <img src={'/logo1.png'} alt="Transdigi Sénégal" style={{ height: 36, width: 'auto' }} />
                <strong style={{ color: '#28A745' }}>TransdigiSN</strong>
              </div>
              <p className="mb-0 text-muted">
                La plateforme de référence pour la mise en relation avec des transitaires au Sénégal
              </p>
            </div>
          </div>
          <div className="border-top text-center py-3 text-muted small legal">
            © 2025 TransdigiSN. Tous droits réservés.
          </div>
        </>
      ) : (
        <>
          <div className="container-fluid py-4 px-0">
            <div className="row g-0 align-items-stretch mx-0">
              <div className="col-12 col-lg-4 d-flex flex-column h-100 justify-content-end ps-lg-0">
                <div className="d-flex align-items-center gap-2 mb-2 brand">
                  <img src={'/logo1.png'} alt="Transdigi Sénégal" style={{ height: 36, width: 'auto' }} />
                  <strong style={{ color: '#28A745' }}>TransdigiSN</strong>
                </div>
                <p className="mb-0 text-muted">La plateforme de référence pour la mise en relation avec des transitaires au Sénégal</p>
              </div>
              <div className="col-6 col-lg-2">
                <h6 className="fw-bold mb-2">Liens rapides</h6>
                <ul className="list-unstyled mb-0 d-grid gap-1">
                  <li><a className="text-decoration-none" href="#/connexion" style={{ color: '#5C757D' }}>Trouver un transitaire</a></li>
                  <li><a className="text-decoration-none" href="#/" onClick={scrollToHow} style={{ color: '#5C757D' }}>Comment ça marche</a></li>
                  <li><a className="text-decoration-none" href="#/contact" style={{ color: '#5C757D' }}>Contact</a></li>
                </ul>
              </div>
              <div className="col-6 col-lg-3">
                <h6 className="fw-bold mb-2">Professionnels</h6>
                <ul className="list-unstyled mb-0 d-grid gap-1">
                  <li><a className="text-decoration-none" href="#/transitaire" style={{ color: '#5C757D' }}>Devenir transitaire</a></li>
                  <li><a className="text-decoration-none" href="#/connexion" style={{ color: '#5C757D' }}>Connexion pro</a></li>
                </ul>
              </div>
              <div className="col-12 col-lg-3">
                <h6 className="fw-bold mb-2">Légal</h6>
                <ul className="list-unstyled mb-0 d-grid gap-1">
                  <li><a className="text-decoration-none" href="#cgu" style={{ color: '#5C757D' }}>Conditions d'utilisation</a></li>
                  <li><a className="text-decoration-none" href="#privacy" style={{ color: '#5C757D' }}>Politique de confidentialité</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-top text-center py-3 text-muted small legal">© 2025 TransdigiSN. Tous droits réservés.</div>
        </>
      )}
    </footer>
  );
}

export default Footer;
