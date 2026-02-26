/**
 * Customer Service - Gestion des clients
 * Refactoré pour utiliser BaseService
 */

import { BaseService, type CrudEndpoints } from '@/lib/api/base-service';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { Customer, CustomerCreate, CustomerUpdate, SaleList, CreditSale } from '@/lib/types/inventory';
import type { FilterParams } from '@/lib/types/shared';

/**
 * Paramètres de filtrage pour les clients
 */
interface CustomerFilters extends FilterParams {
  is_active?: boolean;
  search?: string;
}

/**
 * Service pour la gestion des clients
 */
class CustomerService extends BaseService<Customer, CustomerCreate, CustomerUpdate, CustomerFilters> {
  protected readonly endpoints: CrudEndpoints = API_ENDPOINTS.INVENTORY.CUSTOMERS;

  /**
   * Override create pour ajouter l'organisation
   */
  async create(data: CustomerCreate): Promise<Customer> {
    const dataWithOrg = addOrganizationToData(data);
    return super.create(dataWithOrg as CustomerCreate);
  }

  /**
   * Liste tous les clients (retourne results pour compatibilité)
   */
  async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    const response = await this.list(filters);
    return response.results || [];
  }

  /**
   * Récupère l'historique des ventes d'un client
   */
  async getSalesHistory(customerId: string): Promise<SaleList[]> {
    return apiClient.get<SaleList[]>(API_ENDPOINTS.INVENTORY.CUSTOMERS.SALES_HISTORY(customerId));
  }

  /**
   * Récupère l'historique des crédits d'un client
   */
  async getCreditHistory(customerId: string): Promise<CreditSale[]> {
    return apiClient.get<CreditSale[]>(API_ENDPOINTS.INVENTORY.CUSTOMERS.CREDIT_HISTORY(customerId));
  }
}

// Instance singleton du service
const customerService = new CustomerService();

// Exports des méthodes pour compatibilité avec l'ancienne API
export const getCustomers = customerService.getCustomers.bind(customerService);
export const getCustomer = customerService.getById.bind(customerService);
export const createCustomer = customerService.create.bind(customerService);
export const updateCustomer = customerService.update.bind(customerService);
export const deleteCustomer = customerService.delete.bind(customerService);
export const getCustomerSalesHistory = customerService.getSalesHistory.bind(customerService);
export const getCustomerCreditHistory = customerService.getCreditHistory.bind(customerService);

// Export du service pour usage avancé
export { customerService };
