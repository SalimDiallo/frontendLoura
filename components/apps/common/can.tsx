/**
 * Composant Can - Gestion conditionnelle de l'affichage basée sur les permissions
 * 
 * Ce composant permet d'afficher ou masquer du contenu en fonction des permissions
 * de l'utilisateur connecté. Il supporte plusieurs modes de vérification et 
 * propose des options de rendu flexibles.
 * 
 * @example
 * // Permission unique
 * <Can permission="employee.view">
 *   <EmployeeList />
 * </Can>
 * 
 * // Avec constantes (recommandé)
 * <Can permission={P.HR.VIEW_EMPLOYEES}>
 *   <EmployeeList />
 * </Can>
 * 
 * // Au moins une permission (OR)
 * <Can anyOf={[P.HR.VIEW_EMPLOYEES, P.HR.MANAGE_EMPLOYEES]}>
 *   <EmployeeList />
 * </Can>
 * 
 * // Toutes les permissions (AND)
 * <Can allOf={[P.HR.VIEW_EMPLOYEES, P.HR.VIEW_DEPARTMENTS]}>
 *   <Dashboard />
 * </Can>
 */

'use client';

import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  HiOutlineArrowLeft,
  HiOutlineExclamationTriangle,
  HiOutlineLockClosed,
  HiOutlineShieldExclamation,
} from 'react-icons/hi2';
import { usePermissionContext } from './permission-provider';

// ============================================================================
// TYPES
// ============================================================================

export interface CanProps {
  children: React.ReactNode;
  
  /**
   * Permission unique à vérifier
   */
  permission?: string;
  
  /**
   * Au moins une de ces permissions doit être présente (OR)
   */
  anyOf?: string[];
  
  /**
   * Toutes ces permissions doivent être présentes (AND)
   */
  allOf?: string[];
  
  /**
   * Si true, seuls les admins peuvent accéder
   */
  adminOnly?: boolean;
  
  /**
   * Contenu alternatif si l'accès est refusé
   */
  fallback?: React.ReactNode;
  
  /**
   * Style du message d'accès refusé
   */
  deniedStyle?: 'none' | 'minimal' | 'card' | 'fullpage';
  
  /**
   * Message personnalisé d'accès refusé
   */
  deniedMessage?: string;
  
  /**
   * Afficher un bouton de retour
   */
  showBackButton?: boolean;
  
  /**
   * Si true, désactive le contenu au lieu de le masquer
   */
  disableInstead?: boolean;
  
  /**
   * Classes CSS additionnelles pour le wrapper
   */
  className?: string;
  
  /**
   * Inverser la logique (Cannot)
   */
  invert?: boolean;
}

// ============================================================================
// PERMISSION NORMALIZER
// ============================================================================


// ============================================================================
// DENIED VIEWS
// ============================================================================

