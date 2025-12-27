# Migration de PermissionGate vers Can

## Résumé

Le composant `PermissionGate` a été remplacé par le composant `Can` pour une meilleure cohérence et fonctionnalités améliorées.

## Changements effectués

### 1. Améliorations du composant `Can`

Le composant `Can` a été amélioré avec les fonctionnalités suivantes :

- **Normalisation automatique des permissions** : Supporte à la fois le format backend (`can_view_employee`) et frontend (`employee.view`)
- **Support `adminOnly`** : Permet de restreindre l'accès aux administrateurs uniquement
- **Support `showMessage`** : Affiche un message d'erreur stylisé lorsque l'accès est refusé
- **Meilleure gestion des permissions** :
  - `permission` : Permission unique
  - `anyPermissions` : Au moins une des permissions (OR logic)
  - `allPermissions` : Toutes les permissions requises (AND logic)

### 2. Fichiers supprimés

- `components/common/PermissionGate.tsx` - Composant obsolète supprimé

### 3. Fichiers mis à jour

- `components/apps/common/protected-route.tsx` - Composant `Can` amélioré
- `components/common/index.ts` - Export de `PermissionGate` supprimé
- `app/apps/(org)/[slug]/hr/attendance/page.tsx` - Migration vers `Can`
- `app/apps/(org)/[slug]/hr/attendance/approvals/page.tsx` - Migration vers `Can`

## Guide d'utilisation du composant `Can`

### Import

```typescript
import { Can } from '@/components/apps/common/protected-route';
// ou
import { Can } from '@/components/apps/common';
```

### Exemples d'utilisation

#### Permission unique

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

<Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES}>
  <RolesList />
</Can>
```

#### Permission avec format backend (normalisation automatique)

```tsx
<Can permission="can_view_employee">
  <EmployeeList />
</Can>
```

#### Au moins une permission (OR logic)

```tsx
<Can anyPermissions={["employee.view", "employee.manage"]}>
  <EmployeeList />
</Can>
```

#### Toutes les permissions (AND logic)

```tsx
<Can allPermissions={["employee.view", "department.view"]}>
  <EmployeeList />
</Can>
```

#### Admin seulement

```tsx
<Can adminOnly>
  <AdminPanel />
</Can>
```

#### Avec message d'erreur personnalisé

```tsx
<Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES} showMessage={true}>
  <RolesList />
</Can>
```

#### Avec fallback personnalisé

```tsx
<Can
  permission={COMMON_PERMISSIONS.HR.VIEW_ROLES}
  fallback={<p>Vous n'avez pas accès à cette section.</p>}
>
  <RolesList />
</Can>
```

## Utilisation des constantes COMMON_PERMISSIONS

Pour éviter les erreurs de typage, utilisez les constantes définies dans `/lib/types/shared/permissions.ts` :

```typescript
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

// Exemples disponibles :
COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES
COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES
COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES
COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES
COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEES
COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEE_PERMISSIONS
COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS
COMMON_PERMISSIONS.HR.CREATE_DEPARTMENTS
COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS
COMMON_PERMISSIONS.HR.DELETE_DEPARTMENTS
COMMON_PERMISSIONS.HR.VIEW_ROLES
COMMON_PERMISSIONS.HR.CREATE_ROLES
COMMON_PERMISSIONS.HR.UPDATE_ROLES
COMMON_PERMISSIONS.HR.DELETE_ROLES
COMMON_PERMISSIONS.HR.VIEW_CONTRACTS
COMMON_PERMISSIONS.HR.CREATE_CONTRACTS
COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS
COMMON_PERMISSIONS.HR.DELETE_CONTRACTS
COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS
COMMON_PERMISSIONS.HR.CREATE_LEAVE_REQUESTS
COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS
COMMON_PERMISSIONS.HR.VIEW_PAYROLL
COMMON_PERMISSIONS.HR.CREATE_PAYROLL
COMMON_PERMISSIONS.HR.UPDATE_PAYROLL
COMMON_PERMISSIONS.HR.EXPORT_PAYROLL
COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE
COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE
COMMON_PERMISSIONS.HR.CREATE_ATTENDANCE
COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE
COMMON_PERMISSIONS.HR.DELETE_ATTENDANCE
COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE
COMMON_PERMISSIONS.HR.MANUAL_CHECKIN
COMMON_PERMISSIONS.HR.CREATE_QR_SESSION
```

## Avantages de la migration

1. **Meilleure cohérence** : Un seul composant pour gérer les permissions conditionnelles
2. **Normalisation automatique** : Support transparent des formats backend et frontend
3. **Plus flexible** : Support de `adminOnly` et `showMessage`
4. **Meilleure documentation** : JSDoc complet avec exemples
5. **Typage fort** : Utilisation des constantes `COMMON_PERMISSIONS` pour éviter les erreurs

## Notes importantes

- Le composant `Can` ne retourne rien (`null`) pendant le chargement des permissions
- Lorsque `showMessage={true}`, un message d'erreur stylisé est affiché avec un bouton de retour
- Le composant `ProtectedRoute` reste disponible pour protéger des routes entières
- Le composant `Cannot` reste disponible pour la logique inverse (afficher si l'utilisateur n'a PAS la permission)
