/**
 * Constantes de Permissions
 * =========================
 * Ce fichier définit les permissions utilisées dans l'application.
 * Ces codes DOIVENT correspondre exactement aux codes définis dans le backend:
 * - backend/app/hr/permissions.py
 * - backend/app/inventory/permissions.py
 * 
 * Format: {module}.{action}_{resource}
 * Exemples: hr.view_employees, inventory.create_products
 */

// ============================================
// Permissions HR
// ============================================

export const HR_PERMISSIONS = {
  // Employees
  VIEW_EMPLOYEES: 'hr.view_employees',
  CREATE_EMPLOYEES: 'hr.create_employees',
  UPDATE_EMPLOYEES: 'hr.update_employees',
  DELETE_EMPLOYEES: 'hr.delete_employees',
  MANAGE_EMPLOYEE_PERMISSIONS: 'hr.manage_employee_permissions',

  // Departments
  VIEW_DEPARTMENTS: 'hr.view_departments',
  CREATE_DEPARTMENTS: 'hr.create_departments',
  UPDATE_DEPARTMENTS: 'hr.update_departments',
  DELETE_DEPARTMENTS: 'hr.delete_departments',

  // Positions
  VIEW_POSITIONS: 'hr.view_positions',
  CREATE_POSITIONS: 'hr.create_positions',
  UPDATE_POSITIONS: 'hr.update_positions',
  DELETE_POSITIONS: 'hr.delete_positions',

  // Roles
  VIEW_ROLES: 'hr.view_roles',
  CREATE_ROLES: 'hr.create_roles',
  UPDATE_ROLES: 'hr.update_roles',
  DELETE_ROLES: 'hr.delete_roles',

  // Contracts
  VIEW_CONTRACTS: 'hr.view_contracts',
  CREATE_CONTRACTS: 'hr.create_contracts',
  UPDATE_CONTRACTS: 'hr.update_contracts',
  DELETE_CONTRACTS: 'hr.delete_contracts',

  // Leave Requests
  VIEW_LEAVE_REQUESTS: 'hr.view_leave_requests',
  CREATE_LEAVE_REQUESTS: 'hr.create_leave_requests',
  APPROVE_LEAVE_REQUESTS: 'hr.approve_leave_requests',

  // Payroll
  VIEW_PAYROLL: 'hr.view_payroll',
  CREATE_PAYROLL: 'hr.create_payroll',
  UPDATE_PAYROLL: 'hr.update_payroll',
  EXPORT_PAYROLL: 'hr.export_payroll',

  // Attendance
  VIEW_ATTENDANCE: 'hr.view_attendance',
  VIEW_ALL_ATTENDANCE: 'hr.view_all_attendance',
  CREATE_ATTENDANCE: 'hr.create_attendance',
  UPDATE_ATTENDANCE: 'hr.update_attendance',
  DELETE_ATTENDANCE: 'hr.delete_attendance',
  APPROVE_ATTENDANCE: 'hr.approve_attendance',
  MANUAL_CHECKIN: 'hr.manual_checkin',
  CREATE_QR_SESSION: 'hr.create_qr_session',
} as const;

// ============================================
// Permissions Inventory
// ============================================

