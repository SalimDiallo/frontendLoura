# Composants UI et Patterns

## Vue d'ensemble

L'application utilise un design system basé sur **shadcn/ui**, avec des composants Radix UI et Tailwind CSS v4.

---

## Design System

### shadcn/ui

- **Style** : new-york
- **Primitives** : Radix UI
- **Styling** : Tailwind CSS v4
- **Icons** : Lucide React
- **Variants** : CVA (class-variance-authority)

### Configuration

`components.json`

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

---

## Composants UI de base

### Button

`components/ui/button.tsx`

Bouton avec variants et tailles.

```typescript
import { Button } from '@/components/ui';

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>
```

#### Variants

- `default` : Bouton principal
- `destructive` : Actions destructives
- `outline` : Bouton secondaire
- `ghost` : Bouton fantôme
- `link` : Lien stylisé

### Input

`components/ui/input.tsx`

Champ de saisie texte.

```typescript
import { Input } from '@/components/ui';

<Input type="text" placeholder="Enter text" />
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input disabled />
<Input error="This field is required" />
```

### Select

`components/ui/select.tsx`

Liste déroulante.

```typescript
import { Select } from '@/components/ui';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Dialog

`components/ui/dialog.tsx`

Modale.

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <div>Content</div>
  </DialogContent>
</Dialog>
```

### Card

`components/ui/card.tsx`

Carte de contenu.

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Table

`components/ui/table.tsx`

Tableau de données.

```typescript
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Badge

`components/ui/badge.tsx`

Badge/tag.

```typescript
import { Badge } from '@/components/ui';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Alert

`components/ui/alert.tsx`

Message d'alerte.

```typescript
import { Alert, AlertTitle, AlertDescription } from '@/components/ui';

<Alert>
  <AlertTitle>Note</AlertTitle>
  <AlertDescription>
    This is an informational message.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong.
  </AlertDescription>
</Alert>
```

---

## Composants de formulaire

### Form

`components/ui/form.tsx`

Composants de formulaire avec React Hook Form.

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui';

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="email@example.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

### FormFields helper

`components/ui/form-fields.tsx`

Composants de champs spécialisés.

- `FormInput` : Champ texte
- `FormTextarea` : Zone de texte
- `FormSelect` : Select
- `FormCheckbox` : Case à cocher
- `FormDatePicker` : Sélecteur de date

---

## Composants métier

### StatCard

`components/ui/stat-card.tsx`

Carte de statistique.

```typescript
import { StatCard } from '@/components/ui';

<StatCard
  title="Total Employees"
  value="150"
  icon={<Users className="h-4 w-4" />}
  trend="+5%"
  trendDirection="up"
/>
```

### DataTable

`components/common/data-table.tsx`

Table de données avec tri, filtres et pagination.

```typescript
import { DataTable } from '@/components/common';

<DataTable
  columns={columns}
  data={data}
  searchKey="name"
  onRowClick={(row) => console.log(row)}
/>
```

### PageHeader

`components/ui/page-header.tsx`

En-tête de page avec titre et actions.

```typescript
import { PageHeader } from '@/components/ui';

<PageHeader
  title="Employees"
  description="Manage your employees"
  actions={
    <Button onClick={handleCreate}>
      <Plus className="mr-2" /> Add Employee
    </Button>
  }
/>
```

### PageSection

`components/ui/page-section.tsx`

Section de page.

```typescript
import { PageSection } from '@/components/ui';

<PageSection title="Personal Information">
  <div>Content</div>
</PageSection>
```

### EmptyState

`components/ui/empty-state.tsx`

État vide.

```typescript
import { EmptyState } from '@/components/ui';

<EmptyState
  icon={<Inbox />}
  title="No data"
  description="There are no items to display"
  action={
    <Button onClick={handleCreate}>Create new</Button>
  }
/>
```

---

## Composants de layout

### Sidebar

`components/ui/sidebar.tsx`

Sidebar responsive avec navigation.

Utilisé dans `app/apps/(org)/[slug]/layout.tsx`.

### AppSidebar

`components/core/app-sidebar.tsx`

Sidebar spécifique à l'application.

### DashboardLayout

`components/core/dashboard-layout.tsx`

Layout pour les pages dashboard.

---

## Composants offline

### OfflineIndicator

`components/ui/offline-indicator.tsx`

Indicateur de statut offline.

```typescript
import { OfflineIndicator } from '@/components/ui';

<OfflineIndicator />
```

### CacheProgressIndicator

`components/ui/cache-progress-indicator.tsx`

Indicateur de progression du cache.

---

## Utilitaires

### cn()

`lib/utils.ts`

Fonction pour fusionner les classes CSS.

```typescript
import { cn } from '@/lib/utils';

<div className={cn('base-class', { 'active': isActive })} />
```

### CVA (Class Variance Authority)

Définir des variants de composants.

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: 'btn-default',
      destructive: 'btn-destructive',
    },
    size: {
      sm: 'btn-sm',
      md: 'btn-md',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});
```

---

## Patterns de composition

### Compound Components

```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Render Props

```typescript
<FormField
  name="email"
  render={({ field }) => (
    <Input {...field} />
  )}
/>
```

### Slots

```typescript
<Dialog>
  <DialogTrigger>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    Content
  </DialogContent>
</Dialog>
```

---

## Animations

### Framer Motion

```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Tailwind Transitions

```css
.btn {
  @apply transition-all duration-200 ease-in-out;
}

.btn:hover {
  @apply scale-105;
}
```

---

## Theming

### CSS Variables

`app/globals.css`

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### ThemeToggle

`components/ui/theme-toggle.tsx`

Bouton pour basculer entre light/dark mode.

```typescript
import { ThemeToggle } from '@/components/ui';

<ThemeToggle />
```

---

## Icônes

### Lucide React

```typescript
import { User, Mail, Phone, Calendar, Plus, Edit, Trash } from 'lucide-react';

<User className="h-4 w-4" />
<Mail className="h-4 w-4 text-muted-foreground" />
```

### React Icons

```typescript
import { FaFacebook, FaTwitter } from 'react-icons/fa';

<FaFacebook className="h-5 w-5" />
```

---

## Accessibility

### ARIA

Tous les composants UI incluent les attributs ARIA appropriés.

```typescript
<Button
  aria-label="Close dialog"
  aria-describedby="dialog-description"
>
  Close
</Button>
```

### Keyboard Navigation

Support complet du clavier :
- Tab : Navigation
- Enter/Space : Activation
- Escape : Fermeture
- Arrow keys : Navigation dans les listes

---

## Responsive Design

### Breakpoints Tailwind

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Usage

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

---

## Bonnes pratiques

### Composants

1. **Composition** : Privilégier la composition à l'héritage
2. **Props** : Typer toutes les props
3. **Forward refs** : Utiliser forwardRef pour les composants UI
4. **Variants** : Utiliser CVA pour les variants
5. **Accessibility** : Toujours inclure les attributs ARIA

### Styling

1. **Tailwind** : Utiliser les classes Tailwind
2. **cn()** : Utiliser cn() pour fusionner les classes
3. **CSS Variables** : Pour le theming
4. **Responsive** : Mobile-first design
5. **Dark mode** : Support obligatoire

### Performance

1. **React.memo** : Mémoiser les composants lourds
2. **useMemo/useCallback** : Mémoiser les valeurs/callbacks
3. **Lazy loading** : Charger les composants à la demande
4. **Code splitting** : Séparer les bundles

---

## Références

- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [CVA](https://cva.style)
