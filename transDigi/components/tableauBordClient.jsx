import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Search, FileText, Truck, Clock, Settings, LogOut,
  CheckCircle, Mail, XCircle, X, User, Bell
} from 'lucide-react';
import { clientStyles, clientCss } from '../styles/tableauBordClientStyle.jsx';
import SideBare from './sideBare';
import RechercheTransitaire from './rechercheTransitaire.jsx';
import NouveauDevis from './nouveauDevis.jsx';
import TrackingApp from './suiviEnvoi.jsx';
import ModofierProfClient from './modofierProfClient.jsx';
import HistoriqueDevis from './historiqueDevis.jsx';

const ClientDashboard = () => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [section, setSection] = useState(() => (typeof window !== 'undefined' && window.location.hash === '#/historique') ? 'historique' : 'dashboard');
  const chartId = 'clientActivityChart';
  const avatarUrl = 'https://i.pravatar.cc/64?img=5';

  // Sync section with current hash (so #/historique opens Historique with sidebar)
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (hash === '#/historique') {
        setSection('historique');
      } else if (hash === '#/dashboard-client') {
        setSection('dashboard');
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  // Dessin de la courbe sur canvas (simple, sans lib)
  useEffect(() => {
    if (section !== 'dashboard') return;
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : 800;
    const height = 300;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Données d'exemple "réelles" (expéditions par mois)
    const data = [5, 8, 12, 15, 13, 19, 24, 22, 27, 30, 28, 34];
    const padding = 40;
    const maxVal = Math.max(...data) * 1.1;
    const stepX = (width - padding * 2) / (data.length - 1);

    // Fond
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Grille horizontale
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + ((height - padding * 2) * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Courbe
    const toY = (v) => height - padding - (v / maxVal) * (height - padding * 2);
    ctx.strokeStyle = clientStyles.primary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = padding + i * stepX;
      const y = toY(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Zone sous la courbe
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(14,165,233,0.25)');
    gradient.addColorStop(1, 'rgba(14,165,233,0)');
    ctx.fillStyle = gradient;
    ctx.lineTo(padding + (data.length - 1) * stepX, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();
  }, [section]);

  const [devis, setDevis] = useState([
    { id: '#12345', destination: 'New York, USA', status: 'approuve', statusLabel: 'Approuvé', statusColor: '#E8F5E9', statusTextColor: '#28A745', date: '2023-10-27' },
    { id: '#12346', destination: 'Londres, UK', status: 'en-attente', statusLabel: 'En attente', statusColor: '#FFF9E6', statusTextColor: '#F57C00', date: '2023-10-26' },
  ]);

  const cancelDevis = (id) => {
    const ok = window.confirm('Confirmer l\'annulation de ce devis ?');
    if (!ok) return;
    setDevis(prev => prev.map(d => d.id === id ? {
      ...d,
      status: 'annule',
      statusLabel: 'Annulé',
      statusColor: '#FEE2E2',
      statusTextColor: '#DC2626'
    } : d));
  };

  const envoysActifs = [
    { id: '#SH5829', status: 'En transit', destination: 'Los Angeles, USA' },
    { id: '#SH5830', status: 'En transit', destination: 'Shanghai, Chine' },
  ];

  const activities = [
    { type: 'success', icon: CheckCircle, bgColor: '#E8F5E9', iconColor: '#28A745', text: 'Le devis #12345 a été approuvé.', time: 'Il y a 2 heures' },
    { type: 'info', icon: Mail, bgColor: '#E3F2FD', iconColor: '#2196F3', text: 'Nouveau message de Global Forwarding Inc.', time: 'Il y a 1 jour' },
  ];

  const isLgUp = typeof window !== 'undefined' ? window.innerWidth >= 992 : false;
  const isHistoriqueHash = typeof window !== 'undefined' && window.location.hash === '#/historique';

  return (
    <div className="d-flex bg-body" style={clientStyles.layout}>
      <style>{clientCss}</style>
      {/* Sidebar (SideBare) */}
      <SideBare
        topOffset={96}
        activeId={isHistoriqueHash ? 'historique' : section}
        closeOnNavigate={false}
        defaultOpen={true}
        items={[
          { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
          { id: 'trouver-transitaire', label: 'Trouver un transitaire', icon: Search },
          { id: 'nouveau-devis', label: 'Nouveau devis', icon: FileText },
          { id: 'envois', label: 'Suivi des envois', icon: Truck },
          { id: 'historique', label: 'Historique', icon: Clock },
          { id: 'profil', label: 'Mon profil', icon: User },
        ]}
        onNavigate={(id) => {
          setSection(id);
          switch(id){
            case 'dashboard':
              window.location.hash = '#/dashboard-client';
              break;
            case 'trouver-transitaire':
              window.location.hash = '#/recherche-transitaire';
              break;
            case 'nouveau-devis':
              window.location.hash = '#/nouveau-devis';
              break;
            case 'historique':
              window.location.hash = '#/historique';
              break;
            case 'profil':
              window.location.hash = '#/profil-client';
              break;
            case 'envois':
              window.location.hash = '#/envois';
              break;
            default:
              break;
          }
        }}
      />

      {/* Main Content */}
      <div className="flex-grow-1 bg-body" style={{ marginLeft: '0' }}>
        <div className="d-flex justify-content-end align-items-center gap-2 position-relative">
          <button className="btn btn-link">
            <Bell size={20} />
          </button>
          <button className="btn p-0 border-0 bg-transparent" onClick={() => setProfileMenuOpen(!profileMenuOpen)} aria-label="Ouvrir menu profil">
            <img src={avatarUrl} alt="Profil" className="rounded-circle" style={{ width: 36, height: 36, objectFit: 'cover', border: '2px solid #e9ecef' }} />
          </button>
          {profileMenuOpen && (
            <div className="card shadow-sm" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1050, minWidth: '200px' }}>
              <div className="list-group list-group-flush">
                <button className="list-group-item list-group-item-action" onClick={() => { setProfileMenuOpen(false); setSection('profil'); }}>
                  Modifier profil
                </button>
                <button className="list-group-item list-group-item-action" onClick={() => { setProfileMenuOpen(false); window.location.hash = '#/modifierModpss'; }}>
                  Modifier mot de passe
                </button>
                <button className="list-group-item list-group-item-action text-danger" onClick={() => { setProfileMenuOpen(false); window.location.hash = '#/connexion'; }}>
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="container-fluid bg-body px-4 py-4">
          {section === 'envois' ? (
            <TrackingApp />
          ) : section === 'profil' ? (
            <ModofierProfClient />
          ) : (section === 'historique' || isHistoriqueHash) ? (
            <HistoriqueDevis />
          ) : (
            <>
              {/* Welcome Section */}
              <div className="mb-4">
                <h1 className="h2 fw-bold mb-2">Bonjour, Alex !</h1>
                <p className="text-muted">Voici un aperçu de votre activité récente.</p>
              </div>

              <div className="row g-4">
                {/* Left Column */}
                <div className="col-12 col-lg-8">
                  {/* Mes Devis Section */}
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                      <h5 className="fw-bold mb-4">Mes devis</h5>
                      <div className="table-responsive">
                        <table className="table table-hover mb-0">
                          <thead>
                            <tr>
                              <th className="border-0 pb-3">ID Devis</th>
                              <th className="border-0 pb-3">Destination</th>
                              <th className="border-0 pb-3">Statut</th>
                              <th className="border-0 pb-3">Date</th>
                              <th className="border-0 pb-3 text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {devis.map((item) => (
                              <tr key={item.id}>
                                <td className="py-3">{item.id}</td>
                                <td className="py-3">{item.destination}</td>
                                <td className="py-3">
                                  <span className="badge px-3 py-2" style={{ backgroundColor: item.statusColor, color: item.statusTextColor, fontWeight: '500' }}>
                                    {item.statusLabel}
                                  </span>
                                </td>
                                <td className="py-3 text-muted">{item.date}</td>
                                <td className="py-3 text-end">
                                  {item.status === 'en-attente' && (
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => cancelDevis(item.id)}>Annuler</button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Activity Chart */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h5 className="fw-bold mb-4">Votre activité d'expédition</h5>
                      <div style={{ height: '300px', position: 'relative' }}>
                        <canvas id={chartId} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="col-12 col-lg-4">
                  {/* Envois Actifs */}
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                      <h5 className="fw-bold mb-4">Envois actifs</h5>
                      <div className="rounded-3 mb-3 overflow-hidden" style={{ height: '200px' }}>
                        <iframe
                          title="Carte des envois"
                          src="https://www.openstreetmap.org/export/embed.html?bbox=-23.0,10.0,10.0,25.0&layer=mapnik&marker=14.7167,-17.4677"
                          style={{ border: 0, width: '100%', height: '100%' }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                      <div className="text-end">
                        <a className="small text-decoration-none" href="https://www.openstreetmap.org/?mlat=14.7167&mlon=-17.4677#map=5/14.7167/-17.4677" target="_blank" rel="noreferrer">Ouvrir la carte</a>
                      </div>
                      <div className="d-flex flex-column gap-3">
                        {envoysActifs.map((envoi, index) => (
                          <div key={index} className="d-flex align-items-start gap-3">
                            <div className="rounded-circle p-2 flex-shrink-0" style={{ backgroundColor: '#E3F2FD' }}>
                              <Truck size={20} style={{ color: clientStyles.primary }} />
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-semibold">Envoi {envoi.id} - {envoi.status}</div>
                              <div className="text-muted small">Vers: {envoi.destination}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h5 className="fw-bold mb-4">Activité récente</h5>
                      <div className="d-flex flex-column gap-3">
                        {activities.map((activity, index) => {
                          const Icon = activity.icon;
                          return (
                            <div key={index} className="d-flex gap-3">
                              <div className="rounded-circle p-2 flex-shrink-0" style={{ backgroundColor: activity.bgColor, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={20} style={{ color: activity.iconColor }} />
                              </div>
                              <div className="flex-grow-1">
                                <div className="small">{activity.text}</div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>{activity.time}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default ClientDashboard;
