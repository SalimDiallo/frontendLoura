/**
 * @deprecated Ce hook est déprécié. Utilisez `usePDF` ou `usePDFDownload` depuis '@/lib/hooks/usePDF'
 *
 * Hook réutilisable pour télécharger des PDF depuis l'API
 * Ce fichier redirige maintenant vers le nouveau service PDF unifié
 *
 * @see lib/hooks/usePDF.ts - Nouveau hook unifié
 * @see lib/services/pdf.service.ts - Service PDF complet
 */

import { usePDFDownload as useNewPDFDownload } from './usePDF';

interface UsePdfDownloadOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * @deprecated Utilisez `usePDF` depuis '@/lib/hooks' à la place
 *
 * Ce hook est maintenant un alias vers le nouveau service PDF unifié.
 * Il reste disponible pour compatibilité mais sera supprimé dans une future version.
 *
 * Migration recommandée:
 * ```tsx
 * // Ancien code (fonctionne toujours)
 * import { usePdfDownload } from '@/lib/hooks/usePdfDownload';
 * const { downloadPdf, downloading } = usePdfDownload();
 *
 * // Nouveau code
 * import { usePDF, PDFEndpoints } from '@/lib/hooks';
 * const { download, downloading } = usePDF();
 * download(PDFEndpoints.proforma('123'), 'file.pdf');
 * ```
 */
export function usePdfDownload(options?: UsePdfDownloadOptions) {
  const { downloadPdf, downloading } = useNewPDFDownload(options);

  return { downloadPdf, downloading };
}
