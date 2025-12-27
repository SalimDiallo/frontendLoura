/**
 * Service pour la gestion des paies
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  Payroll,
  PayrollCreate,
  PayrollUpdate,
  PayrollListResponse,
} from '@/lib/types/hr';

/**
 * Liste toutes les fiches de paie d'une organisation
 */
export async function getPayrolls(
  organizationSlug: string,
  params?: {
    employee?: string;
    status?: string;
    period_start?: string;
    period_end?: string;
    page?: number;
    page_size?: number;
  }
): Promise<PayrollListResponse> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.append('organization_subdomain', organizationSlug);

    if (params?.employee) searchParams.append('employee', params.employee);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.period_start) searchParams.append('period_start', params.period_start);
    if (params?.period_end) searchParams.append('period_end', params.period_end);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.page_size) searchParams.append('page_size', String(params.page_size));

    const queryString = searchParams.toString();
    const url = `${API_ENDPOINTS.HR.PAYSLIPS.LIST}?${queryString}`;

    return await apiClient.get<PayrollListResponse>(url);
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    return {
      count: 0,
      next: undefined,
      previous: undefined,
      results: [],
    };
  }
}

/**
 * Récupère les détails d'une paie
 */
export async function getPayroll(id: string): Promise<Payroll> {
  return apiClient.get<Payroll>(API_ENDPOINTS.HR.PAYSLIPS.DETAIL(id));
}

/**
 * Crée une nouvelle paie
 */
export async function createPayroll(data: PayrollCreate): Promise<Payroll> {
  return apiClient.post<Payroll>(API_ENDPOINTS.HR.PAYSLIPS.CREATE, data);
}

/**
 * Met à jour une paie (PUT)
 */
export async function updatePayroll(id: string, data: PayrollCreate): Promise<Payroll> {
  return apiClient.put<Payroll>(API_ENDPOINTS.HR.PAYSLIPS.UPDATE(id), data);
}

/**
 * Met à jour partiellement une paie (PATCH)
 */
export async function patchPayroll(id: string, data: PayrollUpdate): Promise<Payroll> {
  return apiClient.patch<Payroll>(API_ENDPOINTS.HR.PAYSLIPS.UPDATE(id), data);
}

/**
 * Marque une paie comme payée
 */
export async function markPayrollAsPaid(id: string, data?: { payment_method?: string }): Promise<Payroll> {
  return apiClient.post<Payroll>(API_ENDPOINTS.HR.PAYSLIPS.MARK_PAID(id), data);
}

/**
 * Supprime une paie
 */
export async function deletePayroll(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.HR.PAYSLIPS.DELETE(id));
}

/**
 * Génération automatique de toutes les fiches de paie pour une période
 * Avec déduction automatique des avances
 */
export async function generateBulkPayslips(
  payrollPeriodId: string,
  options?: {
    auto_deduct_advances?: boolean;
    employee_filters?: {
      department?: string;
      position?: string;
    };
  }
): Promise<{
  message: string;
  created: number;
  skipped: number;
  total_employees: number;
  advances_deducted: number;
  errors: string[];
}> {
  return apiClient.post(
    API_ENDPOINTS.HR.PAYSLIPS.GENERATE_BULK,
    {
      payroll_period: payrollPeriodId,
      auto_deduct_advances: options?.auto_deduct_advances ?? true,
      employee_filters: options?.employee_filters ?? {},
    }
  );
}

/**
 * Récupère les fiches de paie d'un employé
 */
export async function getEmployeePayrolls(
  organizationSlug: string,
  employeeId: string,
  params?: {
    year?: number;
    status?: string;
  }
): Promise<PayrollListResponse> {
  return getPayrolls(organizationSlug, {
    employee: employeeId,
    ...params,
  });
}

/**
 * Génère les fiches de paie pour tous les employés actifs d'une période
 */
export async function generatePayrollsForPeriod(
  payrollPeriodId: string,
  employeeFilters?: {
    department?: string;
    position?: string;
  }
): Promise<{
  message: string;
  created: number;
  skipped: number;
  total_employees: number;
  errors: string[];
}> {
  return apiClient.post('/hr/payslips/generate_for_period/', {
    payroll_period: payrollPeriodId,
    employee_filters: employeeFilters,
  });
}

/**
 * Exporte une fiche de paie en PDF
 */
export async function exportPayrollPDF(payrollId: string): Promise<Blob> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/hr/payslips/${payrollId}/export_pdf/`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Erreur lors de l\'exportation du PDF');
  }

  return response.blob();
}

/**
 * Télécharge une fiche de paie en PDF
 */
export async function downloadPayrollPDF(payrollId: string, employeeName: string): Promise<void> {
  try {
    const blob = await exportPayrollPDF(payrollId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fiche_Paie_${employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques de paie pour une organisation
 */
export async function getPayrollStats(
  organizationSlug: string,
  params?: {
    year?: number;
    month?: number;
  }
): Promise<{
  total_payrolls: number;
  total_gross_salary: number;
  total_net_salary: number;
  total_deductions: number;
  average_salary: number;
  paid_count: number;
  pending_count: number;
  draft_count: number;
}> {
  const searchParams = new URLSearchParams();
  searchParams.append('organization_subdomain', organizationSlug);

  if (params?.year) searchParams.append('year', String(params.year));
  if (params?.month) searchParams.append('month', String(params.month));

  const queryString = searchParams.toString();
  return apiClient.get(`${API_ENDPOINTS.HR.STATS.PAYROLL}?${queryString}`);
}
