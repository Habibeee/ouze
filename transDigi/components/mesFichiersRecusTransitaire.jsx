import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { listTransitaireDevis } from '../services/apiClient.js';

function MesFichiersRecusTransitaire() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const res = await listTransitaireDevis();
        const devisList = Array.isArray(res?.items) ? res.items : (Array.isArray(res?.devis) ? res.devis : (Array.isArray(res) ? res : []));
        const rows = [];
        devisList.forEach((d) => {
          const clientFiles = Array.isArray(d.clientFichiers)
            ? d.clientFichiers
            : (d.clientFichiers ? [d.clientFichiers] : (d.clientFichier ? [d.clientFichier] : []));
          if (!clientFiles || !clientFiles.length) return;
          const base = {
            devisId: d._id || d.id || '',
            client: d.client || d.clientName || d.demandeur || '',
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '',
            typeService: d.typeService || '',
          };
          clientFiles.forEach((f, idx) => {
            const url = (f && typeof f === 'object') ? (f.url || f.link || f.location) : f;
            const name = (f && typeof f === 'object') ? (f.name || f.filename || f.originalName || `Document ${idx + 1}`) : `Document ${idx + 1}`;
            if (!url) return;
            rows.push({ ...base, url, name });
          });
        });
        setItems(rows);
      } catch (e) {
        setErr(e?.message || 'Erreur de chargement des fichiers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredItems = (() => {
    const q = (search || '').toLowerCase().trim();
    if (!q) return items;
    return items.filter((it) => {
      const haystack = [
        it.client,
        it.date,
        it.typeService,
        it.name,
        it.devisId,
      ]
        .filter(Boolean)
        .map((v) => v.toString().toLowerCase());
      return haystack.some((v) => v.includes(q));
    });
  })();

  return (
    <div className="container-fluid px-0 px-md-2 py-2 py-md-3">
      <div className="d-flex align-items-center justify-content-between mb-3 mb-md-4">
        <h1 className="h4 h3-md fw-bold mb-0">Mes fichiers reçus</h1>
        <button
          type="button"
          className="btn btn-primary btn-sm text-white fw-semibold"
          onClick={() => { window.location.hash = '#/dashboard-transitaire'; }}
        >
          Retour au tableau de bord
        </button>
      </div>
      <div className="mb-3 mb-md-4">
        <div className="input-group" style={{ maxWidth: 340 }}>
          <span className="input-group-text bg-body-secondary border-end-0">
            <FileText size={16} />
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Rechercher par client, date, BL ou nom de fichier"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {err && <div className="alert alert-danger" role="alert">{err}</div>}
      {loading && !items.length && <div className="text-muted">Chargement...</div>}
      {!loading && !err && filteredItems.length === 0 && (
        <div className="border rounded-3 p-4 text-center bg-body-secondary-subtle text-muted">
          <FileText size={40} className="mb-2" />
          <div>Aucun fichier reçu pour le moment.</div>
        </div>
      )}
      {!loading && filteredItems.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="px-3">Fichier</th>
                    <th>Client</th>
                    <th>Type de service</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3">
                        <div className="d-flex align-items-center gap-2">
                          <FileText size={18} />
                          <span className="text-truncate" style={{ maxWidth: 240 }}>{it.name}</span>
                        </div>
                      </td>
                      <td>{it.client || '-'}</td>
                      <td>{it.typeService || '-'}</td>
                      <td>{it.date || '-'}</td>
                      <td className="text-end pe-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => triggerDownload(it.url, it.name)}
                        >
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MesFichiersRecusTransitaire;
