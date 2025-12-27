# 🚀 Guide de Migration - Composants Réutilisables

Date : 27 Décembre 2025
Statut : ✅ Composants Créés | 🔄 Migration en Cours

---

## 📋 Checklist Rapide

Pour migrer une page de liste (employees, products, etc.) :

```tsx
// ❌ AVANT (800+ lignes)
export default function Page() {
  // 50 lignes de state management
  // 100 lignes de table HTML
  // 50 lignes de search bar
  // 60 lignes de filtres
  // 80 lignes de pagination
  // 40 lignes d'empty state
  // 50 lignes de loading skeleton
  // 100 lignes de dropdown actions
  // 50 lignes de delete modal
}

// ✅ APRÈS (~150 lignes)
import {
  DataTable,
  StatsGrid,
  DeleteConfirmation,
  createStat
} from '@/components/common';

export default function Page() {
  // Logique métier uniquement
  return (
    <>
      <StatsGrid stats={stats} columns={4} />
      <DataTable {...config} />
      <DeleteConfirmation {...deleteDialog} />
    </>
  );
}
```

---

## 🎯 Plan de Migration par Priorité

### ✅ Phase 1 : COMPLÉTÉ
- [x] Créer les composants réutilisables
- [x] Créer les exemples refactored
- [x] employees/page.refactored.tsx (892 → 364 lignes)
- [x] departments/page.refactored.tsx (633 → 200 lignes)

### 🔄 Phase 2 : HR Module (En cours)

**Pages à migrer** :

1. **`app/apps/(org)/[slug]/hr/roles/page.tsx`**
   - Estimation : 450 lignes → ~120 lignes
   - Pattern : Liste simple avec statut actif/inactif
   - Composants : DataTable, DeleteConfirmation

2. **`app/apps/(org)/[slug]/hr/contracts/page.tsx`**
   - Estimation : 546 lignes → ~150 lignes
   - Pattern : Liste avec filtres par type et statut
   - Composants : DataTable, StatsGrid, DeleteConfirmation

3. **`app/apps/(org)/[slug]/hr/leaves/page.tsx`**
   - Estimation : ~500 lignes → ~130 lignes
   - Pattern : Liste avec filtres par statut et type
   - Composants : DataTable, StatsGrid, ActionConfirmation

4. **`app/apps/(org)/[slug]/hr/payroll/page.tsx`**
   - Estimation : 1,418 lignes → ~280 lignes
   - Pattern : Complexe avec statistiques détaillées
   - Composants : DataTable, StatsGrid (detailed), ActionConfirmation

### 📦 Phase 3 : Inventory Module

**Pages à migrer** :

1. **`app/apps/(org)/[slug]/inventory/products/page.tsx`**
   - Estimation : 370 lignes → ~100 lignes
   - Pattern : Liste avec catégories et stock
   - Composants : DataTable, StatsGrid

2. **`app/apps/(org)/[slug]/inventory/suppliers/page.tsx`**
   - Estimation : 314 lignes → ~80 lignes
   - Pattern : Liste simple
   - Composants : DataTable, DeleteConfirmation

3. **`app/apps/(org)/[slug]/inventory/warehouses/page.tsx`**
   - Estimation : ~300 lignes → ~80 lignes
   - Pattern : Liste avec localisation
   - Composants : DataTable, StatsGrid

---

## 📖 Patterns de Migration

### Pattern 1 : Liste Simple (Roles, Suppliers)

**Configuration minimale** :

```tsx
import { DataTable, DeleteConfirmation } from '@/components/common';

// 1. Définir les colonnes
const columns: DataTableColumn<Role>[] = [
  {
    key: 'name',
    header: 'Nom',
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: 'is_active',
    header: 'Actif',
    cell: (row) => <StatusBadge isActive={row.is_active} />,
  },
];

// 2. Définir les actions
const getActions = (row: Role): DataTableAction<Role>[] => [
  {
    label: 'Modifier',
    icon: HiOutlinePencil,
    href: () => `/apps/${slug}/hr/roles/${row.id}/edit`,
    permission: COMMON_PERMISSIONS.HR.UPDATE_ROLES,
  },
  { separator: true },
  {
    label: 'Supprimer',
    icon: HiOutlineTrash,
    onClick: () => openDeleteDialog(row),
    variant: 'destructive',
    permission: COMMON_PERMISSIONS.HR.DELETE_ROLES,
  },
];

// 3. Utiliser dans le JSX
<DataTable
  data={roles}
  columns={columns}
  getRowKey={(row) => row.id}
  searchable={{
    placeholder: "Rechercher un rôle...",
    fields: ['name', 'description'],
  }}
  actions={getActions}
  emptyState={{
    icon: HiOutlineBriefcase,
    title: "Aucun rôle",
    description: "Créez votre premier rôle",
    action: {
      label: "Créer un rôle",
      href: `/apps/${slug}/hr/roles/create`,
      permission: COMMON_PERMISSIONS.HR.CREATE_ROLES,
    },
  }}
  loading={loading}
/>
```

