# Service PDF Unifié - Résumé

## Problème identifié

Le code avait **3 implémentations différentes** pour générer des PDF :

1. **`usePdfDownload`** - Hook pour télécharger des PDF depuis l'API
2. **`PDFPreviewModal` + `usePDFPreview`** - Modal de prévisualisation (dispersé)
3. **`pdf-export.ts`** - Génération HTML locale (non réutilisable)
4. Fonctions individuelles dans les services (`downloadPayrollPDF`, `getDeliveryNotePdfUrl`, etc.)

**Conséquences :**
- Code dupliqué partout
- Maintenance difficile
- Incohérence entre modules
- Pas de réutilisabilité

## Solution implémentée

### Architecture unifiée en 4 couches

```
┌─────────────────────────────────────────────────┐
│         Composants React (UI Layer)             │
│   PDFPreviewModal, PDFPreviewWrapper            │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│           Hooks React (Hook Layer)              │
│   usePDF, usePDFDownload, usePDFPreview         │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│         Service Layer (Business Logic)          │
│  PDFService.download(), fetchForPreview(), etc. │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│        Utilitaires (HTML Generation)            │
│   PDFGenerator, PDFFormatters, Templates        │
└─────────────────────────────────────────────────┘
```

### Fichiers créés

#### 1. **`lib/services/pdf.service.ts`**
Service principal avec :
- `PDFService.download()` - Téléchargement
- `PDFService.fetchForPreview()` - Prévisualisation
- `PDFService.generateFromHTML()` - Génération locale
- `PDFService.openInNewTab()` - Ouverture nouvel onglet
- `PDFEndpoints` - Constantes pour les endpoints API

#### 2. **`lib/hooks/usePDF.ts`**
Hook React unifié avec :
- `usePDF()` - Hook principal (toutes fonctionnalités)
- `usePDFDownload()` - Alias compatible ancien code
- `usePDFPreview()` - Alias compatible ancien code
- Gestion d'état (loading, downloading, previewState)

#### 3. **`lib/utils/pdf-generator.ts`**
Générateur de documents HTML avec :
- `PDFGenerator.createDocument()` - Template complet
- `PDFGenerator.createHeader()` - Header standardisé
- `PDFGenerator.createFooter()` - Footer standardisé
- `PDFGenerator.createInfoSection()` - Section d'infos
- `PDFGenerator.createTable()` - Tableaux de données
- `PDFFormatters` - Formatage dates, monnaie, etc.

#### 4. **`components/ui/pdf-preview.tsx`**
Composant UI amélioré avec :
- `PDFPreviewModal` - Modal de prévisualisation
- `PDFPreviewWrapper` - Wrapper pour usage facile
- Mode plein écran
- Téléchargement intégré
- Ouverture nouvel onglet

#### 5. **Documentation**
- `lib/services/pdf.README.md` - Documentation complète
- `lib/services/pdf.EXAMPLES.tsx` - 7 exemples pratiques

## Avantages

### 1. Centralisation
- **Un seul endroit** pour toute la logique PDF
- Facile à maintenir et améliorer
- Changements propagés partout automatiquement

### 2. Cohérence
- Même API dans tous les modules
- Comportement uniforme
- Expérience utilisateur cohérente

### 3. Réutilisabilité
- Hooks réutilisables partout
- Composants génériques
- Templates standardisés

### 4. Type-safety
- TypeScript complet
- Autocomplétion IDE
- Détection d'erreurs précoce

### 5. Compatibilité
- Les anciens hooks fonctionnent toujours
- Migration progressive possible
- Pas de breaking changes

## Usage rapide

### Téléchargement simple
```tsx
import { usePDF, PDFEndpoints } from '@/lib/hooks';

const { download, downloading } = usePDF();

<button onClick={() => download(
  PDFEndpoints.proforma('123'),
  'Proforma.pdf'
)}>
  Télécharger
</button>
```

### Prévisualisation
```tsx
import { usePDF } from '@/lib/hooks';
import { PDFPreviewWrapper } from '@/components/ui';

const { preview, previewState, closePreview } = usePDF();

<>
  <button onClick={() => preview(
    PDFEndpoints.deliveryNote('456'),
    'Bon de Livraison',
    'BL.pdf'
  )}>
    Prévisualiser
  </button>

  <PDFPreviewWrapper
    previewState={previewState}
    onClose={closePreview}
  />
</>
```

