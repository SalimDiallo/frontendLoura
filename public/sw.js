/**
 * Service Worker - Gestion du cache offline pour Loura (v2 - Amélioré)
 *
 * Stratégies:
 * - Cache-First: Assets statiques (JS, CSS, images, fonts)
 * - Network-First (Amélioré): Pages HTML et API
 *   • Timeout augmenté à 8s pour pages complexes
 *   • Cache les redirections (301, 302, 307)
 *   • Cache les pages protégées (401, 403)
 *   • Inclut les credentials pour l'authentification
 * - Offline fallback: Page de secours
 *
 * Améliorations v2:
 * - Meilleure gestion des routes protégées par authentification
 * - Cache des redirections pour navigation offline complète
 * - Retry logic dans route-discovery.ts
 * - Logging détaillé des échecs
 * - Support des credentials (cookies) dans les requêtes
 */

const CACHE_VERSION = 'v2'; // Incrémenté pour forcer la mise à jour
const CACHE_NAME = `loura-cache-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Assets à pré-cacher lors de l'installation
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/images/logo-icon.png',
  '/manifest.json',
  // Routes critiques à pré-cacher
  '/auth',
  '/core/dashboard',
  // Next.js génère des noms de fichiers avec hash, on les cachera dynamiquement
];

// Patterns pour différentes stratégies
const CACHE_FIRST_PATTERNS = [
  /\/_next\/static\//,           // Assets Next.js
  /\.(?:js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/,  // Extensions de fichiers
  /\/images\//,                  // Dossier images
];

const NETWORK_FIRST_PATTERNS = [
  /\/api\//,                     // Toutes les requêtes API
  /\/_next\/data\//,             // Data fetching Next.js
];

// Durée de vie du cache
const CACHE_MAX_AGE = {
  static: 30 * 24 * 60 * 60 * 1000,     // 1 mois pour les assets
  dynamic: 7 * 24 * 60 * 60 * 1000,     // 7 jours pour les pages
};

/**
 * Installation du Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pré-cache des assets essentiels');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Force l'activation immédiate
      return self.skipWaiting();
    })
  );
});

/**
 * Activation du Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');

  event.waitUntil(
    // Nettoyer les anciens caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prendre le contrôle immédiatement
      return self.clients.claim();
    })
  );
});

/**
 * Interception des requêtes
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  // Ignorer les requêtes vers d'autres domaines (sauf si c'est pour des assets)
  if (url.origin !== self.location.origin && !isCDNRequest(url)) {
    return;
  }

  // Déterminer la stratégie selon le type de requête
  if (shouldUseCacheFirst(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (shouldUseNetworkFirst(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Par défaut: Network-First pour les pages HTML
    event.respondWith(networkFirstStrategy(request, true));
  }
});

/**
 * Stratégie Cache-First (Améliorée)
 * Idéal pour les assets statiques qui ne changent pas souvent
 */
async function cacheFirstStrategy(request) {
  try {
    // Essayer le cache d'abord
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // En arrière-plan, vérifier si une version plus récente existe
      // (Stale-While-Revalidate pattern)
      fetch(request, { credentials: 'same-origin' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        })
        .catch(() => {
          // Ignore les erreurs de revalidation
        });

      return cachedResponse;
    }

    // Si pas dans le cache, faire la requête réseau
    const networkResponse = await fetch(request, { credentials: 'same-origin' });

    // Mettre en cache la réponse si elle est valide
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      try {
        // Clone pour pouvoir utiliser la réponse
        cache.put(request, networkResponse.clone());
      } catch (e) {
        // Ignore quota exceeded errors
        console.warn('[SW] Cache put failed for asset:', e);
      }
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-First error:', error);

    // Essayer le cache en dernier recours
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback pour les images
    if (request.destination === 'image') {
      return new Response(
        '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" fill="#999" font-size="10">Image</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }

    // Fallback pour les fonts
    if (request.destination === 'font') {
      return new Response(null, { status: 200 });
    }

    throw error;
  }
}

/**
 * Stratégie Network-First (Améliorée)
 * Idéal pour les pages HTML et données API
 * Cache les redirections et les pages protégées pour offline
 */
async function networkFirstStrategy(request, withOfflineFallback = false) {
  try {
    // Essayer le réseau d'abord avec timeout plus long pour les pages complexes
    const networkResponse = await fetchWithTimeout(request, 8000);

    // Mettre en cache les réponses valides (incluant redirections et auth)
    // On cache si:
    // - Status 200-299 (succès)
    // - Status 300-399 (redirections) - important pour les routes protégées
    // - Status 401/403 (auth requise) - on garde la page d'erreur pour offline
    const shouldCache =
      (networkResponse.status >= 200 && networkResponse.status < 400) ||
      networkResponse.status === 401 ||
      networkResponse.status === 403;

    if (networkResponse && shouldCache) {
      const cache = await caches.open(CACHE_NAME);
      // Ne cacher que les requêtes GET
      if (request.method === 'GET') {
        try {
          cache.put(request, networkResponse.clone());
        } catch (e) {
          // Ignore cache errors (quota exceeded, etc.)
          console.warn('[SW] Cache put failed:', e);
        }
      }
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    // Essayer le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cachedResponse;
    }

    // Si c'est une navigation et qu'on a un fallback offline
    if (withOfflineFallback && request.mode === 'navigate') {
      const offlinePage = await caches.match(OFFLINE_URL);
      if (offlinePage) {
        return offlinePage;
      }
    }

    // Pour les requêtes API, retourner une réponse d'erreur structurée
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'Pas de connexion internet. Les modifications seront synchronisées automatiquement.',
          offline: true
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Dernière tentative: retourner une réponse basique
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'Pas de connexion internet' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Fetch avec timeout (amélioré)
 * Timeout plus long pour les pages (8s) que pour les assets (5s)
 */
async function fetchWithTimeout(request, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(request, {
      signal: controller.signal,
      // Inclure les credentials pour les routes protégées
      credentials: 'same-origin',
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    // Log plus détaillé des erreurs
    if (error.name === 'AbortError') {
      console.warn(`[SW] Request timeout after ${timeout}ms:`, request.url);
    }
    throw error;
  }
}

/**
 * Vérifie si la requête doit utiliser Cache-First
 */
function shouldUseCacheFirst(pathname) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Vérifie si la requête doit utiliser Network-First
 */
function shouldUseNetworkFirst(pathname) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Vérifie si c'est une requête vers un CDN
 */
function isCDNRequest(url) {
  const cdnDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
  ];
  return cdnDomains.some(domain => url.hostname.includes(domain));
}

/**
 * Nettoyage périodique du cache
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[SW] Cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker chargé');
