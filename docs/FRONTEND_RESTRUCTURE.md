# 🏗️ Restructuration Frontend Complète

## 📋 Résumé

Le frontend Loura a été restructuré pour suivre une **architecture modulaire** similaire au backend Django.

---

## ✅ Ce qui a été créé

### 1. Composants UI Réutilisables (`components/ui/`)

| Composant | Fichier | Description |
|-----------|---------|-------------|
| Button | `button.tsx` | Bouton avec variantes (primary, secondary, danger, etc.) |
| Input | `input.tsx` | Champ de saisie avec label, erreur, et texte d'aide |
| Select | `select.tsx` | Liste déroulante avec options |
| Card | `card.tsx` | Container avec Header, Body, Footer |
| Alert | `alert.tsx` | Messages d'alerte (success, error, warning, info) |
| Badge | `badge.tsx` | Badges de statut |

**Tous exportés depuis**: `components/ui/index.ts`

### 2. Composants Module Core (`components/core/`)

| Composant | Fichier | Description |
|-----------|---------|-------------|
| OrganizationCard | `organization-card.tsx` | Card pour afficher une organisation |
| OrganizationForm | `organization-form.tsx` | Formulaire création/édition |
| StatsCard | `stats-card.tsx` | Card de statistiques |
| AuthLayout | `auth-layout.tsx` | Layout pour login/register |
| DashboardLayout | `dashboard-layout.tsx` | Layout du dashboard |

**Tous exportés depuis**: `components/core/index.ts`

### 3. Services par Module

#### Services Core (`lib/services/core/`)

| Service | Fichier | Fonctions |
|---------|---------|-----------|
| authService | `auth.service.ts` | register, login, logout, getCurrentUser |
| organizationService | `organization.service.ts` | getAll, getById, create, update, delete, activate, deactivate |
| categoryService | `category.service.ts` | getAll, getById |

**Tous exportés depuis**: `lib/services/core/index.ts`

### 4. Types par Module

#### Types Core (`lib/types/core/`)

- `AdminUser`
- `LoginCredentials`
- `RegisterData`
- `AuthResponse`
- `Category`
- `Organization`
- `OrganizationSettings`
- `OrganizationCreateData`
- `OrganizationUpdateData`

#### Types Partagés (`lib/types/shared/`)

- `ApiErrorResponse`
- `PaginatedResponse<T>`
- `FormState`
- `LoadingState`
- `DataState<T>`

### 5. Documentation

| Fichier | Description |
|---------|-------------|
| `ARCHITECTURE.md` | Architecture complète du projet |
| `COMPONENTS_GUIDE.md` | Guide d'utilisation des composants |
| `README.md` | README principal mis à jour |
| `QUICK_START.md` | Démarrage rapide |
| `README_INTEGRATION.md` | Guide d'intégration API |

---

## 📁 Nouvelle Structure

```
lourafrontend/
├── app/                          # Next.js App Router
│   ├── login/                    # Pages d'auth (à migrer)
│   ├── register/
│   ├── dashboard/
│   │   └── organizations/
│   │       └── create/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                   # Composants React
│   ├── ui/                       # ✅ NOUVEAUX - Composants UI réutilisables
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── card.tsx
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   └── index.ts
│   │
│   ├── core/                     # ✅ NOUVEAUX - Composants module Core
│   │   ├── organization-card.tsx
│   │   ├── organization-form.tsx
│   │   ├── stats-card.tsx
│   │   ├── auth-layout.tsx
│   │   ├── dashboard-layout.tsx
│   │   └── index.ts
│   │
│   └── hr/                       # 🚧 FUTUR - Composants module HR
│
├── lib/                          # Logique métier
│   ├── api/                      # Configuration API (existant)
│   │   ├── client.ts
│   │   └── config.ts
│   │
│   ├── services/                 # ✅ RESTRUCTURÉ par module
│   │   ├── core/                 # Services Core
│   │   │   ├── auth.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── organization.service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── hr/                   # 🚧 FUTUR - Services HR
│   │   │
│   │   ├── auth.service.ts       # ⚠️ ANCIEN - À supprimer
│   │   ├── category.service.ts   # ⚠️ ANCIEN - À supprimer
│   │   ├── organization.service.ts # ⚠️ ANCIEN - À supprimer
│   │   └── index.ts              # ⚠️ ANCIEN - À supprimer
│   │
│   ├── types/                    # ✅ RESTRUCTURÉ par module
│   │   ├── core/                 # Types Core
│   │   │   └── index.ts
│   │   ├── hr/                   # 🚧 FUTUR - Types HR
│   │   ├── shared/               # Types partagés
│   │   │   └── index.ts
│   │   └── index.ts              # ⚠️ ANCIEN - À supprimer
│   │
│   └── utils.ts                  # Utilitaires (existant)
│
└── public/                       # Fichiers statiques
```

