/**
 * Composants pour protéger les routes et le contenu avec des permissions
 * Version simplifiée utilisant directement les codes du backend
 */

'use client';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import React, { PropsWithChildren } from 'react';
import { HiOutlineShieldExclamation } from 'react-icons/hi2';
import { usePermissionContext } from './permission-provider';
import { useModules } from '@/lib/contexts';

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
  /** Code de module unique requis (ex: 'hr.payroll', 'inventory.products') */
  requiredModule?: string;
  /** Modules requis (AND logic) - tous doivent être actifs */
  requiredModules?: string[];
  /** Modules requis (OR logic) - au moins un doit être actif */
  anyRequiredModules?: string[];
  /** Contenu à afficher si la permission n'est pas accordée */
  fallback?: React.ReactNode;
  /** Afficher un message d'accès refusé */
  showMessage?: boolean;
  /** Si true, seulement les admins peuvent voir ce contenu */
  adminOnly?: boolean;
}

/**
 * Composant pour afficher conditionnellement du contenu basé sur les permissions ET les modules actifs
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
 * // Module requis
 * <Can requiredModule="hr.payroll">
 *   <PayrollSection />
 * </Can>
 *
 * // Permission ET module
 * <Can permission={PERMISSIONS.HR.VIEW_PAYROLL} requiredModule="hr.payroll">
 *   <PayrollDetails />
 * </Can>
 *
 * // Au moins un module (OR)
 * <Can anyRequiredModules={["inventory.products", "inventory.sales"]}>
 *   <InventoryDashboard />
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
  requiredModule,
  requiredModules,
  anyRequiredModules,
  fallback = null,
  showMessage = false,
  adminOnly = false,
}: CanProps) {
  const router = useRouter();
  const { hasPermission, isAdmin, isLoading: permissionsLoading } = usePermissionContext();
  const { isModuleActive, loading: modulesLoading } = useModules();

  // Pendant le chargement, ne rien afficher
  if (permissionsLoading || modulesLoading) {
    return null;
  }

  let hasPermissionAccess = true;
  let hasModuleAccess = true;

  // ===== VÉRIFICATION DES PERMISSIONS =====

  // Vérifier si admin seulement
  if (adminOnly) {
    hasPermissionAccess = isAdmin;
  }
  // Vérifier une permission unique
  else if (permission) {
    hasPermissionAccess = isAdmin || hasPermission(permission);
  }
  // Vérifier au moins une permission (OR)
  else if (anyPermissions && anyPermissions.length > 0) {
    hasPermissionAccess = isAdmin || anyPermissions.some((perm) => hasPermission(perm));
  }
  // Vérifier toutes les permissions (AND)
  else if (allPermissions && allPermissions.length > 0) {
    hasPermissionAccess = isAdmin || allPermissions.every((perm) => hasPermission(perm));
  }

  // ===== VÉRIFICATION DES MODULES =====

  // Vérifier un module unique requis
  if (requiredModule) {
    hasModuleAccess = isModuleActive(requiredModule);
  }
  // Vérifier tous les modules requis (AND)
  else if (requiredModules && requiredModules.length > 0) {
    hasModuleAccess = requiredModules.every((mod) => isModuleActive(mod));
  }
  // Vérifier au moins un module requis (OR)
  else if (anyRequiredModules && anyRequiredModules.length > 0) {
    hasModuleAccess = anyRequiredModules.some((mod) => isModuleActive(mod));
  }

  // L'accès est accordé seulement si PERMISSIONS ET MODULES sont OK
  const hasAccess = hasPermissionAccess && hasModuleAccess;

  if (!hasAccess) {
    // Afficher le fallback personnalisé
    if (fallback) {
      return <>{fallback}</>;
    }

    // Afficher un message d'accès refusé
    if (showMessage) {
      // Déterminer le message en fonction de la raison du refus
      let denialReason = "Vous n'avez pas les autorisations nécessaires pour accéder à cette section.";

      if (!hasModuleAccess && hasPermissionAccess) {
        denialReason = "Cette fonctionnalité n'est pas disponible. Le module requis n'est pas activé pour votre organisation.";
      } else if (hasModuleAccess && !hasPermissionAccess) {
        denialReason = "Vous n'avez pas les permissions nécessaires pour accéder à cette section.";
      } else if (!hasModuleAccess && !hasPermissionAccess) {
        denialReason = "Accès refusé : module non activé et permissions insuffisantes.";
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full bg-background">
          <div className="flex flex-col items-center border border-neutral-200 shadow-md rounded-lg px-8 py-12 max-w-md">
            <div className="mb-5 flex items-center justify-center">
              <HiOutlineShieldExclamation className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Accès refusé</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              {denialReason}
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              className="border-neutral-200 text-foreground hover:bg-muted transition-shadow"
            >
              Retour
            </Button>
          </div>
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

  const cannotAccess = permission ? !hasPermission(permission) : false;

  if (!cannotAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

