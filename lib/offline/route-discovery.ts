/**
 * Découverte et Pré-cache Progressif de Toutes les Routes
 *
 * Ce système utilise 3 méthodes pour découvrir TOUTES les routes:
 * 1. Manifeste statique généré au build-time (scan du dossier app/)
 * 2. Crawling HTML dynamique pour routes non détectées
 * 3. Routes seed comme fallback
 */

'use client';

export interface CacheProgress {
  total: number;
  cached: number;
  failed: number;
  inProgress: boolean;
  routes: string[];
}

export interface RoutesManifest {
  generatedAt: string;
  total: number;
  routes: string[];
}

const CACHE_PROGRESS_KEY = 'loura_cache_progress';
const DISCOVERED_ROUTES_KEY = 'loura_discovered_routes';
const ROUTES_MANIFEST_URL = '/routes-manifest.json';

/**
 * Routes de base à crawler pour découvrir le reste de l'app
 */
const SEED_ROUTES = [
  '/',
  '/auth',
  '/core/dashboard',
  '/core/dashboard/organizations',
  '/core/register',
  '/apps'
];

/**
 * Patterns de routes à ignorer
 */
const IGNORE_PATTERNS = [
  /\/api\//,           // API endpoints
  /\/_next\/data\//,   // Next.js data
  /\.json$/,           // JSON files
  /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i, // Assets déjà cachés
  /\/tools\//,         // Tools (PDF generation, etc.)
  /#/,                 // Anchors
  /\?/,                // Query params (pour simplifier)
];

/**
 * Charge le manifeste des routes statiques générées au build-time
 */
async function loadRoutesManifest(): Promise<string[]> {
  try {
    const response = await fetch(ROUTES_MANIFEST_URL, {
      cache: 'force-cache', // Utiliser le cache du SW
    });

    if (!response.ok) {
      console.warn('[RouteDiscovery] Manifeste non disponible, utilisation du fallback');
      return [];
    }

    const manifest: RoutesManifest = await response.json();
    console.log(`[RouteDiscovery] 📋 ${manifest.total} routes chargées depuis le manifeste`);
    return manifest.routes;

  } catch (error) {
    console.warn('[RouteDiscovery] Erreur chargement manifeste:', error);
    return [];
  }
}

/**
 * Découvre toutes les routes de l'application
 * Combine 3 sources: manifeste statique, routes en cache, et crawling HTML
 */
export async function discoverRoutes(): Promise<string[]> {
  const discoveredRoutes = new Set<string>();

  console.log('[RouteDiscovery] 🔍 Découverte exhaustive des routes...\n');

  // 1. Charger le manifeste statique (généré au build)
  const manifestRoutes = await loadRoutesManifest();
  manifestRoutes.forEach(r => discoveredRoutes.add(r));
  console.log(`[RouteDiscovery] ✓ Manifeste: ${manifestRoutes.length} routes`);

  // 2. Essayer de récupérer les routes déjà découvertes (cache localStorage)
  const cached = localStorage.getItem(DISCOVERED_ROUTES_KEY);
  if (cached) {
    try {
      const routes = JSON.parse(cached) as string[];
      const beforeCount = discoveredRoutes.size;
      routes.forEach(r => discoveredRoutes.add(r));
      const added = discoveredRoutes.size - beforeCount;
      console.log(`[RouteDiscovery] ✓ Cache: ${added} routes additionnelles`);
    } catch (error) {
      console.warn('[RouteDiscovery] Erreur parsing routes cachées:', error);
    }
  }

  // 3. Ajouter les routes seed (fallback)
  const beforeSeed = discoveredRoutes.size;
  SEED_ROUTES.forEach(r => discoveredRoutes.add(r));
  const seedAdded = discoveredRoutes.size - beforeSeed;
  if (seedAdded > 0) {
    console.log(`[RouteDiscovery] ✓ Seeds: ${seedAdded} routes additionnelles`);
  }

  // 4. Crawler les routes seed pour découvrir des routes dynamiques
  console.log('[RouteDiscovery] 🕷️ Crawling HTML pour routes dynamiques...');
  let crawledCount = 0;
  for (const route of SEED_ROUTES) {
    try {
      const beforeCrawl = discoveredRoutes.size;
      const newRoutes = await crawlRoute(route);
      newRoutes.forEach(r => discoveredRoutes.add(r));
      const addedFromCrawl = discoveredRoutes.size - beforeCrawl;
      if (addedFromCrawl > 0) {
        crawledCount += addedFromCrawl;
      }
    } catch (error) {
      console.warn(`[RouteDiscovery] Erreur crawl ${route}:`, error);
    }
  }
  if (crawledCount > 0) {
    console.log(`[RouteDiscovery] ✓ Crawling: ${crawledCount} routes additionnelles`);
  }

  const allRoutes = Array.from(discoveredRoutes).sort();

  // Sauvegarder les routes découvertes
  localStorage.setItem(DISCOVERED_ROUTES_KEY, JSON.stringify(allRoutes));

  console.log(`\n[RouteDiscovery] ✅ Total: ${allRoutes.length} routes uniques détectées\n`);
  return allRoutes;
}

