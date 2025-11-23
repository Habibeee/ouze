import React, { useEffect, useMemo, useState } from 'react';
import SideBare from './sideBare.jsx';
import { LayoutGrid, Search, FileText, Clock, Truck, User } from 'lucide-react';
import { listMesDevis, getMonDevisById, cancelDevis as cancelDevisApi } from '../services/apiClient.js';
import { useToast } from './ui/ToastProvider.jsx';

const DetailDevisClient = () => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const toast = useToast();
  const [item, setItem] = useState(null);

  // Force le téléchargement pour les URLs Cloudinary (fl_attachment)
  const toDownloadUrl = (url, name) => {
    if (!url) return url;
    try {
      const u = new URL(url);
      if (!u.hostname.includes('res.cloudinary.com')) return url;
    } catch {
      return url;
    }
    if (url.includes('/upload/')) {
      const safeName = (name || 'document').toString().replace(/[^a-z0-9._-]/gi, '_');
      const parts = url.split('/upload/');
      return `${parts[0]}/upload/fl_attachment:${safeName}/${parts[1]}`;
    }
    return url;
  };

  const triggerDownload = (urlRaw, name) => {
    if (!urlRaw) return;
    const safeName = (name || 'document').toString();
    const url = toDownloadUrl(urlRaw, safeName);
    try {
      const a = document.createElement('a');
      a.href = url || urlRaw;
      a.download = safeName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      try { window.open(url || urlRaw, '_blank'); } catch {}
    }
  };

  const idFromHash = useMemo(() => {
    try {
      const h = window.location.hash || '';
      const p = h.split('?');
      const q = new URLSearchParams(p[1] || '');
      return q.get('id');
    } catch { return null; }
  }, []);

  const normalize = (raw) => {
    const v = (raw || '').toString().toLowerCase();
    if (v.includes('appr') || v.includes('accept')) return 'accepte';
    if (v.includes('refus')) return 'refuse';
    if (v.includes('annul')) return 'annule';
    return 'attente';
  };

  const load = async () => {
    try {
      setLoading(true); setErr('');
      let found = null;
      try {
        const res = await getMonDevisById(idFromHash);
        found = res?.devis || null;
      } catch {}
      if (!found) {
        const data = await listMesDevis();
        const devis = Array.isArray(data?.devis) ? data.devis : [];
        found = devis.find(d => (d._id || d.id || d.numero || d.reference) === idFromHash) || null;
      }
      if (!found) { setErr('Devis introuvable'); setItem(null); return; }
      const norm = normalize(found.statut || found.status);
      const clientFiles = Array.isArray(found.clientFichiers)
        ? found.clientFichiers
        : (found.clientFichiers ? [found.clientFichiers] : (found.clientFichier ? [found.clientFichier] : []));
      const transFiles = Array.isArray(found.reponseFichiers)
        ? found.reponseFichiers
        : (found.reponseFichiers ? [found.reponseFichiers] : (found.reponseFichier ? [found.reponseFichier] : []));
      setItem({
        id: found._id || found.id || '#',
        translataire: found.translataire || '',
        date: found.createdAt ? new Date(found.createdAt).toISOString().slice(0,10) : '',
        typeService: found.typeService || '',
        description: found.description || '',
        origin: found.origin || found.origine || '',
        destination: found.destination || found.route || '',
        expiration: found.dateExpiration ? new Date(found.dateExpiration).toISOString().slice(0,10) : '',
        statut: norm,
        montantEstime: typeof found.montantEstime !== 'undefined' ? found.montantEstime : null,
        clientFiles,
        transFiles,
      });
    } catch (e) {
      setErr(e?.message || 'Erreur de chargement');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async () => {
    if (!item?.id) return;
    if (!window.confirm('Voulez-vous annuler ce devis ?')) return;
    try {
      await cancelDevisApi(item.id);
      await load();
      toast.success('Devis annulé avec succès.');
    } catch (e) {
      toast.error(e?.message || 'Erreur lors de l\'annulation');
    }
  };

  return (
    <div className="d-flex bg-body" style={{ minHeight: '100vh' }}>
      <SideBare
        topOffset={96}
        activeId="historique"
        defaultOpen={true}
        closeOnNavigate={false}
        items={[
          { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
          { id: 'recherche', label: 'Trouver un transitaire', icon: Search },
          { id: 'devis', label: 'Nouveau devis', icon: FileText },
          { id: 'historique', label: 'Historique', icon: Clock },
          { id: 'envois', label: 'Suivi des envois', icon: Truck },
          { id: 'profile', label: 'Mon profil', icon: User },
        ]}
        onNavigate={(id) => {
          switch(id){
            case 'dashboard': window.location.hash = '#/dashboard-client'; break;
            case 'recherche': window.location.hash = '#/recherche-transitaire'; break;
            case 'devis': window.location.hash = '#/nouveau-devis'; break;
            case 'historique': window.location.hash = '#/historique'; break;
            case 'envois': window.location.hash = '#/envois'; break;
            case 'profile': window.location.hash = '#/profil-client'; break;
            default: break;
          }
        }}
      />
      <div className="flex-grow-1">
        <div className="container py-4 py-md-5">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="fw-bold mb-0">Détails du devis</h2>
            <button className="btn btn-light" onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.hash = '#/historique'; }}>Retour</button>
          </div>

          {err && <div className="alert alert-danger" role="alert">{err}</div>}
          {loading && <div className="text-muted">Chargement...</div>}

          {!loading && !err && item && (
            <div className="row g-4">
              <div className="col-12 col-lg-8">
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <div className="text-muted small">Numéro de devis</div>
                        <div className="fw-semibold">{item.id}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="text-muted small">Transitaire</div>
                        <div className="fw-semibold">{item.translataire || '-'}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="text-muted small">Date de la demande</div>
                        <div className="fw-semibold">{item.date || '-'}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="text-muted small">Statut</div>
                        <div>
                          <span className={`badge ${item.statut === 'accepte' ? 'bg-success-subtle text-success' : item.statut === 'attente' ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'}`}>
                            {item.statut === 'accepte' ? 'Approuvé' : item.statut === 'attente' ? 'En attente' : item.statut === 'refuse' ? 'Refusé' : 'Annulé'}
                          </span>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="text-muted small">Type de service</div>
                        <div className="fw-semibold">{item.typeService || '-'}</div>
                      </div>
                      <div className="col-12">
                        <div className="text-muted small">Description</div>
                        <div>{item.description || '-'}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="text-muted small">Origine</div>
                        <div className="fw-semibold">{item.origin || '-'}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="text-muted small">Destination</div>
                        <div className="fw-semibold">{item.destination || '-'}</div>
                      </div>
                      {typeof item.montantEstime !== 'undefined' && item.montantEstime !== null && (
                        <div className="col-12 col-md-6">
                          <div className="text-muted small">Montant proposé par le transitaire</div>
                          <div className="fw-semibold">{String(item.montantEstime)}</div>
                        </div>
                      )}
                      {item.expiration && (
                        <div className="col-12 col-md-6">
                          <div className="text-muted small">Date d'expiration</div>
                          <div className="fw-semibold">{item.expiration}</div>
                        </div>
                      )}
                      {item.clientFiles && item.clientFiles.length > 0 && (
                        <div className="col-12">
                          <div className="text-muted small">Pièces jointes envoyées au transitaire</div>
                          <ul className="small mb-0">
                            {item.clientFiles.map((f, idx) => {
                              const url = (f && typeof f === 'object') ? (f.url || f.link || f.location) : f;
                              const name = (f && typeof f === 'object') ? (f.name || f.filename || f.originalName || `Pièce jointe ${idx + 1}`) : `Pièce jointe ${idx + 1}`;
                              if (!url) return null;
                              return (
                                <li key={idx}>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0 align-baseline"
                                    onClick={() => triggerDownload(url, name)}
                                  >
                                    {name}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-grid gap-2">
                      <a className="btn btn-outline-secondary" href={`#/historique`}>Retour à l'historique</a>
                      {item.statut === 'attente' && (
                        <button className="btn btn-outline-danger" onClick={handleCancel}>Annuler le devis</button>
                      )}
                      <a className="btn btn-outline-primary" href="#/fichiers-recus">
                        Aller à mes fichiers reçus
                      </a>
                      {item.transFiles && item.transFiles.length > 0 && (
                        <div className="mt-2">
                          <div className="text-muted small mb-1">Documents envoyés par le transitaire</div>
                          <ul className="small mb-0">
                            {item.transFiles.map((f, idx) => {
                              const url = (f && typeof f === 'object') ? (f.url || f.link || f.location) : f;
                              const name = (f && typeof f === 'object') ? (f.name || f.filename || f.originalName || `Document ${idx + 1}`) : `Document ${idx + 1}`;
                              if (!url) return null;
                              return (
                                <li key={idx}>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0 align-baseline"
                                    onClick={() => triggerDownload(url, name)}
                                  >
                                    {name}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {item.reponse && (
                        <div className="mt-2 small text-muted">
                          <span className="d-block fw-semibold">Message du transitaire</span>
                          <span>{item.reponse}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailDevisClient;
