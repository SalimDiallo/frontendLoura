# Système Offline et Cache

## Vue d'ensemble

Le système offline de Loura Frontend permet à l'application de fonctionner sans connexion internet grâce à :

- **IndexedDB** : Base de données locale
- **Cache Manager** : Couche d'abstraction pour le cache
- **Queue de mutations** : File d'attente pour les opérations offline
- **Sync Manager** : Synchronisation au retour online
- **Service Worker** : Cache des assets statiques
- **Data Warmup** : Préchauffage des données

---

## Architecture

```
Component
  ↓
Service
  ↓
Cache Manager ←→ IndexedDB (cache + mutations queue)
  ↓
API Client → Backend
```

### Stratégie offline-first

- **GET** : Cache-first avec fallback réseau
- **POST/PUT/PATCH/DELETE** : Network-first avec queue offline

---

## Cache Manager

### Fichier : `lib/offline/cache-manager.ts`

Couche d'abstraction pour gérer le cache et les mutations offline.

### Méthodes principales

```typescript
class CacheManager {
  // GET avec cache
  async get<T>(endpoint: string, options?: CacheOptions): Promise<T>

  // POST avec queue offline
  async post<T>(endpoint: string, data?: any, options?: MutationOptions): Promise<T>

  // PUT avec queue offline
  async put<T>(endpoint: string, data?: any, options?: MutationOptions): Promise<T>

  // PATCH avec queue offline
  async patch<T>(endpoint: string, data?: any, options?: MutationOptions): Promise<T>

  // DELETE avec queue offline
  async delete<T>(endpoint: string, options?: MutationOptions): Promise<T>

  // Invalidation cache
  async invalidateCache(endpoint: string): Promise<void>
  async invalidateCacheByPrefix(prefix: string): Promise<void>
  async clearAllCache(): Promise<void>
}

// Instance singleton
export const cacheManager = new CacheManager();
```

### Options de cache

```typescript
export interface CacheOptions {
  ttl?: number;                    // Time to live (ms)
  forceRefresh?: boolean;          // Forcer refresh réseau
  skipCache?: boolean;             // Ne pas utiliser le cache
  staleWhileRevalidate?: boolean;  // Retourner cache + rafraîchir en background
}

export interface MutationOptions {
  invalidateCache?: string[];      // Endpoints à invalider
  invalidatePrefixes?: string[];   // Préfixes à invalider
  requiresOnline?: boolean;        // Échouer si offline
}
```

### Flux GET (lecture)

```
1. Vérifier cache IndexedDB
   ↓ (si valide)
   Retourner cache
   
   ↓ (si expiré/absent et online)
2. Requête réseau
   ↓
3. Stocker en cache
   ↓
4. Retourner données

   ↓ (si offline ou erreur réseau)
5. Retourner cache même expiré
   (ou throw si pas de cache)
```

### Flux POST/PUT/PATCH/DELETE (écriture)

```
1. Vérifier connexion
   
   ↓ (si online)
2. Requête réseau
   ↓
3. Invalider cache concerné
   ↓
4. Retourner résultat

   ↓ (si offline)
5. Ajouter à la queue de mutations
   ↓
6. Invalider cache localement
   ↓
7. Retourner réponse optimiste
   
   ↓ (au retour online)
8. Sync Manager rejoue les mutations
```

---

## IndexedDB Manager

### Fichier : `lib/offline/indexeddb.ts`

Gestion de la base de données locale IndexedDB.

### Stores

- **cache** : Réponses API cachées
- **mutations** : Queue de mutations offline

### Méthodes principales

