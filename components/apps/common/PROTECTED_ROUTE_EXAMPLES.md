# Exemples d'utilisation du composant `Can` avec permissions et modules

Le composant `Can` permet de protéger du contenu en fonction des **permissions utilisateur** ET des **modules actifs** de l'organisation.

## Import

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/permissions';
```

## Exemples de base

### 1. Protection par permission uniquement

```tsx
// Afficher seulement si l'utilisateur a la permission VIEW_EMPLOYEES
<Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
  <EmployeeList />
</Can>
```

### 2. Protection par module uniquement

```tsx
// Afficher seulement si le module hr.payroll est activé
<Can requiredModule="hr.payroll">
  <PayrollSection />
</Can>
```

### 3. Protection par permission ET module

```tsx
// Afficher seulement si :
// - L'utilisateur a la permission VIEW_PAYROLL
// - ET le module hr.payroll est activé
<Can
  permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}
  requiredModule="hr.payroll"
>
  <PayrollDetails />
</Can>
```

## Exemples avancés

### 4. Au moins une permission (OR)

```tsx
// Afficher si l'utilisateur a au moins UNE de ces permissions
<Can anyPermissions={[
  COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
  COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS
]}>
  <HROverview />
</Can>
```

### 5. Toutes les permissions (AND)

```tsx
// Afficher si l'utilisateur a TOUTES ces permissions
<Can allPermissions={[
  COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
  COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES
]}>
  <EditEmployeeButton />
</Can>
```

### 6. Au moins un module (OR)

```tsx
// Afficher si au moins UN de ces modules est activé
<Can anyRequiredModules={[
  "inventory.products",
  "inventory.sales"
]}>
  <InventoryDashboard />
</Can>
```

### 7. Tous les modules (AND)

```tsx
// Afficher si TOUS ces modules sont activés
<Can requiredModules={[
  "inventory.products",
  "inventory.warehouses",
  "inventory.movements"
]}>
  <AdvancedInventoryFeatures />
</Can>
```

## Cas d'usage combinés

### 8. Permission + Plusieurs modules

```tsx
// Permission + au moins un module
<Can
  permission={COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS}
  anyRequiredModules={["inventory.products", "inventory.sales"]}
>
  <ProductCatalog />
</Can>
```

### 9. Admin uniquement

```tsx
// Seulement pour les administrateurs
<Can adminOnly>
  <AdminPanel />
</Can>
```

### 10. Avec fallback personnalisé

```tsx
// Afficher un message personnalisé si accès refusé
<Can
  requiredModule="hr.payroll"
  fallback={
    <Alert variant="warning">
      Le module Paie n'est pas activé pour votre organisation.
      Contactez votre administrateur.
    </Alert>
  }
>
  <PayrollContent />
</Can>
```

### 11. Avec message d'erreur complet

```tsx
// Afficher un message d'erreur complet avec bouton retour
<Can
  requiredModule="inventory.reports"
  permission={COMMON_PERMISSIONS.INVENTORY.VIEW_REPORTS}
  showMessage={true}
>
  <ReportsPage />
</Can>
```

## Exemples pratiques par module

### Module RH

```tsx
// Section Paie
<Can requiredModule="hr.payroll" permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
  <PayrollSection />
</Can>

// Section Congés
<Can requiredModule="hr.leave" permission={COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS}>
  <LeaveManagement />
</Can>

// Section Pointage
<Can requiredModule="hr.attendance" permission={COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE}>
  <AttendanceTracking />
</Can>

// Section Contrats
<Can requiredModule="hr.contracts" permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
  <ContractsList />
</Can>
```

### Module Inventaire

```tsx
// Catalogue produits
<Can requiredModule="inventory.products" permission={COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS}>
  <ProductCatalog />
</Can>

// Gestion entrepôts
<Can requiredModule="inventory.warehouses" permission={COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES}>
  <WarehouseManagement />
</Can>

// Mouvements de stock
<Can requiredModule="inventory.movements" permission={COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK}>
  <StockMovements />
</Can>

// Ventes
<Can requiredModule="inventory.sales" permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES}>
  <SalesModule />
</Can>

// Achats
<Can requiredModule="inventory.purchases" permission={COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS}>
  <PurchaseOrders />
</Can>

// Rapports
<Can requiredModule="inventory.reports" permission={COMMON_PERMISSIONS.INVENTORY.VIEW_REPORTS}>
  <InventoryReports />
</Can>
```

## Protection de pages entières

```tsx
// Dans une page Next.js
export default function PayrollPage() {
  return (
    <Can
      requiredModule="hr.payroll"
      permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}
      showMessage={true}
    >
      <div className="container mx-auto p-6">
        <h1>Gestion de la Paie</h1>
        {/* Contenu de la page */}
      </div>
    </Can>
  );
}
```

## Protection conditionnelle dans les menus

```tsx
// Menu qui s'adapte automatiquement
const menuItems = [
  {
    label: "Employés",
    component: (
      <Can requiredModule="hr.employees" permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
        <MenuItem to="/hr/employees">Employés</MenuItem>
      </Can>
    )
  },
  {
    label: "Paie",
    component: (
      <Can requiredModule="hr.payroll" permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
        <MenuItem to="/hr/payroll">Paie</MenuItem>
      </Can>
    )
  },
  // ...
];
```

## Logique de vérification

Le composant `Can` vérifie :

1. **Permissions** : L'utilisateur a-t-il les permissions nécessaires ?
2. **Modules** : Les modules requis sont-ils activés pour l'organisation ?
3. **Combinaison** : Les DEUX conditions doivent être vraies

### Admins

- Les admins **ignorent les vérifications de permissions** (toujours autorisés)
- Les admins **ne peuvent PAS ignorer** les vérifications de modules
  - Même un admin ne peut pas accéder à une fonctionnalité si le module est désactivé

### Messages d'erreur

Le composant adapte le message en fonction de la raison du refus :

- **Module désactivé** : "Cette fonctionnalité n'est pas disponible. Le module requis n'est pas activé."
- **Permission manquante** : "Vous n'avez pas les permissions nécessaires."
- **Les deux** : "Accès refusé : module non activé et permissions insuffisantes."