### Pattern 2 : Liste avec Statistiques (Employees, Products)

**Ajouter StatsGrid** :

```tsx
import { DataTable, StatsGrid, createStat } from '@/components/common';

// 1. Créer les stats
const stats = useMemo(() => [
  createStat('Total', total, {
    icon: HiOutlineUsers,
    iconColor: 'text-primary',
    iconBgColor: 'bg-primary/10',
  }),
  createStat('Actifs', activeCount, {
    icon: HiOutlineCheckCircle,
    valueColor: 'success',
  }),
  createStat('En stock', inStockCount, {
    valueColor: 'info',
    subtitle: `${percentage}% de l'inventaire`,
  }),
], [data]);

// 2. Utiliser dans le JSX
<>
  <StatsGrid stats={stats} columns={4} />
  <DataTable {...config} />
</>
```

### Pattern 3 : Liste avec Filtres Multiples (Leaves, Contracts)

**Ajouter filterable** :

```tsx
<DataTable
  data={data}
  columns={columns}

  // Recherche
  searchable={{
    placeholder: "Rechercher...",
    fields: ['employee_name', 'type'],
  }}
  onSearchChange={setSearchQuery}

  // Filtres
  filterable={[
    {
      key: 'status',
      label: 'Statut',
      options: [
        { value: 'pending', label: 'En attente' },
        { value: 'approved', label: 'Approuvé' },
        { value: 'rejected', label: 'Rejeté' },
      ],
    },
    {
      key: 'leave_type',
      label: 'Type de congé',
      options: leaveTypeOptions,
    },
  ]}
  activeFilters={filters}
  onFilterChange={(key, value) => setFilters({ ...filters, [key]: value })}

  // Pagination
  pagination={{
    pageSize: 20,
    total: totalCount,
    currentPage: currentPage,
  }}
  onPageChange={loadData}
/>
```

### Pattern 4 : Dialog de Confirmation

**Pour suppression** :

```tsx
import { DeleteConfirmation } from '@/components/common';

// 1. State
const [deleteDialog, setDeleteDialog] = useState({
  open: false,
  id: null,
  name: '',
});

// 2. Handler
const handleDelete = async (id: string) => {
  await deleteItem(id);
  await loadData();
  setDeleteDialog({ open: false, id: null, name: '' });
};

// 3. JSX
<DeleteConfirmation
  open={deleteDialog.open}
  onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
  itemName={deleteDialog.name}
  onConfirm={() => deleteDialog.id && handleDelete(deleteDialog.id)}
  loading={deleting}
/>
```

**Pour action générique** :

```tsx
import { ActionConfirmation } from '@/components/common';

<ActionConfirmation
  open={confirmDialog.open}
  onOpenChange={setConfirmDialog}
  action={{
    label: "Approuver le congé",
    variant: "default",
    icon: "success",
  }}
  target={leave?.employee_name}
  description="Cette action enverra une notification à l'employé"
  onConfirm={() => handleApprove(leave.id)}
  loading={processing}
/>
```

---

## 🔧 Étapes Détaillées de Migration

### Étape 1 : Analyser la Page Actuelle

```bash
# Identifier les patterns
- [ ] Table avec colonnes ?
- [ ] Recherche ?
- [ ] Filtres ?
- [ ] Pagination ?
- [ ] Actions par ligne ?
- [ ] Statistiques ?
- [ ] Dialog de confirmation ?
```

### Étape 2 : Extraire les Configurations

**Créer des constantes en haut du fichier** :

```tsx
// Configuration des colonnes
const createColumns = (slug: string): DataTableColumn<Employee>[] => [
  // ...
];