```typescript
class IndexedDBManager {
  // Cache
  async getCache(endpoint: string): Promise<any | null>
  async getCacheRaw(endpoint: string): Promise<any | null>  // Ignore TTL
  async setCache(endpoint: string, data: any, ttl: number): Promise<void>
  async invalidateCacheByEndpoint(endpoint: string): Promise<void>
  async invalidateCacheByPrefix(prefix: string): Promise<void>
  async clearCache(): Promise<void>

  // Mutations queue
  async addMutation(mutation: MutationItem): Promise<void>
  async getMutations(): Promise<MutationItem[]>
  async deleteMutation(id: string): Promise<void>
  async clearMutations(): Promise<void>
}

// Instance singleton
export const indexedDBManager = new IndexedDBManager();
```

### Structure des données

#### Cache entry

```typescript
interface CacheEntry {
  endpoint: string;
  data: any;
  timestamp: number;
  ttl: number;
  expiresAt: number;
  organizationSlug?: string;
}
```

#### Mutation item

```typescript
interface MutationItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
  organizationSlug?: string;
}
```

---

## Sync Manager

### Fichier : `lib/offline/sync-manager.ts`

Gestionnaire de synchronisation des mutations offline.

### Fonctionnalités

- **Détection retour online** : Via `navigator.onLine`
- **Replay des mutations** : Rejoue les mutations en attente
- **Retry automatique** : Réessaie en cas d'échec
- **Cleanup** : Supprime les mutations réussies

### Workflow

```
1. Détection online
   ↓
2. Récupérer mutations en attente
   ↓
3. Pour chaque mutation :
   - Rejouer la mutation
   - Si succès : supprimer de la queue
   - Si échec : incrémenter retries
   - Si max retries atteint : marquer comme failed
   ↓
4. Invalider caches concernés
   ↓
5. Notification utilisateur
```

### Code simplifié

```typescript
export class SyncManager {
  async syncMutations(): Promise<void> {
    const mutations = await indexedDBManager.getMutations();
    
    for (const mutation of mutations) {
      try {
        // Rejouer la mutation
        await apiClient[mutation.method.toLowerCase()](
          mutation.endpoint,
          mutation.data
        );
        
        // Supprimer de la queue
        await indexedDBManager.deleteMutation(mutation.id);
        
      } catch (error) {
        // Incrémenter retries
        mutation.retries++;
        
        if (mutation.retries >= mutation.maxRetries) {
          // Max retries atteint, marquer comme failed
          console.error(`Mutation failed after ${mutation.maxRetries} retries`, mutation);
          await indexedDBManager.deleteMutation(mutation.id);
        }
      }
    }
  }
}

// Instance singleton
export const syncManager = new SyncManager();
```

---

## Data Warmup

### Fichier : `lib/offline/data-warmup.ts`

Système de préchauffage des données pour améliorer l'expérience offline.

### Fonctionnalités

- **Warmup stratégique** : Précharge les données importantes
- **Routes discovery** : Détecte les routes utilisées
- **Dynamic enrichment** : Enrichit les données avec relations
- **Parallel loading** : Chargement parallèle

### Routes à précharger

```typescript
const WARMUP_ROUTES = [
  // Core
  '/core/organizations/',
  '/core/modules/',
  
  // HR
  '/hr/employees/',
  '/hr/departments/',
  '/hr/positions/',
  '/hr/leave-types/',
  '/hr/attendances/today/',
  
  // Inventory
  '/inventory/products/',
  '/inventory/warehouses/',
  '/inventory/categories/',
];
```

### Warmup au login

```typescript
export async function warmupData(organizationSlug: string) {
  console.log('[Warmup] Starting data warmup...');
  
  const promises = WARMUP_ROUTES.map(route => {
    const url = `${route}?organization_subdomain=${organizationSlug}`;
    return cacheManager.get(url, { ttl: 10 * 60 * 1000 });
  });
  
  await Promise.allSettled(promises);
  
  console.log('[Warmup] Data warmup completed');
}
```

---

## Service Worker

### Fichier : `public/sw.js`

Service Worker pour cache des assets statiques et offline fallback.

### Stratégies de cache

#### Network First (API)

```javascript
// Pour les appels API
fetch(request)
  .then(response => {
    cache.put(request, response.clone());
    return response;
  })
  .catch(() => cache.match(request));
```

