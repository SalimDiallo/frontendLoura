# 🏗️ Architecture Frontend Loura

Ce document décrit l'architecture modulaire du frontend Loura, inspirée de la structure du backend Django.

## 📋 Philosophie

L'architecture suit les mêmes principes que le backend:
- **Modulaire**: Séparation par module métier (core, hr, etc.)
- **Réutilisable**: Composants UI partagés entre modules
- **Scalable**: Facile d'ajouter de nouveaux modules
- **Maintenable**: Code organisé et prévisible

---

## 📁 Structure du projet

```
lourafrontend/
├── app/                          # Next.js App Router
│   ├── (core)/                   # 📦 MODULE CORE
│   │   ├── login/
│   │   ├── register/
│   │   └── dashboard/
│   ├── (hr)/                     # 📦 MODULE HR (futur)
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                   # Composants React
│   ├── ui/                       # 🎨 Composants UI réutilisables
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── card.tsx
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   └── index.ts
│   │
│   ├── core/                     # 📦 Composants MODULE CORE
│   │   ├── organization-card.tsx
│   │   ├── organization-form.tsx
│   │   ├── stats-card.tsx
│   │   ├── auth-layout.tsx
│   │   ├── dashboard-layout.tsx
│   │   └── index.ts
│   │
│   └── hr/                       # 📦 Composants MODULE HR (futur)
│
├── lib/                          # Logique métier
│   ├── api/                      # Configuration API
│   │   ├── client.ts             # Client HTTP + JWT
│   │   └── config.ts             # Endpoints & config
│   │
│   ├── services/                 # Services API par module
│   │   ├── core/                 # 📦 Services MODULE CORE
│   │   │   ├── auth.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── organization.service.ts
│   │   │   └── index.ts
│   │   └── hr/                   # 📦 Services MODULE HR (futur)
│   │
│   ├── types/                    # Types TypeScript par module
│   │   ├── core/                 # 📦 Types MODULE CORE
│   │   │   └── index.ts
│   │   ├── hr/                   # 📦 Types MODULE HR (futur)
│   │   └── shared/               # Types partagés
│   │       └── index.ts
│   │
│   └── utils.ts                  # Utilitaires
│
└── public/                       # Fichiers statiques
```

---

## 🎯 Organisation par module

### Module Core

Le module **Core** gère:
- Authentification (AdminUser)
- Organisations
- Catégories

**Structure:**
```
core/
├── Services:    lib/services/core/
├── Types:       lib/types/core/
├── Composants:  components/core/
└── Pages:       app/(core)/
```

### Module HR (futur)

Le module **HR** gérera:
- Employés
- Départements
- Permissions

**Structure:**
```
hr/
├── Services:    lib/services/hr/
├── Types:       lib/types/hr/
├── Composants:  components/hr/
└── Pages:       app/(hr)/
```

---

## 🎨 Composants UI réutilisables

Les composants dans `components/ui/` sont **agnostiques** des modules et peuvent être utilisés partout.

### Button

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  Cliquer ici
</Button>

// Variants: primary, secondary, danger, success, ghost, outline
// Sizes: sm, md, lg
// Props: isLoading, disabled, etc.
```

### Input

```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  required
  error={errors.email}
  helperText="Votre adresse email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Select

```tsx
import { Select } from '@/components/ui';

<Select
  label="Catégorie"
  options={[
    { value: 1, label: 'Technologie' },
    { value: 2, label: 'Santé' },
  ]}
  placeholder="Sélectionner..."
  value={category}
  onChange={(e) => setCategory(e.target.value)}
/>
```

### Card

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <h2>Titre</h2>
  </CardHeader>
  <CardBody>
    <p>Contenu</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Alert

```tsx
import { Alert } from '@/components/ui';

<Alert variant="error" title="Erreur" onClose={() => setError(null)}>
  Une erreur est survenue
</Alert>

// Variants: success, error, warning, info
```

### Badge

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>

// Variants: default, success, error, warning, info
// Sizes: sm, md, lg
```

---

## 📦 Composants spécifiques au module Core

Les composants dans `components/core/` sont **spécifiques** au module Core.

### OrganizationCard

```tsx
import { OrganizationCard } from '@/components/core';

<OrganizationCard
  organization={org}
  onEdit={(org) => handleEdit(org)}
  onDelete={(org) => handleDelete(org)}
  onToggleActive={(org) => handleToggle(org)}
/>
```

### OrganizationForm

```tsx
import { OrganizationForm } from '@/components/core';

<OrganizationForm
  categories={categories}
  initialData={organization} // optionnel (pour édition)
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={isLoading}
/>
```

### StatsCard

```tsx
import { StatsCard } from '@/components/core';

<StatsCard
  title="Total Organisations"
  value={organizations.length}
  variant="default"
/>
```

### AuthLayout

```tsx
import { AuthLayout } from '@/components/core';
import Link from 'next/link';

<AuthLayout
  title="Connexion"
  subtitle={
    <>
      Ou{' '}
      <Link href="/core/register">créer un compte</Link>
    </>
  }
>
  <LoginForm />
</AuthLayout>
```

### DashboardLayout

```tsx
import { DashboardLayout } from '@/components/core';

<DashboardLayout user={user} onLogout={handleLogout}>
  <h2>Contenu du dashboard</h2>
</DashboardLayout>
```

---

## 🔌 Services par module

### Import des services Core

```typescript
// Ancien (à éviter)
import { authService } from '@/lib/services/auth.service';

