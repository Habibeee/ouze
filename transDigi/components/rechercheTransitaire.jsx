import React, { useEffect, useMemo, useState } from 'react';
import { 
  MapPin, Wrench, Building2, Search, Bell, User, Star,
  Plane, Truck, Ship, Package, ArrowUpDown, CheckCircle,
  LayoutGrid, FileText, Clock
} from 'lucide-react';
import { transitaireStyles, transitaireCss } from '../styles/rechercheTransitaireStyle.jsx';
import { searchTranslatairesClient } from '../services/apiClient.js';

const RechercheTransitaire = () => {
  const [searchFilters, setSearchFilters] = useState({ location: '', service: '', company: '' });
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  // Sélection locale simple pour "Voir les avis" côté client
  const [selectionAvis, setSelectionAvis] = useState({}); // { [idTrans]: 'satisfait' | 'moyen' | 'pas_satisfait' }

  const fetchTrans = async () => {
    try {
      setLoading(true); setErr('');
      const data = await searchTranslatairesClient({ typeService: searchFilters.service || undefined, ville: searchFilters.location || undefined, recherche: searchFilters.company || undefined });
      const rows = Array.isArray(data?.translataires) ? data.translataires : (Array.isArray(data) ? data : []);
      const mapped = rows.map(t => ({
        id: t._id || t.id,
        name: t.nomEntreprise || t.name || 'Transitaire',
        location: t.ville || t.location || '',
        verified: !!(t.isVerified && t.isApproved),
        rating: typeof t.avgRating === 'number' ? t.avgRating : (t.avgRating ? Number(t.avgRating) : 0),
        ratingsCount: typeof t.ratingsCount === 'number' ? t.ratingsCount : (t.ratingsCount ? Number(t.ratingsCount) : 0),
        description: t.secteurActivite || t.description || '',
        services: (Array.isArray(t.typeServices) ? t.typeServices : []).map(lbl => ({ icon: Package, label: String(lbl) }))
      }));
      setItems(mapped);
      setPage(1);
    } catch (e) {
      setErr(e?.message || 'Erreur de chargement');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTrans(); }, []);

  const renderStars = (rating, count) => (
    <div className="d-flex align-items-center gap-1">
      {[1,2,3,4,5].map((star) => (
        <Star key={star} size={16} fill={star <= Math.round(rating) ? '#FFC107' : 'none'} stroke={star <= Math.round(rating) ? '#FFC107' : '#D1D5DB'} />
      ))}
      <span className="ms-2 text-muted small">{Number(rating || 0).toFixed(1)} · {count || 0} avis</span>
    </div>
  );

  const filtered = useMemo(() => {
    const loc = searchFilters.location.trim().toLowerCase();
    const srv = searchFilters.service.trim().toLowerCase();
    const cmp = searchFilters.company.trim().toLowerCase();
    return items.filter(t => {
      const byLoc = !loc || (t.location || '').toLowerCase().includes(loc);
      const byCmp = !cmp || (t.name || '').toLowerCase().includes(cmp);
      const bySrv = !srv || (t.services || []).some(s => (s.label || '').toLowerCase().includes(srv));
      return byLoc && byCmp && bySrv;
    });
  }, [searchFilters, items]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-body" style={{ ...transitaireStyles.app, backgroundColor: 'var(--bg)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <style>{transitaireCss}</style>

      {/* Hero Section */}
      <div className="container px-2 px-md-3 py-3 py-md-5">
        <div className="text-center mb-3 mb-md-5">
          <h1 className="h2 h1-md fw-bold mb-2 mb-md-3" style={transitaireStyles.heroTitle}>Trouvez votre transitaire</h1>
          <p className="text-muted small" style={{ fontSize: '0.95rem' }}>Recherchez des transitaires par localisation, service ou nom d'entreprise.</p>
        </div>

        {/* Search Bar */}
        <div className="card border-0 shadow-sm mb-3 mb-md-4">
          <div className="card-body p-2 p-md-4">
            <div className="row g-2 g-md-3">
              <div className="col-12 col-md-3">
                <div className="input-group">
                  <span className="input-group-text border-end-0"><MapPin size={20} className="text-muted" /></span>
                  <input type="text" className="form-control border-start-0" placeholder="Localisation" value={searchFilters.location} onChange={(e)=>setSearchFilters({...searchFilters, location:e.target.value})} />
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="input-group">
                  <span className="input-group-text border-end-0"><Wrench size={20} className="text-muted" /></span>
                  <input type="text" className="form-control border-start-0" placeholder="Service" value={searchFilters.service} onChange={(e)=>setSearchFilters({...searchFilters, service:e.target.value})} />
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="input-group">
                  <span className="input-group-text border-end-0"><Building2 size={20} className="text-muted" /></span>
                  <input type="text" className="form-control border-start-0" placeholder="Entreprise" value={searchFilters.company} onChange={(e)=>setSearchFilters({...searchFilters, company:e.target.value})} />
                </div>
              </div>
              <div className="col-12 col-md-3">
                <button
                  className="btn w-100 text-white"
                  style={transitaireStyles.publishBtn}
                  onClick={() => { fetchTrans(); }}
                >
                  <Search size={20} className="me-2" /> Rechercher
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <p className="text-muted mb-0">
            {loading ? 'Chargement...' : (err ? err : (total === 0 ? 'Aucun résultat' : `Affichage de ${Math.min((page-1)*pageSize+1, total)}-${Math.min(page*pageSize, total)} sur ${total} résultats`))}
          </p>
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
            <ArrowUpDown size={16} /> Trier par Pertinence
          </button>
        </div>

        {/* Transitaire Cards */}
        <div className="row g-4 mb-5">
          {pageItems.map((transitaire, index) => (
            <div key={index} className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm h-100" style={transitaireStyles.cardHover}>
                <div className="card-body p-4">
                  {/* Header */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded d-flex align-items-center justify-content-center fw-bold" style={{ ...transitaireStyles.companyLogo, backgroundColor: transitaire.logoColor }}>
                        {transitaire.logo}
                      </div>
                      <div>
                        <h5 className="mb-1 fw-bold">{transitaire.name}</h5>
                        <p className="text-muted small mb-0">{transitaire.location}</p>
                      </div>
                    </div>
                    {transitaire.verified && (
                      <div className="d-flex align-items-center gap-1" style={transitaireStyles.verified}>
                        <CheckCircle size={16} />
                        <span className="small">Vérifié</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-muted small mb-3" style={{ minHeight: '80px' }}>{transitaire.description}</p>

                  {/* Rating */}
                  <div className="mb-3">{renderStars(transitaire.rating, transitaire.ratingsCount)}</div>

                  {/* Services */}
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {transitaire.services.map((service, idx) => {
                      const ServiceIcon = service.icon;
                      return (
                        <span key={idx} className="badge d-flex align-items-center gap-1 py-2 px-3" style={transitaireStyles.serviceBadge}>
                          <ServiceIcon size={14} /> {service.label}
                        </span>
                      );
                    })}
                  </div>

                  {/* Action Button */}
                  <div className="d-grid gap-2">
                    {(() => {
                      const nameParam = `translataireName=${encodeURIComponent(transitaire.name || '')}`;
                      const href = transitaire.id
                        ? `#/nouveau-devis?translataireId=${encodeURIComponent(transitaire.id)}&${nameParam}`
                        : `#/nouveau-devis?${nameParam}`;
                      return (
                        <a
                          href={href}
                          className="btn text-white"
                          style={transitaireStyles.primaryBtn}
                          onClick={() => {
                            try {
                              if (transitaire.id) localStorage.setItem('pendingTranslataireId', String(transitaire.id));
                              if (transitaire.name) localStorage.setItem('pendingTranslataireName', String(transitaire.name));
                            } catch {}
                          }}
                        >
                          Demander un devis
                        </a>
                      );
                    })()}
                    <select
                      className="form-select"
                      value={selectionAvis[transitaire.id] || ''}
                      onChange={(e) => setSelectionAvis(prev => ({
                        ...prev,
                        [transitaire.id]: e.target.value
                      }))}
                    >
                      <option value="">Appréciation</option>
                      <option value="satisfait">Satisfait</option>
                      <option value="moyen">Moyen</option>
                      <option value="pas_satisfait">Pas satisfait</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <nav>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Précédent</button>
            </li>
            {Array.from({ length: totalPages }).map((_, i) => (
              <li key={i} className={`page-item ${page === i+1 ? 'active' : ''}`}>
                <button
                  className="page-link"
                  style={page === i+1 ? { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' } : undefined}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Suivant</button>
            </li>
          </ul>
        </nav>
      </div>

    </div>
  );
};

export default RechercheTransitaire;
