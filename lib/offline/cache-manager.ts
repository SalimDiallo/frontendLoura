/**
 * Cache Manager - Couche de cache pour les requêtes API
 *
 * Stratégie:
 * - GET: Cache-first avec fallback réseau
 * - POST/PUT/PATCH/DELETE: Network-first avec queue offline
 */

import { apiClient, ApiError } from '@/lib/api/client';
import { indexedDBManager } from './indexeddb';

export interface CacheOptions {
  ttl?: number; // Time to live en millisecondes (défaut: 5 minutes)
  forceRefresh?: boolean; // Forcer un rafraîchissement depuis le réseau
  skipCache?: boolean; // Ne pas utiliser le cache du tout
}

export interface MutationOptions {
  invalidateCache?: string[]; // Endpoints à invalider après la mutation
  requiresOnline?: boolean; // Si true, échoue immédiatement si offline
}

class CacheManager {
  private defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut

  /**
   * Vérifie si on est en ligne
   */
  private isOnline(): boolean {
    return typeof window !== 'undefined' ? window.navigator.onLine : true;
  }

  /**
   * Requête GET avec cache
   */
  async get<T>(
    endpoint: string,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, forceRefresh = false, skipCache = false } = options;

    // Si on ne veut pas de cache, requête directe
    if (skipCache) {
      return apiClient.get<T>(endpoint);
    }

    // Si on ne force pas le refresh, essayer le cache d'abord
    if (!forceRefresh) {
      try {
        const cachedData = await indexedDBManager.getCache(endpoint);
        if (cachedData !== null) {
          console.log(`[Cache] Hit pour ${endpoint}`);
          return cachedData as T;
        }
      } catch (error) {
        console.warn('[Cache] Erreur lecture cache:', error);
      }
    }

