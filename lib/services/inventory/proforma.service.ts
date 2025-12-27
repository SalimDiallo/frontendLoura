/**
 * Proforma Invoice Service - Gestion des factures pro forma
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type {
  ProformaInvoice,
  ProformaCreate,
  ProformaUpdate,
  Sale,
} from '@/lib/types/inventory';

/**
 * Get all proforma invoices
 */
export async function getProformas(params?: {
  status?: string;
  customer?: string;
}): Promise<ProformaInvoice[]> {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.append('status', params.status);
  if (params?.customer) searchParams.append('customer', params.customer);

  const queryString = searchParams.toString();
  const url = queryString 
    ? `${API_ENDPOINTS.INVENTORY.PROFORMAS.LIST}?${queryString}` 
    : API_ENDPOINTS.INVENTORY.PROFORMAS.LIST;

  const response = await apiClient.get<{ count: number; results: ProformaInvoice[] }>(url);
  return response.results || response as unknown as ProformaInvoice[];
}

/**
 * Get a single proforma
 */
export async function getProforma(id: string): Promise<ProformaInvoice> {
  return apiClient.get<ProformaInvoice>(API_ENDPOINTS.INVENTORY.PROFORMAS.DETAIL(id));
}

/**
 * Create a new proforma
 */
export async function createProforma(data: ProformaCreate): Promise<ProformaInvoice> {
  const dataWithOrg = addOrganizationToData(data);
  return apiClient.post<ProformaInvoice>(API_ENDPOINTS.INVENTORY.PROFORMAS.CREATE, dataWithOrg);
}

/**
 * Update a proforma
 */
export async function updateProforma(id: string, data: ProformaUpdate): Promise<ProformaInvoice> {
  return apiClient.patch<ProformaInvoice>(API_ENDPOINTS.INVENTORY.PROFORMAS.UPDATE(id), data);
}

/**
 * Delete a proforma
 */
export async function deleteProforma(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.INVENTORY.PROFORMAS.DELETE(id));
}

/**
 * Convert proforma to sale
 */
export async function convertProformaToSale(
  proformaId: string,
  warehouseId: string
): Promise<{ message: string; sale: Sale }> {
  return apiClient.post<{ message: string; sale: Sale }>(
    API_ENDPOINTS.INVENTORY.PROFORMAS.CONVERT_TO_SALE(proformaId),
    { warehouse: warehouseId }
  );
}

/**
 * Get proforma PDF URL
 */
export function getProformaPdfUrl(proformaId: string): string {
  return API_ENDPOINTS.INVENTORY.PROFORMAS.EXPORT_PDF(proformaId);
}
