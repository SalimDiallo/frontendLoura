# Système de Cache et Mode Offline

Ce document décrit le système de cache et de gestion offline implémenté dans l'application Loura.

## Vue d'ensemble

Le système permet à l'application de :
- **Fonctionner en mode offline** : Les utilisateurs peuvent continuer à travailler sans connexion internet
- **Réduire les appels API** : Cache intelligent avec TTL configurable
- **Synchronisation automatique** : Les modifications offline sont automatiquement synchronisées quand la connexion revient
- **UI réactive** : Indicateur visuel de l'état de connexion et de synchronisation

## Architecture

### Composants principaux

```
lib/offline/
├── indexeddb.ts          # Gestion du stockage IndexedDB
├── cache-manager.ts      # Couche de cache pour les requêtes API
├── sync-manager.ts       # Synchronisation des mutations offline
└── index.ts              # Exports

lib/hooks/
├── useOnlineStatus.ts    # Hook pour détecter online/offline
├── useSyncStatus.ts      # Hook pour monitorer la synchronisation
└── index.ts              # Exports

components/ui/
└── offline-indicator.tsx # Indicateur UI pour l'état offline/online
```

### Flux de données

```
Component
    ↓
Service (avec cache)
    ↓
CacheManager
    ↓ (si cache miss ou mutation)
ApiClient → Backend
    ↓
IndexedDB (cache + queue mutations)
```

## Utilisation

### 1. Utiliser le cache dans un service

#### Exemple : Organization Service avec cache

```typescript
import { cacheManager } from '@/lib/offline';
import { API_ENDPOINTS } from '@/lib/api/config';

// GET avec cache
async getAll(): Promise<Organization[]> {
  const response = await cacheManager.get<{ results: Organization[] }>(
    API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
    {
      ttl: 5 * 60 * 1000,    // 5 minutes
      forceRefresh: false,    // Optional: force network fetch
    }
  );
  return response.results || [];
}

// POST avec invalidation cache
async create(data: OrganizationCreateData): Promise<Organization> {
  return cacheManager.post<Organization>(
    API_ENDPOINTS.CORE.ORGANIZATIONS.CREATE,
    data,
    {
      invalidateCache: [
        API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
      ],
    }
  );
}

// PATCH avec invalidation cache
async update(id: string, data: Partial<Organization>): Promise<Organization> {
  return cacheManager.patch<Organization>(
    API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE(id),
    data,
    {
      invalidateCache: [
        API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
        API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
      ],
    }
  );
}
```

### 2. Monitorer l'état de connexion

```typescript
import { useOnlineStatus } from '@/lib/hooks';

function MyComponent() {
  const { isOnline, wasOffline } = useOnlineStatus();

  return (
    <div>
      {!isOnline && <p>Mode hors ligne</p>}
      {wasOffline && <p>Connexion rétablie !</p>}
    </div>
  );
}
```

### 3. Monitorer la synchronisation

```typescript
import { useSyncStatus } from '@/lib/hooks';

function MyComponent() {
  const {
    status,           // 'idle' | 'syncing' | 'success' | 'error'
    pendingCount,     // Nombre de mutations en attente
    progress,         // Progression 0-100
    forceSync,        // Fonction pour forcer la sync
  } = useSyncStatus();

  return (
    <div>
      <p>État: {status}</p>
      {pendingCount > 0 && (
        <>
          <p>{pendingCount} modification(s) en attente</p>
          <button onClick={forceSync}>Synchroniser maintenant</button>
        </>
      )}
    </div>
  );
}
```

### 4. Afficher l'indicateur offline

```typescript
import { OfflineIndicator } from '@/components/ui';

function Layout() {
  return (
    <div>
      <OfflineIndicator />
      {/* Reste du layout */}
    </div>
  );
}
```

## Configuration

### TTL du cache

Le TTL (Time To Live) détermine combien de temps les données restent en cache :

```typescript
// TTL par défaut : 5 minutes
const data = await cacheManager.get(endpoint);

// TTL personnalisé : 10 minutes
const data = await cacheManager.get(endpoint, { ttl: 10 * 60 * 1000 });

// Modifier le TTL global
cacheManager.setDefaultTTL(10 * 60 * 1000);
```

### Stratégies de cache

#### Cache-first (GET requests)
```typescript
// 1. Essaie le cache d'abord
// 2. Si cache miss, fait la requête réseau
// 3. Stocke la réponse dans le cache
await cacheManager.get(endpoint, { ttl: 5 * 60 * 1000 });
```

#### Network-first avec queue offline (mutations)
```typescript
// 1. Si online: fait la requête réseau
// 2. Si offline: met en queue pour sync ultérieure
// 3. Invalide le cache après succès
await cacheManager.post(endpoint, data, {
  invalidateCache: [relatedEndpoint],
});
```

### Options de requêtes

