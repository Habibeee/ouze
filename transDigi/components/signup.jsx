import React from 'react';

function Signup() {
  return (
    <section className="py-5 bg-body">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="text-center mb-4">
              <h1 className="fw-bold mb-2">Créer un compte</h1>
              <p className="text-muted mb-0">Choisissez votre profil pour continuer</p>
            </div>

            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="p-4 border rounded-4 h-100 d-flex flex-column align-items-center text-center">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, background: 'var(--bs-primary)', color: '#fff' }}>
                    <i className="bi bi-person"></i>
                  </div>
                  <h5 className="fw-semibold mb-2">Client</h5>
                  <p className="text-muted">Demandez des devis et suivez vos expéditions.</p>
                  <a href="#/client" className="btn btn-success fw-semibold mt-auto">Continuer en tant que client</a>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="p-4 border rounded-4 h-100 d-flex flex-column align-items-center text-center">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, background: 'var(--bs-warning)', color: '#000' }}>
                    <i className="bi bi-truck"></i>
                  </div>
                  <h5 className="fw-semibold mb-2">Transitaire</h5>
                  <p className="text-muted">Rejoignez notre réseau et recevez des demandes.</p>
                  <a href="#/transitaire" className="btn btn-primary fw-semibold mt-auto">Continuer en tant que transitaire</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Signup;
