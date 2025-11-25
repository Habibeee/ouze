import React, { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { gestionUtilisateurCss } from '../styles/gestionUtilisateurStyle.jsx';
import { get, put, del, post } from '../services/apiClient.js';

const COLORS = { green: '#28A745' };

const GestionUtilisateurs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
        if (searchTerm) params.set('search', searchTerm);
        const data = await get(`/admin/users?${params.toString()}`);
        const rows = (data?.users || []).map(u => ({
          id: u._id || u.id,
          name: [u.prenom, u.nom].filter(Boolean).join(' ') || u.nom || u.prenom || u.email,
          email: u.email,
          date: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
          status: u.isBlocked ? 'bloque' : 'actif',
          role: u.role || 'client',
          raw: u,
        }));
        setUsers(rows);
      try { window.dispatchEvent(new CustomEvent('admin:stats:dirty')); } catch {}
      } catch (e) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, pageSize, searchTerm]);

  const filtered = useMemo(() => users.filter(u => 
    (statusFilter === 'all' || u.status === statusFilter) &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [users, statusFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const allVisibleSelected = rows.length > 0 && rows.every(u => selectedUsers.includes(u.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedUsers(prev => prev.filter(id => !rows.some(u => u.id === id)));
    } else {
      const ids = rows.map(u => u.id);
      setSelectedUsers(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  const rowAction = async (id, type) => {
    try {
      setError('');
      let response;
      if (type === 'approve') {
        response = await put(`/admin/users/${id}/approve`);
      } else if (['block','unblock','archive','unarchive','delete'].includes(type)) {
        if (type === 'delete') {
          response = await post(`/admin/user/bulk/delete`, { ids: [id] });
        } else {
          response = await post(`/admin/user/bulk/${type}`, { ids: [id] });
        }
      }
      
      // Show email status if available
      if (response?.emailStatus) {
        const emailMsg = response.emailStatus.sent 
          ? '✓ Email envoyé avec succès'
          : response.emailStatus.error 
          ? `⚠ Email non envoyé: ${response.emailStatus.error}`
          : '⚠ Email non envoyé';
        setError(emailMsg);
      }
      
      // Refresh current page
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (searchTerm) params.set('search', searchTerm);
      const data = await get(`/admin/users?${params.toString()}`);
      const rows = (data?.users || []).map(u => ({
        id: u._id || u.id,
        name: [u.prenom, u.nom].filter(Boolean).join(' ') || u.nom || u.prenom || u.email,
        email: u.email,
        date: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
        status: u.isBlocked ? 'bloque' : 'actif',
        raw: u,
      }));
      setUsers(rows);
      try { window.dispatchEvent(new CustomEvent('admin:stats:dirty')); } catch {}
    } catch (e) {
      setError(e?.message || 'Erreur action');
    } finally {
      setOpenMenuId(null);
    }
  };

  const toggleOne = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const doAction = async (type) => {
    if (selectedUsers.length === 0) return;
    try {
      setError('');
      const ids = [...selectedUsers];
      if (type === 'delete') {
        await post(`/admin/user/bulk/delete`, { ids });
      } else if (['block','unblock','archive','unarchive'].includes(type)) {
        await post(`/admin/user/bulk/${type}`, { ids });
      }
      // Refresh list
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (searchTerm) params.set('search', searchTerm);
      const data = await get(`/admin/users?${params.toString()}`);
      const rows = (data?.users || []).map(u => ({
        id: u._id || u.id,
        name: [u.prenom, u.nom].filter(Boolean).join(' ') || u.nom || u.prenom || u.email,
        email: u.email,
        date: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
        status: u.isBlocked ? 'bloque' : 'actif',
        raw: u,
      }));
      setUsers(rows);
      try { window.dispatchEvent(new CustomEvent('admin:stats:dirty')); } catch {}
    } catch (e) {
      setError(e?.message || 'Erreur action');
    } finally {
      setSelectedUsers([]);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      actif: { bg: '#E8F5E9', color: COLORS.green, label: 'Actif' },
      bloque: { bg: '#FFEBEE', color: '#D32F2F', label: 'Bloqué' }
    };
    const c = config[status];
    return <span className="badge px-3 py-2" style={{ backgroundColor: c.bg, color: c.color }}>{c.label}</span>;
  };

  return (
    <div className="bg-light" style={{ minHeight: '100vh' }}>
      <div className="container-fluid px-3 px-md-4 py-4">
        <h1 className="display-5 fw-bold mb-2">Gestion des Utilisateurs</h1>
        <p className="text-muted mb-4">Gérez les comptes clients de la plateforme.</p>

        <div className="d-flex flex-wrap gap-2 mb-4">
          <button className="btn btn-outline-danger d-flex align-items-center gap-2" onClick={() => doAction('delete')} disabled={selectedUsers.length===0}><i className="fa-solid fa-trash"></i><span className="d-none d-sm-inline">Supprimer</span></button>
          <button className="btn btn-outline-warning d-flex align-items-center gap-2" onClick={() => doAction('block')} disabled={selectedUsers.length===0}><i className="fa-solid fa-ban"></i><span className="d-none d-sm-inline">Bloquer</span></button>
          <button className="btn btn-outline-success d-flex align-items-center gap-2" onClick={() => doAction('unblock')} disabled={selectedUsers.length===0}><i className="fa-solid fa-unlock"></i><span className="d-none d-sm-inline">Débloquer</span></button>
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => doAction('archive')} disabled={selectedUsers.length===0}><i className="fa-solid fa-box-archive"></i><span className="d-none d-sm-inline">Archiver</span></button>
          <button className="btn btn-outline-info d-flex align-items-center gap-2" onClick={() => doAction('unarchive')} disabled={selectedUsers.length===0}><i className="fa-solid fa-box-open"></i><span className="d-none d-sm-inline">Désarchiver</span></button>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-md-6 col-lg-4">
                <div className="input-group">
                  <span className="input-group-text bg-white"><i className="fa-solid fa-magnifying-glass text-muted"></i></span>
                  <input type="text" className="form-control" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                  <option value="all">Tous les statuts</option>
                  <option value="actif">Actif</option>
                  <option value="bloque">Bloqué</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: 50 }}><input type="checkbox" className="form-check-input" checked={allVisibleSelected} onChange={toggleSelectAll} /></th>
                  <th>Nom</th>
                  <th className="d-none d-md-table-cell">Email</th>
                  <th className="d-none d-lg-table-cell">Date d'inscription</th>
                  <th>Statut</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="6" className="text-center text-muted">Chargement...</td></tr>
                )}
                {error && !loading && (
                  <tr><td colSpan="6" className="text-danger">{error}</td></tr>
                )}
                {!loading && !error && rows.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => setSelectedUsers(prev => 
                          prev.includes(u.id) 
                            ? prev.filter(id => id !== u.id) 
                            : [...prev, u.id]
                        )}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                      <div className="text-xs text-gray-400">{u.role}</div>
                    </td>
                    <td className="text-end position-relative">
                      <button className="btn btn-sm btn-light" onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}>
                        <MoreHorizontal size={16} />
                      </button>
                      {openMenuId === u.id && (
                        <div className="card shadow-sm" style={{ position: 'absolute', right: 0, zIndex: 1050, minWidth: '220px' }}>
                          <div className="list-group list-group-flush">
                            <button className="list-group-item list-group-item-action" onClick={() => rowAction(u.id, 'approve')}>Approuver</button>
                            <button className="list-group-item list-group-item-action text-warning" onClick={() => rowAction(u.id, 'block')}>Bloquer</button>
                            <button className="list-group-item list-group-item-action text-success" onClick={() => rowAction(u.id, 'unblock')}>Débloquer</button>
                            <button className="list-group-item list-group-item-action text-danger" onClick={() => rowAction(u.id, 'delete')}>Supprimer</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 gap-2">
          <small className="text-muted">Page {page} sur {totalPages} • {filtered.length} résultat(s)</small>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>
                  «
                </button>
              </li>
              {Array.from({length: totalPages}).map((_, i) => (
                <li key={i} className={`page-item d-none d-sm-block ${page === i + 1 ? 'active' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setPage(i + 1)}
                    style={page === i + 1 ? { backgroundColor: COLORS.green, borderColor: COLORS.green } : {}}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  »
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <style>{`
        .form-control:focus, .form-select:focus { border-color: ${COLORS.green}; box-shadow: 0 0 0 0.2rem rgba(40,167,69,.25); }
        .form-check-input:checked { background-color: ${COLORS.green}; border-color: ${COLORS.green}; }
      `}</style>
    </div>
  );
};

export default GestionUtilisateurs;
