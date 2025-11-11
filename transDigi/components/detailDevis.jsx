import React, { useState } from 'react';
import { detailDevisCss } from '../styles/detailDeviStyle.jsx';
import SideBare from './sideBare';
import { LayoutGrid, User } from 'lucide-react';

const DetailDevis = () => {
  const [prix, setPrix] = useState('');
  const [message, setMessage] = useState('');

  const envoyerDevis = (e) => {
    e.preventDefault();
  };

  const retour = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.hash = '#/dashboard-transitaire';
  };

  return (
    <div className="bg-body py-4 py-md-5">
      <style>{detailDevisCss}</style>
      <SideBare
        topOffset={96}
        activeId="dashboard"
        defaultOpen={true}
        closeOnNavigate={false}
        items={[
          { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
          { id: 'profil', label: 'Mon profil', icon: User },
        ]}
        onNavigate={(id) => {
          switch(id){
            case 'dashboard':
              window.location.hash = '#/dashboard-transitaire';
              break;
            case 'profil':
              window.location.hash = '#/profile';
              break;
            default:
              break;
          }
        }}
      />
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-9">
            <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="fw-bold mb-0 titre-page">Détails de la demande de devis</h2>
<button className="btn btn-light" onClick={retour}>Retour</button>
            </div>
            <p className="text-muted mb-4">Consultez les détails de la demande et envoyez votre proposition.</p>

            {/* Informations sur la demande */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-3 p-md-4">
                <h6 className="fw-semibold mb-3">Informations sur la demande</h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Nom du client</div>
                    <div className="fw-semibold">John Doe</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Date de la demande</div>
                    <div className="fw-semibold">23 mai 2024</div>
                        </div>
                      <div className="col-12">
                    <div className="text-muted small">Détails du transport</div>
                    <div>
                      Transport de marchandises de Paris à Marseille. La cargaison est constituée de 2 palettes de matériel électronique fragile.
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="text-muted small">Statut</div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="status-dot bg-warning"></span>
                      <span>En attente de réponse</span>
                    </div>
                  </div>
                </div>
</div>
                </div>

{/* Votre proposition */}
                <div className="card border-0 shadow-sm">
                <div className="card-body p-3 p-md-4">
                  <h6 className="fw-semibold mb-3">Votre proposition</h6>
                <form onSubmit={envoyerDevis}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Prix proposé (C)</label>
                    <input type="number" className="form-control" placeholder="Saisissez le montant en euros" value={prix} onChange={(e) => setPrix(e.target.value)} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold small">Commentaires / Message au client</label>
                    <textarea className="form-control" rows={4} placeholder="Ajoutez des détails, conditions ou un message pour le client..." value={message} onChange={(e) => setMessage(e.target.value)} />
                  </div>
                <div className="d-flex gap-2 justify-content-end">
                  <button type="submit" className="btn btn-primary">Envoyer le devis</button>
                </div>
</form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailDevis;
