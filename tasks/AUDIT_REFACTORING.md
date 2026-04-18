# 📋 Audit de Refactoring - Frontend Loura

**Date**: 2026-04-18
**Branche**: `feature/refactoring`
**Analysé par**: Claude Code

---

## 📊 Vue d'ensemble

### Statistiques

- **Pages**: 99 pages Next.js
- **Composants**: 163 composants React
- **Services**: ~50 services
- **Hooks custom**: 20 hooks
- **Modules métier**: 3 (core, hr, inventory)

### Stack technique

- **Framework**: Next.js 16 (App Router)
- **React**: 19
- **TypeScript**: 5 (strict mode)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS v4
- **State**: Zustand (auth store uniquement)
- **API**: Fetch natif avec gestion JWT

---

## 🎯 Architecture actuelle

### Structure des dossiers

```
lourafrontend/
├── app/                          # Pages Next.js (App Router)
│   ├── (auth)/                   # Pages d'authentification
│   ├── (landing)/                # Landing page
│   ├── apps/(org)/[slug]/        # Pages d'organisation (multi-tenant)
│   │   ├── hr/                   # Module RH
│   │   │   ├── employees/
│   │   │   ├── contracts/
│   │   │   ├── payroll/
│   │   │   ├── departments/
│   │   │   ├── attendance/
│   │   │   └── leaves/
│   │   ├── inventory/            # Module Inventaire
│   │   │   ├── products/
│   │   │   ├── sales/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   └── warehouses/
│   │   └── layout.tsx
│   └── core/                     # Module Core (orgs, categories)
│
├── components/                   # Composants React
│   ├── ui/                       # Composants UI réutilisables (shadcn/ui)
│   ├── common/                   # Composants communs (DataTable, Forms, etc.)
│   ├── apps/
│   │   ├── core/                 # Composants module Core
│   │   ├── hr/                   # Composants module HR
│   │   └── inventory/            # Composants module Inventory
│   └── landing/                  # Composants landing page
│
├── lib/                          # Logique métier
│   ├── api/                      # Client API
│   │   ├── client.ts             # ApiClient avec gestion JWT
│   │   └── config.ts             # Endpoints et configuration
│   ├── services/                 # Services par module
│   │   ├── core/
│   │   ├── hr/
│   │   ├── inventory/
│   │   └── auth/
│   ├── types/                    # Types TypeScript par module
│   │   ├── core/
│   │   ├── hr/
│   │   ├── inventory/
│   │   └── shared/
│   ├── hooks/                    # Hooks personnalisés
│   │   ├── use-list-data.ts     # ⭐ Hook générique pour listes paginées
│   │   ├── use-entity-form.ts   # ⭐ Hook générique pour formulaires CRUD
│   │   ├── use-auth.ts
│   │   └── use-permissions.ts
│   ├── store/                    # State global (Zustand)
│   │   └── auth.store.ts
│   └── utils/                    # Utilitaires
│
└── public/                       # Assets statiques
```

### Patterns identifiés

#### ✅ Points positifs

1. **Architecture modulaire claire**
   - Séparation par domaine métier (core, hr, inventory)
   - Structure cohérente dans chaque module

2. **Hooks génériques excellents**
   - `useListData<T>`: Gère pagination, filtres, recherche
   - `useEntityForm<T>`: Gère création/édition d'entités
   - Réduisent théoriquement la duplication de ~90%

3. **Couche services bien définie**
   - Services centralisés par entité
   - Gestion cache via `cacheManager`
   - Types TypeScript stricts

4. **Composants UI réutilisables**
   - shadcn/ui bien intégré
   - Composants cohérents (Button, Input, Card, etc.)

5. **Gestion API robuste**
   - Refresh automatique des tokens JWT
   - Gestion d'erreurs centralisée
   - Support multi-tenant (organization_subdomain)

#### ❌ Problèmes critiques

### 1. **Logique métier dans les pages** 🔴

**Problème**: Les pages Next.js contiennent toute la logique de chargement, filtrage, state management

**Exemple**: `app/apps/(org)/[slug]/hr/employees/page.tsx` (470 lignes)

