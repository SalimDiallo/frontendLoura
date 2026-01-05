/**
 * Configuration des permissions requises pour chaque route
 * Utilise directement les codes de permissions du backend
 */

import { PERMISSIONS } from '@/lib/constants/permissions';

/**
 * Configuration de protection de route
 */
export interface RouteProtectionConfig {
  /** Permissions requises (OR logic - au moins une) */
  requiredPermissions?: string[];
  /** Toutes ces permissions sont requises (AND logic) */
  requireAllPermissions?: string[];
  /** Message d'erreur personnalisé */
  deniedMessage?: string;
  /** Redirection si accès refusé */
  redirectTo?: string;
}

/**
 * Permissions pour les routes HR
 */
export const HR_ROUTE_PERMISSIONS: Record<string, RouteProtectionConfig> = {
  // Dashboard HR
  '/hr': {
    requiredPermissions: [
      PERMISSIONS.HR.VIEW_EMPLOYEES,
      PERMISSIONS.HR.VIEW_DEPARTMENTS,
    ],
    deniedMessage: "Vous n'avez pas accès au module RH de cette organisation.",
    redirectTo: '/apps',
  },

  // Employees
  '/hr/employees': {
    requiredPermissions: [PERMISSIONS.HR.VIEW_EMPLOYEES],
    deniedMessage: "Vous n'avez pas la permission de consulter la liste des employés.",
  },

  '/hr/employees/create': {
    requiredPermissions: [PERMISSIONS.HR.CREATE_EMPLOYEES],
    deniedMessage: "Vous n'avez pas la permission de créer des employés.",
    redirectTo: '../',
  },

  '/hr/employees/[id]': {
    requiredPermissions: [PERMISSIONS.HR.VIEW_EMPLOYEES],
    deniedMessage: "Vous n'avez pas la permission de consulter les détails d'un employé.",
  },

  '/hr/employees/[id]/edit': {
    requiredPermissions: [PERMISSIONS.HR.UPDATE_EMPLOYEES],
    deniedMessage: "Vous n'avez pas la permission de modifier un employé.",
    redirectTo: '../',
  },

  // Departments
  '/hr/departments': {
    requiredPermissions: [PERMISSIONS.HR.VIEW_DEPARTMENTS],
    deniedMessage: "Vous n'avez pas la permission de consulter les départements.",
  },

  '/hr/departments/create': {
    requiredPermissions: [PERMISSIONS.HR.CREATE_DEPARTMENTS],
    deniedMessage: "Vous n'avez pas la permission de créer des départements.",
    redirectTo: '../',
  },

  '/hr/departments/[id]/edit': {
    requiredPermissions: [PERMISSIONS.HR.UPDATE_DEPARTMENTS],
    deniedMessage: "Vous n'avez pas la permission de modifier un département.",
    redirectTo: '../',
  },

  // Roles
  '/hr/roles': {
    requiredPermissions: [PERMISSIONS.HR.VIEW_ROLES],
    deniedMessage: "Vous n'avez pas la permission de consulter les rôles.",
  },

  '/hr/roles/create': {
    requiredPermissions: [PERMISSIONS.HR.CREATE_ROLES],
    deniedMessage: "Vous n'avez pas la permission de créer des rôles.",
    redirectTo: '../',
  },

  '/hr/roles/[id]/edit': {
    requiredPermissions: [PERMISSIONS.HR.UPDATE_ROLES],
    deniedMessage: "Vous n'avez pas la permission de modifier un rôle.",
    redirectTo: '../',
  },

  // Leave Requests
  '/hr/leaves': {
    requiredPermissions: [PERMISSIONS.HR.VIEW_LEAVE_REQUESTS],
    deniedMessage: "Vous n'avez pas la permission de consulter les demandes de congés.",
  },

  '/hr/leaves/create': {
    requiredPermissions: [PERMISSIONS.HR.CREATE_LEAVE_REQUESTS],
    deniedMessage: "Vous n'avez pas la permission de créer une demande de congé.",
    redirectTo: '../',
  },

  // Payroll
  '/hr/payroll': {
    requiredPermissions: [PERMISSIONS.HR.VIEW_PAYROLL],
    deniedMessage: "Vous n'avez pas la permission de consulter les fiches de paie.",
  },

  // Attendance
  '/hr/attendance': {
    requiredPermissions: [PERMISSIONS.HR.VIEW_ATTENDANCE],
    deniedMessage: "Vous n'avez pas la permission de consulter les pointages.",
  },

  '/hr/attendance/approvals': {
    requiredPermissions: [PERMISSIONS.HR.APPROVE_ATTENDANCE],
    deniedMessage: "Vous n'avez pas la permission d'approuver les pointages.",
  },

  // Contracts
  '/hr/contracts': {
    requiredPermissions: [PERMISSIONS.HR.VIEW_CONTRACTS],
    deniedMessage: "Vous n'avez pas la permission de consulter les contrats.",
  },

  '/hr/contracts/create': {
    requiredPermissions: [PERMISSIONS.HR.CREATE_CONTRACTS],
    deniedMessage: "Vous n'avez pas la permission de créer des contrats.",
    redirectTo: '../',
  },

  '/hr/contracts/:id': {
    requiredPermissions: [PERMISSIONS.HR.VIEW_CONTRACTS],
    deniedMessage: "Vous n'avez pas la permission de consulter les détails d'un contrat.",
  },

  '/hr/contracts/:id/edit': {
    requiredPermissions: [PERMISSIONS.HR.UPDATE_CONTRACTS],
    deniedMessage: "Vous n'avez pas la permission de modifier un contrat.",
    redirectTo: '../',
  },
};

