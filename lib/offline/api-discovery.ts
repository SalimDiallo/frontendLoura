/**
 * Découverte et Pré-cache Progressif de Toutes les Données API
 *
 * Ce système pré-charge toutes les données API dans IndexedDB
 * en arrière-plan, en parallèle avec le cache des pages
 */

'use client';

import { indexedDBManager } from './indexeddb';

export interface DataCacheProgress {
  total: number;
  cached: number;
  failed: number;
  inProgress: boolean;
  endpoints: string[];
}

export interface ApiEndpointConfig {
  endpoint: string;
  ttl?: number;
  priority?: 'high' | 'medium' | 'low';
  requiresAuth?: boolean;
  params?: Record<string, string[]>; // Pour les endpoints avec paramètres
}

const DATA_CACHE_PROGRESS_KEY = 'loura_data_cache_progress';

/**
 * Configuration des endpoints API à pré-cacher
 * Organisé par priorité pour optimiser le chargement
 *
 * NOTE: Les endpoints sont relatifs au baseURL de l'API
 * Ne PAS inclure /api au début (c'est dans baseURL)
 */
const API_ENDPOINTS: ApiEndpointConfig[] = [
  // ==========================================
  // PRIORITÉ HAUTE - Données critiques
  // ==========================================
  {
    endpoint: '/auth/me/',
    ttl: 5 * 60 * 1000, // 5 minutes
    priority: 'high',
    requiresAuth: true,
  },
  {
    endpoint: '/core/organizations/',
    ttl: 10 * 60 * 1000, // 10 minutes
    priority: 'high',
    requiresAuth: true,
  },
  {
    endpoint: '/core/categories/',
    ttl: 30 * 60 * 1000, // 30 minutes
    priority: 'high',
  },
  {
    endpoint: '/core/modules/',
    ttl: 30 * 60 * 1000,
    priority: 'high',
  },

  // ==========================================
  // PRIORITÉ MOYENNE - Données fréquemment utilisées
  // ==========================================

  // HR Module
  {
    endpoint: '/hr/employees/',
    ttl: 10 * 60 * 1000,
    priority: 'medium',
    requiresAuth: true,
  },
  {
    endpoint: '/hr/departments/',
    ttl: 15 * 60 * 1000,
    priority: 'medium',
    requiresAuth: true,
  },
  {
    endpoint: '/hr/roles/',
    ttl: 30 * 60 * 1000,
    priority: 'medium',
    requiresAuth: true,
  },
  {
    endpoint: '/hr/permissions/',
    ttl: 30 * 60 * 1000,
    priority: 'medium',
    requiresAuth: true,
  },

  // Inventory Module
  {
    endpoint: '/inventory/categories/',
    ttl: 30 * 60 * 1000,
    priority: 'medium',
    requiresAuth: true,
  },

  // ==========================================
  // PRIORITÉ BASSE - Données moins critiques
  // ==========================================

  // Calendrier
  {
    endpoint: '/hr/calendar/',
    ttl: 60 * 60 * 1000, // 1 heure
    priority: 'low',
    requiresAuth: true,
  },
];

/**
 * Exemples de slugs/IDs pour les endpoints paramétrés
 * Sera enrichi dynamiquement avec les vraies valeurs
 */
const DYNAMIC_PARAMS = {
  slug: ['demo-org', 'test-org'],
  organizationId: ['1', '2', '3'],
  employeeId: ['1', '2', '3'],
  departmentId: ['1', '2', '3'],
};

/**
 * Génère toutes les variations d'un endpoint avec ses paramètres
 */
function expandEndpoint(config: ApiEndpointConfig): ApiEndpointConfig[] {
  const { endpoint, params } = config;

  // Si pas de paramètres, retourner tel quel
  if (!params) {
    return [config];
  }

  const configs: ApiEndpointConfig[] = [];

  // Pour chaque paramètre, générer les variations
  Object.entries(params).forEach(([paramName, values]) => {
    values.forEach(value => {
      const expandedEndpoint = endpoint.replace(`[${paramName}]`, value);
      configs.push({
        ...config,
        endpoint: expandedEndpoint,
        params: undefined, // Retirer les params une fois expandés
      });
    });
  });

  return configs.length > 0 ? configs : [config];
}

