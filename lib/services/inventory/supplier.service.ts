/**
 * Service pour la gestion des fournisseurs
 * Refactoré pour utiliser BaseService
 */

import { BaseService, type CrudEndpoints } from '@/lib/api/base-service';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { Supplier, SupplierCreate, SupplierUpdate, OrderList } from '@/lib/types/inventory';
import type { FilterParams } from '@/lib/types/shared';

/**
 * Paramètres de filtrage pour les fournisseurs
 */
interface SupplierFilters extends FilterParams {
  is_active?: boolean;
}

/**
 * Service pour la gestion des fournisseurs
 */
class SupplierService extends BaseService<Supplier, SupplierCreate, SupplierUpdate, SupplierFilters> {
  protected readonly endpoints: CrudEndpoints = API_ENDPOINTS.INVENTORY.SUPPLIERS;

  /**
   * Override create pour ajouter l'organisation
   */
  async create(data: SupplierCreate): Promise<Supplier> {
    const dataWithOrg = addOrganizationToData(data);
    return super.create(dataWithOrg as SupplierCreate);
  }

  /**
   * Liste tous les fournisseurs (retourne results pour compatibilité)
   */
  async getSuppliers(filters?: SupplierFilters): Promise<Supplier[]> {
    const response = await this.list(filters);
    return response.results || [];
  }

  /**
   * Récupère toutes les commandes d'un fournisseur
   */
  async getSupplierOrders(id: string): Promise<OrderList[]> {
    return apiClient.get<OrderList[]>(API_ENDPOINTS.INVENTORY.SUPPLIERS.ORDERS(id));
  }
}

// Instance singleton du service
const supplierService = new SupplierService();

// Exports des méthodes pour compatibilité avec l'ancienne API
export const getSuppliers = supplierService.getSuppliers.bind(supplierService);
export const getSupplier = supplierService.getById.bind(supplierService);
export const createSupplier = supplierService.create.bind(supplierService);
export const updateSupplier = supplierService.update.bind(supplierService);
export const deleteSupplier = supplierService.delete.bind(supplierService);
export const getSupplierOrders = supplierService.getSupplierOrders.bind(supplierService);

// Export du service pour usage avancé
export { supplierService };