---

## 🔄 Migration des Pages

### Prochaines étapes

Les pages existantes doivent être migrées pour utiliser les nouveaux composants:

#### 1. Page Login (`app/login/page.tsx`)

**Avant:**
```tsx
// Import direct et code dupliqué
<div className="min-h-screen flex items-center...">
  <div className="max-w-md w-full...">
    <h2>Connexion</h2>
    <form>...</form>
  </div>
</div>
```

**Après:**
```tsx
import { AuthLayout } from '@/components/core';
import { Input, Button, Alert } from '@/components/ui';

<AuthLayout title="Connexion" subtitle={...}>
  <form>
    <Input label="Email" ... />
    <Input label="Mot de passe" ... />
    <Button isLoading={isLoading}>Se connecter</Button>
  </form>
</AuthLayout>
```

#### 2. Page Register (`app/register/page.tsx`)

Similaire à Login, utiliser `AuthLayout` et les composants UI.

#### 3. Page Dashboard (`app/dashboard/page.tsx`)

**Avant:**
```tsx
// HTML et logique mélangés
<div className="min-h-screen bg-gray-50">
  <header>...</header>
  <main>
    <div className="bg-white...">Stats</div>
    <div>Liste organisations</div>
  </main>
</div>
```

**Après:**
```tsx
import { DashboardLayout, StatsCard, OrganizationCard } from '@/components/core';

<DashboardLayout user={user} onLogout={handleLogout}>
  <div className="grid grid-cols-3 gap-6">
    <StatsCard title="Total" value={total} />
    <StatsCard title="Actives" value={active} variant="success" />
    <StatsCard title="Inactives" value={inactive} variant="error" />
  </div>

  <div className="bg-white shadow rounded-lg divide-y">
    {organizations.map(org => (
      <OrganizationCard
        key={org.id}
        organization={org}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggle}
      />
    ))}
  </div>
</DashboardLayout>
```

#### 4. Page Création (`app/dashboard/organizations/create/page.tsx`)

**Avant:**
```tsx
// Formulaire avec code dupliqué
<form>
  <div>
    <label>Nom</label>
    <input ... />
  </div>
  <div>
    <label>Sous-domaine</label>
    <input ... />
  </div>
  ...
</form>
```

**Après:**
```tsx
import { OrganizationForm } from '@/components/core';
import { Card, CardHeader, CardBody } from '@/components/ui';

<Card>
  <CardHeader>
    <h1>Nouvelle Organisation</h1>
  </CardHeader>
  <CardBody>
    <OrganizationForm
      categories={categories}
      onSubmit={handleCreate}
      onCancel={() => router.back()}
      isLoading={isLoading}
    />
  </CardBody>
</Card>
```

---

## 📝 Exemples d'utilisation

### Import des composants

```tsx
// ✅ BON - Depuis l'index du module
import { Button, Input, Alert } from '@/components/ui';
import { OrganizationCard, OrganizationForm } from '@/components/core';
import { authService, organizationService } from '@/lib/services/core';
import type { Organization, Category } from '@/lib/types/core';

// ❌ MAUVAIS - Import direct
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/services/core/auth.service';
```

