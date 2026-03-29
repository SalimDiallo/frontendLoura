# Documentation Technique - Loura Frontend

> Documentation complète de l'architecture et des modules du frontend Loura

## Table des matières

1. [Architecture Globale](./01-architecture.md)
2. [Stack Technique](./02-technologies.md)
3. [Module Core](./03-core-module.md)
4. [Module HR (Ressources Humaines)](./04-hr-module.md)
5. [Module Inventory (Gestion des stocks)](./05-inventory-module.md)
6. [Module Notifications](./06-notifications-module.md)
7. [API Client et Services](./07-api-services.md)
8. [Système Offline et Cache](./08-offline-system.md)
9. [Composants UI et Patterns](./09-components-ui.md)
10. [Système de Permissions](./10-permissions-system.md)
11. [Routing et Navigation](./11-routing.md)
12. [Conventions de Code](./12-conventions.md)

---

## Vue d'ensemble du projet

**Loura Frontend** est une application web moderne construite avec **Next.js 16** (App Router) et **React 19**, conçue pour la gestion multi-tenant d'organisations. Elle propose plusieurs modules métier intégrés :

- **Core** : Authentification, organisations, catégories
- **HR** : Gestion complète des ressources humaines (employés, départements, contrats, congés, paie, pointages)
- **Inventory** : Gestion avancée des stocks et des ventes (produits, entrepôts, commandes, ventes, documents commerciaux)
- **Notifications** : Système de notifications en temps réel (SSE)

### Caractéristiques principales

- **Architecture modulaire** : Organisation par module métier (core, hr, inventory, notifications)
- **Multi-tenant** : Support complet des organisations avec routage dynamique `/apps/[slug]/*`
- **Offline-first** : Système de cache intelligent avec IndexedDB et synchronisation
- **Système de permissions** : Gestion granulaire des droits d'accès (RBAC)
- **TypeScript strict** : Typage complet pour une meilleure maintenabilité
- **Design system** : Composants UI basés sur shadcn/ui (Radix UI + Tailwind CSS v4)
- **PWA** : Progressive Web App avec Service Worker et manifest
- **Real-time** : Notifications temps réel via Server-Sent Events (SSE)

### Architecture technique

```
lourafrontend/
├── app/                      # Routes Next.js (App Router)
│   ├── apps/(org)/[slug]/   # Routes multi-tenant
│   │   ├── dashboard/       # Tableau de bord
│   │   ├── hr/              # Module RH
│   │   ├── inventory/       # Module Inventory
│   │   └── notifications/   # Module Notifications
│   ├── auth/                # Authentification
│   └── core/                # Routes core publiques
├── components/              # Composants React
│   ├── ui/                  # Composants UI réutilisables (shadcn/ui)
│   ├── core/                # Composants Core
│   ├── hr/                  # Composants HR
│   ├── inventory/           # Composants Inventory
│   └── common/              # Composants communs
├── lib/                     # Logique métier
│   ├── api/                 # Client API et configuration
│   ├── services/            # Services par module (core, hr, inventory, etc.)
│   ├── types/               # Types TypeScript par module
│   ├── hooks/               # Hooks personnalisés
│   ├── store/               # État global (Zustand)
│   ├── offline/             # Système offline (cache, sync)
│   ├── utils/               # Utilitaires
│   └── constants/           # Constantes
├── public/                  # Fichiers statiques (PWA, images)
└── docs/                    # Documentation (vous êtes ici)
```

### Flux de données

```
User → Component → Hook → Service → Cache Manager → API Client → Backend Django
                                    ↓
                                IndexedDB (cache)
```

### Technologies clés

- **Next.js 16** : Framework React avec App Router
- **React 19** : Bibliothèque UI
- **TypeScript 5** : Typage statique (mode strict)
- **Tailwind CSS v4** : Framework CSS utility-first
- **Radix UI** : Primitives accessibles
- **Zustand** : Gestion d'état global
- **IndexedDB** : Base de données locale pour le cache offline
- **React Hook Form + Zod** : Gestion et validation de formulaires
- **Server-Sent Events** : Notifications temps réel

---

## Structure modulaire

Le projet suit une architecture modulaire stricte où chaque module métier est auto-contenu :

### Module Core
- **Routes** : `app/core/`, `app/auth/`
- **Components** : `components/core/`
- **Services** : `lib/services/core/`
- **Types** : `lib/types/core/`

### Module HR (Ressources Humaines)
- **Routes** : `app/apps/(org)/[slug]/hr/`
- **Components** : `components/hr/`
- **Services** : `lib/services/hr/`
- **Types** : `lib/types/hr/`

### Module Inventory (Gestion des stocks)
- **Routes** : `app/apps/(org)/[slug]/inventory/`
- **Components** : `components/inventory/`
- **Services** : `lib/services/inventory/`
- **Types** : `lib/types/inventory/`

### Module Notifications
- **Routes** : `app/apps/(org)/[slug]/notifications/`
- **Services** : `lib/services/notifications/`
- **Types** : `lib/types/notifications/`

---

## Commandes de développement

```bash
# Installation
pnpm install

# Développement
pnpm dev              # Démarre le serveur de développement (localhost:3000)

# Build
pnpm prebuild         # Génère les routes dynamiques
pnpm build            # Build de production

# Production
pnpm start            # Démarre le serveur de production

# Linting
pnpm lint             # Exécute ESLint

# Génération de routes
pnpm generate-routes  # Génère routes-manifest.json pour le cache
```

---

## Variables d'environnement

Créer un fichier `.env.local` :

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Points d'entrée

### Authentification
- `/auth/admin` - Connexion administrateur
- `/auth/employee` - Connexion employé
- `/auth/register` - Inscription (crée admin + organisation)

### Application
- `/apps/[slug]/dashboard` - Tableau de bord de l'organisation
- `/apps/[slug]/hr/*` - Module RH
- `/apps/[slug]/inventory/*` - Module Inventory
- `/apps/[slug]/notifications` - Notifications

---

## Conventions de code

### Imports
Toujours importer depuis les fichiers index :

```typescript
// ✅ Correct
import { Button, Input } from '@/components/ui';
import { authService } from '@/lib/services/core';
import type { Employee } from '@/lib/types/hr';

// ❌ Éviter
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/services/core/auth.service';
```

### Nommage
- **Composants** : PascalCase (`EmployeeCard.tsx`)
- **Services** : camelCase avec suffixe `.service.ts` (`employee.service.ts`)
- **Types** : PascalCase (`Employee`, `EmployeeCreate`)
- **Hooks** : camelCase avec préfixe `use` (`usePermissions`)

### Structure des services
Tous les services utilisent `cacheManager` pour les requêtes API :

```typescript
export const entityService = {
  async getAll(): Promise<Entity[]> {
    return cacheManager.get(endpoint, { ttl: 5 * 60 * 1000 });
  },

  async create(data: EntityCreate): Promise<Entity> {
    return cacheManager.post(endpoint, data, {
      invalidateCache: [listEndpoint],
    });
  },
};
```

---

## Ressources supplémentaires

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs/v4-beta)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Zustand](https://zustand.docs.pmnd.rs)

---

## Contribution

Pour contribuer au projet :

1. Lire la documentation complète (tous les fichiers de ce dossier)
2. Respecter les conventions de code
3. Utiliser les patterns existants
4. Ajouter des tests si nécessaire
5. Mettre à jour la documentation

---

## Support

Pour toute question ou problème, consulter la documentation détaillée ou contacter l'équipe de développement.