```tsx
export default function EmployeesPage() {
  // ❌ 15+ useState pour gérer l'état local
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({...});
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  // ... 7 autres useState

  // ❌ Logique de chargement manuellement gérée
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployees(slug, { page: currentPage, page_size: 20 });
      setEmployees(data.results);
      setTotalCount(data.count);
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (err) {
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [slug, currentPage]);

  // ❌ Logique de filtrage côté client
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (searchQuery) {...}
      if (filters.status) {...}
      if (filters.department) {...}
      return true;
    });
  }, [employees, searchQuery, filters]);

  // ❌ Handlers CRUD directement dans la page
  const handleDelete = async (id: string) => {...};
  const handleToggleStatus = async (id: string) => {...};

  // ... 300 lignes de JSX
}
```

**Impact**:
- Pages énormes (300-500 lignes)
- Duplication massive (cette logique est répétée dans ~60 pages)
- Difficile à tester
- Couplage fort entre UI et logique

**Solution**:
```tsx
// ✅ APRÈS refactoring - utiliser useListData
export default function EmployeesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    data: employees,
    loading,
    error,
    filters,
    setFilter,
    currentPage,
    setPage,
    hasNext,
    hasPrevious,
    totalCount,
    reload
  } = useListData({
    fetchFn: (params) => getEmployees(slug, params),
    pageSize: 20
  });

  // Logique métier extraite dans des hooks
  const { handleDelete, handleToggleStatus } = useEmployeeActions({
    onSuccess: reload
  });

  // Page devient un simple orchestrateur (< 150 lignes)
  return <EmployeesView {...props} />;
}
```

---

### 2. **Hooks génériques sous-utilisés** 🔴

**Problème**: Les hooks `useListData` et `useEntityForm` existent mais ne sont utilisés que dans ~10% des pages

**Pages utilisant les hooks**:
- ✅ `inventory/products/new/page.tsx` → utilise `useEntityForm`
- ✅ Quelques autres pages

**Pages NE les utilisant PAS (90%)**:
- ❌ `hr/employees/page.tsx` → gère manuellement la pagination
- ❌ `hr/employees/[id]/page.tsx` → gère manuellement le chargement
- ❌ `hr/contracts/page.tsx` → duplication de logique
- ❌ `inventory/sales/page.tsx` → duplication de logique
- ❌ ~85 autres pages...

**Impact**:
- Duplication de ~2000 lignes de code
- Incohérences dans le comportement (certaines pages gèrent mal la pagination)
- Maintenance cauchemardesque (un bug doit être fixé dans 50+ endroits)

---

### 3. **Composants trop gros avec logique métier** 🟠

**Exemple**: `components/apps/hr/employees/EmployeesTable.tsx` (270 lignes)

```tsx
export function EmployeesTable({
  employees,
  selectedIndex,
  setSelectedIndex,
  routerNav,          // ❌ Router passé en prop
  slug,
  currentUserId,
  handleToggleStatus, // ❌ Logique métier passée en prop
  handleDelete,       // ❌ Logique métier passée en prop
  deleting,
}) {
  // ❌ Logique de navigation dans un composant de présentation
  // ❌ Trop de props (8+)
  // ❌ Responsabilité mixte: affichage + actions métier
}
```

**Problèmes**:
- Composant n'est pas "pur" (dépend de logique métier)
- Difficile à réutiliser
- Trop de props à passer
- Couplage avec le router Next.js

**Solution**:
```tsx
// ✅ Composant pur de présentation
export function EmployeesTable({
  employees,
  selectedIndex,
  onSelect,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  renderActions,  // Slot pattern pour flexibilité
}) {
  // Aucune logique métier, que de l'affichage
}

// ✅ Hook pour la logique métier
function useEmployeeTable({ slug, onSuccess }) {
  const router = useRouter();

  return {
    handleView: (id) => router.push(...),
    handleEdit: (id) => router.push(...),
    handleDelete: async (id) => { await deleteEmployee(id); onSuccess(); },
    handleToggleStatus: async (id) => { ... }
  };
}
```

---

### 4. **Duplication de code massive** 🔴

