/**
 * Service de gestion des modules - Module Core
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Module, DefaultModulesResponse } from '@/lib/types/core';

export const moduleService = {
  /**
   * Récupérer tous les modules disponibles
   */
  async getAll(): Promise<Module[]> {
    const response = await apiClient.get<any>(API_ENDPOINTS.CORE.MODULES.LIST);
    // Handle Django pagination response { count: number, results: [...] }
    if (response && typeof response === 'object' && 'results' in response) {
      return response.results || [];
    }
    // Fallback if response is already an array
    return Array.isArray(response) ? response : [];
  },

  /**
   * Récupérer un module par son ID
   */
  async getById(id: string): Promise<Module> {
    return apiClient.get<Module>(API_ENDPOINTS.CORE.MODULES.DETAIL(id));
  },

  /**
   * Récupérer les modules par défaut pour une catégorie
   */
  async getDefaultModules(params: {
    category_id?: number | string;
    category_name?: string;
  }): Promise<DefaultModulesResponse> {
    const queryParams = new URLSearchParams();

    if (params.category_id) {
      queryParams.append('category_id', params.category_id.toString());
    }
    if (params.category_name) {
      queryParams.append('category_name', params.category_name);
    }

    const url = `${API_ENDPOINTS.CORE.MODULES.DEFAULTS}?${queryParams.toString()}`;
    return apiClient.get<DefaultModulesResponse>(url);
  },

  /**
   * Récupérer les modules groupés par catégorie
   */
  async getByCategory(): Promise<Record<string, Module[]>> {
    return apiClient.get<Record<string, Module[]>>(
      API_ENDPOINTS.CORE.MODULES.BY_CATEGORY
    );
  },

  /**
   * Récupérer les modules actifs pour l'organisation de l'utilisateur connecté
   * @param organizationSubdomain - Subdomain de l'organisation (pour les admins)
   */
  async getActiveForUser(organizationSubdomain?: string): Promise<{
    active_modules: string[];
    organization_id: string;
    organization_name: string;
  }> {
    const url = organizationSubdomain
      ? `${API_ENDPOINTS.CORE.MODULES.LIST}active_for_user/?organization_subdomain=${organizationSubdomain}`
      : `${API_ENDPOINTS.CORE.MODULES.LIST}active_for_user/`;
    return apiClient.get(url);
  },
};
