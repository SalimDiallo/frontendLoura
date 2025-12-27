# Guide des Permissions d'Attendance

Ce guide explique comment utiliser les permissions d'attendance avec le composant `Can`.

## Permissions d'Attendance Disponibles

Toutes les permissions d'attendance sont disponibles via `COMMON_PERMISSIONS.HR` :

```typescript
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

// Permissions disponibles :
COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE           // attendance.view
COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE       // attendance.view_all
COMMON_PERMISSIONS.HR.CREATE_ATTENDANCE         // attendance.create
COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE         // attendance.update
COMMON_PERMISSIONS.HR.DELETE_ATTENDANCE         // attendance.delete
COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE        // attendance.approve
COMMON_PERMISSIONS.HR.MANUAL_CHECKIN            // attendance.manual_checkin
COMMON_PERMISSIONS.HR.CREATE_QR_SESSION         // attendance.create_qr_session
```

## Correspondance Backend ↔ Frontend

Le composant `Can` gère automatiquement la conversion entre les formats backend et frontend :

| Format Backend (Django)      | Format Frontend               | Constante                                    |
|------------------------------|-------------------------------|----------------------------------------------|
| `can_view_attendance`        | `attendance.view`             | `COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE`      |
| `can_view_all_attendance`    | `attendance.view_all`         | `COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE`  |
| `can_create_attendance`      | `attendance.create`           | `COMMON_PERMISSIONS.HR.CREATE_ATTENDANCE`    |
| `can_update_attendance`      | `attendance.update`           | `COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE`    |
| `can_delete_attendance`      | `attendance.delete`           | `COMMON_PERMISSIONS.HR.DELETE_ATTENDANCE`    |
| `can_approve_attendance`     | `attendance.approve`          | `COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE`   |
| `can_manual_checkin`         | `attendance.manual_checkin`   | `COMMON_PERMISSIONS.HR.MANUAL_CHECKIN`       |
| `can_create_qr_session`      | `attendance.create_qr_session`| `COMMON_PERMISSIONS.HR.CREATE_QR_SESSION`    |

## Exemples d'Utilisation

### 1. Afficher le bouton d'approbation des pointages

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

<Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE}>
  <Button asChild variant="default">
    <Link href={`/apps/${slug}/hr/attendance/approvals`}>
      <HiOutlineCheckCircle className="size-4 mr-2" />
      Valider les Pointages
    </Link>
  </Button>
</Can>
```

### 2. Pointage manuel (pour les administrateurs)

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

<Can permission={COMMON_PERMISSIONS.HR.MANUAL_CHECKIN}>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card className="p-6 border bg-card">
      <h3 className="font-semibold text-lg text-foreground">Arrivée (Manuel)</h3>
      <Button onClick={handleCheckIn}>
        Pointer l'arrivée
      </Button>
    </Card>
    {/* ... */}
  </div>
</Can>
```

### 3. Générer un QR Code pour le pointage

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

<Can anyPermissions={[
  COMMON_PERMISSIONS.HR.CREATE_QR_SESSION,
  COMMON_PERMISSIONS.HR.MANUAL_CHECKIN
]}>
  <Button asChild variant="secondary" size="lg">
    <Link href={`/apps/${slug}/hr/attendance/qr-display`}>
      <HiOutlineQrCode className="size-5 mr-2" />
      Générer QR
    </Link>
  </Button>
</Can>
```

### 4. Voir tous les pointages (pas seulement les siens)

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

<Can permission={COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE} showMessage={true}>
  <AttendanceTable attendances={allAttendances} />
</Can>
```

### 5. Modifier un pointage

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

<Can permission={COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE}>
  <Button onClick={() => setEditMode(true)}>
    Modifier
  </Button>
</Can>
```

### 6. Supprimer un pointage

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

<Can permission={COMMON_PERMISSIONS.HR.DELETE_ATTENDANCE}>
  <Button variant="destructive" onClick={handleDelete}>
    Supprimer
  </Button>
</Can>
```

