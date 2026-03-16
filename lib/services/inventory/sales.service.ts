/**
 * Sales Service - Gestion des ventes avec remises
 */

import { cacheManager } from '@/lib/offline';
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

  const response = await cacheManager.get<{ count: number; results: SaleList[] }>(url, { ttl: 3 * 60 * 1000 });
  return response.results || response as unknown as SaleList[];
}

/**
 * Get a single sale
 */
export async function getSale(id: string): Promise<Sale> {
  return cacheManager.get<Sale>(API_ENDPOINTS.INVENTORY.SALES.DETAIL(id), { ttl: 5 * 60 * 1000 });
}

/**
 * Create a new sale
 */
export async function createSale(data: SaleCreate): Promise<Sale> {
  console.log(data);
  
  const dataWithOrg = addOrganizationToData(data);
  return cacheManager.post<Sale>(API_ENDPOINTS.INVENTORY.SALES.CREATE, dataWithOrg, {
    invalidateCache: [API_ENDPOINTS.INVENTORY.SALES.LIST, API_ENDPOINTS.INVENTORY.STOCKS.LIST, API_ENDPOINTS.INVENTORY.PRODUCTS.LIST],
  });
}

/**
 * Update a sale
 */
export async function updateSale(id: string, data: SaleUpdate): Promise<Sale> {
  return cacheManager.patch<Sale>(API_ENDPOINTS.INVENTORY.SALES.UPDATE(id), data, {
    invalidateCache: [API_ENDPOINTS.INVENTORY.SALES.LIST, API_ENDPOINTS.INVENTORY.SALES.DETAIL(id)],
  });
}

/**
 * Delete a sale
 */
export async function deleteSale(id: string): Promise<void> {
  return cacheManager.delete(API_ENDPOINTS.INVENTORY.SALES.DELETE(id), {
    invalidateCache: [API_ENDPOINTS.INVENTORY.SALES.LIST],
  });
}

/**
 * Add payment to a sale
 */
export async function addPaymentToSale(
  saleId: string,
  data: { amount: number; payment_method?: string; reference?: string; notes?: string }
): Promise<{ payment: Payment; sale: Sale }> {
  return cacheManager.post<{ payment: Payment; sale: Sale }>(
    API_ENDPOINTS.INVENTORY.SALES.ADD_PAYMENT(saleId),
    data,
    { invalidateCache: [API_ENDPOINTS.INVENTORY.SALES.LIST, API_ENDPOINTS.INVENTORY.SALES.DETAIL(saleId)] }
  );
}

/**
 * Build a full URL for PDF download with organization context and auth token
 */
function buildPdfUrl(endpoint: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  let url = `${baseUrl}${endpoint}`;
  
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams();
    
    // Add organization slug
    const orgSlug = localStorage.getItem('current_organization_slug');
    if (orgSlug) {
      params.append('organization_subdomain', orgSlug);
    }
    
    // Add auth token for download
    const token = localStorage.getItem('access_token');
    if (token) {
      params.append('token', token);
    }
    
    const queryString = params.toString();
    if (queryString) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${queryString}`;
    }
  }
  
  return url;
}

/**
 * Get receipt PDF URL for a sale
 */
export function getSaleReceiptUrl(saleId: string): string {
  return buildPdfUrl(API_ENDPOINTS.INVENTORY.SALES.RECEIPT(saleId));
}

/**
 * Cancel a sale
 */
export async function cancelSale(saleId: string): Promise<Sale> {
  return cacheManager.post<Sale>(API_ENDPOINTS.INVENTORY.SALES.CANCEL(saleId), {}, {
    invalidateCache: [API_ENDPOINTS.INVENTORY.SALES.LIST, API_ENDPOINTS.INVENTORY.SALES.DETAIL(saleId), API_ENDPOINTS.INVENTORY.STOCKS.LIST],
  });
}

/**
 * Get invoice PDF URL for a sale
 */
export function getSaleInvoiceUrl(saleId: string): string {
  return buildPdfUrl(API_ENDPOINTS.INVENTORY.SALES.INVOICE(saleId));
}
