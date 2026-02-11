/**
 * Service unifié pour la gestion des PDF
 * Supporte :
 * - Téléchargement de PDF depuis l'API backend
 * - Prévisualisation dans un modal
 * - Génération HTML locale (pour documents offline)
 */

import { API_CONFIG, STORAGE_KEYS } from '@/lib/api/config';

export interface PDFDownloadOptions {
  /** Callback appelé en cas de succès */
  onSuccess?: () => void;
  /** Callback appelé en cas d'erreur */
  onError?: (error: string) => void;
  /** Paramètres additionnels pour l'URL */
  params?: Record<string, string | number>;
  /** Inclure automatiquement le slug de l'organisation */
  autoOrgSlug?: boolean;
}

export interface PDFPreviewOptions extends PDFDownloadOptions {
  /** Titre du document dans le modal */
  title?: string;
  /** Nom de fichier pour le téléchargement */
  filename?: string;
}

/**
 * Classe de service pour gérer toutes les opérations PDF
 */
export class PDFService {
  /**
   * Télécharge un PDF depuis l'API backend
   * @param endpoint - L'endpoint API (ex: '/inventory/delivery-notes/123/export-pdf/')
   * @param filename - Le nom du fichier à télécharger
   * @param options - Options de configuration
   */
  static async download(
    endpoint: string,
    filename: string,
    options: PDFDownloadOptions = {}
  ): Promise<void> {
    try {
      const { onSuccess, params = {}, autoOrgSlug = true } = options;

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const orgSlug = autoOrgSlug
        ? localStorage.getItem('current_organization_slug')
        : null;

      // Construire l'URL avec les paramètres + mode=download
      const searchParams = new URLSearchParams();
      if (orgSlug) searchParams.append('organization_subdomain', orgSlug);

      // ✨ Ajouter mode=download pour être explicite (défaut backend, mais mieux d'être clair)
      searchParams.append('mode', 'download');

      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });

      const separator = endpoint.includes('?') ? '&' : '?';
      const queryString = searchParams.toString();
      const url = `${API_CONFIG.baseURL}${endpoint}${
        queryString ? separator + queryString : ''
      }`;

      // Télécharger le PDF
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      // Créer le blob et déclencher le téléchargement
      const blob = await response.blob();
      this.downloadBlob(blob, filename);

      onSuccess?.();
    } catch (err: any) {
      options.onError?.(err.message || 'Erreur lors du téléchargement du PDF');
      throw err;
    }
  }

  /**
   * Récupère un PDF pour prévisualisation (retourne un blob URL)
   * @param endpoint - L'endpoint API
   * @param options - Options de configuration
   * @returns L'URL du blob pour l'affichage
   */
  static async fetchForPreview(
    endpoint: string,
    options: PDFDownloadOptions = {}
  ): Promise<string> {
    try {
      const { params = {}, autoOrgSlug = true } = options;

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const orgSlug = autoOrgSlug
        ? localStorage.getItem('current_organization_slug')
        : null;

      // Construire l'URL avec les paramètres + mode=preview pour le backend
      const searchParams = new URLSearchParams();
      if (orgSlug) searchParams.append('organization_subdomain', orgSlug);

      // ✨ IMPORTANT: Ajouter mode=preview pour que le backend retourne Content-Disposition: inline
      searchParams.append('mode', 'preview');

      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });

      const separator = endpoint.includes('?') ? '&' : '?';
      const queryString = searchParams.toString();
      const url = `${API_CONFIG.baseURL}${endpoint}${
        queryString ? separator + queryString : ''
      }`;

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (orgSlug) headers['X-Organization-Slug'] = orgSlug;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du PDF');
      }

      const blob = await response.blob();
      return window.URL.createObjectURL(blob);
    } catch (err: any) {
      options.onError?.(err.message || 'Erreur lors du chargement du PDF');
      throw err;
    }
  }

  /**
   * Génère un PDF à partir d'HTML (impression navigateur)
   * Utilisé pour les documents générés côté client
   * @param htmlContent - Le contenu HTML complet du document
   */
  static generateFromHTML(htmlContent: string): void {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert(
        "Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups."
      );
      return;
    }

    // Utilisation de innerHTML pour éviter l'avertissement de dépréciation
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  /**
   * Ouvre un PDF dans un nouvel onglet
   * @param endpoint - L'endpoint API
   * @param options - Options de configuration
   */
  static async openInNewTab(
    endpoint: string,
    options: PDFDownloadOptions = {}
  ): Promise<void> {
    try {
      const blobUrl = await this.fetchForPreview(endpoint, options);
      window.open(blobUrl, '_blank');
      options.onSuccess?.();
    } catch (err: any) {
      options.onError?.(err.message || "Erreur lors de l'ouverture du PDF");
      throw err;
    }
  }

  /**
   * Méthode utilitaire pour télécharger un blob
   * @param blob - Le blob à télécharger
   * @param filename - Le nom du fichier
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const objUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(objUrl);
  }

  /**
   * Nettoie une URL de blob créée précédemment
   * @param blobUrl - L'URL du blob à nettoyer
   */
  static revokeBlobUrl(blobUrl: string): void {
    if (blobUrl) {
      window.URL.revokeObjectURL(blobUrl);
    }
  }
}

/**
 * Fonctions d'aide pour les endpoints PDF communs
 * ✅ Tous les endpoints utilisent export-pdf avec tiret (-)
 */
export const PDFEndpoints = {
  // Inventory
  deliveryNote: (id: string) => `/inventory/delivery-notes/${id}/export-pdf/`,
  proforma: (id: string) => `/inventory/proformas/${id}/export-pdf/`,
  sale: (id: string) => `/inventory/sales/${id}/export-pdf/`,
  saleReceipt: (id: string) => `/inventory/sales/${id}/receipt/`,
  saleInvoice: (id: string) => `/inventory/sales/${id}/invoice/`,
  payment: (id: string) => `/inventory/payments/${id}/export-pdf/`,
  expense: (id: string) => `/inventory/expenses/${id}/export-pdf/`,
  stockCount: (id: string) => `/inventory/stock-counts/${id}/export-pdf/`,
  order: (id: string) => `/inventory/orders/${id}/export-pdf/`,
  purchaseOrder: (id: string) => `/inventory/purchase-orders/${id}/export-pdf/`,
  creditSale: (id: string) => `/inventory/credit-sales/${id}/export-pdf/`,
  creditSaleInvoice: (id: string) => `/inventory/credit-sales/${id}/invoice/`,

  // HR - ✅ CORRIGÉ: export-pdf avec tiret au lieu de export_pdf avec underscore
  payslip: (id: string) => `/hr/payslips/${id}/export-pdf/`,
  contract: (id: string) => `/hr/contracts/${id}/export-pdf/`,
  leaveRequest: (id: string) => `/hr/leave-requests/${id}/export-pdf/`,
};
