// HR Module Types

// ============================================
// Enums & Constants
// ============================================

export enum EmploymentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
}

export enum ContractType {
  PERMANENT = 'permanent',
  TEMPORARY = 'temporary',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export enum PayrollStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

// ============================================
// Department
// ============================================

export interface Department {
  id: string;
  organization: string;
  name: string;
  code: string;
  description?: string;
  head_id?: string; // Employee or AdminUser ID
  head_name?: string; // Display name of head
  head_type?: 'employee' | 'adminuser'; // Type of head
  manager?: string; // Alias for head_id (legacy)
  parent_department?: string; // Department ID
  employee_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentCreate {
  name: string;
  code: string;
  description?: string;
  manager?: string; // Employee or AdminUser ID
  head_id?: string; // Alternative name for manager
  parent_department?: string;
  is_active?: boolean;
}

export interface DepartmentUpdate extends Partial<DepartmentCreate> {}

// ============================================
// Position
// ============================================

export interface Position {
  id: string;
  organization: string;
  title: string;
  code?: string;
  description?: string;
  min_salary?: number;
  max_salary?: number;
  employee_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PositionCreate {
  title: string;
  code?: string;
  description?: string;
  min_salary?: number;
  max_salary?: number;
  is_active?: boolean;
}

export interface PositionUpdate extends Partial<PositionCreate> {}

// ============================================
// Role & Permissions
// ============================================

export interface Role {
  id: string;
  organization?: string | null;
  code: string;
  name: string;
  description?: string;
  permissions: Permission[];
  permission_count: number;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleCreate {
  organization?: string | null;
  code: string;
  name: string;
  description?: string;
  permission_codes?: string[];
  is_active?: boolean;
}

export interface RoleUpdate extends Partial<RoleCreate> {}

// ============================================
// Permissions
// ============================================

export interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Employee - List Response (minimal fields from EmployeeListSerializer)
// ============================================

export interface EmployeeListItem {
  id: string;
  email: string;
  full_name: string;
  employee_id: string;
  department_name?: string;
  position_title?: string;
  role_name?: string;
  gender?: Gender;
  employment_status: EmploymentStatus;
  is_active: boolean;
}

// ============================================
// Employee - Full Details
// ============================================

export interface Employee {
  id: string;
  organization: string;
  organization_name?: string;
  organization_subdomain?: string;
  employee_id: string;
  full_name: string;

  // Personal Information
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: string;
  city?: string;
  country?: string;
  avatar_url?: string;

  // Employment Information
  department?: string; // Department ID
  department_name?: string;
  position?: string; // Position ID
  position_title?: string;
  contract?: string; // Contract ID
  manager?: string; // Employee ID
  manager_name?: string;
  hire_date?: string;
  termination_date?: string;
  employment_status: EmploymentStatus;
  contract_type?: ContractType;

  // Role and Permissions
  role?: Role | null; // Full role object
  role_id?: string | null; // For write operations
  role_name?: string; // Role name
  all_permissions?: Permission[]; // Combined role + custom permissions
  custom_permissions?: Permission[]; // Additional custom permissions
  custom_permission_codes?: string[]; // For write operations

  // Compensation
  salary?: number;
  currency?: string;

  // Documents & Settings
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  // Preferences
  language?: string;
  timezone?: string;

  // Status
  is_active: boolean;
  email_verified?: boolean;
  last_login?: string;

  created_at?: string;
  updated_at?: string;

  // Populated fields
  department_details?: Department;
  role_details?: Role;
  manager_details?: Employee;
}

export interface EmployeeCreate {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
  employee_id?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: string;
  city?: string;
  country?: string;

  department?: string;
  position?: string;
  manager?: string;
  hire_date?: string;

  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  role_id?: string | null;
  employment_status?: EmploymentStatus;
  custom_permission_codes?: string[];
}

export interface EmployeeUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  employee_id?: string;
  date_of_birth?: string;
  gender?: Gender;
  address?: string;
  city?: string;
  country?: string;

  department?: string;
  position?: string;
  hire_date?: string;
  termination_date?: string;
  manager?: string;

  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  role_id?: string | null;
  employment_status?: EmploymentStatus;
  language?: string;
  timezone?: string;
  is_active?: boolean;

