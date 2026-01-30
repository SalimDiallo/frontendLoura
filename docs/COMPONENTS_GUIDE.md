# 🎨 Guide des Composants Loura

Ce guide décrit tous les composants disponibles et comment les utiliser.

## 📦 Composants UI Réutilisables

Tous les composants dans `components/ui/` peuvent être utilisés partout dans l'application.

---

### Button

Bouton avec différentes variantes et états de chargement.

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- `disabled`: boolean
- Hérite de toutes les props HTML `<button>`

**Exemples:**

```tsx
import { Button } from '@/components/ui';

// Bouton primaire
<Button variant="primary">Enregistrer</Button>

// Bouton avec loading
<Button isLoading={isSubmitting}>Envoi en cours...</Button>

// Petit bouton de danger
<Button variant="danger" size="sm">Supprimer</Button>

// Bouton outline
<Button variant="outline" onClick={handleCancel}>Annuler</Button>
```

---

### Input

Champ de saisie avec label, erreur et texte d'aide.

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `required`: boolean
- Hérite de toutes les props HTML `<input>`

**Exemples:**

```tsx
import { Input } from '@/components/ui';

// Input simple
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Input avec validation
<Input
  label="Nom"
  required
  error={errors.name}
  helperText="Minimum 3 caractères"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// Input mot de passe
<Input
  label="Mot de passe"
  type="password"
  required
  error={errors.password}
/>
```

---

### Select

Liste déroulante avec options.

**Props:**
- `label`: string
- `options`: Array<{ value: string | number, label: string }>
- `placeholder`: string
- `error`: string
- `helperText`: string
- `required`: boolean
- Hérite de toutes les props HTML `<select>`

**Exemples:**

```tsx
import { Select } from '@/components/ui';

const categories = [
  { value: 1, label: 'Technologie' },
  { value: 2, label: 'Santé' },
  { value: 3, label: 'Éducation' },
];

<Select
  label="Catégorie"
  options={categories}
  placeholder="Sélectionner une catégorie"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
/>

// Avec erreur
<Select
  label="Pays"
  options={countries}
  error={errors.country}
  required
/>
```

---

### Card, CardHeader, CardBody, CardFooter

Conteneur pour afficher du contenu structuré.

**Props:**
- Hérite de toutes les props HTML `<div>`

**Exemples:**

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <h2 className="text-xl font-bold">Titre de la card</h2>
  </CardHeader>
  <CardBody>
    <p>Contenu principal de la card</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Card simple
<Card className="p-6">
  <h3>Titre</h3>
  <p>Contenu</p>
</Card>
```

---

### Alert

Message d'alerte avec icône et variantes.

**Props:**
- `variant`: 'success' | 'error' | 'warning' | 'info'
- `title`: string
- `onClose`: () => void
- `children`: React.ReactNode

**Exemples:**

```tsx
import { Alert } from '@/components/ui';

// Alerte de succès
<Alert variant="success" title="Succès">
  L'organisation a été créée avec succès
</Alert>

// Alerte d'erreur avec fermeture
<Alert variant="error" title="Erreur" onClose={() => setError(null)}>
  {error}
</Alert>

// Alerte d'avertissement
<Alert variant="warning">
  Attention, cette action est irréversible
</Alert>

// Alerte d'information
<Alert variant="info" title="Information">
  Vos modifications seront sauvegardées automatiquement
</Alert>
```

---

### Badge

Petit badge pour afficher un statut ou une catégorie.

**Props:**
- `variant`: 'default' | 'success' | 'error' | 'warning' | 'info'
- `size`: 'sm' | 'md' | 'lg'
- `children`: React.ReactNode

**Exemples:**

```tsx
import { Badge } from '@/components/ui';

// Badge de succès
<Badge variant="success">Active</Badge>

// Badge d'erreur
<Badge variant="error">Inactive</Badge>

// Badge par défaut
<Badge>En attente</Badge>

// Petit badge
<Badge variant="info" size="sm">Nouveau</Badge>
```

---

## 📦 Composants Module Core

Composants spécifiques au module Core (authentification, organisations).

---

### OrganizationCard

Card pour afficher une organisation avec actions.

**Props:**
- `organization`: Organization
- `onEdit`: (org: Organization) => void
- `onDelete`: (org: Organization) => void
- `onToggleActive`: (org: Organization) => void

**Exemple:**

```tsx
import { OrganizationCard } from '@/components/core';

<OrganizationCard
  organization={organization}
  onEdit={(org) => router.push(`/dashboard/organizations/${org.id}/edit`)}
  onDelete={handleDelete}
  onToggleActive={handleToggleActive}
