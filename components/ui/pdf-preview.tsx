'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import {
  X,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFService } from '@/lib/services/pdf.service';
import type { PDFPreviewState } from '@/lib/hooks/usePDF';

export interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
  filename: string;
}

/**
 * Modal de prévisualisation PDF amélioré
 * Supporte le mode plein écran, téléchargement et ouverture dans un nouvel onglet
 */
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

  // Reset loading state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(false);
    }
  }, [isOpen]);

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
    setFullscreen(false);
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
      <div
        className={cn(
          'relative bg-background rounded-xl shadow-2xl flex flex-col transition-all duration-300 animate-in zoom-in-95 fade-in',
          fullscreen
            ? 'w-full h-full m-0 rounded-none'
            : 'w-[95vw] h-[90vh] max-w-5xl'
        )}
      >
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
            <Button variant="default" size="sm" onClick={handleDownload}>
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
            <Button variant="ghost" size="icon" onClick={handleClose}>
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
                <p className="text-sm text-muted-foreground">
                  Chargement du document...
                </p>
              </div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FileText className="size-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-medium mb-1">Impossible de prévisualiser</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Le PDF ne peut pas être affiché dans le navigateur
                </p>
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

/**
 * Wrapper pratique pour utiliser le modal avec le hook usePDF
 */
export interface PDFPreviewWrapperProps {
  previewState: PDFPreviewState;
  onClose: () => void;
}

export function PDFPreviewWrapper({
  previewState,
  onClose,
}: PDFPreviewWrapperProps) {
  return (
    <PDFPreviewModal
      isOpen={previewState.isOpen}
      onClose={onClose}
      title={previewState.title}
      pdfUrl={previewState.pdfUrl}
      filename={previewState.filename}
    />
  );
}
