/**
 * Exemples d'utilisation du service PDF unifié
 * Ces exemples montrent comment migrer depuis l'ancien code
 */

'use client';

import { usePDF, PDFEndpoints } from '@/lib/hooks';
import { PDFPreviewWrapper } from '@/components/ui';
import { PDFGenerator, PDFFormatters } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Download, Eye, ExternalLink } from 'lucide-react';

// ============================================================================
// EXEMPLE 1: Téléchargement simple
// ============================================================================

export function SimpleDownloadExample() {
  const { download, downloading } = usePDF({
    onSuccess: () => alert('PDF téléchargé avec succès !'),
    onError: (err) => alert(`Erreur : ${err}`),
  });

  return (
    <Button
      onClick={() =>
        download(PDFEndpoints.proforma('123'), 'Proforma_12345.pdf')
      }
      disabled={downloading}
    >
      <Download className="size-4 mr-2" />
      {downloading ? 'Téléchargement...' : 'Télécharger PDF'}
    </Button>
  );
}

// ============================================================================
// EXEMPLE 2: Prévisualisation avec modal
// ============================================================================

export function PreviewExample() {
  const { preview, previewState, closePreview } = usePDF();

  return (
    <>
      <Button
        onClick={() =>
          preview(
            PDFEndpoints.deliveryNote('456'),
            'Bon de Livraison #BL-2024-001',
            'BL_2024_001.pdf'
          )
        }
      >
        <Eye className="size-4 mr-2" />
        Prévisualiser
      </Button>

      <PDFPreviewWrapper previewState={previewState} onClose={closePreview} />
    </>
  );
}

// ============================================================================
// EXEMPLE 3: Boutons multiples (Download, Preview, New Tab)
// ============================================================================

export function MultipleActionsExample({ documentId }: { documentId: string }) {
  const { download, preview, openInNewTab, downloading, loading, previewState, closePreview } =
    usePDF({
      onSuccess: () => console.log('Action réussie'),
      onError: (err) => console.error('Erreur:', err),
    });

  const endpoint = PDFEndpoints.sale(documentId);
  const filename = `Facture_${documentId}.pdf`;

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => download(endpoint, filename)}
          disabled={downloading}
        >
          <Download className="size-4 mr-2" />
          Télécharger
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => preview(endpoint, 'Facture de vente', filename)}
          disabled={loading}
        >
          <Eye className="size-4 mr-2" />
          Prévisualiser
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => openInNewTab(endpoint)}
          disabled={loading}
        >
          <ExternalLink className="size-4 mr-2" />
          Nouvel onglet
        </Button>
      </div>

      <PDFPreviewWrapper previewState={previewState} onClose={closePreview} />
    </>
  );
}

// ============================================================================
// EXEMPLE 4: Génération de PDF HTML (pour documents offline)
// ============================================================================

interface LeaveRequest {
  id: string;
  employee_name: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  approver_name?: string;
}

export function GenerateLeaveRequestPDF({ leave }: { leave: LeaveRequest }) {
  const handleGenerate = () => {
    // Créer le contenu du document
    const header = PDFGenerator.createHeader(
      '📄 Demande de Congé',
      `Document de ${leave.employee_name}`
    );

    const infoSection = PDFGenerator.createInfoSection([
      { label: 'Employé', value: leave.employee_name },
      { label: 'Type de congé', value: leave.leave_type_name },
      {
        label: 'Date de début',
        value: PDFFormatters.date(leave.start_date),
      },
      {
        label: 'Date de fin',
        value: PDFFormatters.date(leave.end_date),
      },
      {
        label: 'Durée totale',
        value: `${leave.total_days} ${leave.total_days > 1 ? 'jours' : 'jour'}`,
      },
      {
        label: 'Statut',
        value: PDFGenerator.createStatusBadge(
          leave.status,
          leave.status === 'approved'
            ? 'Approuvé'
            : leave.status === 'rejected'
            ? 'Rejeté'
            : 'En attente'
        ),
      },
    ]);

    const reasonSection = leave.reason
      ? `
      <div class="section">
        <h3>💬 Motif de la demande</h3>
        <p>${leave.reason}</p>
      </div>
    `
      : '';

    const signatures = PDFGenerator.createSignatureSection([
      { label: 'Employé', name: leave.employee_name },
      { label: 'Approbateur', name: leave.approver_name },
    ]);

    const footer = PDFGenerator.createFooter(
      leave.id,
      'Système de Gestion RH'
    );

    const content = `
      ${header}
      ${infoSection}
      ${reasonSection}
      ${signatures}
      ${footer}
    `;

    // Générer le PDF
    PDFGenerator.generate(content, {
      title: `Demande_Conge_${leave.employee_name.replace(/\s+/g, '_')}`,
      pageMargin: '2cm',
    });
  };

  return (
    <Button onClick={handleGenerate}>
      <Download className="size-4 mr-2" />
      Exporter en PDF
    </Button>
  );
}