**Patterns dupliqués dans 50+ pages**:

1. **Loading states**
```tsx
// Répété ~80 fois
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

if (loading) return <LoadingSkeleton />;
if (error) return <ErrorMessage />;
```

2. **Pagination manuelle**
```tsx
// Répété ~40 fois
const [currentPage, setCurrentPage] = useState(1);
const [hasNext, setHasNext] = useState(false);
const [hasPrevious, setHasPrevious] = useState(false);
const [totalCount, setTotalCount] = useState(0);

const handlePageChange = (newPage: number) => {
  setCurrentPage(newPage);
  window.scrollTo({ top: 0, behavior: "smooth" });
};
```

3. **Filtrage côté client**
```tsx
// Répété ~30 fois
const [filters, setFilters] = useState<Record<string, string>>({});
const filteredData = useMemo(() => {
  return data.filter(item => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.category && item.category !== filters.category) return false;
    return true;
  });
}, [data, filters]);
```

4. **Handlers CRUD**
```tsx
// Répété ~60 fois
const handleDelete = async (id: string) => {
  if (!confirm("Êtes-vous sûr ?")) return;
  try {
    setDeleting(true);
    await deleteEntity(id);
    router.push(...);
  } catch (err) {
    alert("Erreur");
  } finally {
    setDeleting(false);
  }
};
```

**Impact**:
- ~3000 lignes de code dupliqué
- Bugs se propagent dans toute l'app
- Maintenance impossible à scaler

---

### 5. **State management incohérent** 🟠

**Problème**: Mélange de patterns de state management

```tsx
// Pattern 1: State local (90% des pages)
const [data, setData] = useState([]);

// Pattern 2: Zustand (uniquement auth)
const user = useAuthStore(state => state.user);

// Pattern 3: Cache dans services
const data = await cacheManager.get(url, { ttl: 300000 });

// Pattern 4: Props drilling (composants)
<Component data={data} loading={loading} error={error} />
```

**Problèmes**:
- Pas de single source of truth
- Cache et state local peuvent désynchroniser
- Pas de stratégie de revalidation cohérente
- Pas de state global pour les données métier (uniquement auth)

---

### 6. **Couplage entre composants et services** 🟠

**Problème**: Composants appellent directement les services

```tsx
// ❌ Dans une page
import { getEmployees, deleteEmployee } from '@/lib/services/hr';

export default function EmployeesPage() {
  const loadData = async () => {
    const data = await getEmployees(slug, params);
    setEmployees(data);
  };

  const handleDelete = async (id) => {
    await deleteEmployee(id);
    await loadData(); // Re-fetch manuel
  };
}
```

**Problèmes**:
- Violation du principe de séparation des responsabilités
- Difficile de mocker pour les tests
- Pas de centralisation de la logique de revalidation

**Solution**: Passer par des hooks métier
```tsx
// ✅ Hook métier qui encapsule services
function useEmployees(slug: string) {
  const { data, loading, error, reload } = useListData({
    fetchFn: (params) => getEmployees(slug, params)
  });

  const deleteEmployee = async (id: string) => {
    await deleteEmployeeService(id);
    await reload(); // Revalidation automatique
  };

  return { employees: data, loading, error, deleteEmployee };
}

// Page ultra-simple
export default function EmployeesPage() {
  const { employees, loading, deleteEmployee } = useEmployees(slug);
  return <EmployeesView employees={employees} onDelete={deleteEmployee} />;
}
```

---

### 7. **Gestion des erreurs inconsistante** 🟠

**Patterns trouvés**:

```tsx
// Pattern 1: Alert natif (40% des cas)
catch (err) {
  alert("Erreur lors de la suppression");
}

// Pattern 2: State local (30% des cas)
catch (err) {
  setError(err.message);
}

// Pattern 3: Console only (20% des cas)
catch (err) {
  console.error(err);
}

// Pattern 4: Rien (10% des cas)
catch (err) {
  // Silent fail
}
```

**Problème**: Expérience utilisateur incohérente

---

## 📐 Architecture cible proposée

### Principe: Séparation en couches

