# Design System - Loura HR

Guide de style et composants réutilisables pour l'application Loura HR.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Composants réutilisables](#composants-réutilisables)
3. [Styles et animations](#styles-et-animations)
4. [Bonnes pratiques](#bonnes-pratiques)
5. [Exemples d'utilisation](#exemples-dutilisation)

---

## Vue d'ensemble

Le design system de Loura HR est construit sur les principes suivants :

- **Cohérence** : Utilisation de composants réutilisables pour une expérience utilisateur uniforme
- **Fluidité** : Animations et transitions douces pour une interface agréable
- **Accessibilité** : Composants conçus avec l'accessibilité en tête
- **Performance** : Optimisé pour une expérience rapide et réactive

### Technologies utilisées

- **Next.js 16** avec App Router
- **React 19** avec TypeScript
- **Tailwind CSS v4** pour le styling
- **Radix UI** pour les composants de base
- **HeroIcons v2** pour les icônes

---

## Composants réutilisables

### 1. StatCard

Composant pour afficher des statistiques avec 3 variantes.

**Import :**
```typescript
import { StatCard } from '@/components/hr';
```

**Variantes disponibles :**

#### Variant: `minimal`
Affichage simple avec texte uniquement.

```tsx
<StatCard
  variant="minimal"
  title="Total Employés"
  value={150}
  subtitle="Personnel actif"
/>
```

#### Variant: `default`
Avec icône à droite et état hover.

```tsx
<StatCard
  variant="default"
  title="Employés Actifs"
  value={142}
  icon={HiOutlineUsers}
  trend={{ value: 8, isPositive: true }}
/>
```

#### Variant: `featured`
Style dashboard avec gradients et animations.

```tsx
<StatCard
  variant="featured"
  title="Paie du Mois"
  value="12.5M"
  subtitle="GNF"
  icon={HiOutlineBanknotes}
  iconColor="text-purple-600"
  iconBgColor="linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)"
  trend={{ value: 12, isPositive: true, label: "vs mois dernier" }}
/>
```

**Props :**
```typescript
interface StatCardProps {
  variant?: 'minimal' | 'default' | 'featured';
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}
```

---

### 2. PageHeader

En-tête de page standardisé avec titre, sous-titre et actions.

**Import :**
```typescript
import { PageHeader } from '@/components/hr';
```

**Exemple :**
```tsx
<PageHeader
  title="Gestion des Employés"
  subtitle="Vue d'ensemble de tous les employés"
  icon={HiOutlineUsers}
  actions={[
    {
      label: "Ajouter un employé",
      href: `/apps/${slug}/hr/employees/create`,
      icon: HiOutlinePlusCircle
    },
    {
      label: "Exporter",
      onClick: handleExport,
      variant: "outline"
    }
  ]}
  backLink={`/apps/${slug}/hr`}
/>
```

**Props :**
```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: PageHeaderAction[];
  backLink?: string;
  className?: string;
}

interface PageHeaderAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
}
```

---

### 3. PageSection

Conteneur de section avec titre et action optionnelle.

**Import :**
```typescript
import { PageSection } from '@/components/hr';
```

**Exemple :**
```tsx
<PageSection
  title="Statistiques par département"
  subtitle="Vue d'ensemble de la répartition"
  variant="muted"
  action={
    <Button variant="outline" size="sm">
      Voir tout
    </Button>
  }
>
  {/* Contenu de la section */}
</PageSection>
```

**Props :**
```typescript
interface PageSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  variant?: 'default' | 'muted' | 'gradient';
  className?: string;
  noPadding?: boolean;
}
```

---

### 4. EmptyState

État vide standardisé avec icône, message et action.

**Import :**
```typescript
import { EmptyState } from '@/components/hr';
```

**Exemple :**
```tsx
<EmptyState
  icon={HiOutlineUsers}
  title="Aucun employé"
  description="Commencez par ajouter votre premier employé à l'organisation"
  action={{
    label: "Ajouter un employé",
    href: `/apps/${slug}/hr/employees/create`,
    icon: HiOutlinePlusCircle
  }}
/>
```

**Props :**
```typescript
interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: ComponentType<{ className?: string }>;
  };
  className?: string;
}
```

---

### 5. FilterBar

Barre de recherche et filtres standardisée.

**Import :**
```typescript
import { FilterBar } from '@/components/hr';
```

**Exemple :**
```tsx
<FilterBar
  searchPlaceholder="Rechercher un employé..."
  searchValue={search}
  onSearchChange={setSearch}
  filters={[
    {
      label: "Statut",
      value: statusFilter,
      placeholder: "Tous les statuts",
      options: [
        { label: "Tous", value: "all" },
        { label: "Actif", value: "active" },
        { label: "Inactif", value: "inactive" }
      ],
      onValueChange: setStatusFilter
    }
  ]}
  showReset={search !== '' || statusFilter !== 'all'}
  onReset={() => {
    setSearch('');
    setStatusFilter('all');
  }}
/>
```

**Props :**
```typescript
interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterOption[];
  onReset?: () => void;
  showReset?: boolean;
  variant?: 'default' | 'minimal';
  className?: string;
}

interface FilterOption {
  label: string;
  value: string;
  placeholder?: string;
  options: Array<{ label: string; value: string }>;
  onValueChange: (value: string) => void;
}
```

---

## Styles et animations

### Classes utilitaires personnalisées

Le fichier `globals.css` inclut des classes utilitaires pour des effets communs :

#### Animations

```css
.animate-in        /* Fade in + slide up */
.animate-out       /* Fade out + slide down */
```

**Utilisation :**
```tsx
<div className="animate-in">
  {/* Contenu avec animation d'entrée */}
</div>
```

#### Transitions

```css
.transition-smooth      /* Transition rapide (200ms) */
.transition-smooth-slow /* Transition lente (300ms) */
```

#### Effets hover

```css
.hover-lift  /* Lève l'élément au hover */
.hover-glow  /* Ombre au hover */
```

**Exemple :**
```tsx
<div className="hover-lift hover-glow">
  {/* Carte avec effet au hover */}
</div>
```

#### Effets glass

```css
.glass       /* Arrière-plan flou */
.glass-card  /* Carte avec effet glass */
```

#### Gradients

```css
.gradient-primary  /* Gradient bleu */
.gradient-success  /* Gradient vert */
.gradient-warning  /* Gradient orange */
.gradient-error    /* Gradient rouge */
.gradient-info     /* Gradient bleu clair */
```

**Exemple :**
```tsx
<div className="gradient-success p-6 rounded-xl">
  {/* Contenu avec fond en gradient vert */}
</div>
```

---

## Bonnes pratiques

### 1. Structure de page standardisée

Utilisez cette structure pour une cohérence maximale :

```tsx
export default function MyPage() {
  return (
    <div className="space-y-6 animate-in">
      {/* 1. Header */}
      <PageHeader
        title="Titre de la page"
        subtitle="Description"
        icon={Icon}
        actions={[...]}
      />

      {/* 2. Stats cards (optionnel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard ... />
        <StatCard ... />
      </div>

      {/* 3. Filters (optionnel) */}
      <FilterBar ... />

      {/* 4. Main content */}
      <PageSection title="Section principale">
        {/* Contenu */}
      </PageSection>

      {/* 5. Secondary content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageSection ... />
        <PageSection ... />
      </div>
    </div>
  );
}
```

### 2. Espacement cohérent

Utilisez toujours ces valeurs pour l'espacement :

- **Conteneur principal** : `space-y-6` (24px entre sections)
- **Grilles** : `gap-6` (24px) ou `gap-4` (16px) pour des éléments plus petits
- **Cartes** : `p-6` (24px) pour padding standard
- **Petites cartes** : `p-4` (16px)

### 3. Tailles d'icônes

Standardisez les tailles d'icônes :

- **Inline** : `size-4` (16px)
- **Boutons** : `size-4` ou `size-5`
- **Cards** : `size-6` (24px)
- **Headers** : `size-7` ou `size-8` (28-32px)
- **Empty states** : `size-10` (40px)

### 4. Couleurs pour statuts

Utilisez ces couleurs de manière cohérente :

- **Success/Active** : `text-green-600`, `bg-green-100`
- **Warning/Pending** : `text-orange-600`, `bg-orange-100`
- **Error/Inactive** : `text-red-600`, `bg-red-100`
- **Info** : `text-blue-600`, `bg-blue-100`
- **Primary** : `text-primary`, `bg-primary/10`

### 5. Responsive design

Toujours utiliser les breakpoints Tailwind :

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols */}
</div>
```

---

## Exemples d'utilisation

### Page de liste complète

```tsx
"use client";

import { useState } from 'react';
import { PageHeader, StatCard, FilterBar, PageSection, EmptyState } from '@/components/hr';
import { HiOutlineUsers, HiOutlinePlusCircle } from 'react-icons/hi2';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <PageHeader
        title="Employés"
        subtitle="Gestion de tous les employés"
        icon={HiOutlineUsers}
        actions={[
          {
            label: "Ajouter un employé",
            href: "/employees/create",
            icon: HiOutlinePlusCircle
          }
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard variant="default" title="Total" value={150} icon={HiOutlineUsers} />
        <StatCard variant="default" title="Actifs" value={142} />
        <StatCard variant="default" title="En congé" value={5} />
        <StatCard variant="default" title="Inactifs" value={3} />
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Rechercher..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "Statut",
            value: statusFilter,
            options: [
              { label: "Tous", value: "all" },
              { label: "Actif", value: "active" }
            ],
            onValueChange: setStatusFilter
          }
        ]}
        showReset={search !== ''}
        onReset={() => setSearch('')}
      />

      {/* Main content */}
      <PageSection title="Liste des employés">
        {/* Table ou liste ici */}
      </PageSection>
    </div>
  );
}
```

### Dashboard avec graphiques

```tsx
import { StatCard, PageHeader, PageSection } from '@/components/hr';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Dashboard RH"
        subtitle="Vue d'ensemble"
        icon={HiOutlineChartBar}
      />

      {/* Featured stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          variant="featured"
          title="Total Employés"
          value={150}
          icon={HiOutlineUsers}
          iconColor="text-blue-600"
          iconBgColor="linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)"
          trend={{ value: 12, isPositive: true }}
        />
        {/* More stats... */}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageSection title="Évolution" subtitle="6 derniers mois">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              {/* Chart config */}
            </AreaChart>
          </ResponsiveContainer>
        </PageSection>

        <PageSection title="Répartition">
          {/* Another chart */}
        </PageSection>
      </div>
    </div>
  );
}
```

---

## Checklist pour nouvelle page

Avant de créer une nouvelle page, assurez-vous de :

- [ ] Utiliser le composant `PageHeader` pour l'en-tête
- [ ] Ajouter `animate-in` sur le conteneur principal
- [ ] Utiliser `StatCard` pour les statistiques
- [ ] Utiliser `FilterBar` si nécessaire
- [ ] Utiliser `PageSection` pour les sections de contenu
- [ ] Utiliser `EmptyState` pour les états vides
- [ ] Respecter l'espacement standard (`space-y-6`, `gap-6`)
- [ ] Tester le responsive design
- [ ] Vérifier les animations et transitions
- [ ] Utiliser les bonnes tailles d'icônes

---

## Support

Pour toute question sur le design system, consultez :
- [Documentation Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [HeroIcons](https://heroicons.com)
