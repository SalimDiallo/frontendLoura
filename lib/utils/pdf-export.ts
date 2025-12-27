/**
 * Utility functions for PDF export
 * Note: This is a simple HTML-based PDF generation using browser print
 * For production, consider using libraries like jsPDF or pdfmake
 */

import type { LeaveRequest } from '@/lib/types/hr';

export function exportLeaveRequestToPDF(leave: LeaveRequest) {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Impossible d\'ouvrir la fenêtre d\'impression. Veuillez autoriser les pop-ups.');
    return;
  }

  const html = generateLeaveRequestHTML(leave);

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // printWindow.close(); // Uncomment to auto-close after printing
  };
}

function generateLeaveRequestHTML(leave: LeaveRequest): string {
  const startDate = new Date(leave.start_date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const endDate = new Date(leave.end_date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    cancelled: 'Annulé',
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demande de Congé - ${leave.employee_name || 'N/A'}</title>
  <style>
    @media print {
      @page {
        margin: 2cm;
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

    .status-approved {
      background: #dcfce7;
      color: #166534;
    }

    .status-pending {
      background: #fed7aa;
      color: #9a3412;
    }

    .status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-cancelled {
      background: #e5e7eb;
      color: #374151;
    }

    .reason-section {
      margin-top: 30px;
      padding: 20px;
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
    }

    .reason-section h3 {
      margin: 0 0 10px 0;
      color: #92400e;
    }

    .reason-section p {
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
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">
    🖨️ Imprimer / Télécharger PDF
  </button>

  <div class="header">
    <h1>📄 Demande de Congé</h1>
    <p>Document généré le ${new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
  </div>

  <div class="info-section">
    <div class="info-row">
      <div class="info-label">Employé :</div>
      <div class="info-value"><strong>${leave.employee_name || 'N/A'}</strong></div>
    </div>

    <div class="info-row">
      <div class="info-label">Type de congé :</div>
      <div class="info-value">${leave.leave_type_name || 'N/A'}</div>
    </div>

    <div class="info-row">
      <div class="info-label">Date de début :</div>
      <div class="info-value">${startDate}${leave.start_half_day ? ' (Demi-journée)' : ''}</div>
    </div>

    <div class="info-row">
      <div class="info-label">Date de fin :</div>
      <div class="info-value">${endDate}${leave.end_half_day ? ' (Demi-journée)' : ''}</div>
    </div>

    <div class="info-row">
      <div class="info-label">Durée totale :</div>
      <div class="info-value"><strong>${leave.total_days} ${leave.total_days > 1 ? 'jours' : 'jour'} ouvrables</strong></div>
    </div>

    <div class="info-row">
      <div class="info-label">Statut :</div>
      <div class="info-value">
        <span class="status status-${leave.status}">
          ${statusLabels[leave.status] || leave.status}
        </span>
      </div>
    </div>

    ${leave.approver_name ? `
    <div class="info-row">
      <div class="info-label">Approuvé par :</div>
      <div class="info-value">${leave.approver_name}</div>
    </div>
    ` : ''}

    ${leave.approval_date ? `
    <div class="info-row">
      <div class="info-label">Date d'approbation :</div>
      <div class="info-value">${new Date(leave.approval_date).toLocaleDateString('fr-FR')}</div>
    </div>
    ` : ''}
  </div>

  ${leave.reason ? `
  <div class="reason-section">
    <h3>💬 Motif de la demande</h3>
    <p>${leave.reason}</p>
  </div>
  ` : ''}

  ${leave.approval_notes ? `
  <div class="reason-section" style="background: #dbeafe; border-left-color: #2563eb;">
    <h3 style="color: #1e40af;">📝 Notes d'approbation</h3>
    <p style="color: #1e3a8a;">${leave.approval_notes}</p>
  </div>
  ` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <p><strong>Employé</strong></p>
      <div class="signature-line">
        ${leave.employee_name || 'N/A'}
      </div>
    </div>

    <div class="signature-box">
      <p><strong>Approbateur</strong></p>
      <div class="signature-line">
        ${leave.approver_name || '_________________'}
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Ce document a été généré automatiquement par le système de gestion des ressources humaines.</p>
    <p>Référence : ${leave.id}</p>
  </div>
</body>
</html>
  `;
}
