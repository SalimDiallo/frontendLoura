# Architecture Globale

## Vue d'ensemble

Loura Frontend est une application **Next.js 16** (App Router) avec une architecture **modulaire** et **multi-tenant**. Chaque organisation dispose de son propre espace isolé, accessible via un slug unique.

---

## Principes architecturaux

### 1. Architecture modulaire

Le projet est organisé par **modules métier** :

- **Core** : Authentification, gestion des organisations, catégories
- **HR** : Ressources humaines complètes
- **Inventory** : Gestion des stocks et ventes
- **Notifications** : Système de notifications temps réel

Chaque module est **auto-contenu** avec :
- Routes dédiées (`app/{module}/`)
- Composants spécifiques (`components/{module}/`)
- Services API (`lib/services/{module}/`)
- Types TypeScript (`lib/types/{module}/`)

### 2. Multi-tenant

Le système supporte plusieurs organisations avec isolation complète :

```
/apps/[slug]/dashboard        # Tableau de bord de l'organisation "acme"
/apps/[slug]/hr/employees     # Employés de "acme"
/apps/[slug]/inventory/products # Produits de "acme"
```

Le `slug` (subdomain) est utilisé pour :
- Routing dynamique Next.js
- Filtrage des données backend (via `organization_subdomain`)
- Isolation du cache (IndexedDB par organisation)

### 3. Offline-first

Architecture conçue pour fonctionner hors ligne :

- **Cache intelligent** : IndexedDB avec TTL configurable
- **Queue de mutations** : Les modifications offline sont mises en queue
- **Synchronisation automatique** : Replay des mutations au retour online
- **Stale-while-revalidate** : Données obsolètes retournées pendant rechargement

### 4. Separation of Concerns

```
Component → Hook → Service → Cache Manager → API Client → Backend
```

- **Component** : Affichage et interactions utilisateur
- **Hook** : Logique réutilisable (state, side effects)
- **Service** : Abstraction des appels API
- **Cache Manager** : Gestion du cache et stratégies offline
- **API Client** : HTTP client avec gestion des tokens JWT

---

## Structure des dossiers

```
lourafrontend/
├── app/                          # Routes Next.js (App Router)
│   ├── apps/                     # Application multi-tenant
│   │   └── (org)/[slug]/         # Route groupe avec layout partagé
│   │       ├── layout.tsx        # Layout org (sidebar, header)
│   │       ├── dashboard/        # Dashboard
│   │       ├── hr/               # Module HR
│   │       │   ├── employees/
│   │       │   ├── departments/
│   │       │   ├── contracts/
│   │       │   ├── leaves/
│   │       │   ├── payroll/
│   │       │   └── attendance/
│   │       ├── inventory/        # Module Inventory
│   │       │   ├── products/
│   │       │   ├── warehouses/
│   │       │   ├── orders/
│   │       │   ├── sales/
│   │       │   └── reports/
│   │       └── notifications/    # Notifications
│   ├── auth/                     # Authentification
│   │   ├── admin/                # Login admin
│   │   └── employee/             # Login employé
│   ├── core/                     # Routes core publiques
│   ├── fonts/                    # Fonts
│   └── layout.tsx                # Root layout
│
├── components/                   # Composants React
│   ├── ui/                       # Composants UI réutilisables
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── index.ts              # Exports centralisés
│   ├── core/                     # Composants Core
│   │   ├── auth-layout.tsx
│   │   ├── organization-form.tsx
│   │   └── index.ts
│   ├── hr/                       # Composants HR
│   │   ├── employee/
│   │   ├── departement/
│   │   ├── contracts/
│   │   └── payrolls/
│   ├── inventory/                # Composants Inventory
│   ├── common/                   # Composants communs
│   └── providers/                # Context providers
│
├── lib/                          # Logique métier
│   ├── api/                      # API Client
│   │   ├── client.ts             # HTTP client (fetch)
│   │   ├── config.ts             # Endpoints et configuration
│   │   └── index.ts
│   ├── services/                 # Services par module
│   │   ├── core/
│   │   │   ├── auth.service.ts
│   │   │   ├── organization.service.ts
│   │   │   └── index.ts
│   │   ├── hr/
│   │   │   ├── employee.service.ts
│   │   │   ├── department.service.ts
│   │   │   ├── payroll.service.ts
│   │   │   └── index.ts
│   │   ├── inventory/
│   │   └── notifications/
│   ├── types/                    # Types TypeScript
│   │   ├── core/
│   │   ├── hr/
│   │   ├── inventory/
│   │   └── shared/
│   ├── hooks/                    # Hooks personnalisés
│   │   ├── use-auth.ts
│   │   ├── use-permissions.ts
│   │   ├── use-crud-actions.ts
│   │   └── use-notifications.ts
│   ├── store/                    # État global (Zustand)
│   │   ├── auth-store.ts
│   │   └── permissions-store.ts
│   ├── offline/                  # Système offline
│   │   ├── cache-manager.ts
│   │   ├── indexeddb.ts
│   │   ├── sync-manager.ts
│   │   └── data-warmup.ts
│   ├── utils/                    # Utilitaires
│   ├── constants/                # Constantes
│   └── config.ts                 # Configuration site
│
├── public/                       # Fichiers statiques
│   ├── sw.js                     # Service Worker
│   ├── manifest.json             # PWA Manifest
│   └── routes-manifest.json      # Routes pour cache
│
├── scripts/                      # Scripts utilitaires
│   └── generate-routes.js        # Génère routes-manifest.json
│
├── docs/                         # Documentation
│
├── .env.local                    # Variables d'environnement
├── next.config.ts                # Configuration Next.js
├── tsconfig.json                 # Configuration TypeScript
├── tailwind.config.ts            # Configuration Tailwind
├── components.json               # Configuration shadcn/ui
└── package.json                  # Dépendances
```

