/**
 * Configuration des permissions requises pour chaque route
 */

import type { RouteProtectionConfig } from '@/lib/types/shared';
import { ResourceType, PermissionAction, COMMON_PERMISSIONS } from '@/lib/types/shared';

/**
 * Permissions pour les routes HR
 */
export const HR_ROUTE_PERMISSIONS: Record<string, RouteProtectionConfig> = {
  // Dashboard HR
  '/hr': {
    requiredPermissions: [
      { resource: ResourceType.EMPLOYEE, action: PermissionAction.VIEW },
      { resource: ResourceType.DEPARTMENT, action: PermissionAction.VIEW },
    ],
    deniedMessage: "Vous n'avez pas accès au module RH de cette organisation.",
    redirectTo: '/apps',
  },

  // Employees
  '/hr/employees': {
    requiredPermissions: [
      { resource: ResourceType.EMPLOYEE, action: PermissionAction.VIEW },
    ],
    deniedMessage: "Vous n'avez pas la permission de consulter la liste des employés.",
  },

  '/hr/employees/create': {
    requiredPermissions: [
      { resource: ResourceType.EMPLOYEE, action: PermissionAction.CREATE },
    ],
    deniedMessage: "Vous n'avez pas la permission de créer des employés.",
    redirectTo: '../',
  },

  '/hr/employees/[id]': {
    requiredPermissions: [
      { resource: ResourceType.EMPLOYEE, action: PermissionAction.VIEW },
    ],
    deniedMessage: "Vous n'avez pas la permission de consulter les détails d'un employé.",
  },

  '/hr/employees/[id]/edit': {
    requiredPermissions: [
      { resource: ResourceType.EMPLOYEE, action: PermissionAction.UPDATE },
    ],
    deniedMessage: "Vous n'avez pas la permission de modifier un employé.",
    redirectTo: '../',
  },

  // Departments
  '/hr/departments': {
    requiredPermissions: [
      { resource: ResourceType.DEPARTMENT, action: PermissionAction.VIEW },
    ],
    deniedMessage: "Vous n'avez pas la permission de consulter les départements.",
  },

  '/hr/departments/create': {
    requiredPermissions: [
      { resource: ResourceType.DEPARTMENT, action: PermissionAction.CREATE },
    ],
    deniedMessage: "Vous n'avez pas la permission de créer des départements.",
    redirectTo: '../',
  },

  '/hr/departments/[id]/edit': {
    requiredPermissions: [
      { resource: ResourceType.DEPARTMENT, action: PermissionAction.UPDATE },
    ],
    deniedMessage: "Vous n'avez pas la permission de modifier un département.",
    redirectTo: '../',
  },

  // Roles
  '/hr/roles': {
    requiredPermissions: [
      { resource: ResourceType.ROLE, action: PermissionAction.VIEW },
    ],
    deniedMessage: "Vous n'avez pas la permission de consulter les rôles.",
  },

  '/hr/roles/create': {
    requiredPermissions: [
      { resource: ResourceType.ROLE, action: PermissionAction.CREATE },
    ],
    deniedMessage: "Vous n'avez pas la permission de créer des rôles.",
    redirectTo: '../',
  },

  '/hr/roles/[id]/edit': {
    requiredPermissions: [
      { resource: ResourceType.ROLE, action: PermissionAction.UPDATE },
    ],
    deniedMessage: "Vous n'avez pas la permission de modifier un rôle.",
    redirectTo: '../',
  },

  // Leave Requests
  '/hr/leaves': {
    requiredPermissions: [
      { resource: ResourceType.LEAVE_REQUEST, action: PermissionAction.VIEW },
    ],
    deniedMessage: "Vous n'avez pas la permission de consulter les demandes de congés.",
  },

  '/hr/leaves/create': {
    requiredPermissions: [
      { resource: ResourceType.LEAVE_REQUEST, action: PermissionAction.CREATE },
    ],
    deniedMessage: "Vous n'avez pas la permission de créer une demande de congé.",
    redirectTo: '../',
  },

  // Payroll
  '/hr/payroll': {
    requiredPermissions: [
      { resource: ResourceType.PAYROLL, action: PermissionAction.VIEW },
    ],
    deniedMessage: "Vous n'avez pas la permission de consulter les fiches de paie.",
  },

  // Contracts
  '/hr/contracts': {
    requiredPermissions: [
      { resource: ResourceType.CONTRACT, action: PermissionAction.VIEW },
    ],
    deniedMessage: "Vous n'avez pas la permission de consulter les contrats.",
  },

  '/hr/contracts/create': {
    requiredPermissions: [
      { resource: ResourceType.CONTRACT, action: PermissionAction.CREATE },
    ],
    deniedMessage: "Vous n'avez pas la permission de créer des contrats.",
    redirectTo: '../',
  },

  '/hr/contracts/:id': {
    requiredPermissions: [
      { resource: ResourceType.CONTRACT, action: PermissionAction.VIEW },
    ],
    deniedMessage: "Vous n'avez pas la permission de consulter les détails d'un contrat.",
  },

  '/hr/contracts/:id/edit': {
    requiredPermissions: [
      { resource: ResourceType.CONTRACT, action: PermissionAction.UPDATE },
    ],
    deniedMessage: "Vous n'avez pas la permission de modifier un contrat.",
    redirectTo: '../',
  },
};

/**
 * Helper pour obtenir la configuration de permission pour une route
 */
export function getRoutePermission(pathname: string): RouteProtectionConfig | null {
  // Normaliser le pathname
  const normalizedPath = pathname.replace(/^\/apps\/[^/]+/, '');

  // Chercher une correspondance exacte
  if (HR_ROUTE_PERMISSIONS[normalizedPath]) {
    return HR_ROUTE_PERMISSIONS[normalizedPath];
  }

  // Chercher une correspondance avec des paramètres dynamiques
  for (const [route, config] of Object.entries(HR_ROUTE_PERMISSIONS)) {
    if (matchDynamicRoute(normalizedPath, route)) {
      return config;
    }
  }

  return null;
}

/**
 * Vérifie si un pathname correspond à une route avec des paramètres dynamiques
 */
function matchDynamicRoute(pathname: string, route: string): boolean {
  const pathnameSegments = pathname.split('/').filter(Boolean);
  const routeSegments = route.split('/').filter(Boolean);

  if (pathnameSegments.length !== routeSegments.length) {
    return false;
  }

  return routeSegments.every((segment, index) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      return true; // Paramètre dynamique
    }
    return segment === pathnameSegments[index];
  });
}
