import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from './ui/ToastProvider.jsx';
import { Search, ChevronLeft, ChevronRight, LayoutGrid, FileText, Clock, User, Truck, Search as SearchIcon } from 'lucide-react';
import { historiqueDevisCss } from '../styles/historiqueDevisStyle.jsx';
import { listMesDevis, cancelDevis } from '../services/apiClient.js';

const statusMeta = {
  accepte: { label: 'Accepté', className: 'badge-status success' },
  attente: { label: 'En attente', className: 'badge-status warning' },
  refuse: { label: 'Refusé', className: 'badge-status danger' },
  annule: { label: 'Annulé', className: 'badge-status danger' },
};

const normalizeStatus = (raw) => {
  const v = (raw || '').toString().toLowerCase();
  if (v.includes('appr') || v.includes('accept')) return 'accepte';
  if (v.includes('attent')) return 'attente';
  if (v.includes('refus')) return 'refuse';
  if (v.includes('annul')) return 'annule';
  return 'attente';
};

const HistoriqueDevis = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('tous');
  const [type, setType] = useState('tous');
  const [destination, setDestination] = useState('tous');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const toast = useToast();

  const load = async () => {
      try {
        setLoading(true);
        setErr('');
        const data = await listMesDevis();
        const devis = Array.isArray(data?.devis) ? data.devis : [];
        const mapped = devis.map((d) => ({
          id: d._id || d.id || '#',
          transitaire: d.translataire || '',
          date: d.createdAt ? new Date(d.createdAt).toISOString().slice(0,10) : '',
          typeService: d.typeService || '',
          description: d.description || '',
          origin: d.origin || d.origine || '',
          destination: d.destination || d.route || '',
          expiration: d.dateExpiration ? new Date(d.dateExpiration).toISOString().slice(0,10) : '',
          statut: normalizeStatus(d.statut || d.status),
        }));
        setRows(mapped);
      } catch (e) {
        setErr(e?.message || 'Erreur de chargement');
      } finally { setLoading(false); }
  };

  const handleArchive = async (id) => {
    if (!id) return;
    if (!window.confirm('Voulez-vous ARCHIVER ce devis ? Il restera visible dans votre historique avec un statut mis à jour.')) return;
    try {
      await cancelDevis(id);
      await load();
      toast.success('Devis archivé avec succès.');
    } catch (e) {
      toast.error(e?.message || "Erreur lors de l'archivage");
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!id) return;
    if (!window.confirm('Voulez-vous ANNULER ce devis ? Il restera visible dans votre historique avec le statut "Annulé".')) return;
    try {
      await cancelDevis(id);
      await load();
      toast.success('Devis annulé avec succès.');
    } catch (e) {
      toast.error(e?.message || 'Erreur lors de l\'annulation');
    }
  };

  const filtered = useMemo(() => {
    let rs = rows;
    if (query) {
      const q = query.toLowerCase();
      rs = rs.filter(r => (r.id || '').toLowerCase().includes(q) || (r.transitaire || '').toLowerCase().includes(q));
    }
    if (status !== 'tous') rs = rs.filter(r => r.statut === status);
    if (destination !== 'tous') rs = rs.filter(r => r.destination === destination);
    if (type !== 'tous') rs = rs.filter(r => (r.typeService || '').toString().toLowerCase() === type.toLowerCase());
    if (date) rs = rs.filter(r => (r.date || '') === date);
    return rs;
  }, [query, status, destination, type, date, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    // S'assurer que la page reste dans l'intervalle valide quand les filtres changent
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [filtered.length, totalPages]);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const reset = () => {
    setQuery('');
    setStatus('tous');
    setType('tous');
    setDestination('tous');
    setDate('');
    setPage(1);
  };

  return (
    <div className="bg-body" style={{ minHeight: '100vh' }}>
      <style>{historiqueDevisCss}</style>
      <div className="container-fluid px-3 px-md-4 py-4">
        <h2 className="fw-bold mb-3">Mon Historique de Devis</h2>
        {/* Toasts globaux gèrent désormais les messages */}

        {/* Filter Bar */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-column flex-xl-row align-items-stretch gap-2">
              <div className="position-relative flex-grow-1">
                <Search size={18} className="text-muted" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input className="form-control ps-5" placeholder="Rechercher par transitaire ou numéro" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <select className="form-select filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="tous">Statut: Tous</option>
                <option value="accepte">Accepté</option>
                <option value="attente">En attente</option>
                <option value="refuse">Refusé</option>
                <option value="annule">Annulé / Archivé</option>
              </select>
              <select className="form-select filter-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="tous">Type de service</option>
                {Array.from(new Set(rows.map(r => (r.typeService || '').toString()).filter(Boolean))).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select className="form-select filter-select" value={destination} onChange={(e) => setDestination(e.target.value)}>
                <option value="tous">Destination</option>
                {Array.from(new Set(rows.map(r => r.destination))).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input type="date" className="form-control filter-select" value={date} onChange={(e) => setDate(e.target.value)} />
              <div className="d-flex gap-2">
                <button className="btn btn-primary">Appliquer</button>
                <button type="button" className="btn btn-link text-decoration-none" onClick={reset}>Réinitialiser</button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table align-middle mb-0 quotes-table">
              <thead>
                <tr>
                  <th>Numéro de devis</th>
                  <th>Transitaire</th>
                  <th className="d-none d-md-table-cell">Date de la demande</th>
                  <th className="d-none d-lg-table-cell">Type de service</th>
                  <th className="d-none d-xl-table-cell">Description</th>
                  <th className="d-none d-lg-table-cell">Origine</th>
                  <th className="d-none d-lg-table-cell">Destination</th>
                  <th>Statut</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">Chargement...</td></tr>
                )}
                {err && !loading && (
                  <tr><td colSpan={6} className="text-center text-danger py-4">{err}</td></tr>
                )}
                {!loading && !err && pageRows.map((r) => (
                  <tr key={r.id}>
                    <td><a href={`#/detail-devis-client?id=${encodeURIComponent(r.id)}`} className="link-primary fw-semibold">{r.id}</a></td>
                    <td>{r.transitaire}</td>
                    <td className="d-none d-md-table-cell">{r.date}</td>
                    <td className="d-none d-lg-table-cell text-capitalize">{r.typeService}</td>
                    <td className="d-none d-xl-table-cell" style={{maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={r.description}>{r.description}</td>
                    <td className="d-none d-lg-table-cell">{r.origin}</td>
                    <td className="d-none d-lg-table-cell">{r.destination}</td>
                    <td><span className={(statusMeta[r.statut]||statusMeta['attente']).className}>{(statusMeta[r.statut]||statusMeta['attente']).label}</span></td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        {r.statut === 'attente' && (
                          <button className="btn btn-sm btn-outline-warning" onClick={() => handleCancel(r.id)}>Annuler</button>
                        )}
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleArchive(r.id)}>Archiver</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="d-flex justify-content-between align-items-center p-3">
            <small className="text-muted">Page {page} sur {totalPages}</small>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Précédent">
                    <ChevronLeft size={16} />
                  </button>
                </li>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Suivant">
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

export default HistoriqueDevis;
