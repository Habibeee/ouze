import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Package, MapPin, Calendar, ChevronDown } from 'lucide-react';
import { suiviEnvoiCss } from '../styles/suiviEnvoiStyle.jsx';
import { listMesDevis } from '../services/apiClient.js';

const TrackingApp = () => {
  const [activeTab, setActiveTab] = useState('en-cours');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isDetailRoute, setIsDetailRoute] = useState(() => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hash || '';
    return h.startsWith('#/envoi');
  });
  const [leafletReady, setLeafletReady] = useState(!!(typeof window !== 'undefined' && window.L));
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: 'all', carrier: 'all', dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const pathRef = useRef([]);
  const pathIndexRef = useRef(0);
  const moveTimerRef = useRef(null);

  const currentHistoryIndex = useMemo(() => {
    if (!selectedShipment?.history || selectedShipment.history.length === 0) return null;
    const history = selectedShipment.history;
    const norm = (s) => (s || '').toLowerCase();
    const labels = history.map(e => norm(e.status));

    if (norm(selectedShipment.status) === 'livre') {
      const i = labels.indexOf('livré');
      if (i !== -1) return i;
    } else {
      const preference = ['en cours de livraison', 'arrivé au centre de tri', 'colis pris en charge'];
      for (const p of preference) {
        const i = labels.indexOf(p);
        if (i !== -1) return i;
      }
    }
    return 0; // fallback: plus récent
  }, [selectedShipment, leafletReady]);

  const [shipments, setShipments] = useState([
    {
      id: 'MASTERJ2P4',
      date: '06/04/2024',
      status: 'en-transit',
      statusLabel: 'Transporté: Chronopost',
      progress: 60,
      origin: 'Lyon, FR',
      destination: 'Paris, FR',
      originCoords: [45.764, 4.8357],
      destinationCoords: [48.8566, 2.3522],
      history: [
        { status: 'Livré', date: '01/04/2024 - 14:30', description: 'Votre colis a été livré.', location: '' },
        { status: 'En cours de livraison', date: '01/04/2024 - 09:00', description: 'Le colis est avec le livreur.', location: '' },
        { status: 'Arrivé au centre de tri', date: '31/03/2024 - 18:00', description: '', location: 'Paris, France' },
        { status: 'Colis pris en charge', date: '30/03/2024 - 15:00', description: '', location: 'Lyon, France' }
      ],
      details: {
        origin: 'Lyon, FR',
        destination: 'Paris, FR',
        poids: '2.5 kg',
        dimensions: '30x20x15 cm'
      }
    },
    {
      id: '89SC20IE7',
      date: '08/05/2024',
      status: 'en-transit',
      statusLabel: 'Transporté: Fedex',
      progress: 40,
      origin: 'Dakar, SN',
      destination: 'Paris, FR',
      originCoords: [14.7167, -17.4677],
      destinationCoords: [48.8566, 2.3522]
    },
    {
      id: 'CIPR47H2',
      date: '',
      status: 'livre',
      statusLabel: 'Terminée',
      progress: 100,
      origin: 'Paris, FR',
      destination: 'Lyon, FR',
      originCoords: [48.8566, 2.3522],
      destinationCoords: [45.764, 4.8357]
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Simple geocoding via Nominatim with localStorage cache (7 jours)
  const geocodePlace = async (place) => {
    try {
      const key = `geo:${(place||'').trim().toLowerCase()}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        const obj = JSON.parse(cached);
        if (obj && obj.lat && obj.lon && (Date.now() - (obj.ts||0) < 7*24*60*60*1000)) {
          return [Number(obj.lat), Number(obj.lon)];
        }
      }
      if (!place || place.trim().length < 2) return null;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();
      const best = Array.isArray(data) && data.length ? data[0] : null;
      if (best && best.lat && best.lon) {
        const val = { lat: best.lat, lon: best.lon, ts: Date.now() };
        try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
        return [Number(best.lat), Number(best.lon)];
      }
      return null;
    } catch { return null; }
  };

  // Extraire infos de routing depuis le hash
  const getHashInfo = () => {
    try {
      const h = window.location.hash || '';
      const [path, query] = h.split('?');
      const params = new URLSearchParams(query || '');
      return { path, params };
    } catch {
      return { path: '', params: new URLSearchParams() };
    }
  };

  const getFocusId = () => {
    const { params } = getHashInfo();
    // compat : accepter ?focus=ID ou ?id=ID
    return params.get('focus') || params.get('id');
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr('');
        const data = await listMesDevis({ statut: 'accepte' });
        const devis = Array.isArray(data?.devis) ? data.devis : [];
        const mapped = await Promise.all(devis.map(async (d) => {
          const itin = d.itineraire || d.route || {};
          const origin = d.origin || d.origine || itin.origine || itin.depart || d.description || d.typeService || '-';
          const destination = d.destination || itin.destination || itin.arrivee || d.typeService || '-';
          return {
            id: d._id || d.id,
            date: d.createdAt ? new Date(d.createdAt).toISOString().slice(0,10) : '',
            status: 'en-transit',
            statusLabel: `Accepté`,
            progress: 10,
            origin,
            destination,
            originCoords: null,
            destinationCoords: null,
            history: [
              { status: 'Devis accepté', date: d.createdAt ? new Date(d.createdAt).toLocaleString() : '', description: '', location: '' },
              { status: 'Colis pris en charge', date: '', description: '', location: origin || '' },
              { status: 'En cours de livraison', date: '', description: '', location: '' },
              { status: 'Livré', date: '', description: '', location: destination || '' },
            ],
            details: { origin: origin || 'N/A', destination: destination || 'N/A', poids: 'N/A', dimensions: 'N/A' }
          };
        }));

        // Géocoder origin/destination pour chaque envoi (séquentiel léger)
        for (let i = 0; i < mapped.length; i++) {
          const it = mapped[i];
          if (!it.originCoords && it.origin && it.origin !== '-') {
            it.originCoords = await geocodePlace(it.origin);
            // petit délai pour rester poli avec Nominatim
            await new Promise(r => setTimeout(r, 150));
          }
          if (!it.destinationCoords && it.destination && it.destination !== '-') {
            it.destinationCoords = await geocodePlace(it.destination);
            await new Promise(r => setTimeout(r, 150));
          }
          // Valeurs de repli si géocodage indisponible
          if (!it.originCoords && it.destinationCoords) it.originCoords = it.destinationCoords;
          if (!it.destinationCoords && it.originCoords) it.destinationCoords = it.originCoords;
          if (!it.originCoords && !it.destinationCoords) {
            it.originCoords = [14.7167, -17.4677];
            it.destinationCoords = [48.8566, 2.3522];
            if (!it.origin || it.origin === '-') it.origin = 'Dakar, SN';
            if (!it.destination || it.destination === '-') it.destination = 'Paris, FR';
          }
          // Synchroniser la fiche détails avec les valeurs finales
          it.details = {
            origin: it.origin || 'N/A',
            destination: it.destination || 'N/A',
            poids: it.details?.poids || 'N/A',
            dimensions: it.details?.dimensions || 'N/A'
          };
        }

        if (mapped.length) setShipments(mapped);
      } catch (e) {
        setErr(e?.message || 'Erreur de chargement des envois');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let stopped = false;
    let inflight = false;
    const base = 30000;
    const max = 120000;
    let delay = base;
    let timerId;
    const cooldownRef = { until: 0 };

    const schedule = () => {
      if (stopped) return;
      clearTimeout(timerId);
      timerId = setTimeout(tick, delay);
    };

    const jitter = (ms) => {
      const delta = Math.floor(ms * 0.15);
      return ms + (Math.random() * 2 * delta - delta);
    };

    const tick = async () => {
      if (stopped) return;
      if (Date.now() < cooldownRef.until) { delay = Math.min(max, Math.max(base, delay * 1.2)); return schedule(); }
      if (typeof document !== 'undefined' && document.hidden) { delay = Math.min(max, Math.max(base, delay * 1.2)); return schedule(); }
      if (inflight) { return schedule(); }
      inflight = true;
      try {
        const data = await listMesDevis({ statut: 'accepte' });
        const devis = Array.isArray(data?.devis) ? data.devis : [];
        const updates = await Promise.all(devis.map(async (d) => {
          const itin = d.itineraire || d.route || {};
          const origin = d.origin || d.origine || itin.origine || itin.depart || '';
          const destination = d.destination || itin.destination || itin.arrivee || '';
          return { id: d._id || d.id, status: 'en-transit', statusLabel: 'Accepté', origin, destination };
        }));
        setShipments((prev) => {
          const map = new Map(prev.map(s => [s.id, s]));
          updates.forEach(u => {
            const cur = map.get(u.id);
            map.set(u.id, cur ? { ...cur, ...u } : { id: u.id, date: '', status: u.status, statusLabel: u.statusLabel, progress: 10, origin: u.origin || '-', destination: u.destination || '-', originCoords: null, destinationCoords: null, history: [{ status: 'Devis accepté', date: new Date().toLocaleString(), description: '', location: '' }], details: { origin: u.origin || '-', destination: u.destination || '-', poids: '-', dimensions: '-' } });
          });
          return Array.from(map.values());
        });
        if (devis.length === 0) {
          delay = Math.max(60000, Math.floor(delay * 1.2));
        } else {
          delay = Math.max(base, Math.floor(delay * 0.8));
        }
      } catch (e) {
        const msg = (e && e.message) ? e.message.toLowerCase() : '';
        if (msg.includes('429') || msg.includes('trop de requêtes') || msg.includes('too many')) {
          cooldownRef.until = Date.now() + 5 * 60 * 1000;
          delay = Math.min(max, delay * 2);
        } else {
          delay = Math.min(max, Math.floor(delay * 1.5));
        }
      } finally {
        inflight = false;
        clearTimeout(timerId);
        timerId = setTimeout(tick, jitter(delay));
      }
    };

    // start
    schedule();
    // visibility listener to reschedule immediately when page becomes visible
    const onVis = () => { if (!stopped && !document.hidden) { delay = base; schedule(); } };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    return () => { stopped = true; clearTimeout(timerId); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // Sélectionner automatiquement l'envoi ciblé par ?focus=ID si présent
  useEffect(() => {
    const focusId = getFocusId();
    if (!focusId || !shipments.length) return;
    const target = shipments.find(s => (s.id || '').toString() === focusId.toString());
    if (target) {
      setSelectedShipment(target);
      // Affiner la liste via la recherche pour l'afficher en premier si besoin
      setSearchQuery(target.id);
      // Faire défiler jusqu'à la carte de l'élément
      setTimeout(() => {
        const el = document.querySelector(`[data-shipment-id="${CSS.escape(target.id)}"]`);
        if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [shipments]);

  const interpolatePath = (a, b, steps = 30) => {
    if (!a || !b) return [];
    const [lat1, lng1] = a; const [lat2, lng2] = b;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push([lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]);
    }
    return pts;
  };

  const filteredShipments = shipments
    .filter(s => (activeTab === 'en-cours' ? s.status !== 'livre' : s.status === 'livre'))
    .filter(s => s.id.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(s => {
      if (filters.status !== 'all') {
        if (filters.status === 'livre' && s.status !== 'livre') return false;
        if (filters.status === 'en-transit' && s.status !== 'en-transit') return false;
      }
      if (filters.carrier !== 'all') {
        if (!s.statusLabel.toLowerCase().includes(filters.carrier.toLowerCase())) return false;
      }
      if (filters.dateFrom) {
        const sd = s.date ? new Date(s.date.split('/').reverse().join('-')) : null;
        const from = new Date(filters.dateFrom);
        if (sd && sd < from) return false;
      }
      if (filters.dateTo) {
        const sd = s.date ? new Date(s.date.split('/').reverse().join('-')) : null;
        const to = new Date(filters.dateTo);
        if (sd && sd > to) return false;
      }
      return true;
    });

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / pageSize));
  const currentPageShipments = filteredShipments.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters, activeTab]);

  // Lazy-load Leaflet if not present
  useEffect(() => {
    if (leafletReady) return;
    if (typeof window === 'undefined') return;
    if (window.L) { setLeafletReady(true); return; }
    // Inject CSS
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // Inject Script
    const jsId = 'leaflet-js';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletReady(true);
      script.onerror = () => setLeafletReady(false);
      document.body.appendChild(script);
    }
  }, [leafletReady]);

  // Auto-select a shipment by default quand aucune cible n'est fournie dans l'URL
  useEffect(() => {
    const focusId = getFocusId();
    if (focusId) return; // ne pas écraser la sélection provenant de l'URL
    if (!selectedShipment && currentPageShipments.length > 0) {
      setSelectedShipment(currentPageShipments[0]);
    }
  }, [currentPageShipments, selectedShipment]);

  // Suivre l'évolution du hash pour savoir si on est sur la route détail (#/envoi)
  useEffect(() => {
    const update = () => {
      if (typeof window === 'undefined') return;
      const h = window.location.hash || '';
      setIsDetailRoute(h.startsWith('#/envoi'));
    };
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  useEffect(() => {
    // Initialize or update map when a shipment is selected
    const L = window.L;
    if (!selectedShipment || !L || !leafletReady) return;

    const path = interpolatePath(selectedShipment.originCoords, selectedShipment.destinationCoords, 40);
    pathRef.current = path;
    // derive starting index from progress
    const startIdx = Math.floor((selectedShipment.progress / 100) * (path.length - 1));
    pathIndexRef.current = Math.min(Math.max(startIdx, 0), path.length - 1);

    if (!mapRef.current) {
      mapRef.current = L.map('leafletMap').setView(path[pathIndexRef.current] || selectedShipment.originCoords || [14.7, -17.4], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current);
    } else {
      mapRef.current.setView(path[pathIndexRef.current] || selectedShipment.originCoords || [14.7, -17.4], 5);
    }

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    markerRef.current = L.marker(path[pathIndexRef.current] || selectedShipment.originCoords).addTo(mapRef.current);

    // clear previous timer
    if (moveTimerRef.current) {
      clearInterval(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    // Désactivation par défaut de l'animation simulée du marqueur
    // Si un tracking temps réel est disponible, on le branchera ici.

    return () => {
      if (moveTimerRef.current) {
        clearInterval(moveTimerRef.current);
        moveTimerRef.current = null;
      }
    };
  }, [selectedShipment]);

  // Vue détail seule (mobile / route #/envoi)
  if (isDetailRoute) {
    return (
      <div className="bg-body" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
        <style>{suiviEnvoiCss}</style>
        <div className="container py-3" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
          <div className="mb-3 d-md-none">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => { window.location.hash = '#/envois'; }}
            >
              Retour aux envois
            </button>
          </div>

          {selectedShipment ? (
            <div className="rounded-3 shadow-sm p-3 p-md-4" style={{ backgroundColor: 'var(--card)' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Détails de l'envoi #{selectedShipment.id}</h5>
                <span
                  className="badge"
                  style={{
                    backgroundColor: selectedShipment.status === 'livre' ? '#d4edda' : '#e3f2fd',
                    color: selectedShipment.status === 'livre' ? '#28A745' : '#007BFF'
                  }}
                >
                  {selectedShipment.status === 'livre' ? 'Livré' : 'En transit'}
                </span>
              </div>

              <div id="leafletMap" className="mb-4" style={{ height: '260px', borderRadius: '8px', overflow: 'hidden', maxWidth: '100%' }} />

              <div className="mb-4">
                <h6 className="fw-bold mb-3">Historique de l'envoi</h6>
                <div className="timeline">
                  {selectedShipment.history?.map((event, index) => (
                    <div key={index} className="timeline-item d-flex">
                      <div className="timeline-axis position-relative">
                        <span className={`timeline-dot ${index === currentHistoryIndex ? 'is-current' : ''}`}></span>
                        {index < selectedShipment.history.length - 1 && (
                          <span className="timeline-line"></span>
                        )}
                      </div>
                      <div className="timeline-content">
                        <p className="fw-bold mb-1">{event.status}</p>
                        <p className="text-muted small mb-1">{event.date}</p>
                        {event.description && (
                          <p className="text-muted small mb-1">{event.description}</p>
                        )}
                        {event.location && (
                          <p className="text-muted small mb-0">{event.location}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h6 className="fw-bold mb-3">Détails supplémentaires</h6>
                <div className="row g-3">
                  <div className="col-6">
                    <p className="text-muted small mb-1">Origine</p>
                    <p className="fw-semibold small mb-0">{selectedShipment.details?.origin || selectedShipment.origin}</p>
                  </div>
                  <div className="col-6">
                    <p className="text-muted small mb-1">Destination</p>
                    <p className="fw-semibold small mb-0">{selectedShipment.details?.destination || selectedShipment.destination}</p>
                  </div>
                  <div className="col-6">
                    <p className="text-muted small mb-1">Poids</p>
                    <p className="fw-semibold small mb-0">{selectedShipment.details?.poids || '-'}</p>
                  </div>
                  <div className="col-6">
                    <p className="text-muted small mb-1">Dimensions</p>
                    <p className="fw-semibold small mb-0">{selectedShipment.details?.dimensions || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3 shadow-sm p-4 text-center text-muted" style={{ backgroundColor: 'var(--card)' }}>
              <Package size={48} color="var(--border)" className="mb-3" />
              <p>Aucun envoi sélectionné.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm mt-2"
                onClick={() => { window.location.hash = '#/envois'; }}
              >
                Retour aux envois
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vue liste + panneau latéral
  return (
    <div className="bg-body" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <style>{suiviEnvoiCss}</style>
      <div className="container py-4">
        <div className="row">
          <div className="col-lg-8">
            <div className="rounded-3 shadow-sm p-4" style={{ backgroundColor: 'var(--card)' }}>
              <h4 className="fw-bold mb-4">Suivi de mes envois</h4>

              {/* Search Bar */}
              <div className="position-relative mb-4">
                <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Rechercher un envoi par numéro de suivi"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ backgroundColor: 'var(--card)', border: 'none', padding: '12px 12px 12px 45px' }}
                />
              </div>

              {/* Filters */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-3">
                  <label className="form-label small text-muted">Statut</label>
                  <select className="form-select" value={filters.status} onChange={(e)=>setFilters(f=>({...f, status: e.target.value }))}>
                    <option value="all">Tous</option>
                    <option value="en-transit">En transit</option>
                    <option value="livre">Livré</option>
                  </select>
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label small text-muted">Transporteur</label>
                  <select className="form-select" value={filters.carrier} onChange={(e)=>setFilters(f=>({...f, carrier: e.target.value }))}>
                    <option value="all">Tous</option>
                    <option value="chronopost">Chronopost</option>
                    <option value="fedex">Fedex</option>
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small text-muted">Du</label>
                  <input type="date" className="form-control" value={filters.dateFrom} onChange={(e)=>setFilters(f=>({...f, dateFrom: e.target.value }))} />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small text-muted">Au</label>
                  <input type="date" className="form-control" value={filters.dateTo} onChange={(e)=>setFilters(f=>({...f, dateTo: e.target.value }))} />
                </div>
              </div>

              {/* Tabs */}
              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'en-cours' ? 'active' : ''}`}
                    onClick={() => setActiveTab('en-cours')}
                    style={{ 
                      color: activeTab === 'en-cours' ? 'var(--primary)' : 'var(--muted)',
                      borderBottom: activeTab === 'en-cours' ? '3px solid var(--primary)' : 'none',
                      fontWeight: activeTab === 'en-cours' ? '600' : '400'
                    }}
                  >
                    En cours
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'terminee' ? 'active' : ''}`}
                    onClick={() => setActiveTab('terminee')}
                    style={{ 
                      color: activeTab === 'terminee' ? 'var(--primary)' : 'var(--muted)',
                      borderBottom: activeTab === 'terminee' ? '3px solid var(--primary)' : 'none',
                      fontWeight: activeTab === 'terminee' ? '600' : '400'
                    }}
                  >
                    Terminée
                  </button>
                </li>
              </ul>

              {/* Shipments List */}
              {loading && <div className="text-center text-muted py-3">Chargement...</div>}
              {err && <div className="alert alert-danger">{err}</div>}
              {!loading && !err && filteredShipments.length === 0 && (
                <div className="rounded-3 shadow-sm p-4 text-center text-muted" style={{ backgroundColor: 'var(--card)' }}>
                  <Package size={48} color="var(--border)" className="mb-3" />
                  <p>Aucun envoi à afficher. Les envois apparaissent ici dès qu’un devis est accepté par un transitaire.</p>
                </div>
              )}
              <div className="d-flex flex-column gap-3">
                {currentPageShipments.map((shipment) => (
                  <div 
                    key={shipment.id}
                    className="border rounded-3 p-3 shipment-card"
                    data-shipment-id={shipment.id}
                    style={{ cursor: 'pointer', backgroundColor: selectedShipment?.id === shipment.id ? 'rgba(52, 211, 153, 0.12)' : 'var(--card)' }}
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-start gap-3">
                        <div className="bg-light rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} color="var(--muted)" />
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1">Envoi {shipment.id}</h6>
                          <p className="text-muted small mb-2">Livraison prévue : {shipment.date}</p>
                          <span className="carrier-pill">{shipment.statusLabel}</span>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedShipment(shipment); }}>Suivre</button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="progress progress-thick rounded-pill">
                      <div className="progress-bar progress-green rounded-pill" style={{ width: `${shipment.progress}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-muted">Page {page} sur {totalPages}</small>
                <div className="btn-group">
                  <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={()=>setPage(p=>Math.max(1, p-1))}>Précédent</button>
                  <button className="btn btn-outline-secondary btn-sm" disabled={page === totalPages} onClick={()=>setPage(p=>Math.min(totalPages, p+1))}>Suivant</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Shipment Details */}
          <div className="col-lg-4 mt-4 mt-lg-0">
            {selectedShipment ? (
              <div className="rounded-3 shadow-sm p-4" style={{ backgroundColor: 'var(--card)' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">Détails de l'envoi #{selectedShipment.id}</h5>
                  <span 
                    className="badge" 
                    style={{ 
                      backgroundColor: selectedShipment.status === 'livre' ? '#d4edda' : '#e3f2fd',
                      color: selectedShipment.status === 'livre' ? '#28A745' : '#007BFF'
                    }}
                  >
                    {selectedShipment.status === 'livre' ? 'Livré' : 'En transit'}
                  </span>
                </div>

                {/* Map */}
                <div id="leafletMap" className="mb-4" style={{ height: '240px', borderRadius: '8px', overflow: 'hidden' }} />

                {/* History */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Historique de l'envoi</h6>
                  <div className="timeline">
                    {selectedShipment.history?.map((event, index) => (
                      <div key={index} className="timeline-item d-flex">
                        <div className="timeline-axis position-relative">
                          <span className={`timeline-dot ${index === currentHistoryIndex ? 'is-current' : ''}`}></span>
                          {index < selectedShipment.history.length - 1 && (
                            <span className="timeline-line"></span>
                          )}
                        </div>
                        <div className="timeline-content">
                          <p className="fw-bold mb-1">{event.status}</p>
                          <p className="text-muted small mb-1">{event.date}</p>
                          {event.description && (
                            <p className="text-muted small mb-1">{event.description}</p>
                          )}
                          {event.location && (
                            <p className="text-muted small mb-0">{event.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <h6 className="fw-bold mb-3">Détails supplémentaires</h6>
                  <div className="row g-3">
                    <div className="col-6">
                      <p className="text-muted small mb-1">Origine</p>
                      <p className="fw-semibold small mb-0">{selectedShipment.details?.origin || selectedShipment.origin}</p>
                    </div>
                    <div className="col-6">
                      <p className="text-muted small mb-1">Destination</p>
                      <p className="fw-semibold small mb-0">{selectedShipment.details?.destination || selectedShipment.destination}</p>
                    </div>
                    <div className="col-6">
                      <p className="text-muted small mb-1">Poids</p>
                      <p className="fw-semibold small mb-0">{selectedShipment.details?.poids || '-'}</p>
                    </div>
                    <div className="col-6">
                      <p className="text-muted small mb-1">Dimensions</p>
                      <p className="fw-semibold small mb-0">{selectedShipment.details?.dimensions || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3 shadow-sm p-4 text-center text-muted" style={{ backgroundColor: 'var(--card)' }}>
                <Package size={48} color="var(--border)" className="mb-3" />
                <p>Sélectionnez un envoi pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingApp;
