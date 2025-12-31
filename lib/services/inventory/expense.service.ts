/**
 * Expense Service - Gestion des dépenses
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type {
  Expense,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseCategory,
  ExpenseCategoryCreate,
  ExpenseSummary,
} from '@/lib/types/inventory';

// ============================================
// Expense Categories
// ============================================

/**
 * Get all expense categories
 */
export async function getExpenseCategories(params?: {
  is_active?: boolean;
}): Promise<ExpenseCategory[]> {
  const searchParams = new URLSearchParams();
  if (params?.is_active !== undefined) searchParams.append('is_active', String(params.is_active));

  const queryString = searchParams.toString();
  const url = queryString 
    ? `${API_ENDPOINTS.INVENTORY.EXPENSE_CATEGORIES.LIST}?${queryString}` 
    : API_ENDPOINTS.INVENTORY.EXPENSE_CATEGORIES.LIST;

  const response = await apiClient.get<{ count: number; results: ExpenseCategory[] }>(url);
  return response.results || response as unknown as ExpenseCategory[];
}

/**
 * Create expense category
 */
export async function createExpenseCategory(data: ExpenseCategoryCreate): Promise<ExpenseCategory> {
  const dataWithOrg = addOrganizationToData(data);
  return apiClient.post<ExpenseCategory>(API_ENDPOINTS.INVENTORY.EXPENSE_CATEGORIES.CREATE, dataWithOrg);
}

/**
 * Update expense category
 */
export async function updateExpenseCategory(
  id: string,
  data: Partial<ExpenseCategoryCreate>
): Promise<ExpenseCategory> {
  return apiClient.patch<ExpenseCategory>(API_ENDPOINTS.INVENTORY.EXPENSE_CATEGORIES.UPDATE(id), data);
}

/**
 * Delete expense category
 */
export async function deleteExpenseCategory(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.INVENTORY.EXPENSE_CATEGORIES.DELETE(id));
}

// ============================================
// Expenses
// ============================================

/**
 * Get all expenses
 */
export async function getExpenses(params?: {
  category?: string;
  start_date?: string;
  end_date?: string;
  payment_method?: string;
}): Promise<Expense[]> {
  const searchParams = new URLSearchParams();

  if (params?.category) searchParams.append('category', params.category);
  if (params?.start_date) searchParams.append('start_date', params.start_date);
  if (params?.end_date) searchParams.append('end_date', params.end_date);
  if (params?.payment_method) searchParams.append('payment_method', params.payment_method);

  const queryString = searchParams.toString();
  const url = queryString 
    ? `${API_ENDPOINTS.INVENTORY.EXPENSES.LIST}?${queryString}` 
    : API_ENDPOINTS.INVENTORY.EXPENSES.LIST;

  const response = await apiClient.get<{ count: number; results: Expense[] }>(url);
  return response.results || response as unknown as Expense[];
}

/**
 * Get a single expense
 */
export async function getExpense(id: string): Promise<Expense> {
  return apiClient.get<Expense>(API_ENDPOINTS.INVENTORY.EXPENSES.DETAIL(id));
}

/**
 * Create a new expense
 */
export async function createExpense(data: ExpenseCreate): Promise<Expense> {
  const dataWithOrg = addOrganizationToData(data);
  return apiClient.post<Expense>(API_ENDPOINTS.INVENTORY.EXPENSES.CREATE, dataWithOrg);
}

/**
 * Update an expense
 */
export async function updateExpense(id: string, data: ExpenseUpdate): Promise<Expense> {
  return apiClient.patch<Expense>(API_ENDPOINTS.INVENTORY.EXPENSES.UPDATE(id), data);
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.INVENTORY.EXPENSES.DELETE(id));
}

/**
 * Get expense summary
 */
export async function getExpenseSummary(): Promise<ExpenseSummary> {
  return apiClient.get<ExpenseSummary>(API_ENDPOINTS.INVENTORY.EXPENSES.SUMMARY);
}

/**
 * Get expenses export URL
 */
export function getExpensesExportUrl(format: 'pdf' | 'excel' = 'pdf'): string {
  return `${API_ENDPOINTS.INVENTORY.EXPENSES.EXPORT}?format=${format}`;
}

/**
 * Download expenses PDF with filters
 */
export async function downloadExpensesPdf(params?: {
  category?: string;
  start_date?: string;
  end_date?: string;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('access_token');
  const orgSlug = localStorage.getItem('current_organization_slug');
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  let url = `${baseUrl}${API_ENDPOINTS.INVENTORY.EXPENSES.EXPORT}`;
  
  // Build query params
  const queryParams = new URLSearchParams();
  if (orgSlug) queryParams.append('organization_subdomain', orgSlug);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  
  const queryString = queryParams.toString();
  if (queryString) url += `?${queryString}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Organization-Slug': orgSlug || '',
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur lors du téléchargement: ${response.statusText}`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `depenses_${dateStr}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Get expenses PDF blob for preview
 */
export async function getExpensesPdfBlob(params?: {
  category?: string;
  start_date?: string;
  end_date?: string;
}): Promise<string> {
  if (typeof window === 'undefined') return '';

  const token = localStorage.getItem('access_token');
  const orgSlug = localStorage.getItem('current_organization_slug');
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  let url = `${baseUrl}${API_ENDPOINTS.INVENTORY.EXPENSES.EXPORT}`;
  
  // Build query params
  const queryParams = new URLSearchParams();
  if (orgSlug) queryParams.append('organization_subdomain', orgSlug);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  
  const queryString = queryParams.toString();
  if (queryString) url += `?${queryString}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Organization-Slug': orgSlug || '',
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur lors du chargement du PDF: ${response.statusText}`);
  }

  const blob = await response.blob();
  return window.URL.createObjectURL(blob);
}
