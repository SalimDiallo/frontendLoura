/**
 * Générateur de PDF HTML
 * Crée des documents PDF à partir de templates HTML
 * Utilisé pour les documents générés côté client
 */

import { PDFService } from '@/lib/services/pdf.service';

export interface PDFDocumentOptions {
  title: string;
  styles?: string;
  pageMargin?: string;
  headerContent?: string;
  footerContent?: string;
}

/**
 * Classe de base pour créer des documents PDF HTML
 */
export class PDFGenerator {
  /**
   * Crée un document HTML complet avec styles d'impression
   */
  static createDocument(
    content: string,
    options: PDFDocumentOptions
  ): string {
    const {
      title,
      styles = '',
      pageMargin = '2cm',
      headerContent = '',
      footerContent = '',
    } = options;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @media print {
      @page {
        margin: ${pageMargin};
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .no-print {
        display: none;
      }
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #1e40af;
      margin: 0 0 10px 0;
      font-size: 28px;
    }

    .header p {
      color: #6b7280;
      margin: 0;
      font-size: 14px;
    }

    .info-section {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      margin-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }

    .info-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .info-label {
      font-weight: 600;
      width: 200px;
      color: #4b5563;
    }

    .info-value {
      flex: 1;
      color: #1f2937;
    }

    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
    }

    .status-approved, .status-paid, .status-completed {
      background: #dcfce7;
      color: #166534;
    }

    .status-pending, .status-draft {
      background: #fed7aa;
      color: #9a3412;
    }

    .status-rejected, .status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }

    .section {
      margin-top: 30px;
      padding: 20px;
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
    }

    .section h3 {
      margin: 0 0 10px 0;
      color: #92400e;
    }

    .section p {
      margin: 0;
      color: #78350f;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }

    .signature-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }

    .signature-box {
      text-align: center;
      padding: 20px;
      width: 45%;
    }

    .signature-line {
      border-top: 2px solid #000;
      margin-top: 60px;
      padding-top: 10px;
    }

    .print-button {
      margin: 20px 0;
      padding: 10px 20px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
    }

    .print-button:hover {
      background: #1d4ed8;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    table th,
    table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    table th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }

    table tbody tr:hover {
      background: #f9fafb;
    }

    ${styles}
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">
    🖨️ Imprimer / Télécharger PDF
  </button>

  ${headerContent}
  ${content}
  ${footerContent}
</body>
</html>
    `.trim();
  }

  /**
   * Génère et affiche un document PDF
   */
  static generate(content: string, options: PDFDocumentOptions): void {
    const html = this.createDocument(content, options);
    PDFService.generateFromHTML(html);
  }

  /**
   * Crée un header standard pour les documents
   */
  static createHeader(title: string, subtitle?: string): string {
    const now = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
        <p>Document généré le ${now}</p>
      </div>
    `;
  }

  /**
   * Crée un footer standard pour les documents
   */
  static createFooter(reference?: string, organizationName?: string): string {
    return `
      <div class="footer">
        <p>Ce document a été généré automatiquement${
          organizationName ? ` par ${organizationName}` : ''
        }.</p>
        ${reference ? `<p>Référence : ${reference}</p>` : ''}
      </div>
    `;
  }

  /**
   * Crée une section d'informations
   */
  static createInfoSection(
    rows: Array<{ label: string; value: string | number }>
  ): string {
    const rowsHtml = rows
      .map(
        (row) => `
      <div class="info-row">
        <div class="info-label">${row.label} :</div>
        <div class="info-value">${row.value}</div>
      </div>
    `
      )
      .join('');

    return `<div class="info-section">${rowsHtml}</div>`;
  }

  /**
   * Crée une section de signatures
   */
  static createSignatureSection(
    signatures: Array<{ label: string; name?: string }>
  ): string {
    const signaturesHtml = signatures
      .map(
        (sig) => `
      <div class="signature-box">
        <p><strong>${sig.label}</strong></p>
        <div class="signature-line">
          ${sig.name || '_________________'}
        </div>
      </div>
    `
      )
      .join('');

    return `<div class="signature-section">${signaturesHtml}</div>`;
  }

  /**
   * Crée un tableau HTML
   */
  static createTable(
    headers: string[],
    rows: Array<Array<string | number>>
  ): string {
    const headersHtml = headers.map((h) => `<th>${h}</th>`).join('');
    const rowsHtml = rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`
      )
      .join('');

    return `
      <table>
        <thead>
          <tr>${headersHtml}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }

  /**
   * Crée un badge de statut
   */
  static createStatusBadge(
    status: string,
    label: string,
    className: string = ''
  ): string {
    return `<span class="status status-${status} ${className}">${label}</span>`;
  }
}

/**
 * Utilitaires de formatage pour les documents PDF
 */
export const PDFFormatters = {
  date: (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    });
  },

  currency: (amount: number, currency: string = 'XOF'): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  number: (value: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  },

  percentage: (value: number): string => {
    return `${PDFFormatters.number(value, 2)}%`;
  },
};