// Nouveau (recommandé)
import { authService, organizationService, categoryService } from '@/lib/services/core';
```

### Exemple d'utilisation

```typescript
import { authService, organizationService } from '@/lib/services/core';
import type { Organization } from '@/lib/types/core';

// Authentification
const handleLogin = async () => {
  await authService.login({ email, password });
};

// Organisations
const loadOrganizations = async () => {
  const orgs = await organizationService.getAll();
  setOrganizations(orgs);
};

// Création
const handleCreate = async (data) => {
  const newOrg = await organizationService.create(data);
};
```

---

## 📝 Types par module

### Import des types Core

```typescript
// Types Core
import type {
  AdminUser,
  Organization,
  Category,
  OrganizationCreateData,
  OrganizationUpdateData,
  LoginCredentials,
  RegisterData,
} from '@/lib/types/core';

// Types partagés
import type {
  FormState,
  LoadingState,
  DataState,
  PaginatedResponse,
} from '@/lib/types/shared';
```

---

## 🚀 Ajouter un nouveau module

Pour ajouter un module (ex: **accounting**):

### 1. Créer la structure

```bash
# Types
mkdir -p lib/types/accounting
touch lib/types/accounting/index.ts

# Services
mkdir -p lib/services/accounting
touch lib/services/accounting/invoice.service.ts
touch lib/services/accounting/index.ts

# Composants
mkdir -p components/accounting
touch components/accounting/invoice-card.tsx
touch components/accounting/index.ts

# Pages
mkdir -p app/\(accounting\)/invoices
```

### 2. Définir les types

```typescript
// lib/types/accounting/index.ts
export interface Invoice {
  id: string;
  number: string;
  amount: number;
  // ...
}
```

### 3. Créer les services

```typescript
// lib/services/accounting/invoice.service.ts
import { apiClient } from '@/lib/api/client';
import type { Invoice } from '@/lib/types/accounting';

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    return apiClient.get('/invoices/');
  },
  // ...
};
```

### 4. Créer les composants

```typescript
// components/accounting/invoice-card.tsx
import type { Invoice } from '@/lib/types/accounting';

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  return <div>{invoice.number}</div>;
}
```

### 5. Créer les pages

```typescript
// app/(accounting)/invoices/page.tsx
import { invoiceService } from '@/lib/services/accounting';
import { InvoiceCard } from '@/components/accounting';

export default async function InvoicesPage() {
  const invoices = await invoiceService.getAll();
  return <div>{invoices.map(inv => <InvoiceCard key={inv.id} invoice={inv} />)}</div>;
}
```

---

## ✅ Bonnes pratiques

### 1. Imports

```typescript
// ✅ Bon - Import depuis l'index du module
import { authService } from '@/lib/services/core';
import { Button, Input } from '@/components/ui';
import { OrganizationCard } from '@/components/core';

// ❌ Mauvais - Import direct du fichier
import { authService } from '@/lib/services/core/auth.service';
import { Button } from '@/components/ui/button';
```

### 2. Composants

```typescript
// ✅ Bon - Composant réutilisable dans ui/
// components/ui/data-table.tsx
export function DataTable<T>({ data, columns }: Props<T>) { }

// ✅ Bon - Composant spécifique dans le module
// components/core/organization-list.tsx
export function OrganizationList({ organizations }: Props) { }
```

### 3. Types

```typescript
// ✅ Bon - Types séparés par module
import type { Organization } from '@/lib/types/core';
import type { Employee } from '@/lib/types/hr';

// ✅ Bon - Types partagés dans shared/
import type { FormState } from '@/lib/types/shared';
```

### 4. Services

```typescript
// ✅ Bon - Services regroupés par module
lib/services/core/
lib/services/hr/
lib/services/accounting/

// ❌ Mauvais - Services mélangés
lib/services/
  ├── auth.service.ts
  ├── employee.service.ts
  └── invoice.service.ts
```

---

## 🔄 Migration de l'ancien code

Si vous avez des fichiers dans l'ancienne structure:

```bash
# Ancienne structure
lib/services/auth.service.ts

# Nouvelle structure
lib/services/core/auth.service.ts
```

**Étapes:**
1. Déplacer le fichier vers le bon module
2. Mettre à jour les imports dans le fichier
3. Exporter depuis l'index du module
4. Mettre à jour les imports dans les composants

---

## 📚 Ressources

- **Composants UI**: `/components/ui/`
- **Composants Core**: `/components/core/`
- **Services Core**: `/lib/services/core/`
- **Types Core**: `/lib/types/core/`
- **Types partagés**: `/lib/types/shared/`

---

## 🎉 Avantages de cette architecture

1. **Modulaire**: Chaque module est isolé
2. **Scalable**: Facile d'ajouter de nouveaux modules
3. **Maintenable**: Code organisé et prévisible
4. **Réutilisable**: Composants UI partagés
5. **Type-safe**: Types TypeScript par module
6. **Testable**: Services et composants faciles à tester
7. **Cohérent**: Même structure que le backend Django

---

## 🚀 Prochaines étapes

1. Migrer les pages existantes vers la nouvelle structure
2. Ajouter le module HR
3. Créer plus de composants UI réutilisables
4. Ajouter des tests unitaires
5. Documenter les composants avec Storybook

Bonne architecture ! 🏗️
