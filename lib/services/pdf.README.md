# Service PDF Unifié

Service complet pour gérer toutes les opérations PDF dans l'application : téléchargement, prévisualisation et génération locale.

## Architecture

### 1. **`PDFService`** (`lib/services/pdf.service.ts`)
Classe de service principal qui gère :
- Téléchargement de PDF depuis l'API backend
- Prévisualisation (fetch blob)
- Génération HTML locale
- Gestion des URLs blob

### 2. **`usePDF`** (`lib/hooks/usePDF.ts`)
Hook React principal avec toutes les fonctionnalités :
- États de chargement
- Gestion de prévisualisation
- Compatibilité avec les anciens hooks

### 3. **`PDFGenerator`** (`lib/utils/pdf-generator.ts`)
Utilitaire pour créer des documents PDF HTML :
- Templates standardisés
- Styles d'impression
- Formatters (dates, monnaie, etc.)

### 4. **`PDFPreviewModal`** (`components/ui/pdf-preview.tsx`)
Composant UI pour la prévisualisation :
- Mode plein écran
- Téléchargement
- Ouverture dans nouvel onglet

## Utilisation

### 1. Téléchargement simple

```tsx
import { usePDF, PDFEndpoints } from '@/lib/hooks';

function MyComponent() {
  const { download, downloading } = usePDF({
    onSuccess: () => console.log('PDF téléchargé !'),
    onError: (err) => console.error(err),
  });

  const handleDownload = () => {
    download(
      PDFEndpoints.proforma('123'),
      'Proforma_12345.pdf'
    );
  };

  return (
    <button onClick={handleDownload} disabled={downloading}>
      {downloading ? 'Téléchargement...' : 'Télécharger PDF'}
    </button>
  );
}
```

### 2. Prévisualisation avec modal

```tsx
import { usePDF, PDFEndpoints } from '@/lib/hooks';
import { PDFPreviewWrapper } from '@/components/ui';

function MyComponent() {
  const { preview, previewState, closePreview } = usePDF();

  const handlePreview = () => {
    preview(
      PDFEndpoints.deliveryNote('456'),
      'Bon de Livraison',
      'BL_2024_001.pdf'
    );
  };

  return (
    <>
      <button onClick={handlePreview}>
        Prévisualiser
      </button>

      <PDFPreviewWrapper
        previewState={previewState}
        onClose={closePreview}
      />
    </>
  );
}
```

### 3. Hook complet avec toutes les fonctionnalités

```tsx
import { usePDF } from '@/lib/hooks';
import { PDFPreviewWrapper } from '@/components/ui';

function DocumentPage() {
  const {
    // États
    downloading,
    loading,
    previewState,

    // Fonctions
    download,
    preview,
    closePreview,
    openInNewTab,
  } = usePDF({
    onSuccess: () => toast.success('Succès !'),
    onError: (err) => toast.error(err),
  });

  return (
    <>
      <button onClick={() => download('/endpoint', 'file.pdf')}>
        Télécharger
      </button>

      <button onClick={() => preview('/endpoint', 'Title', 'file.pdf')}>
        Prévisualiser
      </button>

      <button onClick={() => openInNewTab('/endpoint')}>
        Nouvel onglet
      </button>

      <PDFPreviewWrapper
        previewState={previewState}
        onClose={closePreview}
      />
    </>
  );
}
```

### 4. Compatibilité avec ancien code (usePdfDownload)

```tsx
// Ancien code - fonctionne toujours !
import { usePDFDownload } from '@/lib/hooks';

function OldComponent() {
  const { downloadPdf, downloading } = usePDFDownload({
    onSuccess: () => console.log('OK'),
    onError: (err) => console.error(err),
  });

  return (
    <button
      onClick={() => downloadPdf('/endpoint', 'file.pdf')}
      disabled={downloading}
    >
      Télécharger
    </button>
  );
}
```

### 5. Génération PDF HTML locale

```tsx
import { PDFGenerator, PDFFormatters } from '@/lib/utils';

function generateLeaveRequestPDF(leave: LeaveRequest) {
  const header = PDFGenerator.createHeader(
    'Demande de Congé',
    leave.employee_name
  );

  const infoSection = PDFGenerator.createInfoSection([
    { label: 'Employé', value: leave.employee_name },
    { label: 'Type', value: leave.leave_type_name },
    { label: 'Date début', value: PDFFormatters.date(leave.start_date) },
    { label: 'Date fin', value: PDFFormatters.date(leave.end_date) },
    { label: 'Durée', value: `${leave.total_days} jours` },
  ]);

  const signatures = PDFGenerator.createSignatureSection([
    { label: 'Employé', name: leave.employee_name },
    { label: 'Approbateur', name: leave.approver_name },
  ]);

  const footer = PDFGenerator.createFooter(leave.id, 'Mon Organisation');

  const content = `
    ${header}
    ${infoSection}
    ${leave.reason ? `
      <div class="section">
        <h3>Motif</h3>
        <p>${leave.reason}</p>
      </div>
    ` : ''}
    ${signatures}
    ${footer}
  `;

  PDFGenerator.generate(content, {
    title: `Demande_Conge_${leave.employee_name}`,
    pageMargin: '2cm',
  });
}
```

## Endpoints PDF prédéfinis

