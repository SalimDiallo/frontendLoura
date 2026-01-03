/**
 * Base Permission Types
 */

export enum ResourceType {
  // Core Resources
  ORGANIZATION = 'organization',
  CATEGORY = 'category',
  
  // HR Resources
  EMPLOYEE = 'employee',
  DEPARTMENT = 'department',
  ROLE = 'role',
  POSITION = 'position',
  PERMISSION = 'permission',
  CONTRACT = 'contract',
  LEAVE_REQUEST = 'leave_request',
  LEAVE_BALANCE = 'leave_balance',
  PAYROLL = 'payroll',
  PAYSLIP = 'payslip',
  CALENDAR = 'calendar',
  ATTENDANCE = 'attendance',

  // Inventory Resources
  PRODUCT = 'product',
  STOCK = 'stock',
  WAREHOUSE = 'warehouse',
  SUPPLIER = 'supplier',
  SALE = 'sale',
  ORDER = 'order',

  // AI Resources
  AI_AGENT = 'ai_agent',
}

export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  APPROVE = 'approve',
  EXPORT = 'export',
  ADJUST = 'adjust',
  
  // Specific actions
  MANAGE_PERMISSIONS = 'manage_permissions',
  VIEW_ALL = 'view_all',
  MANUAL_CHECKIN = 'manual_checkin',
  CREATE_QR_SESSION = 'create_qr_session',
}

/**
 * Helper to create permission code: resource.action
 */
export function createPermissionCode(resource: string, action: string): string {
  return `${resource}.${action}`;
}