  custom_permission_codes?: string[];
}

// ============================================
// Leave Management
// ============================================

export interface LeaveType {
  id: string;
  organization: string;
  name: string;
  code?: string;
  description?: string;
  default_days_per_year: number;
  is_paid: boolean;
  requires_approval: boolean;
  max_consecutive_days?: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  employee: string;
  employee_name?: string;
  leave_type: string; // LeaveType ID
  leave_type_name?: string;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  available_days: number; // Calculated field from backend
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee: string;
  leave_type: string; // LeaveType ID
  start_date: string;
  end_date: string;
  start_half_day?: boolean;
  end_half_day?: boolean;
  total_days: number;
  reason?: string;
  attachment_url?: string;
  status: LeaveStatus;
  approver?: string; // Employee ID
  approval_date?: string;
  approval_notes?: string;
  created_at: string;
  updated_at: string;

  // Read-only fields from backend serializer
  employee_name?: string;
  leave_type_name?: string;
  leave_type_color?: string;
  status_display?: string;
  approver_name?: string;
}

export interface LeaveRequestCreate {
  leave_type: string; // LeaveType ID
  start_date: string;
  end_date: string;
  start_half_day?: boolean;
  end_half_day?: boolean;
  total_days: number;
  reason?: string;
  attachment_url?: string;
}

export interface LeaveRequestUpdate {
  start_date?: string;
  end_date?: string;
  reason?: string;
}

export interface LeaveRequestApprove {
  status: LeaveStatus;
  approval_notes?: string;
}

// ============================================
// Payroll Management
// ============================================

export interface PayrollItem {
  name: string;
  amount: number;
  is_deduction: boolean;
}

export interface Payroll {
  id: string;
  employee: string;
  employee_name?: string;
  employee_id?: string;
  payroll_period: string;
  payroll_period_name?: string;

  // Salary Components
  base_salary: number;
  allowances?: PayrollItem[];  // Liste des primes et indemnités
  deductions?: PayrollItem[];  // Liste des déductions

  // Calculations (calculés par le backend)
  gross_salary: number;
  total_deductions: number;
  net_salary: number;

  currency?: string;
  worked_hours?: number;
  overtime_hours?: number;
  leave_days_taken?: number;

  status: PayrollStatus;
  payment_method?: string;
  payment_date?: string;
  payment_reference?: string;
  payslip_file_url?: string;