export const INVENTORY_PERMISSIONS = {
  // Categories
  VIEW_CATEGORIES: 'inventory.view_categories',
  CREATE_CATEGORIES: 'inventory.create_categories',
  UPDATE_CATEGORIES: 'inventory.update_categories',
  DELETE_CATEGORIES: 'inventory.delete_categories',

  // Warehouses
  VIEW_WAREHOUSES: 'inventory.view_warehouses',
  CREATE_WAREHOUSES: 'inventory.create_warehouses',
  UPDATE_WAREHOUSES: 'inventory.update_warehouses',
  DELETE_WAREHOUSES: 'inventory.delete_warehouses',

  // Suppliers
  VIEW_SUPPLIERS: 'inventory.view_suppliers',
  CREATE_SUPPLIERS: 'inventory.create_suppliers',
  UPDATE_SUPPLIERS: 'inventory.update_suppliers',
  DELETE_SUPPLIERS: 'inventory.delete_suppliers',

  // Products
  VIEW_PRODUCTS: 'inventory.view_products',
  CREATE_PRODUCTS: 'inventory.create_products',
  UPDATE_PRODUCTS: 'inventory.update_products',
  DELETE_PRODUCTS: 'inventory.delete_products',

  // Stock
  VIEW_STOCK: 'inventory.view_stock',
  MANAGE_STOCK: 'inventory.manage_stock',
  ADJUST_STOCK: 'inventory.adjust_stock',

  // Movements
  VIEW_MOVEMENTS: 'inventory.view_movements',
  CREATE_MOVEMENTS: 'inventory.create_movements',
  UPDATE_MOVEMENTS: 'inventory.update_movements',
  DELETE_MOVEMENTS: 'inventory.delete_movements',

  // Orders
  VIEW_ORDERS: 'inventory.view_orders',
  CREATE_ORDERS: 'inventory.create_orders',
  UPDATE_ORDERS: 'inventory.update_orders',
  DELETE_ORDERS: 'inventory.delete_orders',
  RECEIVE_ORDERS: 'inventory.receive_orders',

  // Stock Counts
  VIEW_STOCK_COUNTS: 'inventory.view_stock_counts',
  CREATE_STOCK_COUNTS: 'inventory.create_stock_counts',
  VALIDATE_STOCK_COUNTS: 'inventory.validate_stock_counts',

  // Sales
  VIEW_SALES: 'inventory.view_sales',
  CREATE_SALES: 'inventory.create_sales',
  UPDATE_SALES: 'inventory.update_sales',
  DELETE_SALES: 'inventory.delete_sales',

  // Customers
  VIEW_CUSTOMERS: 'inventory.view_customers',
  CREATE_CUSTOMERS: 'inventory.create_customers',
  UPDATE_CUSTOMERS: 'inventory.update_customers',
  DELETE_CUSTOMERS: 'inventory.delete_customers',

  // Payments
  VIEW_PAYMENTS: 'inventory.view_payments',
  CREATE_PAYMENTS: 'inventory.create_payments',

  // Reports
  VIEW_REPORTS: 'inventory.view_reports',
  EXPORT_REPORTS: 'inventory.export_reports',
} as const;

// ============================================
// Objet global des permissions
// ============================================

export const PERMISSIONS = {
  HR: HR_PERMISSIONS,
  INVENTORY: INVENTORY_PERMISSIONS,
} as const;

// ============================================
// Types
// ============================================

export type HRPermission = typeof HR_PERMISSIONS[keyof typeof HR_PERMISSIONS];
export type InventoryPermission = typeof INVENTORY_PERMISSIONS[keyof typeof INVENTORY_PERMISSIONS];
export type Permission = HRPermission | InventoryPermission;

// ============================================
// Helpers
// ============================================

/**
 * Vérifie si un code est une permission valide
 */
export function isValidPermission(code: string): code is Permission {
  const allPermissions = [
    ...Object.values(HR_PERMISSIONS),
    ...Object.values(INVENTORY_PERMISSIONS),
  ];
  return allPermissions.includes(code as Permission);
}

/**
 * Parse un code de permission pour extraire le module et l'action
 * Format: module.action_resource
 * Exemple: hr.view_employees -> { module: 'hr', action: 'view', resource: 'employees' }
 */
export function parsePermissionCode(code: string): {
  module: string;
  action: string;
  resource: string;
} | null {
  const parts = code.split('.');
  if (parts.length !== 2) return null;

  const [module, actionResource] = parts;
  const underscoreIndex = actionResource.indexOf('_');
  
  if (underscoreIndex === -1) return null;

  return {
    module,
    action: actionResource.substring(0, underscoreIndex),
    resource: actionResource.substring(underscoreIndex + 1),
  };
}

/**
 * Crée un code de permission
 */
export function createPermissionCode(
  module: string,
  action: string,
  resource: string
): string {
  return `${module}.${action}_${resource}`;
}

// ============================================
// Compatibilité avec l'ancien système
// ============================================

/**
 * Mapping de l'ancien format (can_view_employee, employee.view) vers le nouveau (hr.view_employees)
 * Utilisé pour la migration progressive
 */
