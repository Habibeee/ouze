import React, { useEffect, useMemo, useState } from 'react';
import { validationCompteCss } from '../styles/validationCompteStyle.jsx';
import { Search } from 'lucide-react';
import { get, put } from '../services/apiClient.js';

const getInitials = (label = '') => {
  const parts = label
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const BadgeType = ({ type }) => (
  <span className={`badge-type ${type === 'Client' ? 'client' : 'transitaire'}`}>{type}</span>
);

const Row = ({ item, onValidate, onRefuse }) => (
  <tr>
    <td>
      <div className="d-flex align-items-center gap-2 gap-md-3">
        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, backgroundColor: '#E3F2FD', color: '#0d6efd', fontWeight: 700, fontSize: 12 }}>
          {getInitials(item.name)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="fw-semibold text-truncate">{item.name}</div>
          <div className="text-muted small text-truncate">{item.email}</div>
        </div>
      </div>
    </td>
    <td className="align-middle"><BadgeType type={item.type} /></td>
    <td className="align-middle d-none d-md-table-cell">{item.date}</td>
    <td className="align-middle">
      <div className="d-flex flex-column flex-sm-row gap-1 gap-sm-2">
        <button className="btn btn-success btn-sm" onClick={onValidate}>Valider</button>
        <button className="btn btn-danger btn-sm" onClick={onRefuse}>Refuser</button>
      </div>
    </td>
  </tr>
);

const ValidationCompte = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Tous');
  const [sort, setSort] = useState('desc');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);
        setError('');
        // Clients: on récupère tout puis on filtre localement par isApproved=false si pas de filtre serveur
        const usersRes = await get('/admin/users');
        const clients = (usersRes?.users || [])
          .filter(u => u.isApproved === false)
          .map(u => ({
            id: u._id || u.id,
            name: [u.prenom, u.nom].filter(Boolean).join(' ') || u.email,
            email: u.email,
            type: 'Client',
            date: u.createdAt ? new Date(u.createdAt).toISOString().slice(0,10) : '',
            raw: u,
          }));

        // Transitaires: on utilise le param statut si dispo; fallback: filtre local isApproved=false
        const transRes = await get('/admin/translataires');
        const translataires = (transRes?.translataires || [])
          .filter(t => (t.statut ? String(t.statut).toLowerCase() === 'en_attente' : (t.isApproved === false)))
          .map(t => ({
            id: t._id || t.id,
            name: t.nomEntreprise || t.email,
            email: t.email,
            type: 'Transitaire',
            date: t.createdAt ? new Date(t.createdAt).toISOString().slice(0,10) : '',
            raw: t,
          }));

        setItems([...clients, ...translataires]);
      } catch (e) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const data = useMemo(() => {
    let out = items.filter(s => (filter === 'Tous' || s.type === filter) && (
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase())
    ));
    out = out.sort((a,b)=> sort==='desc' ? (b.date.localeCompare(a.date)) : (a.date.localeCompare(b.date)));
    return out;
  }, [items, query, filter, sort]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError('');
      const usersRes = await get('/admin/users');
      const clients = (usersRes?.users || [])
        .filter(u => u.isApproved === false)
        .map(u => ({
          id: u._id || u.id,
          name: [u.prenom, u.nom].filter(Boolean).join(' ') || u.email,
          email: u.email,
          type: 'Client',
          date: u.createdAt ? new Date(u.createdAt).toISOString().slice(0,10) : '',
          raw: u,
        }));
      const transRes = await get('/admin/translataires');
      const translataires = (transRes?.translataires || [])
        .filter(t => (t.statut ? String(t.statut).toLowerCase() === 'en_attente' : (t.isApproved === false)))
        .map(t => ({
          id: t._id || t.id,
          name: t.nomEntreprise || t.email,
          email: t.email,
          type: 'Transitaire',
          date: t.createdAt ? new Date(t.createdAt).toISOString().slice(0,10) : '',
          raw: t,
        }));
      setItems([...clients, ...translataires]);
    } finally { setLoading(false); }
  };

  const handleValidate = async (email) => {
    const it = items.find(i => i.email === email);
    if (!it) return;
    try {
      if (it.type === 'Client') {
        await put(`/admin/users/${it.id}/approve`);
      } else {
        await put(`/admin/translataires/${it.id}/approve`, { statut: 'approuve' });
      }
      setActionMsg({ text: `${it.name} validé avec succès`, type: 'success' });
      await refresh();
      try { window.dispatchEvent(new CustomEvent('admin:stats:dirty')); } catch {}
    } catch (e) {
      setActionMsg({ text: e?.message || 'Erreur lors de la validation', type: 'danger' });
    } finally {
      setTimeout(() => setActionMsg({ text: '', type: '' }), 2500);
    }
  };
  const handleRefuse = async (email) => {
    const it = items.find(i => i.email === email);
    if (!it) return;
    try {
      if (it.type === 'Client') {
        // Bloquer le compte via endpoint générique
        await put(`/admin/user/${it.id}/block`, { isBlocked: true });
      } else {
        await put(`/admin/translataires/${it.id}/approve`, { statut: 'rejete' });
      }
      setActionMsg({ text: `${it.name} refusé`, type: 'danger' });
      await refresh();
      try { window.dispatchEvent(new CustomEvent('admin:stats:dirty')); } catch {}
    } catch (e) {
      setActionMsg({ text: e?.message || 'Erreur lors du refus', type: 'danger' });
    } finally {
      setTimeout(() => setActionMsg({ text: '', type: '' }), 2500);
    }
  };

  return (
    <div className="container-fluid px-2 px-md-4 py-3 py-md-4">
      <style>{validationCompteCss}</style>
      <h2 className="fw-bold mb-3 mb-md-4 page-title">Comptes en Attente de Validation</h2>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {actionMsg.text && (
            <div className={`alert alert-${actionMsg.type} d-flex justify-content-between align-items-center`} role="alert">
              <span>{actionMsg.text}</span>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setActionMsg({ text: '', type: '' })}></button>
            </div>
          )}
          <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2 toolbar mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white"><Search size={18} /></span>
              <input className="form-control" placeholder="Rechercher par nom, email..." value={query} onChange={(e)=>setQuery(e.target.value)} />
            </div>
            <div className="ms-md-auto d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
              <select className="form-select" value={filter} onChange={(e)=>setFilter(e.target.value)}>
                <option>Tous</option>
                <option>Client</option>
                <option>Transitaire</option>
              </select>
              <select className="form-select" value={sort} onChange={(e)=>setSort(e.target.value)}>
                <option value="desc">Récent</option>
                <option value="asc">Ancien</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th>UTILISATEUR/SOCIÉTÉ</th>
                  <th>TYPE DE COMPTE</th>
                  <th className="d-none d-md-table-cell">DATE DE SOUMISSION</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="4" className="text-center text-muted">Chargement...</td></tr>
                )}
                {error && !loading && (
                  <tr><td colSpan="4" className="text-danger">{error}</td></tr>
                )}
                {!loading && !error && data.map((item, idx)=> (
                  <Row
                    key={idx}
                    item={item}
                    onValidate={()=>handleValidate(item.email)}
                    onRefuse={()=>handleRefuse(item.email)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 mt-3">
            <small className="text-muted text-center text-sm-start">
              {data.length > 0 ? `Affichage de 1 à ${data.length} sur ${data.length} résultats` : 'Aucun résultat'}
            </small>
            <div className="btn-group">
              <button className="btn btn-outline-secondary btn-sm" disabled>{'<'}</button>
              <button className="btn btn-outline-secondary btn-sm" disabled>{'>'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationCompte;
