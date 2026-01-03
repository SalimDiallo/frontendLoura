/**
 * Context Provider pour les permissions au niveau de l'organisation
 */

'use client';

import { createContext, useContext, useEffect, useState, PropsWithChildren, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { UserPermissionContext, PermissionCheck } from '@/lib/types/shared';
import { useAuthStore, usePermissionsStore } from '@/lib/store';
import type { AdminUser } from '@/lib/types/core';
import type { Employee } from '@/lib/types/hr';

/**
 * Convertit une permission backend (can_view_employee) vers format frontend (employee.view)
 * Format backend: can_{action}_{resource}
 * Format frontend: {resource}.{action}
 */
export function convertBackendPermissionToFrontend(backendCode: string): string {
  // Si déjà au bon format, retourner tel quel - NON, on vérifie d'abord le mapping
  // if (!backendCode.startsWith('can_')) {
  //   return backendCode;
  // }

  // Mapping des permissions backend -> frontend
  const mapping: Record<string, string> = {
    // Legacy (can_*)
    'can_view_employee': 'employee.view',
    'can_create_employee': 'employee.create',
    'can_update_employee': 'employee.update',
    'can_delete_employee': 'employee.delete',
    'can_activate_employee': 'employee.activate',
    'can_manage_employee_permissions': 'employee.manage_permissions',

    'can_view_department': 'department.view',
    'can_create_department': 'department.create',
    'can_update_department': 'department.update',
    'can_delete_department': 'department.delete',

    'can_view_role': 'role.view',
    'can_create_role': 'role.create',
    'can_update_role': 'role.update',
    'can_assign_role': 'role.assign',

    'can_view_contract': 'contract.view',
    'can_create_contract': 'contract.create',
    'can_update_contract': 'contract.update',
    'can_delete_contract': 'contract.delete',

    'can_view_leave': 'leave_request.view',
    'can_create_leave': 'leave_request.create',
    'can_update_leave': 'leave_request.update',
    'can_delete_leave': 'leave_request.delete',
    'can_approve_leave': 'leave_request.approve',

    'can_view_payroll': 'payroll.view',
    'can_create_payroll': 'payroll.create',
    'can_update_payroll': 'payroll.update',
    'can_delete_payroll': 'payroll.delete',
    'can_process_payroll': 'payroll.process',

    'can_view_attendance': 'attendance.view',
    'can_view_all_attendance': 'attendance.view_all',
    'can_create_attendance': 'attendance.create',
    'can_update_attendance': 'attendance.update',
    'can_delete_attendance': 'attendance.delete',
    'can_approve_attendance': 'attendance.approve',
    'can_manual_checkin': 'attendance.manual_checkin',
    'can_create_qr_session': 'attendance.create_qr_session',

    // HR App (hr.*)
    'hr.view_employees': 'employee.view',
    'hr.create_employees': 'employee.create',
    'hr.update_employees': 'employee.update',
    'hr.delete_employees': 'employee.delete',
    'hr.manage_employee_permissions': 'employee.manage_permissions',

    'hr.view_departments': 'department.view',
    'hr.create_departments': 'department.create',
    'hr.update_departments': 'department.update',
    'hr.delete_departments': 'department.delete',

    'hr.view_positions': 'position.view',
    'hr.create_positions': 'position.create',
    'hr.update_positions': 'position.update',
    'hr.delete_positions': 'position.delete',

    'hr.view_roles': 'role.view',
    'hr.create_roles': 'role.create',
    'hr.update_roles': 'role.update',
    'hr.delete_roles': 'role.delete',

    'hr.view_contracts': 'contract.view',
    'hr.create_contracts': 'contract.create',
    'hr.update_contracts': 'contract.update',
    'hr.delete_contracts': 'contract.delete',

    'hr.view_leave_requests': 'leave_request.view',
    'hr.create_leave_requests': 'leave_request.create',
    'hr.approve_leave_requests': 'leave_request.approve',

    'hr.view_payroll': 'payroll.view',
    'hr.create_payroll': 'payroll.create',
    'hr.update_payroll': 'payroll.update',
    'hr.export_payroll': 'payroll.export',

    'hr.view_attendance': 'attendance.view',
    'hr.view_all_attendance': 'attendance.view_all',
    'hr.create_attendance': 'attendance.create',
    'hr.update_attendance': 'attendance.update',
    'hr.delete_attendance': 'attendance.delete',
    'hr.approve_attendance': 'attendance.approve',
    'hr.manual_checkin': 'attendance.manual_checkin',
    'hr.create_qr_session': 'attendance.create_qr_session',

    // Inventory App (inventory.*) - Products
    'inventory.view_product': 'product.view',
    'inventory.create_product': 'product.create',
    'inventory.update_product': 'product.update',
    'inventory.delete_product': 'product.delete',

    // Inventory App (inventory.*) - Categories
    'inventory.view_category': 'category.view',
    'inventory.create_category': 'category.create',
    'inventory.update_category': 'category.update',
    'inventory.delete_category': 'category.delete',

    // Inventory App (inventory.*) - Stock
    'inventory.view_stock': 'stock.view',
    'inventory.manage_stock': 'stock.manage',
    'inventory.adjust_stock': 'stock.adjust',

    // Inventory App (inventory.*) - Warehouses
    'inventory.view_warehouse': 'warehouse.view',
    'inventory.create_warehouse': 'warehouse.create',
    'inventory.update_warehouse': 'warehouse.update',
    'inventory.delete_warehouse': 'warehouse.delete',

    // Inventory App (inventory.*) - Suppliers
    'inventory.view_supplier': 'supplier.view',
    'inventory.create_supplier': 'supplier.create',
    'inventory.update_supplier': 'supplier.update',
    'inventory.delete_supplier': 'supplier.delete',

    // Inventory App (inventory.*) - Sales
    'inventory.view_sale': 'sale.view',
    'inventory.create_sale': 'sale.create',
    'inventory.update_sale': 'sale.update',
    'inventory.delete_sale': 'sale.delete',

    // Inventory App (inventory.*) - Orders
    'inventory.view_order': 'order.view',
    'inventory.create_order': 'order.create',
    'inventory.update_order': 'order.update',
    'inventory.delete_order': 'order.delete',
  };

  // Retourner la permission mappée ou garder le code original
  return mapping[backendCode] || backendCode;
}

interface PermissionContextValue {
  permissionContext: UserPermissionContext | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionChecks: PermissionCheck[]) => boolean;
  hasAllPermissions: (permissionChecks: PermissionCheck[]) => boolean;
  can: (resource: string, action: string) => boolean;
  cannot: (resource: string, action: string) => boolean;
  refetch: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

interface PermissionProviderProps extends PropsWithChildren {
  organizationSlug?: string;
}

/**
 * Provider pour les permissions de l'organisation
 * À placer dans le layout de l'organisation
 */
export function PermissionProvider({ children, organizationSlug: propSlug }: PermissionProviderProps) {
  const params = useParams();
  const slug = propSlug || (params?.slug as string);

  const [permissionContext, setPermissionContext] = useState<UserPermissionContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Charge les permissions de l'utilisateur pour cette organisation
   */
  const fetchPermissions = useCallback(async () => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Récupérer l'utilisateur depuis le store Zustand
      const user = useAuthStore.getState().user;
      const userType = useAuthStore.getState().userType;

      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      let userId: string;
      let permissionCodes: string[] = [];

      if (userType === 'employee') {
        // Cas: Employé
        const employee = user as Employee;
        userId = employee.id;

        // Récupérer les permissions depuis le store Zustand
        const permissionsFromStore = usePermissionsStore.getState().permissions;
        const backendPermissions = permissionsFromStore.map(p => p.code);

        // Convertir les permissions du backend (can_view_employee)
        // vers le format frontend (employee.view)
        permissionCodes = backendPermissions.map(code => convertBackendPermissionToFrontend(code));
      } else {
        // Cas: AdminUser
        const adminUser = user as AdminUser;
        userId = adminUser.id;

        // Les AdminUser ont toutes les permissions
        // TODO: Implémenter la logique des permissions pour AdminUser si nécessaire
        permissionCodes = [
          'employee.view',
          'employee.create',
          'employee.update',
          'employee.delete',
          'department.view',
          'department.create',
          'department.update',
          'department.delete',
          'role.view',
          'role.create',
          'role.update',
          'role.delete',
          'leave_request.view',
          'leave_request.create',
          'leave_request.approve',
          'payroll.view',
          'payroll.create',
          // Attendance permissions for AdminUser
          'attendance.view',
          'attendance.view_all',
          'attendance.create',
          'attendance.update',
          'attendance.delete',
          'attendance.approve',
          'attendance.manual_checkin',
          'attendance.create_qr_session',
        ];
      }

      const mockContext: UserPermissionContext = {
        userId,
        organizationId: slug,
        permissions: usePermissionsStore.getState().permissions,
        permissionCodes,
        isAdmin: userType === 'admin',
        isSuperuser: userType === 'admin',
      };

      setPermissionContext(mockContext);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des permissions';
      setError(message);
      console.error('Error fetching permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  // S'assurer que le composant est monté côté client pour éviter les erreurs d'hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Souscrire aux changements du store Zustand
  useEffect(() => {
    if (!isMounted) return;

    // Charger les permissions initiales
    fetchPermissions();

    // S'abonner aux changements du store pour rafraîchir automatiquement
    const unsubscribeAuth = useAuthStore.subscribe(() => {
      fetchPermissions();
    });

    const unsubscribePermissions = usePermissionsStore.subscribe(() => {
      fetchPermissions();
    });

    return () => {
      unsubscribeAuth();
      unsubscribePermissions();
    };
  }, [isMounted, fetchPermissions]);

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  const hasPermission = useCallback(
    (permissionCode: string): boolean => {
      if (!permissionContext) return false;
      if (permissionContext.isSuperuser) return true;
      return permissionContext.permissionCodes.includes(permissionCode);
    },
    [permissionContext]
  );

  /**
   * Vérifie si l'utilisateur a au moins une des permissions (OR logic)
   */
  const hasAnyPermission = useCallback(
    (permissionChecks: PermissionCheck[]): boolean => {
      if (!permissionContext) return false;
      if (permissionContext.isSuperuser) return true;

      return permissionChecks.some((check) => {
        const code = `${check.resource}.${check.action}`;
        return permissionContext.permissionCodes.includes(code);
      });
    },
    [permissionContext]
  );

  /**
   * Vérifie si l'utilisateur a toutes les permissions (AND logic)
   */
  const hasAllPermissions = useCallback(
    (permissionChecks: PermissionCheck[]): boolean => {
      if (!permissionContext) return false;
      if (permissionContext.isSuperuser) return true;

      return permissionChecks.every((check) => {
        const code = `${check.resource}.${check.action}`;
        return permissionContext.permissionCodes.includes(code);
      });
    },
    [permissionContext]
  );

  /**
   * Vérifie si l'utilisateur peut effectuer une action sur une ressource
   */
  const can = useCallback(
    (resource: string, action: string): boolean => {
      const code = `${resource}.${action}`;
      return hasPermission(code);
    },
    [hasPermission]
  );

  /**
   * Vérifie si l'utilisateur ne peut pas effectuer une action
   */
  const cannot = useCallback(
    (resource: string, action: string): boolean => {
      return !can(resource, action);
    },
    [can]
  );

  const value: PermissionContextValue = {
    permissionContext,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    cannot,
    refetch: fetchPermissions,
  };

  // Ne rien rendre côté serveur pour éviter les erreurs d'hydration
  if (!isMounted) {
    return null;
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte des permissions
 */
export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
}
