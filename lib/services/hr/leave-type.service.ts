/**
 * Service pour la gestion des types de congés
 */
import { BaseService, type CrudEndpoints } from '@/lib/api/base-service';
import { API_ENDPOINTS } from '@/lib/api/config';
import { apiClient } from '@/lib/api/client';
import type { LeaveType } from '@/lib/types/hr';
import type { FilterParams } from '@/lib/types/shared';

/**
 * Paramètres de filtrage pour les types de congés
 */
interface LeaveTypeFilters extends FilterParams {
  is_active?: boolean;
}

/**
 * Service pour la gestion des types de congés
 */
class LeaveTypeService extends BaseService<LeaveType, Partial<LeaveType>, Partial<LeaveType>, LeaveTypeFilters> {
  protected readonly endpoints: CrudEndpoints = API_ENDPOINTS.HR.LEAVE_TYPES;

  /**
   * Liste tous les types de congés (retourne results pour compatibilité)
   */
  async getLeaveTypes(filters?: LeaveTypeFilters): Promise<LeaveType[]> {
    const response = await this.list(filters);
    return response.results || [];
  }

  /**
   * Crée un type de congé avec organization_subdomain en query param
   * Le backend attend le subdomain en query_params pour perform_create
   */
  async createWithOrg(data: Partial<LeaveType> & { organization_subdomain: string }): Promise<LeaveType> {
    const { organization_subdomain, ...body } = data;
    const url = `${this.endpoints.CREATE}?organization_subdomain=${encodeURIComponent(organization_subdomain)}`;
    return apiClient.post<LeaveType>(url, body);
  }
}

// Instance singleton du service
const leaveTypeService = new LeaveTypeService();

// Exports des méthodes pour compatibilité avec l'ancienne API
export const getLeaveTypes = leaveTypeService.getLeaveTypes.bind(leaveTypeService);
export const getLeaveType = leaveTypeService.getById.bind(leaveTypeService);
export const createLeaveType = leaveTypeService.createWithOrg.bind(leaveTypeService);
export const updateLeaveType = leaveTypeService.update.bind(leaveTypeService);
export const deleteLeaveType = leaveTypeService.delete.bind(leaveTypeService);

// Export du service pour usage avancé
export { leaveTypeService };

