# Système de Permissions

## Vue d'ensemble

Le système de permissions de Loura Frontend implémente un modèle **RBAC** (Role-Based Access Control) granulaire.

### Principes

- **Admin** : Accès complet (toutes permissions)
- **Employee** : Accès basé sur son rôle
- **Permissions granulaires** : Par module et par action
- **Composants protégés** : Affichage conditionnel basé sur les permissions

---

## Format des permissions

### Code de permission

Format : `{module}.{action}_{entity}`

Exemples :
```
hr.view_employee
hr.add_employee
hr.change_employee
hr.delete_employee
inventory.view_product
inventory.add_sale
accounting.view_invoice
```

### Actions standard

- `view` : Lecture
- `add` : Création
- `change` : Modification
- `delete` : Suppression

### Actions spéciales

- `approve` : Approbation (congés, avances, etc.)
- `validate` : Validation (inventaires, etc.)
- `export` : Export de données

---

## Store de permissions

### Fichier : `lib/store/permissions-store.ts`

Store Zustand pour gérer les permissions.

```typescript
interface PermissionsState {
  permissions: Permission[];
  role: Role | null;

  // Actions
  setPermissions: (permissions: Permission[]) => void;
  setRole: (role: Role) => void;
  clearPermissions: () => void;

  // Helpers
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  permissions: [],
  role: null,

  setPermissions: (permissions) => set({ permissions }),
  setRole: (role) => set({ role }),
  clearPermissions: () => set({ permissions: [], role: null }),

  hasPermission: (code) => {
    const { permissions } = get();
    return permissions.some(p => p.code === code);
  },

  hasAnyPermission: (codes) => {
    const { permissions } = get();
    return codes.some(code => 
      permissions.some(p => p.code === code)
    );
  },

  hasAllPermissions: (codes) => {
    const { permissions } = get();
    return codes.every(code => 
      permissions.some(p => p.code === code)
    );
  },
}));
```

---

## Hooks de permissions

### usePermissions

Hook principal pour accéder aux permissions.

`lib/hooks/use-permissions.ts`

```typescript
export function usePermissions() {
  const permissions = usePermissionsStore((state) => state.permissions);
  const role = usePermissionsStore((state) => state.role);
  const user = useAuthStore((state) => state.user);
  const userType = useAuthStore((state) => state.userType);

  const isAdmin = userType === 'admin';

  /**
   * Vérifie si l'utilisateur a une permission
   */
  const hasPermission = (code: string): boolean => {
    if (isAdmin) return true;  // Admin a toutes les permissions
    return usePermissionsStore.getState().hasPermission(code);
  };

  /**
   * Vérifie si l'utilisateur a au moins une des permissions
   */
  const hasAnyPermission = (codes: string[]): boolean => {
    if (isAdmin) return true;
    return usePermissionsStore.getState().hasAnyPermission(codes);
  };

  /**
   * Vérifie si l'utilisateur a toutes les permissions
   */
  const hasAllPermissions = (codes: string[]): boolean => {
    if (isAdmin) return true;
    return usePermissionsStore.getState().hasAllPermissions(codes);
  };

  // Alias
  const can = hasPermission;
  const cannot = (code: string) => !hasPermission(code);

  return {
    user,
    isAdmin,
    permissions,
    role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    cannot,
  };
}
```

### useHasPermission

Hook pour vérifier une permission spécifique.

```typescript
export function useHasPermission(code: string): boolean {
  const userType = useAuthStore((state) => state.userType);
  const hasPermission = usePermissionsStore((state) => state.hasPermission);
  
  if (userType === 'admin') return true;
  
  return hasPermission(code);
}
```

---

## Composants de protection

### Can

Composant pour affichage conditionnel basé sur les permissions.

`components/common/providers/can.tsx`

```typescript
interface CanProps {
  code: string | string[];
  mode?: 'any' | 'all';  // 'any' = au moins une, 'all' = toutes
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({ code, mode = 'all', fallback, children }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const hasAccess = Array.isArray(code)
    ? mode === 'any'
      ? hasAnyPermission(code)
      : hasAllPermissions(code)
    : hasPermission(code);

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
```

#### Usage

```typescript
import { Can } from '@/components/common/providers';

// Permission unique
<Can code="hr.add_employee">
  <Button onClick={handleCreate}>Add Employee</Button>
</Can>

// Permissions multiples (au moins une)
<Can code={['hr.add_employee', 'hr.change_employee']} mode="any">
  <Button>Edit</Button>
</Can>

// Permissions multiples (toutes requises)
<Can code={['hr.view_employee', 'hr.delete_employee']} mode="all">
  <Button variant="destructive">Delete</Button>
</Can>

// Avec fallback
<Can
  code="hr.view_employee"
  fallback={<div>Access denied</div>}
>
  <EmployeeList />
</Can>
```

### ProtectedRoute

Route protégée par permission.

`components/common/providers/protected-route.tsx`

```typescript
interface ProtectedRouteProps {
  code: string | string[];
  mode?: 'any' | 'all';
  redirectTo?: string;
  children: React.ReactNode;
}

export function ProtectedRoute({
  code,
  mode = 'all',
  redirectTo = '/unauthorized',
  children,
}: ProtectedRouteProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    const hasAccess = Array.isArray(code)
      ? mode === 'any'
        ? hasAnyPermission(code)
        : hasAllPermissions(code)
      : hasPermission(code);

    if (!hasAccess) {
      router.push(redirectTo);
    }
  }, [code, mode, hasPermission, hasAnyPermission, hasAllPermissions, router, redirectTo]);

  return <>{children}</>;
}
```

#### Usage

