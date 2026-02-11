/**
 * Hook React unifié pour gérer les PDF
 * Combine téléchargement, prévisualisation et génération locale
 */

import { useState, useCallback } from 'react';
import { PDFService, type PDFDownloadOptions } from '@/lib/services/pdf.service';

export interface UsePDFOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface PDFPreviewState {
  isOpen: boolean;
  pdfUrl: string;
  title: string;
  filename: string;
  loading: boolean;
}

/**
 * Hook principal pour gérer toutes les opérations PDF
 */
export function usePDF(options: UsePDFOptions = {}) {
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewState, setPreviewState] = useState<PDFPreviewState>({
    isOpen: false,
    pdfUrl: '',
    title: '',
    filename: '',
    loading: false,
  });

  /**
   * Télécharge un PDF
   */
  const download = useCallback(
    async (
      endpoint: string,
      filename: string,
      downloadOptions?: PDFDownloadOptions
    ) => {
      try {
        setDownloading(true);
        await PDFService.download(endpoint, filename, {
          ...downloadOptions,
          onSuccess: () => {
            options.onSuccess?.();
            downloadOptions?.onSuccess?.();
          },
          onError: (err) => {
            options.onError?.(err);
            downloadOptions?.onError?.(err);
          },
        });
      } finally {
        setDownloading(false);
      }
    },
    [options]
  );

  /**
   * Ouvre la prévisualisation d'un PDF dans un modal
   */
  const preview = useCallback(
    async (
      endpoint: string,
      title: string,
      filename: string,
      previewOptions?: PDFDownloadOptions
    ) => {
      try {
        setPreviewState((prev) => ({ ...prev, loading: true }));

        const blobUrl = await PDFService.fetchForPreview(endpoint, {
          ...previewOptions,
          onError: (err) => {
            options.onError?.(err);
            previewOptions?.onError?.(err);
          },
        });

        setPreviewState({
          isOpen: true,
          pdfUrl: blobUrl,
          title,
          filename,
          loading: false,
        });

        options.onSuccess?.();
        previewOptions?.onSuccess?.();
      } catch (err: any) {
        setPreviewState((prev) => ({ ...prev, loading: false }));
        options.onError?.(err.message || 'Erreur lors du chargement du PDF');
      }
    },
    [options]
  );

  /**
   * Ferme le modal de prévisualisation
   */
  const closePreview = useCallback(() => {
    if (previewState.pdfUrl) {
      PDFService.revokeBlobUrl(previewState.pdfUrl);
    }
    setPreviewState({
      isOpen: false,
      pdfUrl: '',
      title: '',
      filename: '',
      loading: false,
    });
  }, [previewState.pdfUrl]);

  /**
   * Ouvre un PDF dans un nouvel onglet
   */
  const openInNewTab = useCallback(
    async (endpoint: string, openOptions?: PDFDownloadOptions) => {
      try {
        setLoading(true);
        await PDFService.openInNewTab(endpoint, {
          ...openOptions,
          onSuccess: () => {
            options.onSuccess?.();
            openOptions?.onSuccess?.();
          },
          onError: (err) => {
            options.onError?.(err);
            openOptions?.onError?.(err);
          },
        });
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  /**
   * Génère un PDF depuis HTML (impression)
   */
  const generateFromHTML = useCallback(
    (htmlContent: string, title: string) => {
      try {
        PDFService.generateFromHTML(htmlContent, title);
        options.onSuccess?.();
      } catch (err: any) {
        options.onError?.(err.message || 'Erreur lors de la génération du PDF');
      }
    },
    [options]
  );

  return {
    // États
    downloading,
    loading,
    previewState,

    // Fonctions
    download,
    preview,
    closePreview,
    openInNewTab,
    generateFromHTML,
  };
}

/**
 * Hook simplifié pour le téléchargement uniquement
 * Compatible avec l'ancien usePdfDownload
 */
export function usePDFDownload(options: UsePDFOptions = {}) {
  const { download, downloading } = usePDF(options);

  return {
    downloadPdf: download,
    downloading,
  };
}

/**
 * Hook simplifié pour la prévisualisation uniquement
 * Compatible avec l'ancien usePDFPreview
 */
export function usePDFPreview(options: UsePDFOptions = {}) {
  const { preview, previewState, closePreview } = usePDF(options);

  return {
    openPreview: preview,
    closePreview,
    previewState,
  };
}
