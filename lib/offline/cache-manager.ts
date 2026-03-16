/**
 * Cache Manager - Couche de cache pour les requêtes API
 *
 * Stratégie:
 * - GET: Cache-first avec fallback réseau, cache expiré en dernier recours
 * - POST/PUT/PATCH/DELETE: Network-first avec queue offline
 *
 * Améliorations offline-first:
 * - Cache expiré TOUJOURS retourné en mode offline (jamais de throw)
 * - getCache "raw" qui ignore le TTL pour garantir le fonctionnement hors ligne
 * - Invalidation par préfixe pour les routes dynamiques
 * - Stale-while-revalidate en arrière-plan quand online
 */

import { apiClient, ApiError } from '@/lib/api/client';
import { indexedDBManager } from './indexeddb';

export interface CacheOptions {
  ttl?: number; // Time to live en millisecondes (défaut: 5 minutes)
  forceRefresh?: boolean; // Forcer un rafraîchissement depuis le réseau
  skipCache?: boolean; // Ne pas utiliser le cache du tout
  staleWhileRevalidate?: boolean; // Retourner le cache et rafraîchir en arrière-plan
}

export interface MutationOptions {
  invalidateCache?: string[]; // Endpoints à invalider après la mutation
  invalidatePrefixes?: string[]; // Préfixes à invalider (ex: '/hr/employees/' invalidera tous les détails)
  requiresOnline?: boolean; // Si true, échoue immédiatement si offline
}

class CacheManager {
  private defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut
  private revalidatingSet = new Set<string>(); // Éviter les revalidations en double

  /**
   * Vérifie si on est en ligne
   */
  private isOnline(): boolean {
    return typeof window !== 'undefined' ? window.navigator.onLine : true;
  }

  /**
   * Requête GET avec cache - stratégie offline-first
   *
   * 1. Si cache valide → retourne le cache
   * 2. Si online → requête réseau, stocke dans le cache
   * 3. Si offline/erreur réseau → retourne le cache même expiré
   * 4. Si rien en cache et offline → throw
   */
  async get<T>(
    endpoint: string,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl = this.defaultTTL,
      forceRefresh = false,
      skipCache = false,
      staleWhileRevalidate = false,
    } = options;

    // Si on ne veut pas de cache, requête directe
    if (skipCache) {
      if (!this.isOnline()) {
        // Même avec skipCache, tenter le cache en offline
        const fallback = await this.getRawCache<T>(endpoint);
        if (fallback !== null) return fallback;
        throw new ApiError('Mode hors ligne - pas de données en cache', 0);
      }
      return apiClient.get<T>(endpoint);
    }

    // Si on ne force pas le refresh, essayer le cache d'abord
    if (!forceRefresh) {
      try {
        const cachedData = await indexedDBManager.getCache(endpoint);
        if (cachedData !== null) {
          // Stale-while-revalidate: retourner le cache et rafraîchir en arrière-plan
          if (staleWhileRevalidate && this.isOnline() && !this.revalidatingSet.has(endpoint)) {
            this.revalidateInBackground(endpoint, ttl);
          }
          return cachedData as T;
        }
      } catch (error) {
        console.warn('[Cache] Erreur lecture cache:', error);
      }
    }

    // Si on est offline, essayer le cache même expiré avant de faire une requête réseau
    if (!this.isOnline()) {
      const staleData = await this.getRawCache<T>(endpoint);
      if (staleData !== null) {
        console.log(`[Cache] 📴 Offline → cache expiré pour ${endpoint}`);
        return staleData;
      }
      throw new ApiError('Mode hors ligne - pas de données en cache', 0);
    }

    // Online: requête réseau
    try {
      const data = await apiClient.get<T>(endpoint);

      // Stocker dans le cache
      try {
        await indexedDBManager.setCache(endpoint, data, ttl);
      } catch (error) {
        console.warn('[Cache] Erreur écriture cache:', error);
      }

      return data;
    } catch (error) {
      // Si erreur réseau, essayer le cache même expiré
      if (error instanceof ApiError && error.status === 0) {
        const staleData = await this.getRawCache<T>(endpoint);
        if (staleData !== null) {
          console.log(`[Cache] 🔄 Erreur réseau → cache expiré pour ${endpoint}`);
          return staleData;
        }
      }

      throw error;
    }
  }

  /**
   * Récupère les données du cache en ignorant le TTL
   * Essentiel pour le mode offline
   */
  async getRawCache<T>(endpoint: string): Promise<T | null> {
    try {
      return await indexedDBManager.getCacheRaw(endpoint) as T | null;
    } catch {
      return null;
    }
  }

  /**
   * Revalidate en arrière-plan (stale-while-revalidate)
   */
  private async revalidateInBackground(endpoint: string, ttl: number): Promise<void> {
    this.revalidatingSet.add(endpoint);
    try {
      const data = await apiClient.get(endpoint);
      await indexedDBManager.setCache(endpoint, data, ttl);
    } catch {
      // Ignorer les erreurs de revalidation silencieusement
    } finally {
      this.revalidatingSet.delete(endpoint);
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
    const { invalidateCache = [], invalidatePrefixes = [], requiresOnline = false } = mutationOptions;

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
      await this.invalidateAll(invalidateCache, invalidatePrefixes);

      // Retourner une réponse optimiste
      return { success: true, queued: true } as T;
    }

    // Online: requête normale
    try {
      const result = await apiClient.post<T>(endpoint, data);

      // Invalider le cache après succès
      await this.invalidateAll(invalidateCache, invalidatePrefixes);

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
    const { invalidateCache = [], invalidatePrefixes = [], requiresOnline = false } = mutationOptions;

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

      await this.invalidateAll(invalidateCache, invalidatePrefixes);
      return { success: true, queued: true } as T;
    }

    try {
      const result = await apiClient.put<T>(endpoint, data);
      await this.invalidateAll(invalidateCache, invalidatePrefixes);
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
    const { invalidateCache = [], invalidatePrefixes = [], requiresOnline = false } = mutationOptions;

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

      await this.invalidateAll(invalidateCache, invalidatePrefixes);
      return { success: true, queued: true } as T;
    }

    try {
      const result = await apiClient.patch<T>(endpoint, data);
      await this.invalidateAll(invalidateCache, invalidatePrefixes);
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
    const { invalidateCache = [], invalidatePrefixes = [], requiresOnline = false } = mutationOptions;

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

      await this.invalidateAll(invalidateCache, invalidatePrefixes);
      return { success: true, queued: true } as T;
    }

    try {
      const result = await apiClient.delete<T>(endpoint);
      await this.invalidateAll(invalidateCache, invalidatePrefixes);
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
   * Invalide les caches par endpoints exacts ET par préfixes
   */
  private async invalidateAll(endpoints: string[], prefixes: string[]): Promise<void> {
    // Invalider les endpoints exacts
    for (const endpoint of endpoints) {
      try {
        await indexedDBManager.invalidateCacheByEndpoint(endpoint);
      } catch (error) {
        console.warn(`[Cache] Erreur invalidation ${endpoint}:`, error);
      }
    }

    // Invalider par préfixes (ex: '/hr/employees/' supprime '/hr/employees/1/', '/hr/employees/2/', etc.)
    for (const prefix of prefixes) {
      try {
        await indexedDBManager.invalidateCacheByPrefix(prefix);
      } catch (error) {
        console.warn(`[Cache] Erreur invalidation préfixe ${prefix}:`, error);
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
   * Invalide manuellement par préfixe
   */
  async invalidateCacheByPrefix(prefix: string): Promise<void> {
    await indexedDBManager.invalidateCacheByPrefix(prefix);
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
