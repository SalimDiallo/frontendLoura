/**
 * Service pour la gestion des permissions
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Permission } from '@/lib/types/hr';

/**
 * Liste toutes les permissions disponibles
 */
export async function getPermissions(): Promise<Permission[]> {
  const response = await apiClient.get<{ count: number; results: Permission[] }>(API_ENDPOINTS.HR.PERMISSIONS.LIST);
  return response.results || [];
}

/**
 * Récupère les détails d'une permission
 */
export async function getPermission(id: string): Promise<Permission> {
  return apiClient.get<Permission>(API_ENDPOINTS.HR.PERMISSIONS.DETAIL(id));
}
