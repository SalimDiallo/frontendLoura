/**
 * Types pour la gestion des permissions et de l'autorisation
 */

import type { Permission } from '../hr';

// ============================================
// Permission Resource Types
// ============================================

/**
 * Types de ressources dans l'application
 */
export enum ResourceType {
  // Core Resources
  ORGANIZATION = 'organization',
  CATEGORY = 'category',

  // HR Resources
  EMPLOYEE = 'employee',
  DEPARTMENT = 'department',
  ROLE = 'role',
  PERMISSION = 'permission',
  CONTRACT = 'contract',
  LEAVE_REQUEST = 'leave_request',
  LEAVE_BALANCE = 'leave_balance',
  PAYROLL = 'payroll',
  PAYSLIP = 'payslip',
  CALENDAR = 'calendar',
  ATTENDANCE = 'attendance',

  // Future modules...
}

/**
 * Actions possibles sur les ressources
 */
export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Full access
  APPROVE = 'approve', // For leave requests, attendance, etc.
  EXPORT = 'export',
  // Ajout d'une action spécifique pour la gestion des permissions d'un employé
  MANAGE_PERMISSIONS = 'manage_permissions',
  // Actions spécifiques pour attendance
  VIEW_ALL = 'view_all', // View all attendance records (not just own)
  MANUAL_CHECKIN = 'manual_checkin', // Manual check-in/out for others
  CREATE_QR_SESSION = 'create_qr_session', // Create QR code session for attendance
}

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

// ============================================
// Common Permission Checks
// ============================================

/**
 * Permissions communes pour les modules
 */
export const COMMON_PERMISSIONS = {
  HR: {
    // Employees
    VIEW_EMPLOYEES: createPermissionCode(ResourceType.EMPLOYEE, PermissionAction.VIEW),
    CREATE_EMPLOYEES: createPermissionCode(ResourceType.EMPLOYEE, PermissionAction.CREATE),
    UPDATE_EMPLOYEES: createPermissionCode(ResourceType.EMPLOYEE, PermissionAction.UPDATE),
    DELETE_EMPLOYEES: createPermissionCode(ResourceType.EMPLOYEE, PermissionAction.DELETE),
    MANAGE_EMPLOYEES: createPermissionCode(ResourceType.EMPLOYEE, PermissionAction.MANAGE),
    // Permission pour gérer les permissions d'un employé
    MANAGE_EMPLOYEE_PERMISSIONS: createPermissionCode(ResourceType.EMPLOYEE, PermissionAction.MANAGE_PERMISSIONS),
    // Permission pour voir la compensation d'un employé
    VIEW_EMPLOYEE_COMPENSATION: 'employee.view_compensation',

    // Departments
    VIEW_DEPARTMENTS: createPermissionCode(ResourceType.DEPARTMENT, PermissionAction.VIEW),
    CREATE_DEPARTMENTS: createPermissionCode(ResourceType.DEPARTMENT, PermissionAction.CREATE),
    UPDATE_DEPARTMENTS: createPermissionCode(ResourceType.DEPARTMENT, PermissionAction.UPDATE),
    DELETE_DEPARTMENTS: createPermissionCode(ResourceType.DEPARTMENT, PermissionAction.DELETE),

    // Roles
    VIEW_ROLES: createPermissionCode(ResourceType.ROLE, PermissionAction.VIEW),
    CREATE_ROLES: createPermissionCode(ResourceType.ROLE, PermissionAction.CREATE),
    UPDATE_ROLES: createPermissionCode(ResourceType.ROLE, PermissionAction.UPDATE),
    DELETE_ROLES: createPermissionCode(ResourceType.ROLE, PermissionAction.DELETE),

    // Contracts
    VIEW_CONTRACTS: createPermissionCode(ResourceType.CONTRACT, PermissionAction.VIEW),
    CREATE_CONTRACTS: createPermissionCode(ResourceType.CONTRACT, PermissionAction.CREATE),
    UPDATE_CONTRACTS: createPermissionCode(ResourceType.CONTRACT, PermissionAction.UPDATE),
    DELETE_CONTRACTS: createPermissionCode(ResourceType.CONTRACT, PermissionAction.DELETE),

    // Leave Requests
    VIEW_LEAVE_REQUESTS: createPermissionCode(ResourceType.LEAVE_REQUEST, PermissionAction.VIEW),
    CREATE_LEAVE_REQUESTS: createPermissionCode(ResourceType.LEAVE_REQUEST, PermissionAction.CREATE),
    APPROVE_LEAVE_REQUESTS: createPermissionCode(ResourceType.LEAVE_REQUEST, PermissionAction.APPROVE),
    
    // Payroll
    VIEW_PAYROLL: createPermissionCode(ResourceType.PAYROLL, PermissionAction.VIEW),
    CREATE_PAYROLL: createPermissionCode(ResourceType.PAYROLL, PermissionAction.CREATE),
    UPDATE_PAYROLL: createPermissionCode(ResourceType.PAYROLL, PermissionAction.UPDATE),
    EXPORT_PAYROLL: createPermissionCode(ResourceType.PAYROLL, PermissionAction.EXPORT),

    // Attendance
    VIEW_ATTENDANCE: createPermissionCode(ResourceType.ATTENDANCE, PermissionAction.VIEW),
    VIEW_ALL_ATTENDANCE: createPermissionCode(ResourceType.ATTENDANCE, PermissionAction.VIEW_ALL),
    CREATE_ATTENDANCE: createPermissionCode(ResourceType.ATTENDANCE, PermissionAction.CREATE),
    UPDATE_ATTENDANCE: createPermissionCode(ResourceType.ATTENDANCE, PermissionAction.UPDATE),
    DELETE_ATTENDANCE: createPermissionCode(ResourceType.ATTENDANCE, PermissionAction.DELETE),
    APPROVE_ATTENDANCE: createPermissionCode(ResourceType.ATTENDANCE, PermissionAction.APPROVE),
    MANUAL_CHECKIN: createPermissionCode(ResourceType.ATTENDANCE, PermissionAction.MANUAL_CHECKIN),
    CREATE_QR_SESSION: createPermissionCode(ResourceType.ATTENDANCE, PermissionAction.CREATE_QR_SESSION),
  },
} as const;

