/**
 * Customer Service - Gestion des clients
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { Customer, CustomerCreate, CustomerUpdate, SaleList, CreditSale } from '@/lib/types/inventory';

/**
 * Get all customers
 */
export async function getCustomers(params?: {
  is_active?: boolean;
  search?: string;
}): Promise<Customer[]> {
  const searchParams = new URLSearchParams();

  if (params?.is_active !== undefined) searchParams.append('is_active', String(params.is_active));
  if (params?.search) searchParams.append('search', params.search);

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.INVENTORY.CUSTOMERS.LIST}?${queryString}` : API_ENDPOINTS.INVENTORY.CUSTOMERS.LIST;

  const response = await apiClient.get<{ count: number; results: Customer[] }>(url);
  return response.results || response as unknown as Customer[];
}

/**
 * Get a single customer
 */
export async function getCustomer(id: string): Promise<Customer> {
  return apiClient.get<Customer>(API_ENDPOINTS.INVENTORY.CUSTOMERS.DETAIL(id));
}

/**
 * Create a new customer
 */
export async function createCustomer(data: CustomerCreate): Promise<Customer> {
  const dataWithOrg = addOrganizationToData(data);
  return apiClient.post<Customer>(API_ENDPOINTS.INVENTORY.CUSTOMERS.CREATE, dataWithOrg);
}

/**
 * Update a customer
 */
export async function updateCustomer(id: string, data: CustomerUpdate): Promise<Customer> {
  return apiClient.patch<Customer>(API_ENDPOINTS.INVENTORY.CUSTOMERS.UPDATE(id), data);
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.INVENTORY.CUSTOMERS.DELETE(id));
}

/**
 * Get sales history for a customer
 */
export async function getCustomerSalesHistory(customerId: string): Promise<SaleList[]> {
  return apiClient.get<SaleList[]>(API_ENDPOINTS.INVENTORY.CUSTOMERS.SALES_HISTORY(customerId));
}

/**
 * Get credit history for a customer
 */
export async function getCustomerCreditHistory(customerId: string): Promise<CreditSale[]> {
  return apiClient.get<CreditSale[]>(API_ENDPOINTS.INVENTORY.CUSTOMERS.CREDIT_HISTORY(customerId));
}