#### CacheOptions (GET)
```typescript
interface CacheOptions {
  ttl?: number;           // Time to live en ms (défaut: 5 min)
  forceRefresh?: boolean; // Force network fetch
  skipCache?: boolean;    // Ne pas utiliser le cache
}
```

#### MutationOptions (POST/PUT/PATCH/DELETE)
```typescript
interface MutationOptions {
  invalidateCache?: string[];  // Endpoints à invalider
  requiresOnline?: boolean;    // Échoue si offline
}
```

## Gestion des erreurs

### Requête offline
```typescript
try {
  await cacheManager.post(endpoint, data);
} catch (error) {
  if (error instanceof ApiError && error.status === 0) {
    // Requête mise en queue, notification à l'utilisateur
    toast.info('Modification enregistrée. Sera synchronisée à la reconnexion.');
  }
}
```

### Action nécessitant une connexion
```typescript
// Certaines actions critiques peuvent exiger une connexion
await cacheManager.post(endpoint, data, {
  requiresOnline: true,  // Échouera immédiatement si offline
});
```

## Synchronisation

### Automatique
La synchronisation se déclenche automatiquement :
- Quand la connexion est rétablie
- Dès que `window.navigator.onLine` passe à `true`

### Manuelle
```typescript
import { syncManager } from '@/lib/offline';

// Forcer une synchronisation
await syncManager.forceSync();

// Récupérer l'état actuel
const state = syncManager.getState();

// Compter les mutations en attente
const count = await syncManager.getPendingCount();
```

### Retries
Les mutations échouées sont automatiquement retentées :
- Maximum 3 tentatives par défaut
- Délai exponentiel entre les retries
- Suppression automatique après max retries

## Maintenance

### Vider le cache
```typescript
import { cacheManager } from '@/lib/offline';

// Vider tout le cache
await cacheManager.clearAllCache();

// Invalider un endpoint spécifique
await cacheManager.invalidateCache('/core/organizations/');
```

### Vider la queue de mutations
```typescript
import { indexedDBManager } from '@/lib/offline';

// Supprimer toutes les mutations en attente
await indexedDBManager.clearMutations();
```

## Debugging

### Logs console
Le système log automatiquement dans la console :
```
[Cache] Hit pour /core/organizations/
[Cache] Miss pour /hr/employees/, fetch réseau...
[Offline] POST mis en queue: /core/organizations/create/
[Sync] Connexion rétablie, démarrage de la synchronisation...
[Sync] 3 mutation(s) à synchroniser
[Sync] Mutation abc-123 synchronisée avec succès
```

### Inspecter IndexedDB
1. Ouvrir DevTools
2. Application → Storage → IndexedDB → loura_offline_db
3. Tables :
   - `cache` : Données en cache
   - `mutations` : Queue des mutations

## Migration d'un service existant

### Avant (sans cache)
```typescript
import { apiClient } from '@/lib/api/client';

async getAll(): Promise<Organization[]> {
  const response = await apiClient.get<{ results: Organization[] }>(
    '/core/organizations/'
  );
  return response.results || [];
}
```

### Après (avec cache)
```typescript
import { cacheManager } from '@/lib/offline';

async getAll(): Promise<Organization[]> {
  const response = await cacheManager.get<{ results: Organization[] }>(
    '/core/organizations/',
    { ttl: 5 * 60 * 1000 }
  );
  return response.results || [];
}
```

## Bonnes pratiques

1. **TTL adapté au type de données**
   - Données statiques : 30 min - 1h
   - Données fréquemment modifiées : 1-5 min
   - Données temps réel : pas de cache

2. **Invalidation proactive**
   ```typescript
   // Toujours invalider les caches liés après une mutation
   await cacheManager.post(endpoint, data, {
     invalidateCache: [listEndpoint, detailEndpoint],
   });
   ```

3. **Gestion optimiste de l'UI**
   ```typescript
   // Optimistic update
   updateLocalState(newData);

   try {
     await cacheManager.patch(endpoint, newData);
   } catch {
     // Rollback si échec
     revertLocalState();
   }
   ```

4. **Actions critiques en ligne uniquement**
   ```typescript
   // Paiements, suppressions définitives, etc.
   await cacheManager.delete(endpoint, {
     requiresOnline: true,
   });
   ```

## Limitations

- **Taille maximale** : IndexedDB limite dépend du navigateur (~50MB minimum)
- **Conflits** : Pas de résolution automatique des conflits (FIFO)
- **FormData/Files** : Upload de fichiers nécessite une connexion
- **WebSockets** : Pas de cache pour les connexions temps réel

## Performance

- **Cache hit** : ~1-5ms (lecture IndexedDB)
- **Cache miss** : Temps réseau + ~5-10ms (écriture cache)
- **Sync** : ~100-500ms par mutation

## Sécurité

- Les tokens JWT sont stockés dans localStorage (pas dans IndexedDB)
- Les données sensibles peuvent être exclues du cache
- La synchronisation respecte les permissions utilisateur