    // Pas de cache ou force refresh: requête réseau
    try {
      console.log(`[Cache] Miss pour ${endpoint}, fetch réseau...`);
      const data = await apiClient.get<T>(endpoint);

      // Stocker dans le cache
      try {
        await indexedDBManager.setCache(endpoint, data, ttl);
        console.log(`[Cache] Données stockées pour ${endpoint}`);
      } catch (error) {
        console.warn('[Cache] Erreur écriture cache:', error);
      }

      return data;
    } catch (error) {
      // Si offline ou erreur réseau, essayer le cache même expiré
      if (!this.isOnline() || (error instanceof ApiError && error.status === 0)) {
        console.warn('[Cache] Offline, tentative cache expiré...');
        try {
          const cachedData = await indexedDBManager.getCache(endpoint);
          if (cachedData !== null) {
            console.log('[Cache] Utilisation cache expiré en mode offline');
            return cachedData as T;
          }
        } catch (cacheError) {
          console.error('[Cache] Impossible de lire le cache:', cacheError);
        }
      }

      throw error;
    }
  }

  /**
   * Requête POST avec gestion offline
   */
  async post<T>(
    endpoint: string,
    data?: any,
    mutationOptions: MutationOptions = {}
  ): Promise<T> {
    const { invalidateCache = [], requiresOnline = false } = mutationOptions;

    // Si offline et qu'on requiert une connexion, échouer
    if (!this.isOnline() && requiresOnline) {
      throw new ApiError('Cette action requiert une connexion internet', 0);
    }

    // Si offline, mettre en queue
    if (!this.isOnline()) {
      console.log('[Offline] POST mis en queue:', endpoint);
      await indexedDBManager.addMutation({
        endpoint,
        method: 'POST',
        data,
        maxRetries: 3,
        organizationSlug: this.getCurrentOrgSlug(),
      });

      // Invalider le cache localement
      await this.invalidateEndpoints(invalidateCache);

      // Retourner une réponse optimiste
      return { success: true, queued: true } as T;
    }

    // Online: requête normale
    try {
      const result = await apiClient.post<T>(endpoint, data);

      // Invalider le cache après succès
      await this.invalidateEndpoints(invalidateCache);

      return result;
    } catch (error) {
      // Si l'erreur est due à un problème réseau, mettre en queue
      if (error instanceof ApiError && error.status === 0) {
        console.log('[Offline] POST mis en queue après erreur réseau:', endpoint);
        await indexedDBManager.addMutation({
          endpoint,
          method: 'POST',
          data,
          maxRetries: 3,
          organizationSlug: this.getCurrentOrgSlug(),
        });

        return { success: true, queued: true } as T;
      }

      throw error;
    }
  }

  /**
   * Requête PUT avec gestion offline
   */
  async put<T>(
    endpoint: string,
    data?: any,
    mutationOptions: MutationOptions = {}
  ): Promise<T> {
    const { invalidateCache = [], requiresOnline = false } = mutationOptions;

    if (!this.isOnline() && requiresOnline) {
      throw new ApiError('Cette action requiert une connexion internet', 0);
    }

    if (!this.isOnline()) {
      console.log('[Offline] PUT mis en queue:', endpoint);
      await indexedDBManager.addMutation({
        endpoint,
        method: 'PUT',
        data,
        maxRetries: 3,
        organizationSlug: this.getCurrentOrgSlug(),
      });

      await this.invalidateEndpoints(invalidateCache);
      return { success: true, queued: true } as T;
    }

    try {
      const result = await apiClient.put<T>(endpoint, data);
      await this.invalidateEndpoints(invalidateCache);
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        await indexedDBManager.addMutation({
          endpoint,
          method: 'PUT',
          data,
          maxRetries: 3,
          organizationSlug: this.getCurrentOrgSlug(),
        });

        return { success: true, queued: true } as T;
      }

      throw error;
    }
  }

  /**
   * Requête PATCH avec gestion offline
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    mutationOptions: MutationOptions = {}
  ): Promise<T> {
    const { invalidateCache = [], requiresOnline = false } = mutationOptions;

    if (!this.isOnline() && requiresOnline) {
      throw new ApiError('Cette action requiert une connexion internet', 0);
    }

    if (!this.isOnline()) {
      console.log('[Offline] PATCH mis en queue:', endpoint);
      await indexedDBManager.addMutation({
        endpoint,
        method: 'PATCH',
        data,
        maxRetries: 3,
        organizationSlug: this.getCurrentOrgSlug(),
      });

      await this.invalidateEndpoints(invalidateCache);
      return { success: true, queued: true } as T;
    }

    try {
      const result = await apiClient.patch<T>(endpoint, data);
      await this.invalidateEndpoints(invalidateCache);
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        await indexedDBManager.addMutation({
          endpoint,
          method: 'PATCH',
          data,
          maxRetries: 3,
          organizationSlug: this.getCurrentOrgSlug(),
        });

        return { success: true, queued: true } as T;
      }

      throw error;
    }
  }

  /**
   * Requête DELETE avec gestion offline
   */
  async delete<T>(
    endpoint: string,
    mutationOptions: MutationOptions = {}
  ): Promise<T> {
    const { invalidateCache = [], requiresOnline = false } = mutationOptions;

    if (!this.isOnline() && requiresOnline) {
      throw new ApiError('Cette action requiert une connexion internet', 0);
    }

    if (!this.isOnline()) {
      console.log('[Offline] DELETE mis en queue:', endpoint);
      await indexedDBManager.addMutation({
        endpoint,
        method: 'DELETE',
        maxRetries: 3,
        organizationSlug: this.getCurrentOrgSlug(),
      });

      await this.invalidateEndpoints(invalidateCache);
      return { success: true, queued: true } as T;
    }

    try {
      const result = await apiClient.delete<T>(endpoint);
      await this.invalidateEndpoints(invalidateCache);
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        await indexedDBManager.addMutation({
          endpoint,
          method: 'DELETE',
          maxRetries: 3,
          organizationSlug: this.getCurrentOrgSlug(),
        });

        return { success: true, queued: true } as T;
      }

      throw error;
    }
  }

  /**
   * Invalide les caches pour plusieurs endpoints
   */
  private async invalidateEndpoints(endpoints: string[]): Promise<void> {
    for (const endpoint of endpoints) {
      try {
        await indexedDBManager.invalidateCacheByEndpoint(endpoint);
        console.log(`[Cache] Invalidé: ${endpoint}`);
      } catch (error) {
        console.warn(`[Cache] Erreur invalidation ${endpoint}:`, error);
      }
    }
  }

  /**
   * Récupère le slug de l'organisation courante
   */
  private getCurrentOrgSlug(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return localStorage.getItem('current_organization_slug') || undefined;
  }

  /**
   * Invalide manuellement le cache d'un endpoint
   */
  async invalidateCache(endpoint: string): Promise<void> {
    await indexedDBManager.invalidateCacheByEndpoint(endpoint);
  }

  /**
   * Vide tout le cache
   */
  async clearAllCache(): Promise<void> {
    await indexedDBManager.clearCache();
  }

  /**
   * Configure le TTL par défaut
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }
}

// Export d'une instance singleton
export const cacheManager = new CacheManager();
