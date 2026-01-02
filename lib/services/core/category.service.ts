/**
 * Service de gestion des catégories - Module Core
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Category } from '@/lib/types/core';

export const categoryService = {
  /**
   * Récupérer toutes les catégories
   */
  async getAll(): Promise<any> {
    return apiClient.get<any>(API_ENDPOINTS.CORE.CATEGORIES.LIST);
  },

  /**
   * Récupérer une catégorie par son ID
   */
  async getById(id: number): Promise<Category> {
    return apiClient.get<Category>(API_ENDPOINTS.CORE.CATEGORIES.DETAIL(id));
  },
};
