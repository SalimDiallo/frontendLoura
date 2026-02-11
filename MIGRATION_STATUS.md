# Migration PDF Status

## Fichiers migrés ✅

### Inventory Module
1. ✅ `app/apps/(org)/[slug]/inventory/documents/delivery-notes/[id]/page.tsx`
   - Remplacé `usePdfDownload` par `usePDF`
   - Ajouté `PDFPreviewWrapper`
   - Utilise `PDFEndpoints.deliveryNote()`

2. ✅ `app/apps/(org)/[slug]/inventory/documents/proformas/[id]/page.tsx`
   - Remplacé `usePdfDownload` par `usePDF`
   - Ajouté `PDFPreviewWrapper`
   - Utilise `PDFEndpoints.proforma()`

### HR Module
3. ✅ `app/apps/(org)/[slug]/hr/leaves/[id]/page.tsx`
   - Remplacé état manuel `pdfPreview` par `usePDF`
   - Supprimé fonctions `handlePreviewPDF` et `closePdfPreview` manuelles
   - Ajouté `PDFPreviewWrapper`
   - Utilise `PDFEndpoints.leave()`

## Fichiers à migrer 🔄

### HR Module (suite)
4. ⏳ `app/apps/(org)/[slug]/hr/contracts/page.tsx`
   - Utilise `PDFPreviewModal` directement
   - Nécessite migration vers `usePDF`

5. ⏳ `app/apps/(org)/[slug]/hr/payroll/page.tsx`
   - Utilise `PDFPreviewModal` directement
   - Nécessite migration vers `usePDF`

### Inventory Module (suite)
6. ⏳ `app/apps/(org)/[slug]/inventory/expenses/page.tsx`
   - Utilise `PDFPreviewModal` directement
   - Nécessite migration vers `usePDF`

## Fichiers de service à vérifier 📝

7. ⏳ `lib/services/hr/payroll.service.ts`
   - Contient `exportPayrollPDF` et `downloadPayrollPDF`
   - À simplifier avec `PDFService`

8. ⏳ `lib/services/inventory/stats.service.ts`
   - Vérifié utilisation PDF

## Anciens fichiers à déprécier ⚠️

- `lib/hooks/usePdfDownload.ts` - Devrait rediriger vers `usePDF`
- `components/ui/pdf-preview-modal.tsx` - Ancien composant (gardé pour compatibilité)
- `lib/utils/pdf-export.ts` - Remplacé par `pdf-generator.ts`

## Notes de migration

### Pattern de migration standard

**Avant:**
```tsx
import { usePdfDownload } from '@/lib/hooks/usePdfDownload';

const { downloadPdf, downloading } = usePdfDownload({
  onSuccess: () => setSuccess("OK"),
  onError: (err) => setError(err),
});

<button onClick={() => downloadPdf('/endpoint', 'file.pdf')}>
  Download
</button>
```

**Après:**
```tsx
import { usePDF, PDFEndpoints } from '@/lib/hooks';
import { PDFPreviewWrapper } from '@/components/ui';

const { preview, previewState, closePreview, downloading } = usePDF({
  onSuccess: () => setSuccess("OK"),
  onError: (err) => setError(err),
});

<>
  <button onClick={() => preview(
    PDFEndpoints.xxx(id),
    'Title',
    'file.pdf'
  )}>
    Preview
  </button>

  <PDFPreviewWrapper previewState={previewState} onClose={closePreview} />
</>
```

### Pour état manuel pdfPreview

**Avant:**
```tsx
const [pdfPreview, setPdfPreview] = useState<{ isOpen: boolean; pdfUrl: string }>({
  isOpen: false,
  pdfUrl: '',
});

const handlePreview = async () => {
  const response = await fetch(url);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  setPdfPreview({ isOpen: true, pdfUrl: url });
};

const closePreview = () => {
  window.URL.revokeObjectURL(pdfPreview.pdfUrl);
  setPdfPreview({ isOpen: false, pdfUrl: '' });
};
```

**Après:**
```tsx
const { preview, previewState, closePreview } = usePDF();

const handlePreview = async () => {
  await preview(endpoint, title, filename);
};

// closePreview déjà fourni par le hook
```

## Prochaines étapes

1. Migrer les 3 fichiers de pages restants (contracts, payroll, expenses)
2. Simplifier les services (payroll.service.ts)
3. Marquer anciens fichiers comme deprecated
4. Ajouter tests pour le nouveau service
5. Documenter les breaking changes (s'il y en a)
