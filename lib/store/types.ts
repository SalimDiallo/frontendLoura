/**
 * Types pour les stores Zustand
 */

import type { AdminUser } from '@/lib/types/core';
import type { Employee, Permission as HRPermission, Role as HRRole } from '@/lib/types/hr';

/**
 * Type d'utilisateur
 */
export type UserType = 'admin' | 'employee' | null;

/**
 * Utilisateur unifié (Admin ou Employee)
 */
export type User = AdminUser | Employee | null;

/**
 * Permission d'un employé (réutilise le type HR)
 */
export type Permission = HRPermission;

/**
 * Rôle d'un employé avec ses permissions (réutilise le type HR)
 */
export type Role = HRRole;


/**
 * State du store d'authentification
 */
export interface AuthState {
  // User data
  user: User;
  userType: UserType;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User, type: UserType) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * State du store de permissions
 */
export interface PermissionsState {
  // Permissions de l'employé actuel
  permissions: Permission[];
  role: Role | null;

  // Actions
  setPermissions: (permissions: Permission[]) => void;
  setRole: (role: Role | null) => void;
  clearPermissions: () => void;

  // Helpers pour vérifier les permissions
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
}
