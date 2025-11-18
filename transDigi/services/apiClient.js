const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let rateLimitedUntil = 0; // epoch ms until which we should avoid firing requests

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const token = localStorage.getItem('token');
  const MAX_RETRIES_429 = 3;
  let attempt = 0;
  let lastErr;
  while (attempt < MAX_RETRIES_429) {
    try {
      // Short-circuit if we're under a global cooldown to avoid hammering
      const now = Date.now();
      if (rateLimitedUntil && now < rateLimitedUntil) {
        const err = new Error('');
        err.status = 429;
        err.silent = true;
        throw err;
      }
      // Spread bursts a bit
      if (attempt === 0) {
        await sleep(50 + Math.floor(Math.random() * 120));
      }
      const defaultHeaders = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      };
      // Only set Content-Type when a body is provided to avoid unnecessary preflight
      const hasBody = body !== undefined && body !== null;
      const isForm = (typeof FormData !== 'undefined') && body instanceof FormData;
      if (hasBody && !isForm) defaultHeaders['Content-Type'] = 'application/json';

      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { ...defaultHeaders, ...(headers || {}) },
        credentials: 'include',
        cache: 'no-store',
        body: hasBody ? (isForm ? body : JSON.stringify(body)) : undefined,
      });
      if (res.status === 429) {
        // Respecter Retry-After si fourni, sinon backoff exponentiel + jitter
        const ra = res.headers.get('retry-after');
        let waitMs = ra ? parseInt(ra, 10) * 1000 : (1000 * Math.pow(2, attempt));
        if (!waitMs || isNaN(waitMs)) waitMs = 1000 * Math.pow(2, attempt);
        // jitter 0-400ms pour éviter l'effet de troupeau
        waitMs += Math.floor(Math.random() * 400);
        // Set a global cooldown window to reduce subsequent calls pressure
        rateLimitedUntil = Date.now() + Math.min(waitMs * 2, 5 * 60 * 1000);
        if (attempt < MAX_RETRIES_429 - 1) {
          await sleep(waitMs);
          attempt++;
          continue;
        }
      }
      if (res.status === 401) {
        try { window.dispatchEvent(new CustomEvent('auth:unauthorized')); } catch {}
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('userType');
        } catch {}
        // Rediriger uniquement si un token existait (session expirée) ET que l'utilisateur n'est pas déjà sur une page publique
        try {
          const hadToken = !!token;
          const h = (typeof window !== 'undefined' && window.location && window.location.hash) ? window.location.hash : '';
          const publicPrefixes = ['#/', '#/signup', '#/client', '#/transitaire', '#/connexion', '#/apropos', '#/contact', '#/mot-de-passe-oublie', '#/verifier', '#/reinitialiser'];
          const isPublic = publicPrefixes.some((p) => h.startsWith(p));
          if (hadToken && !isPublic) {
            setTimeout(() => { try { window.location.hash = '#/connexion'; } catch {} }, 0);
          }
        } catch {}
      }
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) {
        const is429 = res.status === 429;
        const message = typeof data === 'string' ? data : (data?.message || (is429 ? '' : 'Erreur serveur'));
        const err = new Error(`${message}${res.status && message ? ` (HTTP ${res.status})` : ''}`);
        err.status = res.status;
        err.data = data;
        if (is429) err.silent = true;
        throw err;
      }
      return data;
    } catch (e) {
      lastErr = e;
      break;
    }
  }
  throw lastErr || new Error('Erreur réseau');
}

export async function login(payload) {
  return apiFetch('/auth/login', { method: 'POST', body: payload });
}

export async function get(path) {
  return apiFetch(path, { method: 'GET' });
}

export async function post(path, body) {
  return apiFetch(path, { method: 'POST', body });
}

export async function put(path, body) {
  return apiFetch(path, { method: 'PUT', body });
}

export async function putForm(path, formData) {
  // formData must be an instance of FormData
  return apiFetch(path, { method: 'PUT', body: formData, headers: {} });
}

export async function logout() {
  try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userType');
  try {
    localStorage.removeItem('avatarUrl');
    localStorage.removeItem('transLogoUrl');
    localStorage.removeItem('pendingPhoto:user');
    localStorage.removeItem('pendingPhoto:translataire');
  } catch {}
}

export async function del(path) {
  return apiFetch(path, { method: 'DELETE' });
}

// Admin - Notation des transitaires
export async function setTranslataireAdminRating(id, rating) {
  if (!id) throw new Error('id requis');
  // La route backend est montée sous /api/admin
  return apiFetch(`/api/admin/translataires/${encodeURIComponent(id)}/rating`, {
    method: 'PUT',
    body: { rating }
  });
}

// Notifications helpers
export async function listNotifications(limit = 10) {
  const q = typeof limit === 'number' ? `?limit=${encodeURIComponent(limit)}` : '';
  return get(`/notifications${q}`);
}

export async function markNotificationRead(idOrIds) {
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  return post('/notifications/mark-read', { ids });
}

export async function markAllNotificationsRead() {
  return post('/notifications/mark-all-read', {});
}

export async function getUnreadNotificationsCount() {
  return get('/notifications/unread-count');
}

// Admin profile
export async function getAdminProfile() {
  return get('/admin/profile');
}

export async function updateAdminProfile(body) {
  return put('/admin/profile', body);
}

export async function updateAdminEmail(email) {
  return put('/admin/profile/email', { email });
}

// Client - Devis
export async function createDevis(translataireId, body) {
  if (!translataireId) throw new Error('translataireId requis');
  // Permettre envoi fichier via FormData (clé attendue: 'fichier')
  if (body instanceof FormData) {
    return apiFetch(`/users/demande-devis/${encodeURIComponent(translataireId)}`, { method: 'POST', body });
  }
  return post(`/users/demande-devis/${encodeURIComponent(translataireId)}`, body);
}