/>
```

---

### OrganizationForm

Formulaire complet de création/modification d'organisation.

**Props:**
- `categories`: Category[]
- `initialData`: Organization (optionnel, pour édition)
- `onSubmit`: (data: OrganizationCreateData) => Promise<void>
- `onCancel`: () => void
- `isLoading`: boolean

**Exemples:**

```tsx
import { OrganizationForm } from '@/components/core';

// Création
<OrganizationForm
  categories={categories}
  onSubmit={handleCreate}
  onCancel={() => router.back()}
  isLoading={isLoading}
/>

// Édition
<OrganizationForm
  categories={categories}
  initialData={organization}
  onSubmit={handleUpdate}
  onCancel={() => router.back()}
  isLoading={isLoading}
/>
```

---

### StatsCard

Card pour afficher une statistique.

**Props:**
- `title`: string
- `value`: number | string
- `variant`: 'default' | 'success' | 'error' | 'warning'

**Exemples:**

```tsx
import { StatsCard } from '@/components/core';

<div className="grid grid-cols-3 gap-6">
  <StatsCard
    title="Total Organisations"
    value={organizations.length}
  />
  <StatsCard
    title="Actives"
    value={activeCount}
    variant="success"
  />
  <StatsCard
    title="Inactives"
    value={inactiveCount}
    variant="error"
  />
</div>
```

---

### AuthLayout

Layout pour les pages d'authentification (login, register).

**Props:**
- `title`: string
- `subtitle`: React.ReactNode
- `children`: React.ReactNode

**Exemples:**

```tsx
import { AuthLayout } from '@/components/core';
import Link from 'next/link';

// Page de login
<AuthLayout
  title="Connexion à Loura"
  subtitle={
    <>
      Ou{' '}
      <Link href="/core/register" className="text-foreground hover:text-foreground">
        créer un nouveau compte
      </Link>
    </>
  }
>
  <LoginForm />
</AuthLayout>

// Page de register
<AuthLayout
  title="Créer un compte"
  subtitle={
    <>
      Ou{' '}
      <Link href="/core/login" className="text-foreground hover:text-foreground">
        se connecter
      </Link>
    </>
  }
>
  <RegisterForm />
</AuthLayout>
```

---

### DashboardLayout

Layout pour le dashboard avec header et déconnexion.

**Props:**
- `user`: AdminUser | null
- `onLogout`: () => void
- `children`: React.ReactNode

**Exemple:**

```tsx
import { DashboardLayout } from '@/components/core';

export default function DashboardPage() {
  const [user, setUser] = useState<AdminUser | null>(null);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      <h2>Contenu du dashboard</h2>
      {/* Votre contenu ici */}
    </DashboardLayout>
  );
}
```

---

## 🎯 Exemples complets

### Page de login

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/core';
import { Input, Button, Alert } from '@/components/ui';
import { authService } from '@/lib/services/core';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.login(formData);
      router.push('/core/dashboard');
    } catch (err) {
      setError('Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Connexion"
      subtitle={
        <>
          Ou{' '}
          <Link href="/core/register" className="text-foreground hover:text-foreground">
            créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        <Input
          label="Mot de passe"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  );
}
```

### Liste d'organisations

```tsx
'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/core';
import { OrganizationCard, StatsCard } from '@/components/core';
import { Button, Alert } from '@/components/ui';
import { authService, organizationService } from '@/lib/services/core';
import type { Organization, AdminUser } from '@/lib/types/core';

export default function DashboardPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [userData, orgsData] = await Promise.all([
      authService.getCurrentUser(),
      organizationService.getAll(),
    ]);
    setUser(userData);
    setOrganizations(orgsData);
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const activeCount = organizations.filter((o) => o.is_active).length;

  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatsCard title="Total" value={organizations.length} />
        <StatsCard title="Actives" value={activeCount} variant="success" />
        <StatsCard title="Inactives" value={organizations.length - activeCount} variant="error" />
      </div>

      {/* Liste */}
      <div className="bg-white shadow rounded-lg divide-y">
        {organizations.map((org) => (
          <OrganizationCard
            key={org.id}
            organization={org}
            onEdit={(org) => router.push(`/dashboard/organizations/${org.id}/edit`)}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}
```

---

## 💡 Conseils

1. **Toujours importer depuis l'index:**
   ```tsx
   // ✅ Bon
   import { Button, Input } from '@/components/ui';

   // ❌ Mauvais
   import { Button } from '@/components/ui/button';
   ```

2. **Utiliser les composants appropriés:**
   - Composants `ui/` pour tout ce qui est réutilisable
   - Composants `core/` pour la logique spécifique au module Core
   - Créer de nouveaux composants dans `ui/` s'ils sont génériques

3. **Toujours passer les types TypeScript:**
   ```tsx
   // ✅ Bon
   const [user, setUser] = useState<AdminUser | null>(null);

   // ❌ Mauvais
   const [user, setUser] = useState(null);
   ```

Bonne utilisation des composants ! 🎨
