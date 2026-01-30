/**
 * Credit Sale Service - Gestion des ventes à crédit
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  CreditSale,
  CreditPayment,
  CreditPaymentCreate,
  CreditSaleSummary,
} from '@/lib/types/inventory';

/**
 * Get all credit sales
 */
export async function getCreditSales(params?: {
  status?: string;
  customer?: string;
  overdue?: boolean;
}): Promise<CreditSale[]> {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.append('status', params.status);
  if (params?.customer) searchParams.append('customer', params.customer);
  if (params?.overdue !== undefined) searchParams.append('overdue', String(params.overdue));

  const queryString = searchParams.toString();
  const url = queryString 
    ? `${API_ENDPOINTS.INVENTORY.CREDIT_SALES.LIST}?${queryString}` 
    : API_ENDPOINTS.INVENTORY.CREDIT_SALES.LIST;

  const response = await apiClient.get<{ count: number; results: CreditSale[] }>(url);
  return response.results || response as unknown as CreditSale[];
}

/**
 * Get a single credit sale
 */
export async function getCreditSale(id: string): Promise<CreditSale> {
  return apiClient.get<CreditSale>(API_ENDPOINTS.INVENTORY.CREDIT_SALES.DETAIL(id));
}

/**
 * Add payment to credit sale
 */
export async function addCreditPayment(
  creditSaleId: string,
  data: CreditPaymentCreate
): Promise<{ payment: CreditPayment; credit_sale: CreditSale }> {
  return apiClient.post<{ payment: CreditPayment; credit_sale: CreditSale }>(
    API_ENDPOINTS.INVENTORY.CREDIT_SALES.ADD_PAYMENT(creditSaleId),
    data
  );
}

/**
 * Send reminder for credit sale
 */
export async function sendCreditReminder(
  creditSaleId: string
): Promise<{ message: string; credit_sale: CreditSale }> {
  return apiClient.post<{ message: string; credit_sale: CreditSale }>(
    API_ENDPOINTS.INVENTORY.CREDIT_SALES.SEND_REMINDER(creditSaleId),
    {}
  );
}

/**
 * Get credit sales summary
 */
export async function getCreditSalesSummary(): Promise<CreditSaleSummary> {
  return apiClient.get<CreditSaleSummary>(API_ENDPOINTS.INVENTORY.CREDIT_SALES.SUMMARY);
}

/**
 * Get overdue credit sales
 */
export async function getOverdueCreditSales(): Promise<CreditSale[]> {
  return getCreditSales({ overdue: true });
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
 * Get credit sale statement PDF URL
 */
export function getCreditSaleStatementUrl(creditSaleId: string): string {
  return buildPdfUrl(API_ENDPOINTS.INVENTORY.CREDIT_SALES.EXPORT_PDF(creditSaleId));
}

/**
 * Get credit sale invoice PDF URL
 */
export function getCreditSaleInvoiceUrl(creditSaleId: string): string {
  return buildPdfUrl(API_ENDPOINTS.INVENTORY.CREDIT_SALES.INVOICE(creditSaleId));
}