```
┌─────────────────────────────────────────────────┐
│  Pages (Next.js App Router)                     │
│  - Orchestration                                │
│  - Routing & params                             │
│  - SEO & metadata                               │
│  📄 < 150 lignes par page                       │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  View Components (Présentation pure)            │
│  - Affichage uniquement                         │
│  - Props bien typées                            │
│  - Aucune logique métier                        │
│  - Testable facilement                          │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Hooks métier (Business logic)                  │
│  - useEmployees()                               │
│  - useEmployeeActions()                         │
│  - useEmployeeFilters()                         │
│  📦 Encapsulent services + state                │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Hooks génériques (Generic logic)               │
│  - useListData<T>()                             │
│  - useEntityForm<T>()                           │
│  - useCrudActions<T>()                          │
│  🔧 Réutilisables partout                       │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Services (API calls)                           │
│  - getEmployees()                               │
│  - createEmployee()                             │
│  - deleteEmployee()                             │
│  🌐 Appels HTTP uniquement                      │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  API Client                                     │
│  - JWT management                               │
│  - Error handling                               │
│  - Cache                                        │
└─────────────────────────────────────────────────┘
```

---

### Nouvelle structure de fichiers

```
lib/
├── hooks/
│   ├── generic/              # Hooks génériques réutilisables
│   │   ├── use-list-data.ts
│   │   ├── use-entity-form.ts
│   │   ├── use-crud-actions.ts
│   │   └── use-filters.ts
│   │
│   ├── hr/                   # Hooks métier HR
│   │   ├── use-employees.ts
│   │   ├── use-employee-actions.ts
│   │   ├── use-employee-filters.ts
│   │   ├── use-contracts.ts
│   │   └── use-payroll.ts
│   │
│   └── inventory/            # Hooks métier Inventory
│       ├── use-products.ts
│       ├── use-sales.ts
│       └── use-orders.ts
│
├── services/                 # Inchangé (déjà bien structuré)
│   ├── hr/
│   ├── inventory/
│   └── core/
│
└── types/                    # Inchangé (déjà bien structuré)
    ├── hr/
    ├── inventory/
    └── shared/

components/
├── ui/                       # Composants UI génériques (inchangé)
│
├── common/                   # Composants communs cross-module
│   ├── data-table/
│   ├── entity-form/
│   └── page-layout/
│
└── apps/
    ├── hr/
    │   ├── employees/
    │   │   ├── EmployeesView.tsx       # Composant de présentation pur
    │   │   ├── EmployeesTable.tsx      # Tableau pur
    │   │   ├── EmployeeCard.tsx        # Card pure
    │   │   └── EmployeeFilters.tsx     # Filtres purs
    │   └── contracts/
    │
    └── inventory/
        └── products/
```

---

## 🔧 Plan de refactoring détaillé

### Phase 1: Préparation

#### 1.1 Créer les hooks métier manquants

**Nouveaux hooks à créer**:

```tsx
// lib/hooks/generic/use-crud-actions.ts
export function useCrudActions<T>({
  deleteFn,
  toggleFn,
  onSuccess,
}: {
  deleteFn: (id: string) => Promise<void>;
  toggleFn?: (id: string) => Promise<void>;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr ?')) return;
    try {
      setLoading(id);
      await deleteFn(id);
      onSuccess?.();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(null);
    }
  };

  const handleToggle = async (id: string) => {
    if (!toggleFn) return;
    try {
      setLoading(id);
      await toggleFn(id);
      onSuccess?.();
    } catch (err) {
      toast.error('Erreur');
    } finally {
      setLoading(null);
    }
  };

  return { handleDelete, handleToggle, loading };
}
```

```tsx
// lib/hooks/hr/use-employees.ts
export function useEmployees(slug: string) {
  const list = useListData({
    fetchFn: (params) => getEmployees(slug, params),
    pageSize: 20
  });

  const actions = useCrudActions({
    deleteFn: deleteEmployee,
    toggleFn: async (id: string) => {
      const emp = list.data.find(e => e.id === id);
      if (emp?.is_active) {
        await deactivateEmployee(id);
      } else {
        await activateEmployee(id);
      }
    },
    onSuccess: list.reload
  });

  return {
    ...list,
    ...actions,
    employees: list.data
  };
}
```

