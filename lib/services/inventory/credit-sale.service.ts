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
