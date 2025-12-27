/**
 * Service pour la gestion des mouvements de stock
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { Movement, MovementCreate, MovementUpdate } from '@/lib/types/inventory';

/**
 * Liste tous les mouvements
 */
export async function getMovements(params?: {
  type?: string;
  warehouse?: string;
  product?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Movement[]> {
  const searchParams = new URLSearchParams();

  if (params?.type) searchParams.append('type', params.type);
  if (params?.warehouse) searchParams.append('warehouse', params.warehouse);
  if (params?.product) searchParams.append('product', params.product);
  if (params?.start_date) searchParams.append('start_date', params.start_date);
  if (params?.end_date) searchParams.append('end_date', params.end_date);

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.INVENTORY.MOVEMENTS.LIST}?${queryString}` : API_ENDPOINTS.INVENTORY.MOVEMENTS.LIST;

  const response = await apiClient.get<{ count: number; results: Movement[] }>(url);
  return response.results || [];
}

/**
 * Récupère les détails d'un mouvement
 */
export async function getMovement(id: string): Promise<Movement> {
  return apiClient.get<Movement>(API_ENDPOINTS.INVENTORY.MOVEMENTS.DETAIL(id));
}

/**
 * Crée un nouveau mouvement
 * Note: L'organization est automatiquement ajoutée par le backend
 */
export async function createMovement(data: MovementCreate): Promise<Movement> {
  return apiClient.post<Movement>(API_ENDPOINTS.INVENTORY.MOVEMENTS.CREATE, data);
}

/**
 * Met à jour un mouvement
 */
export async function updateMovement(id: string, data: MovementUpdate): Promise<Movement> {
  return apiClient.patch<Movement>(API_ENDPOINTS.INVENTORY.MOVEMENTS.UPDATE(id), data);
}

/**
 * Supprime un mouvement
 */
export async function deleteMovement(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.INVENTORY.MOVEMENTS.DELETE(id));
}
