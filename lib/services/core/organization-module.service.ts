/**
 * Service de gestion des modules d'organisation - Module Core
 */

import { cacheManager } from '@/lib/offline';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { OrganizationModule } from '@/lib/types/core';

// Configuration des modules d'organisation change peu souvent
const CACHE_TTL = {
  LIST: 10 * 60 * 1000,  // 10 minutes pour la liste
};

export const organizationModuleService = {
  /**
   * Récupérer tous les modules d'organisation (toutes organisations)
   */
  async getAll(): Promise<OrganizationModule[]> {
    const response = await cacheManager.get<any>(
      API_ENDPOINTS.CORE.ORGANIZATION_MODULES.LIST,
      { ttl: CACHE_TTL.LIST }
    );
    // Handle Django pagination response
    if (response && typeof response === 'object' && 'results' in response) {
      return response.results || [];
    }
    return Array.isArray(response) ? response : [];
  },

  /**
   * Récupérer tous les modules d'une organisation spécifique
   */
  async getByOrganization(organizationId: string): Promise<OrganizationModule[]> {
    const response = await cacheManager.get<any>(
      `${API_ENDPOINTS.CORE.ORGANIZATION_MODULES.LIST}?organization=${organizationId}`,
      { ttl: CACHE_TTL.LIST }
    );
    // Handle Django pagination response
    if (response && typeof response === 'object' && 'results' in response) {
      return response.results || [];
    }
    return Array.isArray(response) ? response : [];
  },

  /**
   * Activer un module
   */
  async enable(id: string): Promise<{ message: string; organization_module: OrganizationModule }> {
    return cacheManager.post(
      API_ENDPOINTS.CORE.ORGANIZATION_MODULES.ENABLE(id),
      undefined,
      {
        invalidateCache: [API_ENDPOINTS.CORE.ORGANIZATION_MODULES.LIST],
      }
    );
  },

  /**
   * Désactiver un module
   */
  async disable(id: string): Promise<{ message: string; organization_module: OrganizationModule }> {
    return cacheManager.post(
      API_ENDPOINTS.CORE.ORGANIZATION_MODULES.DISABLE(id),
      undefined,
      {
        invalidateCache: [API_ENDPOINTS.CORE.ORGANIZATION_MODULES.LIST],
      }
    );
  },
};