  notes?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  employee_details?: Employee;
  start_date?: string;  // Depuis payroll_period
  end_date?: string;    // Depuis payroll_period
}

export interface PayrollCreate {
  employee: string;
  payroll_period: string; // ID de la période de paie (OBLIGATOIRE)
  base_salary: number;
  allowances?: PayrollItem[];  // Liste des primes et indemnités
  deductions?: PayrollItem[];  // Liste des déductions
  currency?: string;
  worked_hours?: number;
  overtime_hours?: number;
  leave_days_taken?: number;
  payment_method?: string;
  notes?: string;
  advance_ids?: string[]; // IDs des avances à déduire de cette fiche de paie
}

export interface PayrollUpdate extends Partial<PayrollCreate> {
  status?: PayrollStatus;
}

// ============================================
// Payroll Period Management
// ============================================

export interface PayrollPeriod {
  id: string;
  organization: string;
  name: string;
  start_date: string;  // Date de début
  end_date: string;    // Date de fin
  payment_date?: string;
  status: 'draft' | 'processing' | 'approved' | 'paid' | 'closed';
  payslip_count?: number;
  total_net_salary?: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollPeriodCreate {
  name: string;
  start_date: string;
  end_date: string;
  payment_date?: string;
}

export interface PayrollPeriodUpdate extends Partial<PayrollPeriodCreate> {
  status?: 'draft' | 'processing' | 'approved' | 'paid' | 'closed';
}

// ============================================
// Payroll Advance (Avance sur salaire)
// ============================================

export enum PayrollAdvanceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  DEDUCTED = 'deducted',
}

export interface PayrollAdvance {
  id: string;
  employee: string;
  employee_name?: string;
  employee_id_number?: string;
  employee_details?: EmployeeListItem;
  amount: number;
  reason: string;
  request_date: string;
  status: PayrollAdvanceStatus;
  status_display?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_date?: string;
  rejection_reason?: string;
  payment_date?: string;
  payslip?: string;
  payslip_reference?: string;
  deduction_month?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollAdvanceCreate {
  employee: string;
  amount: number;
  reason: string;
  notes?: string;
}

export interface PayrollAdvanceApproval {
  action: 'approve' | 'reject';
  rejection_reason?: string;
  payment_date?: string;
  deduction_month?: string;
  notes?: string;
}

export interface PayrollPeriodListResponse {
  results: PayrollPeriod[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

// ============================================
// Payroll Templates (Primes & Deductions)
// ============================================

export interface PayrollTemplate {
  id: string;
  name: string;
  type: 'allowance' | 'deduction';
  amount?: number;
  is_percentage?: boolean;
  percentage?: number;
  description?: string;
  is_active: boolean;
}

export const DEFAULT_ALLOWANCE_TEMPLATES: Omit<PayrollTemplate, 'id'>[] = [
  { name: 'Prime de transport', type: 'allowance', amount: 25000, is_active: true },
  { name: 'Prime de logement', type: 'allowance', amount: 50000, is_active: true },
  { name: 'Prime de responsabilité', type: 'allowance', amount: 30000, is_active: true },
  { name: 'Prime d\'ancienneté', type: 'allowance', is_percentage: true, percentage: 5, is_active: true, description: '5% du salaire de base' },
  { name: 'Heures supplémentaires', type: 'allowance', is_active: true },
];

export const DEFAULT_DEDUCTION_TEMPLATES: Omit<PayrollTemplate, 'id'>[] = [
  { name: 'Cotisation sociale (CNPS)', type: 'deduction', is_percentage: true, percentage: 3.6, is_active: true, description: '3.6% du salaire brut' },
  { name: 'Impôt sur le revenu', type: 'deduction', is_percentage: true, percentage: 10, is_active: true, description: '10% du salaire imposable' },
  { name: 'Avance sur salaire', type: 'deduction', is_active: true },
  { name: 'Prêt', type: 'deduction', is_active: true },
];

// ============================================
// Calendar Event
// ============================================

export interface CalendarEvent {
  id: string;
  organization: string;
  title: string;
  description?: string;
  event_type: 'leave' | 'holiday' | 'meeting' | 'other';
  start_date: string;
  end_date: string;
  all_day: boolean;

  // Related entities
  employee?: string;
  leave_request?: string;

  color?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  employee_details?: Employee;
  leave_request_details?: LeaveRequest;
}

// ============================================
// Statistics & Analytics
// ============================================

export interface HRStats {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  on_leave_employees: number;

  departments_count: number;
  roles_count: number;

  pending_leave_requests: number;
  approved_leave_requests_this_month: number;

  total_payroll_this_month: number;
  average_salary: number;

  // Contract stats
  total_contracts: number;
  active_contracts: number;
  expiring_contracts: number;

  recent_hires: Employee[];
  upcoming_leaves: LeaveRequest[];
}

export interface DepartmentStats {
  department: Department;
  employee_count: number;
  active_count: number;
  average_salary: number;
  leave_requests_pending: number;
}

export interface LeaveStats {
  employee: string;
  total_leaves: number;
  approved_leaves: number;
  pending_leaves: number;
  rejected_leaves: number;
  by_type: {
    [leaveTypeId: string]: number;
  };
}

// ============================================
// API Response Types
// ============================================

export interface EmployeeListResponse {
  results: EmployeeListItem[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

export interface LeaveRequestListResponse {
  results: LeaveRequest[];
  count: number;
  next?: string;
  previous?: string;
}

export interface PayrollListResponse {
  results: Payroll[];
  count: number;
  next?: string;
  previous?: string;
}

// ============================================
// Attendance Management
// ============================================

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  HALF_DAY = 'half_day',
  ON_LEAVE = 'on_leave',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Attendance {
  id: string;
  employee?: string;
  employee_name?: string;
  employee_id_number?: string;
  department_name?: string;
  user_email: string;
  user_full_name: string;
  date: string;
  check_in?: string; // ISO datetime
  check_in_location?: string;
  check_in_notes?: string;
  check_out?: string; // ISO datetime
  check_out_location?: string;
  check_out_notes?: string;
  break_start?: string; // ISO datetime
  break_end?: string; // ISO datetime
  is_on_break: boolean;
  total_hours?: number;
  break_duration?: number;
  status: AttendanceStatus;
  approval_status: ApprovalStatus;
  is_approved: boolean;
  approved_by?: string;
  approved_by_name?: string;
  approved_by_admin?: string;
  approved_by_admin_name?: string;
  approval_date?: string; // ISO datetime
  rejection_reason?: string;
  notes?: string;
  is_overtime: boolean;
  overtime_hours: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceCreate {
  employee: string;
  date: string;
  check_in?: string;
  check_in_location?: string;
  check_in_notes?: string;
  check_out?: string;
  check_out_location?: string;
  check_out_notes?: string;
  break_start?: string;
  break_end?: string;
  status?: AttendanceStatus;
  notes?: string;
}

export interface AttendanceUpdate extends Partial<AttendanceCreate> {}

export interface AttendanceCheckIn {
  location?: string;
  notes?: string;
  employee_id?: string; // For AdminUser to specify which employee
}

export interface AttendanceCheckOut {
  location?: string;
  notes?: string;
  employee_id?: string; // For AdminUser to specify which employee
}

export interface AttendanceApproval {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface AttendanceBreak {
  notes?: string;
}

export interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  on_leave_days: number;
  total_hours: number;
  overtime_hours: number;
  average_hours_per_day: number;
}

export interface AttendanceListResponse {
  results: Attendance[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

// ============================================
// QR Code Attendance System
// ============================================

export interface QRCodeSessionEmployee {
  id: string;
  full_name: string;
  email: string;
  employee_id: string;
}

export interface QRCodeSession {
  id: string;
  organization: string;
  session_token: string;
  qr_code_data: string; // JSON encoded data for QR
  employee: string; // Primary employee ID
  employee_name?: string;
  employee_email?: string;
  // Multi-employee support
  all_employees: QRCodeSessionEmployee[];
  employee_count: number;
  mode: 'auto' | 'check_in' | 'check_out';
  created_by: string; // AdminUser ID
  created_by_name?: string;
  expires_at: string; // ISO datetime
  is_active: boolean;
  created_at: string;
}

export interface QRCodeSessionCreate {
  employee?: string; // Single employee ID (backward compatible)
  employee_ids?: string[]; // Multiple employee IDs
  expires_in_minutes?: number; // Default 5 minutes
  mode?: 'auto' | 'check_in' | 'check_out'; // Attendance mode
}

export interface QRAttendanceCheckIn {
  session_token: string;
  employee_id?: string; // Required for multi-employee QR
  location?: string;
  notes?: string;
}

export interface QRAttendanceResponse {
  success: boolean;
  action: 'check_in' | 'check_out';
  message: string;
  attendance: Attendance;
  employee_name: string;
}

// ============================================
// Contract Management
// ============================================

export type SalaryPeriod = 'hourly' | 'daily' | 'monthly' | 'annual';

export interface Contract {
  id: string;
  employee: string;
  employee_name?: string;
  contract_type: ContractType;
  contract_type_display?: string;
  start_date: string;
  end_date?: string;
  base_salary: number;
  currency: string;
  salary_period: SalaryPeriod;
  salary_period_display?: string;
  hours_per_week: number;
  description?: string;
  contract_file_url?: string;
  is_active: boolean;
  // Nouveaux champs pour la gestion optimisée des contrats
  is_expired?: boolean;
  employee_contract_count?: number;
  has_other_active_contract?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractCreate {
  employee: string;
  contract_type: ContractType;
  start_date: string;
  end_date?: string;
  base_salary: number;
  currency?: string;
  salary_period?: SalaryPeriod;
  hours_per_week?: number;
  description?: string;
  contract_file_url?: string;
  is_active?: boolean;
}

export interface ContractUpdate extends Partial<ContractCreate> {}

export interface ContractListResponse {
  results: Contract[];
  count: number;
  next?: string | null;
  previous?: string | null;
}