export async function listMesDevis(params) {
  if (!params || typeof params !== 'object') return get('/users/mes-devis');
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && String(v).length) search.set(k, String(v)); });
  const q = search.toString() ? `?${search.toString()}` : '';
  return get(`/users/mes-devis${q}`);
}

export async function cancelDevis(devisId) {
  return apiFetch(`/users/devis/${encodeURIComponent(devisId)}/cancel`, { method: 'PUT' });
}

// Client - Supprimer définitivement un devis
export async function deleteMonDevis(id) {
  if (!id) throw new Error('id requis');
  return del(`/users/devis/${encodeURIComponent(id)}`);
}

// Client - Détail devis
export async function getMonDevisById(id) {
  if (!id) throw new Error('id requis');
  return get(`/users/devis/${encodeURIComponent(id)}`);
}

// Client - Mettre à jour un devis
export async function updateMonDevis(id, body) {
  if (!id) throw new Error('id requis');
  if (body instanceof FormData) {
    return apiFetch(`/users/devis/${encodeURIComponent(id)}`, { method: 'PUT', body, headers: {} });
  }
  return apiFetch(`/users/devis/${encodeURIComponent(id)}`, { method: 'PUT', body });
}

// Client - Recherche des transitaires
export async function searchTranslatairesClient({ typeService, ville, recherche } = {}) {
  const params = new URLSearchParams();
  if (typeService) params.set('typeService', typeService);
  if (ville) params.set('ville', ville);
  if (recherche) params.set('recherche', recherche);
  const q = params.toString() ? `?${params.toString()}` : '';
  return get(`/users/search-translataires${q}`);
}

// Avis - Reviews
export async function getTranslataireReviews(translataireId, { page = 1, limit = 10, sort = 'recent', minRating } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
  if (minRating) params.set('minRating', String(minRating));
  const q = params.toString() ? `?${params.toString()}` : '';
  return get(`/reviews/translataire/${encodeURIComponent(translataireId)}${q}`);
}

export async function getMyReview(translataireId) {
  return get(`/reviews/mine/${encodeURIComponent(translataireId)}`);
}

export async function createReview({ translataireId, rating, comment, attachments }) {
  const fd = new FormData();
  fd.append('translataireId', translataireId);
  fd.append('rating', String(rating));
  if (comment) fd.append('comment', comment);
  if (attachments && Array.isArray(attachments)) {
    attachments.forEach((f) => f && fd.append('attachments', f));
  }
  return apiFetch('/reviews', { method: 'POST', body: fd });
}

export async function updateReview(id, { rating, comment, attachments }) {
  const fd = new FormData();
  if (rating !== undefined) fd.append('rating', String(rating));
  if (comment !== undefined) fd.append('comment', comment);
  if (attachments && Array.isArray(attachments)) {
    attachments.forEach((f) => f && fd.append('attachments', f));
  }
  return apiFetch(`/reviews/${encodeURIComponent(id)}`, { method: 'PUT', body: fd });
}

export async function deleteReview(id) {
  return apiFetch(`/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// Transitaire - Devis reçus
export async function listTransitaireDevis(params = {}) {
  const search = new URLSearchParams();
  // Mapper 'status' UI -> 'statut' API
  const uiStatus = params.status;
  if (uiStatus === 'en-attente') search.set('statut', 'en_attente');
  else if (uiStatus === 'en-cours') search.set('statut', 'accepte');
  else if (uiStatus === 'traites') search.set('statut', 'traite');
  else if (uiStatus === 'archive') search.set('statut', 'archive');
  if (typeof params.page !== 'undefined') search.set('page', String(params.page));
  if (typeof params.limit !== 'undefined') search.set('limit', String(params.limit));
  if (params.search) search.set('search', String(params.search));
  // anti-cache
  search.set('_ts', String(Date.now()));
  const q = search.toString() ? `?${search.toString()}` : '';
  return get(`/translataires/devis${q}`);
}

// Transitaire - Archiver un devis (reste visible dans l'historique)
export async function archiveDevisTransitaire(devisId) {
  if (!devisId) throw new Error('devisId requis');
  return apiFetch(`/translataires/devis/${encodeURIComponent(devisId)}`, {
    method: 'PUT',
    body: { statut: 'archive' },
  });
}

// Transitaire - Répondre à un devis (contre‑offre)
export async function respondDevisTransitaire(devisId, { amount, message, attachments } = {}) {
  if (!devisId) throw new Error('devisId requis');
  const fd = new FormData();
  // Backend attend 'statut' (accepte) + 'montant' + 'reponse' et un seul fichier 'fichier'
  fd.append('statut', 'accepte');
  if (amount !== undefined) fd.append('montantEstime', String(amount));
  if (message !== undefined) fd.append('reponse', String(message));
  const firstFile = attachments && Array.isArray(attachments) && attachments.length ? attachments[0] : null;
  if (firstFile) fd.append('fichier', firstFile);
  return apiFetch(`/translataires/devis/${encodeURIComponent(devisId)}`, { method: 'PUT', body: fd, headers: {} });
}

// Transitaire - Statistiques
export async function getTransitaireStats() {
  const p = new URLSearchParams();
  p.set('_ts', String(Date.now()));
  return get(`/translataires/statistiques?${p.toString()}`);
}

// Transitaire - Profil connecté (si dispo côté API)
export async function getTransMe() {
  try { return await get('/translataires/me'); } catch { return null; }
}
