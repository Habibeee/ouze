import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { listAdminDevis, archiveAdminDevis } from '../services/apiClient.js';

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
            <h6 className="mb-2">Client</h6>
            <p className="small mb-1"><strong>Nom :</strong> {detail.client.name}</p>
            <p className="small mb-1"><strong>Email :</strong> {detail.client.email || '-'}</p>
            <p className="small mb-3"><strong>Téléphone :</strong> {detail.client.phone || '-'}</p>

            <h6 className="mb-2">Transport</h6>
            <p className="small mb-1"><strong>Trajet :</strong> {detail.route || '-'}</p>
            <p className="small mb-1"><strong>Date de création :</strong> {detail.created || '-'}</p>

            <h6 className="mb-2 mt-3">Détails de la marchandise</h6>
            <p className="small mb-1"><strong>Type :</strong> {detail.details.marchandise || '-'}</p>
            <p className="small mb-1"><strong>Poids :</strong> {detail.details.poids || '-'}</p>
            <p className="small mb-1"><strong>Volume :</strong> {detail.details.volume || '-'}</p>
            <p className="small mb-1"><strong>Mode de transport :</strong> {detail.details.mode || '-'}</p>
            <p className="small mb-3"><strong>Dimensions :</strong> {detail.details.dimensions || '-'}</p>

            <h6 className="mb-2">Notes</h6>
            <p className="small mb-3" style={{ whiteSpace: 'pre-wrap' }}>{detail.details.notes || '-'}</p>

            {Array.isArray(detail.details.docs) && detail.details.docs.length > 0 && (
              <>
                <h6 className="mb-2">Documents</h6>
                <ul className="small">
                  {detail.details.docs.map((doc, idx) => (
                    <li key={idx}>
                      {doc.url ? (
                        <a href={doc.url} download>{doc.name || `Document ${idx + 1}`}</a>
                      ) : (
                        doc.name || `Document ${idx + 1}`
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
      {detail && <div className="modal-backdrop fade show" onClick={() => setDetail(null)}></div>}
    </div>
  );
};

export default AdminDevis;
