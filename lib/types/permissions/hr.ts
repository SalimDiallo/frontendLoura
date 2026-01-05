/**
 * HR Permissions - Codes must match backend database values
 * Backend format: `{module}.{action}_{resource}` (e.g., hr.view_employees)
 */

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
