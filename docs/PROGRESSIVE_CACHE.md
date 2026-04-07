# Progressive Caching - Cache Automatique de Toutes les Pages

## Vue d'ensemble

Le système de **Progressive Caching** cache automatiquement TOUTES les pages de votre application lors de la première visite, en arrière-plan, de manière non-bloquante.

**🚀 Nouveau:** Le système utilise maintenant **3 méthodes combinées** pour une détection exhaustive des routes!

## Comment ça fonctionne

### 1. Première Visite

Lors de la première visite (ou si le cache n'est pas complet):

```
1. L'utilisateur arrive sur le site
2. Le site charge normalement (pas de blocage)
3. Après 5 secondes, le système démarre automatiquement
4. Un indicateur de progression apparaît en bas à droite
5. Le système découvre toutes les routes (manifeste + crawling + cache)
6. Chaque route est mise en cache progressivement (100ms entre chaque)
7. La progression est affichée en temps réel
8. L'indicateur se masque automatiquement après 3 secondes
```

### 2. Découverte Exhaustive des Routes (3 Méthodes)

Le système utilise **3 sources complémentaires** pour garantir la détection de TOUTES les pages:

#### A. 📋 Manifeste Statique (Build-Time) **NOUVEAU!**

**Le plus puissant:** Un script Node.js scanne le dossier `app/` lors du build pour détecter toutes les routes Next.js:

```bash
# Exécuté automatiquement avant chaque build
node scripts/generate-routes.js

# Résultat: public/routes-manifest.json
{
  "generatedAt": "2026-03-15T14:28:35.277Z",
  "total": 335,
  "routes": [
    "/",
    "/auth/admin",
    "/apps/demo-org/dashboard",
    "/apps/demo-org/hr/attendance",
    ...
  ]
}
```

**Avantages:**
- ✅ Détecte **toutes** les routes définies dans `app/`
- ✅ Inclut les routes dynamiques `[slug]` avec exemples
- ✅ Détecte les routes groupées `(group)`
- ✅ Détecte les routes imbriquées
- ✅ Génère 335 routes pour votre application!

**Comment ça marche:**
1. Scan récursif du dossier `app/`
2. Détection des fichiers `page.tsx/js/jsx/ts`
3. Conversion des chemins en routes Next.js
4. Expansion des segments dynamiques `[slug]` avec exemples
5. Filtrage des groupes de routes `(group)`
6. Export en JSON dans `public/`

#### B. 🕷️ Crawling HTML (Runtime)

Pour découvrir les routes dynamiques non détectées:

Pour chaque route seed:
1. Fetch de la page HTML
2. Parsing avec DOMParser
3. Extraction de tous les liens `<a href="...">`
4. Normalisation des URLs
5. Filtrage des patterns à ignorer
6. Ajout à la liste des routes découvertes

**Routes Seed (points de départ):**
```typescript
const SEED_ROUTES = [
  '/',
  '/auth',
  '/core/dashboard',
  '/core/dashboard/organizations',
  '/core/register',
  '/apps',
];
```

#### C. 💾 Cache localStorage

Réutilise les routes découvertes lors des sessions précédentes pour optimiser la découverte.

### 3. Mise en Cache Progressive

Une fois toutes les routes découvertes:

```typescript
for (let i = 0; i < routes.length; i++) {
  const route = routes[i];

  // Fetch pour déclencher le cache du Service Worker
  await fetch(route, {
    method: 'GET',
    cache: 'reload', // Force le SW à intercepter
  });

  // Mise à jour de la progression
  progress.cached++;
  onProgress?.(progress);

  // Délai de 100ms avant la prochaine route
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### 4. Patterns Ignorés

Le système ignore automatiquement:

```typescript
const IGNORE_PATTERNS = [
  /\/api\//,           // API endpoints
  /\/_next\/data\//,   // Next.js data
  /\.json$/,           // JSON files
  /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i, // Assets
  /\/tools\//,         // Tools (PDF, etc.)
  /#/,                 // Anchors
  /\?/,                // Query params
];
```

## Interface Utilisateur

### Indicateur de Progression

L'utilisateur voit un indicateur élégant en bas à droite avec:

```
┌─────────────────────────────────────┐
│ 🔄 Mise en cache des pages...      │
│                                     │
│ Préparation du mode offline        │
│ (25/100)                            │
│                                     │
│ [████████░░░░░░░░] 25%              │
│                                     │
│ 📥 25% téléchargé                  │
│                                     │
│                                [×] │
└─────────────────────────────────────┘
```

Une fois terminé:

```
┌─────────────────────────────────────┐
│ ✅ Pré-cache terminé !             │
│                                     │
│ 98 page(s) disponible(s) hors ligne│
│                                     │
│ 📥 100% téléchargé                 │
│                                     │
│                                [×] │
└─────────────────────────────────────┘
```

### Fonctionnalités UI

- **Auto-démarrage** : Commence automatiquement 5 secondes après le chargement
- **Progression en temps réel** : Affiche le nombre de pages cachées / total
- **Dismissible** : L'utilisateur peut fermer l'indicateur
- **Auto-masquage** : Se cache automatiquement 3 secondes après la fin
- **Persistance** : Se souvient si l'utilisateur l'a fermé (sessionStorage)

## Architecture Technique

### Fichiers Créés

```
scripts/
└── generate-routes.js           # Script de génération du manifeste (build-time)

public/
└── routes-manifest.json         # Manifeste des routes générées (335 routes)

lib/offline/
├── route-discovery.ts           # Système de découverte et cache progressif
└── index.ts                     # Export (updated)

components/ui/
├── cache-progress-indicator.tsx # Composant UI de progression
├── progress.tsx                 # Composant Progress bar (Radix UI)
└── index.ts                     # Export (updated)

components/providers/
└── sw-provider.tsx              # Provider SW (updated)
```

### Types TypeScript

```typescript
export interface CacheProgress {
  total: number;        // Nombre total de routes découvertes
  cached: number;       // Nombre de routes déjà cachées
  failed: number;       // Nombre d'échecs
  inProgress: boolean;  // Cache en cours ou terminé
  routes: string[];     // Liste des routes cachées
}
```

### Stockage Local

Le système utilise localStorage pour persister:

```typescript
// Progression du cache
localStorage.setItem('loura_cache_progress', JSON.stringify(progress));

// Routes découvertes (évite de re-crawler)
localStorage.setItem('loura_discovered_routes', JSON.stringify(routes));

// Préférence utilisateur (dismissal)
sessionStorage.setItem('cache_progress_dismissed', 'true');
```

## Performance

### Métriques (Avec Manifeste Statique)

```
Build-time:
  Génération manifeste: ~1-2 secondes (au build)
  Routes détectées:     335 routes (app Loura)

Runtime:
  Chargement manifeste: ~50-100ms (cache du SW)
  Temps par route:      ~100-300ms (fetch + cache)
  Délai entre routes:   100ms (pour ne pas surcharger)
  Total (335 routes):   ~40-60 secondes (arrière-plan)

Découverte:
  Manifeste:            335 routes instantanées
  Crawling HTML:        ~0-10 routes additionnelles
  Cache localStorage:   Réutilisation entre sessions
  Total unique:         ~335-345 routes
```

### Impact Utilisateur

- **Non-bloquant** : L'utilisateur peut naviguer normalement pendant le cache
- **Progressif** : Pas de pic de charge réseau, étalement sur la durée
- **Intelligent** : Ne cache que les routes uniques et valides
- **Résilient** : Continue même en cas d'erreur sur certaines routes

## Script de Génération de Routes (Build-Time)

### Comment ça marche

Le script `scripts/generate-routes.js` est exécuté automatiquement avant chaque build:

```bash
# Automatiquement via prebuild
pnpm build

# Ou manuellement
pnpm run generate-routes
```

### Algorithme de Détection

```javascript
1. Scanner récursivement app/
2. Pour chaque dossier:
   - Vérifier présence de page.tsx/js
   - Convertir chemin → route Next.js
   - Supprimer groupes (xxx)
   - Détecter segments dynamiques [xxx]
3. Pour chaque segment dynamique:
   - Générer variations avec exemples
   - [slug] → ['demo-org', 'test-org']
   - [id] → ['1', '2', '3']
4. Filtrer les patterns ignorés
5. Sauvegarder en JSON
```

### Exemple de Sortie

```bash
🔍 Scan du dossier app/ pour détecter toutes les routes...

✅ 335 routes détectées et sauvegardées dans routes-manifest.json

📋 Aperçu des routes détectées:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 apps (324 routes)
   /apps/demo-org/dashboard
   /apps/demo-org/hr
   /apps/demo-org/hr/attendance
   ... et 321 autres

📁 auth (3 routes)
   /auth
   /auth/admin
   /auth/employee

📁 core (6 routes)
   /core/dashboard
   /core/dashboard/organizations/create
   ... et 4 autres

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Fichier généré: public/routes-manifest.json
```

### Personnaliser les Exemples de Routes Dynamiques

```javascript
// scripts/generate-routes.js
const DYNAMIC_ROUTE_EXAMPLES = {
  '[slug]': ['demo-org', 'test-org', 'my-company'],
  '[id]': ['1', '2', '3', '4', '5'],
  '[employeeId]': ['1', '2', '3'],
  // Ajouter vos propres exemples
};
```

### Ajouter des Routes Manuelles

```javascript
// scripts/generate-routes.js
const ADDITIONAL_ROUTES = [
  '/custom-route',
  '/another-special-route',
];
```

## Utilisation Développeur

### Ajouter des Routes Seed (Fallback)

Pour améliorer la découverte, ajoutez des routes importantes:

```typescript
// lib/offline/route-discovery.ts
const SEED_ROUTES = [
  // ... routes existantes
  '/ma-nouvelle-section',
  '/ma-nouvelle-section/sous-page',
];
```

### Ignorer des Routes

Pour éviter de cacher certaines routes:

```typescript
// lib/offline/route-discovery.ts
const IGNORE_PATTERNS = [
  // ... patterns existants
  /\/admin\/secret\//,  // Routes admin secrètes
];
```

### Déclencher Manuellement

```typescript
import { precacheAllRoutes } from '@/lib/offline/route-discovery';

// Avec callback de progression
await precacheAllRoutes((progress) => {
  console.log(`${progress.cached}/${progress.total} routes cachées`);
});
```

### Vérifier le Statut

```typescript
import {
  getCacheProgress,
  isPrecacheComplete,
  resetCacheProgress
} from '@/lib/offline/route-discovery';

// Vérifier si le cache est complet
if (isPrecacheComplete()) {
  console.log('Toutes les routes sont cachées!');
}

// Récupérer la progression
const progress = getCacheProgress();
console.log(`${progress?.cached} routes en cache`);

// Réinitialiser (force un nouveau cache)
resetCacheProgress();
```

## Debug & Monitoring

### Console Logs

Le système log toutes les étapes:

```javascript
[RouteDiscovery] 6 routes déjà connues
[RouteDiscovery] 45 routes découvertes
[PrecacheAll] Démarrage du pré-cache progressif...
[PrecacheAll] ✓ /auth/admin (1/45)
[PrecacheAll] ✓ /auth/employee (2/45)
[PrecacheAll] ✗ /broken-page (404)
[PrecacheAll] Terminé ! 42 routes cachées, 3 échecs
```

### Vérifier dans DevTools

**Application → Local Storage**
```
loura_cache_progress: {total: 45, cached: 42, failed: 3, ...}
loura_discovered_routes: ["/", "/auth/admin", ...]
```

**Application → Session Storage**
```
cache_progress_dismissed: "true"
```

**Application → Cache Storage**
```
loura-cache-v1: 42 requests
```

## Intégration avec Service Worker

Le Progressive Caching s'intègre parfaitement avec le Service Worker:

1. **fetch()** déclenche l'interception du SW
2. **cache: 'reload'** force le SW à cacher
3. Le SW utilise sa stratégie **Stale-While-Revalidate**
4. Les routes sont disponibles offline instantanément après

## Scénarios d'Usage

### Scénario 1: Première Installation

```
1. Utilisateur installe l'application PWA
2. Navigation normale pendant 5 secondes
3. Indicateur apparaît: "Mise en cache..."
4. Toutes les pages sont cachées en arrière-plan
5. L'application est 100% fonctionnelle offline
```

### Scénario 2: Mise à Jour de l'Application

```
1. Nouvelle version de l'app déployée
2. Service Worker mis à jour
3. Cache invalidé
4. Progressive caching redémarre automatiquement
5. Nouvelles routes découvertes et cachées
```

### Scénario 3: Connexion Lente

```
1. Utilisateur sur connexion 3G
2. Progressive caching s'adapte automatiquement
3. Fetch timeout après 5 secondes (voir sw.js)
4. Routes qui échouent sont marquées "failed"
5. Retry automatique au prochain démarrage
```

## FAQ

### Le cache démarre-t-il à chaque visite ?

Non, seulement si:
- C'est la première visite
- Le cache n'est pas complet (`isPrecacheComplete() === false`)
- L'utilisateur n'a pas dismissé l'indicateur dans cette session

### Puis-je désactiver le Progressive Caching ?

Oui, retirez simplement `<CacheProgressIndicator />` du ServiceWorkerProvider:

```typescript
// components/providers/sw-provider.tsx
export function ServiceWorkerProvider({ children }) {
  return (
    <>
      {children}
      <ServiceWorkerUpdatePrompt />
      {/* <CacheProgressIndicator /> */}
    </>
  );
}
```

### Combien d'espace disque ça utilise ?

Dépend du nombre de routes:
- ~50-200 KB par route HTML
- ~2-10 MB pour 100 routes typiques
- Les assets (images, fonts) sont déjà cachés par le SW

### Que se passe-t-il si je navigue pendant le cache ?

Rien! Le cache continue en arrière-plan. Si vous visitez une page en cours de cache, vous bénéficiez immédiatement du cache.

### Le cache expire-t-il ?

Non, le cache du Service Worker est persistant. Seuls ces événements l'invalident:
- Mise à jour du Service Worker (nouvelle version)
- Clear cache manuel via clearCache()
- Suppression manuelle dans DevTools
- Dépassement quota navigateur (rare)

## Compatibilité

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Route Discovery | ✅ | ✅ | ✅ | ✅ |
| Progressive Cache | ✅ | ✅ | ✅ | ✅ |
| DOMParser | ✅ | ✅ | ✅ | ✅ |
| localStorage | ✅ | ✅ | ✅ | ✅ |

## Résumé

✅ **Cache automatique** de TOUTES les pages
✅ **Découverte intelligente** via crawling HTML
✅ **Progression visible** pour l'utilisateur
✅ **Non-bloquant** et en arrière-plan
✅ **Persistant** entre les sessions
✅ **Résilient** aux erreurs
✅ **Performant** avec délais optimisés

**Résultat:** Application 100% fonctionnelle offline dès la première visite!

---

**Créé le:** 2026-03-15
**Version:** 1.0.0
**Status:** ✅ Production Ready
