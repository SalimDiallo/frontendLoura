/**
 * Service pour la gestion des employés
 */

import { cacheManager } from '@/lib/offline';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  Employee,
  EmployeeCreate,
  EmployeeListResponse,
  EmployeeUpdate,
} from '@/lib/types/hr';

/**
 * Liste tous les employés d'une organisation
 * @param organizationSlug - Le subdomain de l'organisation (obligatoire)
 * @param params - Paramètres de filtrage optionnels
 */
export async function getEmployees(
  organizationSlug: string,
  params?: {
    search?: string;
    department?: string;
    role?: string;
    employment_status?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }
): Promise<EmployeeListResponse> {
  try {
    const searchParams = new URLSearchParams();

    // IMPORTANT: Ajouter le subdomain de l'organisation pour filtrer côté backend
    searchParams.append('organization_subdomain', organizationSlug);

    if (params?.search) searchParams.append('search', params.search);
    if (params?.department) searchParams.append('department', params.department);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.employment_status) searchParams.append('employment_status', params.employment_status);
    if (params?.is_active !== undefined) searchParams.append('is_active', String(params.is_active));
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.page_size) searchParams.append('page_size', String(params.page_size));

    const queryString = searchParams.toString();
    const url = `${API_ENDPOINTS.HR.EMPLOYEES.LIST}?${queryString}`;

    console.log('Fetching employees for organization:', organizationSlug);
    return await cacheManager.get<EmployeeListResponse>(url, { ttl: 5 * 60 * 1000 });
  } catch (error) {
    console.error('Error fetching employees:', error);
    // Retourner une réponse vide en cas d'erreur
    return {
      count: 0,
      next: undefined,
      previous: undefined,
      results: [],
    };
  }
}

/**
 * Récupère les détails d'un employé
 */
export async function getEmployee(id: string): Promise<Employee> {
  return cacheManager.get<Employee>(API_ENDPOINTS.HR.EMPLOYEES.DETAIL(id), { ttl: 10 * 60 * 1000 });
}

/**
 * Crée un nouveau employé
 */
export async function createEmployee(data: EmployeeCreate): Promise<Employee> {
  return cacheManager.post<Employee>(API_ENDPOINTS.HR.EMPLOYEES.CREATE, data, {
    invalidateCache: [API_ENDPOINTS.HR.EMPLOYEES.LIST],
  });
}

/**
 * Met à jour un employé (PUT)
 */
export async function updateEmployee(id: string, data: EmployeeCreate): Promise<Employee> {
  return cacheManager.put<Employee>(API_ENDPOINTS.HR.EMPLOYEES.UPDATE(id), data, {
    invalidateCache: [API_ENDPOINTS.HR.EMPLOYEES.LIST, API_ENDPOINTS.HR.EMPLOYEES.DETAIL(id)],
  });
}

/**
 * Met à jour partiellement un employé (PATCH)
 */
export async function patchEmployee(id: string, data: EmployeeUpdate): Promise<Employee> {
  return cacheManager.patch<Employee>(API_ENDPOINTS.HR.EMPLOYEES.UPDATE(id), data, {
    invalidateCache: [API_ENDPOINTS.HR.EMPLOYEES.LIST, API_ENDPOINTS.HR.EMPLOYEES.DETAIL(id)],
  });
}

/**
 * Active un employé
 */
export async function activateEmployee(id: string): Promise<Employee> {
  return cacheManager.post<Employee>(API_ENDPOINTS.HR.EMPLOYEES.ACTIVATE(id), undefined, {
    invalidateCache: [API_ENDPOINTS.HR.EMPLOYEES.LIST, API_ENDPOINTS.HR.EMPLOYEES.DETAIL(id)],
  });
}

/**
 * Désactive un employé
 */
export async function deactivateEmployee(id: string): Promise<Employee> {
  return cacheManager.post<Employee>(API_ENDPOINTS.HR.EMPLOYEES.DEACTIVATE(id), undefined, {
    invalidateCache: [API_ENDPOINTS.HR.EMPLOYEES.LIST, API_ENDPOINTS.HR.EMPLOYEES.DETAIL(id)],
  });
}

/**
 * Supprime un employé (soft delete)
 */
export async function deleteEmployee(id: string): Promise<void> {
  return cacheManager.delete(API_ENDPOINTS.HR.EMPLOYEES.DELETE(id), {
    invalidateCache: [API_ENDPOINTS.HR.EMPLOYEES.LIST],
  });
}

/**
 * Récupère les informations de l'employé actuellement connecté
 */
export async function getCurrentEmployee(): Promise<Employee> {
  return cacheManager.get<Employee>(API_ENDPOINTS.AUTH.ME, { ttl: 2 * 60 * 1000 });
}