/**
 * Permissions pour les routes Inventory
 */
export const INVENTORY_ROUTE_PERMISSIONS: Record<string, RouteProtectionConfig> = {
  // Products
  '/inventory/products': {
    requiredPermissions: [PERMISSIONS.INVENTORY.VIEW_PRODUCTS],
    deniedMessage: "Vous n'avez pas la permission de consulter les produits.",
  },

  '/inventory/products/create': {
    requiredPermissions: [PERMISSIONS.INVENTORY.CREATE_PRODUCTS],
    deniedMessage: "Vous n'avez pas la permission de créer des produits.",
    redirectTo: '../',
  },

  // Categories
  '/inventory/categories': {
    requiredPermissions: [PERMISSIONS.INVENTORY.VIEW_CATEGORIES],
    deniedMessage: "Vous n'avez pas la permission de consulter les catégories.",
  },

  // Warehouses
  '/inventory/warehouses': {
    requiredPermissions: [PERMISSIONS.INVENTORY.VIEW_WAREHOUSES],
    deniedMessage: "Vous n'avez pas la permission de consulter les entrepôts.",
  },

  // Suppliers
  '/inventory/suppliers': {
    requiredPermissions: [PERMISSIONS.INVENTORY.VIEW_SUPPLIERS],
    deniedMessage: "Vous n'avez pas la permission de consulter les fournisseurs.",
  },

  // Orders
  '/inventory/orders': {
    requiredPermissions: [PERMISSIONS.INVENTORY.VIEW_ORDERS],
    deniedMessage: "Vous n'avez pas la permission de consulter les commandes.",
  },

  // Movements
  '/inventory/movements': {
    requiredPermissions: [PERMISSIONS.INVENTORY.VIEW_MOVEMENTS],
    deniedMessage: "Vous n'avez pas la permission de consulter les mouvements.",
  },

  // Stock Counts
  '/inventory/stock-counts': {
    requiredPermissions: [PERMISSIONS.INVENTORY.VIEW_STOCK_COUNTS],
    deniedMessage: "Vous n'avez pas la permission de consulter les inventaires.",
  },

  // Sales
  '/inventory/sales': {
    requiredPermissions: [PERMISSIONS.INVENTORY.VIEW_SALES],
    deniedMessage: "Vous n'avez pas la permission de consulter les ventes.",
  },

  '/inventory/sales/create': {
    requiredPermissions: [PERMISSIONS.INVENTORY.CREATE_SALES],
    deniedMessage: "Vous n'avez pas la permission de créer des ventes.",
    redirectTo: '../',
  },
};

/**
 * Toutes les permissions de routes combinées
 */
export const ALL_ROUTE_PERMISSIONS: Record<string, RouteProtectionConfig> = {
  ...HR_ROUTE_PERMISSIONS,
  ...INVENTORY_ROUTE_PERMISSIONS,
};

/**
 * Helper pour obtenir la configuration de permission pour une route
 */
export function getRoutePermission(pathname: string): RouteProtectionConfig | null {
  // Normaliser le pathname (enlever /apps/[slug])
  const normalizedPath = pathname.replace(/^\/apps\/[^/]+/, '');

  // Chercher une correspondance exacte
  if (ALL_ROUTE_PERMISSIONS[normalizedPath]) {
    return ALL_ROUTE_PERMISSIONS[normalizedPath];
  }

  // Chercher une correspondance avec des paramètres dynamiques
  for (const [route, config] of Object.entries(ALL_ROUTE_PERMISSIONS)) {
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
    // Paramètre dynamique Next.js [id] ou express :id
    if (segment.startsWith('[') && segment.endsWith(']')) {
      return true;
    }
    if (segment.startsWith(':')) {
      return true;
    }
    return segment === pathnameSegments[index];
  });
}
