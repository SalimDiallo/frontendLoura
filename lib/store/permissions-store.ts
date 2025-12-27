/**
 * Store Zustand pour les permissions
 * Gère les permissions de l'employé connecté
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PermissionsState, Permission, Role } from './types';

/**
 * Store de permissions
 * Persiste les données dans localStorage
 */
export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      // Initial state
      permissions: [],
      role: null,

      // Actions
      setPermissions: (permissions: Permission[]) => {
        set({ permissions });
      },

      setRole: (role: Role | null) => {
        set({
          role,
          // Mettre à jour les permissions à partir du rôle
          permissions: role?.permissions || [],
        });
      },

      clearPermissions: () => {
        set({
          permissions: [],
          role: null,
        });
      },

      // Helpers pour vérifier les permissions
      hasPermission: (code: string) => {
        const { permissions } = get();
        return permissions.some((p) => p.code === code);
      },

      hasAnyPermission: (codes: string[]) => {
        const { permissions } = get();
        return codes.some((code) =>
          permissions.some((p) => p.code === code)
        );
      },

      hasAllPermissions: (codes: string[]) => {
        const { permissions } = get();
        return codes.every((code) =>
          permissions.some((p) => p.code === code)
        );
      },
    }),
    {
      name: 'permissions-storage', // Clé dans localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Selectors pour accéder facilement aux données
 */
export const permissionsSelectors = {
  // Récupérer toutes les permissions
  getPermissions: (state: PermissionsState) => state.permissions,

  // Récupérer le rôle
  getRole: (state: PermissionsState) => state.role,

  // Récupérer le nom du rôle
  getRoleName: (state: PermissionsState) => state.role?.name || '',

  // Récupérer les codes de permissions
  getPermissionCodes: (state: PermissionsState) =>
    state.permissions.map((p) => p.code),

  // Vérifier si l'utilisateur a au moins une permission
  hasAnyPermissions: (state: PermissionsState) => state.permissions.length > 0,
};

/**
 * Permissions prédéfinies communes
 */
export const PERMISSIONS = {
  // Employees
  VIEW_EMPLOYEE: 'can_view_employee',
  ADD_EMPLOYEE: 'can_add_employee',
  CHANGE_EMPLOYEE: 'can_change_employee',
  DELETE_EMPLOYEE: 'can_delete_employee',

  // Departments
  VIEW_DEPARTMENT: 'can_view_department',
  ADD_DEPARTMENT: 'can_add_department',
  CHANGE_DEPARTMENT: 'can_change_department',
  DELETE_DEPARTMENT: 'can_delete_department',

  // Positions
  VIEW_POSITION: 'can_view_position',
  ADD_POSITION: 'can_add_position',
  CHANGE_POSITION: 'can_change_position',
  DELETE_POSITION: 'can_delete_position',

  // Contracts
  VIEW_CONTRACT: 'can_view_contract',
  ADD_CONTRACT: 'can_add_contract',
  CHANGE_CONTRACT: 'can_change_contract',
  DELETE_CONTRACT: 'can_delete_contract',

  // Leaves
  VIEW_LEAVE: 'can_view_leave',
  ADD_LEAVE: 'can_add_leave',
  CHANGE_LEAVE: 'can_change_leave',
  DELETE_LEAVE: 'can_delete_leave',
  APPROVE_LEAVE: 'can_approve_leave',

  // Payroll
  VIEW_PAYROLL: 'can_view_payroll',
  ADD_PAYROLL: 'can_add_payroll',
  CHANGE_PAYROLL: 'can_change_payroll',
  DELETE_PAYROLL: 'can_delete_payroll',
  PROCESS_PAYROLL: 'can_process_payroll',

  // Attendance
  VIEW_ATTENDANCE: 'can_view_attendance',
  ADD_ATTENDANCE: 'can_add_attendance',
  CHANGE_ATTENDANCE: 'can_change_attendance',
  DELETE_ATTENDANCE: 'can_delete_attendance',
  APPROVE_ATTENDANCE: 'can_approve_attendance',

  // Roles
  VIEW_ROLE: 'can_view_role',
  ADD_ROLE: 'can_add_role',
  CHANGE_ROLE: 'can_change_role',
  DELETE_ROLE: 'can_delete_role',
} as const;
