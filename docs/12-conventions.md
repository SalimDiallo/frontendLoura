# Conventions de Code

## Vue d'ensemble

Ce document définit les conventions de code et les bonnes pratiques pour le projet Loura Frontend.

---

## Organisation des fichiers

### Structure par module

```
app/{module}/              # Routes
components/{module}/       # Composants
lib/services/{module}/     # Services
lib/types/{module}/        # Types
```

### Nommage des fichiers

- **Composants** : PascalCase (`EmployeeCard.tsx`)
- **Services** : kebab-case avec suffixe (` employee.service.ts`)
- **Types** : kebab-case avec suffixe (`employee.types.ts`)
- **Hooks** : kebab-case avec préfixe (`use-permissions.ts`)
- **Utils** : kebab-case (`format-date.ts`)
- **Constants** : UPPER_SNAKE_CASE ou kebab-case (`API_CONFIG` ou `permissions-data.ts`)

---

## Imports

### Ordre des imports

```typescript
// 1. React et frameworks
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Bibliothèques tierces
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

// 3. Composants UI
import { Button, Input, Card } from '@/components/ui';

// 4. Composants métier
import { EmployeeCard } from '@/components/hr';

// 5. Services
import { employeeService } from '@/lib/services/hr';

// 6. Types
import type { Employee } from '@/lib/types/hr';

// 7. Utils et constants
import { cn } from '@/lib/utils';
import { API_ENDPOINTS } from '@/lib/api/config';

// 8. Styles (si nécessaire)
import './styles.css';
```

### Imports depuis index

**Toujours importer depuis les fichiers index** :

```typescript
// ✅ Correct
import { Button, Input } from '@/components/ui';
import { employeeService, departmentService } from '@/lib/services/hr';
import type { Employee, Department } from '@/lib/types/hr';

// ❌ Éviter
import { Button } from '@/components/ui/button';
import { employeeService } from '@/lib/services/hr/employee.service';
import type { Employee } from '@/lib/types/hr/employee.types';
```

### Path alias

Utiliser `@/` pour les imports absolus :

```typescript
import { Button } from '@/components/ui';
import { authService } from '@/lib/services/core';
```

---

## TypeScript

### Typage strict

- **Mode strict activé** : `"strict": true` dans `tsconfig.json`
- **Typer tous les paramètres et retours**
- **Éviter `any`** : Utiliser `unknown` si nécessaire
- **Utiliser les interfaces** pour les objets

### Interfaces vs Types

- **Interface** : Pour les objets et classes
- **Type** : Pour les unions, tuples, primitives

```typescript
// Interface
interface Employee {
  id: string;
  name: string;
  email: string;
}

// Type
type EmploymentStatus = 'permanent' | 'contract' | 'intern';
type EmployeeWithRole = Employee & { role: Role };
```

### Types utilitaires

```typescript
// Partial
type EmployeeUpdate = Partial<Employee>;

// Pick
type EmployeePreview = Pick<Employee, 'id' | 'name' | 'email'>;

// Omit
type EmployeeCreate = Omit<Employee, 'id' | 'created_at'>;

// Required
type EmployeeRequired = Required<Employee>;
```

### Inférence de types

Laisser TypeScript inférer quand c'est évident :

```typescript
// ✅ Inférence
const count = 0;  // number
const name = 'John';  // string

// ❌ Redondant
const count: number = 0;
const name: string = 'John';

// ✅ Nécessaire
const employee: Employee = { ... };
```

---

## React

### Composants

#### Functional Components

Toujours utiliser des functional components :

```typescript
// ✅ Correct
export function EmployeeCard({ employee }: { employee: Employee }) {
  return <div>{employee.name}</div>;
}

// ❌ Éviter (class components)
export class EmployeeCard extends React.Component { ... }
```

#### Props Interface

Définir une interface pour les props :

```typescript
interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (id: string) => void;
  showActions?: boolean;
}

export function EmployeeCard({ employee, onEdit, showActions = true }: EmployeeCardProps) {
  // ...
}
```

#### Default Props

Utiliser les default parameters :

```typescript
// ✅ Correct
function Button({ variant = 'default', size = 'md' }: ButtonProps) { ... }

// ❌ Éviter
Button.defaultProps = { variant: 'default' };
```

### Hooks

#### Ordre des hooks

