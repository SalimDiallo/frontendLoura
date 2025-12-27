/**
 * Service pour la gestion des départements
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Department, DepartmentCreate, DepartmentUpdate } from '@/lib/types/hr';

/**
 * Liste tous les départements d'une organisation
 */
export async function getDepartments(params?: {
  search?: string;
  is_active?: boolean;
  organization_subdomain?: string;
  organization?: string;
}): Promise<Department[]> {
  const searchParams = new URLSearchParams();

  if (params?.search) searchParams.append('search', params.search);
  if (params?.is_active !== undefined) searchParams.append('is_active', String(params.is_active));
  if (params?.organization_subdomain) searchParams.append('organization_subdomain', params.organization_subdomain);
  if (params?.organization) searchParams.append('organization', params.organization);

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.HR.DEPARTMENTS.LIST}?${queryString}` : API_ENDPOINTS.HR.DEPARTMENTS.LIST;

  const response = await apiClient.get<{ count: number; results: Department[] }>(url);
  return response.results || [];
}

/**
 * Récupère les détails d'un département
 */
export async function getDepartment(id: string): Promise<Department> {
  return apiClient.get<Department>(API_ENDPOINTS.HR.DEPARTMENTS.DETAIL(id));
}

/**
 * Crée un nouveau département
 */
export async function createDepartment(data: DepartmentCreate): Promise<Department> {
  return apiClient.post<Department>(API_ENDPOINTS.HR.DEPARTMENTS.CREATE, data);
}

/**
 * Met à jour un département (PUT)
 */
export async function updateDepartment(id: string, data: DepartmentCreate): Promise<Department> {
  return apiClient.put<Department>(API_ENDPOINTS.HR.DEPARTMENTS.UPDATE(id), data);
}

/**
 * Met à jour partiellement un département (PATCH)
 */
export async function patchDepartment(id: string, data: DepartmentUpdate): Promise<Department> {
  return apiClient.patch<Department>(API_ENDPOINTS.HR.DEPARTMENTS.UPDATE(id), data);
}

/**
 * Active un département
 */
export async function activateDepartment(id: string): Promise<Department> {
  return apiClient.post<Department>(API_ENDPOINTS.HR.DEPARTMENTS.ACTIVATE(id));
}

/**
 * Désactive un département
 */
export async function deactivateDepartment(id: string): Promise<Department> {
  return apiClient.post<Department>(API_ENDPOINTS.HR.DEPARTMENTS.DEACTIVATE(id));
}

/**
 * Supprime un département
 */
export async function deleteDepartment(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.HR.DEPARTMENTS.DELETE(id));
}
