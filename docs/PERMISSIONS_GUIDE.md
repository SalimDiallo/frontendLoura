# Guide de Gestion des Permissions

Ce document explique comment utiliser le système de gestion des permissions dans l'application.

## Vue d'ensemble

Le système de permissions permet de contrôler l'accès aux différentes pages et fonctionnalités de l'application en fonction des rôles et permissions des utilisateurs.

Le système comporte deux niveaux de protection :
1. **OrgAccessGuard** : Vérifie que l'utilisateur est authentifié et membre de l'organisation
2. **ProtectedRoute & Can** : Vérifie les permissions spécifiques au sein de l'organisation

## Architecture

### 1. Types de Permissions (`lib/types/shared/permissions.ts`)

Le système définit les types suivants :

- **ResourceType** : Les types de ressources (EMPLOYEE, DEPARTMENT, ROLE, etc.)
- **PermissionAction** : Les actions possibles (VIEW, CREATE, UPDATE, DELETE, MANAGE, APPROVE, EXPORT)
- **PermissionCheck** : Structure pour vérifier une permission (resource + action)
- **UserPermissionContext** : Contexte de l'utilisateur avec ses permissions

### 2. Guard d'Accès Organisation (`components/apps/common/org-access-guard.tsx`)

Le `OrgAccessGuard` vérifie que :
- L'utilisateur est authentifié
- L'utilisateur est membre de l'organisation (admin ou employé)
- L'organisation est active

Si l'une de ces conditions n'est pas remplie, l'utilisateur voit un message d'erreur avec la possibilité de retourner au dashboard ou de se reconnecter.

### 3. Provider de Permissions (`components/apps/common/permission-provider.tsx`)

Le `PermissionProvider` charge et gère les permissions de l'utilisateur pour l'organisation courante.

Ces deux composants doivent être placés au niveau du layout de l'organisation :

```tsx
// app/apps/(org)/[slug]/layout.tsx
import { OrgAccessGuard, PermissionProvider } from '@/components/apps/common';

export default function OrganizationLayout({ children }: PropsWithChildren) {
  return (
    <OrgAccessGuard organizationSlug={slug}>
      <PermissionProvider organizationSlug={slug}>
        {/* ... */}
        {children}
        {/* ... */}
      </PermissionProvider>
    </OrgAccessGuard>
  );
}
```

### 3. Composants de Protection

#### ProtectedRoute

Protège une route entière en vérifiant les permissions requises :

```tsx
import { ProtectedRoute } from '@/components/apps/common';
import { HR_ROUTE_PERMISSIONS } from '@/lib/config/route-permissions';

export default function EmployeesPage() {
  return (
    <ProtectedRoute config={HR_ROUTE_PERMISSIONS['/hr/employees']}>
      {/* Contenu de la page */}
    </ProtectedRoute>
  );
}
```

#### Can

Affiche conditionnellement du contenu selon les permissions :

```tsx
import { Can } from '@/components/apps/common';
import { ResourceType, PermissionAction } from '@/lib/types/shared';

// Afficher un bouton uniquement si l'utilisateur peut créer des employés
<Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.CREATE}`}>
  <Button>Créer un employé</Button>
</Can>

// Vérifier plusieurs permissions (OR logic)
<Can anyPermission={['employee.create', 'employee.manage']}>
  <Button>Action autorisée</Button>
</Can>

// Vérifier toutes les permissions (AND logic)
<Can allPermissions={['employee.view', 'department.view']}>
  <Button>Action nécessitant toutes les permissions</Button>
</Can>
```

#### Cannot

Inverse de `Can`, affiche le contenu si l'utilisateur N'A PAS la permission :

```tsx
import { Cannot } from '@/components/apps/common';

<Cannot permission="employee.delete">
  <p>Vous ne pouvez pas supprimer d'employés</p>
</Cannot>
```

### 4. Hook usePermissionContext

Pour utiliser les permissions dans la logique de vos composants :

```tsx
import { usePermissionContext } from '@/components/apps/common';

function MyComponent() {
  const { can, cannot, hasPermission } = usePermissionContext();

  const handleAction = () => {
    if (can('employee', 'delete')) {
      // Effectuer l'action
    } else {
      alert("Vous n'avez pas la permission");
    }
  };

  // Ou avec hasPermission directement
  if (hasPermission('employee.create')) {
    // ...
  }

  return (
    <button onClick={handleAction} disabled={cannot('employee', 'delete')}>
      Supprimer
    </button>
  );
}
```

## Configuration des Routes

### Définir les Permissions pour une Route

Ajoutez vos routes dans `lib/config/route-permissions.ts` :

```typescript
export const HR_ROUTE_PERMISSIONS: Record<string, RouteProtectionConfig> = {
  '/hr/employees': {
    requiredPermissions: [
      { resource: ResourceType.EMPLOYEE, action: PermissionAction.VIEW },
    ],
    deniedMessage: "Vous n'avez pas la permission de consulter les employés.",
  },

  '/hr/employees/create': {
    requiredPermissions: [
      { resource: ResourceType.EMPLOYEE, action: PermissionAction.CREATE },
    ],
    deniedMessage: "Vous n'avez pas la permission de créer des employés.",
    redirectTo: '../', // Redirige vers la liste si accès refusé
  },
};
```

### Options de Configuration

```typescript
interface RouteProtectionConfig {
  // Au moins une de ces permissions (OR logic)
  requiredPermissions?: PermissionCheck[];