#### 1.2 Créer les composants de présentation purs

**Exemple**: `components/apps/hr/employees/EmployeesView.tsx`

```tsx
// Composant pur, aucune logique métier
export function EmployeesView({
  employees,
  loading,
  error,
  stats,
  filters,
  onFilterChange,
  onSearch,
  onDelete,
  onToggleStatus,
  pagination,
}: EmployeesViewProps) {
  if (loading) return <EmployeesLoader />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-5">
      <EmployeesHeader />
      <EmployeesStats stats={stats} />
      <EmployeesFilters filters={filters} onChange={onFilterChange} />
      <EmployeesTable
        data={employees}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
      />
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
```

---

### Phase 2: Refactoring progressif (module par module)

#### Module pilote: HR - Employees

##### Étape 1: Refactor `hr/employees/page.tsx`

**Avant** (470 lignes):
```tsx
export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  // ... 12 autres useState
  // ... 200 lignes de logique
  // ... 250 lignes de JSX
}
```

**Après** (< 100 lignes):
```tsx
export default function EmployeesPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Hook métier centralise toute la logique
  const {
    employees,
    loading,
    error,
    stats,
    filters,
    setFilter,
    resetFilters,
    handleDelete,
    handleToggleStatus,
    currentPage,
    setPage,
    totalCount,
  } = useEmployees(slug);

  // Page = orchestrateur simple
  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
      <EmployeesView
        employees={employees}
        loading={loading}
        error={error}
        stats={stats}
        filters={filters}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        pagination={{
          currentPage,
          totalCount,
          onPageChange: setPage
        }}
      />
    </Can>
  );
}
```

##### Étape 2: Refactor `hr/employees/[id]/page.tsx`

**Avant** (243 lignes avec logique dispersée):
```tsx
export default function EmployeeDetailPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  // ... logique de chargement manuelle
}
```

**Après** (< 80 lignes):
```tsx
export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const slug = params.slug as string;

  const { employee, loading, error, handleDelete, handleToggle } = useEmployee(id);
  const { contracts, loading: contractsLoading } = useEmployeeContracts(slug, id);
  const { payslips, loading: payslipsLoading } = useEmployeePayslips(slug, id);

  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
      <EmployeeDetailView
        employee={employee}
        contracts={contracts}
        payslips={payslips}
        loading={loading}
        loadingContracts={contractsLoading}
        loadingPayslips={payslipsLoading}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />
    </Can>
  );
}
```

##### Étape 3: Refactor composants

**EmployeesTable.tsx** - Avant (270 lignes, 8 props, logique métier):
```tsx
export function EmployeesTable({
  employees,
  selectedIndex,
  setSelectedIndex,
  routerNav,          // ❌
  slug,               // ❌
  handleToggleStatus, // ❌
  handleDelete,       // ❌
  deleting,
}) {
  // Logique métier mélangée avec présentation
}
```

**Après** (< 150 lignes, composant pur):
```tsx
export function EmployeesTable({
  employees,
  selectedIndex,
  onSelectRow,
  onViewEmployee,
  onEditEmployee,
  onToggleStatus,
  onDelete,
  isDeleting,
}: EmployeesTableProps) {
  // Que de la présentation, aucune logique métier
  return (
    <Table>
      {employees.map(employee => (
        <TableRow
          selected={selectedIndex === employee.id}
          onClick={() => onSelectRow(employee.id)}
          onDoubleClick={() => onViewEmployee(employee.id)}
        >
          {/* ... */}
          <TableActions>
            <Button onClick={() => onViewEmployee(employee.id)}>Voir</Button>
            <Button onClick={() => onEditEmployee(employee.id)}>Éditer</Button>
            <Button onClick={() => onToggleStatus(employee.id)}>Toggle</Button>
            <Button onClick={() => onDelete(employee.id)}>Supprimer</Button>
          </TableActions>
        </TableRow>
      ))}
    </Table>
  );
}
```

---

### Phase 3: Ordre de refactoring par module

