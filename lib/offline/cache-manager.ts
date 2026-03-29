/**
 * Cache Manager - Couche de cache pour les requêtes API
 *
 * Stratégie:
 * - GET (online): Network-first → toujours interroger l'API, cache en fallback si erreur réseau
 * - GET (offline): Cache-first → retourne le cache même expiré, jamais de throw si données disponibles
 * - POST/PUT/PATCH/DELETE: Network-first avec queue offline
 *
 * Améliorations offline-first:
 * - Cache expiré TOUJOURS retourné en mode offline (jamais de throw)
 * - getCache "raw" qui ignore le TTL pour garantir le fonctionnement hors ligne
 * - Invalidation par préfixe pour les routes dynamiques
 * - Quand online, les données fraîches de l'API sont toujours prioritaires
 */

import { apiClient, ApiError } from '@/lib/api/client';
import { indexedDBManager } from './indexeddb';

export interface CacheOptions {
  ttl?: number; // Time to live en millisecondes (défaut: 5 minutes)
  forceRefresh?: boolean; // Forcer un rafraîchissement depuis le réseau (legacy, toujours network-first maintenant)
  skipCache?: boolean; // Ne pas stocker en cache après le fetch
  staleWhileRevalidate?: boolean; // Legacy, ignoré (on est toujours network-first online)
}

export interface MutationOptions {
  invalidateCache?: string[]; // Endpoints à invalider après la mutation
  invalidatePrefixes?: string[]; // Préfixes à invalider (ex: '/hr/employees/' invalidera tous les détails)
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
   * Requête GET avec cache - stratégie network-first
   *
   * Online:
   *   1. Requête réseau → stocke en cache → retourne les données fraîches
   *   2. Si erreur réseau → retourne le cache (même expiré) en fallback
   *
   * Offline:
   *   1. Retourne le cache (même expiré)
   *   2. Si rien en cache → throw
   */
  async get<T>(
    endpoint: string,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl = this.defaultTTL,
      skipCache = false,
    } = options;

    // --- OFFLINE: cache-first (même expiré) ---
    if (!this.isOnline()) {
      const cachedData = await this.getRawCache<T>(endpoint);
      if (cachedData !== null) {
        console.log(`[Cache] 📴 Offline → cache pour ${endpoint}`);
        return cachedData;
      }
      throw new ApiError('Mode hors ligne - pas de données en cache', 0);
    }

    // --- ONLINE: network-first ---
    try {
      const data = await apiClient.get<T>(endpoint);

      // Stocker dans le cache (sauf si skipCache)
      if (!skipCache) {
        try {
          await indexedDBManager.setCache(endpoint, data, ttl);
        } catch (error) {
          console.warn('[Cache] Erreur écriture cache:', error);
        }
      }

      return data;
    } catch (error) {
      // Si erreur réseau, fallback sur le cache (même expiré)
      if (error instanceof ApiError && error.status === 0) {
        const staleData = await this.getRawCache<T>(endpoint);
        if (staleData !== null) {
          console.log(`[Cache] 🔄 Erreur réseau → cache fallback pour ${endpoint}`);
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