// Configuration de recherche
const SEARCH_CONFIG = {
  placeholder: "Rechercher...",
  fields: ['name', 'email'],
};

// Configuration des filtres
const FILTER_CONFIG = [
  {
    key: 'status',
    label: 'Statut',
    options: STATUS_OPTIONS,
  },
];

// Configuration de l'état vide
const EMPTY_STATE_CONFIG = {
  icon: HiOutlineUsers,
  title: "Aucun élément",
  description: "Créez votre premier élément",
  action: {
    label: "Créer",
    href: `/apps/${slug}/create`,
  },
};
```

### Étape 3 : Simplifier le State Management

**Avant** :
```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [filters, setFilters] = useState({});
const [currentPage, setCurrentPage] = useState(1);
const [totalCount, setTotalCount] = useState(0);
const [deleteDialog, setDeleteDialog] = useState({ open: false });
```

**Après** (garder uniquement) :
```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
// DataTable gère search, filters, pagination en interne ou via callbacks
```

### Étape 4 : Remplacer le JSX

**Supprimer** :
- Tout le code de la table HTML
- Le code de la barre de recherche
- Le code des filtres
- Le code de pagination
- Le skeleton de loading
- L'état vide custom
- Le dropdown des actions

**Remplacer par** :
```tsx
<DataTable
  data={data}
  columns={createColumns(slug)}
  getRowKey={(row) => row.id}
  searchable={SEARCH_CONFIG}
  filterable={FILTER_CONFIG}
  actions={getRowActions}
  pagination={{ pageSize: 20, total: totalCount, currentPage }}
  onPageChange={loadData}
  emptyState={EMPTY_STATE_CONFIG}
  loading={loading}
/>
```

### Étape 5 : Tester

```bash
# Vérifications
- [ ] La recherche fonctionne
- [ ] Les filtres fonctionnent
- [ ] La pagination fonctionne
- [ ] Les actions par ligne fonctionnent
- [ ] Les permissions sont respectées
- [ ] L'état vide s'affiche correctement
- [ ] Le loading s'affiche correctement
- [ ] Le responsive fonctionne
```

---

## 📊 Métriques de Succès

### Par Page Migrée

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Lignes de code | 500-1,400 | 100-280 | 60-80% |
| Composants custom | 10-15 | 3-5 | 60-70% |
| Bugs potentiels | Élevé | Faible | Centralisé |
| Temps de dev | 2-3 jours | 2-3 heures | 90% |

### Global (Projet Complet)

- **Code dupliqué éliminé** : ~8,650 lignes
- **Code réutilisable créé** : ~950 lignes
- **Réduction nette** : **89%**
- **Pages à migrer** : 50+
- **Temps estimé** : 2 semaines

---

## 🚨 Points d'Attention

### 1. Permissions

**Toujours vérifier** que les permissions sont correctement définies :

```tsx
actions={(row) => [
  {
    label: 'Modifier',
    permission: COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES, // ✅ Requis
    href: () => `/edit/${row.id}`,
  }
]}
```

### 2. Type Safety

**Utiliser les types génériques** :

```tsx
// ✅ Bon
const columns: DataTableColumn<Employee>[] = [...]
const actions: DataTableAction<Employee>[] = [...]

// ❌ Éviter
const columns: any[] = [...]
```

### 3. Performance

**Utiliser useMemo pour les calculs** :

```tsx
// ✅ Bon
const stats = useMemo(() => [
  createStat('Total', total, {...}),
], [total]);

// ❌ Éviter (recalcul à chaque render)
const stats = [
  createStat('Total', total, {...}),
];
```

### 4. État Vide vs Aucun Résultat

**Différencier** :

```tsx
emptyState={{
  title: searchQuery || filters.length > 0
    ? "Aucun résultat" // Filtres actifs
    : "Aucun élément", // Vraiment vide
  description: searchQuery
    ? "Essayez d'autres termes de recherche"
    : "Créez votre premier élément",
}}
```

---

## 🎓 Exemples Complets

### Exemple 1 : Page Simple (Roles)

```tsx
// app/apps/(org)/[slug]/hr/roles/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  DataTable,
  DeleteConfirmation,
  type DataTableColumn,
  type DataTableAction,
} from "@/components/common";
import { Button } from "@/components/ui";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";
import { getRoles, deleteRole } from "@/lib/services/hr";
import type { Role } from "@/lib/types/hr";
import {
  HiOutlinePlusCircle,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineBriefcase,
} from "react-icons/hi2";

