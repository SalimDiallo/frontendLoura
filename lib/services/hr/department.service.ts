/**
 * Service pour la gestion des départements
 * Refactoré pour utiliser ActivatableService
 */

import { ActivatableService, type ActivatableEndpoints } from '@/lib/api/base-service';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Department, DepartmentCreate, DepartmentUpdate } from '@/lib/types/hr';
import type { FilterParams } from '@/lib/types/shared';

/**
 * Paramètres de filtrage pour les départements
 */
interface DepartmentFilters extends FilterParams {
  is_active?: boolean;
  organization_subdomain?: string;
  organization?: string;
}

/**
 * Service pour la gestion des départements
 */
class DepartmentService extends ActivatableService<
  Department,
  DepartmentCreate,
  DepartmentUpdate,
  DepartmentFilters
> {
  protected readonly endpoints: ActivatableEndpoints = API_ENDPOINTS.HR.DEPARTMENTS;

  /**
   * Liste tous les départements avec pagination
   * Compatible avec l'ancienne API mais retourne results
   */
  async getDepartments(filters?: DepartmentFilters): Promise<Department[]> {
    const response = await this.list(filters);
    return response.results || [];
  }
}

// Instance singleton du service
const departmentService = new DepartmentService();

// Exports des méthodes pour compatibilité avec l'ancienne API
export const getDepartments = departmentService.getDepartments.bind(departmentService);
export const getDepartment = departmentService.getById.bind(departmentService);
export const createDepartment = departmentService.create.bind(departmentService);
export const updateDepartment = departmentService.update.bind(departmentService);
export const patchDepartment = departmentService.update.bind(departmentService); // PATCH = update dans BaseService
export const activateDepartment = departmentService.activate.bind(departmentService);
export const deactivateDepartment = departmentService.deactivate.bind(departmentService);
export const deleteDepartment = departmentService.delete.bind(departmentService);

// Export du service pour usage avancé
export { departmentService };
