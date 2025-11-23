import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { listMesDevis as listMesDevisApi } from '../services/apiClient.js';

const MesFichiersRecus = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

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
        const res = await listMesDevisApi();
        const devisList = Array.isArray(res?.devis) ? res.devis : [];
        const rows = [];
        devisList.forEach((d) => {
          const transFiles = Array.isArray(d.reponseFichiers)
            ? d.reponseFichiers
            : (d.reponseFichiers ? [d.reponseFichiers] : (d.reponseFichier ? [d.reponseFichier] : []));
          if (!transFiles || !transFiles.length) return;
          const base = {
            devisId: d._id || d.id || '',
            translataire: d.translataire || '',
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '',
            typeService: d.typeService || '',
          };
          transFiles.forEach((f, idx) => {
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

  return (
    <div className="container-fluid px-0 px-md-2 py-2 py-md-3">
      <div className="d-flex align-items-center justify-content-between mb-3 mb-md-4">
        <h1 className="h4 h3-md fw-bold mb-0">Mes fichiers reçus</h1>
      </div>
      {err && <div className="alert alert-danger" role="alert">{err}</div>}
      {loading && !items.length && <div className="text-muted">Chargement...</div>}
      {!loading && !err && items.length === 0 && (
        <div className="border rounded-3 p-4 text-center bg-body-secondary-subtle text-muted">
          <FileText size={40} className="mb-2" />
          <div>Aucun fichier reçu pour le moment.</div>
        </div>
      )}
      {!loading && items.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="px-3">Fichier</th>
                    <th>Transitaire</th>
                    <th>Type de service</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3">
                        <div className="d-flex align-items-center gap-2">
                          <FileText size={18} />
                          <span className="text-truncate" style={{ maxWidth: 240 }}>{it.name}</span>
                        </div>
                      </td>
                      <td>{it.translataire || '-'}</td>
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
};

export default MesFichiersRecus;
