import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { listAdminDevis } from '../services/apiClient.js';

const normalizeStatus = (raw) => {
  const v = (raw || '').toString().toLowerCase();
  if (v.includes('archiv')) return 'archive';
  if (v.includes('trait')) return 'traite';
  if (v.includes('annul') || v.includes('cancel')) return 'annule';
  if (v.includes('refus') || v.includes('rej')) return 'refuse';
  if (v.includes('accep')) return 'accepte';
  return v || 'en_attente';
};

const extractClient = (d = {}) => {
  const c = d.client || d.clientInfo || d.user || d.owner || {};
  const nom = c.nom || c.lastName || c.lastname || d.clientName || '';
  const prenom = c.prenom || c.firstName || c.firstname || '';
  return `${prenom} ${nom}`.trim() || nom || prenom || '-';
};

const extractRoute = (d = {}) => {
  const from = d.origin || d.origine || d.depart || d.from || '';
  const to = d.destination || d.arrivee || d.to || '';
  if (from || to) return `${from || '-'} → ${to || '-'}`;
  return d.description || d.typeService || '';
};

const HistoriqueDevisAdmin = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await listAdminDevis({});
        const list = res?.items || res?.devis || res || [];
        const mapped = list.map((d) => {
          const id = d._id || d.id || '';
          const client = extractClient(d);
          const route = extractRoute(d);
          const created = d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : '';
          const statut = normalizeStatus(d.statut || d.status);
          return { id, client, route, created, statut };
        });
        setRows(mapped);
      } catch (e) {
        setError(e?.message || "Erreur de chargement de l'historique des devis");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    // Historique = devis archivés, traités, annulés ou refusés
    let rs = rows.filter((r) => ['archive', 'traite', 'annule', 'refuse'].includes(normalizeStatus(r.statut)));
    if (query) {
      const q = query.toLowerCase();
      rs = rs.filter((r) => {
        const route = (r.route || '').toLowerCase();
        return (
          (r.id || '').toLowerCase().includes(q) ||
          (r.client || '').toLowerCase().includes(q) ||
          route.includes(q)
        );
      });
    }
    if (date) {
      rs = rs.filter((r) => (r.created || '') === date);
    }
    return rs;
  }, [rows, query, date]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card border-0 shadow-sm mt-3">
      <div className="card-header bg-white border-0 pb-0">
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-2">
          <h5 className="mb-0 fw-bold">Historique des devis (Admin)</h5>
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
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => { setPage(1); setDate(e.target.value); }}
            />
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
                <th>Date</th>
                <th>Trajet</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">Chargement...</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={5} className="text-center text-danger py-4">{error}</td>
                </tr>
              )}
              {!loading && !error && pageRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.client}</td>
                  <td>{r.created}</td>
                  <td>{r.route}</td>
                  <td className="text-capitalize">{normalizeStatus(r.statut)}</td>
                </tr>
              ))}
              {!loading && !error && pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">Aucun devis archivé ou traité.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center p-3 border-top">
          <small className="text-muted">
            Page {page} sur {totalPages}
          </small>
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
  );
};

export default HistoriqueDevisAdmin;
