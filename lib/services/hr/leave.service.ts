/**
 * Service pour la gestion des congés
 */

import { cacheManager } from '@/lib/offline';
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

  return cacheManager.get<LeaveRequestListResponse>(url, { ttl: 3 * 60 * 1000 });
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

  return cacheManager.get<{ results: LeaveRequestHistoryApiResponse[]; count: number; next?: string | null; previous?: string | null }>(url, { ttl: 5 * 60 * 1000 });
}


/**
 * Récupère les détails d'une demande de congé
 */
export async function getLeaveRequest(id: string): Promise<LeaveRequest> {
  return cacheManager.get<LeaveRequest>(API_ENDPOINTS.HR.LEAVE_REQUESTS.DETAIL(id), { ttl: 5 * 60 * 1000 });
}

/**
 * Crée une nouvelle demande de congé
 */
export async function createLeaveRequest(data: LeaveRequestCreate): Promise<LeaveRequest> {
  return cacheManager.post<LeaveRequest>(API_ENDPOINTS.HR.LEAVE_REQUESTS.CREATE, data, {
    invalidateCache: [API_ENDPOINTS.HR.LEAVE_REQUESTS.LIST, API_ENDPOINTS.HR.LEAVE_REQUESTS.HISTORY, API_ENDPOINTS.HR.LEAVE_REQUESTS.MY_BALANCES],
  });
}

/**
 * Met à jour une demande de congé (PATCH)
 */
export async function updateLeaveRequest(id: string, data: LeaveRequestUpdate): Promise<LeaveRequest> {
  return cacheManager.patch<LeaveRequest>(API_ENDPOINTS.HR.LEAVE_REQUESTS.UPDATE(id), data, {
    invalidateCache: [API_ENDPOINTS.HR.LEAVE_REQUESTS.LIST, API_ENDPOINTS.HR.LEAVE_REQUESTS.HISTORY, API_ENDPOINTS.HR.LEAVE_REQUESTS.DETAIL(id)],
  });
}

/**
 * Approuve une demande de congé
 */
export async function approveLeaveRequest(id: string, data?: { approval_notes?: string }): Promise<LeaveRequest> {
  return cacheManager.post<LeaveRequest>(API_ENDPOINTS.HR.LEAVE_REQUESTS.APPROVE(id), data || {}, {
    invalidateCache: [API_ENDPOINTS.HR.LEAVE_REQUESTS.LIST, API_ENDPOINTS.HR.LEAVE_REQUESTS.HISTORY, API_ENDPOINTS.HR.LEAVE_REQUESTS.DETAIL(id)],
  });
}

/**
 * Rejette une demande de congé
 */
export async function rejectLeaveRequest(id: string, data?: { approval_notes?: string }): Promise<LeaveRequest> {
  return cacheManager.post<LeaveRequest>(API_ENDPOINTS.HR.LEAVE_REQUESTS.REJECT(id), data || {}, {
    invalidateCache: [API_ENDPOINTS.HR.LEAVE_REQUESTS.LIST, API_ENDPOINTS.HR.LEAVE_REQUESTS.HISTORY, API_ENDPOINTS.HR.LEAVE_REQUESTS.DETAIL(id)],
  });
}

/**
 * Supprime une demande de congé
 */
export async function deleteLeaveRequest(id: string): Promise<void> {
  return cacheManager.delete(API_ENDPOINTS.HR.LEAVE_REQUESTS.DELETE(id), {
    invalidateCache: [API_ENDPOINTS.HR.LEAVE_REQUESTS.LIST, API_ENDPOINTS.HR.LEAVE_REQUESTS.HISTORY],
  });
}

/**
 * Récupère les soldes de congés de l'employé connecté
 */
import type { LeaveBalance } from '@/lib/types/hr';

export async function getMyLeaveBalances(year?: number): Promise<LeaveBalance[]> {
  const searchParams = new URLSearchParams();
  if (year) searchParams.append('year', String(year));

  const queryString = searchParams.toString();
  const url = queryString
    ? `${API_ENDPOINTS.HR.LEAVE_REQUESTS.MY_BALANCES}?${queryString}`
    : API_ENDPOINTS.HR.LEAVE_REQUESTS.MY_BALANCES;

  return cacheManager.get<LeaveBalance[]>(url, { ttl: 5 * 60 * 1000 });
}


