/**
 * Composants pour protéger les routes et le contenu avec des permissions
 * Version simplifiée utilisant directement les codes du backend
 */

'use client';

import React, { PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissionContext } from './permission-provider';
import { normalizePermissionCode, PERMISSIONS } from '@/lib/constants/permissions';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { HiOutlineShieldExclamation } from 'react-icons/hi2';

// ============================================
// Types
// ============================================

interface RouteProtectionConfig {
  /** Permissions requises (OR logic - au moins une) */
  requiredPermissions?: string[];
  /** Toutes ces permissions sont requises (AND logic) */
  requireAllPermissions?: string[];
  /** Message d'erreur personnalisé */
  deniedMessage?: string;
  /** Redirection si accès refusé */
  redirectTo?: string;
}

interface ProtectedRouteProps extends PropsWithChildren {
  config: RouteProtectionConfig;
  fallback?: React.ReactNode;
}

// ============================================
// ProtectedRoute Component
// ============================================

/**
 * Composant pour protéger une route avec des permissions
 */
export function ProtectedRoute({ children, config, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isLoading } = usePermissionContext();

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Admin a toujours accès
  if (isAdmin) {
    return <>{children}</>;
  }

  // Vérifier les permissions requises (OR logic)
  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    const hasAccess = hasAnyPermission(config.requiredPermissions);
    if (!hasAccess) {
      return renderDenied(config, fallback, router);
    }
  }

  // Vérifier toutes les permissions (AND logic)
  if (config.requireAllPermissions && config.requireAllPermissions.length > 0) {
    const hasAccess = hasAllPermissions(config.requireAllPermissions);
    if (!hasAccess) {
      return renderDenied(config, fallback, router);
    }
  }

  return <>{children}</>;
}

function renderDenied(
  config: RouteProtectionConfig,
  fallback: React.ReactNode | undefined,
  router: ReturnType<typeof useRouter>
) {
  // Rediriger si configuré
  if (config.redirectTo) {
    router.push(config.redirectTo);
    return null;
  }

  // Afficher le fallback personnalisé
  if (fallback) {
    return <>{fallback}</>;
  }

  // Message par défaut
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

// ============================================
// Can Component
// ============================================

interface CanProps extends PropsWithChildren {
  /** Code de permission unique à vérifier */
  permission?: string;
  /** Permissions à vérifier (OR logic) - au moins une doit être présente */
  anyPermissions?: string[];
  /** Permissions à vérifier (AND logic) - toutes doivent être présentes */
  allPermissions?: string[];
  /** Contenu à afficher si la permission n'est pas accordée */
  fallback?: React.ReactNode;
  /** Afficher un message d'accès refusé */
  showMessage?: boolean;
  /** Si true, seulement les admins peuvent voir ce contenu */
  adminOnly?: boolean;
}

/**
 * Composant pour afficher conditionnellement du contenu basé sur les permissions
 *
 * @example
 * ```tsx
 * // Permission unique
 * <Can permission={PERMISSIONS.HR.VIEW_EMPLOYEES}>
 *   <EmployeeList />
 * </Can>
 *
 * // Au moins une permission (OR)
 * <Can anyPermissions={[PERMISSIONS.HR.VIEW_EMPLOYEES, PERMISSIONS.HR.VIEW_DEPARTMENTS]}>
 *   <Content />
 * </Can>
 *
 * // Toutes les permissions (AND)
 * <Can allPermissions={[PERMISSIONS.HR.VIEW_EMPLOYEES, PERMISSIONS.HR.UPDATE_EMPLOYEES]}>
 *   <EditButton />
 * </Can>
 *
 * // Admin seulement
 * <Can adminOnly>
 *   <AdminPanel />
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
  adminOnly = false,
}: CanProps) {
  const router = useRouter();
  const { hasPermission, isAdmin, isLoading } = usePermissionContext();

  // Pendant le chargement, ne rien afficher
  if (isLoading) {
    return null;
  }

  let hasAccess = true;

  // Vérifier si admin seulement
  if (adminOnly) {
    hasAccess = isAdmin;
  }
  // Vérifier une permission unique
  else if (permission) {
    const normalizedPerm = normalizePermissionCode(permission);
    hasAccess = isAdmin || hasPermission(normalizedPerm);
  }
  // Vérifier au moins une permission (OR)
  else if (anyPermissions && anyPermissions.length > 0) {
    const normalizedPerms = anyPermissions.map(normalizePermissionCode);
    hasAccess = isAdmin || normalizedPerms.some((perm) => hasPermission(perm));
  }
  // Vérifier toutes les permissions (AND)
  else if (allPermissions && allPermissions.length > 0) {
    const normalizedPerms = allPermissions.map(normalizePermissionCode);
    hasAccess = isAdmin || normalizedPerms.every((perm) => hasPermission(perm));
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
                Vous n'avez pas les permissions nécessaires.
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

// ============================================
// Cannot Component
// ============================================

/**
 * Composant inverse de Can - affiche le contenu si l'utilisateur N'A PAS la permission
 */
export function Cannot({ children, permission, fallback = null }: CanProps) {
  const { hasPermission, isAdmin } = usePermissionContext();

  // Admin a toujours la permission
  if (isAdmin) {
    return <>{fallback}</>;
  }

  const normalizedPerm = permission ? normalizePermissionCode(permission) : '';
  const cannotAccess = normalizedPerm ? !hasPermission(normalizedPerm) : false;

  if (!cannotAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ============================================
// Re-exports pour compatibilité
// ============================================

export { PERMISSIONS };
