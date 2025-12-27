/**
 * Service pour la gestion des entrepôts
 * Refactoré pour utiliser BaseService
 */

import { BaseService, type CrudEndpoints } from '@/lib/api/base-service';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { Warehouse, WarehouseCreate, WarehouseUpdate, WarehouseStats, Stock } from '@/lib/types/inventory';
import type { FilterParams } from '@/lib/types/shared';

/**
 * Paramètres de filtrage pour les entrepôts
 */
interface WarehouseFilters extends FilterParams {
  is_active?: boolean;
}

/**
 * Service pour la gestion des entrepôts
 */
class WarehouseService extends BaseService<Warehouse, WarehouseCreate, WarehouseUpdate, WarehouseFilters> {
  protected readonly endpoints: CrudEndpoints = API_ENDPOINTS.INVENTORY.WAREHOUSES;

  /**
   * Override create pour ajouter l'organisation
   */
  async create(data: WarehouseCreate): Promise<Warehouse> {
    const dataWithOrg = addOrganizationToData(data);
    return super.create(dataWithOrg as WarehouseCreate);
  }

  /**
   * Liste tous les entrepôts (retourne results pour compatibilité)
   */
  async getWarehouses(filters?: WarehouseFilters): Promise<Warehouse[]> {
    const response = await this.list(filters);
    return response.results || [];
  }

  /**
   * Récupère l'inventaire d'un entrepôt
   */
  async getWarehouseInventory(id: string): Promise<Stock[]> {
    return apiClient.get<Stock[]>(API_ENDPOINTS.INVENTORY.WAREHOUSES.INVENTORY(id));
  }

  /**
   * Récupère les statistiques d'un entrepôt
   */
  async getWarehouseStats(id: string): Promise<WarehouseStats> {
    return apiClient.get<WarehouseStats>(API_ENDPOINTS.INVENTORY.WAREHOUSES.STATS(id));
  }
}

// Instance singleton du service
const warehouseService = new WarehouseService();

// Exports des méthodes pour compatibilité avec l'ancienne API
export const getWarehouses = warehouseService.getWarehouses.bind(warehouseService);
export const getWarehouse = warehouseService.getById.bind(warehouseService);
export const createWarehouse = warehouseService.create.bind(warehouseService);
export const updateWarehouse = warehouseService.update.bind(warehouseService);
export const deleteWarehouse = warehouseService.delete.bind(warehouseService);
export const getWarehouseInventory = warehouseService.getWarehouseInventory.bind(warehouseService);
export const getWarehouseStats = warehouseService.getWarehouseStats.bind(warehouseService);

// Export du service pour usage avancé
export { warehouseService };
