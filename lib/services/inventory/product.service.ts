/**
 * Service pour la gestion des produits
 * Refactoré pour utiliser BaseService
 */

import { BaseService, type CrudEndpoints } from '@/lib/api/base-service';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { Product, ProductCreate, ProductUpdate, ProductList, Stock, Movement } from '@/lib/types/inventory';
import type { FilterParams } from '@/lib/types/shared';

/**
 * Paramètres de filtrage pour les produits
 */
interface ProductFilters extends FilterParams {
  category?: string;
  is_active?: boolean;
  low_stock?: boolean;
}

/**
 * Service pour la gestion des produits
 */
class ProductService extends BaseService<Product, ProductCreate, ProductUpdate, ProductFilters> {
  protected readonly endpoints: CrudEndpoints = API_ENDPOINTS.INVENTORY.PRODUCTS;

  /**
   * Override create pour ajouter l'organisation
   */
  async create(data: ProductCreate): Promise<Product> {
    const dataWithOrg = addOrganizationToData(data);
    return super.create(dataWithOrg as ProductCreate);
  }

  /**
   * Liste tous les produits (retourne results pour compatibilité)
   */
  async getProducts(filters?: ProductFilters): Promise<ProductList[]> {
    const response = await this.list(filters);
    return response.results as ProductList[] || [];
  }

  /**
   * Récupère les stocks par entrepôt pour un produit
   */
  async getProductStockByWarehouse(id: string): Promise<Stock[]> {
    return apiClient.get<Stock[]>(API_ENDPOINTS.INVENTORY.PRODUCTS.STOCK_BY_WAREHOUSE(id));
  }

  /**
   * Récupère l'historique des mouvements d'un produit
   */
  async getProductMovements(id: string): Promise<Movement[]> {
    return apiClient.get<Movement[]>(API_ENDPOINTS.INVENTORY.PRODUCTS.MOVEMENTS(id));
  }
}

// Instance singleton du service
const productService = new ProductService();

// Exports des méthodes pour compatibilité avec l'ancienne API
export const getProducts = productService.getProducts.bind(productService);
export const getProduct = productService.getById.bind(productService);
export const createProduct = productService.create.bind(productService);
export const updateProduct = productService.update.bind(productService);
export const deleteProduct = productService.delete.bind(productService);
export const getProductStockByWarehouse = productService.getProductStockByWarehouse.bind(productService);
export const getProductMovements = productService.getProductMovements.bind(productService);

// Export du service pour usage avancé
export { productService };
