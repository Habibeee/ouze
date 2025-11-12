import React from 'react';
import { useI18n } from '../src/i18n.jsx';

function Signup() {
  const { t } = useI18n();
  return (
    <section className="py-5 bg-body">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="text-center mb-4">
              <h1 className="fw-bold mb-2">{t('signup.title')}</h1>
              <p className="text-muted mb-0">{t('signup.subtitle')}</p>
            </div>

            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="p-4 border rounded-4 h-100 d-flex flex-column align-items-center text-center">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, background: 'var(--bs-primary)', color: '#fff' }}>
                    <i className="bi bi-person"></i>
                  </div>
                  <h5 className="fw-semibold mb-2">{t('signup.client.title')}</h5>
                  <p className="text-muted">{t('signup.client.desc')}</p>
                  <a href="#/client" className="btn btn-success fw-semibold mt-auto">{t('signup.client.cta')}</a>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="p-4 border rounded-4 h-100 d-flex flex-column align-items-center text-center">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, background: 'var(--bs-warning)', color: '#000' }}>
                    <i className="bi bi-truck"></i>
                  </div>
                  <h5 className="fw-semibold mb-2">{t('signup.forwarder.title')}</h5>
                  <p className="text-muted">{t('signup.forwarder.desc')}</p>
                  <a href="#/transitaire" className="btn btn-primary fw-semibold mt-auto">{t('signup.forwarder.cta')}</a>
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
