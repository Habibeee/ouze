import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from './ui/ToastProvider.jsx';
import { Search, ChevronLeft, ChevronRight, LayoutGrid, FileText, Clock, User, Truck, Search as SearchIcon, RefreshCw } from 'lucide-react';
import { historiqueDevisCss } from '../styles/historiqueDevisStyle.jsx';
import { listMesDevis, cancelDevis } from '../services/apiClient.js';
import { useI18n } from '../src/i18n.jsx';

const cols = [
  { key: 'transitaire', label: 'Transitaire' },
  { key: 'date', label: 'Date' },
  { key: 'typeService', label: 'Type de service' },
  { key: 'description', label: 'Description' },
  { key: 'origin', label: 'Origine' },
  { key: 'destination', label: 'Destination' },
  { key: 'expiration', label: 'Expiration' },
  { key: 'statut', label: 'Statut' },
  { key: 'actions', label: 'Actions' }
];

const renderCell = (row, col) => {
  if (col.key === 'statut') {
    const status = row.statut || 'attente';
    const meta = statusMeta[status] || {};
    return (
      <span className={`badge ${meta.className || 'bg-secondary'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }
  if (col.key === 'actions') {
    return (
      <div className="d-flex gap-2">
        <button className="btn btn-sm btn-outline-primary">
          Voir
        </button>
        {row.statut === 'attente' && (
          <button 
            className="btn btn-sm btn-outline-danger"
            onClick={(e) => {
              e.stopPropagation();
              // handleCancel(row.id);
            }}
          >
            Annuler
          </button>
        )}
      </div>
    );
  }
  return row[col.key] || '-';
};

const statusMeta = {
  accepte: { key: 'client.history.filter.status.accepted', className: 'badge-status success' },
  attente: { key: 'client.history.filter.status.pending', className: 'badge-status warning' },
  refuse: { key: 'client.history.filter.status.refused', className: 'badge-status danger' },
  annule: { key: 'client.history.filter.status.canceled', className: 'badge-status danger' },
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
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const toast = useToast();

  const load = async () => {
      try {
        setLoading(true);
        setErr('');
        console.log('Chargement des devis depuis l\'API...');
        
        const data = await listMesDevis();
        console.log('Réponse de l\'API:', data);
        
        if (!data) {
          throw new Error('Aucune donnée reçue du serveur');
        }
        
        const devis = Array.isArray(data) ? data : (Array.isArray(data.devis) ? data.devis : []);
        
        const mapped = devis.map((d) => ({
          id: d._id || d.id || `#${Math.random().toString(36).substr(2, 8)}`,
          transitaire: d.translataire || d.transitaire || 'Transitaire inconnu',
          date: d.createdAt ? new Date(d.createdAt).toISOString().slice(0,10) : (d.date || ''),
          typeService: d.typeService || d.type || 'Non spécifié',
          description: d.description || 'Aucune description',
          origin: d.origin || d.origine || 'Non spécifiée',
          destination: d.destination || d.route || 'Non spécifiée',
          expiration: d.dateExpiration ? new Date(d.dateExpiration).toISOString().slice(0,10) : (d.expiration || ''),
          statut: normalizeStatus(d.statut || d.status || 'en attente'),
        }));
        
        console.log('Devis mappés:', mapped);
        
        if (mapped.length === 0) {
          console.log('Aucun devis trouvé dans la réponse');
          setErr('Aucun devis trouvé dans votre historique');
        } else {
          setErr('');
        }
      } catch (e) {
        setErr(e?.message || t('client.history.error'));
      } finally { setLoading(false); }
  };

  const handleArchive = async (id) => {
    if (!id) return;
    if (!window.confirm(t('client.history.confirm.archive'))) return;
    try {
      await cancelDevis(id);
      await load();
      toast.success(t('client.history.toast.archived'));
    } catch (e) {
      toast.error(e?.message || t('client.history.toast.archive_error'));
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!id) return;
    if (!window.confirm(t('client.history.confirm.cancel'))) return;
    try {
      await cancelDevis(id);
      await load();
      toast.success(t('client.history.toast.canceled'));
    } catch (e) {
      toast.error(e?.message || t('client.history.toast.cancel_error'));
    }
  };

  const filtered = useMemo(() => {
    let rs = rows;
    if (query) {
      const q = query.toLowerCase();
      rs = rs.filter(r => (r.transitaire || '').toLowerCase().includes(q) || 
                          (r.destination || '').toLowerCase().includes(q) ||
                          (r.origin || '').toLowerCase().includes(q));
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

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
          <span className="visually-hidden">Chargement...</span>
        </div>
        <h4>Chargement de l'historique...</h4>
        <p className="text-muted mt-2">Veuillez patienter pendant que nous récupérons vos devis.</p>
      </div>
    );
  }

  // Afficher un message si aucun résultat
  if (filtered.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="mb-4">
            <FileText size={64} className="text-muted" />
          </div>
          <h4 className="mb-3">Aucun devis trouvé</h4>
          <p className="text-muted mb-4">
            {err || 'Aucun devis ne correspond à vos critères de recherche.'}
          </p>
          <div className="d-flex justify-content-center gap-3">
            <button 
              className="btn btn-primary" 
              onClick={reset}
            >
              Réinitialiser les filtres
            </button>
            <button 
              className="btn btn-outline-secondary" 
              onClick={load}
            >
              <span className="d-flex align-items-center">
                <RefreshCw size={16} className="me-2" />
                Actualiser
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <style>{historiqueDevisCss}</style>
      <div className="container-fluid px-3 px-md-4 py-4">
        <h2 className="fw-bold mb-3">{t('client.history.title')}</h2>
        {/* Toasts globaux gèrent désormais les messages */}

        {/* Filter Bar */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-column flex-xl-row align-items-stretch gap-2">
              <div className="position-relative flex-grow-1">
                <Search size={18} className="text-muted" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input className="form-control ps-5" placeholder={t('client.history.search.placeholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <select className="form-select filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="tous">{t('client.history.filter.status.all')}</option>
                <option value="accepte">{t('client.history.filter.status.accepted')}</option>
                <option value="attente">{t('client.history.filter.status.pending')}</option>
                <option value="refuse">{t('client.history.filter.status.refused')}</option>
                <option value="annule">{t('client.history.filter.status.canceled')}</option>
              </select>
              <select className="form-select filter-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="tous">{t('client.history.filter.type')}</option>
                {Array.from(new Set(rows.map(r => (r.typeService || '').toString()).filter(Boolean))).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select className="form-select filter-select" value={destination} onChange={(e) => setDestination(e.target.value)}>
                <option value="tous">{t('client.history.filter.destination')}</option>
                {Array.from(new Set(rows.map(r => r.destination))).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input type="date" className="form-control filter-select" value={date} onChange={(e) => setDate(e.target.value)} />
              <div className="d-flex gap-2">
                <button className="btn btn-primary">{t('client.history.filter.apply')}</button>
                <button type="button" className="btn btn-link text-decoration-none" onClick={reset}>{t('client.history.filter.reset')}</button>
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
                  {cols.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id}>
                    {cols.map((col) => (
                      <td key={col.key}>
                        {col.key === 'statut' ? (
                          <span className={`badge ${statusMeta[r.statut]?.className || 'bg-secondary'}`}>
                            {r.statut.charAt(0).toUpperCase() + r.statut.slice(1)}
                          </span>
                        ) : col.key === 'actions' ? (
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                // Rediriger vers le détail du devis
                                window.location.hash = `#/detail-devis-client?id=${r.id}`;
                              }}
                            >
                              Voir
                            </button>
                            {r.statut === 'attente' && (
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Êtes-vous sûr de vouloir annuler ce devis ?')) {
                                    handleCancel(r.id);
                                  }
                                }}
                              >
                                Annuler
                              </button>
                            )}
                          </div>
                        ) : (
                          r[col.key] || '-'
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="d-flex justify-content-between align-items-center p-3">
            <small className="text-muted">{t('client.history.pagination.label').replace('{{page}}', String(page)).replace('{{total}}', String(totalPages))}</small>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label={t('client.history.pagination.prev_aria')}>
                    <ChevronLeft size={16} />
                  </button>
                </li>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label={t('client.history.pagination.next_aria')}>
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
