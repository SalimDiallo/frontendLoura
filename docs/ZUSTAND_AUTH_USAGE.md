# Guide d'utilisation de Zustand pour l'authentification et les permissions

Ce document explique comment utiliser les stores Zustand pour gérer l'authentification et les permissions dans l'application.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stores disponibles](#stores-disponibles)
3. [Hooks personnalisés](#hooks-personnalisés)
4. [Utilisation dans les composants](#utilisation-dans-les-composants)
5. [Gestion des permissions](#gestion-des-permissions)
6. [Exemples pratiques](#exemples-pratiques)

## Vue d'ensemble

L'application utilise **Zustand** pour gérer l'état global de l'authentification et des permissions. Les données sont automatiquement synchronisées avec le `localStorage` pour la persistance.

### Architecture

```
lib/
├── store/
│   ├── types.ts              # Types TypeScript
│   ├── auth-store.ts         # Store d'authentification
│   ├── permissions-store.ts  # Store de permissions
│   └── index.ts              # Exports centralisés
├── hooks/
│   ├── use-auth.ts           # Hooks d'authentification
│   ├── use-permissions.ts    # Hooks de permissions
│   └── index.ts
└── services/
    ├── core/
    │   └── auth.service.ts   # Service auth admin (intégré avec Zustand)
    └── hr/
        └── auth.service.ts   # Service auth employee (intégré avec Zustand)
```

## Stores disponibles

### 1. Auth Store (`useAuthStore`)

Gère l'état de l'utilisateur connecté (admin ou employee).

**État:**
```typescript
{
  user: User | null;              // AdminUser | Employee | null
  userType: UserType | null;      // 'admin' | 'employee' | null
  isAuthenticated: boolean;       // true si connecté
  isLoading: boolean;             // État de chargement
}
```

**Actions:**
```typescript
setUser(user: User, type: UserType): void;  // Définir l'utilisateur
clearUser(): void;                          // Déconnecter
setLoading(loading: boolean): void;         // Gérer le loading
```

**Sélecteurs disponibles:**
```typescript
authSelectors.getUser        // Récupère l'utilisateur
authSelectors.getUserType    // Type d'utilisateur
authSelectors.isAuthenticated // Est authentifié
authSelectors.isAdmin        // Est admin
authSelectors.isEmployee     // Est employee
authSelectors.getEmail       // Email de l'utilisateur
authSelectors.getFullName    // Nom complet
```

### 2. Permissions Store (`usePermissionsStore`)

Gère les permissions de l'utilisateur (principalement pour les employees).

**État:**
```typescript
{
  permissions: Permission[];  // Liste des permissions
  role: Role | null;         // Rôle de l'utilisateur
}
```

**Actions:**
```typescript
setPermissions(permissions: Permission[]): void;  // Définir les permissions
setRole(role: Role): void;                        // Définir le rôle
clearPermissions(): void;                         // Nettoyer les permissions
hasPermission(codename: string): boolean;         // Vérifie une permission
hasAnyPermission(codenames: string[]): boolean;   // Au moins une permission
hasAllPermissions(codenames: string[]): boolean;  // Toutes les permissions
```

**Constants de permissions:**
```typescript
import { PERMISSIONS } from '@/lib/store';

PERMISSIONS.VIEW_EMPLOYEE
PERMISSIONS.ADD_EMPLOYEE
PERMISSIONS.CHANGE_EMPLOYEE
PERMISSIONS.DELETE_EMPLOYEE
PERMISSIONS.VIEW_DEPARTMENT
// ... etc.
```

## Hooks personnalisés

### Hooks d'authentification

```typescript
import {
  useAuth,           // Hook complet
  useUser,           // Utilisateur actuel
  useUserType,       // Type d'utilisateur
  useIsAuthenticated,// Est authentifié
  useIsAdmin,        // Est admin
  useIsEmployee,     // Est employee
  useUserEmail,      // Email
  useUserFullName,   // Nom complet
  useAuthActions,    // Actions (setUser, clearUser, setLoading)
} from '@/lib/hooks';
```

### Hooks de permissions

```typescript
import {
  usePermissions,         // Hook complet
  usePermissionsData,     // Toutes les permissions
  useRole,                // Rôle actuel
  useRoleName,            // Nom du rôle
  useHasPermission,       // Vérifie une permission
  useHasAnyPermission,    // Au moins une permission
  useHasAllPermissions,   // Toutes les permissions
  usePermissionsActions,  // Actions de permissions
} from '@/lib/hooks';
```

## Utilisation dans les composants

### 1. Vérifier si l'utilisateur est connecté

```typescript
'use client';

import { useIsAuthenticated, useUser } from '@/lib/hooks';

export function ProfileButton() {
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  return (
    <div>
      <p>Bienvenue, {user?.first_name}!</p>
    </div>
  );
}
```

### 2. Différencier admin et employee

```typescript
'use client';

import { useIsAdmin, useIsEmployee, useUserType } from '@/lib/hooks';

export function Dashboard() {
  const isAdmin = useIsAdmin();
  const isEmployee = useIsEmployee();
  const userType = useUserType();

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isEmployee) {
    return <EmployeeDashboard />;
  }

  return <GuestView />;
}
```

### 3. Utiliser le hook complet

```typescript
'use client';

import { useAuth } from '@/lib/hooks';

export function UserProfile() {
  const {
    user,
    userType,
    isAuthenticated,
    isAdmin,
    isEmployee,
    email,
    fullName,
    isLoading,
    setUser,
    clearUser,
    setLoading,
  } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div>
      <h1>{fullName}</h1>
      <p>{email}</p>
      <p>Type: {userType}</p>
      <button onClick={clearUser}>Déconnexion</button>
    </div>
  );
}
```

## Gestion des permissions

### 1. Vérifier une permission simple

```typescript
'use client';

import { useHasPermission, PERMISSIONS } from '@/lib/hooks';

export function AddEmployeeButton() {
  const canAdd = useHasPermission(PERMISSIONS.ADD_EMPLOYEE);

  if (!canAdd) {
    return null; // Ou un message
  }

  return <Button onClick={handleAddEmployee}>Ajouter un employé</Button>;
}
```

### 2. Vérifier plusieurs permissions (OU logique)

```typescript
'use client';

import { useHasAnyPermission, PERMISSIONS } from '@/lib/hooks';

export function EmployeeManagement() {
  const canManage = useHasAnyPermission([
    PERMISSIONS.ADD_EMPLOYEE,
    PERMISSIONS.CHANGE_EMPLOYEE,
    PERMISSIONS.DELETE_EMPLOYEE,
  ]);

  if (!canManage) {
    return <AccessDenied />;
  }

  return <EmployeeManagementPanel />;
}
```

### 3. Vérifier plusieurs permissions (ET logique)

```typescript
'use client';

import { useHasAllPermissions, PERMISSIONS } from '@/lib/hooks';

export function AdvancedSettings() {
  const hasFullAccess = useHasAllPermissions([
    PERMISSIONS.VIEW_EMPLOYEE,
    PERMISSIONS.CHANGE_EMPLOYEE,
    PERMISSIONS.VIEW_ROLE,
    PERMISSIONS.CHANGE_ROLE,
  ]);

  if (!hasFullAccess) {
    return <LimitedSettings />;
  }

  return <FullSettings />;
}
```

### 4. Utiliser le hook complet de permissions

```typescript
'use client';

import { usePermissions } from '@/lib/hooks';

export function PermissionsPanel() {
  const {
    permissions,
    role,
    roleName,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    cannot,
  } = usePermissions();

  return (
    <div>
      <h2>Rôle: {roleName}</h2>
      <ul>
        {permissions.map((perm) => (
          <li key={perm.id}>{perm.name}</li>
        ))}
      </ul>

      {can('can_add_employee') && (
        <Button>Ajouter employé</Button>
      )}

      {cannot('can_delete_employee') && (
        <p>Vous ne pouvez pas supprimer des employés</p>
      )}
    </div>
  );
}
```

### 5. Accéder au rôle

```typescript
'use client';

import { useRole, useRoleName } from '@/lib/hooks';

export function RoleBadge() {
  const role = useRole();
  const roleName = useRoleName();

  if (!role) {
    return null;
  }

  return (
    <Badge variant={role.is_admin ? 'destructive' : 'default'}>
      {roleName}
    </Badge>
  );
}
```

## Exemples pratiques

### Exemple 1: Composant de navigation avec permissions

```typescript
'use client';

import { useIsAuthenticated, usePermissions, PERMISSIONS } from '@/lib/hooks';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';

export function AppNavigation() {
  const isAuthenticated = useIsAuthenticated();
  const { hasPermission } = usePermissions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <a href="/dashboard">Tableau de bord</a>
          </SidebarMenuItem>

          {hasPermission(PERMISSIONS.VIEW_EMPLOYEE) && (
            <SidebarMenuItem>
              <a href="/employees">Employés</a>
            </SidebarMenuItem>
          )}

          {hasPermission(PERMISSIONS.VIEW_DEPARTMENT) && (
            <SidebarMenuItem>
              <a href="/departments">Départements</a>
            </SidebarMenuItem>
          )}

          {hasPermission(PERMISSIONS.VIEW_ROLE) && (
            <SidebarMenuItem>
              <a href="/roles">Rôles & Permissions</a>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
```

### Exemple 2: Formulaire avec vérification de permissions

```typescript
'use client';

import { useHasPermission, PERMISSIONS } from '@/lib/hooks';
import { Button } from '@/components/ui';

export function EmployeeForm({ employee, onSubmit }) {
  const canEdit = useHasPermission(PERMISSIONS.CHANGE_EMPLOYEE);
  const canDelete = useHasPermission(PERMISSIONS.DELETE_EMPLOYEE);

  return (
    <form onSubmit={onSubmit}>
      <input
        type="text"
        defaultValue={employee.first_name}
        disabled={!canEdit}
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={!canEdit}>
          Enregistrer
        </Button>

        {canDelete && (
          <Button variant="destructive" onClick={handleDelete}>
            Supprimer
          </Button>
        )}
      </div>
    </form>
  );
}
```

### Exemple 3: Page protégée avec redirection

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useIsEmployee, useHasPermission, PERMISSIONS } from '@/lib/hooks';

export default function EmployeesPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isEmployee = useIsEmployee();
  const canView = useHasPermission(PERMISSIONS.VIEW_EMPLOYEE);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (isEmployee && !canView) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isEmployee, canView, router]);

  if (!isAuthenticated || (isEmployee && !canView)) {
    return <div>Chargement...</div>;
  }

  return <EmployeesPageContent />;
}
```

### Exemple 4: Utilisation directe du store (hors composants)

```typescript
import { useAuthStore, usePermissionsStore } from '@/lib/store';

// Dans une fonction utilitaire ou un service
export function checkUserPermission(codename: string): boolean {
  return usePermissionsStore.getState().hasPermission(codename);
}

export function getCurrentUserEmail(): string | null {
  const user = useAuthStore.getState().user;
  return user?.email || null;
}

export function isUserAdmin(): boolean {
  const userType = useAuthStore.getState().userType;
  return userType === 'admin';
}
```

## Notes importantes

### 1. Synchronisation automatique

Les services d'authentification (`authService` et `employeeAuthService`) mettent automatiquement à jour les stores lors de:
- Login
- Register (admin uniquement)
- Logout
- getCurrentUser / getCurrentEmployee

Vous n'avez **pas besoin** de mettre à jour manuellement les stores après ces opérations.

### 2. Persistance

Les données sont automatiquement sauvegardées dans le `localStorage`:
- `auth-storage`: Contient user, userType, isAuthenticated
- `permissions-storage`: Contient permissions et role

### 3. Hooks vs Store direct

**Utilisez les hooks** dans les composants React:
```typescript
const user = useUser(); // ✅ Bon
```

**Utilisez le store directement** dans les fonctions utilitaires:
```typescript
const user = useAuthStore.getState().user; // ✅ Bon pour les utils
```

### 4. Server Components vs Client Components

Les hooks Zustand ne fonctionnent que dans les **Client Components**. N'oubliez pas d'ajouter `'use client'` en haut de vos fichiers:

```typescript
'use client';

import { useAuth } from '@/lib/hooks';
// ...
```

### 5. Compatibilité

Les hooks de permissions (`usePermissions`) ont été conçus pour être **rétro-compatibles** avec l'ancienne API utilisant `useState`. Vous pouvez migrer progressivement votre code sans tout casser.

## Migration depuis l'ancienne approche

Si vous utilisiez auparavant `localStorage` directement ou des hooks maison, voici comment migrer:

**Avant:**
```typescript
const user = JSON.parse(localStorage.getItem('user') || 'null');
```

**Après:**
```typescript
import { useUser } from '@/lib/hooks';

const user = useUser();
```

**Avant:**
```typescript
const [permissions, setPermissions] = useState([]);
```

**Après:**
```typescript
import { usePermissionsData } from '@/lib/hooks';

const permissions = usePermissionsData();
```

## Utilisation avec le composant `Can`

Le composant `Can` utilise automatiquement Zustand pour vérifier les permissions. Aucune configuration supplémentaire n'est nécessaire!

### Exemple basique

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
          <DropdownMenuItem>
            Modifier
          </DropdownMenuItem>
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

### Fonctionnement automatique

1. **Login** → Met à jour le store Zustand avec les permissions
2. **PermissionProvider** → Lit les permissions depuis Zustand
3. **Composant Can** → Vérifie les permissions automatiquement
4. **Affichage conditionnel** → Basé sur les permissions de l'utilisateur

**Aucune synchronisation manuelle requise!**

Pour plus d'exemples, consultez:
- [Guide complet du composant Can](/docs/CAN_COMPONENT_USAGE.md)
- [Exemples de code](/docs/CAN_COMPONENT_EXAMPLE.tsx)

## Ressources

- [Documentation Zustand](https://github.com/pmndrs/zustand)
- [Guide du composant Can](/docs/CAN_COMPONENT_USAGE.md)
- [Exemples d'utilisation Can](/docs/CAN_COMPONENT_EXAMPLE.tsx)
- [Code source des stores](/lib/store/)
- [Code source des hooks](/lib/hooks/)
- [Services d'authentification](/lib/services/)
