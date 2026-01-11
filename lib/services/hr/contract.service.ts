/**
 * Contract Service
 * 
 * Service pour la gestion des contrats de travail.
 * 
 * RÈGLE MÉTIER IMPORTANTE:
 * Un employé ne peut avoir qu'un seul contrat actif à un instant donné.
 * Quand un nouveau contrat est créé comme actif ou qu'un contrat existant
 * est activé, les autres contrats de l'employé sont automatiquement désactivés.
 */

import { BaseService, type CrudEndpoints } from '@/lib/api/base-service';
import { apiClient } from '@/lib/api/client';
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
 * Réponse de l'API pour les actions activate/deactivate
 */
interface ContractActionResponse {
  message: string;
  contract: Contract;
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
   * 
   * Note: Si is_active est true (défaut), les autres contrats actifs
   * de l'employé seront automatiquement désactivés.
   */
  async createContract(orgSlug: string, data: ContractCreate): Promise<Contract> {
    return this.create(data);
  }

  /**
   * Update an existing contract
   * 
   * Note: Si is_active passe à true, les autres contrats actifs
   * de l'employé seront automatiquement désactivés.
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
   * Get all contracts for a specific employee
   */
  async getEmployeeContracts(orgSlug: string, employeeId: string): Promise<Contract[]> {
    const response = await this.getContracts(orgSlug, { employee: employeeId });
    return response.results;
  }

  /**
   * Get active contract for an employee
   * Returns null if the employee has no active contract
   */
  async getActiveContract(orgSlug: string, employeeId: string): Promise<Contract | null> {
    const response = await this.getContracts(orgSlug, {
      employee: employeeId,
      is_active: true,
    });
    return response.results[0] || null;
  }

  /**
   * Check if an employee already has an active contract
   */
  async hasActiveContract(orgSlug: string, employeeId: string): Promise<boolean> {
    const activeContract = await this.getActiveContract(orgSlug, employeeId);
    return activeContract !== null;
  }

  /**
   * Deactivate a contract
   * Uses the dedicated API endpoint for deactivation
   */
  async deactivateContract(orgSlug: string, contractId: string): Promise<Contract> {
    const response = await apiClient.post<ContractActionResponse>(
      `${BASE_PATH}/${contractId}/deactivate/`
    );
    return response.contract;
  }

  /**
   * Activate a contract
   * 
   * IMPORTANT: Cette action désactive automatiquement tous les autres
   * contrats actifs de l'employé pour garantir qu'il n'y a qu'un seul
   * contrat actif à la fois.
   */
  async activateContract(orgSlug: string, contractId: string): Promise<Contract> {
    const response = await apiClient.post<ContractActionResponse>(
      `${BASE_PATH}/${contractId}/activate/`
    );
    return response.contract;
  }

  /**
   * Get the active contract for an employee using the dedicated endpoint
   */
  async getActiveContractForEmployee(orgSlug: string, employeeId: string): Promise<Contract | null> {
    try {
      const response = await apiClient.get<Contract | { message: string; contract: null }>(
        `${BASE_PATH}/active/${employeeId}/`
      );
      // Si la réponse contient contract: null, retourner null
      if ('contract' in response && response.contract === null) {
        return null;
      }
      return response as Contract;
    } catch {
      return null;
    }
  }
}

// Instance singleton du service
export const contractService = new ContractService();

