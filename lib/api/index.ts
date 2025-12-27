/**
 * Export centralisé du module API
 */

// Client API principal
export { apiClient, tokenManager, ApiError } from './client';

// Configuration
export { API_CONFIG, STORAGE_KEYS, API_ENDPOINTS } from './config';

// Service de base (pour créer de nouveaux services)
export {
  BaseService,
  ActivatableService,
  type CrudEndpoints,
  type ActivatableEndpoints,
  type ListOptions,
  type Activatable,
} from './base-service';
