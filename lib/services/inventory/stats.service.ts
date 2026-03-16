/**
 * Service pour les statistiques d'inventaire et rapports
 */

import { cacheManager } from '@/lib/offline';
import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from '@/lib/api/config';
import type {
  InventoryStats,
  TopProduct,
  WarehouseStockReport,
  CategoryStockReport,
  MovementHistoryResponse,
  LowRotationProductsResponse,
  StockCountsSummaryResponse,
  FinancialAnalysisResponse,
  ABCAnalysisResponse,
  CreditsReportResponse,
  SalesPerformanceResponse,
} from '@/lib/types/inventory';

/**
 * Récupère les statistiques générales de l'inventaire
 */
export async function getInventoryOverview(): Promise<InventoryStats> {
  return cacheManager.get<InventoryStats>(API_ENDPOINTS.INVENTORY.STATS.OVERVIEW, { ttl: 10 * 60 * 1000 });
}

/**
 * Récupère les produits avec la plus grande valeur de stock
 */
export async function getTopProducts(): Promise<TopProduct[]> {
  return cacheManager.get<TopProduct[]>(API_ENDPOINTS.INVENTORY.STATS.TOP_PRODUCTS, { ttl: 15 * 60 * 1000 });
}

/**
 * Récupère la répartition du stock par entrepôt
 */
export async function getStockByWarehouse(): Promise<WarehouseStockReport[]> {
  return cacheManager.get<WarehouseStockReport[]>(API_ENDPOINTS.INVENTORY.STATS.STOCK_BY_WAREHOUSE, { ttl: 15 * 60 * 1000 });
}

/**
 * Récupère la répartition du stock par catégorie
 */
export async function getStockByCategory(): Promise<CategoryStockReport[]> {
  return cacheManager.get<CategoryStockReport[]>(API_ENDPOINTS.INVENTORY.STATS.STOCK_BY_CATEGORY, { ttl: 15 * 60 * 1000 });
}

/**
 * Récupère l'historique des mouvements agrégé par jour
 */
export async function getMovementHistory(days: number = 30): Promise<MovementHistoryResponse> {
  return cacheManager.get<MovementHistoryResponse>(
    `${API_ENDPOINTS.INVENTORY.STATS.MOVEMENT_HISTORY}?days=${days}`,
    { ttl: 10 * 60 * 1000 }
  );
}

/**
 * Récupère les produits à faible rotation (stock dormant)
 */
export async function getLowRotationProducts(
  days: number = 90, 
  limit: number = 20
): Promise<LowRotationProductsResponse> {
  return cacheManager.get<LowRotationProductsResponse>(
    `${API_ENDPOINTS.INVENTORY.STATS.LOW_ROTATION_PRODUCTS}?days=${days}&limit=${limit}`,
    { ttl: 30 * 60 * 1000 }
  );
}

/**
 * Récupère le résumé des inventaires récents
 */
export async function getStockCountsSummary(
  limit: number = 10
): Promise<StockCountsSummaryResponse> {
  return cacheManager.get<StockCountsSummaryResponse>(
    `${API_ENDPOINTS.INVENTORY.STATS.STOCK_COUNTS_SUMMARY}?limit=${limit}`,
    { ttl: 15 * 60 * 1000 }
  );
}

/**
 * Construit l'URL complète avec authentification et organization
 */
function buildExportUrl(endpoint: string, params?: Record<string, string | number>): string {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) 
    : null;
  const orgSlug = typeof window !== 'undefined' 
    ? localStorage.getItem('current_organization_slug') 
    : null;

  let url = `${API_CONFIG.baseURL}${endpoint}`;
  
  // Construire les query params
  const queryParams = new URLSearchParams();
  
  if (orgSlug) {
    queryParams.append('organization_subdomain', orgSlug);
  }
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
  }
  
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
}

/**
 * Télécharge un fichier CSV via fetch avec authentification
 */
async function downloadCsvFile(endpoint: string, filename: string, params?: Record<string, string | number>): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const orgSlug = localStorage.getItem('current_organization_slug');
  
  let url = `${API_CONFIG.baseURL}${endpoint}`;
  
  // Construire les query params
  const queryParams = new URLSearchParams();
  
  if (orgSlug) {
    queryParams.append('organization_subdomain', orgSlug);
  }
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
  }
  
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
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

    // Récupérer le blob et créer un lien de téléchargement
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL du blob
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    throw error;
  }
}

/**
 * Télécharge l'export CSV de la liste des stocks
 */
export async function downloadStockListExport(): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  await downloadCsvFile(
    API_ENDPOINTS.INVENTORY.STATS.EXPORT_STOCK_LIST,
    `stock_list_${date}.csv`
  );
}

/**
 * Télécharge l'export CSV des mouvements
 */
