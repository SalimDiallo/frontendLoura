/**
 * Service pour la gestion des avances sur salaire
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  PayrollAdvance,
  PayrollAdvanceCreate,
  PayrollAdvanceApproval
} from '@/lib/types/hr';

/**
 * Liste toutes les demandes d'avances
 */
export async function getPayrollAdvances(params?: {
  organization_subdomain?: string;
  status?: string;
  employee?: string;
}): Promise<PayrollAdvance[]> {
  const searchParams = new URLSearchParams();

  if (params?.organization_subdomain) searchParams.append('organization_subdomain', params.organization_subdomain);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.employee) searchParams.append('employee', params.employee);

  const queryString = searchParams.toString();
  const url = queryString
    ? `${API_ENDPOINTS.HR.PAYROLL_ADVANCES.LIST}?${queryString}`
    : API_ENDPOINTS.HR.PAYROLL_ADVANCES.LIST;

  const response = await apiClient.get<{ count: number; results: PayrollAdvance[] }>(url);
  return response.results || [];
}

/**
 * Récupère les détails d'une avance
 */
export async function getPayrollAdvance(id: string): Promise<PayrollAdvance> {
  return apiClient.get<PayrollAdvance>(API_ENDPOINTS.HR.PAYROLL_ADVANCES.DETAIL(id));
}

/**
 * Crée une nouvelle demande d'avance
 */
export async function createPayrollAdvance(data: PayrollAdvanceCreate): Promise<PayrollAdvance> {
  return apiClient.post<PayrollAdvance>(API_ENDPOINTS.HR.PAYROLL_ADVANCES.CREATE, data);
}

/**
 * Met à jour une demande d'avance
 */
export async function updatePayrollAdvance(id: string, data: Partial<PayrollAdvanceCreate>): Promise<PayrollAdvance> {
  return apiClient.patch<PayrollAdvance>(API_ENDPOINTS.HR.PAYROLL_ADVANCES.UPDATE(id), data);
}

/**
 * Supprime une demande d'avance
 */
export async function deletePayrollAdvance(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.HR.PAYROLL_ADVANCES.DELETE(id));
}

/**
 * Approuve une demande d'avance
 */
export async function approvePayrollAdvance(id: string, data?: Partial<PayrollAdvanceApproval>): Promise<PayrollAdvance> {
  return apiClient.post<PayrollAdvance>(
    API_ENDPOINTS.HR.PAYROLL_ADVANCES.APPROVE(id),
    { ...data, action: 'approve' }
  );
}

/**
 * Rejette une demande d'avance
 */
export async function rejectPayrollAdvance(id: string, reason: string): Promise<PayrollAdvance> {
  return apiClient.post<PayrollAdvance>(
    API_ENDPOINTS.HR.PAYROLL_ADVANCES.REJECT(id),
    { action: 'reject', rejection_reason: reason }
  );
}

// Les fonctions markAdvanceAsPaid et deductAdvanceFromPayslip ont été supprimées
// car le workflow simplifié déduit automatiquement les avances approuvées lors de la génération de paie

