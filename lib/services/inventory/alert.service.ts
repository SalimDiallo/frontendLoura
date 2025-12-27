/**
 * Service pour la gestion des alertes
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { Alert, AlertCreate, AlertUpdate } from '@/lib/types/inventory';

/**
 * Liste toutes les alertes
 */
export async function getAlerts(params?: {
  is_resolved?: boolean;
  type?: string;
  severity?: string;
}): Promise<Alert[]> {
  const searchParams = new URLSearchParams();

  if (params?.is_resolved !== undefined) searchParams.append('is_resolved', String(params.is_resolved));
  if (params?.type) searchParams.append('type', params.type);
  if (params?.severity) searchParams.append('severity', params.severity);

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.INVENTORY.ALERTS.LIST}?${queryString}` : API_ENDPOINTS.INVENTORY.ALERTS.LIST;

  const response = await apiClient.get<{ count: number; results: Alert[] }>(url);
  return response.results || [];
}

/**
 * Récupère les détails d'une alerte
 */
export async function getAlert(id: string): Promise<Alert> {
  return apiClient.get<Alert>(API_ENDPOINTS.INVENTORY.ALERTS.DETAIL(id));
}

/**
 * Crée une nouvelle alerte
 */
export async function createAlert(data: AlertCreate): Promise<Alert> {
  const dataWithOrg = addOrganizationToData(data);
  return apiClient.post<Alert>(API_ENDPOINTS.INVENTORY.ALERTS.CREATE, dataWithOrg);
}

/**
 * Met à jour une alerte
 */
export async function updateAlert(id: string, data: AlertUpdate): Promise<Alert> {
  return apiClient.patch<Alert>(API_ENDPOINTS.INVENTORY.ALERTS.UPDATE(id), data);
}

/**
 * Supprime une alerte
 */
export async function deleteAlert(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.INVENTORY.ALERTS.DELETE(id));
}

/**
 * Résout une alerte
 */
export async function resolveAlert(id: string): Promise<Alert> {
  return apiClient.post<Alert>(API_ENDPOINTS.INVENTORY.ALERTS.RESOLVE(id));
}

/**
 * Génère automatiquement les alertes
 */
export async function generateAlerts(): Promise<{ message: string; count: number }> {
  return apiClient.post<{ message: string; count: number }>(API_ENDPOINTS.INVENTORY.ALERTS.GENERATE);
}
