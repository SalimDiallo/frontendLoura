/**
 * Exports centralisés des stores Zustand
 */

// Stores
export { useAuthStore, authSelectors } from './auth-store';
export { usePermissionsStore, permissionsSelectors } from './permissions-store';
export { useNotificationStore, notificationSelectors } from './notification-store';
export type { NotificationState } from './notification-store';

// Types
export type {
  AuthState,
  PermissionsState,
  User,
  UserType,
  Permission,
  Role,
} from './types';