#### Cache First (Assets)

```javascript
// Pour les assets statiques
cache.match(request)
  .then(response => response || fetch(request));
```

### Precaching

Routes principales précachées :

```javascript
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/_next/static/...',  // Assets Next.js
];
```

---

## Hooks

### useOnlineStatus

Détecte le statut de connexion.

`lib/hooks/useOnlineStatus.ts`

```typescript
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncManager.syncMutations();  // Sync au retour online
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### useSyncStatus

Affiche le statut de synchronisation.

`lib/hooks/useSyncStatus.ts`

```typescript
export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingMutations, setPendingMutations] = useState(0);

  useEffect(() => {
    const updateStatus = async () => {
      const mutations = await indexedDBManager.getMutations();
      setPendingMutations(mutations.length);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return { isSyncing, pendingMutations };
}
```

---

## Composants UI

### OfflineIndicator

Indicateur visuel du statut offline.

`components/ui/offline-indicator.tsx`

```typescript
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { pendingMutations } = useSyncStatus();

  if (isOnline && pendingMutations === 0) return null;

  return (
    <div className="offline-banner">
      {!isOnline && (
        <div className="offline">
          Mode hors ligne - Vos modifications seront synchronisées au retour en ligne
        </div>
      )}
      {pendingMutations > 0 && (
        <div className="syncing">
          Synchronisation en cours... ({pendingMutations} en attente)
        </div>
      )}
    </div>
  );
}
```

### CacheProgressIndicator

Indicateur de progression du cache.

`components/ui/cache-progress-indicator.tsx`

Affiche la progression du warmup des données.

---

## Configuration

### TTL par type de données

```typescript
const CACHE_TTL = {
  // Données statiques (longue durée)
  MODULES: 30 * 60 * 1000,      // 30 minutes
  CATEGORIES: 30 * 60 * 1000,
  
  // Données de référence (durée moyenne)
  EMPLOYEES: 5 * 60 * 1000,     // 5 minutes
  DEPARTMENTS: 5 * 60 * 1000,
  PRODUCTS: 5 * 60 * 1000,
  
  // Données dynamiques (courte durée)
  ATTENDANCES: 1 * 60 * 1000,   // 1 minute
  NOTIFICATIONS: 30 * 1000,     // 30 secondes
  STATS: 2 * 60 * 1000,
};
```

### Gestion multi-tenant

Chaque organisation a son propre cache isolé :

```typescript
interface CacheEntry {
  endpoint: string;
  data: any;
  organizationSlug?: string;  // Filtre par organisation
  timestamp: number;
  ttl: number;
}
```

---

## Bonnes pratiques

### Cache

1. **TTL approprié** : Adapter selon la volatilité des données
2. **Invalidation ciblée** : Invalider uniquement les caches concernés
3. **Stale-while-revalidate** : Pour les données non critiques
4. **Cleanup régulier** : Supprimer les caches expirés

### Mutations offline

1. **UI optimiste** : Mettre à jour l'UI immédiatement
2. **Feedback utilisateur** : Indiquer que la sync est en attente
3. **Retry intelligent** : Limiter le nombre de retries
4. **Gestion des échecs** : Notifier l'utilisateur des échecs

### Performance

1. **Warmup stratégique** : Précharger uniquement les données importantes
2. **Lazy loading** : Charger à la demande
3. **Parallel loading** : Charger en parallèle quand possible
4. **Compression** : IndexedDB compresse automatiquement

---

## Debugging

### Inspection IndexedDB

Chrome DevTools → Application → IndexedDB → loura-cache

### Logs

```typescript
console.log('[Cache] Cache hit for', endpoint);
console.log('[Cache] Cache miss for', endpoint);
console.log('[Offline] POST queued:', endpoint);
console.log('[Sync] Syncing', mutations.length, 'mutations');
```

---

## Références

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Offline First](https://offlinefirst.org/)
- [Cache Strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
