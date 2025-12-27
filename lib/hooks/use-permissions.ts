/**
 * Hooks personnalisés pour les permissions avec Zustand
 * Supporte à la fois AdminUser et Employee avec leurs permissions respectives
 */

'use client';

import { usePermissionsStore, permissionsSelectors, useAuthStore } from '@/lib/store';

/**
 * Hook pour accéder à toutes les permissions
 */
export function usePermissionsData() {
  return usePermissionsStore(permissionsSelectors.getPermissions);
}

/**
 * Hook pour accéder au rôle
 */
export function useRole() {
  return usePermissionsStore(permissionsSelectors.getRole);
}

/**
 * Hook pour accéder au nom du rôle
 */
export function useRoleName() {
  return usePermissionsStore(permissionsSelectors.getRoleName);
}

/**
 * Hook pour vérifier une permission spécifique
 */
export function useHasPermission(codename: string) {
  return usePermissionsStore((state) => state.hasPermission(codename));
}

/**
 * Hook pour vérifier si l'utilisateur a au moins une des permissions
 */
export function useHasAnyPermission(codenames: string[]) {
  return usePermissionsStore((state) => state.hasAnyPermission(codenames));
}

/**
 * Hook pour vérifier si l'utilisateur a toutes les permissions
 */
export function useHasAllPermissions(codenames: string[]) {
  return usePermissionsStore((state) => state.hasAllPermissions(codenames));
}

/**
 * Hook pour accéder aux actions de permissions
 */
export function usePermissionsActions() {
  const setPermissions = usePermissionsStore((state) => state.setPermissions);
  const setRole = usePermissionsStore((state) => state.setRole);
  const clearPermissions = usePermissionsStore((state) => state.clearPermissions);

  return {
    setPermissions,
    setRole,
    clearPermissions,
  };
}

/**
 * Hook principal pour les permissions
 * Compatible avec l'ancienne API pour faciliter la migration
 */
export function usePermissions() {
  const permissions = usePermissionsData();
  const role = useRole();
  const roleName = useRoleName();
  
  // Ajout des données utilisateur depuis le store auth
  const user = useAuthStore((state) => state.user);
  const userType = useAuthStore((state) => state.userType);
  const loading = useAuthStore((state) => state.isLoading);
  
  // AdminUser = pas de userType 'employee'
  const isAdmin = userType === 'admin';

  // Helpers qui utilisent le store
  const hasPermission = (code: string) =>
    usePermissionsStore.getState().hasPermission(code);

  const hasAnyPermission = (codes: string[]) =>
    usePermissionsStore.getState().hasAnyPermission(codes);

  const hasAllPermissions = (codes: string[]) =>
    usePermissionsStore.getState().hasAllPermissions(codes);

  // Alias pour compatibilité
  const can = hasPermission;
  const cannot = (code: string) => !hasPermission(code);

  return {
    // User info
    user,
    isAdmin,
    loading,
    // Permissions
    permissions,
    role,
    roleName,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    cannot,
  };
}