// ============================================================================
// EXEMPLE 5: PDF avec tableau de données
// ============================================================================

interface Product {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export function GenerateInvoicePDF({
  invoiceNumber,
  products,
}: {
  invoiceNumber: string;
  products: Product[];
}) {
  const handleGenerate = () => {
    const header = PDFGenerator.createHeader(
      `Facture ${invoiceNumber}`,
      'Facture de vente'
    );

    const tableData = products.map((p) => [
      p.name,
      PDFFormatters.number(p.quantity),
      PDFFormatters.currency(p.price),
      PDFFormatters.currency(p.total),
    ]);

    const table = PDFGenerator.createTable(
      ['Produit', 'Quantité', 'Prix unitaire', 'Total'],
      tableData
    );

    const total = products.reduce((sum, p) => sum + p.total, 0);
    const totalSection = `
      <div class="info-section">
        <div class="info-row">
          <div class="info-label">Total HT</div>
          <div class="info-value"><strong>${PDFFormatters.currency(total)}</strong></div>
        </div>
      </div>
    `;

    const footer = PDFGenerator.createFooter(invoiceNumber);

    const content = `
      ${header}
      ${table}
      ${totalSection}
      ${footer}
    `;

    PDFGenerator.generate(content, {
      title: `Facture_${invoiceNumber}`,
      styles: `
        table tbody tr:nth-child(even) {
          background: #f9fafb;
        }
      `,
    });
  };

  return (
    <Button onClick={handleGenerate} variant="outline">
      <Download className="size-4 mr-2" />
      Générer PDF
    </Button>
  );
}

// ============================================================================
// EXEMPLE 6: Migration de l'ancien code
// ============================================================================

// ANCIEN CODE (avant)
/*
import { usePdfDownload } from '@/lib/hooks/usePdfDownload';

function OldComponent() {
  const { downloadPdf, downloading } = usePdfDownload({
    onSuccess: () => setSuccess('PDF téléchargé !'),
    onError: (err) => setError(err),
  });

  return (
    <button
      onClick={() => downloadPdf(`/inventory/delivery-notes/${id}/export-pdf/`, `BL_${number}.pdf`)}
      disabled={downloading}
    >
      Télécharger
    </button>
  );
}
*/

// NOUVEAU CODE (après) - Option 1: Utiliser l'alias compatible
export function MigratedComponent1({ id, number }: { id: string; number: string }) {
  const { download, downloading } = usePDF({
    onSuccess: () => console.log('PDF téléchargé !'),
    onError: (err) => console.error(err),
  });

  return (
    <Button
      onClick={() =>
        download(PDFEndpoints.deliveryNote(id), `BL_${number}.pdf`)
      }
      disabled={downloading}
    >
      Télécharger
    </Button>
  );
}

// NOUVEAU CODE (après) - Option 2: Utiliser le hook complet
export function MigratedComponent2({ id, number }: { id: string; number: string }) {
  const { download, preview, previewState, closePreview, downloading } =
    usePDF();

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() =>
            download(PDFEndpoints.deliveryNote(id), `BL_${number}.pdf`)
          }
          disabled={downloading}
        >
          <Download className="size-4 mr-2" />
          Télécharger
        </Button>

        <Button
          onClick={() =>
            preview(
              PDFEndpoints.deliveryNote(id),
              `Bon de Livraison ${number}`,
              `BL_${number}.pdf`
            )
          }
        >
          <Eye className="size-4 mr-2" />
          Prévisualiser
        </Button>
      </div>

      <PDFPreviewWrapper previewState={previewState} onClose={closePreview} />
    </>
  );
}

// ============================================================================
// EXEMPLE 7: Utilisation dans un tableau de données
// ============================================================================

interface Document {
  id: string;
  number: string;
  type: 'proforma' | 'delivery-note' | 'invoice';
}

export function DocumentListWithPDF({ documents }: { documents: Document[] }) {
  const { download, preview, previewState, closePreview } = usePDF();

  const getEndpoint = (doc: Document) => {
    switch (doc.type) {
      case 'proforma':
        return PDFEndpoints.proforma(doc.id);
      case 'delivery-note':
        return PDFEndpoints.deliveryNote(doc.id);
      case 'invoice':
        return PDFEndpoints.sale(doc.id);
    }
  };

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Numéro</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.number}</td>
              <td>{doc.type}</td>
              <td>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      download(getEndpoint(doc), `${doc.number}.pdf`)
                    }
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      preview(
                        getEndpoint(doc),
                        `Document ${doc.number}`,
                        `${doc.number}.pdf`
                      )
                    }
                  >
                    <Eye className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <PDFPreviewWrapper previewState={previewState} onClose={closePreview} />
    </>
  );
}
