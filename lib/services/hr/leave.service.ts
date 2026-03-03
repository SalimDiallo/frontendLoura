/**
 * Service pour la gestion des congés
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  LeaveRequest,
  LeaveRequestCreate,
  LeaveRequestUpdate,
  LeaveRequestApprove,
  LeaveRequestListResponse,
  LeaveStats,
} from '@/lib/types/hr';

/**
 * Liste toutes les demandes de congés
 */
export async function getLeaveRequests(params?: {
  employee?: string;
  status?: string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
  exclude?: boolean;
  organization_subdomain?: string;
}): Promise<LeaveRequestListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.employee) searchParams.append('employee', params.employee);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.leave_type) searchParams.append('leave_type', params.leave_type);
  if (params?.start_date) searchParams.append('start_date', params.start_date);
  if (params?.end_date) searchParams.append('end_date', params.end_date);
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.page_size) searchParams.append('page_size', String(params.page_size));
  if (params?.exclude) searchParams.append('exclude', String(params.page_size));
  if (params?.organization_subdomain) searchParams.append('organization_subdomain', params.organization_subdomain);

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.HR.LEAVE_REQUESTS.LIST}?${queryString}` : API_ENDPOINTS.HR.LEAVE_REQUESTS.LIST;

  return apiClient.get<LeaveRequestListResponse>(url);
}

/**
 * Liste l'historique de toutes les demandes de congé
 */
import type { LeaveRequestHistoryApiResponse } from '@/lib/types/hr';

export async function getLeaveRequestsHistory(params?: {
  employee?: string;
  status?: string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}): Promise<{ results: LeaveRequestHistoryApiResponse[]; count: number; next?: string | null; previous?: string | null }> {
  const searchParams = new URLSearchParams();

  if (params?.employee) searchParams.append('employee', params.employee);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.leave_type) searchParams.append('leave_type', params.leave_type);
  if (params?.start_date) searchParams.append('start_date', params.start_date);
  if (params?.end_date) searchParams.append('end_date', params.end_date);
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.page_size) searchParams.append('page_size', String(params.page_size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `${API_ENDPOINTS.HR.LEAVE_REQUESTS.HISTORY}?${queryString}`
    : API_ENDPOINTS.HR.LEAVE_REQUESTS.HISTORY;

  return apiClient.get<{ results: LeaveRequestHistoryApiResponse[]; count: number; next?: string | null; previous?: string | null }>(url);
}


/**
 * Récupère les détails d'une demande de congé
 */
export async function getLeaveRequest(id: string): Promise<LeaveRequest> {
  return apiClient.get<LeaveRequest>(API_ENDPOINTS.HR.LEAVE_REQUESTS.DETAIL(id));
}

/**
 * Crée une nouvelle demande de congé
 */
export async function createLeaveRequest(data: LeaveRequestCreate): Promise<LeaveRequest> {
  return apiClient.post<LeaveRequest>(API_ENDPOINTS.HR.LEAVE_REQUESTS.CREATE, data);
}

/**
 * Met à jour une demande de congé (PATCH)
 */
export async function updateLeaveRequest(id: string, data: LeaveRequestUpdate): Promise<LeaveRequest> {
  return apiClient.patch<LeaveRequest>(API_ENDPOINTS.HR.LEAVE_REQUESTS.UPDATE(id), data);
}

/**
 * Approuve une demande de congé
 */
export async function approveLeaveRequest(id: string, data?: { approval_notes?: string }): Promise<LeaveRequest> {
  return apiClient.post<LeaveRequest>(API_ENDPOINTS.HR.LEAVE_REQUESTS.APPROVE(id), data || {});
}

/**
 * Rejette une demande de congé
 */
export async function rejectLeaveRequest(id: string, data?: { approval_notes?: string }): Promise<LeaveRequest> {
  return apiClient.post<LeaveRequest>(API_ENDPOINTS.HR.LEAVE_REQUESTS.REJECT(id), data || {});
}

/**
 * Supprime une demande de congé
 */
export async function deleteLeaveRequest(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.HR.LEAVE_REQUESTS.DELETE(id));
}


