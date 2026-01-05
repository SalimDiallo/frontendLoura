/**
 * Hooks personnalisés pour les permissions
 * Version simplifiée utilisant les codes backend directement
 */

'use client';

import { usePermissionsStore, permissionsSelectors } from '@/lib/store/permissions-store';
import { useAuthStore } from '@/lib/store';
import { normalizePermissionCode } from '@/lib/constants/permissions';

// ============================================
// Hooks de base
// ============================================

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
export function useHasPermission(code: string) {
  const userType = useAuthStore((state) => state.userType);
  const hasPermission = usePermissionsStore((state) => state.hasPermission);
  
  // Admin a toutes les permissions
  if (userType === 'admin') return true;
  
  const normalizedCode = normalizePermissionCode(code);
  return hasPermission(normalizedCode);
}

/**
 * Hook pour vérifier si l'utilisateur a au moins une des permissions
 */
export function useHasAnyPermission(codes: string[]) {
  const userType = useAuthStore((state) => state.userType);
  const hasAnyPermission = usePermissionsStore((state) => state.hasAnyPermission);
  
  if (userType === 'admin') return true;
  
  const normalizedCodes = codes.map(normalizePermissionCode);
  return hasAnyPermission(normalizedCodes);
}

/**
 * Hook pour vérifier si l'utilisateur a toutes les permissions
 */
export function useHasAllPermissions(codes: string[]) {
  const userType = useAuthStore((state) => state.userType);
  const hasAllPermissions = usePermissionsStore((state) => state.hasAllPermissions);
  
  if (userType === 'admin') return true;
  
  const normalizedCodes = codes.map(normalizePermissionCode);
  return hasAllPermissions(normalizedCodes);
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

// ============================================
// Hook principal
// ============================================

/**
 * Hook principal pour les permissions
 * Fournit toutes les données et helpers nécessaires
 */
export function usePermissions() {
  const permissions = usePermissionsData();
  const role = useRole();
  const roleName = useRoleName();
  
  // Données utilisateur
  const user = useAuthStore((state) => state.user);
  const userType = useAuthStore((state) => state.userType);
  const loading = useAuthStore((state) => state.isLoading);
  
  // Admin a toutes les permissions
  const isAdmin = userType === 'admin';

  /**
   * Vérifie si l'utilisateur a une permission
   */
  const hasPermission = (code: string): boolean => {
    if (isAdmin) return true;
    const normalizedCode = normalizePermissionCode(code);
    return usePermissionsStore.getState().hasPermission(normalizedCode);
  };

  /**
   * Vérifie si l'utilisateur a au moins une des permissions
   */
  const hasAnyPermission = (codes: string[]): boolean => {
    if (isAdmin) return true;
    const normalizedCodes = codes.map(normalizePermissionCode);
    return usePermissionsStore.getState().hasAnyPermission(normalizedCodes);
  };

  /**
   * Vérifie si l'utilisateur a toutes les permissions
   */
  const hasAllPermissions = (codes: string[]): boolean => {
    if (isAdmin) return true;
    const normalizedCodes = codes.map(normalizePermissionCode);
    return usePermissionsStore.getState().hasAllPermissions(normalizedCodes);
  };

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
    // Helpers
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    cannot,
  };
}
