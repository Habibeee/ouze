import React, { useEffect, useMemo, useState } from 'react';
import { 
  MapPin, Wrench, Building2, Search, Star,
  CheckCircle, Clock, AlertCircle, ArrowUpDown
} from 'lucide-react';
import { transitaireStyles, transitaireCss } from '../styles/rechercheTransitaireStyle.jsx';
import { searchTranslatairesClient } from '../services/apiClient.js';
import { useI18n } from '../src/i18n.jsx';

const RechercheTransitaire = () => {
  const { t, lang } = useI18n();
  const [searchFilters, setSearchFilters] = useState({ location: '', service: '', company: '' });
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [items, setItems] = useState([
    // Données de test (à supprimer en production)
    {
      id: '1',
      name: 'Transitaire Express',
      location: 'Paris, France',
      verified: true,
      rating: 4.5,
      ratingsCount: 12,
      description: 'Service rapide et professionnel',
      services: ['Transport maritime', 'Dédouanement', 'Logistique'],
      logoUrl: 'data:image/svg+xml;utf8,<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="30" text-anchor="middle" dy=".3em" fill="%23666">TE</text></svg>'
    },
    {
      id: '2',
      name: 'Global Logistics',
      location: 'Lyon, France',
      verified: true,
      rating: 4.2,
      ratingsCount: 8,
      description: 'Spécialiste du transport international',
      services: ['Transport aérien', 'Transport routier'],
      logoUrl: 'data:image/svg+xml;utf8,<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="30" text-anchor="middle" dy=".3em" fill="%23666">GL</text></svg>'
    },
    {
      id: '3',
      name: 'Cargo Plus',
      location: 'Marseille, France',
      verified: false,
      rating: 3.8,
      ratingsCount: 5,
      description: 'Votre partenaire logistique',
      services: ['Transport maritime', 'Entreposage'],
      logoUrl: 'data:image/svg+xml;utf8,<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="30" text-anchor="middle" dy=".3em" fill="%23666">CP</text></svg>'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  // Sélection locale simple pour "Voir les avis" côté client
  const [selectionAvis, setSelectionAvis] = useState({}); // { [idTrans]: 'satisfait' | 'moyen' | 'pas_satisfait' }
  const [selectedTransitaire, setSelectedTransitaire] = useState(null);

  const fetchTrans = async () => {
    try {
      setLoading(true); 
      setErr('');
      console.log('Recherche des transitaires avec les filtres:', searchFilters);
      
      const data = await searchTranslatairesClient({ 
        typeService: searchFilters.service || undefined, 
        ville: searchFilters.location || undefined, 
        recherche: searchFilters.company || undefined 
      });
      
      console.log('Réponse de l\'API:', data);
      
      // Vérifier si la réponse est vide ou invalide
      if (!data) {
        console.error('Aucune donnée reçue de l\'API');
        setErr('Aucune donnée reçue du serveur');
        setItems([]);
        return;
      }
      
      // Gérer différents formats de réponse
      const rows = Array.isArray(data) 
        ? data 
        : (Array.isArray(data.translataires) 
            ? data.translataires 
            : []);
            
      console.log('Transitaires trouvés:', rows.length);
      const mapped = rows.map(t => {
        const avgRating = typeof t.avgRating === 'number' ? t.avgRating : (t.avgRating ? Number(t.avgRating) : 0);
        const adminRating = typeof t.adminRating === 'number' ? t.adminRating : (t.adminRating ? Number(t.adminRating) : 0);
        const ratingForStars = adminRating > 0 ? adminRating : avgRating;
        const ratingsCount = typeof t.ratingsCount === 'number' ? t.ratingsCount : (t.ratingsCount ? Number(t.ratingsCount) : 0);
        const name = t.nomEntreprise || t.name || 'Transitaire';
        const logoRaw = t.logo || t.photoProfil || t.profileImage || t.logoUrl || t.avatar;
        const defaultLogo = 'data:image/svg+xml;utf8,<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" dy=".3em" fill="%23666">Logo</text></svg>';
        const logoUrl = (typeof logoRaw === 'string' && logoRaw.trim()) ? logoRaw : defaultLogo;
        const rawServices = (Array.isArray(t.services) && t.services.length)
          ? t.services
          : (typeof t.secteurActivite === 'string' ? t.secteurActivite.split(',') : []);
        const services = Array.isArray(rawServices)
          ? rawServices.map((s) => String(s).trim()).filter(Boolean)
          : [];

        // Réorganisation des services : ordre métier prioritaire puis tri alphabétique
        const servicePriority = [
          'transport maritime',
          'fret aérien',
          'transport routier',
          "logistique d'entreposage",
          'logistique',
          'dédouanement',
          'transit'
        ];

        const servicesOrdered = [...services].sort((a, b) => {
          const aNorm = String(a).toLowerCase().trim();
          const bNorm = String(b).toLowerCase().trim();

          const aIndex = servicePriority.indexOf(aNorm);
          const bIndex = servicePriority.indexOf(bNorm);

          const aHasPriority = aIndex !== -1;
          const bHasPriority = bIndex !== -1;

          if (aHasPriority && bHasPriority) {
            return aIndex - bIndex;
          }
          if (aHasPriority && !bHasPriority) return -1;
          if (!aHasPriority && bHasPriority) return 1;

          return aNorm.localeCompare(bNorm);
        });
        return {
          id: t._id || t.id,
          name,
          location: t.ville || t.location || '',
          verified: !!(t.isVerified && t.isApproved),
          rating: ratingForStars,
          ratingsCount,
          description: t.description || '',
          services: servicesOrdered,
          logoUrl,
        };
      });
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
      const bySrv = !srv || (Array.isArray(t.services) && t.services.some(s => String(s).toLowerCase().includes(srv)));
      return byLoc && byCmp && bySrv;
    });
  }, [searchFilters, items]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Afficher un message d'erreur s'il y en a un
  if (err) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h5 className="alert-heading">Erreur lors du chargement des transitaires</h5>
          <p className="mb-0">{err}</p>
          <button 
            className="btn btn-outline-secondary mt-3" 
            onClick={fetchTrans}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <span className="ms-3">Recherche des transitaires en cours...</span>
      </div>
    );
  }

  return (
    <div className="bg-body" style={{ ...transitaireStyles.app, backgroundColor: 'var(--bg)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <style>{transitaireCss}</style>

      {/* Hero Section */}
      <div className="container px-2 px-md-3 py-3 py-md-5">
        <div className="text-center mb-3 mb-md-5">
          <h1 className="h2 h1-md fw-bold mb-2 mb-md-3" style={transitaireStyles.heroTitle}>{t('client.search.title')}</h1>
          <p className="text-muted small" style={{ fontSize: '0.95rem' }}>{t('client.search.subtitle')}</p>
        </div>

        {/* Search Bar */}
        <div className="card border-0 shadow-sm mb-3 mb-md-4">
          <div className="card-body p-2 p-md-4">
            <div className="row g-2 g-md-3">
              <div className="col-12 col-md-3">
                <div className="input-group">
                  <span className="input-group-text border-end-0"><MapPin size={20} className="text-muted" /></span>
                  <input type="text" className="form-control border-start-0" placeholder={t('client.search.filters.location')} value={searchFilters.location} onChange={(e)=>setSearchFilters({...searchFilters, location:e.target.value})} />
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="input-group">
                  <span className="input-group-text border-end-0"><Wrench size={20} className="text-muted" /></span>
                  <input type="text" className="form-control border-start-0" placeholder={t('client.search.filters.service')} value={searchFilters.service} onChange={(e)=>setSearchFilters({...searchFilters, service:e.target.value})} />
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="input-group">
                  <span className="input-group-text border-end-0"><Building2 size={20} className="text-muted" /></span>
                  <input type="text" className="form-control border-start-0" placeholder={t('client.search.filters.company')} value={searchFilters.company} onChange={(e)=>setSearchFilters({...searchFilters, company:e.target.value})} />
                </div>
              </div>
              <div className="col-12 col-md-3">
                <button
                  className="btn w-100 text-white"
                  style={transitaireStyles.publishBtn}
                  onClick={() => { fetchTrans(); }}
                >
                  <Search size={20} className="me-2" /> {t('client.search.button.submit')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <p className="text-muted mb-0">
            {loading
              ? t('client.search.results.loading')
              : (err
                ? err
                : (total === 0
                  ? t('client.search.results.none')
                  : (() => {
                      const from = Math.min((page-1)*pageSize+1, total);
                      const to = Math.min(page*pageSize, total);
                      const tpl = t('client.search.results.range');
                      return tpl
                        .replace('{{from}}', String(from))
                        .replace('{{to}}', String(to))
                        .replace('{{total}}', String(total));
                    })()
                  )
                )}
          </p>
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
            <ArrowUpDown size={16} /> {t('client.search.sort.relevance')}
          </button>
        </div>

        {/* Transitaire Cards */}
        <div className="row g-4 mb-5">
          {pageItems.map((transitaire, index) => (
            <div key={index} className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm h-100" style={transitaireStyles.cardHover}>
                <div className="card-body p-3">
                  {/* Header */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center bg-light border"
                        style={{ ...transitaireStyles.companyLogo }}
                      >
                        <img
                          src={transitaire.logoUrl}
                          alt={transitaire.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <h5 className="mb-1 fw-bold">{transitaire.name}</h5>
                        <p className="text-muted small mb-0">{transitaire.location}</p>
                      </div>
                    </div>
                    {transitaire.verified && (
                      <div className="d-flex align-items-center gap-1" style={transitaireStyles.verified}>
                        <CheckCircle size={16} />
                        <span className="small">{t('client.search.badge.verified')}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-muted small mb-3" style={{ minHeight: '80px' }}>{transitaire.description}</p>

                  {/* Rating */}
                  <div className="mb-3">{renderStars(transitaire.rating, transitaire.ratingsCount)}</div>

                  {/* Secteurs d'activité */}
                  <div className="mb-4">
                    {Array.isArray(transitaire.services) && transitaire.services.length ? (
                      <div className="d-flex flex-wrap gap-2">
                        {transitaire.services.map((label, idx) => (
                          <span key={idx} className="badge py-2 px-3" style={transitaireStyles.serviceBadge}>
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted small mb-0">{t('client.search.services.none')}</p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="d-grid gap-2">
                    {(() => {
                      return (
                        <button
                          className="btn text-white w-100"
                          style={transitaireStyles.primaryBtn}
                          onClick={() => {
                            try {
                              if (transitaire.id) {
                                // Stocker les informations du transitaire dans localStorage
                                localStorage.setItem('pendingTranslataireId', String(transitaire.id));
                                localStorage.setItem('pendingTranslataireName', String(transitaire.name || ''));
                                
                                // Utiliser directement la navigation vers nouveau-devis avec les paramètres
                                const params = new URLSearchParams();
                                params.append('translataireId', transitaire.id);
                                if (transitaire.name) {
                                  params.append('translataireName', transitaire.name);
                                }
                                
                                // Rediriger directement vers la page de création de devis
                                window.location.hash = `#/nouveau-devis?${params.toString()}`;
                                
                                // Forcer le rechargement si nécessaire
                                window.dispatchEvent(new Event('hashchange'));
                                
                                // Faire défiler vers le haut de la page
                                window.scrollTo(0, 0);
                              }
                            } catch (e) {
                              console.error('Erreur lors de la sélection du transitaire:', e);
                            }
                          }}
                        >
                          {t('client.search.quote_button')}
                        </button>
                      );
                    })()}
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <AlertCircle size={16} />
                      <span>Ce transitaire sera responsable de votre demande</span>
                    </div>
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
              <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>{t('client.search.pagination.prev')}</button>
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
              <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>{t('client.search.pagination.next')}</button>
            </li>
          </ul>
        </nav>
      </div>

    </div>
  );
};

export default RechercheTransitaire;
