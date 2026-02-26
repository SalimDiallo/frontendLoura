/**
 * Export centralisé du module API
 */

// Client API principal
export { apiClient, ApiError, tokenManager } from './client';

// Configuration
export { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from './config';

// Service de base (pour créer de nouveaux services)
export {
  ActivatableService, BaseService, type Activatable, type ActivatableEndpoints, type CrudEndpoints, type ListOptions
} from './base-service';
