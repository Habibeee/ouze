import React, { useEffect, useMemo, useState } from 'react';
import { Search, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { gestionTransitaireCss } from '../styles/gestionTransitaireStyle.jsx';
import { get, put, del, post } from '../services/apiClient.js';

const COLORS = {
  primary: '#28A745',
  lightGray: '#F8F9FA',
  lightGreen: '#E8F5E9',
  danger: '#DC2626',
  lightRed: '#FEE2E2',
  quaternary: '#5C757D'
};

const StatusBadge = ({ status, type = 'transitaire' }) => {
  const configs = {
    transitaire: {
      'Actif': { bg: COLORS.lightGreen, color: COLORS.primary },
      'Bloqué': { bg: COLORS.lightRed, color: COLORS.danger },
      'Archivé': { bg: COLORS.lightGray, color: COLORS.quaternary }
    }
  };
  const cfg = (configs[type] || {})[status] || { bg: COLORS.lightGray, color: COLORS.quaternary };
  return <span className="badge px-3 py-2 fw-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color, borderRadius: '999px', fontSize: 12 }}>{status}</span>;
};

const GestionTransitaires = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Tous');
  const [sector, setSector] = useState('Tous');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const mapRows = (list) => (list || []).map(t => ({
    id: t._id || t.id,
    name: t.nomEntreprise || t.email,
    email: t.email,
    sector: (Array.isArray(t.typeServices) && t.typeServices.length)
      ? t.typeServices.join(', ')
      : (t.secteurActivite || t.sector || '-'),
    status: t.isArchived ? 'Archivé' : (t.isBlocked ? 'Bloqué' : 'Actif'),
    date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
    raw: t,
  }));

  const fetchTrans = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await get('/admin/translataires?page=1&limit=100');
      if (res && res.success === false && res.message) {
        setError(res.message);
        setData([]);
        return;
      }
      const list =
        res?.translataires?.docs ||
        res?.translataires ||
        res?.data?.translataires?.docs ||
        res?.data?.translataires ||
        res?.data?.docs ||
        res?.data ||
        res?.docs ||
        res?.items ||
        res?.results || [];
      setData(mapRows(Array.isArray(list) ? list : []));
    } catch (e) {
      setError(e?.message || 'Erreur de chargement');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTrans(); }, []);

  const filtered = useMemo(() => {
    const norm = (s = '') => s
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .trim();
    const wantedSector = norm(sector);
    return data.filter(r => {
      const okStatus = (status === 'Tous' || r.status === status);
      const okSector = (sector === 'Tous') || norm(r.sector).includes(wantedSector);
      const q = norm(search);
      const okSearch = !q || norm(r.name).includes(q) || norm(r.email).includes(q);
      return okStatus && okSector && okSearch;
    });
  }, [data, search, status, sector]);

  const pageSize = 4;
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const allVisibleSelected = rows.length > 0 && rows.every(r => selected.includes(r.email));
  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelected(prev => prev.filter(id => !rows.some(r => r.email === id)));
    } else {
      setSelected(prev => Array.from(new Set([...prev, ...rows.map(r => r.email)])));
    }
  };
  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const doAction = async (type) => {
    if (selected.length === 0) return;
    try {
      setError('');
      const ids = selected
        .map(email => data.find(d => d.email === email)?.id)
        .filter(Boolean);
      if (ids.length === 0) return;
      if (type === 'delete') {
        await post(`/admin/translataire/bulk/delete`, { ids });
      } else if (['block','unblock','archive','unarchive'].includes(type)) {
        await post(`/admin/translataire/bulk/${type}`, { ids });
      }
      await fetchTrans();
      try { window.dispatchEvent(new CustomEvent('admin:stats:dirty')); } catch {}
      setSelected([]);
    } catch (e) {
      setError(e?.message || 'Erreur action');
    }
  };

  const rowAction = async (id, action) => {
    try {
      setError('');
      if (action === 'approve') await put(`/admin/translataires/${id}/approve`, { statut: 'approuve' });
      else if (action === 'delete') await del(`/admin/translataire/${id}`);
      else if (action === 'block') await put(`/admin/translataire/${id}/block`, { isBlocked: true });
      else if (action === 'unblock') await put(`/admin/translataire/${id}/block`, { isBlocked: false });
      else if (action === 'archive' || action === 'unarchive') await post(`/admin/translataire/bulk/${action}`, { ids: [id] });
      await fetchTrans();
      try { window.dispatchEvent(new CustomEvent('admin:stats:dirty')); } catch {}
    } catch (e) {
      setError(e?.message || 'Erreur action');
    } finally { setOpenMenuId(null); }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <style>{gestionTransitaireCss}</style>
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-2">Gestion des Transitaires</h1>
        <p className="text-muted">Gérez les comptes transitaires de la plateforme</p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          {/* Search & Filters */}
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} className="text-muted" />
                </span>
                <input 
                  className="form-control border-start-0" 
                  placeholder="Rechercher..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <select 
                className="form-select" 
                value={status} 
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              >
                <option>Tous</option>
                <option>Actif</option>
                <option>Bloqué</option>
                <option>Archivé</option>
              </select>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <select 
                className="form-select" 
                value={sector} 
                onChange={(e) => { setSector(e.target.value); setPage(1); }}
              >
                <option>Tous</option>
                <option>Maritime</option>
                <option>Aérien</option>
                <option>Routier</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-2 flex-wrap mb-3">
            <button className="btn btn-outline-warning btn-sm" onClick={() => doAction('block')} disabled={selected.length===0}>Bloquer</button>
            <button className="btn btn-outline-success btn-sm" onClick={() => doAction('unblock')} disabled={selected.length===0}>Débloquer</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => doAction('archive')} disabled={selected.length===0}>Archiver</button>
            <button className="btn btn-outline-danger btn-sm" onClick={() => doAction('delete')} disabled={selected.length===0}>Supprimer</button>
            <button className="btn btn-outline-info btn-sm" onClick={() => doAction('unarchive')} disabled={selected.length===0}>Désarchiver</button>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ backgroundColor: COLORS.lightGray }}>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" className="form-check-input" checked={allVisibleSelected} onChange={toggleSelectAll} />
                  </th>
                  <th className="fw-semibold">Entreprise</th>
                  <th className="fw-semibold d-none d-md-table-cell">Email</th>
                  <th className="fw-semibold d-none d-lg-table-cell">Secteur</th>
                  <th className="fw-semibold">Statut</th>
                  <th className="fw-semibold d-none d-xl-table-cell">Date</th>
                  <th className="fw-semibold text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="7" className="text-center text-muted">Chargement...</td></tr>
                )}
                {error && !loading && (
                  <tr><td colSpan="7" className="text-danger">{error}</td></tr>
                )}
                {!loading && !error && rows.length === 0 && (
                  <tr><td colSpan="7" className="text-center text-muted">Aucun transitaire trouvé</td></tr>
                )}
                {!loading && !error && rows.map((r, i) => (
                  <tr key={i}>
                    <td><input type="checkbox" className="form-check-input" checked={selected.includes(r.email)} onChange={() => toggleOne(r.email)} /></td>
                    <td className="fw-semibold">{r.name}</td>
                    <td className="text-muted d-none d-md-table-cell">{r.email}</td>
                    <td className="d-none d-lg-table-cell">{r.sector}</td>
                    <td><StatusBadge status={r.status} type="transitaire" /></td>
                    <td className="text-muted d-none d-xl-table-cell">{r.date}</td>
                    <td className="text-end position-relative">
                      <button className="btn btn-sm btn-light" onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}>
                        <MoreHorizontal size={16} />
                      </button>
                      {openMenuId === r.id && (
                        <div className="card shadow-sm" style={{ position: 'absolute', right: 0, zIndex: 1050, minWidth: '200px' }}>
                          <div className="list-group list-group-flush">
                            <button className="list-group-item list-group-item-action" onClick={() => rowAction(r.id, 'approve')}>Approuver</button>
                            <button className="list-group-item list-group-item-action text-warning" onClick={() => rowAction(r.id, 'block')}>Bloquer</button>
                            <button className="list-group-item list-group-item-action text-success" onClick={() => rowAction(r.id, 'unblock')}>Débloquer</button>
                            <button className="list-group-item list-group-item-action text-secondary" onClick={() => rowAction(r.id, 'archive')}>Archiver</button>
                            <button className="list-group-item list-group-item-action text-info" onClick={() => rowAction(r.id, 'unarchive')}>Désarchiver</button>
                            <button className="list-group-item list-group-item-action text-danger" onClick={() => rowAction(r.id, 'delete')}>Supprimer</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 gap-2">
            <small className="text-muted">
              Page {page} sur {totalPages} • {filtered.length} résultat(s)
            </small>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>
                    <ChevronLeft size={16} />
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item d-none d-sm-block ${page === i + 1 ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setPage(i + 1)}
                      style={page === i + 1 ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary } : {}}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
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

export default GestionTransitaires;
