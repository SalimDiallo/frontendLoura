/**
 * Service de gestion des modules - Module Core
 */

import { cacheManager } from '@/lib/offline';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Module, DefaultModulesResponse } from '@/lib/types/core';

// Les modules sont relativement statiques
const CACHE_TTL = {
  LIST: 30 * 60 * 1000,     // 30 minutes pour la liste
  DETAIL: 30 * 60 * 1000,   // 30 minutes pour les détails
  DEFAULTS: 30 * 60 * 1000, // 30 minutes pour les defaults
  BY_CATEGORY: 30 * 60 * 1000, // 30 minutes pour par catégorie
  ACTIVE: 5 * 60 * 1000,    // 5 minutes pour les modules actifs
};

export const moduleService = {
  /**
   * Récupérer tous les modules disponibles
   */
  async getAll(): Promise<Module[]> {
    const response = await cacheManager.get<any>(
      API_ENDPOINTS.CORE.MODULES.LIST,
      { ttl: CACHE_TTL.LIST }
    );
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
    return cacheManager.get<Module>(
      API_ENDPOINTS.CORE.MODULES.DETAIL(id),
      { ttl: CACHE_TTL.DETAIL }
    );
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
    return cacheManager.get<DefaultModulesResponse>(url, { ttl: CACHE_TTL.DEFAULTS });
  },

  /**
   * Récupérer les modules groupés par catégorie
   */
  async getByCategory(): Promise<Record<string, Module[]>> {
    return cacheManager.get<Record<string, Module[]>>(
      API_ENDPOINTS.CORE.MODULES.BY_CATEGORY,
      { ttl: CACHE_TTL.BY_CATEGORY }
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
    return cacheManager.get(url, { ttl: CACHE_TTL.ACTIVE });
  },
};
