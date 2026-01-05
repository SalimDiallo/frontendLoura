/**
 * Store Zustand pour les permissions
 * Gère les permissions de l'utilisateur connecté
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export interface Permission {
  code: string;
  name?: string;
  category?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface PermissionsState {
  permissions: Permission[];
  role: Role | null;
  // Actions
  setPermissions: (permissions: Permission[] | string[]) => void;
  setRole: (role: Role | null) => void;
  clearPermissions: () => void;
  // Helpers
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
}

// ============================================
// Store
// ============================================

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
      setPermissions: (permissions) => {
        // Supporter les deux formats: string[] ou Permission[]
        const normalizedPermissions: Permission[] = permissions.map(p => 
          typeof p === 'string' ? { code: p } : p
        );
        set({ permissions: normalizedPermissions });
      },

      setRole: (role) => {
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
      hasPermission: (code) => {
        const { permissions } = get();
        return permissions.some((p) => p.code === code);
      },

      hasAnyPermission: (codes) => {
        const { permissions } = get();
        return codes.some((code) =>
          permissions.some((p) => p.code === code)
        );
      },

      hasAllPermissions: (codes) => {
        const { permissions } = get();
        return codes.every((code) =>
          permissions.some((p) => p.code === code)
        );
      },
    }),
    {
      name: 'permissions-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const permissionsSelectors = {
  getPermissions: (state: PermissionsState) => state.permissions,
  getRole: (state: PermissionsState) => state.role,
  getRoleName: (state: PermissionsState) => state.role?.name || '',
  getPermissionCodes: (state: PermissionsState) => state.permissions.map((p) => p.code),
  hasAnyPermissions: (state: PermissionsState) => state.permissions.length > 0,
};