#### Priorité 1: Module HR (le plus utilisé)
1. ✅ **Employees** (module pilote)
   - [ ] `hr/employees/page.tsx`
   - [ ] `hr/employees/[id]/page.tsx`
   - [ ] `hr/employees/create/page.tsx`
   - [ ] `hr/employees/[id]/edit/page.tsx`
   - [ ] Composants associés

2. **Contracts**
   - [ ] `hr/contracts/page.tsx`
   - [ ] `hr/contracts/[id]/page.tsx`
   - [ ] `hr/contracts/create/page.tsx`
   - [ ] `hr/contracts/[id]/edit/page.tsx`

3. **Payroll**
   - [ ] `hr/payroll/page.tsx`
   - [ ] `hr/payroll/[id]/page.tsx`
   - [ ] `hr/payroll/generate/page.tsx`

4. **Departments**
5. **Attendance**
6. **Leaves**

#### Priorité 2: Module Inventory
1. **Products**
2. **Sales**
3. **Orders**
4. **Customers**
5. **Suppliers**
6. **Warehouses**

#### Priorité 3: Module Core
1. **Organizations**
2. **Categories**

---

## 📦 Exemple concret: Avant / Après

### Page: `hr/employees/page.tsx`

#### AVANT (470 lignes, complexe, dupliqué)

<details>
<summary>Voir le code (cliquez pour déplier)</summary>

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getEmployees, deleteEmployee, activateEmployee, deactivateEmployee } from "@/lib/services/hr";
import { EmployeesTable } from "@/components/apps/hr/employees/EmployeesTable";

export default function EmployeesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // ❌ 15 useState pour gérer tout l'état
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    department: "",
    position: "",
    role: "",
    gender: "",
  });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // ❌ Logique de chargement manuelle (dupliquée dans 50+ pages)
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployees(slug, {
        page: currentPage,
        page_size: 20,
      });
      setEmployees(data.results);
      setTotalCount(data.count);
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [slug, currentPage]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // ❌ Filtrage côté client (devrait être serveur)
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchString = `${emp.full_name} ${emp.email}`.toLowerCase();
        if (!searchString.includes(query)) return false;
      }
      if (filters.status && emp.employment_status !== filters.status) return false;
      if (filters.department && emp.department_name !== filters.department) return false;
      return true;
    });
  }, [employees, searchQuery, filters]);

  // ❌ Handlers CRUD (dupliqués partout)
  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr ?")) return;
    try {
      setDeleting(id);
      await deleteEmployee(id);
      await loadEmployees();
    } catch (err) {
      alert("Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setDeleting(id);
      if (currentStatus) {
        await deactivateEmployee(id);
      } else {
        await activateEmployee(id);
      }
      await loadEmployees();
    } catch (err) {
      alert("Erreur");
    } finally {
      setDeleting(null);
    }
  };

  // ❌ Stats calculées côté client
  const stats = useMemo(() => {
    const totalSalary = employees.reduce((sum, e) => sum + (e.base_salary || 0), 0);
    return {
      total: totalCount,
      active: employees.filter((e) => e.employment_status === "active").length,
      onLeave: employees.filter((e) => e.employment_status === "on_leave").length,
      inactive: employees.filter((e) => e.employment_status === "suspended" || e.employment_status === "terminated").length,
      totalSalary,
    };
  }, [totalCount, employees]);

  // ... 250 lignes de JSX
  return (
    <div className="space-y-5">
      {/* Stats */}
      {/* Filtres */}
      {/* Table */}
      {/* Pagination */}
    </div>
  );
}
```

</details>

**Problèmes**:
- ❌ 470 lignes
- ❌ 15 useState
- ❌ Logique métier mélangée avec présentation
- ❌ Code dupliqué dans 50+ pages
- ❌ Difficile à tester
- ❌ Impossible à maintenir

---

#### APRÈS (< 100 lignes, simple, maintenable)

```tsx
"use client";

import { useParams } from "next/navigation";
import { Can } from "@/components/apps/common";
import { EmployeesView } from "@/components/apps/hr/employees/EmployeesView";
import { useEmployees } from "@/lib/hooks/hr/use-employees";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";

