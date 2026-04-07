# Guide de Démarrage Rapide - Mode Offline

## Installation

Le système est déjà installé et configuré ! Aucune dépendance externe n'est nécessaire.

## Utilisation en 3 étapes

### 1. Migrer un service vers le cache

**Avant:**
```typescript
// lib/services/mymodule/myservice.ts
import { apiClient } from '@/lib/api/client';

export const myService = {
  async getAll() {
    return apiClient.get('/api/endpoint/');
  },

  async create(data) {
    return apiClient.post('/api/endpoint/', data);
  }
};
```

**Après:**
```typescript
// lib/services/mymodule/myservice.ts
import { cacheManager } from '@/lib/offline';

export const myService = {
  async getAll() {
    return cacheManager.get('/api/endpoint/', {
      ttl: 5 * 60 * 1000  // 5 minutes
    });
  },

  async create(data) {
    return cacheManager.post('/api/endpoint/', data, {
      invalidateCache: ['/api/endpoint/']  // Invalide le cache de la liste
    });
  }
};
```

### 2. Afficher l'indicateur offline

Le composant `<OfflineIndicator />` est déjà intégré dans la sidebar (`components/core/app-sidebar.tsx`).

Pour l'ajouter ailleurs:
```typescript
import { OfflineIndicator } from '@/components/ui';

function MyLayout() {
  return (
    <div>
      <OfflineIndicator />
      {/* Votre contenu */}
    </div>
  );
}
```

### 3. Réagir aux changements de connexion (optionnel)

```typescript
import { useOnlineStatus, useSyncStatus } from '@/lib/hooks';

function MyComponent() {
  const { isOnline } = useOnlineStatus();
  const { pendingCount, forceSync } = useSyncStatus();

  return (
    <div>
      {!isOnline && (
        <Alert variant="warning">
          Mode hors ligne - {pendingCount} modifications en attente
        </Alert>
      )}

      {isOnline && pendingCount > 0 && (
        <Button onClick={forceSync}>
          Synchroniser maintenant
        </Button>
      )}
    </div>
  );
}
```

## Test du mode offline

### En développement

1. Ouvrir DevTools (F12)
2. Network tab → Throttling → Offline
3. L'application continue de fonctionner avec les données en cache
4. Les modifications sont mises en queue
5. Repasser Online → Synchronisation automatique

### Inspecter les données

**Console:**
```
[Cache] Hit pour /core/organizations/
[Offline] POST mis en queue: /core/organizations/create/
[Sync] 3 mutation(s) à synchroniser
```

**IndexedDB (DevTools → Application → IndexedDB → loura_offline_db):**
- `cache` : Voir les données en cache
- `mutations` : Voir la queue de synchronisation

## Exemples prêts à l'emploi

### Service avec cache (exemple complet)
Voir : `lib/services/core/organization-cached.service.ts`

### Hook de détection online/offline
```typescript
const { isOnline, wasOffline } = useOnlineStatus();
```

### Hook de monitoring de synchronisation
```typescript
const { status, pendingCount, progress, forceSync } = useSyncStatus();
```

## Configuration recommandée par type de données

| Type de données | TTL recommandé | Exemple |
|----------------|----------------|---------|
| Utilisateur connecté | 10 min | `useCurrentUser()` |
| Liste d'organisations | 2-5 min | `getOrganizations()` |
| Détails d'une entité | 5-10 min | `getOrganization(id)` |
| Statistiques/Dashboard | 1-2 min | `getStats()` |
| Catalogue produits | 10-30 min | `getProducts()` |
| Configuration système | 30-60 min | `getSettings()` |

## Synchronisation

La synchronisation est **automatique** dès que la connexion revient.

Pour forcer manuellement:
```typescript
import { syncManager } from '@/lib/offline';

await syncManager.forceSync();
```

## Actions critiques (paiements, suppressions)

Pour des actions qui nécessitent impérativement une connexion:
```typescript
await cacheManager.delete('/endpoint/', {
  requiresOnline: true  // Échouera si offline
});
```

## Invalidation du cache

```typescript
// Invalider un endpoint spécifique
await cacheManager.invalidateCache('/core/organizations/');

// Vider tout le cache
await cacheManager.clearAllCache();
```

## Documentation complète

Voir `OFFLINE.md` pour la documentation détaillée.

## Support

- Issues : [GitHub Issues](https://github.com/votre-repo/issues)
- Documentation : `OFFLINE.md`
- Exemples : `lib/services/core/organization-cached.service.ts`
