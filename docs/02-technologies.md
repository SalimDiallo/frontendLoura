# Stack Technique

## Vue d'ensemble

Loura Frontend utilise un stack moderne et performant basé sur **Next.js 16**, **React 19** et **TypeScript 5**.

---

## Technologies principales

### Next.js 16

**Framework React full-stack**

- **Version** : 16.1.6
- **Mode** : App Router (nouvelle architecture)
- **Build** : Standalone output (pour Docker)
- **SSR/SSG** : Server-Side Rendering et Static Site Generation
- **File-based routing** : Routes automatiques depuis `app/`
- **Server Components** : Rendu serveur par défaut
- **Image Optimization** : `next/image` automatique

#### Configuration (`next.config.ts`)

```typescript
{
  output: 'standalone',           // Docker-ready
  images: {
    remotePatterns: [...],        // Domaines autorisés
  },
  async headers() {
    // Headers PWA (Service Worker, Manifest)
  }
}
```

### React 19

**Bibliothèque UI**

- **Version** : 19.2.1
- **Concurrent Rendering** : Rendu concurrent pour meilleures performances
- **Automatic Batching** : Optimisation automatique des re-renders
- **Suspense** : Chargement asynchrone de composants
- **Server Components** : Nouveaux composants serveur

### TypeScript 5

**Typage statique**

- **Version** : 5.x
- **Mode strict** : Activé (`strict: true`)
- **Target** : ES2017
- **Module** : ESNext avec bundler resolution
- **JSX** : react-jsx (nouvelle transformation)

#### Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]                // Alias @/ vers racine
    }
  }
}
```

---

## UI et Styling

### Tailwind CSS v4

**Framework CSS utility-first**

- **Version** : 4.x (beta)
- **PostCSS** : `@tailwindcss/postcss`
- **Variables CSS** : Theming avec variables
- **Base color** : Neutral
- **Custom animations** : `tw-animate-css`

#### Avantages v4
- Compilation ultra-rapide
- CSS Variables natif
- Meilleure tree-shaking
- API simplifiée

### shadcn/ui

**Composants UI réutilisables**

- **Style** : new-york
- **Primitives** : Radix UI
- **Icons** : Lucide React
- **Customization** : CVA (class-variance-authority)
- **Accessibility** : ARIA compliant

#### Registries externes
- **Aceternity UI** : Composants animés
- **Magic UI** : Composants avancés

### Radix UI

**Primitives accessibles**

Composants utilisés :
- `@radix-ui/react-dialog` : Modales
- `@radix-ui/react-dropdown-menu` : Menus
- `@radix-ui/react-select` : Select boxes
- `@radix-ui/react-switch` : Switches
- `@radix-ui/react-tabs` : Onglets
- `@radix-ui/react-tooltip` : Tooltips
- `@radix-ui/react-accordion` : Accordéons
- `@radix-ui/react-avatar` : Avatars
- `@radix-ui/react-collapsible` : Collapsibles

### Lucide React

**Icônes**

- **Version** : 0.554.0
- **Format** : SVG
- **Tree-shakeable** : Import sélectif
- **Consistant** : Style uniforme

---

## Gestion d'état

### Zustand

**State management**

- **Version** : 5.0.9
- **Lightweight** : ~1KB gzippé
- **Hooks-based** : API simple avec hooks
- **No boilerplate** : Pas de providers complexes
- **TypeScript** : Support natif

#### Stores actuels

```typescript
// lib/store/auth-store.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// lib/store/permissions-store.ts
export const usePermissionsStore = create<PermissionsState>(...);
```

---

## Formulaires et Validation

### React Hook Form

**Gestion de formulaires**

- **Version** : 7.66.1
- **Performance** : Re-renders minimaux
- **Validation** : Intégration Zod
- **TypeScript** : Support complet

#### Exemple

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... },
});
```

### Zod

**Validation de schémas**

- **Version** : 4.1.13
- **Type-safe** : Inférence TypeScript automatique
- **Composable** : Schémas réutilisables
- **Error messages** : Messages personnalisables

#### Exemple

```typescript
import { z } from 'zod';

const employeeSchema = z.object({
  first_name: z.string().min(1, 'Requis'),
  email: z.string().email('Email invalide'),
  salary: z.number().positive('Doit être positif'),
});

type Employee = z.infer<typeof employeeSchema>;
```

---

## Offline et Cache

### IndexedDB

**Base de données locale**

- **API** : `lib/offline/indexeddb.ts`
- **Stores** :
  - `cache` : Réponses API cachées
  - `mutations` : Queue de mutations offline
- **Versioning** : Migrations automatiques

### Service Worker

**PWA support**

- **Fichier** : `public/sw.js`
- **Stratégies** :
  - Network-first pour API
  - Cache-first pour assets
- **Precaching** : Routes principales
- **Fallback** : `offline.html`

---

## Charts et Visualisations

### Recharts

**Graphiques React**

- **Version** : 2.15.4
- **Composable** : API déclarative
- **Responsive** : Adaptatif
- **Animations** : Transitions fluides

Types de charts utilisés :
- LineChart
- BarChart
- PieChart
- AreaChart

### ApexCharts

**Graphiques avancés**

- **Version** : 3.50.0
- **Interactive** : Zoom, tooltips, etc.
- **Rich** : Nombreux types de charts
- **React wrapper** : `react-apexcharts`

---

## PDF et Documents

### jsPDF

**Génération PDF**

