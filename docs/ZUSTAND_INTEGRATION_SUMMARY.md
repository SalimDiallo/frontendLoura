# Résumé de l'intégration Zustand

## Vue d'ensemble

Zustand a été intégré avec succès dans l'application pour gérer l'état global de l'authentification et des permissions. Cette intégration fonctionne de manière transparente avec le système de permissions existant, notamment le composant `Can`.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUX DE DONNÉES                           │
└─────────────────────────────────────────────────────────────────┘

1. Login (Admin ou Employee)
   ↓
2. authService / employeeAuthService
   ↓
3. Met à jour les stores Zustand:
   - useAuthStore (user, userType)
   - usePermissionsStore (permissions, role)
   ↓
4. Persistance automatique dans localStorage
   ↓
5. PermissionProvider lit depuis Zustand
   ↓
6. Composant Can vérifie les permissions
   ↓
7. Affichage conditionnel
```

## Composants installés

### 1. Stores Zustand

**`lib/store/auth-store.ts`**
- Gère l'utilisateur connecté (admin ou employee)
- Persiste dans localStorage (`auth-storage`)
- Contient: user, userType, isAuthenticated, isLoading

**`lib/store/permissions-store.ts`**
- Gère les permissions de l'utilisateur
- Persiste dans localStorage (`permissions-storage`)
- Contient: permissions, role
- Méthodes: hasPermission, hasAnyPermission, hasAllPermissions

**`lib/store/types.ts`**
- Types TypeScript pour les stores
- UserType: 'admin' | 'employee' | null
- User: AdminUser | Employee | null

### 2. Hooks personnalisés

**`lib/hooks/use-auth.ts`**
```typescript
// Hooks disponibles:
useAuth()           // Hook complet
useUser()           // Utilisateur actuel
useUserType()       // Type d'utilisateur
useIsAuthenticated() // Est authentifié
useIsAdmin()        // Est admin
useIsEmployee()     // Est employee
useUserEmail()      // Email
useUserFullName()   // Nom complet
useAuthActions()    // Actions (setUser, clearUser, setLoading)
```

**`lib/hooks/use-permissions.ts`**
```typescript
// Hooks disponibles:
usePermissions()         // Hook complet
usePermissionsData()     // Toutes les permissions
useRole()                // Rôle actuel
useRoleName()            // Nom du rôle
useHasPermission()       // Vérifie une permission
useHasAnyPermission()    // Au moins une permission
useHasAllPermissions()   // Toutes les permissions
usePermissionsActions()  // Actions de permissions
```

### 3. Services intégrés

**`lib/services/core/auth.service.ts`** (Admin)
- ✅ `register()` → Met à jour le store
- ✅ `login()` → Met à jour le store
- ✅ `logout()` → Nettoie le store
- ✅ `getCurrentUser()` → Synchronise le store

**`lib/services/hr/auth.service.ts`** (Employee)
- ✅ `login()` → Met à jour auth + permissions stores
- ✅ `logout()` → Nettoie les deux stores
- ✅ `getCurrentEmployee()` → Synchronise les deux stores

### 4. Composants UI

**`components/apps/common/permission-provider.tsx`**
- ✅ Modifié pour utiliser Zustand au lieu de tokenManager
- ✅ S'abonne aux changements du store automatiquement
- ✅ Rafraîchit les permissions en temps réel

**`components/apps/common/protected-route.tsx`**
- ✅ Composant `Can` fonctionne avec Zustand
- ✅ Aucune modification requise (utilise PermissionProvider)

## Utilisation

### 1. Dans les composants React

```typescript
'use client';

import { useAuth, usePermissions } from '@/lib/hooks';

export function MyComponent() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { hasPermission } = usePermissions();

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div>
      <h1>Bienvenue, {user?.first_name}!</h1>
      {isAdmin && <p>Vous êtes admin</p>}
      {hasPermission('can_view_employee') && <EmployeeList />}
    </div>
  );
}
```

### 2. Avec le composant Can

```typescript
'use client';

import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

export function EmployeeActions({ employee, slug }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
          <DropdownMenuItem asChild>
            <Link href={`/apps/${slug}/hr/employees/${employee.id}`}>
              Voir le profil
            </Link>
          </DropdownMenuItem>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
          <DropdownMenuItem>Modifier</DropdownMenuItem>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES}>
          <DropdownMenuItem className="text-red-600">
            Supprimer
          </DropdownMenuItem>
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 3. Hors composants React

