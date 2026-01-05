/**
 * Types pour les stores Zustand
 * Adaptés au système d'authentification unifié
 */

import type { AdminUser } from '@/lib/types/core';
import type { Employee, Permission as HRPermission, Role as HRRole } from '@/lib/types/hr';

/**
 * Type d'utilisateur
 */
export type UserType = 'admin' | 'employee' | null;

/**
 * Utilisateur unifié - compatible avec AdminUser et Employee
 */
export interface UnifiedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  user_type?: 'admin' | 'employee';
  is_active: boolean;
  created_at?: string;
  // Fields Admin
  organizations?: Array<{
    id: string;
    name: string;
    subdomain: string;
    logo_url?: string;
    is_active: boolean;
  }>;
  // Fields Employee
  employee_id?: string;
  organization?: {
    id: string;
    name: string;
    subdomain: string;
    logo_url?: string;
  };
  department?: { id: string; name: string };
  position?: { id: string; title: string };
  permissions?: string[];
}

/**
 * User peut être UnifiedUser, AdminUser, Employee ou null
 */
export type User = UnifiedUser | null;

/**
 * Permission d'un employé
 */
export type Permission = HRPermission | string;

/**
 * Rôle d'un employé avec ses permissions
 */
export type Role = HRRole;

/**
 * State du store d'authentification
 */
export interface AuthState {
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
  permissions: Permission[];
  role: Role | null;

  // Actions
  setPermissions: (permissions: Permission[]) => void;
  setRole: (role: Role | null) => void;
  clearPermissions: () => void;

  // Helpers
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
}
