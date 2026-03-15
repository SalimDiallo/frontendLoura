/**
 * Service de gestion des catégories - Module Core
 */

import { cacheManager } from '@/lib/offline';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Category } from '@/lib/types/core';

// Les catégories sont relativement statiques
const CACHE_TTL = {
  LIST: 30 * 60 * 1000,   // 30 minutes pour la liste
  DETAIL: 30 * 60 * 1000, // 30 minutes pour les détails
};

export const categoryService = {
  /**
   * Récupérer toutes les catégories
   */
  async getAll(): Promise<any> {
    return cacheManager.get<any>(
      API_ENDPOINTS.CORE.CATEGORIES.LIST,
      { ttl: CACHE_TTL.LIST }
    );
  },

  /**
   * Récupérer une catégorie par son ID
   */
  async getById(id: number): Promise<Category> {
    return cacheManager.get<Category>(
      API_ENDPOINTS.CORE.CATEGORIES.DETAIL(id),
      { ttl: CACHE_TTL.DETAIL }
    );
  },
};
