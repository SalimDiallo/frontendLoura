/**
 * Service pour les statistiques RH
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { HRStats, DepartmentStats, LeaveStats } from '@/lib/types/hr';

/**
 * Récupère les statistiques générales RH
 * @param organizationSlug - Le subdomain de l'organisation
 */
export async function getHRStats(organizationSlug?: string): Promise<HRStats> {
  // Si organizationSlug n'est pas fourni, on l'obtient de l'URL ou du contexte
  const searchParams = new URLSearchParams();

  if (organizationSlug) {
    searchParams.append('organization_subdomain', organizationSlug);
  } else {
    // Tenter de l'obtenir depuis l'URL du browser
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const appsIndex = pathParts.indexOf('apps');
      if (appsIndex !== -1 && pathParts[appsIndex + 1]) {
        searchParams.append('organization_subdomain', pathParts[appsIndex + 1]);
      }
    }
  }

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.HR.STATS.OVERVIEW}?${queryString}` : API_ENDPOINTS.HR.STATS.OVERVIEW;

  return apiClient.get<HRStats>(url);
}

/**
 * Récupère les statistiques par département
 * @param organizationSlug - Le subdomain de l'organisation
 */
export async function getDepartmentStats(organizationSlug?: string): Promise<DepartmentStats[]> {
  const searchParams = new URLSearchParams();

  if (organizationSlug) {
    searchParams.append('organization_subdomain', organizationSlug);
  } else {
    // Tenter de l'obtenir depuis l'URL du browser
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const appsIndex = pathParts.indexOf('apps');
      if (appsIndex !== -1 && pathParts[appsIndex + 1]) {
        searchParams.append('organization_subdomain', pathParts[appsIndex + 1]);
      }
    }
  }

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.HR.STATS.DEPARTMENTS}?${queryString}` : API_ENDPOINTS.HR.STATS.DEPARTMENTS;

  return apiClient.get<DepartmentStats[]>(url);
}

/**
 * Récupère les statistiques de congés
 */
export async function getLeaveStats(params?: {
  employee?: string;
  year?: number;
}): Promise<LeaveStats> {
  const searchParams = new URLSearchParams();

  if (params?.employee) searchParams.append('employee', params.employee);
  if (params?.year) searchParams.append('year', String(params.year));

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.HR.STATS.LEAVES}?${queryString}` : API_ENDPOINTS.HR.STATS.LEAVES;

  return apiClient.get<LeaveStats>(url);
}

/**
 * Récupère les statistiques de paie (legacy - utiliser getPayrollStats de payroll.service.ts)
 * @deprecated Utiliser getPayrollStats de payroll.service.ts
 */
export async function getPayrollStatsLegacy(params?: {
  period_start?: string;
  period_end?: string;
}): Promise<any> {
  const searchParams = new URLSearchParams();

  if (params?.period_start) searchParams.append('period_start', params.period_start);
  if (params?.period_end) searchParams.append('period_end', params.period_end);

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.HR.STATS.PAYROLL}?${queryString}` : API_ENDPOINTS.HR.STATS.PAYROLL;

  return apiClient.get<any>(url);
}