---

## Patterns architecturaux

### 1. Server Components vs Client Components

**Next.js 16 App Router** utilise Server Components par défaut.

#### Server Components (par défaut)
- Rendu côté serveur
- Accès direct aux ressources serveur
- Pas de JavaScript envoyé au client
- Pas d'interactivité (pas de hooks, événements)

```typescript
// app/apps/(org)/[slug]/dashboard/page.tsx
export default async function DashboardPage({ params }: { params: { slug: string } }) {
  // Peut faire des fetch directs ici
  return <div>Dashboard</div>;
}
```

#### Client Components (avec 'use client')
- Rendu côté client
- Hooks React, interactivité
- State management
- Nécessaire pour les composants UI interactifs

```typescript
'use client';

import { useState } from 'react';

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 2. Route Groups

Les **route groups** permettent d'organiser les routes sans affecter l'URL :

```
app/apps/(org)/[slug]/layout.tsx     # Layout partagé
app/apps/(org)/[slug]/dashboard/     # URL : /apps/acme/dashboard
```

### 3. Dynamic Routes

Routes dynamiques avec paramètres :

```typescript
// app/apps/(org)/[slug]/hr/employees/[id]/page.tsx
export default function EmployeeDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  // slug = "acme", id = "123"
}
```

### 4. Layouts imbriqués

Layouts imbriqués pour structure hiérarchique :

```
app/layout.tsx                     # Root layout (global)
  └─ app/apps/(org)/[slug]/layout.tsx   # Org layout (sidebar)
      └─ app/apps/(org)/[slug]/hr/employees/layout.tsx  # Module layout
```

---

## Flux de données

### Lecture de données (GET)

```
Component
  ↓ (appelle hook)
Hook (useEffect, useSWR, etc.)
  ↓ (appelle service)
Service (employee.service.ts)
  ↓ (appelle cacheManager)
Cache Manager
  ↓ (vérifie cache)
IndexedDB ← (si cache valide, retourne)
  ↓ (si cache expiré/absent)
API Client (apiClient.get)
  ↓ (requête HTTP)
Backend Django
  ↓ (réponse)
Cache Manager (stocke en cache)
  ↓
Component (affiche données)
```

### Écriture de données (POST/PUT/DELETE)

```
Component (formulaire)
  ↓ (soumission)
Hook (onSubmit)
  ↓ (appelle service)
Service (employee.service.ts)
  ↓ (appelle cacheManager)
Cache Manager
  ↓ (vérifie connexion)

Si ONLINE:
  API Client → Backend
  → Cache Manager (invalide cache)
  → Component (mise à jour)

Si OFFLINE:
  Queue Manager (met en queue)
  → IndexedDB (stocke mutation)
  → Cache Manager (invalide cache localement)
  → Component (UI optimiste)

  (au retour online)
  → Sync Manager (replay mutations)
  → Backend
```

---

## Gestion d'état

### État local (useState, useReducer)
Pour l'état spécifique à un composant.

```typescript
const [isOpen, setIsOpen] = useState(false);
```

### État serveur (React Query, SWR, ou custom hooks)
Pour les données venant du backend.

```typescript
const { data, isLoading } = useListData('/hr/employees/');
```

### État global (Zustand)
Pour l'état partagé entre composants.

```typescript
// lib/store/auth-store.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

Stores existants :
- `authStore` : Authentification (user, tokens)
- `permissionsStore` : Permissions utilisateur

---

## Système de cache

### Stratégie

- **GET** : Cache-first avec fallback réseau
- **POST/PUT/DELETE** : Network-first avec queue offline

### IndexedDB

Base de données locale pour :
- Cache des réponses API
- Queue des mutations offline
- Métadonnées (TTL, timestamps)

### TTL (Time To Live)

Chaque endpoint peut définir son TTL :

```typescript
cacheManager.get('/hr/employees/', { ttl: 5 * 60 * 1000 }); // 5 minutes
```