```tsx
import { PDFEndpoints } from '@/lib/services';

// Inventory
PDFEndpoints.deliveryNote(id)  // '/inventory/delivery-notes/:id/export-pdf/'
PDFEndpoints.proforma(id)       // '/inventory/proformas/:id/export-pdf/'
PDFEndpoints.sale(id)           // '/inventory/sales/:id/export-pdf/'
PDFEndpoints.expense(id)        // '/inventory/expenses/:id/export-pdf/'
PDFEndpoints.stockCount(id)     // '/inventory/stock-counts/:id/export-pdf/'
PDFEndpoints.order(id)          // '/inventory/orders/:id/export-pdf/'

// HR
PDFEndpoints.payroll(id)        // '/hr/payslips/:id/export_pdf/'
PDFEndpoints.contract(id)       // '/hr/contracts/:id/export_pdf/'
PDFEndpoints.leave(id)          // '/hr/leave-requests/:id/export_pdf/'
```

## Utilisation directe du service (sans hook)

```tsx
import { PDFService, PDFEndpoints } from '@/lib/services';

// Téléchargement
await PDFService.download(
  PDFEndpoints.proforma('123'),
  'proforma.pdf',
  {
    onSuccess: () => console.log('OK'),
    params: { format: 'A4' }
  }
);

// Prévisualisation (retourne blob URL)
const blobUrl = await PDFService.fetchForPreview(
  PDFEndpoints.deliveryNote('456')
);

// Ouverture nouvel onglet
await PDFService.openInNewTab(
  PDFEndpoints.payroll('789')
);

// Génération HTML
PDFService.generateFromHTML(htmlContent, 'Document Title');

// Nettoyage blob URL
PDFService.revokeBlobUrl(blobUrl);
```

## Options avancées

### Paramètres personnalisés

```tsx
const { download } = usePDF();

download(
  '/custom/endpoint',
  'file.pdf',
  {
    params: {
      format: 'A4',
      language: 'fr',
      template: 'modern',
    },
    autoOrgSlug: true, // Inclut automatiquement organization_subdomain
  }
);
```

### Styles personnalisés pour PDF HTML

```tsx
PDFGenerator.generate(content, {
  title: 'Mon Document',
  pageMargin: '1.5cm',
  styles: `
    .custom-class {
      background: #f0f0f0;
      padding: 10px;
    }
    @media print {
      .custom-class {
        page-break-inside: avoid;
      }
    }
  `,
});
```

### Formatters disponibles

```tsx
import { PDFFormatters } from '@/lib/utils';

PDFFormatters.date(new Date())              // "9 février 2026"
PDFFormatters.currency(50000, 'XOF')        // "50 000 FCFA"
PDFFormatters.number(1234.5678, 2)          // "1 234,57"
PDFFormatters.percentage(25.5)              // "25,50%"
```

## Migration depuis l'ancien code

### Avant (ancien code dispersé)

```tsx
// Ancien hook
import { usePdfDownload } from '@/lib/hooks/usePdfDownload';

// Ancienne prévisualisation
import { PDFPreviewModal, usePDFPreview } from '@/components/ui/pdf-preview-modal';

// Ancien PDF export HTML
import { exportLeaveRequestToPDF } from '@/lib/utils/pdf-export';

// Services individuels
import { downloadPayrollPDF } from '@/lib/services/hr/payroll.service';
```

### Après (service unifié)

```tsx
// Tout dans un seul import
import { usePDF, PDFEndpoints, PDFGenerator } from '@/lib/hooks';
import { PDFPreviewWrapper } from '@/components/ui';

// OU imports directs
import { PDFService } from '@/lib/services';
import { PDFGenerator, PDFFormatters } from '@/lib/utils';
```

## Avantages du service unifié

1. **Un seul endroit pour toute la logique PDF** - Plus besoin de chercher dans plusieurs fichiers
2. **Cohérence** - Même API partout dans l'application
3. **Réutilisabilité** - Components et hooks réutilisables
4. **Type-safe** - TypeScript pour éviter les erreurs
5. **Maintenance facile** - Modifier un seul service au lieu de plusieurs
6. **Prévisualisation intégrée** - Modal moderne avec plein écran
7. **Compatibilité** - Les anciens hooks continuent de fonctionner

## Tests

```tsx
// Test du téléchargement
const { download } = usePDF();
await download('/test/endpoint', 'test.pdf');

// Test de la prévisualisation
const { preview, previewState } = usePDF();
await preview('/test/endpoint', 'Test', 'test.pdf');
expect(previewState.isOpen).toBe(true);

// Test de génération HTML
const html = PDFGenerator.createDocument(
  '<p>Test</p>',
  { title: 'Test' }
);
expect(html).toContain('<p>Test</p>');
```

## Questions fréquentes

**Q: Puis-je utiliser l'ancien `usePdfDownload` ?**
R: Oui ! Il est maintenant un alias de `usePDF` pour la compatibilité.

**Q: Comment ajouter un nouvel endpoint PDF ?**
R: Ajoutez-le dans `PDFEndpoints` dans `pdf.service.ts`.

**Q: Le PDF ne se prévisualise pas ?**
R: Certains navigateurs bloquent les PDFs. Le composant affiche automatiquement un bouton de téléchargement.

**Q: Comment personnaliser les styles du PDF HTML ?**
R: Utilisez l'option `styles` dans `PDFGenerator.generate()`.

**Q: Puis-je utiliser ce service côté serveur (SSR) ?**
R: Non, il utilise `localStorage` et `window`. Utilisez-le uniquement côté client avec `'use client'`.
