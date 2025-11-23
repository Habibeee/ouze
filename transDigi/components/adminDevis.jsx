import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { listAdminDevis, archiveAdminDevis, listAdminTranslataires, assignAdminDevisToTranslataire } from '../services/apiClient.js';

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

const normalizeStatus = (raw) => {
  const v = (raw || '').toString().toLowerCase();
  if (v.includes('attent') || v.includes('pending')) return 'en_attente';
  if (v.includes('accep')) return 'accepte';
  if (v.includes('trait')) return 'traite';
  if (v.includes('archiv')) return 'archive';
  if (v.includes('annul') || v.includes('cancel')) return 'annule';
  if (v.includes('refus') || v.includes('rej')) return 'refuse';
  return v || 'en_attente';
};

const extractClient = (d = {}) => {
  const c = d.client || d.clientInfo || d.user || d.owner || {};
  const nom = c.nom || c.lastName || c.lastname || d.clientName || '';
  const prenom = c.prenom || c.firstName || c.firstname || '';
  const email = c.email || d.clientEmail || d.email || '';
  const phone = c.telephone || c.phone || d.telephone || d.phone || '';
  return {
    name: `${prenom} ${nom}`.trim() || nom || prenom || email || phone || '-',
    email,
    phone,
  };
};

const extractRoute = (d = {}) => {
  const from = d.origin || d.origine || d.depart || d.from || '';
  const to = d.destination || d.arrivee || d.to || '';
  if (from || to) return `${from || '-'} → ${to || '-'}`;
  return d.description || d.typeService || '';
};

const extractDetails = (d = {}) => {
  const marchandise = d.typeMarchandise || d.marchandise || d.cargoType || '';
  const poids = d.poids || d.weight || '';
  const volume = d.volume || d.cubic || '';
  const mode = d.modeTransport || d.mode || '';
  const dimensions = d.dimensions || d.dimension || '';
  const notes = d.notes || d.commentaires || d.comment || '';
  let docs = d.documents || d.docs || d.fichiers || d.files || [];
  // Inclure aussi les fichiers explicitement marqués côté client
  if (Array.isArray(d.clientFichiers) && d.clientFichiers.length) {
    docs = docs.concat(d.clientFichiers);
  } else if (d.clientFichier) {
    docs = docs.concat([d.clientFichier]);
  }
  return { marchandise, poids, volume, mode, dimensions, notes, docs };
};