```typescript
// Dans une page
export default function EmployeesPage() {
  return (
    <ProtectedRoute code="hr.view_employee">
      <EmployeesList />
    </ProtectedRoute>
  );
}

// Dans un layout
export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute code={['hr.view_employee', 'hr.add_employee']} mode="any">
      {children}
    </ProtectedRoute>
  );
}
```

---

## Permissions par module

### Module Core

```
core.view_organization
core.add_organization
core.change_organization
core.delete_organization
core.view_module
core.change_organization_module
```

### Module HR

```
hr.view_employee
hr.add_employee
hr.change_employee
hr.delete_employee

hr.view_department
hr.add_department
hr.change_department
hr.delete_department

hr.view_leaverequest
hr.add_leaverequest
hr.change_leaverequest
hr.delete_leaverequest
hr.approve_leaverequest

hr.view_payslip
hr.add_payslip
hr.change_payslip
hr.delete_payslip

hr.view_attendance
hr.add_attendance
hr.change_attendance
hr.delete_attendance
hr.approve_attendance

hr.view_contract
hr.add_contract
hr.change_contract
hr.delete_contract

hr.view_role
hr.add_role
hr.change_role
hr.delete_role
```

### Module Inventory

```
inventory.view_product
inventory.add_product
inventory.change_product
inventory.delete_product

inventory.view_sale
inventory.add_sale
inventory.change_sale
inventory.delete_sale

inventory.view_stockcount
inventory.add_stockcount
inventory.change_stockcount
inventory.validate_stockcount

inventory.view_customer
inventory.add_customer
inventory.change_customer
inventory.delete_customer

inventory.view_warehouse
inventory.add_warehouse
inventory.change_warehouse
inventory.delete_warehouse
```

---

## PermissionProvider

Provider pour initialiser les permissions au chargement.

`components/common/providers/permission-provider.tsx`

```typescript
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user, userType } = useAuthStore();
  const { setPermissions, setRole } = usePermissionsActions();

  useEffect(() => {
    const loadPermissions = async () => {
      if (userType === 'employee' && user?.employee?.role) {
        // Charger les permissions du rôle
        const permissions = user.employee.role.permissions || [];
        const role = user.employee.role;
        
        setPermissions(permissions);
        setRole(role);
      } else if (userType === 'admin') {
        // Admin a toutes les permissions (pas besoin de les charger)
        setPermissions([]);
        setRole(null);
      }
    };

    if (user) {
      loadPermissions();
    }
  }, [user, userType, setPermissions, setRole]);

  return <>{children}</>;
}
```

### Usage dans le layout

```typescript
// app/layout.tsx ou app/apps/(org)/[slug]/layout.tsx

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionProvider>
      {children}
    </PermissionProvider>
  );
}
```

---

## Guard côté serveur

### Middleware

Pour protéger les routes côté serveur (optionnel avec Next.js App Router).

`middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/auth/admin', request.url));
  }

  // Vérifier les permissions (optionnel)
  // ...

  return NextResponse.next();
}

export const config = {
  matcher: '/apps/:path*',
};
```

---

## Données de permissions

### Fichier : `lib/constants/permissions-data-label.ts`

Labels et descriptions des permissions pour l'interface utilisateur.

```typescript
export const PERMISSIONS_DATA = {
  hr: {
    label: 'Ressources Humaines',
    permissions: {
      'hr.view_employee': {
        label: 'Voir les employés',
        description: 'Consulter la liste et les détails des employés',
      },
      'hr.add_employee': {
        label: 'Ajouter des employés',
        description: 'Créer de nouveaux employés',
      },
      // ...
    },
  },
  inventory: {
    label: 'Gestion des stocks',
    permissions: {
      'inventory.view_product': {
        label: 'Voir les produits',
        description: 'Consulter le catalogue de produits',
      },
      // ...
    },
  },
};
```

---

## Gestion des rôles

### Service

`lib/services/hr/role.service.ts`

```typescript
/**
 * Créer un rôle avec permissions
 */
export async function createRole(data: {
  name: string;
  description?: string;
  permissions: string[];  // Codes de permissions
}): Promise<Role> {
  return cacheManager.post<Role>(
    API_ENDPOINTS.HR.ROLES.CREATE,
    data,
    {
      invalidateCache: [API_ENDPOINTS.HR.ROLES.LIST],
    }
  );
}

/**
 * Mettre à jour les permissions d'un rôle
 */
export async function updateRolePermissions(
  roleId: string,
  permissions: string[]
): Promise<Role> {
  return cacheManager.patch<Role>(
    API_ENDPOINTS.HR.ROLES.UPDATE(roleId),
    { permissions },
    {
      invalidateCache: [
        API_ENDPOINTS.HR.ROLES.LIST,
        API_ENDPOINTS.HR.ROLES.DETAIL(roleId),
      ],
    }
  );
}
```

---

## Bonnes pratiques

### Permissions

1. **Granularité** : Permissions granulaires par action
2. **Nommage** : Format cohérent `{module}.{action}_{entity}`
3. **Documentation** : Documenter chaque permission
4. **Tests** : Tester les composants protégés

### Sécurité

1. **Validation côté serveur** : Toujours valider côté backend
2. **Admin par défaut** : Admin a toutes les permissions
3. **Fallback** : Toujours avoir un fallback pour les accès refusés
4. **Pas de sécurité par obscurité** : Ne pas cacher les routes dans le code

### UI/UX

1. **Feedback** : Expliquer pourquoi l'accès est refusé
2. **Graceful degradation** : Cacher les éléments inaccessibles
3. **Cohérence** : Même comportement partout
4. **Performance** : Éviter les vérifications répétées

---

## Références

- [RBAC](https://en.wikipedia.org/wiki/Role-based_access_control)
- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
