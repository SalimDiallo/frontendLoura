/**
 * Service pour la gestion des soldes de congés (LeaveBalance)
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { LeaveBalance } from '@/lib/types/hr';

export interface LeaveBalanceCreate {
  employee: string;
  year: number;
  allocated_days: number;
}

export interface LeaveBalanceUpdate {
  allocated_days?: number;
  year?: number;
}

export interface LeaveBalanceListResponse {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: LeaveBalance[];
}

/**
 * Liste tous les soldes de congés (solde global uniquement)
 */
export async function getLeaveBalances(params?: {
  employee?: string;
  year?: number;
  page?: number;
  page_size?: number;
  organization_subdomain?: string;
}): Promise<LeaveBalanceListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.employee) searchParams.append('employee', params.employee);
  if (params?.year) searchParams.append('year', String(params.year));
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.page_size) searchParams.append('page_size', String(params.page_size));
  if (params?.organization_subdomain) searchParams.append('organization_subdomain', params.organization_subdomain);

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.HR.LEAVE_BALANCES.LIST}?${queryString}` : API_ENDPOINTS.HR.LEAVE_BALANCES.LIST;

  return apiClient.get<LeaveBalanceListResponse>(url);
}

/**
 * Récupère les détails d'un solde de congé
 */
export async function getLeaveBalance(id: string): Promise<LeaveBalance> {
  return apiClient.get<LeaveBalance>(API_ENDPOINTS.HR.LEAVE_BALANCES.DETAIL(id));
}

/**
 * Crée un nouveau solde de congé
 */
export async function createLeaveBalance(data: LeaveBalanceCreate): Promise<LeaveBalance> {
  return apiClient.post<LeaveBalance>(API_ENDPOINTS.HR.LEAVE_BALANCES.CREATE, data);
}

/**
 * Met à jour un solde de congé (PATCH)
 */
export async function updateLeaveBalance(id: string, data: LeaveBalanceUpdate): Promise<LeaveBalance> {
  return apiClient.patch<LeaveBalance>(API_ENDPOINTS.HR.LEAVE_BALANCES.UPDATE(id), data);
}

/**
 * Supprime un solde de congé
 */
export async function deleteLeaveBalance(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.HR.LEAVE_BALANCES.DELETE(id));
}

/**
 * Initialise les soldes de congés pour un employé
 */
export async function initializeLeaveBalances(data: {
  employee: string;
  year?: number;
  default_days?: number;
}): Promise<{ message: string; balances: LeaveBalance[] }> {
  return apiClient.post<{ message: string; balances: LeaveBalance[] }>(
    API_ENDPOINTS.HR.LEAVE_BALANCES.INITIALIZE,
    data
  );
}
