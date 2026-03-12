/**
 * Service de gestion des modules d'organisation - Module Core
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { OrganizationModule } from '@/lib/types/core';

export const organizationModuleService = {
  /**
   * Récupérer tous les modules d'une organisation
   */
  async getAll(): Promise<OrganizationModule[]> {
    const response = await apiClient.get<any>(API_ENDPOINTS.CORE.ORGANIZATION_MODULES.LIST);
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
    return apiClient.post(API_ENDPOINTS.CORE.ORGANIZATION_MODULES.ENABLE(id));
  },

  /**
   * Désactiver un module
   */
  async disable(id: string): Promise<{ message: string; organization_module: OrganizationModule }> {
    return apiClient.post(API_ENDPOINTS.CORE.ORGANIZATION_MODULES.DISABLE(id));
  },
};
