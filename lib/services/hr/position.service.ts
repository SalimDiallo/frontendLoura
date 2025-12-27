/**
 * Service pour la gestion des postes/positions
 * Refactoré pour utiliser BaseService
 */

import { BaseService, type CrudEndpoints } from '@/lib/api/base-service';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Position } from '@/lib/types/hr';
import type { FilterParams } from '@/lib/types/shared';

/**
 * Paramètres de filtrage pour les positions
 */
interface PositionFilters extends FilterParams {
  is_active?: boolean;
}

/**
 * Service pour la gestion des positions
 */
class PositionService extends BaseService<Position, Partial<Position>, Partial<Position>, PositionFilters> {
  protected readonly endpoints: CrudEndpoints = API_ENDPOINTS.HR.POSITIONS;

  /**
   * Liste toutes les positions (retourne results pour compatibilité)
   */
  async getPositions(filters?: PositionFilters): Promise<Position[]> {
    const response = await this.list(filters);
    return response.results || [];
  }
}

// Instance singleton du service
const positionService = new PositionService();

// Exports des méthodes pour compatibilité avec l'ancienne API
export const getPositions = positionService.getPositions.bind(positionService);
export const getPosition = positionService.getById.bind(positionService);
export const createPosition = positionService.create.bind(positionService);
export const updatePosition = positionService.update.bind(positionService);
export const deletePosition = positionService.delete.bind(positionService);

// Export du service pour usage avancé
export { positionService };