export async function downloadMovementsExport(days: number = 30): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  await downloadCsvFile(
    API_ENDPOINTS.INVENTORY.STATS.EXPORT_MOVEMENTS,
    `movements_${days}days_${date}.csv`,
    { days }
  );
}

/**
 * Télécharge l'export CSV des alertes
 */
export async function downloadAlertsExport(): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  await downloadCsvFile(
    API_ENDPOINTS.INVENTORY.STATS.EXPORT_ALERTS,
    `alerts_${date}.csv`
  );
}

/**
 * Télécharge un fichier PDF via fetch avec authentification
 */
async function downloadPdfFile(
  endpoint: string, 
  filename: string, 
  params?: Record<string, string | number>,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const orgSlug = localStorage.getItem('current_organization_slug');
  
  let url = `${API_CONFIG.baseURL}${endpoint}`;
  
  // Construire les query params
  const queryParams = new URLSearchParams();
  
  if (orgSlug) {
    queryParams.append('organization_subdomain', orgSlug);
  }
  
  if (params && method === 'GET') {
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
  }
  
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
    };

    if (method === 'POST' && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors du téléchargement: ${response.statusText} - ${errorText}`);
    }

    // Récupérer le blob et créer un lien de téléchargement
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL du blob
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Erreur lors du téléchargement PDF:', error);
    throw error;
  }
}

/**
 * Télécharge le catalogue produits en PDF
 */
export async function downloadProductsCatalogPdf(): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  await downloadPdfFile(
    API_ENDPOINTS.INVENTORY.STATS.EXPORT_PRODUCTS_PDF,
    `catalogue_produits_${date}.pdf`
  );
}

/**
 * Télécharge le rapport de stock en PDF
 */
export async function downloadStockReportPdf(warehouseId?: string): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const params = warehouseId ? { warehouse: warehouseId } : undefined;
  await downloadPdfFile(
    API_ENDPOINTS.INVENTORY.STATS.EXPORT_STOCK_PDF,
    `rapport_stock_${date}.pdf`,
    params
  );
}

/**
 * Interface pour les données de devis
 */
export interface QuoteData {
  quote_number: string;
  date?: string;
  valid_until?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  notes?: string;
  discount_percent?: number;
}

/**
 * Interface pour les données de facture
 */
export interface InvoiceData {
  invoice_number: string;
  date?: string;
  due_date?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  notes?: string;
  discount_percent?: number;
  tax_percent?: number;
  is_paid?: boolean;
}

/**
 * Génère et télécharge un devis en PDF
 */
export async function generateQuotePdf(quoteData: QuoteData): Promise<void> {
  await downloadPdfFile(
    API_ENDPOINTS.INVENTORY.STATS.GENERATE_QUOTE_PDF,
    `devis_${quoteData.quote_number}.pdf`,
    undefined,
    'POST',
    quoteData
  );
}

/**
 * Génère et télécharge une facture en PDF
 */
export async function generateInvoicePdf(invoiceData: InvoiceData): Promise<void> {
  await downloadPdfFile(
    API_ENDPOINTS.INVENTORY.STATS.GENERATE_INVOICE_PDF,
    `facture_${invoiceData.invoice_number}.pdf`,
    undefined,
    'POST',
    invoiceData
  );
}

/**
 * Récupère l'analyse financière détaillée
 */
export async function getFinancialAnalysis(days: number = 30): Promise<FinancialAnalysisResponse> {
  return cacheManager.get<FinancialAnalysisResponse>(
    `${API_ENDPOINTS.INVENTORY.STATS.FINANCIAL_ANALYSIS}?days=${days}`,
    { ttl: 15 * 60 * 1000 }
  );
}

/**
 * Récupère l'analyse ABC/Pareto des produits
 */
export async function getABCAnalysis(days: number = 90): Promise<ABCAnalysisResponse> {
  return cacheManager.get<ABCAnalysisResponse>(
    `${API_ENDPOINTS.INVENTORY.STATS.ABC_ANALYSIS}?days=${days}`,
    { ttl: 30 * 60 * 1000 }
  );
}

/**
 * Récupère le rapport détaillé des crédits et créances
 */
export async function getCreditsReport(): Promise<CreditsReportResponse> {
  return cacheManager.get<CreditsReportResponse>(
    API_ENDPOINTS.INVENTORY.STATS.CREDITS_REPORT,
    { ttl: 10 * 60 * 1000 }
  );
}

/**
 * Récupère l'analyse de performance des ventes
 */
export async function getSalesPerformance(days: number = 30): Promise<SalesPerformanceResponse> {
  return cacheManager.get<SalesPerformanceResponse>(
    `${API_ENDPOINTS.INVENTORY.STATS.SALES_PERFORMANCE}?days=${days}`,
    { ttl: 10 * 60 * 1000 }
  );
}