const AdminDevis = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState(null);
  const [translataires, setTranslataires] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedTranslataireId, setSelectedTranslataireId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await listAdminDevis({ page, limit });
        const list = res?.items || res?.devis || res || [];
        const mapped = list.map((d) => {
          const id = d._id || d.id || '';
          const client = extractClient(d);
          const route = extractRoute(d);
          const det = extractDetails(d);
          const created = d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : '';
          const statut = normalizeStatus(d.statut || d.status);
          return { id, client, route, created, statut, details: det, raw: d };
        });
        setRows(mapped);
        setTotal(Number(res?.total || res?.count || list.length) || list.length);
      } catch (e) {
        setError(e?.message || 'Erreur de chargement des devis');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, limit]);

  useEffect(() => {
    const loadTranslataires = async () => {
      try {
        const res = await listAdminTranslataires({ page: 1, limit: 100, isApproved: true });
        const list = res?.translataires || res?.items || [];
        setTranslataires(list);
      } catch (e) {
        console.error('Erreur chargement transitaires pour assignation devis:', e?.message);
      }
    };
    loadTranslataires();
  }, []);

  const handleArchive = async (id) => {
    if (!id) return;
    if (!window.confirm("Archiver ce devis ? Il restera accessible dans l'historique admin.")) return;
    try {
      await archiveAdminDevis(id);
      // Recharger la page courante
      const res = await listAdminDevis({ page, limit });
      const list = res?.items || res?.devis || res || [];
      const mapped = list.map((d) => {
        const cid = d._id || d.id || '';
        const client = extractClient(d);
        const route = extractRoute(d);
        const det = extractDetails(d);
        const created = d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : '';
        const statut = normalizeStatus(d.statut || d.status);
        return { id: cid, client, route, created, statut, details: det, raw: d };
      });
      setRows(mapped);
      setTotal(Number(res?.total || res?.count || list.length) || list.length);
    } catch (e) {
      alert(e?.message || "Erreur lors de l'archivage");
    }
  };

  const filtered = useMemo(() => {
    let rs = rows;
    if (query) {
      const q = query.toLowerCase();
      rs = rs.filter((r) => {
        const route = (r.route || '').toLowerCase();
        return (
          (r.id || '').toLowerCase().includes(q) ||
          (r.client.name || '').toLowerCase().includes(q) ||
          (r.client.email || '').toLowerCase().includes(q) ||
          route.includes(q)
        );
      });
    }
    // Dans la vue principale, on peut choisir de masquer les archivé si besoin
    return rs;
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const pageRows = filtered.slice((page - 1) * limit, page * limit);

  const handleAssignToTranslataire = async () => {
    if (!detail || !detail.id) return;
    if (!selectedTranslataireId) {
      alert('Veuillez choisir un transitaire.');
      return;
    }
    if (!window.confirm('Envoyer ce devis à ce transitaire ?')) return;
    try {
      setAssignLoading(true);
      await assignAdminDevisToTranslataire(detail.id, selectedTranslataireId);
      // Rechargement des devis admin pour mettre à jour le statut
      const res = await listAdminDevis({ page, limit });
      const list = res?.items || res?.devis || res || [];
      const mapped = list.map((d) => {
        const cid = d._id || d.id || '';
        const client = extractClient(d);
        const route = extractRoute(d);
        const det = extractDetails(d);
        const created = d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : '';
        const statut = normalizeStatus(d.statut || d.status);
        return { id: cid, client, route, created, statut, details: det, raw: d };
      });
      setRows(mapped);
      setTotal(Number(res?.total || res?.count || list.length) || list.length);
      // Fermer le panneau de détail après assignation
      setDetail(null);
      setSelectedTranslataireId('');
    } catch (e) {
      alert(e?.message || "Erreur lors de l'envoi du devis au transitaire");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm mt-3">
      <div className="card-header bg-white border-0 pb-0">
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-2">
          <h5 className="mb-0 fw-bold">Devis reçus (Admin)</h5>
          <div className="d-flex gap-2 align-items-center">
            <div className="position-relative">
              <Search size={18} className="text-muted" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="form-control ps-4"
                placeholder="Rechercher par client, ID ou trajet"
                value={query}
                onChange={(e) => { setPage(1); setQuery(e.target.value); }}
                style={{ minWidth: 240 }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="card-body p-0 mt-3">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th className="d-none d-lg-table-cell">Contact</th>
                <th>Date</th>
                <th className="d-none d-md-table-cell">Trajet</th>
                <th>Statut</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">Chargement...</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={7} className="text-center text-danger py-4">{error}</td>
                </tr>
              )}
              {!loading && !error && pageRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.client.name}</td>
                  <td className="d-none d-lg-table-cell">
                    <div className="small text-muted">{r.client.email}</div>
                    <div className="small text-muted">{r.client.phone}</div>
                  </td>
                  <td>{r.created}</td>
                  <td className="d-none d-md-table-cell">{r.route}</td>
                  <td className="text-capitalize">{r.statut}</td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setDetail(r)}
                      >
                        Détails
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleArchive(r.id)}
                      >
                        Archiver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !error && pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">Aucun devis trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center p-3 border-top">
          <small className="text-muted">
            Page {page} sur {totalPages}
          </small>
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: 80 }}
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value) || 10); setPage(1); }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}/p</option>
              ))}
            </select>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft size={14} />
                </button>
              </li>
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight size={14} />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {detail && (
        <div className="offcanvas offcanvas-end show" style={{ visibility: 'visible', width: '420px' }} tabIndex="-1" aria-modal="true" role="dialog">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Détails du devis</h5>
            <button type="button" className="btn-close text-reset" aria-label="Fermer" onClick={() => setDetail(null)}></button>
          </div>
          <div className="offcanvas-body">
            {(() => {
              const raw = detail.raw || {};
              const typeService = raw.typeService || '-';
              const description = raw.description || '';
              const origin = raw.origin || raw.origine || '';
              const destination = raw.destination || raw.arrivee || '';
              const montant = raw.montantEstime;
              const clientFiles = Array.isArray(raw.clientFichiers)
                ? raw.clientFichiers
                : (raw.clientFichiers ? [raw.clientFichiers] : (raw.clientFichier ? [raw.clientFichier] : []));
              const hasClientFiles = clientFiles && clientFiles.length;
              const statutNorm = normalizeStatus(raw.statut || raw.status || detail.statut);
              const alreadyForwarded = !!raw.forwardedToTranslataire;

              const asStatusBadge = (s) => {
                const v = (s || '').toString().toLowerCase();
                if (v.includes('attent') || v.includes('pending')) return { bg: '#FFF3E0', fg: '#F57C00', label: 'En attente' };
                if (v.includes('accep')) return { bg: '#E3F2FD', fg: '#1976D2', label: 'Accepté' };
                if (v.includes('refus') || v.includes('rej')) return { bg: '#FFEBEE', fg: '#C62828', label: 'Refusé' };
                if (v.includes('annul') || v.includes('cancel')) return { bg: '#F3E5F5', fg: '#6A1B9A', label: 'Annulé' };
                if (v.includes('archiv') || v.includes('traite')) return { bg: '#E8F5E9', fg: '#2E7D32', label: 'Traité / Archivé' };
                return { bg: '#ECEFF1', fg: '#37474F', label: s || 'Statut inconnu' };
              };
              const badge = asStatusBadge(statutNorm);

              return (
                <>
                  <div className="mb-3">
                    <div className="text-muted small">ID</div>
                    <div className="fw-semibold">{detail.id}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small">Client</div>
                    <div className="fw-semibold">{detail.client.name}</div>
                    <div className="small text-muted">{detail.client.email || '-'}</div>
                    <div className="small text-muted">{detail.client.phone || '-'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small">Type de service</div>
                    <div className="fw-semibold">{typeService}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small">Origine</div>
                    <div className="fw-semibold">{origin || '-'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small">Destination</div>
                    <div className="fw-semibold">{destination || '-'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small">Itinéraire</div>
                    <div className="fw-semibold">{detail.route || '-'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted small">Date de création</div>
                    <div className="fw-semibold">{detail.created || '-'}</div>
                  </div>
                  {description && (
                    <div className="mb-3">
                      <div className="text-muted small">Description</div>
                      <div>{description}</div>
                    </div>
                  )}
                  {typeof montant !== 'undefined' && montant !== null && (
                    <div className="mb-3">
                      <div className="text-muted small">Montant estimé (client)</div>
                      <div className="fw-semibold">{String(montant)}</div>
                    </div>
                  )}
                  {hasClientFiles && (
                    <div className="mb-3">
                      <div className="text-muted small">Pièces jointes du client</div>
                      <ul className="small mb-0">
                        {clientFiles.map((f, idx) => {
                          const url = (f && typeof f === 'object') ? (f.url || f.link || f.location) : f;
                          const name = (f && typeof f === 'object') ? (f.name || f.filename || f.originalName || `Fichier ${idx + 1}`) : `Fichier ${idx + 1}`;
                          if (!url) return null;
                          return (
                            <li key={idx}>
                              <a href={toDownloadUrl(url, name)} download>{name}</a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-muted small">Statut</div>
                    <span className="badge px-3 py-2" style={{ backgroundColor: badge.bg, color: badge.fg, fontWeight: 500 }}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Assignation à un transitaire */}
                  <div className="mb-4">
                    <div className="text-muted small mb-1">Envoyer ce devis à un transitaire</div>
                    {alreadyForwarded ? (
                      <p className="small text-muted mb-0">
                        Ce devis a déjà été transmis à un transitaire.
                      </p>
                    ) : (
                      <>
                        <select
                          className="form-select mb-2"
                          value={selectedTranslataireId}
                          onChange={(e) => setSelectedTranslataireId(e.target.value)}
                        >
                          <option value="">Choisir un transitaire...</option>
                          {translataires.map((t) => (
                            <option key={t._id || t.id} value={t._id || t.id}>
                              {t.nomEntreprise || t.name || 'Transitaire'}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary w-100"
                          onClick={handleAssignToTranslataire}
                          disabled={assignLoading || !translataires.length}
                        >
                          {assignLoading ? 'Envoi en cours...' : 'Envoyer au transitaire'}
                        </button>
                      </>
                    )}
                  </div>

                  <hr className="my-3" />

                  <h6 className="mb-2">Détails de la marchandise</h6>
                  <p className="small mb-1"><strong>Type :</strong> {detail.details.marchandise || '-'}</p>
                  <p className="small mb-1"><strong>Poids :</strong> {detail.details.poids || '-'}</p>
                  <p className="small mb-1"><strong>Volume :</strong> {detail.details.volume || '-'}</p>
                  <p className="small mb-1"><strong>Mode de transport :</strong> {detail.details.mode || '-'}</p>
                  <p className="small mb-3"><strong>Dimensions :</strong> {detail.details.dimensions || '-'}</p>

                  <h6 className="mb-2">Notes</h6>
                  <p className="small mb-3" style={{ whiteSpace: 'pre-wrap' }}>{detail.details.notes || '-'}</p>

                  {Array.isArray(detail.details.docs) && detail.details.docs.length > 0 && (
                    <>
                      <h6 className="mb-2">Autres documents</h6>
                      <ul className="small">
                        {detail.details.docs.map((doc, idx) => (
                          <li key={idx}>
                            {doc.url ? (
                              <a href={toDownloadUrl(doc.url, doc.name || `Document ${idx + 1}`)} download>
                                {doc.name || `Document ${idx + 1}`}
                              </a>
                            ) : (
                              doc.name || `Document ${idx + 1}`
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
      {detail && <div className="modal-backdrop fade show" onClick={() => setDetail(null)}></div>}
    </div>
  );
};

export default AdminDevis;
