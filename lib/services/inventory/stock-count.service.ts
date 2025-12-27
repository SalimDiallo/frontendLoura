/**
 * Service pour la gestion des inventaires physiques
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { addOrganizationToData } from '@/lib/utils/organization';
import type { StockCount, StockCountCreate, StockCountUpdate, StockCountItem, StockCountItemCreate } from '@/lib/types/inventory';

// ============================================
// Types pour les réponses des nouvelles actions
// ============================================

export interface GenerateItemsOptions {
  include_zero_stock?: boolean;
  category_id?: string;
  overwrite?: boolean;
}

export interface GenerateItemsResponse {
  stock_count: StockCount;
  items_created: number;
  items_skipped: number;
  total_items: number;
  message: string;
}

export interface AutoFillResponse {
  stock_count: StockCount;
  items_updated: number;
  message: string;
}

export interface DiscrepancyItem {
  id: string;
  product: string;
  product_name: string;
  product_sku: string;
  expected_quantity: number;
  counted_quantity: number;
  difference: number;
  difference_value: number;
  notes?: string;
}

export interface DiscrepanciesResponse {
  count_number: string;
  warehouse_name: string;
  status: string;
  discrepancy_count: number;
  total_surplus: number;
  total_deficit: number;
  total_value_impact: number;
  items: DiscrepancyItem[];
}

export interface StockCountSummary {
  count_number: string;
  warehouse_name: string;
  count_date: string;
  status: string;
  status_display: string;
  notes?: string;
  statistics: {
    total_items: number;
    items_matched: number;
    items_with_discrepancy: number;
    items_surplus: number;
    items_deficit: number;
    match_rate: number;
  };
  quantities: {
    total_expected: number;
    total_counted: number;
    net_difference: number;
  };
  values: {
    total_expected_value: number;
    total_counted_value: number;
    value_difference: number;
  };
  created_at: string;
  updated_at: string;
}

// ============================================
// Fonctions CRUD de base
// ============================================

/**
 * Liste tous les inventaires
 */
export async function getStockCounts(params?: {
  warehouse?: string;
  status?: string;
}): Promise<StockCount[]> {
  const searchParams = new URLSearchParams();

  if (params?.warehouse) searchParams.append('warehouse', params.warehouse);
  if (params?.status) searchParams.append('status', params.status);

  const queryString = searchParams.toString();
  const url = queryString ? `${API_ENDPOINTS.INVENTORY.STOCK_COUNTS.LIST}?${queryString}` : API_ENDPOINTS.INVENTORY.STOCK_COUNTS.LIST;

  const response = await apiClient.get<{ count: number; results: StockCount[] }>(url);
  return response.results || [];
}

/**
 * Récupère les détails d'un inventaire
 */
export async function getStockCount(id: string): Promise<StockCount> {
  return apiClient.get<StockCount>(API_ENDPOINTS.INVENTORY.STOCK_COUNTS.DETAIL(id));
}

/**
 * Crée un nouvel inventaire
 */
export async function createStockCount(data: StockCountCreate): Promise<StockCount> {
  const dataWithOrg = addOrganizationToData(data);
  return apiClient.post<StockCount>(API_ENDPOINTS.INVENTORY.STOCK_COUNTS.CREATE, dataWithOrg);
}

/**
 * Met à jour un inventaire
 */
export async function updateStockCount(id: string, data: StockCountUpdate): Promise<StockCount> {
  return apiClient.patch<StockCount>(API_ENDPOINTS.INVENTORY.STOCK_COUNTS.UPDATE(id), data);
}

/**
 * Supprime un inventaire
 */
export async function deleteStockCount(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.INVENTORY.STOCK_COUNTS.DELETE(id));
}

// ============================================
// Actions de workflow
// ============================================

/**
 * Démarre un inventaire
 */
export async function startStockCount(id: string): Promise<StockCount> {
  return apiClient.post<StockCount>(API_ENDPOINTS.INVENTORY.STOCK_COUNTS.START(id));
}

/**
 * Complète un inventaire
 */
export async function completeStockCount(id: string): Promise<StockCount> {
  return apiClient.post<StockCount>(API_ENDPOINTS.INVENTORY.STOCK_COUNTS.COMPLETE(id));
}

/**
 * Valide un inventaire et applique les ajustements
 */
export async function validateStockCount(id: string): Promise<StockCount> {
  return apiClient.post<StockCount>(API_ENDPOINTS.INVENTORY.STOCK_COUNTS.VALIDATE(id));
}

/**
 * Annule un inventaire
 */
