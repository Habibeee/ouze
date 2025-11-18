import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { listTransitaireDevis } from '../services/apiClient.js';

const normalizeStatus = (raw) => {
  const v = (raw || '').toString().toLowerCase();
  if (v.includes('attent')) return 'en_attente';
  if (v.includes('accep')) return 'accepte';
  if (v.includes('trait')) return 'traite';
  if (v.includes('archiv') || v.includes('annul')) return 'archive';
  if (v.includes('refus') || v.includes('rej')) return 'refuse';
  return 'en_attente';
};

const HistoriqueDevisTransitaire = () => {
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
        // Récupérer les devis traités et archivés
        const [traites, archives] = await Promise.all([
          listTransitaireDevis({ status: 'traites', page: 1, limit: 200 }),
          listTransitaireDevis({ status: 'archive', page: 1, limit: 200 }),
        ]);
        const mapList = (src) => {
          const list = src?.items || src?.devis || src || [];
          return list.map((d) => ({
            id: d._id || d.id || '',
            client:
              (d.client && (d.client.nom || d.client.name || d.client.fullName)) ||
              d.clientName ||
              d.demandeur ||
              d.owner ||
              '',
            date: d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : '',
            route: (() => {
              const from = d.origin || d.origine || d.depart || '';
              const to = d.destination || d.arrivee || '';
              if (from || to) return `${from || '-'} → ${to || '-'}`;
              return d.description || d.typeService || '';
            })(),
            statut: normalizeStatus(d.statut || d.status),
          }));
        };
        const m1 = mapList(traites);
        const m2 = mapList(archives);
        // Fusionner en évitant les doublons par id
        const byId = new Map();
        [...m1, ...m2].forEach((r) => {
          if (!r.id) return;
          byId.set(r.id, r);
        });
        setRows(Array.from(byId.values()));
      } catch (e) {
        setError(e?.message || "Erreur de chargement de l'historique");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let rs = rows;
    if (query) {
      const q = query.toLowerCase();
      rs = rs.filter(
        (r) =>
          (r.id || '').toLowerCase().includes(q) ||
          (r.client || '').toLowerCase().includes(q) ||
          (r.route || '').toLowerCase().includes(q),
      );
    }
    if (date) {
      rs = rs.filter((r) => (r.date || '') === date);
    }
    return rs;
  }, [rows, query, date]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [filtered.length, totalPages]);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-body" style={{ minHeight: '100vh' }}>
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
            onClick={() => {
              try { window.location.hash = '#/dashboard-transitaire'; } catch {}
            }}
          >
            <ChevronLeft size={16} />
            <span>Retour au tableau de bord</span>
          </button>
          <h2 className="fw-bold mb-0 ms-auto text-nowrap">Historique des devis (Transitaire)</h2>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row align-items-stretch gap-2">
              <div className="position-relative flex-grow-1">
                <Search
                  size={18}
                  className="text-muted"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  className="form-control ps-5"
                  placeholder="Rechercher par client, numéro ou trajet"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>ID devis</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Trajet</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      Chargement...
                    </td>
                  </tr>
                )}
                {error && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center text-danger py-4">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && pageRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.client}</td>
                    <td>{r.date}</td>
                    <td>{r.route}</td>
                    <td className="text-capitalize">{r.statut}</td>
                  </tr>
                ))}
                {!loading && !error && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      Aucun devis archivé ou traité.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center p-3">
            <small className="text-muted">
              Page {page} sur {totalPages}
            </small>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Précédent"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </li>
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Suivant"
                  >
                    <ChevronRight size={16} />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoriqueDevisTransitaire;