export const LEGACY_PERMISSION_MAPPING: Record<string, string> = {
  // Legacy can_* format
  'can_view_employee': HR_PERMISSIONS.VIEW_EMPLOYEES,
  'can_create_employee': HR_PERMISSIONS.CREATE_EMPLOYEES,
  'can_update_employee': HR_PERMISSIONS.UPDATE_EMPLOYEES,
  'can_delete_employee': HR_PERMISSIONS.DELETE_EMPLOYEES,
  'can_view_department': HR_PERMISSIONS.VIEW_DEPARTMENTS,
  'can_create_department': HR_PERMISSIONS.CREATE_DEPARTMENTS,
  'can_update_department': HR_PERMISSIONS.UPDATE_DEPARTMENTS,
  'can_delete_department': HR_PERMISSIONS.DELETE_DEPARTMENTS,
  'can_view_role': HR_PERMISSIONS.VIEW_ROLES,
  'can_create_role': HR_PERMISSIONS.CREATE_ROLES,
  'can_update_role': HR_PERMISSIONS.UPDATE_ROLES,
  'can_view_leave': HR_PERMISSIONS.VIEW_LEAVE_REQUESTS,
  'can_create_leave': HR_PERMISSIONS.CREATE_LEAVE_REQUESTS,
  'can_approve_leave': HR_PERMISSIONS.APPROVE_LEAVE_REQUESTS,
  'can_view_payroll': HR_PERMISSIONS.VIEW_PAYROLL,
  'can_create_payroll': HR_PERMISSIONS.CREATE_PAYROLL,
  'can_view_attendance': HR_PERMISSIONS.VIEW_ATTENDANCE,
  'can_create_attendance': HR_PERMISSIONS.CREATE_ATTENDANCE,
  'can_approve_attendance': HR_PERMISSIONS.APPROVE_ATTENDANCE,
  
  // Legacy resource.action format
  'employee.view': HR_PERMISSIONS.VIEW_EMPLOYEES,
  'employee.create': HR_PERMISSIONS.CREATE_EMPLOYEES,
  'employee.update': HR_PERMISSIONS.UPDATE_EMPLOYEES,
  'employee.delete': HR_PERMISSIONS.DELETE_EMPLOYEES,
  'department.view': HR_PERMISSIONS.VIEW_DEPARTMENTS,
  'department.create': HR_PERMISSIONS.CREATE_DEPARTMENTS,
  'department.update': HR_PERMISSIONS.UPDATE_DEPARTMENTS,
  'department.delete': HR_PERMISSIONS.DELETE_DEPARTMENTS,
  'role.view': HR_PERMISSIONS.VIEW_ROLES,
  'role.create': HR_PERMISSIONS.CREATE_ROLES,
  'role.update': HR_PERMISSIONS.UPDATE_ROLES,
  'role.delete': HR_PERMISSIONS.DELETE_ROLES,
  'leave_request.view': HR_PERMISSIONS.VIEW_LEAVE_REQUESTS,
  'leave_request.create': HR_PERMISSIONS.CREATE_LEAVE_REQUESTS,
  'leave_request.approve': HR_PERMISSIONS.APPROVE_LEAVE_REQUESTS,
  'payroll.view': HR_PERMISSIONS.VIEW_PAYROLL,
  'payroll.create': HR_PERMISSIONS.CREATE_PAYROLL,
  'attendance.view': HR_PERMISSIONS.VIEW_ATTENDANCE,
  'attendance.view_all': HR_PERMISSIONS.VIEW_ALL_ATTENDANCE,
  'attendance.create': HR_PERMISSIONS.CREATE_ATTENDANCE,
  'attendance.approve': HR_PERMISSIONS.APPROVE_ATTENDANCE,
  'attendance.manual_checkin': HR_PERMISSIONS.MANUAL_CHECKIN,
  'attendance.create_qr_session': HR_PERMISSIONS.CREATE_QR_SESSION,
  
  // Inventory legacy
  'product.view': INVENTORY_PERMISSIONS.VIEW_PRODUCTS,
  'product.create': INVENTORY_PERMISSIONS.CREATE_PRODUCTS,
  'product.update': INVENTORY_PERMISSIONS.UPDATE_PRODUCTS,
  'product.delete': INVENTORY_PERMISSIONS.DELETE_PRODUCTS,
  'category.view': INVENTORY_PERMISSIONS.VIEW_CATEGORIES,
  'warehouse.view': INVENTORY_PERMISSIONS.VIEW_WAREHOUSES,
  'supplier.view': INVENTORY_PERMISSIONS.VIEW_SUPPLIERS,
  'stock.view': INVENTORY_PERMISSIONS.VIEW_STOCK,
  'stock.manage': INVENTORY_PERMISSIONS.MANAGE_STOCK,
  'order.view': INVENTORY_PERMISSIONS.VIEW_ORDERS,
  'sale.view': INVENTORY_PERMISSIONS.VIEW_SALES,
  'sale.create': INVENTORY_PERMISSIONS.CREATE_SALES,
};

/**
 * Convertit un code de permission legacy vers le nouveau format
 */
export function normalizePermissionCode(code: string): string {
  return LEGACY_PERMISSION_MAPPING[code] || code;
}