export default function EmployeesPage() {
  const params = useParams();
  const slug = params.slug as string;

  // ✅ Un seul hook métier centralise toute la logique
  const {
    employees,
    loading,
    error,
    stats,
    filters,
    setFilter,
    resetFilters,
    searchQuery,
    setSearchQuery,
    currentPage,
    setPage,
    totalCount,
    hasNext,
    hasPrevious,
    handleDelete,
    handleToggleStatus,
    selectedIndex,
    setSelectedIndex,
  } = useEmployees(slug);

  // ✅ Page = simple orchestrateur (< 100 lignes)
  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES} showMessage>
      <EmployeesView
        employees={employees}
        loading={loading}
        error={error}
        stats={stats}
        filters={filters}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        selectedIndex={selectedIndex}
        onSelectRow={setSelectedIndex}
        pagination={{
          currentPage,
          totalCount,
          pageSize: 20,
          hasNext,
          hasPrevious,
          onPageChange: setPage,
        }}
      />
    </Can>
  );
}
```

**Améliorations**:
- ✅ < 100 lignes (au lieu de 470)
- ✅ 0 useState dans la page
- ✅ Logique métier isolée dans le hook
- ✅ Composant de présentation pur
- ✅ Facilement testable
- ✅ Réutilisable (hook + view)
- ✅ Maintenable

---

### Hook métier: `lib/hooks/hr/use-employees.ts`

```tsx
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useListData } from "@/lib/hooks/generic/use-list-data";
import { useCrudActions } from "@/lib/hooks/generic/use-crud-actions";
import { useEmployeeFilters } from "./use-employee-filters";
import {
  getEmployees,
  deleteEmployee,
  activateEmployee,
  deactivateEmployee,
} from "@/lib/services/hr";

export function useEmployees(slug: string) {
  const router = useRouter();

  // ✅ Hook générique pour liste paginée
  const list = useListData({
    fetchFn: (params) => getEmployees(slug, params),
    pageSize: 20,
    autoLoad: true,
  });

  // ✅ Hook générique pour actions CRUD
  const actions = useCrudActions({
    deleteFn: deleteEmployee,
    toggleFn: async (id: string) => {
      const emp = list.data.find((e) => e.id === id);
      if (!emp) return;
      if (emp.is_active) {
        await deactivateEmployee(id);
      } else {
        await activateEmployee(id);
      }
    },
    onSuccess: list.reload,
  });

  // ✅ Hook spécifique pour filtres RH
  const filters = useEmployeeFilters(list.data);

  // ✅ Stats calculées
  const stats = useMemo(() => {
    const totalSalary = list.data.reduce((sum, e) => sum + (e.base_salary || 0), 0);
    return {
      total: list.totalCount,
      active: list.data.filter((e) => e.employment_status === "active").length,
      onLeave: list.data.filter((e) => e.employment_status === "on_leave").length,
      inactive: list.data.filter(
        (e) => e.employment_status === "suspended" || e.employment_status === "terminated"
      ).length,
      totalSalary,
    };
  }, [list.totalCount, list.data]);

  return {
    // Données
    employees: list.data,
    loading: list.loading,
    error: list.error,
    stats,

    // Filtres
    ...filters,

    // Pagination
    currentPage: list.currentPage,
    setPage: list.setPage,
    totalCount: list.totalCount,
    hasNext: list.hasNext,
    hasPrevious: list.hasPrevious,

    // Actions
    handleDelete: actions.handleDelete,
    handleToggleStatus: actions.handleToggle,
    reload: list.reload,
  };
}
```

---

### Composant de présentation: `components/apps/hr/employees/EmployeesView.tsx`

```tsx
import { Alert } from "@/components/ui";
import { EmployeesHeader } from "./EmployeesHeader";
import { EmployeesStats } from "./EmployeesStats";
import { EmployeesFilters } from "./EmployeesFilters";
import { EmployeesTable } from "./EmployeesTable";
import { EmployeesPagination } from "./EmployeesPagination";
import { EmployeesLoader } from "./EmployeesLoader";
import type { EmployeeListItem } from "@/lib/types/hr";