### 7. Créer un nouveau pointage

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

<Can permission={COMMON_PERMISSIONS.HR.CREATE_ATTENDANCE}>
  <Button asChild>
    <Link href={`/apps/${slug}/hr/attendance/create`}>
      Créer un pointage
    </Link>
  </Button>
</Can>
```

## Logique de Permissions Combinées

### Au moins une permission (OR logic)

Utilisez `anyPermissions` pour autoriser l'accès si l'utilisateur a **au moins une** des permissions :

```tsx
<Can anyPermissions={[
  COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE,
  COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE
]}>
  <AttendanceManagementPanel />
</Can>
```

### Toutes les permissions (AND logic)

Utilisez `allPermissions` pour autoriser l'accès uniquement si l'utilisateur a **toutes** les permissions :

```tsx
<Can allPermissions={[
  COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE,
  COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE
]}>
  <AttendanceEditForm />
</Can>
```

## Cas d'Usage Courants

### Page d'approbation des pointages

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

export default function AttendanceApprovalsPage() {
  return (
    <Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE} showMessage={true}>
      <div className="space-y-6">
        <h1>Validation des Pointages</h1>
        <AttendanceApprovalTable />
      </div>
    </Can>
  );
}
```

### Section QR Code (Admin seulement)

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

<Can anyPermissions={[
  COMMON_PERMISSIONS.HR.CREATE_QR_SESSION,
  COMMON_PERMISSIONS.HR.MANUAL_CHECKIN
]}>
  <Card className="p-6 border bg-card">
    <h3>Pointage par QR Code</h3>
    <Button asChild>
      <Link href={`/apps/${slug}/hr/attendance/qr-display`}>
        Générer QR
      </Link>
    </Button>
  </Card>
</Can>
```

### Actions administrateur dans un tableau

```tsx
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/shared';

<TableRow>
  <TableCell>{attendance.employee_name}</TableCell>
  <TableCell>{attendance.check_in}</TableCell>
  <TableCell className="text-right">
    <div className="flex gap-2 justify-end">
      <Can permission={COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE}>
        <Button size="sm" onClick={() => handleEdit(attendance.id)}>
          Modifier
        </Button>
      </Can>

      <Can permission={COMMON_PERMISSIONS.HR.DELETE_ATTENDANCE}>
        <Button size="sm" variant="destructive" onClick={() => handleDelete(attendance.id)}>
          Supprimer
        </Button>
      </Can>
    </div>
  </TableCell>
</TableRow>
```

## Format Backend (Rétrocompatibilité)

Le composant `Can` accepte également le format backend grâce à la normalisation automatique :

```tsx
// Ces deux lignes sont équivalentes :
<Can permission="can_approve_attendance">
<Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE}>

// Ces deux lignes sont également équivalentes :
<Can anyPermissions={["can_manual_checkin", "can_create_qr_session"]}>
<Can anyPermissions={[
  COMMON_PERMISSIONS.HR.MANUAL_CHECKIN,
  COMMON_PERMISSIONS.HR.CREATE_QR_SESSION
]}>
```

**Recommandation** : Utilisez toujours `COMMON_PERMISSIONS` pour une meilleure maintenabilité et typage.

## Notes Importantes

1. **Chargement** : Le composant `Can` ne retourne rien (`null`) pendant le chargement des permissions
2. **Message d'erreur** : Utilisez `showMessage={true}` pour afficher un message d'erreur stylisé
3. **Fallback** : Utilisez `fallback` pour afficher un contenu alternatif
4. **Admin** : Utilisez `adminOnly={true}` pour restreindre aux admins uniquement

## Résumé

- ✅ Utilisez `COMMON_PERMISSIONS.HR.*` pour toutes les permissions d'attendance
- ✅ Le composant `Can` normalise automatiquement les permissions backend
- ✅ Combinez les permissions avec `anyPermissions` (OR) ou `allPermissions` (AND)
- ✅ Ajoutez `showMessage={true}` pour afficher un message d'erreur personnalisé
