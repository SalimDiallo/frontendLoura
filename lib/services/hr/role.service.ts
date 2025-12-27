/**
 * Service pour la gestion des rôles
 * Refactoré pour utiliser BaseService
 */

import { BaseService, type CrudEndpoints } from '@/lib/api/base-service';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Role, RoleCreate, RoleUpdate } from '@/lib/types/hr';
import type { FilterParams } from '@/lib/types/shared';

/**
 * Paramètres de filtrage pour les rôles
 */
interface RoleFilters extends FilterParams {
  is_active?: boolean;
  is_system_role?: boolean;
  organization_subdomain?: string;
  organization?: string;
}

/**
 * Service pour la gestion des rôles
 */
class RoleService extends BaseService<Role, RoleCreate, RoleUpdate, RoleFilters> {
  protected readonly endpoints: CrudEndpoints = API_ENDPOINTS.HR.ROLES;

  /**
   * Liste tous les rôles avec pagination (retourne results pour compatibilité)
   */
  async getRoles(filters?: RoleFilters): Promise<Role[]> {
    const response = await this.list(filters);
    return response.results || [];
  }
}

// Instance singleton du service
const roleService = new RoleService();

// Exports des méthodes pour compatibilité avec l'ancienne API
export const getRoles = roleService.getRoles.bind(roleService);
export const getRole = roleService.getById.bind(roleService);
export const createRole = roleService.create.bind(roleService);
export const updateRole = roleService.update.bind(roleService);
export const patchRole = roleService.update.bind(roleService);
export const deleteRole = roleService.delete.bind(roleService);

// Export du service pour usage avancé
export { roleService };