interface EmployeesViewProps {
  employees: EmployeeListItem[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    active: number;
    onLeave: number;
    inactive: number;
    totalSalary: number;
  };
  filters: Record<string, string>;
  searchQuery: string;
  onSearch: (query: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onResetFilters: () => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  selectedIndex: number;
  onSelectRow: (index: number) => void;
  pagination: {
    currentPage: number;
    totalCount: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
    onPageChange: (page: number) => void;
  };
}

// ✅ Composant pur de présentation (aucune logique métier)
export function EmployeesView({
  employees,
  loading,
  error,
  stats,
  filters,
  searchQuery,
  onSearch,
  onFilterChange,
  onResetFilters,
  onDelete,
  onToggleStatus,
  selectedIndex,
  onSelectRow,
  pagination,
}: EmployeesViewProps) {
  if (loading) {
    return <EmployeesLoader />;
  }

  return (
    <div className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}

      <EmployeesHeader />

      <EmployeesStats stats={stats} />

      <EmployeesFilters
        filters={filters}
        searchQuery={searchQuery}
        onSearch={onSearch}
        onChange={onFilterChange}
        onReset={onResetFilters}
      />

      <EmployeesTable
        employees={employees}
        selectedIndex={selectedIndex}
        onSelectRow={onSelectRow}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
      />

      {pagination.totalCount > pagination.pageSize && (
        <EmployeesPagination {...pagination} />
      )}
    </div>
  );
}
```

---

## 📊 Impact du refactoring

### Réduction de code

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| **Pages moyennes** | 350 lignes | < 100 lignes | -71% |
| **Code dupliqué** | ~3000 lignes | ~500 lignes | -83% |
| **useState par page** | 10-15 | 0-2 | -85% |
| **Logique métier dans pages** | 80% | 0% | -100% |

### Maintenabilité

| Critère | Avant | Après |
|---------|-------|-------|
| **Testabilité** | ❌ Difficile | ✅ Facile |
| **Réutilisabilité** | ❌ Faible | ✅ Élevée |
| **Séparation responsabilités** | ❌ Non respectée | ✅ Respectée |
| **Duplication** | ❌ Massive | ✅ Minimale |
| **Cohérence** | ❌ Incohérente | ✅ Cohérente |

---

## ✅ Checklist de refactoring (par page)

Pour chaque page refactorisée:

- [ ] Extraire la logique dans un hook métier
- [ ] Créer un composant de présentation pur
- [ ] Réduire la page à < 150 lignes
- [ ] Supprimer tous les useState inutiles
- [ ] Utiliser useListData pour les listes
- [ ] Utiliser useEntityForm pour les formulaires
- [ ] Tester visuellement (même rendu)
- [ ] Tester fonctionnellement (même comportement)
- [ ] Vérifier les routes (inchangées)
- [ ] Vérifier l'intégration backend (inchangée)
- [ ] Documenter les changements

---

## 🚀 Prochaines étapes

1. **Créer les hooks manquants**
   - `lib/hooks/generic/use-crud-actions.ts`
   - `lib/hooks/hr/use-employees.ts`
   - `lib/hooks/hr/use-employee-actions.ts`

2. **Refactor page pilote**
   - `app/apps/(org)/[slug]/hr/employees/page.tsx`

3. **Créer composant de présentation**
   - `components/apps/hr/employees/EmployeesView.tsx`

4. **Tester et valider**
   - Tests visuels
   - Tests fonctionnels
   - Validation avec l'équipe

5. **Itérer sur les autres pages**
   - Suivre le plan module par module

---

## 📝 Notes importantes

### ⚠️ Risques

1. **Casser le comportement existant**
   - Mitigation: Tester page par page

2. **Régressions sur les routes**
   - Mitigation: Ne jamais modifier le routing

3. **Incompatibilités backend**
   - Mitigation: Ne modifier que le frontend

### ✅ Garanties

- Même UI exactement
- Mêmes routes
- Mêmes appels API
- Même comportement utilisateur
- Code plus maintenable

---

## 📚 Ressources

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Fin de l'audit**
