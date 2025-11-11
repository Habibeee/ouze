import React, { useEffect, useMemo, useState } from 'react';
import { 
  MapPin, Wrench, Building2, Search, Bell, User, Star,
  Plane, Truck, Ship, Package, ArrowUpDown, CheckCircle,
  LayoutGrid, FileText, Clock
} from 'lucide-react';
import { transitaireStyles, transitaireCss } from '../styles/rechercheTransitaireStyle.jsx';
import { useToast } from '../src/toast.jsx';
import { searchTranslatairesClient, getTranslataireReviews, getMyReview, createReview, updateReview, deleteReview } from '../services/apiClient.js';

const RechercheTransitaire = () => {
  const { success, error: toastError } = useToast();
  const [searchFilters, setSearchFilters] = useState({ location: '', service: '', company: '' });
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [selectedTrans, setSelectedTrans] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsErr, setReviewsErr] = useState('');
  const [avgRating, setAvgRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [myReview, setMyReview] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [sortReviews, setSortReviews] = useState('recent');
  const [minRating, setMinRating] = useState('');

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

  // Ouvrir automatiquement les avis si on arrive avec transId dans le hash
  useEffect(() => {
    const tryOpenFromHash = () => {
      const hash = window.location.hash || '';
      const parts = hash.split('?');
      if (parts.length < 2) return;
      const params = new URLSearchParams(parts[1]);
      const transId = params.get('transId');
      const open = params.get('open');
      if (!transId || open !== 'reviews') return;
      const t = items.find(x => String(x.id) === String(transId));
      if (t) openReviews(t);
    };
    tryOpenFromHash();
    const onHash = () => tryOpenFromHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [items]);

  const openReviews = async (t) => {
    setSelectedTrans(t);
    setReviewsOpen(true);
    setReviews([]);
    setReviewsErr('');
    setMyReview(null);
    setNewRating(5);
    setNewComment('');
    try {
      setReviewsLoading(true);
      const [list, mine] = await Promise.all([
        getTranslataireReviews(t.id, { page: 1, limit: 10, sort: sortReviews, minRating: minRating || undefined }),
        getMyReview(t.id).catch(()=>({}))
      ]);
      setReviews(Array.isArray(list?.items) ? list.items : []);
      setAvgRating(Number(list?.avgRating || 0));
      setRatingsCount(Number(list?.ratingsCount || 0));
      setMyReview(mine?.review || null);
      return { avgRating: Number(list?.avgRating || 0), ratingsCount: Number(list?.ratingsCount || 0) };
    } catch (e) {
      setReviewsErr(e?.message || 'Erreur chargement des avis');
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!selectedTrans?.id) return;
    try {
      const resp = await createReview({ translataireId: selectedTrans.id, rating: newRating, comment: newComment });
      // Préférer la réponse API si elle renvoie l'avis créé
      const created = resp?.review || resp?.data || resp || { _id: `local-${Date.now()}`, rating: newRating, comment: newComment, userId: {}, createdAt: new Date().toISOString() };
      // Si on n'a pas d'_id valide, on refetch pour ne pas casser la suite
      const hasValidId = created && created._id && !String(created._id).startsWith('local-');
      if (!hasValidId) {
        await openReviews(selectedTrans);
      } else {
        setReviews((prev) => [created, ...prev]);
        setRatingsCount((c) => (c || 0) + 1);
        setAvgRating((prevAvg) => {
          const c = (ratingsCount || 0) + 1;
          return ((Number(prevAvg || 0) * (c - 1) + Number(newRating)) / c);
        });
        setMyReview(created);
      }
      // Rafraîchir la liste et les stats pour refléter immédiatement côté UI
      try {
        const stats = await openReviews(selectedTrans);
        if (stats) setItems(prev => prev.map(x => x.id === selectedTrans.id ? { ...x, rating: stats.avgRating, ratingsCount: stats.ratingsCount } : x));
      } catch {}
      success("Avis envoyé");
    } catch (e) {
      toastError(e?.message || "Erreur lors de l'envoi de l'avis");
    }
  };

  const saveMyReview = async () => {
    if (!myReview?._id) return;
    try {
      // Si l'ID semble local, rafraîchir la liste pour obtenir le véritable ID avant PUT
      if (String(myReview._id).startsWith('local-')) {
        await openReviews(selectedTrans);
      }
      await updateReview(myReview._id, { rating: newRating, comment: newComment });
      setReviews((prev) => prev.map(r => r._id === myReview._id ? { ...r, rating: newRating, comment: newComment } : r));
      setAvgRating((prevAvg) => {
        const c = (ratingsCount || 0);
        if (!c) return prevAvg;
        const old = Number(myReview.rating || 0);
        const sum = Number(prevAvg || 0) * c;
        const next = (sum - old + Number(newRating)) / c;
        return next;
      });
      setMyReview((r) => r ? { ...r, rating: newRating, comment: newComment } : r);
      try {
        const stats = await openReviews(selectedTrans);
        if (stats) setItems(prev => prev.map(x => x.id === selectedTrans.id ? { ...x, rating: stats.avgRating, ratingsCount: stats.ratingsCount } : x));
      } catch {}
      success('Avis mis à jour');
    } catch (e) {
      toastError(e?.message || "Erreur lors de la mise à jour de l'avis");
    }
  };

  const removeMyReview = async () => {
    if (!myReview?._id) return;
    if (!window.confirm('Supprimer votre avis ?')) return;
    try {
      await deleteReview(myReview._id);
      setReviews((prev) => prev.filter(r => r._id !== myReview._id));
      setAvgRating((prevAvg) => {
        const c = (ratingsCount || 0);
        if (c <= 1) return 0;
        const sum = Number(prevAvg || 0) * c;
        const next = (sum - Number(myReview.rating || 0)) / (c - 1);
        return next;
      });
      setRatingsCount((c) => Math.max(0, (c || 0) - 1));
      setMyReview(null);
      try {
        const stats = await openReviews(selectedTrans);
        if (stats) setItems(prev => prev.map(x => x.id === selectedTrans.id ? { ...x, rating: stats.avgRating, ratingsCount: stats.ratingsCount } : x));
      } catch {}
      success('Avis supprimé');
    } catch (e) {
      toastError(e?.message || "Erreur lors de la suppression de l'avis");
    }
  };

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
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => openReviews(transitaire)}
                    >
                      Voir les avis
                    </button>
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

      {/* Reviews Modal */}
      {reviewsOpen && (
        <div className="modal fade show" style={{ display:'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Avis pour {selectedTrans?.name}</h5>
                <button type="button" className="btn-close" onClick={() => setReviewsOpen(false)}></button>
              </div>
              <div className="modal-body">
                {reviewsLoading && <div className="text-center text-muted py-3">Chargement...</div>}
                {reviewsErr && <div className="alert alert-danger">{reviewsErr}</div>}
                {!reviewsLoading && !reviewsErr && (
                  <>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="fs-4 fw-bold">{Number(avgRating||0).toFixed(1)} / 5</div>
                      <div className="text-muted">{ratingsCount} avis</div>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">Trier par</label>
                        <select className="form-select" value={sortReviews} onChange={(e)=>setSortReviews(e.target.value)}>
                          <option value="recent">Plus récent</option>
                          <option value="rating">Meilleure note</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Note minimale</label>
                        <select className="form-select" value={minRating} onChange={(e)=>setMinRating(e.target.value)}>
                          <option value="">Toutes</option>
                          <option value="4">4★ et plus</option>
                          <option value="3">3★ et plus</option>
                          <option value="2">2★ et plus</option>
                          <option value="1">1★ et plus</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <button className="btn btn-outline-primary" onClick={()=>openReviews(selectedTrans)}>Appliquer</button>
                      </div>
                    </div>
                    <ul className="list-group mb-4">
                      {reviews.map((r) => (
                        <li key={r._id} className="list-group-item">
                          <div className="d-flex justify-content-between">
                            <div>
                              <strong>{r?.userId?.prenom || ''} {r?.userId?.nom || ''}</strong>
                              <div className="small text-muted">{new Date(r?.createdAt || Date.now()).toLocaleDateString()}</div>
                            </div>
                            <div className="badge bg-warning text-dark">{r.rating} ★</div>
                          </div>
                          {r.comment && <div className="mt-2">{r.comment}</div>}
                        </li>
                      ))}
                      {reviews.length === 0 && <li className="list-group-item text-muted">Aucun avis pour le moment.</li>}
                    </ul>
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="fw-bold mb-3">{myReview ? 'Modifier mon avis' : 'Laisser un avis'}</h6>
                        {myReview && (
                          <div className="alert alert-info d-flex justify-content-between align-items-center">
                            <div>Vous avez déjà un avis. Vous pouvez le modifier ou le supprimer.</div>
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-danger" onClick={removeMyReview}>Supprimer</button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setNewRating(myReview.rating); setNewComment(myReview.comment || ''); }}>Charger mon avis</button>
                            </div>
                          </div>
                        )}
                        <div className="row g-3">
                          <div className="col-12 col-md-3">
                            <label className="form-label">Note</label>
                            <select className="form-select" value={newRating} onChange={(e)=>setNewRating(Number(e.target.value))}>
                              {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} ★</option>)}
                            </select>
                          </div>
                          <div className="col-12 col-md-9">
                            <label className="form-label">Commentaire (optionnel)</label>
                            <input className="form-control" value={newComment} onChange={(e)=>setNewComment(e.target.value)} placeholder="Votre retour..." />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setReviewsOpen(false)}>Fermer</button>
                {!myReview && (
                  <button className="btn btn-primary" onClick={submitReview} disabled={reviewsLoading || !selectedTrans?.id}>Envoyer l'avis</button>
                )}
                {myReview && (
                  <button className="btn btn-primary" onClick={saveMyReview} disabled={reviewsLoading || !selectedTrans?.id}>Enregistrer les modifications</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RechercheTransitaire;
