# Module Inventory (Gestion des Stocks)

## Vue d'ensemble

Le module **Inventory** est un système complet de gestion des stocks, des ventes et des documents commerciaux. Il couvre toute la chaîne logistique et commerciale.

### Fonctionnalités principales

- **Produits** : CRUD complet, catégories, images, SKU
- **Entrepôts** : Gestion multi-entrepôts
- **Stocks** : Suivi en temps réel par entrepôt
- **Mouvements** : Historique des entrées/sorties
- **Fournisseurs** : Gestion fournisseurs
- **Commandes d'achat** : Purchase orders
- **Ventes** : Point de vente (POS), factures
- **Clients** : Gestion clients, crédits
- **Documents commerciaux** : Proformas, bons de livraison, factures
- **Inventaires physiques** : Stock counts
- **Alertes** : Stock bas, ruptures
- **Rapports** : Statistiques et analyses

---

## Structure

```
├── app/apps/(org)/[slug]/inventory/
│   ├── products/              # Produits
│   ├── categories/            # Catégories
│   ├── warehouses/            # Entrepôts
│   ├── suppliers/             # Fournisseurs
│   ├── orders/                # Commandes d'achat
│   ├── sales/                 # Ventes
│   ├── customers/             # Clients
│   ├── credit-sales/          # Ventes à crédit
│   ├── proformas/             # Factures proforma
│   ├── delivery-notes/        # Bons de livraison
│   ├── stock-counts/          # Inventaires
│   ├── movements/             # Mouvements
│   ├── alerts/                # Alertes
│   ├── expenses/              # Dépenses
│   └── reports/               # Rapports

├── components/inventory/
│   ├── products/
│   ├── sales/
│   └── common/

└── lib/services/inventory/
    ├── product.service.ts
    ├── warehouse.service.ts
    ├── stock.service.ts
    ├── movement.service.ts
    ├── supplier.service.ts
    ├── order.service.ts
    ├── sale.service.ts
    ├── customer.service.ts
    ├── alert.service.ts
    └── index.ts
```

---

## Produits

### Endpoints

```typescript
PRODUCTS: {
  LIST: '/inventory/products/',
  CREATE: '/inventory/products/',
  DETAIL: (id: string) => `/inventory/products/${id}/`,
  UPDATE: (id: string) => `/inventory/products/${id}/`,
  DELETE: (id: string) => `/inventory/products/${id}/`,
  STOCK_BY_WAREHOUSE: (id: string) => `/inventory/products/${id}/stock_by_warehouse/`,
  MOVEMENTS: (id: string) => `/inventory/products/${id}/movements/`,
}
```

### Types

```typescript
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: ProductCategory;
  unit_price: number;
  cost_price?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  image?: string;
  is_active: boolean;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  created_at: string;
  updated_at: string;
}
```

---

## Ventes

### Fonctionnalités

- Point de vente (POS)
- Vente rapide
- Ventes à crédit
- Paiements partiels
- Factures et reçus
- Historique des ventes

### Endpoints

```typescript
SALES: {
  LIST: '/inventory/sales/',
  CREATE: '/inventory/sales/',
  DETAIL: (id: string) => `/inventory/sales/${id}/`,
  UPDATE: (id: string) => `/inventory/sales/${id}/`,
  DELETE: (id: string) => `/inventory/sales/${id}/`,
  ADD_PAYMENT: (id: string) => `/inventory/sales/${id}/add_payment/`,
  RECEIPT: (id: string) => `/inventory/sales/${id}/receipt/`,
  INVOICE: (id: string) => `/inventory/sales/${id}/invoice/`,
  CANCEL: (id: string) => `/inventory/sales/${id}/cancel/`,
}
```

### Types

```typescript
export interface Sale {
  id: string;
  invoice_number: string;
  customer?: Customer;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'check' | 'credit';
  payment_status: 'paid' | 'partial' | 'unpaid';
  status: 'draft' | 'completed' | 'cancelled';
  sale_date: string;
  notes?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  warehouse: Warehouse;
}
```

---

## Inventaires Physiques (Stock Counts)

### Fonctionnalités

- Création d'inventaires
- Saisie des comptages
- Génération automatique des items
- Comparaison stock théorique vs réel
- Validation et ajustements automatiques
- Rapports d'écarts

### Workflow

```
Créer inventaire → En préparation (draft)
  ↓
Générer items automatiquement
  ↓
Démarrer inventaire → En cours (in_progress)
  ↓
Saisir comptages
  ↓
Compléter inventaire → Complété (completed)
  ↓
Analyser écarts
  ↓
Valider inventaire → Validé (validated)
  ↓
Ajustements automatiques des stocks
```

