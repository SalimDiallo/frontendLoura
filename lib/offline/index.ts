/**
 * Offline Management System
 *
 * Exports:
 * - indexedDBManager: Gestion du cache et des mutations dans IndexedDB
 * - cacheManager: Couche de cache pour les requêtes API
 * - syncManager: Gestion de la synchronisation des mutations
 * - route-discovery: Découverte et pré-cache des routes (pages)
 * - api-discovery: Découverte et pré-cache des données API
 */

export { indexedDBManager } from './indexeddb';
export type { CacheEntry, MutationEntry } from './indexeddb';

export { cacheManager } from './cache-manager';
export type { CacheOptions, MutationOptions } from './cache-manager';

export { syncManager } from './sync-manager';
export type { SyncStatus, SyncState } from './sync-manager';

export {
  precacheAllRoutes,
  discoverRoutes,
  getCacheProgress,
  resetCacheProgress,
  isPrecacheComplete,
} from './route-discovery';
export type { CacheProgress, RoutesManifest } from './route-discovery';

export {
  precacheAllApiData,
  getAllApiEndpoints,
  getDataCacheProgress,
  resetDataCacheProgress,
  isDataCacheComplete,
  enrichDynamicParams,
} from './api-discovery';
export type { DataCacheProgress, ApiEndpointConfig } from './api-discovery';