export async function cancelStockCount(id: string): Promise<StockCount> {
  return apiClient.post<StockCount>(API_ENDPOINTS.INVENTORY.STOCK_COUNTS.CANCEL(id));
}

// ============================================
// Actions automatisées
// ============================================

/**
 * Génère automatiquement tous les articles d'inventaire à partir du stock de l'entrepôt
 * @param id - ID de l'inventaire
 * @param options - Options de génération
 * @returns Résultat de la génération avec nombre d'articles créés
 */
export async function generateStockCountItems(
  id: string,
  options: GenerateItemsOptions = {}
): Promise<GenerateItemsResponse> {
  return apiClient.post<GenerateItemsResponse>(
    API_ENDPOINTS.INVENTORY.STOCK_COUNTS.GENERATE_ITEMS(id),
    options
  );
}

/**
 * Pré-remplit automatiquement les quantités comptées avec les quantités attendues
 * Utile pour les inventaires de contrôle rapide
 * @param id - ID de l'inventaire
 * @returns Résultat avec nombre d'articles mis à jour
 */
export async function autoFillStockCounts(id: string): Promise<AutoFillResponse> {
  return apiClient.post<AutoFillResponse>(
    API_ENDPOINTS.INVENTORY.STOCK_COUNTS.AUTO_FILL_COUNTS(id)
  );
}

/**
 * Récupère uniquement les articles avec des écarts
 * @param id - ID de l'inventaire
 * @returns Liste des articles avec écarts et statistiques
 */
export async function getStockCountDiscrepancies(id: string): Promise<DiscrepanciesResponse> {
  return apiClient.get<DiscrepanciesResponse>(
    API_ENDPOINTS.INVENTORY.STOCK_COUNTS.DISCREPANCIES(id)
  );
}

/**
 * Récupère un résumé complet de l'inventaire avec statistiques détaillées
 * @param id - ID de l'inventaire
 * @returns Résumé avec statistiques, quantités et valeurs
 */
export async function getStockCountSummary(id: string): Promise<StockCountSummary> {
  return apiClient.get<StockCountSummary>(
    API_ENDPOINTS.INVENTORY.STOCK_COUNTS.SUMMARY(id)
  );
}

// ============================================
// Stock Count Items
// ============================================

/**
 * Liste les articles d'un inventaire
 */
export async function getStockCountItems(countId: string): Promise<StockCountItem[]> {
  const response = await apiClient.get<{ count: number; results: StockCountItem[] }>(
    API_ENDPOINTS.INVENTORY.STOCK_COUNTS.ITEMS.LIST(countId)
  );
  return response.results || [];
}

/**
 * Ajoute un article à un inventaire
 */
export async function addStockCountItem(
  countId: string,
  data: StockCountItemCreate
): Promise<StockCountItem> {
  return apiClient.post<StockCountItem>(
    API_ENDPOINTS.INVENTORY.STOCK_COUNTS.ITEMS.CREATE(countId),
    data
  );
}

/**
 * Met à jour un article d'inventaire
 */
export async function updateStockCountItem(
  countId: string,
  itemId: string,
  data: Partial<StockCountItemCreate>
): Promise<StockCountItem> {
  return apiClient.patch<StockCountItem>(
    API_ENDPOINTS.INVENTORY.STOCK_COUNTS.ITEMS.UPDATE(countId, itemId),
    data
  );
}

/**
 * Supprime un article d'un inventaire
 */
export async function deleteStockCountItem(
  countId: string,
  itemId: string
): Promise<void> {
  return apiClient.delete<void>(
    API_ENDPOINTS.INVENTORY.STOCK_COUNTS.ITEMS.DELETE(countId, itemId)
  );
}

/**
 * Met à jour plusieurs articles d'inventaire en batch
 */
export async function batchUpdateStockCountItems(
  countId: string,
  updates: Array<{ itemId: string; counted_quantity: number; notes?: string }>
): Promise<StockCountItem[]> {
  const promises = updates.map(({ itemId, ...data }) =>
    updateStockCountItem(countId, itemId, data)
  );
  return Promise.all(promises);
}

/**
 * Exporte un inventaire en PDF
 */
export async function exportStockCountPdf(id: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('access_token');
  const orgSlug = localStorage.getItem('current_organization_slug');
  
  let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${API_ENDPOINTS.INVENTORY.STOCK_COUNTS.EXPORT_PDF(id)}`;
  
  if (orgSlug) {
    url += `?organization_subdomain=${orgSlug}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `inventaire_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw error;
  }
}

