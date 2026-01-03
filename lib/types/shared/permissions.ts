/**
 * Types pour la gestion des permissions et de l'autorisation
 * Refactorisé pour utiliser le système modulaire défini dans lib/types/permissions/introduction
 */

import type { Permission } from '../hr';
import { ResourceType, PermissionAction, COMMON_PERMISSIONS } from '../permissions';

// Re-export specific enums/constants for backward compatibility
export { ResourceType, PermissionAction, COMMON_PERMISSIONS };

// ============================================
// Permission Logic Types
// ============================================

/**
 * Structure d'une permission formatée
 */
export interface PermissionCheck {
  resource: ResourceType | string;
  action: PermissionAction | string;
}

/**
 * Contexte de l'utilisateur avec ses permissions
 */
export interface UserPermissionContext {
  userId: string;
  organizationId: string;
  permissions: Permission[];
  permissionCodes: string[];
  isAdmin?: boolean;
  isSuperuser?: boolean;
}

/**
 * Configuration de protection de route
 */
export interface RouteProtectionConfig {
  /**
   * Permissions requises (OR logic - au moins une doit être présente)
   */
  requiredPermissions?: PermissionCheck[];

  /**
   * Toutes ces permissions sont requises (AND logic)
   */
  requireAllPermissions?: PermissionCheck[];

  /**
   * Custom function pour vérifier l'accès
   */
  customCheck?: (context: UserPermissionContext) => boolean;

  /**
   * Message d'erreur personnalisé
   */
  deniedMessage?: string;

  /**
   * Redirection si accès refusé
   */
  redirectTo?: string;
}

// ============================================
// Permission Code Helpers
// ============================================

/**
 * Helper pour créer un code de permission
 * Format: resource.action
 */
export function createPermissionCode(
  resource: ResourceType | string,
  action: PermissionAction | string
): string {
  return `${resource}.${action}`;
}

/**
 * Helper pour parser un code de permission
 */
export function parsePermissionCode(code: string): PermissionCheck | null {
  const parts = code.split('.');
  if (parts.length !== 2) return null;

  return {
    resource: parts[0],
    action: parts[1],
  };
}
