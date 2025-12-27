/**
 * Service pour la gestion des catégories de produits
 * Refactoré pour utiliser BaseService
 */

import { BaseService, type CrudEndpoints } from '@/lib/api/base-service';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { Category, CategoryCreate, CategoryUpdate, CategoryTree } from '@/lib/types/inventory';
import type { FilterParams } from '@/lib/types/shared';

/**
 * Paramètres de filtrage pour les catégories
 */
interface CategoryFilters extends FilterParams {
  parent?: string;
  is_active?: boolean;
}

/**
 * Service pour la gestion des catégories
 */
class CategoryService extends BaseService<Category, CategoryCreate, CategoryUpdate, CategoryFilters> {
  protected readonly endpoints: CrudEndpoints = API_ENDPOINTS.INVENTORY.CATEGORIES;

  /**
   * Override create pour ajouter l'organisation
   */
  async create(data: CategoryCreate): Promise<Category> {
    const dataWithOrg = addOrganizationToData(data);
    return super.create(dataWithOrg as CategoryCreate);
  }

  /**
   * Liste toutes les catégories (retourne results pour compatibilité)
   */
  async getCategories(filters?: CategoryFilters): Promise<Category[]> {
    const response = await this.list(filters);
    return response.results || [];
  }

  /**
   * Récupère l'arbre des catégories
   */
  async getCategoryTree(): Promise<CategoryTree[]> {
    return apiClient.get<CategoryTree[]>(API_ENDPOINTS.INVENTORY.CATEGORIES.TREE);
  }
}

// Instance singleton du service
const categoryService = new CategoryService();

// Exports des méthodes pour compatibilité avec l'ancienne API
export const getCategories = categoryService.getCategories.bind(categoryService);
export const getCategoryTree = categoryService.getCategoryTree.bind(categoryService);
export const getCategory = categoryService.getById.bind(categoryService);
export const createCategory = categoryService.create.bind(categoryService);
export const updateCategory = categoryService.update.bind(categoryService);
export const deleteCategory = categoryService.delete.bind(categoryService);

// Export du service pour usage avancé
export { categoryService };