// Configuration des colonnes
const createColumns = (slug: string): DataTableColumn<Role>[] => [
  {
    key: 'name',
    header: 'Nom',
    cell: (row) => (
      <Link
        href={`/apps/${slug}/hr/roles/${row.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.name}
      </Link>
    ),
  },
  {
    key: 'description',
    header: 'Description',
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.description || '-'}
      </span>
    ),
  },
  {
    key: 'is_active',
    header: 'Actif',
    cell: (row) => (
      row.is_active ? (
        <HiOutlineCheckCircle className="size-5 text-green-600" />
      ) : (
        <HiOutlineXCircle className="size-5 text-gray-400" />
      )
    ),
    className: 'text-center',
  },
];

export default function RolesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null as string | null,
    name: '',
  });
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRoles({ organization_subdomain: slug });
      setRoles(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await deleteRole(id);
      await loadData();
      setDeleteDialog({ open: false, id: null, name: '' });
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const getActions = (row: Role): DataTableAction<Role>[] => [
    {
      label: 'Modifier',
      icon: HiOutlinePencil,
      href: () => `/apps/${slug}/hr/roles/${row.id}/edit`,
      permission: COMMON_PERMISSIONS.HR.UPDATE_ROLES,
    },
    { separator: true },
    {
      label: 'Supprimer',
      icon: HiOutlineTrash,
      onClick: () => setDeleteDialog({
        open: true,
        id: row.id,
        name: row.name,
      }),
      variant: 'destructive',
      permission: COMMON_PERMISSIONS.HR.DELETE_ROLES,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Rôles</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les rôles de votre organisation
          </p>
        </div>
        <Can permission={COMMON_PERMISSIONS.HR.CREATE_ROLES}>
          <Button asChild>
            <Link href={`/apps/${slug}/hr/roles/create`}>
              <HiOutlinePlusCircle className="size-5 mr-2" />
              Nouveau rôle
            </Link>
          </Button>
        </Can>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <DataTable
        data={roles}
        columns={createColumns(slug)}
        getRowKey={(row) => row.id}
        searchable={{
          placeholder: "Rechercher un rôle...",
          fields: ['name', 'description'],
        }}
        actions={getActions}
        emptyState={{
          icon: HiOutlineBriefcase,
          title: "Aucun rôle",
          description: "Créez votre premier rôle",
          action: {
            label: "Créer un rôle",
            href: `/apps/${slug}/hr/roles/create`,
            permission: COMMON_PERMISSIONS.HR.CREATE_ROLES,
          },
        }}
        loading={loading}
      />

      <DeleteConfirmation
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        itemName={deleteDialog.name}
        onConfirm={() => deleteDialog.id && handleDelete(deleteDialog.id)}
        loading={deleting}
      />
    </div>
  );
}
```

**Résultat** : ~150 lignes au lieu de 450+ lignes (67% de réduction)

---

## 📝 Checklist Finale

Avant de considérer une page comme "migrée" :

- [ ] Code réduit de 60%+
- [ ] Utilise DataTable au lieu de table HTML
- [ ] Utilise StatsGrid si stats présentes
- [ ] Utilise DeleteConfirmation/ActionConfirmation
- [ ] Configurations extraites en constantes
- [ ] Types génériques utilisés
- [ ] Permissions vérifiées
- [ ] État vide configuré
- [ ] Loading state configuré
- [ ] Toutes les fonctionnalités testées
- [ ] Responsive testé
- [ ] Aucune régression

---

## ✅ Conclusion

La migration vers les composants réutilisables transforme radicalement la base de code :

- **89% moins de duplication**
- **60-80% moins de code par page**
- **Cohérence visuelle garantie**
- **Maintenance simplifiée**
- **Bugs centralisés**
- **Onboarding rapide**

**Prochaines étapes** :
1. Migrer les pages HR prioritaires
2. Migrer les pages Inventory
3. Valider avec les utilisateurs
4. Supprimer les anciennes versions

**ROI immédiat** : Chaque page migrée économise des heures de maintenance future.