  // Toutes ces permissions sont requises (AND logic)
  requireAllPermissions?: PermissionCheck[];

  // Fonction custom pour vérifier l'accès
  customCheck?: (context: UserPermissionContext) => boolean;

  // Message d'erreur personnalisé
  deniedMessage?: string;

  // Redirection si accès refusé (sinon affiche le message)
  redirectTo?: string;
}
```

## Codes de Permissions Communs

Les codes de permissions suivent le format `resource.action` :

```typescript
// Exemples de codes
'employee.view'        // Voir les employés
'employee.create'      // Créer des employés
'employee.update'      // Modifier des employés
'employee.delete'      // Supprimer des employés
'employee.manage'      // Gestion complète des employés

'department.view'
'department.create'
'department.update'

'role.view'
'role.create'

'leave_request.view'
'leave_request.create'
'leave_request.approve' // Approuver les demandes

'payroll.view'
'payroll.export'       // Exporter les fiches de paie
```

Les codes communs sont disponibles dans `COMMON_PERMISSIONS` :

```typescript
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

// Utilisation
<Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
  <EmployeeList />
</Can>
```

## Exemple Complet

Voici un exemple complet de page protégée avec gestion des permissions :

```tsx
'use client';

import { ProtectedRoute, Can } from '@/components/apps/common';
import { HR_ROUTE_PERMISSIONS } from '@/lib/config/route-permissions';
import { ResourceType, PermissionAction } from '@/lib/types/shared';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function EmployeesPage() {
  const handleDelete = (id: string) => {
    // Logique de suppression
  };

  return (
    <ProtectedRoute config={HR_ROUTE_PERMISSIONS['/hr/employees']}>
      <div className="space-y-6">
        {/* Header avec bouton création conditionnel */}
        <div className="flex justify-between items-center">
          <h1>Liste des Employés</h1>

          <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.CREATE}`}>
            <Button asChild>
              <Link href="/hr/employees/create">
                Nouvel employé
              </Link>
            </Button>
          </Can>
        </div>

        {/* Liste avec actions conditionnelles */}
        <div className="space-y-2">
          {employees.map((employee) => (
            <div key={employee.id} className="flex gap-2">
              <span>{employee.name}</span>

              <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.UPDATE}`}>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/hr/employees/${employee.id}/edit`}>
                    Modifier
                  </Link>
                </Button>
              </Can>

              <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.DELETE}`}>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(employee.id)}
                >
                  Supprimer
                </Button>
              </Can>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

## TODO : Intégration Backend

Actuellement, les permissions sont mockées dans le `PermissionProvider`. Pour connecter au backend :

1. **Modifier le PermissionProvider** (`components/apps/common/permission-provider.tsx`) :

```typescript
// Remplacer la section TODO par un vrai appel API
const fetchPermissions = async () => {
  try {
    setIsLoading(true);

    // Récupérer les permissions de l'employé pour cette organisation
    const response = await apiClient.get<Employee>(
      `/hr/auth/me/?organization=${slug}`
    );

    const context: UserPermissionContext = {
      userId: user.id,
      organizationId: slug,
      permissions: response.all_permissions || [],
      permissionCodes: response.all_permissions?.map(p => p.code) || [],
      isAdmin: response.role?.code === 'ADMIN',
      isSuperuser: false,
    };

    setPermissionContext(context);
  } catch (err) {
    // ...
  }
};
```

2. **Gérer le cache des permissions** pour éviter les appels multiples

3. **Implémenter le rafraîchissement** des permissions quand nécessaire (changement de rôle, etc.)

## Bonnes Pratiques

1. **Toujours protéger au niveau de la route ET au niveau des actions** :
   - Route entière avec `ProtectedRoute`
   - Boutons/actions individuels avec `Can`

2. **Préférer les permissions granulaires** :
   - Utiliser `employee.update` plutôt que `employee.manage`
   - Permet un contrôle plus fin

3. **Fournir des messages d'erreur clairs** :
   - Toujours définir `deniedMessage` dans la config
   - Aide l'utilisateur à comprendre pourquoi l'accès est refusé

4. **Gérer les redirections intelligemment** :
   - Redirections pour les pages de création/modification
   - Messages d'erreur pour les pages de liste

5. **Tester tous les scénarios de permissions** :
   - Avec et sans permissions
   - Avec différents rôles
   - Navigation directe via URL

## Debugging

Pour déboguer les permissions :

```tsx
import { usePermissionContext } from '@/components/apps/common';

function DebugPermissions() {
  const { permissionContext } = usePermissionContext();

  return (
    <pre className="text-xs">
      {JSON.stringify(permissionContext, null, 2)}
    </pre>
  );
}
```

## Support et Questions

Pour toute question sur le système de permissions, consultez :

- Types : `lib/types/shared/permissions.ts`
- Provider : `components/apps/common/permission-provider.tsx`
- Composants : `components/apps/common/protected-route.tsx`
- Config routes : `lib/config/route-permissions.ts`
- Exemple : `app/apps/(org)/[slug]/hr/employees/page.tsx`
