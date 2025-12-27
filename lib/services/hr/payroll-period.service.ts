/**
 * Service pour la gestion des périodes de paie
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  PayrollPeriod,
  PayrollPeriodCreate,
  PayrollPeriodUpdate,
  PayrollPeriodListResponse,
} from '@/lib/types/hr';

/**
 * Liste toutes les périodes de paie d'une organisation
 */
export async function getPayrollPeriods(
  organizationSlug: string,
  params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }
): Promise<PayrollPeriodListResponse> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.append('organization_subdomain', organizationSlug);

    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.page_size) searchParams.append('page_size', String(params.page_size));

    const queryString = searchParams.toString();
    const url = `${API_ENDPOINTS.HR.PAYROLL_PERIODS.LIST}?${queryString}`;

    return await apiClient.get<PayrollPeriodListResponse>(url);
  } catch (error) {
    console.error('Error fetching payroll periods:', error);
    return {
      count: 0,
      next: undefined,
      previous: undefined,
      results: [],
    };
  }
}

/**
 * Récupère les détails d'une période de paie
 */
export async function getPayrollPeriod(id: string): Promise<PayrollPeriod> {
  return apiClient.get<PayrollPeriod>(API_ENDPOINTS.HR.PAYROLL_PERIODS.DETAIL(id));
}

/**
 * Crée une nouvelle période de paie
 */
export async function createPayrollPeriod(organizationSlug: string, data: PayrollPeriodCreate): Promise<PayrollPeriod> {
  // Nettoyer les champs vides pour éviter les erreurs de validation
  const cleanedData: any = {
    name: data.name,
    start_date: data.start_date,
    end_date: data.end_date,
  };

  // Ajouter payment_date seulement s'il est défini
  if (data.payment_date && data.payment_date.trim() !== '') {
    cleanedData.payment_date = data.payment_date;
  }

  // Ajouter l'organization_subdomain dans l'URL comme query param
  const url = `${API_ENDPOINTS.HR.PAYROLL_PERIODS.CREATE}?organization_subdomain=${organizationSlug}`;
  return apiClient.post<PayrollPeriod>(url, cleanedData);
}

/**
 * Met à jour une période de paie
 */
export async function updatePayrollPeriod(id: string, data: PayrollPeriodUpdate): Promise<PayrollPeriod> {
  // Nettoyer les champs vides pour éviter les erreurs de validation
  const cleanedData: any = { ...data };

  // Supprimer payment_date s'il est vide
  if (cleanedData.payment_date === '') {
    delete cleanedData.payment_date;
  }

  return apiClient.patch<PayrollPeriod>(API_ENDPOINTS.HR.PAYROLL_PERIODS.UPDATE(id), cleanedData);
}

/**
 * Supprime une période de paie
 */
export async function deletePayrollPeriod(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.HR.PAYROLL_PERIODS.DELETE(id));
}
