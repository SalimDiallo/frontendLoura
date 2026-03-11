/**
 * Point d'entrée centralisé pour la bibliothèque lib/
 * Facilite les imports et améliore la maintenabilité
 * 
 * Usage:
 * import { apiClient, useAuthStore } from '@/lib';
 * import { hrServices } from '@/lib';
 */

// API Client & Configuration
export { apiClient, tokenManager, ApiError } from './api/client';
export { API_CONFIG, STORAGE_KEYS, API_ENDPOINTS } from './api/config';
export { BaseService, ActivatableService } from './api/base-service';
export type { CrudEndpoints, ActivatableEndpoints, ListOptions, Activatable } from './api/base-service';

// Stores Zustand
export {
  useAuthStore,
  authSelectors,
  usePermissionsStore,
  permissionsSelectors,
} from './store';

// Store Types (éviter les conflits avec les types HR)
export type {
  AuthState,
  PermissionsState,
  User,
  UserType,
} from './store';

// Constants
// Utils
export { cn, formatCurrency, formatCompactCurrency } from './utils';

// Error handling
export { formatError, logError, isAuthenticationError, isNetworkError } from './utils/error-handler';
export type { FormattedError, ErrorType } from './utils/error-handler';

// Services - Import spécifiques par module pour eviter les conflits
export * as authServices from './services/auth';
export * as coreServices from './services/core';
export * as hrServices from './services/hr';