interface DeniedViewProps {
  message?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

/**
 * Vue minimale d'accès refusé (inline)
 */
function DeniedMinimal({ message }: DeniedViewProps) {
  return (
    <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/70">
      <HiOutlineLockClosed className="size-4" />
      <span>{message || "Accès restreint"}</span>
    </div>
  );
}

/**
 * Vue carte d'accès refusé
 */
function DeniedCard({ message, showBackButton, onBack }: DeniedViewProps) {
  return (
    <div className="rounded-xl border border-amber-200/50 bg-linear-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 dark:border-amber-800/30 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
          <HiOutlineExclamationTriangle className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Accès restreint
          </h4>
          <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-300/70">
            {message || "Vous n'avez pas les permissions nécessaires pour accéder à ce contenu."}
          </p>
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
            >
              <HiOutlineArrowLeft className="size-4" />
              Retour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Vue pleine page d'accès refusé
 */
function DeniedFullpage({ message, showBackButton, onBack }: DeniedViewProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/20">
          <HiOutlineShieldExclamation className="size-10 text-red-500 dark:text-red-400" />
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground">
          Accès refusé
        </h2>
        
        {/* Message */}
        <p className="mt-2 text-muted-foreground">
          {message || "Vous n'avez pas les permissions nécessaires pour accéder à cette page."}
        </p>
        
        {/* Actions */}
        {showBackButton && onBack && (
          <div className="mt-6">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <HiOutlineArrowLeft className="size-4" />
              Retour à la page précédente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Composant Can - Affichage conditionnel basé sur les permissions
 */
export function Can({
  children,
  permission,
  anyOf,
  allOf,
  adminOnly = false,
  fallback,
  deniedStyle = 'none',
  deniedMessage,
  showBackButton = false,
  disableInstead = false,
  className,
  invert = false,
}: CanProps) {
  const router = useRouter();
  const { hasPermission, isAdmin, isLoading } = usePermissionContext();

  // Pendant le chargement
  if (isLoading) {
    return null;
  }

  // Calculer l'accès
  let hasAccess = true;

  if (adminOnly) {
    // Vérifier si admin
    hasAccess = isAdmin;
  } else if (permission) {
    // Permission unique
    hasAccess = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    // Au moins une permission (OR)
    hasAccess = anyOf.some((perm) => hasPermission(perm));
  } else if (allOf && allOf.length > 0) {
    // Toutes les permissions (AND)
    hasAccess = allOf.every((perm) => hasPermission(perm));
  }

  // Inverser si demandé (Cannot)
  if (invert) {
    hasAccess = !hasAccess;
  }

  // Si accès accordé
  if (hasAccess) {
    return <>{children}</>;
  }

  // Si on désactive au lieu de masquer
  if (disableInstead) {
    return (
      <div className={cn("opacity-50 pointer-events-none select-none", className)}>
        {children}
      </div>
    );
  }

  // Fallback personnalisé
  if (fallback) {
    return <>{fallback}</>;
  }

  // Styles d'accès refusé
  const handleBack = () => router.back();

  switch (deniedStyle) {
    case 'minimal':
      return <DeniedMinimal message={deniedMessage} />;
    case 'card':
      return (
        <DeniedCard
          message={deniedMessage}
          showBackButton={showBackButton}
          onBack={handleBack}
        />
      );
    case 'fullpage':
      return (
        <DeniedFullpage
          message={deniedMessage}
          showBackButton={showBackButton}
          onBack={handleBack}
        />
      );
    default:
      return null;
  }
}

/**
 * Alias pour Cannot (inverser la logique de Can)
 */
export function Cannot(props: Omit<CanProps, 'invert'>) {
  return <Can {...props} invert />;
}

// ============================================================================
// HOOK UTILITAIRE
// ============================================================================

/**
 * Hook pour vérifier les permissions de manière programmatique
 */
export function useCanAccess() {
  const { hasPermission, isAdmin: isAdminUser, isLoading } = usePermissionContext();

  const can = (permission: string): boolean => {
    if (isLoading) return false;
    return hasPermission(permission);
  };

  const canAny = (permissions: string[]): boolean => {
    if (isLoading) return false;
    return permissions.some((p) => hasPermission(p));
  };

  const canAll = (permissions: string[]): boolean => {
    if (isLoading) return false;
    return permissions.every((p) => hasPermission(p));
  };

  const isAdmin = (): boolean => {
    return isAdminUser;
  };

  return {
    can,
    canAny,
    canAll,
    isAdmin,
    isLoading,
  };
}

// ============================================================================
// PERMISSION CONSTANTS (Raccourcis)
// ============================================================================

/**
 * Raccourcis pour les permissions courantes
 * Usage: <Can permission={P.EMPLOYEES.VIEW}>...</Can>
 */
export const P = {
  // Employees
  EMPLOYEES: {
    VIEW: 'employee.view',
    CREATE: 'employee.create',
    UPDATE: 'employee.update',
    DELETE: 'employee.delete',
    MANAGE: 'employee.manage',
    MANAGE_PERMISSIONS: 'employee.manage_permissions',
  },
  // Departments
  DEPARTMENTS: {
    VIEW: 'department.view',
    CREATE: 'department.create',
    UPDATE: 'department.update',
    DELETE: 'department.delete',
  },
  // Roles
  ROLES: {
    VIEW: 'role.view',
    CREATE: 'role.create',
    UPDATE: 'role.update',
    DELETE: 'role.delete',
    ASSIGN: 'role.assign',
  },
  // Contracts
  CONTRACTS: {
    VIEW: 'contract.view',
    CREATE: 'contract.create',
    UPDATE: 'contract.update',
    DELETE: 'contract.delete',
  },
  // Leave Requests
  LEAVES: {
    VIEW: 'leave_request.view',
    CREATE: 'leave_request.create',
    UPDATE: 'leave_request.update',
    DELETE: 'leave_request.delete',
    APPROVE: 'leave_request.approve',
  },
  // Payroll
  PAYROLL: {
    VIEW: 'payroll.view',
    CREATE: 'payroll.create',
    UPDATE: 'payroll.update',
    DELETE: 'payroll.delete',
    PROCESS: 'payroll.process',
    EXPORT: 'payroll.export',
  },
  // Attendance
  ATTENDANCE: {
    VIEW: 'attendance.view',
    VIEW_ALL: 'attendance.view_all',
    CREATE: 'attendance.create',
    UPDATE: 'attendance.update',
    DELETE: 'attendance.delete',
    APPROVE: 'attendance.approve',
    MANUAL_CHECKIN: 'attendance.manual_checkin',
    CREATE_QR_SESSION: 'attendance.create_qr_session',
  },
} as const;