- **Version** : 4.2.0 (attention : version ancienne)
- **Usage** : Rapports, factures, contrats
- **Fonts** : Support Unicode
- **Images** : Embedding automatique

### html2canvas

**Screenshot HTML**

- **Version** : 1.4.1
- **Usage** : Conversion HTML → Canvas → PDF
- **Fallback** : Si backend PDF unavailable

---

## QR Code

### html5-qrcode

**Scanner QR**

- **Version** : 2.3.8
- **Camera** : Accès webcam
- **Usage** : Pointage QR

### qrcode.react

**Génération QR**

- **Version** : 4.2.0
- **Format** : SVG ou Canvas
- **Usage** : Session QR pour pointage

### jsqr

**Parser QR**

- **Version** : 1.4.0
- **Usage** : Décodage QR depuis canvas

---

## Markdown et Rich Text

### marked

**Parser Markdown**

- **Version** : 17.0.1
- **Usage** : Affichage contenu riche
- **Plugins** : Extensible

### react-markdown

**Composant Markdown**

- **Version** : 10.1.0
- **Usage** : Rendu Markdown dans React
- **Plugins** : `remark-gfm` (GitHub Flavored Markdown)

### shiki

**Syntax highlighting**

- **Version** : 3.21.0
- **Themes** : Nombreux thèmes
- **Languages** : Support large

---

## Animations

### Framer Motion

**Animations React**

- **Version** : 12.28.1
- **Declarative** : API déclarative
- **Gestures** : Drag, tap, hover
- **Transitions** : Fluides et performantes

### Motion

**Alternative légère**

- **Version** : 12.34.0
- **Usage** : Animations simples

### Cobe

**Globe 3D**

- **Version** : 0.6.5
- **Usage** : Visualisation géographique

### rough-notation

**Annotations dessinées**

- **Version** : 0.5.1
- **Usage** : Highlights, underlines

---

## Date et Temps

### date-fns

**Utilitaires de dates**

- **Version** : 4.1.0
- **Tree-shakeable** : Import sélectif
- **I18n** : Support localisation
- **Immutable** : Pas de mutation

#### Fonctions utilisées
- `format()` : Formatage dates
- `parseISO()` : Parse ISO strings
- `addDays()`, `subDays()` : Calculs
- `isBefore()`, `isAfter()` : Comparaisons

### react-day-picker

**Sélecteur de dates**

- **Version** : 9.14.0
- **Accessible** : ARIA compliant
- **Customizable** : Styles Tailwind
- **Range selection** : Sélection plage de dates

---

## Utilitaires

### clsx

**Gestion de classes CSS**

- **Version** : 2.1.1
- **Tiny** : 200 bytes
- **Conditionals** : Classes conditionnelles

```typescript
clsx('btn', { 'btn-primary': isPrimary, 'btn-disabled': disabled });
```

### tailwind-merge

**Merge classes Tailwind**

- **Version** : 3.4.0
- **Smart** : Résout les conflits
- **Usage** : Avec `clsx` dans `cn()`

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### class-variance-authority

**Variants de composants**

- **Version** : 0.7.1
- **Type-safe** : Inférence TypeScript
- **Usage** : Composants UI avec variants

```typescript
const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: 'btn-default',
      primary: 'btn-primary',
    },
    size: {
      sm: 'btn-sm',
      md: 'btn-md',
    },
  },
});
```

---

## Dépendances de développement

### ESLint

**Linter JavaScript/TypeScript**

- **Version** : 9.x
- **Config** : `eslint-config-next`
- **Rules** : Next.js recommended

### TypeScript Compiler

**Compilateur TypeScript**

- **Version** : 5.x
- **Incremental** : Build incrémental
- **Type checking** : Vérification statique

---

## Package Manager

### pnpm

**Gestionnaire de paquets**

- **Fast** : Plus rapide que npm/yarn
- **Efficient** : Stockage optimisé (hard links)
- **Strict** : Pas de hoisting automatique
- **Workspaces** : Support mono-repos

#### Commandes

```bash
pnpm install         # Installer dépendances
pnpm dev             # Développement
pnpm build           # Build production
pnpm start           # Serveur production
```

---

## Docker

### Dockerfile

Build multi-stage optimisé :

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Progressive Web App (PWA)

### Manifest

`public/manifest.json` :

```json
{
  "name": "Loura",
  "short_name": "Loura",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [...]
}
```

### Service Worker

`public/sw.js` :

- Precaching des routes
- Stratégies de cache
- Offline fallback

---

## Environnement de développement

### Node.js

- **Version recommandée** : 20.x LTS
- **Alternative** : 18.x LTS

### IDE

Recommandé :
- **VS Code** avec extensions :
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### Git

Workflow :
- Branches feature
- Pull requests
- Conventional commits

---

## Performance

### Bundle Size

Dépendances optimisées :
- Tree-shaking automatique
- Code splitting par route
- Lazy loading des composants

### Metrics

Objectifs :
- **TTI** (Time to Interactive) : < 3s
- **FCP** (First Contentful Paint) : < 1.5s
- **LCP** (Largest Contentful Paint) : < 2.5s
- **CLS** (Cumulative Layout Shift) : < 0.1

---

## Références

### Documentation officielle

- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Zustand](https://zustand.docs.pmnd.rs)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

### Ressources supplémentaires

- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [Tailwind UI](https://tailwindui.com)
- [Radix Themes](https://www.radix-ui.com/themes)