```typescript
export function MyComponent() {
  // 1. State hooks
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // 2. Context hooks
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // 3. Router hooks
  const router = useRouter();
  const params = useParams();

  // 4. Custom hooks
  const { data, isLoading } = useEmployees();

  // 5. Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // 6. Effects
  useEffect(() => {
    // ...
  }, []);

  // 7. Callbacks et memoization
  const handleClick = useCallback(() => {
    // ...
  }, []);

  const memoizedValue = useMemo(() => {
    // ...
  }, []);

  // 8. Render
  return <div>...</div>;
}
```

#### Custom Hooks

Préfixer avec `use` :

```typescript
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  return { employees, isLoading };
}
```

### Event Handlers

Préfixer avec `handle` :

```typescript
const handleClick = () => { ... };
const handleSubmit = (data: FormData) => { ... };
const handleChange = (value: string) => { ... };
```

### Client vs Server Components

#### Server Components (par défaut)

```typescript
// app/page.tsx
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

#### Client Components

```typescript
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

## Services

### Structure

```typescript
/**
 * Service description
 */

import { cacheManager } from '@/lib/offline';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Entity, EntityCreate, EntityUpdate } from '@/lib/types/module';

/**
 * Get all entities
 */
export async function getEntities(): Promise<Entity[]> {
  const response = await cacheManager.get<{ results: Entity[] }>(
    API_ENDPOINTS.MODULE.ENTITIES.LIST,
    { ttl: 5 * 60 * 1000 }
  );
  return response.results || [];
}

/**
 * Create entity
 */
export async function createEntity(data: EntityCreate): Promise<Entity> {
  return cacheManager.post<Entity>(
    API_ENDPOINTS.MODULE.ENTITIES.CREATE,
    data,
    {
      invalidateCache: [API_ENDPOINTS.MODULE.ENTITIES.LIST],
    }
  );
}
```

### Nommage

- **Fonctions CRUD** : `get`, `getById`, `create`, `update`, `delete`
- **Actions spéciales** : `activate`, `approve`, `export`, etc.

### JSDoc

Documenter toutes les fonctions publiques :

```typescript
/**
 * Create a new employee
 * @param data - Employee creation data
 * @returns The created employee
 * @throws {ApiError} If creation fails
 */
export async function createEmployee(data: EmployeeCreate): Promise<Employee> {
  // ...
}
```

---

## Styling

### Tailwind CSS

#### Classes utilitaires

```typescript
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  {/* Content */}
</div>
```

#### Fonction cn()

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  {
    'active-class': isActive,
    'disabled-class': isDisabled,
  },
  className  // Props className
)} />
```

#### Responsive

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

---

## Formulaires

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.login(data);
      router.push('/dashboard');
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

## Gestion des erreurs

### Try/Catch

```typescript
const handleSubmit = async (data: FormData) => {
  try {
    await createEmployee(data);
    toast.success('Employé créé');
    router.push('/hr/employees');
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message);
    } else {
      toast.error('Une erreur est survenue');
      console.error(error);
    }
  }
};
```

### Error Boundaries

```typescript
// app/error.tsx
'use client';

export default function Error({ error, reset }: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## Performance

### React.memo

```typescript
export const EmployeeCard = React.memo(function EmployeeCard({ employee }: EmployeeCardProps) {
  return <div>{employee.name}</div>;
});
```

### useMemo

```typescript
const sortedEmployees = useMemo(() => {
  return employees.sort((a, b) => a.name.localeCompare(b.name));
}, [employees]);
```

### useCallback

```typescript
const handleClick = useCallback((id: string) => {
  router.push(`/employees/${id}`);
}, [router]);
```

### Dynamic Imports

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
});
```

---

## Tests (à implémenter)

### Naming

```typescript
// employee.service.test.ts
describe('employeeService', () => {
  describe('getEmployees', () => {
    it('should return a list of employees', async () => {
      // Test
    });

    it('should filter employees by department', async () => {
      // Test
    });
  });
});
```

---

## Commits

### Conventional Commits

```
feat: add employee search feature
fix: correct salary calculation bug
docs: update API documentation
style: format code with prettier
refactor: simplify employee service
test: add tests for employee CRUD
chore: update dependencies
```

---

## Code Review

### Checklist

- [ ] Code respecte les conventions
- [ ] Types TypeScript corrects
- [ ] Tests passent (si présents)
- [ ] Pas de console.log oubliés
- [ ] Documentation à jour
- [ ] Permissions vérifiées
- [ ] Performance acceptable
- [ ] Accessibility respectée

---

## Références

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)
- [Conventional Commits](https://www.conventionalcommits.org/)
