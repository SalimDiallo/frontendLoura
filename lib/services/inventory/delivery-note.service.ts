/**
 * Delivery Note Service - Gestion des bons de livraison
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { DeliveryNote, DeliveryNoteCreate } from '@/lib/types/inventory';

/**
 * Get all delivery notes
 */
export async function getDeliveryNotes(params?: {
  status?: string;
  sale?: string;
}): Promise<DeliveryNote[]> {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.append('status', params.status);
  if (params?.sale) searchParams.append('sale', params.sale);

  const queryString = searchParams.toString();
  const url = queryString 
    ? `${API_ENDPOINTS.INVENTORY.DELIVERY_NOTES.LIST}?${queryString}` 
    : API_ENDPOINTS.INVENTORY.DELIVERY_NOTES.LIST;

  const response = await apiClient.get<{ count: number; results: DeliveryNote[] }>(url);
  return response.results || response as unknown as DeliveryNote[];
}

/**
 * Get a single delivery note
 */
export async function getDeliveryNote(id: string): Promise<DeliveryNote> {
  return apiClient.get<DeliveryNote>(API_ENDPOINTS.INVENTORY.DELIVERY_NOTES.DETAIL(id));
}

/**
 * Create a new delivery note
 */
export async function createDeliveryNote(data: DeliveryNoteCreate): Promise<DeliveryNote> {
  const dataWithOrg = addOrganizationToData(data);
  return apiClient.post<DeliveryNote>(API_ENDPOINTS.INVENTORY.DELIVERY_NOTES.CREATE, dataWithOrg);
}

/**
 * Update a delivery note
 */
export async function updateDeliveryNote(
  id: string,
  data: Partial<DeliveryNoteCreate>
): Promise<DeliveryNote> {
  return apiClient.patch<DeliveryNote>(API_ENDPOINTS.INVENTORY.DELIVERY_NOTES.UPDATE(id), data);
}

/**
 * Delete a delivery note
 */
export async function deleteDeliveryNote(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.INVENTORY.DELIVERY_NOTES.DELETE(id));
}

/**
 * Mark delivery as completed
 */
export async function markDeliveryAsDelivered(id: string): Promise<DeliveryNote> {
  return apiClient.post<DeliveryNote>(API_ENDPOINTS.INVENTORY.DELIVERY_NOTES.MARK_DELIVERED(id), {});
}

/**
 * Get delivery note PDF URL
 */
export function getDeliveryNotePdfUrl(deliveryId: string): string {
  return API_ENDPOINTS.INVENTORY.DELIVERY_NOTES.EXPORT_PDF(deliveryId);
}
