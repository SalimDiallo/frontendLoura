/**
 * Service de gestion des organisations avec cache - Module Core
 *
 * Ce service étend organizationService avec un système de cache pour:
 * - Réduire les appels API
 * - Fonctionner en mode offline
 * - Synchroniser automatiquement les changements
 */

import { API_ENDPOINTS } from '@/lib/api/config';
import { cacheManager } from '@/lib/offline';
import type {
  Organization,
  OrganizationCreateData,
  OrganizationUpdateData,
} from '@/lib/types/core';

// TTL personnalisés par type de requête
const CACHE_TTL = {
  LIST: 2 * 60 * 1000,      // 2 minutes pour la liste
  DETAIL: 5 * 60 * 1000,    // 5 minutes pour les détails
  STATS: 1 * 60 * 1000,     // 1 minute pour les stats
};

export const organizationCachedService = {
  /**
   * Récupérer toutes les organisations de l'utilisateur (avec cache)
   */
  async getAll(options?: { forceRefresh?: boolean }): Promise<Organization[]> {
    const response = await cacheManager.get<{ count: number; results: Organization[] }>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
      {
        ttl: CACHE_TTL.LIST,
        forceRefresh: options?.forceRefresh,
      }
    );
    return response.results || [];
  },

  /**
   * Récupérer une organisation par son ID (avec cache)
   */
  async getById(id: string, options?: { forceRefresh?: boolean }): Promise<Organization> {
    return cacheManager.get<Organization>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
      {
        ttl: CACHE_TTL.DETAIL,
        forceRefresh: options?.forceRefresh,
      }
    );
  },

  /**
   * Récupérer une organisation par son subdomain/slug (avec cache)
   */
  async getBySlug(slug: string): Promise<Organization | null> {
    const organizations = await this.getAll();
    return organizations.find((org) => org.subdomain.toLowerCase() === slug.toLowerCase()) || null;
  },

  /**
   * Créer une nouvelle organisation
   * Invalide le cache de la liste après création
   */
  async create(data: OrganizationCreateData): Promise<Organization> {
    return cacheManager.post<Organization>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.CREATE,
      data,
      {
        invalidateCache: [
          API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
        ],
      }
    );
  },

  /**
   * Mettre à jour une organisation (PATCH - partiel)
   * Invalide le cache de la liste et du détail après mise à jour
   */
  async update(
    id: string,
    data: OrganizationUpdateData
  ): Promise<Organization> {
    return cacheManager.patch<Organization>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE(id),
      data,
      {
        invalidateCache: [
          API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
          API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
        ],
      }
    );
  },

  /**
   * Mettre à jour une organisation (PUT - complet)
   */
  async replace(
    id: string,
    data: OrganizationCreateData
  ): Promise<Organization> {
    return cacheManager.put<Organization>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE(id),
      data,
      {
        invalidateCache: [
          API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
          API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
        ],
      }
    );
  },

  /**
   * Supprimer une organisation
   */
  async delete(id: string): Promise<void> {
    return cacheManager.delete(
      API_ENDPOINTS.CORE.ORGANIZATIONS.DELETE(id),
      {
        invalidateCache: [
          API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
          API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
        ],
      }
    );
  },

  /**
   * Activer une organisation
   */
  async activate(id: string): Promise<{ message: string; organization: Organization }> {
    return cacheManager.post(
      API_ENDPOINTS.CORE.ORGANIZATIONS.ACTIVATE(id),
      undefined,
      {
        invalidateCache: [
          API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
          API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
        ],
      }
    );
  },

  /**
   * Désactiver une organisation
   */
  async deactivate(id: string): Promise<{ message: string; organization: Organization }> {
    return cacheManager.post(
      API_ENDPOINTS.CORE.ORGANIZATIONS.DEACTIVATE(id),
      undefined,
      {
        invalidateCache: [
          API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
          API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
        ],
      }
    );
  },

  /**
   * Force le rafraîchissement du cache
   */
  async refreshCache(): Promise<void> {
    await this.getAll({ forceRefresh: true });
  },

  /**
   * Vide le cache des organisations
   */
  async clearCache(): Promise<void> {
    await cacheManager.invalidateCache(API_ENDPOINTS.CORE.ORGANIZATIONS.LIST);
  },
};