### Invalidation

Après mutations, invalider le cache concerné :

```typescript
cacheManager.post('/hr/employees/', data, {
  invalidateCache: ['/hr/employees/'],  // Invalider liste
});
```

---

## Système de permissions

### RBAC (Role-Based Access Control)

- **Admin** : Accès complet (toutes permissions)
- **Employee** : Accès basé sur son rôle

### Codes de permissions

Format : `{module}.{action}_{entity}`

Exemples :
- `hr.view_employee`
- `hr.add_employee`
- `inventory.change_product`
- `inventory.delete_sale`

### Composants protégés

```typescript
import { Can } from '@/components/common/providers';

<Can code="hr.add_employee">
  <Button onClick={handleCreate}>Ajouter</Button>
</Can>
```

### Hooks

```typescript
import { usePermissions } from '@/lib/hooks';

const { hasPermission, isAdmin } = usePermissions();

if (hasPermission('hr.add_employee')) {
  // Afficher bouton
}
```

---

## Multi-tenant

### Slug/Subdomain

Chaque organisation a un `subdomain` unique (slug) :

```
/apps/acme/dashboard        # Organisation "acme"
/apps/techcorp/dashboard    # Organisation "techcorp"
```

### Filtrage backend

Le slug est automatiquement ajouté aux requêtes API :

```typescript
// lib/api/client.ts
const orgSlug = localStorage.getItem('current_organization_slug');
url = `${url}?organization_subdomain=${orgSlug}`;
```

Le backend Django filtre les données par organisation.

### Isolation du cache

Le cache IndexedDB stocke les données par organisation :

```typescript
{
  endpoint: '/hr/employees/',
  organizationSlug: 'acme',
  data: [...],
}
```

---

## PWA (Progressive Web App)

### Service Worker

`public/sw.js` :
- Cache des assets statiques
- Cache des routes dynamiques
- Stratégies de cache (network-first, cache-first)

### Manifest

`public/manifest.json` :
- Nom de l'application
- Icônes
- Couleurs de thème
- Mode d'affichage (standalone)

### Offline

Page de fallback : `public/offline.html`

---

## Performance

### Optimisations

1. **Code splitting** : Routes chargées à la demande
2. **Tree shaking** : Imports optimisés
3. **Image optimization** : `next/image` automatique
4. **Bundle analysis** : Scripts de build
5. **Lazy loading** : Composants dynamiques

### Metrics

- **LCP** (Largest Contentful Paint) : < 2.5s
- **FID** (First Input Delay) : < 100ms
- **CLS** (Cumulative Layout Shift) : < 0.1

---

## Sécurité

### JWT Authentication

- **Access token** : Courte durée (15 min)
- **Refresh token** : Longue durée (7 jours)
- **Automatic refresh** : Transparente pour l'utilisateur

### Storage

Tokens stockés dans `localStorage` :
- `access_token`
- `refresh_token`
- `user`

### CSRF Protection

Headers automatiques :
- `Content-Type: application/json`
- `Authorization: Bearer {token}`

### XSS Protection

- React échappe automatiquement les données
- `dangerouslySetInnerHTML` utilisé avec DOMPurify

---

## Tests (à implémenter)

### Unit Tests
- Services
- Hooks
- Utilitaires

### Integration Tests
- Composants
- Formulaires
- Flux utilisateur

### E2E Tests
- Scénarios complets
- Multi-tenant
- Offline/online

---

## Déploiement

### Docker

`Dockerfile` prêt pour production :

```bash
docker build -t loura-frontend .
docker run -p 3000:3000 loura-frontend
```

### Build

```bash
pnpm prebuild  # Génère routes-manifest.json
pnpm build     # Build optimisé Next.js
```

### Standalone Output

`next.config.ts` :

```typescript
output: 'standalone'  // Pour Docker
```

---

## Monitoring et Logging

### Console Logs

Logs structurés :
- `[API Client]` : Requêtes API
- `[Cache]` : Opérations cache
- `[Offline]` : Mode offline
- `[Sync]` : Synchronisation

### Erreurs

Classe `ApiError` :
- `message` : Message d'erreur
- `status` : Code HTTP
- `data` : Données supplémentaires

---

## Évolutivité

### Ajout d'un nouveau module

1. Créer la structure :
   ```
   app/{module}/
   components/{module}/
   lib/services/{module}/
   lib/types/{module}/
   ```

2. Définir les endpoints dans `lib/api/config.ts`

3. Créer les services avec `cacheManager`

4. Définir les types TypeScript

5. Créer les composants et routes

6. Ajouter les permissions si nécessaire

### Bonnes pratiques

- Suivre la structure modulaire existante
- Utiliser les patterns établis
- Respecter les conventions de nommage
- Documenter les changements
- Tester les nouvelles fonctionnalités

---

## Références

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS v4](https://tailwindcss.com/docs/v4-beta)