```typescript
import { useAuthStore, usePermissionsStore } from '@/lib/store';

// Dans une fonction utilitaire
export function getCurrentUserEmail(): string | null {
  const user = useAuthStore.getState().user;
  return user?.email || null;
}

export function checkPermission(codename: string): boolean {
  return usePermissionsStore.getState().hasPermission(codename);
}
```

## Permissions communes

Toutes les permissions sont définies dans `COMMON_PERMISSIONS`:

```typescript
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

// Employees
COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES        // employee.view
COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES      // employee.create
COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES      // employee.update
COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES      // employee.delete

// Departments
COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS      // department.view
COMMON_PERMISSIONS.HR.CREATE_DEPARTMENTS    // department.create

// Roles
COMMON_PERMISSIONS.HR.VIEW_ROLES            // role.view
COMMON_PERMISSIONS.HR.CREATE_ROLES          // role.create

// Attendance
COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE       // attendance.view
COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE   // attendance.view_all
COMMON_PERMISSIONS.HR.MANUAL_CHECKIN        // attendance.manual_checkin
COMMON_PERMISSIONS.HR.CREATE_QR_SESSION     // attendance.create_qr_session

// ... et bien d'autres
```

## Synchronisation automatique

### Lors du login

**Admin:**
```typescript
await authService.login({ email, password });
// ✅ useAuthStore.setUser(adminUser, 'admin')
// ✅ Persiste dans localStorage
```

**Employee:**
```typescript
await employeeAuthService.login({ email, password });
// ✅ useAuthStore.setUser(employee, 'employee')
// ✅ usePermissionsStore.setRole(employee.role)
// ✅ usePermissionsStore.setPermissions(employee.all_permissions)
// ✅ Persiste dans localStorage
```

### Lors du logout

```typescript
await authService.logout(); // ou employeeAuthService.logout()
// ✅ useAuthStore.clearUser()
// ✅ usePermissionsStore.clearPermissions() (employee seulement)
// ✅ Nettoie le localStorage
```

### Rafraîchissement des données

```typescript
await authService.getCurrentUser(); // ou getCurrentEmployee()
// ✅ Synchronise automatiquement avec Zustand
// ✅ Met à jour le localStorage
```

## Persistance

Les données sont automatiquement sauvegardées dans le localStorage:

- **`auth-storage`**: { user, userType, isAuthenticated }
- **`permissions-storage`**: { permissions, role }

La persistance est gérée automatiquement par Zustand. Aucune action manuelle requise.

## Compatibilité

### Rétro-compatibilité

Les hooks de permissions (`usePermissions`) sont rétro-compatibles avec l'ancienne API. Vous pouvez migrer progressivement:

**Ancien code:**
```typescript
const [permissions, setPermissions] = useState([]);
```

**Nouveau code:**
```typescript
import { usePermissionsData } from '@/lib/hooks';

const permissions = usePermissionsData();
```

### Format des permissions

Le composant `Can` accepte deux formats:

1. **Format frontend** (recommandé): `employee.view`, `department.create`
2. **Format backend** (pour compatibilité): `can_view_employee`, `can_create_department`

Les deux formats fonctionnent, la conversion est automatique.

## Avantages

✅ **Centralisé**: Un seul endroit pour gérer l'état d'authentification
✅ **Persistant**: Les données survivent au rechargement de la page
✅ **Réactif**: Les composants se mettent à jour automatiquement
✅ **Type-safe**: Support complet de TypeScript
✅ **Performance**: Pas de re-render inutiles grâce aux sélecteurs
✅ **Simple**: API claire et intuitive
✅ **Compatible**: Fonctionne avec le système existant (Can, PermissionProvider)

## Documentation complète

- [Guide Zustand complet](/docs/ZUSTAND_AUTH_USAGE.md)
- [Guide du composant Can](/docs/CAN_COMPONENT_USAGE.md)
- [Exemples d'utilisation Can](/docs/CAN_COMPONENT_EXAMPLE.tsx)

## Notes importantes

1. **Les hooks ne fonctionnent que dans les Client Components**
   - Ajoutez `'use client'` en haut du fichier

2. **Utilisation hors composants**
   - Utilisez `useAuthStore.getState()` pour accéder au store

3. **PermissionProvider requis**
   - Doit être dans le layout de l'organisation pour que `Can` fonctionne

4. **AdminUsers**
   - Ont automatiquement toutes les permissions
   - `isAdmin` est géré par le `userType`

5. **Employees**
   - Les permissions combinent le rôle + custom permissions
   - Stockées dans `all_permissions` depuis le backend

## Dépendances

```json
{
  "zustand": "^4.x.x"
}
```

Déjà installé et configuré dans le projet.