/**
 * Récupère tous les endpoints à pré-cacher
 */
export function getAllApiEndpoints(): ApiEndpointConfig[] {
  const allEndpoints: ApiEndpointConfig[] = [];

  API_ENDPOINTS.forEach(config => {
    const expanded = expandEndpoint(config);
    allEndpoints.push(...expanded);
  });

  // Trier par priorité (high > medium > low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  allEndpoints.sort((a, b) => {
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    return aPriority - bPriority;
  });

  console.log(`[DataCache] 📋 ${allEndpoints.length} endpoints API à pré-cacher`);
  return allEndpoints;
}

/**
 * Pré-cache un endpoint API avec retry
 */
async function precacheApiEndpoint(
  config: ApiEndpointConfig,
  maxRetries = 2
): Promise<{ success: boolean; status?: number; error?: string }> {
  const { endpoint, ttl, requiresAuth } = config;

  // Construire l'URL complète
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const fullUrl = `${baseURL}${endpoint}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Vérifier si on est en ligne
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return {
          success: false,
          status: 0,
          error: 'Offline - skip precache'
        };
      }

      // Récupérer le token d'authentification
      const accessToken = typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;

      // Préparer les headers
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // Ajouter le token si disponible et auth requise
      if (accessToken && requiresAuth) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Faire la requête directement via fetch pour plus de contrôle
      const response = await fetch(fullUrl, {
        method: 'GET',
        credentials: 'include', // Inclure les cookies pour auth
        headers,
      });

      const status = response.status;

      // Succès (200-299)
      if (response.ok) {
        try {
          const data = await response.json();

          // Stocker dans IndexedDB via indexedDBManager
          try {
            await indexedDBManager.setCache(
              endpoint,
              data,
              ttl || 10 * 60 * 1000
            );
          } catch (cacheError) {
            console.warn(`[DataCache] Erreur stockage cache pour ${endpoint}:`, cacheError);
          }

          return { success: true, status };
        } catch (jsonError) {
          // Si la réponse n'est pas du JSON valide, ignorer
          console.warn(`[DataCache] Réponse non-JSON pour ${endpoint}`);
          return { success: false, status, error: 'Invalid JSON response' };
        }
      }

      // Auth requise (401/403) - Considérer comme succès
      // Les données seront chargées après connexion
      if (requiresAuth && (status === 401 || status === 403)) {
        return { success: true, status };
      }

      // 404 - Endpoint n'existe pas, skip sans retry
      if (status === 404) {
        return {
          success: false,
          status,
          error: 'Endpoint not found'
        };
      }

      // Autres erreurs - Retry seulement pour 5xx
      if (status >= 500 && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }

      return {
        success: false,
        status,
        error: `HTTP ${status}`
      };

    } catch (error: any) {
      // Erreur réseau (timeout, CORS, etc.)

      // Si auth requise, ne pas considérer comme un échec critique
      if (requiresAuth) {
        return { success: true, status: 401, error: 'Auth required - will load after login' };
      }
      // Retry seulement pour erreurs réseau temporaires
      if (attempt < maxRetries && (error.name === 'TypeError' || error.name === 'NetworkError')) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }

      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

/**
 * Pré-cache progressivement toutes les données API
 */
export async function precacheAllApiData(
  onProgress?: (progress: DataCacheProgress) => void
): Promise<void> {
  try {
    console.log('[DataCache] 🗄️ Démarrage du pré-cache des données API...');

    // Vérifier que nous sommes côté client
    if (typeof window === 'undefined') {
      console.warn('[DataCache] Skipping - SSR environment');
      return;
    }

    const endpoints = getAllApiEndpoints();
    console.log(`[DataCache] 📋 ${endpoints.length} endpoints à pré-cacher\n`);

    const progress: DataCacheProgress = {
      total: endpoints.length,
      cached: 0,
      failed: 0,
      inProgress: true,
      endpoints: [],
    };

    // Statistiques détaillées
    const stats = {
      success: 0,
      authRequired: 0,
      failed: 0,
      errors: [] as Array<{ endpoint: string; status?: number; error?: string }>
    };

    // Notifier du démarrage
    onProgress?.(progress);

  // Pré-cacher endpoint par endpoint
  for (let i = 0; i < endpoints.length; i++) {
    const config = endpoints[i];
    const { endpoint } = config;

    const result = await precacheApiEndpoint(config);

    if (result.success) {
      progress.cached++;
      progress.endpoints.push(endpoint);

      if (result.status === 401 || result.status === 403) {
        stats.authRequired++;
        console.log(`[DataCache] 🔒 ${endpoint} (${result.status} - Auth requise) [${progress.cached}/${endpoints.length}]`);
      } else {
        stats.success++;
        console.log(`[DataCache] ✅ ${endpoint} (${result.status || 200}) [${progress.cached}/${endpoints.length}]`);
      }
    } else {
      progress.failed++;
      stats.failed++;
      stats.errors.push({
        endpoint,
        status: result.status,
        error: result.error
      });
      console.warn(`[DataCache] ⚠️  ${endpoint} (${result.status || 'ERR'}: ${result.error}) [${progress.failed} échecs]`);
    }

    // Notifier de la progression
    onProgress?.({ ...progress });

    // Sauvegarder la progression
    if (typeof window !== 'undefined') {
      localStorage.setItem(DATA_CACHE_PROGRESS_KEY, JSON.stringify(progress));
    }

    // Délai entre chaque endpoint (50ms - rapide)
    if (i < endpoints.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  progress.inProgress = false;
  onProgress?.(progress);

  // Rapport final
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[DataCache] 📊 RAPPORT FINAL - DONNÉES API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Succès:           ${stats.success} endpoints`);
  console.log(`🔒 Auth requise:     ${stats.authRequired} endpoints`);
  console.log(`❌ Échecs:           ${stats.failed} endpoints`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📦 Total caché:      ${progress.cached}/${endpoints.length} (${Math.round(progress.cached / endpoints.length * 100)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Afficher les erreurs
  if (stats.errors.length > 0 && stats.errors.length <= 5) {
    console.warn('⚠️  Détails des échecs:');
    stats.errors.forEach(err => {
      console.warn(`   - ${err.endpoint}: ${err.status || 'ERR'} (${err.error})`);
    });
  }

    // Sauvegarder les erreurs
    if (stats.errors.length > 0) {
      localStorage.setItem('loura_data_cache_errors', JSON.stringify(stats.errors));
    }

  } catch (globalError: any) {
    console.error('[DataCache] ❌ Erreur globale lors du pré-cache:', globalError);

    // Notifier de l'échec
    if (onProgress) {
      onProgress({
        total: 0,
        cached: 0,
        failed: 1,
        inProgress: false,
        endpoints: [],
      });
    }
  }
}

/**
 * Récupère la progression du cache des données
 */
export function getDataCacheProgress(): DataCacheProgress | null {
  const cached = localStorage.getItem(DATA_CACHE_PROGRESS_KEY);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

/**
 * Réinitialise la progression du cache des données
 */
export function resetDataCacheProgress(): void {
  localStorage.removeItem(DATA_CACHE_PROGRESS_KEY);
  localStorage.removeItem('loura_data_cache_errors');
}

/**
 * Vérifie si le pré-cache des données est terminé
 */
export function isDataCacheComplete(): boolean {
  const progress = getDataCacheProgress();
  return progress ? !progress.inProgress && progress.cached > 0 : false;
}

/**
 * Enrichit dynamiquement les paramètres avec les vraies valeurs
 * (à appeler après avoir chargé les organisations, par exemple)
 */
export function enrichDynamicParams(params: Record<string, string[]>): void {
  Object.entries(params).forEach(([key, values]) => {
    if (DYNAMIC_PARAMS[key as keyof typeof DYNAMIC_PARAMS]) {
      DYNAMIC_PARAMS[key as keyof typeof DYNAMIC_PARAMS].push(...values);
      // Dédupliquer
      DYNAMIC_PARAMS[key as keyof typeof DYNAMIC_PARAMS] = [
        ...new Set(DYNAMIC_PARAMS[key as keyof typeof DYNAMIC_PARAMS])
      ];
    }
  });
}
