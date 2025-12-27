# Guide d'utilisation du composant `Can`

Le composant `Can` permet d'afficher conditionnellement du contenu basé sur les permissions de l'utilisateur. Il utilise automatiquement Zustand pour récupérer les permissions.

## Table des matières

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Utilisation basique](#utilisation-basique)
4. [Permissions communes](#permissions-communes)
5. [Exemples avancés](#exemples-avancés)
6. [API du composant](#api-du-composant)

## Installation

Le composant `Can` est déjà configuré et utilise le store Zustand pour les permissions. Aucune installation supplémentaire n'est nécessaire.

## Configuration

### 1. Provider de permissions

Le `PermissionProvider` doit être placé dans votre layout d'organisation. Il charge automatiquement les permissions depuis le store Zustand.

```typescript
// app/apps/(org)/[slug]/layout.tsx
import { PermissionProvider } from '@/components/apps/common/permission-provider';

export default function OrgLayout({ children }) {
  return (
    <PermissionProvider>
      {children}
    </PermissionProvider>
  );
}
```

### 2. Synchronisation automatique

Les permissions sont automatiquement synchronisées avec Zustand lors de:
- Login (admin ou employee)
- Refresh du token
- Récupération des données utilisateur (`getCurrentUser` / `getCurrentEmployee`)

**Aucune action manuelle n'est requise!**

## Utilisation basique

### 1. Permission unique

```typescript
'use client';

import { Can } from '@/components/apps/common/protected-route';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

export function EmployeeList() {
  return (
    <div>
      <h1>Liste des employés</h1>

      <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
        <EmployeeTable />
      </Can>

      <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
        <Button onClick={handleCreate}>Ajouter un employé</Button>
      </Can>
    </div>
  );
}
```

### 2. Au moins une permission (OR logic)

```typescript
<Can anyPermissions={[
  COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
  COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES
]}>
  <EmployeeManagementPanel />
</Can>
```

### 3. Toutes les permissions (AND logic)

```typescript
<Can allPermissions={[
  COMMON_PERMISSIONS.HR.VIEW_ROLES,
  COMMON_PERMISSIONS.HR.UPDATE_ROLES
]}>
  <RoleEditForm />
</Can>
```

### 4. Admin seulement

```typescript
<Can adminOnly>
  <AdminSettings />
</Can>
```

## Permissions communes

Les permissions sont définies dans `COMMON_PERMISSIONS` avec le format `resource.action`:

```typescript
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

// Employees
COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES        // employee.view
COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES      // employee.create
COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES      // employee.update
COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES      // employee.delete
COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEES      // employee.manage
COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEE_PERMISSIONS // employee.manage_permissions

// Departments
COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS      // department.view
COMMON_PERMISSIONS.HR.CREATE_DEPARTMENTS    // department.create
COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS    // department.update
COMMON_PERMISSIONS.HR.DELETE_DEPARTMENTS    // department.delete

// Roles
COMMON_PERMISSIONS.HR.VIEW_ROLES            // role.view
COMMON_PERMISSIONS.HR.CREATE_ROLES          // role.create
COMMON_PERMISSIONS.HR.UPDATE_ROLES          // role.update
COMMON_PERMISSIONS.HR.DELETE_ROLES          // role.delete

// Attendance
COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE       // attendance.view
COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE   // attendance.view_all
COMMON_PERMISSIONS.HR.CREATE_ATTENDANCE     // attendance.create
COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE     // attendance.update
COMMON_PERMISSIONS.HR.DELETE_ATTENDANCE     // attendance.delete
COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE    // attendance.approve
COMMON_PERMISSIONS.HR.MANUAL_CHECKIN        // attendance.manual_checkin
COMMON_PERMISSIONS.HR.CREATE_QR_SESSION     // attendance.create_qr_session

// Leave Requests
COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS   // leave_request.view
COMMON_PERMISSIONS.HR.CREATE_LEAVE_REQUESTS // leave_request.create
COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS // leave_request.approve

// Payroll
COMMON_PERMISSIONS.HR.VIEW_PAYROLL          // payroll.view
COMMON_PERMISSIONS.HR.CREATE_PAYROLL        // payroll.create
COMMON_PERMISSIONS.HR.UPDATE_PAYROLL        // payroll.update
COMMON_PERMISSIONS.HR.EXPORT_PAYROLL        // payroll.export
```

## Exemples avancés

### 1. Dropdown menu avec permissions

```typescript
'use client';

import { Can } from '@/components/apps/common/protected-route';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HiOutlineEye, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';
import Link from 'next/link';

export function EmployeeActions({ employee, slug }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">Actions</Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
          <DropdownMenuItem asChild>
            <Link href={`/apps/${slug}/hr/employees/${employee.id}`}>
              <HiOutlineEye className="size-4 mr-2" />
              Voir le profil
            </Link>
          </DropdownMenuItem>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
          <DropdownMenuItem asChild>
            <Link href={`/apps/${slug}/hr/employees/${employee.id}/edit`}>
              <HiOutlinePencil className="size-4 mr-2" />
              Modifier
            </Link>
          </DropdownMenuItem>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES}>
          <DropdownMenuItem
            onClick={() => handleDelete(employee.id)}
            className="text-red-600"
          >
            <HiOutlineTrash className="size-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 2. Tableau avec actions conditionnelles

```typescript
'use client';

import { Can } from '@/components/apps/common/protected-route';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';

export function EmployeeTable({ employees }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Nom</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Département</TableCell>
          <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
            <TableCell>Actions</TableCell>
          </Can>
        </TableRow>
      </TableHead>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>{employee.full_name}</TableCell>
            <TableCell>{employee.email}</TableCell>
            <TableCell>{employee.department_name}</TableCell>
            <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
              <TableCell>
                <Button size="sm">Modifier</Button>
              </TableCell>
            </Can>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 3. Formulaire avec permissions granulaires

```typescript
'use client';

import { Can } from '@/components/apps/common/protected-route';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';
import { Input, Button } from '@/components/ui';

export function EmployeeForm({ employee, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
          <Input
            label="Prénom"
            name="first_name"
            defaultValue={employee?.first_name}
          />
          <Input
            label="Nom"
            name="last_name"
            defaultValue={employee?.last_name}
          />
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEE_COMPENSATION}>
          <Input
            label="Salaire"
            name="salary"
            type="number"
            defaultValue={employee?.salary}
          />
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEE_PERMISSIONS}>
          <div>
            <h3>Permissions personnalisées</h3>
            <PermissionSelector />
          </div>
        </Can>
      </div>

      <div className="mt-6 flex gap-2">
        <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
          <Button type="submit">Enregistrer</Button>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES}>
          <Button variant="destructive" onClick={handleDelete}>
            Supprimer
          </Button>
        </Can>
      </div>
    </form>
  );
}
```

### 4. Navigation avec permissions

```typescript
'use client';

import { Can } from '@/components/apps/common/protected-route';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';
import { SidebarGroup, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import Link from 'next/link';

export function HRNavigation({ slug }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
          <SidebarMenuItem>
            <Link href={`/apps/${slug}/hr/employees`}>
              Employés
            </Link>
          </SidebarMenuItem>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS}>
          <SidebarMenuItem>
            <Link href={`/apps/${slug}/hr/departments`}>
              Départements
            </Link>
          </SidebarMenuItem>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES}>
          <SidebarMenuItem>
            <Link href={`/apps/${slug}/hr/roles`}>
              Rôles & Permissions
            </Link>
          </SidebarMenuItem>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE}>
          <SidebarMenuItem>
            <Link href={`/apps/${slug}/hr/attendance`}>
              Présence
            </Link>
          </SidebarMenuItem>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS}>
          <SidebarMenuItem>
            <Link href={`/apps/${slug}/hr/leaves`}>
              Congés
            </Link>
          </SidebarMenuItem>
        </Can>

        <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
          <SidebarMenuItem>
            <Link href={`/apps/${slug}/hr/payroll`}>
              Paie
            </Link>
          </SidebarMenuItem>
        </Can>
      </SidebarMenu>
    </SidebarGroup>
  );
}
```

### 5. Page avec message d'accès refusé

```typescript
'use client';

import { Can } from '@/components/apps/common/protected-route';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

export default function RolesPage() {
  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES} showMessage={true}>
      <div>
        <h1>Rôles et Permissions</h1>
        <RolesList />
      </div>
    </Can>
  );
}
```

### 6. Fallback personnalisé

```typescript
'use client';

import { Can } from '@/components/apps/common/protected-route';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';
import { Alert } from '@/components/ui/alert';

export function PayrollSection() {
  return (
    <Can
      permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}
      fallback={
        <Alert variant="warning">
          Vous n'avez pas accès aux informations de paie.
          Contactez votre administrateur pour obtenir les permissions nécessaires.
        </Alert>
      }
    >
      <PayrollDashboard />
    </Can>
  );
}
```

### 7. Permissions multiples complexes

```typescript
'use client';

import { Can } from '@/components/apps/common/protected-route';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

export function AttendanceManagement() {
  return (
    <div className="space-y-6">
      {/* Au moins une permission de visualisation */}
      <Can anyPermissions={[
        COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE,
        COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE
      ]}>
        <AttendanceList />
      </Can>

      {/* Toutes ces permissions pour créer une session QR */}
      <Can allPermissions={[
        COMMON_PERMISSIONS.HR.CREATE_ATTENDANCE,
        COMMON_PERMISSIONS.HR.CREATE_QR_SESSION
      ]}>
        <CreateQRSessionButton />
      </Can>

      {/* Check-in manuel (permission spécifique) */}
      <Can permission={COMMON_PERMISSIONS.HR.MANUAL_CHECKIN}>
        <ManualCheckInForm />
      </Can>

      {/* Approbation (nécessite plusieurs permissions) */}
      <Can allPermissions={[
        COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE,
        COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE
      ]}>
        <AttendanceApprovalPanel />
      </Can>
    </div>
  );
}
```

## API du composant

### Props du composant `Can`

```typescript
interface CanProps {
  /**
   * Permission unique à vérifier (format: "resource.action")
   * Exemple: "employee.view", "department.create"
   * Supporte aussi le format backend: "can_view_employee"
   */
  permission?: string;

  /**
   * Au moins une de ces permissions doit être présente (OR logic)
   * Exemple: ["employee.view", "employee.update"]
   */
  anyPermissions?: string[];

  /**
   * Toutes ces permissions doivent être présentes (AND logic)
   * Exemple: ["employee.view", "department.view"]
   */
  allPermissions?: string[];

  /**
   * Afficher uniquement pour les administrateurs
   */
  adminOnly?: boolean;

  /**
   * Contenu à afficher si la permission n'est pas accordée
   */
  fallback?: React.ReactNode;

  /**
   * Afficher un message d'erreur si accès refusé
   */
  showMessage?: boolean;

  /**
   * Enfants à afficher si la permission est accordée
   */
  children: React.ReactNode;
}
```

### Format des permissions

Le composant `Can` accepte deux formats de permissions:

1. **Format frontend** (recommandé): `resource.action`
   - Exemple: `employee.view`, `department.create`, `attendance.approve`

2. **Format backend** (pour compatibilité): `can_{action}_{resource}`
   - Exemple: `can_view_employee`, `can_create_department`
   - Automatiquement converti en format frontend

### Conversion automatique

Le composant convertit automatiquement les permissions backend vers frontend:

```typescript
// Ces deux syntaxes sont équivalentes:
<Can permission="employee.view">...</Can>
<Can permission="can_view_employee">...</Can>
```

## Bonnes pratiques

### 1. Utiliser les constantes

Toujours utiliser `COMMON_PERMISSIONS` plutôt que des strings brutes:

```typescript
// ✅ Bon
<Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>

// ❌ Éviter
<Can permission="employee.view">
```

### 2. Granularité des permissions

Placez le `Can` au bon niveau de granularité:

```typescript
// ✅ Bon - Permission à l'élément spécifique
<div>
  <h1>Liste</h1>
  <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
    <Button>Ajouter</Button>
  </Can>
</div>

// ❌ Éviter - Trop large si on veut juste masquer le bouton
<Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
  <div>
    <h1>Liste</h1>
    <Button>Ajouter</Button>
  </div>
</Can>
```

### 3. Messages clairs

Utilisez `showMessage` ou `fallback` pour expliquer pourquoi l'accès est refusé:

```typescript
<Can
  permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}
  fallback={
    <Alert>
      Accès limité. Contactez votre manager pour voir les informations de paie.
    </Alert>
  }
>
  <PayrollDetails />
</Can>
```

### 4. Typage strict

Importez toujours les types:

```typescript
import { COMMON_PERMISSIONS } from '@/lib/types/shared';
import type { PermissionCheck } from '@/lib/types/shared';
```

## Dépannage

### Les permissions ne se chargent pas

1. Vérifiez que le `PermissionProvider` est bien dans le layout
2. Vérifiez que l'utilisateur est connecté (Zustand `useAuthStore`)
3. Vérifiez que les permissions sont dans le store (`usePermissionsStore`)

```typescript
// Debug
import { usePermissionsStore } from '@/lib/store';

const permissions = usePermissionsStore((state) => state.permissions);
console.log('Permissions:', permissions);
```

### Le composant ne réagit pas aux changements

Le `PermissionProvider` s'abonne automatiquement aux changements du store Zustand. Si les permissions ne se mettent pas à jour:

1. Vérifiez que le login met bien à jour le store
2. Vérifiez la console pour les erreurs

### Les AdminUsers n'ont pas accès

Les AdminUsers ont automatiquement toutes les permissions. Si un admin n'a pas accès:

1. Vérifiez que `userType === 'admin'` dans le store
2. Vérifiez le `PermissionProvider` (ligne 165-194 de `permission-provider.tsx`)

## Ressources

- [Code source du composant Can](/components/apps/common/protected-route.tsx)
- [PermissionProvider](/components/apps/common/permission-provider.tsx)
- [Types de permissions](/lib/types/shared/permissions.ts)
- [Guide Zustand](/docs/ZUSTAND_AUTH_USAGE.md)