### Génération HTML locale
```tsx
import { PDFGenerator, PDFFormatters } from '@/lib/utils';

const content = PDFGenerator.createInfoSection([
  { label: 'Date', value: PDFFormatters.date(new Date()) },
  { label: 'Montant', value: PDFFormatters.currency(50000) },
]);

PDFGenerator.generate(content, { title: 'Mon Document' });
```

## Migration

### Ancien code (avant)
```tsx
import { usePdfDownload } from '@/lib/hooks/usePdfDownload';
import { PDFPreviewModal } from '@/components/ui/pdf-preview-modal';

const { downloadPdf, downloading } = usePdfDownload();
```

### Nouveau code (après)
```tsx
import { usePDF, PDFEndpoints } from '@/lib/hooks';
import { PDFPreviewWrapper } from '@/components/ui';

const { download, preview, downloading } = usePDF();
```

**Note :** L'ancien code continue de fonctionner ! Migration progressive possible.

## Modules utilisant les PDF

### Inventory
- ✅ Delivery Notes (bons de livraison)
- ✅ Proformas (factures pro forma)
- ✅ Sales (factures de vente)
- ✅ Expenses (dépenses)
- ✅ Stock Counts (inventaires)
- ✅ Orders (commandes)

### HR
- ✅ Payrolls (fiches de paie)
- ✅ Contracts (contrats)
- ✅ Leave Requests (demandes de congé)

## Endpoints PDF disponibles

```typescript
PDFEndpoints.deliveryNote(id)  // Bons de livraison
PDFEndpoints.proforma(id)       // Factures pro forma
PDFEndpoints.sale(id)           // Factures de vente
PDFEndpoints.expense(id)        // Dépenses
PDFEndpoints.stockCount(id)     // Inventaires
PDFEndpoints.order(id)          // Commandes
PDFEndpoints.payroll(id)        // Fiches de paie
PDFEndpoints.contract(id)       // Contrats
PDFEndpoints.leave(id)          // Demandes de congé
```

## Prochaines étapes (optionnel)

### 1. Migration progressive
Remplacer les usages de :
- `usePdfDownload` → `usePDF`
- `import { PDFPreviewModal } from 'pdf-preview-modal'` → `import { PDFPreviewWrapper } from '@/components/ui'`
- Fonctions individuelles → `PDFService` ou `usePDF`

### 2. Amélioration du générateur HTML
- Ajouter plus de templates (rapports, reçus, etc.)
- Support de logos d'entreprise
- Thèmes personnalisables

### 3. Tests
- Tests unitaires pour PDFService
- Tests d'intégration pour les hooks
- Tests E2E pour le modal

### 4. Performance
- Cache des PDFs générés
- Lazy loading du modal
- Optimisation des requêtes

## Structure des fichiers

```
lib/
├── services/
│   ├── pdf.service.ts          ← Service principal
│   ├── pdf.README.md           ← Documentation
│   └── pdf.EXAMPLES.tsx        ← Exemples
├── hooks/
│   └── usePDF.ts               ← Hooks React
└── utils/
    └── pdf-generator.ts        ← Générateur HTML

components/ui/
└── pdf-preview.tsx             ← Composant modal
```

## Compatibilité

- ✅ Next.js 16
- ✅ React 19
- ✅ TypeScript 5
- ✅ Client-side uniquement (`'use client'`)
- ✅ Tous les navigateurs modernes

## Notes importantes

1. **Client-side uniquement** : Utilise `localStorage` et `window`
2. **Anciens hooks conservés** : Pour compatibilité (dépréciation future)
3. **PDFEndpoints** : Ajouter de nouveaux endpoints au besoin
4. **Type-safety** : Tout est typé avec TypeScript
5. **Gestion blob URLs** : Nettoyage automatique pour éviter les fuites mémoire

## Support

Pour questions ou problèmes :
1. Consulter `pdf.README.md` pour la doc complète
2. Voir `pdf.EXAMPLES.tsx` pour des exemples
3. Vérifier les types TypeScript pour l'API

---

**Créé le :** 2026-02-09
**Auteur :** Service PDF Unifié
**Version :** 1.0.0