/**
 * Crawle une route pour découvrir les liens
 */
async function crawlRoute(route: string): Promise<string[]> {
  const routes = new Set<string>();

  try {
    const response = await fetch(route);
    if (!response.ok) return [];

    const html = await response.text();

    // Parser le HTML pour trouver les liens
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Trouver tous les liens
    const links = doc.querySelectorAll('a[href]');

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      // Normaliser l'URL
      const url = normalizeUrl(href);
      if (!url) return;

      // Vérifier si on doit ignorer
      if (shouldIgnore(url)) return;

      routes.add(url);
    });

  } catch (error) {
    console.warn(`[RouteDiscovery] Erreur fetch ${route}:`, error);
  }

  return Array.from(routes);
}

/**
 * Normalise une URL
 */
function normalizeUrl(href: string): string | null {
  try {
    // URL relative
    if (href.startsWith('/') && !href.startsWith('//')) {
      return href.split('?')[0].split('#')[0]; // Enlever query params et hash
    }

    // URL absolue same-origin
    const url = new URL(href, window.location.origin);
    if (url.origin === window.location.origin) {
      return url.pathname;
    }

    return null; // External URL
  } catch {
    return null;
  }
}

/**
 * Vérifie si une URL doit être ignorée
 */
function shouldIgnore(url: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Pré-cache une route avec retry en cas d'échec
 */
async function precacheRoute(route: string, maxRetries = 2): Promise<{ success: boolean; status?: number; error?: string }> {
  let lastError: any;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Faire la requête pour déclencher le cache du SW
      const response = await fetch(route, {
        method: 'GET',
        cache: 'no-cache', // Force le SW à intercepter et cacher
        credentials: 'same-origin', // Inclure les cookies pour auth
      });

      lastStatus = response.status;

      // Accepter les codes de succès ET les redirections
      // Les redirections sont normales pour les routes protégées
      if (response.ok || (response.status >= 300 && response.status < 400)) {
        // Même si c'est une redirection, le SW devrait avoir caché la réponse
        return { success: true, status: response.status };
      }

      // Pour les erreurs 401/403 (auth requise), on considère ça comme un succès
      // car la route existe, elle est juste protégée
      if (response.status === 401 || response.status === 403) {
        console.log(`[PrecacheAll] ℹ️ ${route} (${response.status} - Auth requise, mais route cachée)`);
        return { success: true, status: response.status };
      }

      // Pour les autres erreurs, on retry
      if (attempt < maxRetries) {
        console.log(`[PrecacheAll] ⚠️ ${route} (${response.status}) - Retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Backoff exponentiel
        continue;
      }

      return { success: false, status: response.status, error: `HTTP ${response.status}` };

    } catch (error: any) {
      lastError = error;

      if (attempt < maxRetries) {
        console.log(`[PrecacheAll] ⚠️ ${route} - Erreur: ${error.message} - Retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      return { success: false, error: error.message };
    }
  }

  return { success: false, status: lastStatus, error: lastError?.message || 'Unknown error' };
}

/**
 * Pré-cache progressivement toutes les routes découvertes
 */
export async function precacheAllRoutes(
  onProgress?: (progress: CacheProgress) => void
): Promise<void> {
  console.log('[PrecacheAll] 🚀 Démarrage du pré-cache progressif amélioré...\n');

  // Découvrir toutes les routes
  const routes = await discoverRoutes();

  const progress: CacheProgress = {
    total: routes.length,
    cached: 0,
    failed: 0,
    inProgress: true,
    routes: [],
  };

  // Statistiques détaillées
  const stats = {
    success: 0,
    redirected: 0,
    authRequired: 0,
    failed: 0,
    errors: [] as Array<{ route: string; status?: number; error?: string }>
  };

  // Notifier du démarrage
  onProgress?.(progress);

  // Pré-cacher route par route avec délai
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];

    const result = await precacheRoute(route);

    if (result.success) {
      progress.cached++;
      progress.routes.push(route);

      // Catégoriser le succès
      if (result.status === 401 || result.status === 403) {
        stats.authRequired++;
        console.log(`[PrecacheAll] 🔒 ${route} (${result.status} - Auth) [${progress.cached}/${routes.length}]`);
      } else if (result.status && result.status >= 300 && result.status < 400) {
        stats.redirected++;
        console.log(`[PrecacheAll] ↪️  ${route} (${result.status} - Redirect) [${progress.cached}/${routes.length}]`);
      } else {
        stats.success++;
        console.log(`[PrecacheAll] ✅ ${route} (${result.status || 200}) [${progress.cached}/${routes.length}]`);
      }
    } else {
      progress.failed++;
      stats.failed++;
      stats.errors.push({ route, status: result.status, error: result.error });
      console.error(`[PrecacheAll] ❌ ${route} (${result.status || 'ERR'}: ${result.error}) [${progress.failed} échecs]`);
    }

    // Notifier de la progression
    onProgress?.({ ...progress });

    // Sauvegarder la progression
    localStorage.setItem(CACHE_PROGRESS_KEY, JSON.stringify(progress));

    // Petit délai pour ne pas surcharger (50ms entre chaque route - réduit pour aller plus vite)
    if (i < routes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  progress.inProgress = false;
  onProgress?.(progress);

  // Rapport final détaillé
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[PrecacheAll] 📊 RAPPORT FINAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Succès:           ${stats.success} routes`);
  console.log(`↪️  Redirections:     ${stats.redirected} routes`);
  console.log(`🔒 Auth requise:     ${stats.authRequired} routes`);
  console.log(`❌ Échecs:           ${stats.failed} routes`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📦 Total caché:      ${progress.cached}/${routes.length} (${Math.round(progress.cached / routes.length * 100)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Afficher les erreurs si nécessaire
  if (stats.errors.length > 0 && stats.errors.length <= 10) {
    console.warn('⚠️  Détails des échecs:');
    stats.errors.forEach(err => {
      console.warn(`   - ${err.route}: ${err.status || 'ERR'} (${err.error})`);
    });
  } else if (stats.errors.length > 10) {
    console.warn(`⚠️  ${stats.errors.length} routes ont échoué (voir localStorage pour détails)`);
  }

  // Sauvegarder le rapport d'erreurs
  if (stats.errors.length > 0) {
    localStorage.setItem('loura_cache_errors', JSON.stringify(stats.errors));
  }
}

/**
 * Récupère la progression du cache
 */
export function getCacheProgress(): CacheProgress | null {
  const cached = localStorage.getItem(CACHE_PROGRESS_KEY);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

/**
 * Réinitialise la progression
 */
export function resetCacheProgress(): void {
  localStorage.removeItem(CACHE_PROGRESS_KEY);
  localStorage.removeItem(DISCOVERED_ROUTES_KEY);
}

/**
 * Vérifie si le pré-cache est terminé
 */
export function isPrecacheComplete(): boolean {
  const progress = getCacheProgress();
  return progress ? !progress.inProgress && progress.cached > 0 : false;
}
