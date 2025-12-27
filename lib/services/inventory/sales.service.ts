/**
 * Sales Service - Gestion des ventes avec remises
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type {
  Sale,
  SaleList,
  SaleCreate,
  SaleUpdate,
  Payment,
} from '@/lib/types/inventory';

/**
 * Get all sales
 */
export async function getSales(params?: {
  payment_status?: string;
  customer?: string;
  start_date?: string;
  end_date?: string;
  is_credit?: boolean;
}): Promise<SaleList[]> {
  const searchParams = new URLSearchParams();

  if (params?.payment_status) searchParams.append('payment_status', params.payment_status);
  if (params?.customer) searchParams.append('customer', params.customer);
  if (params?.start_date) searchParams.append('start_date', params.start_date);
  if (params?.end_date) searchParams.append('end_date', params.end_date);
  if (params?.is_credit !== undefined) searchParams.append('is_credit', String(params.is_credit));

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.INVENTORY.SALES.LIST}?${queryString}` : API_ENDPOINTS.INVENTORY.SALES.LIST;

  const response = await apiClient.get<{ count: number; results: SaleList[] }>(url);
  return response.results || response as unknown as SaleList[];
}

/**
 * Get a single sale
 */
export async function getSale(id: string): Promise<Sale> {
  return apiClient.get<Sale>(API_ENDPOINTS.INVENTORY.SALES.DETAIL(id));
}

/**
 * Create a new sale
 */
export async function createSale(data: SaleCreate): Promise<Sale> {
  const dataWithOrg = addOrganizationToData(data);
  return apiClient.post<Sale>(API_ENDPOINTS.INVENTORY.SALES.CREATE, dataWithOrg);
}

/**
 * Update a sale
 */
export async function updateSale(id: string, data: SaleUpdate): Promise<Sale> {
  return apiClient.patch<Sale>(API_ENDPOINTS.INVENTORY.SALES.UPDATE(id), data);
}

/**
 * Delete a sale
 */
export async function deleteSale(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.INVENTORY.SALES.DELETE(id));
}

/**
 * Add payment to a sale
 */
export async function addPaymentToSale(
  saleId: string,
  data: { amount: number; payment_method?: string; reference?: string; notes?: string }
): Promise<{ payment: Payment; sale: Sale }> {
  return apiClient.post<{ payment: Payment; sale: Sale }>(
    API_ENDPOINTS.INVENTORY.SALES.ADD_PAYMENT(saleId),
    data
  );
}

/**
 * Get receipt PDF URL for a sale
 */
export function getSaleReceiptUrl(saleId: string): string {
  return API_ENDPOINTS.INVENTORY.SALES.RECEIPT(saleId);
}

/**
 * Cancel a sale
 */
export async function cancelSale(saleId: string): Promise<Sale> {
  return apiClient.post<Sale>(API_ENDPOINTS.INVENTORY.SALES.CANCEL(saleId), {});
}