### Utiliser les services

```tsx
import { authService, organizationService, categoryService } from '@/lib/services/core';

// Authentification
const user = await authService.getCurrentUser();
const isAuth = authService.isAuthenticated();

// Organisations
const orgs = await organizationService.getAll();
const org = await organizationService.getById(id);
await organizationService.create(data);
await organizationService.update(id, data);
await organizationService.delete(id);

// Catégories
const categories = await categoryService.getAll();
```

### Utiliser les composants

```tsx
import { Button, Input, Select, Alert, Badge } from '@/components/ui';

<Button variant="primary" isLoading={isLoading}>
  Enregistrer
</Button>

<Input
  label="Email"
  type="email"
  required
  error={errors.email}
  helperText="Votre adresse email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

<Select
  label="Catégorie"
  options={categories.map(c => ({ value: c.id, label: c.name }))}
  placeholder="Sélectionner..."
/>

<Alert variant="success" title="Succès">
  Organisation créée avec succès
</Alert>

<Badge variant="success">Active</Badge>
```

---

## 🚀 Avantages de cette architecture

1. **Réutilisabilité**: Composants UI utilisables partout
2. **Modularité**: Code organisé par module métier
3. **Maintenabilité**: Structure prévisible et cohérente
4. **Scalabilité**: Facile d'ajouter de nouveaux modules
5. **Type-safety**: Types TypeScript par module
6. **Cohérence**: Même structure que le backend
7. **DRY**: Pas de code dupliqué

---

## 📋 TODO - Prochaines étapes

### Immédiat

- [ ] Migrer `/app/login/page.tsx` pour utiliser `AuthLayout` et composants UI
- [ ] Migrer `/app/register/page.tsx` pour utiliser `AuthLayout` et composants UI
- [ ] Migrer `/app/dashboard/page.tsx` pour utiliser `DashboardLayout` et `OrganizationCard`
- [ ] Migrer `/app/dashboard/organizations/create/page.tsx` pour utiliser `OrganizationForm`
- [ ] Supprimer les anciens services dans `lib/services/` (racine)
- [ ] Supprimer les anciens types dans `lib/types/index.ts`

### Court terme

- [ ] Créer la page d'édition d'organisation
- [ ] Ajouter des tests unitaires pour les composants
- [ ] Ajouter Storybook pour documenter les composants
- [ ] Créer plus de composants UI (Modal, Dropdown, Tabs, etc.)

### Moyen terme

- [ ] Ajouter le module HR
- [ ] Implémenter la pagination
- [ ] Ajouter les filtres et la recherche
- [ ] Créer un thème sombre
- [ ] Internationalisation (i18n)

---

## 🎯 Structure cible finale

```
lourafrontend/
├── components/
│   ├── ui/              # Composants réutilisables
│   ├── core/            # Module Core
│   ├── hr/              # Module HR
│   └── accounting/      # Module Accounting (futur)
│
├── lib/
│   ├── services/
│   │   ├── core/
│   │   ├── hr/
│   │   └── accounting/
│   └── types/
│       ├── core/
│       ├── hr/
│       ├── accounting/
│       └── shared/
│
└── app/
    ├── (core)/         # Routes module Core
    ├── (hr)/           # Routes module HR
    └── (accounting)/   # Routes module Accounting
```

---

## 📞 Ressources

- **Architecture**: `ARCHITECTURE.md`
- **Composants**: `COMPONENTS_GUIDE.md`
- **API**: `README_INTEGRATION.md`
- **Quick Start**: `QUICK_START.md`

---

## ✅ Conclusion

Le frontend est maintenant structuré de manière modulaire et cohérente avec le backend. Cette architecture facilite:

- L'ajout de nouveaux modules
- La réutilisation du code
- La maintenance et l'évolution
- Le travail en équipe

**Prochaine étape:** Migrer les pages existantes pour utiliser les nouveaux composants ! 🚀
