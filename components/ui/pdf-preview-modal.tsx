'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import {
  X,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_CONFIG, STORAGE_KEYS } from '@/lib/api/config';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
  filename: string;
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  title,
  pdfUrl,
  filename,
}: PDFPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = filename;
    a.click();
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleClose = () => {
    setLoading(true);
    setError(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={cn(
        "relative bg-background rounded-xl shadow-2xl flex flex-col transition-all duration-300 animate-in zoom-in-95 fade-in",
        fullscreen
          ? "w-full h-full m-0 rounded-none"
          : "w-[95vw] h-[90vh] max-w-5xl"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">{filename}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInNewTab}
              className="hidden sm:flex gap-2"
            >
              <ExternalLink className="size-4" />
              Nouvel onglet
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="size-4 mr-2" />
              Télécharger
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFullscreen(!fullscreen)}
              className="hidden sm:flex"
            >
              {fullscreen ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 relative bg-muted/30 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="text-center">
                <div className="relative w-12 h-12 mx-auto mb-3">
                  <div className="absolute inset-0 rounded-full border-4 border-muted/30"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm text-muted-foreground">Chargement du document...</p>
              </div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FileText className="size-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-medium mb-1">Impossible de prévisualiser</h3>
                <p className="text-sm text-muted-foreground mb-4">Le PDF ne peut pas être affiché dans le navigateur</p>
                <Button onClick={handleDownload}>
                  <Download className="size-4 mr-2" />
                  Télécharger directement
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              title={title}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export interface PDFPreviewState {
  isOpen: boolean;
  pdfUrl: string;
  title: string;
  filename: string;
  loading: boolean;
}

export interface UsePDFPreviewOptions {
  baseUrl?: string;
  autoOrgSlug?: boolean;
}

/**
 * Hook générique pour gérer la prévisualisation de PDF
 * Supporte à la fois les endpoints HR et Inventory
 */
export function usePDFPreview(options: UsePDFPreviewOptions = {}) {
  const { baseUrl = API_CONFIG.baseURL, autoOrgSlug = true } = options;

  const [previewState, setPreviewState] = useState<PDFPreviewState>({
    isOpen: false,
    pdfUrl: '',
    title: '',
    filename: '',
    loading: false,
  });

  const openPreview = async (
    endpoint: string,
    title: string,
    filename: string,
    params?: Record<string, string | number>
  ) => {
    try {
      setPreviewState(prev => ({ ...prev, loading: true }));

      const token = typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        : null;
      const orgSlug = typeof window !== 'undefined' && autoOrgSlug
        ? localStorage.getItem('current_organization_slug')
        : null;

      let url = `${baseUrl}${endpoint}`;

      // Build query params
      const queryParams = new URLSearchParams();
      if (orgSlug) queryParams.append('organization_subdomain', orgSlug);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          queryParams.append(key, String(value));
        });
      }
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (orgSlug) headers['X-Organization-Slug'] = orgSlug;

      const response = await fetch(url, { headers });

      if (!response.ok) throw new Error('Erreur de chargement du PDF');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      setPreviewState({
        isOpen: true,
        pdfUrl: blobUrl,
        title,
        filename,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      setPreviewState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const closePreview = () => {
    if (previewState.pdfUrl) {
      window.URL.revokeObjectURL(previewState.pdfUrl);
    }
    setPreviewState({
      isOpen: false,
      pdfUrl: '',
      title: '',
      filename: '',
      loading: false,
    });
  };

  return {
    previewState,
    openPreview,
    closePreview,
    PDFPreviewModal: () => (
      <PDFPreviewModal
        isOpen={previewState.isOpen}
        onClose={closePreview}
        title={previewState.title}
        pdfUrl={previewState.pdfUrl}
        filename={previewState.filename}
      />
    ),
  };
}
