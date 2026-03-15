/**
 * Découverte et Pré-cache Progressif de Toutes les Données API
 *
 * Ce système pré-charge toutes les données API dans IndexedDB
 * en arrière-plan, en parallèle avec le cache des pages
 */

'use client';

import { cacheManager } from './cache-manager';

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
 */
const API_ENDPOINTS: ApiEndpointConfig[] = [
  // ==========================================
  // PRIORITÉ HAUTE - Données critiques
  // ==========================================
  {
    endpoint: '/api/core/auth/me',
    ttl: 5 * 60 * 1000, // 5 minutes
    priority: 'high',
    requiresAuth: true,
  },
  {
    endpoint: '/api/core/organizations',
    ttl: 10 * 60 * 1000, // 10 minutes
    priority: 'high',
    requiresAuth: true,
  },
  {
    endpoint: '/api/core/categories',
    ttl: 30 * 60 * 1000, // 30 minutes
    priority: 'high',
  },
  {
    endpoint: '/api/core/modules',
    ttl: 30 * 60 * 1000,
    priority: 'high',
  },

  // ==========================================
  // PRIORITÉ MOYENNE - Données fréquemment utilisées
  // ==========================================

  // HR Module
  {
    endpoint: '/api/hr/employees',
    ttl: 10 * 60 * 1000,
    priority: 'medium',
    requiresAuth: true,
  },
  {
    endpoint: '/api/hr/departments',
    ttl: 15 * 60 * 1000,
    priority: 'medium',
    requiresAuth: true,
  },
  {
    endpoint: '/api/hr/roles',
    ttl: 30 * 60 * 1000,
    priority: 'medium',
    requiresAuth: true,
  },
  {
    endpoint: '/api/hr/permissions',
    ttl: 30 * 60 * 1000,
    priority: 'medium',
    requiresAuth: true,
  },

  // Inventory Module
  {
    endpoint: '/api/inventory/categories',
    ttl: 30 * 60 * 1000,
    priority: 'medium',
    requiresAuth: true,
  },

  // ==========================================
  // PRIORITÉ BASSE - Données moins critiques
  // ==========================================

  // Calendrier
  {
    endpoint: '/api/hr/calendar',
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

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Utiliser cacheManager pour charger et cacher les données
      await cacheManager.get(endpoint, {
        ttl: ttl || 10 * 60 * 1000, // 10 min par défaut
        forceRefresh: true, // Force le chargement depuis l'API
      });

      return { success: true, status: 200 };

    } catch (error: any) {
      const status = error.status || error.response?.status;

      // Si auth requise et pas authentifié, considérer comme succès
      // (les données seront chargées quand l'user se connectera)
      if (requiresAuth && (status === 401 || status === 403)) {
        console.log(`[DataCache] ℹ️ ${endpoint} (${status} - Auth requise)`);
        return { success: true, status };
      }

      // Retry avec backoff exponentiel
      if (attempt < maxRetries) {
        console.log(`[DataCache] ⚠️ ${endpoint} - Retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      return {
        success: false,
        status,
        error: error.message || 'Unknown error'
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
  console.log('[DataCache] 🗄️ Démarrage du pré-cache des données API...\n');

  const endpoints = getAllApiEndpoints();

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
    const { endpoint, priority } = config;

    const result = await precacheApiEndpoint(config);

    if (result.success) {
      progress.cached++;
      progress.endpoints.push(endpoint);

      if (result.status === 401 || result.status === 403) {
        stats.authRequired++;
        console.log(`[DataCache] 🔒 ${endpoint} (Auth requise) [${progress.cached}/${endpoints.length}]`);
      } else {
        stats.success++;
        console.log(`[DataCache] ✅ ${endpoint} (${priority}) [${progress.cached}/${endpoints.length}]`);
      }
    } else {
      progress.failed++;
      stats.failed++;
      stats.errors.push({
        endpoint,
        status: result.status,
        error: result.error
      });
      console.error(`[DataCache] ❌ ${endpoint} (${result.status || 'ERR'}: ${result.error})`);
    }

    // Notifier de la progression
    onProgress?.({ ...progress });

    // Sauvegarder la progression
    localStorage.setItem(DATA_CACHE_PROGRESS_KEY, JSON.stringify(progress));

    // Délai entre chaque endpoint (75ms - équilibré)
    if (i < endpoints.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 75));
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
