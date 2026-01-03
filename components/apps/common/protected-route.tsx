/**
 * Composants pour protéger les routes avec des permissions
 */

'use client';

import React, { PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissionContext, convertBackendPermissionToFrontend } from './permission-provider';
import type { RouteProtectionConfig } from '@/lib/types/shared';
import { Alert } from '@/components/ui/alert';
import { HiOutlineShieldExclamation } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';



interface ProtectedRouteProps extends PropsWithChildren {
  config: RouteProtectionConfig;
  fallback?: React.ReactNode;
}

/**
 * Composant pour protéger une route avec des permissions
 */
export function ProtectedRoute({ children, config, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const { permissionContext, hasAnyPermission, hasAllPermissions, isLoading } = usePermissionContext();

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a accès
  const hasAccess = checkAccess(config, permissionContext, hasAnyPermission, hasAllPermissions);

  if (!hasAccess) {
    // Rediriger si configuré
    if (config.redirectTo) {
      router.push(config.redirectTo);
      return null;
    }

    // Afficher le fallback personnalisé ou le message par défaut
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert variant="error" className="border-red-200 bg-red-50">
          <HiOutlineShieldExclamation className="h-5 w-5 text-red-600" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Accès refusé</h3>
            <div className="mt-2 text-sm text-red-700">
              {config.deniedMessage || "Vous n'avez pas les permissions nécessaires pour accéder à cette page."}
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Retour
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Helper pour vérifier l'accès selon la configuration
 */
function checkAccess(
  config: RouteProtectionConfig,
  permissionContext: any,
  hasAnyPermission: (checks: any[]) => boolean,
  hasAllPermissions: (checks: any[]) => boolean
): boolean {
  // Custom check en priorité
  if (config.customCheck) {
    return config.customCheck(permissionContext);
  }

  // Vérifier les permissions requises (OR logic)
  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    return hasAnyPermission(config.requiredPermissions);
  }

  // Vérifier toutes les permissions (AND logic)
  if (config.requireAllPermissions && config.requireAllPermissions.length > 0) {
    return hasAllPermissions(config.requireAllPermissions);
  }

  // Par défaut, autoriser l'accès si aucune condition n'est spécifiée
  return true;
}

interface ConditionalRenderProps extends PropsWithChildren {
  /**
   * Code de permission à vérifier (supporte format backend can_* et frontend resource.action)
   */
  permission?: string;

  /**
   * Permissions à vérifier (OR logic) - au moins une doit être présente
   */
  anyPermissions?: string[];

  /**
   * Permissions à vérifier (AND logic) - toutes doivent être présentes
   */
  allPermissions?: string[];

  /**
   * Contenu à afficher si la permission n'est pas accordée
   */
  fallback?: React.ReactNode;

  /**
   * Afficher un message d'accès refusé si l'utilisateur n'a pas la permission
   */
  showMessage?: boolean;

  /**
   * Si true, seulement les admins peuvent voir ce contenu
   */
  adminOnly?: boolean;
}

/**
 * Composant pour afficher conditionnellement du contenu basé sur les permissions
 *
 * @example
 * ```tsx
 * // Permission unique
 * <Can permission="employee.view">
 *   <EmployeeList />
 * </Can>
 *
 * // Format backend supporté
 * <Can permission="can_view_employee">
 *   <EmployeeList />
 * </Can>
 *
 * // Au moins une permission (OR)
 * <Can anyPermissions={["employee.view", "employee.manage"]}>
 *   <EmployeeList />
 * </Can>
 *
 * // Toutes les permissions (AND)
 * <Can allPermissions={["employee.view", "department.view"]}>
 *   <EmployeeList />
 * </Can>
 *
 * // Admin seulement
 * <Can adminOnly>
 *   <AdminPanel />
 * </Can>
 *
 * // Avec message d'erreur
 * <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES} showMessage={true}>
 *   <RolesList />
 * </Can>
 * ```
 */
export function Can({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  showMessage = false,
  adminOnly = false
}: ConditionalRenderProps) {
  const { hasPermission, permissionContext, isLoading } = usePermissionContext();
  const router = useRouter();

  // Pendant le chargement, ne rien afficher
  if (isLoading) {
    return null;
  }

  let hasAccess = true;

  // Vérifier si admin seulement
  if (adminOnly) {
    hasAccess = permissionContext?.isAdmin || permissionContext?.isSuperuser || false;
  }
  // Vérifier une permission unique
  else if (permission) {
    const normalizedPerm = convertBackendPermissionToFrontend(permission);
    hasAccess = hasPermission(normalizedPerm);
  }
  // Vérifier au moins une permission (OR)
  else if (anyPermissions && anyPermissions.length > 0) {
    const normalizedPerms = anyPermissions.map(convertBackendPermissionToFrontend);
    hasAccess = normalizedPerms.some((perm) => hasPermission(perm));
  }
  // Vérifier toutes les permissions (AND)
  else if (allPermissions && allPermissions.length > 0) {
    const normalizedPerms = allPermissions.map(convertBackendPermissionToFrontend);
    hasAccess = normalizedPerms.every((perm) => hasPermission(perm));
  }

  if (!hasAccess) {
    // Afficher le fallback personnalisé
    if (fallback) {
      return <>{fallback}</>;
    }

    // Afficher un message d'accès refusé
    if (showMessage) {
      return (
        <div className="max-w-2xl mx-auto mt-8">
          <Alert variant="error" className="border-red-200 bg-red-50">
            <HiOutlineShieldExclamation className="h-5 w-5 text-red-600" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Accès refusé</h3>
              <div className="mt-2 text-sm text-red-700">
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Retour
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      );
    }

    // Sinon, ne rien afficher
    return null;
  }

  return <>{children}</>;
}

/**
 * Composant pour masquer du contenu si l'utilisateur a la permission
 */
export function Cannot({ children, permission, fallback = null }: ConditionalRenderProps) {
  const { hasPermission } = usePermissionContext();

  const cannotAccess = permission ? !hasPermission(permission) : false;

  if (!cannotAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