### Endpoints

```typescript
STOCK_COUNTS: {
  LIST: '/inventory/stock-counts/',
  CREATE: '/inventory/stock-counts/',
  DETAIL: (id: string) => `/inventory/stock-counts/${id}/`,
  UPDATE: (id: string) => `/inventory/stock-counts/${id}/`,
  DELETE: (id: string) => `/inventory/stock-counts/${id}/`,
  START: (id: string) => `/inventory/stock-counts/${id}/start/`,
  COMPLETE: (id: string) => `/inventory/stock-counts/${id}/complete/`,
  VALIDATE: (id: string) => `/inventory/stock-counts/${id}/validate/`,
  CANCEL: (id: string) => `/inventory/stock-counts/${id}/cancel/`,
  GENERATE_ITEMS: (id: string) => `/inventory/stock-counts/${id}/generate_items/`,
  AUTO_FILL_COUNTS: (id: string) => `/inventory/stock-counts/${id}/auto_fill_counts/`,
  DISCREPANCIES: (id: string) => `/inventory/stock-counts/${id}/discrepancies/`,
  SUMMARY: (id: string) => `/inventory/stock-counts/${id}/summary/`,
  EXPORT_PDF: (id: string) => `/inventory/stock-counts/${id}/export-pdf/`,
}
```

---

## Statistiques et Rapports

### Endpoints

```typescript
STATS: {
  OVERVIEW: '/inventory/stats/overview/',
  TOP_PRODUCTS: '/inventory/stats/top_products/',
  STOCK_BY_WAREHOUSE: '/inventory/stats/stock_by_warehouse/',
  STOCK_BY_CATEGORY: '/inventory/stats/stock_by_category/',
  MOVEMENT_HISTORY: '/inventory/stats/movement_history/',
  LOW_ROTATION_PRODUCTS: '/inventory/stats/low_rotation_products/',
  STOCK_COUNTS_SUMMARY: '/inventory/stats/stock_counts_summary/',
  FINANCIAL_ANALYSIS: '/inventory/stats/financial_analysis/',
  ABC_ANALYSIS: '/inventory/stats/abc_analysis/',
  CREDITS_REPORT: '/inventory/stats/credits_report/',
  SALES_PERFORMANCE: '/inventory/stats/sales_performance/',
}
```

### Types de rapports

- **Overview** : Vue d'ensemble (valeur stock, nb produits, alertes)
- **ABC Analysis** : Classification produits par valeur
- **Financial Analysis** : Analyse financière (CA, marges, coûts)
- **Sales Performance** : Performance des ventes
- **Credits Report** : Rapport des crédits clients

---

## Permissions Inventory

```
inventory.view_product
inventory.add_product
inventory.change_product
inventory.delete_product
inventory.view_sale
inventory.add_sale
inventory.change_sale
inventory.delete_sale
inventory.view_stockcount
inventory.add_stockcount
inventory.validate_stockcount
inventory.view_customer
inventory.add_customer
inventory.change_customer
```

---

## Composants clés

### QuickSaleModal

Modal de vente rapide pour le POS.

`components/common/tools/quick-sale-modal.tsx`

- Sélection rapide de produits
- Calcul automatique des totaux
- Gestion des paiements
- Impression de reçu

### QRScanFab

Bouton flottant pour scanner des codes-barres.

`components/common/tools/qr-scan-fab.tsx`

- Scanner QR/barcode
- Recherche de produit
- Ajout rapide au panier

---

## Bonnes pratiques

### Gestion des stocks

1. Toujours vérifier les quantités disponibles avant vente
2. Utiliser les mouvements pour tracer toute modification
3. Effectuer des inventaires réguliers
4. Configurer des alertes pour les stocks bas

### Ventes

1. Valider les stocks avant confirmation
2. Gérer les paiements partiels
3. Émettre des reçus/factures systématiquement
4. Suivre les crédits clients

### Inventaires

1. Planifier les inventaires hors heures de pointe
2. Former le personnel au comptage
3. Utiliser la génération automatique des items
4. Analyser les écarts avant validation

---

## Références

- [Inventory Management Best Practices](https://www.oracle.com/scm/inventory-management/)
- [ABC Analysis](https://en.wikipedia.org/wiki/ABC_analysis)
- [Point of Sale Systems](https://www.shopify.com/pos)
