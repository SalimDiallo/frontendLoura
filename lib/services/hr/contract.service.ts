/**
 * Contract Service
 * Refactoré pour utiliser BaseService
 */

import { BaseService, type CrudEndpoints } from '@/lib/api/base-service';
import type {
  Contract,
  ContractCreate,
  ContractUpdate,
  ContractListResponse,
} from '@/lib/types/hr';
import type { FilterParams } from '@/lib/types/shared';

const BASE_PATH = '/hr/contracts';

/**
 * Paramètres de filtrage pour les contrats
 */
interface ContractFilters extends FilterParams {
  employee?: string;
  contract_type?: string;
  is_active?: boolean;
  organization_subdomain?: string;
}

/**
 * Service pour la gestion des contrats
 */
class ContractService extends BaseService<Contract, ContractCreate, ContractUpdate, ContractFilters> {
  protected readonly endpoints: CrudEndpoints = {
    LIST: `${BASE_PATH}/`,
    CREATE: `${BASE_PATH}/`,
    DETAIL: (id: string) => `${BASE_PATH}/${id}/`,
    UPDATE: (id: string) => `${BASE_PATH}/${id}/`,
    DELETE: (id: string) => `${BASE_PATH}/${id}/`,
  };

  /**
   * Get all contracts for the organization
   */
  async getContracts(orgSlug: string, params?: ContractFilters): Promise<ContractListResponse> {
    const filters = { ...params, organization_subdomain: orgSlug };
    return this.list(filters);
  }

  /**
   * Get a single contract by ID
   */
  async getContract(orgSlug: string, contractId: string): Promise<Contract> {
    return this.getById(contractId);
  }

  /**
   * Create a new contract
   */
  async createContract(orgSlug: string, data: ContractCreate): Promise<Contract> {
    return this.create(data);
  }

  /**
   * Update an existing contract
   */
  async updateContract(orgSlug: string, contractId: string, data: ContractUpdate): Promise<Contract> {
    return this.update(contractId, data);
  }

  /**
   * Delete a contract
   */
  async deleteContract(orgSlug: string, contractId: string): Promise<void> {
    return this.delete(contractId);
  }

  /**
   * Get contracts for a specific employee
   */
  async getEmployeeContracts(orgSlug: string, employeeId: string): Promise<Contract[]> {
    const response = await this.getContracts(orgSlug, { employee: employeeId });
    return response.results;
  }

  /**
   * Get active contract for an employee
   */
  async getActiveContract(orgSlug: string, employeeId: string): Promise<Contract | null> {
    const response = await this.getContracts(orgSlug, {
      employee: employeeId,
      is_active: true,
    });
    return response.results[0] || null;
  }

  /**
   * Deactivate a contract
   */
  async deactivateContract(orgSlug: string, contractId: string): Promise<Contract> {
    return this.updateContract(orgSlug, contractId, { is_active: false });
  }

  /**
   * Activate a contract
   */
  async activateContract(orgSlug: string, contractId: string): Promise<Contract> {
    return this.updateContract(orgSlug, contractId, { is_active: true });
  }
}

// Instance singleton du service
export const contractService = new ContractService();
