# API Client et Services

## Vue d'ensemble

L'architecture API du projet est basée sur une **couche d'abstraction** claire :

```
Component → Service → Cache Manager → API Client → Backend Django
```

---

## API Client

### Fichier : `lib/api/client.ts`

Client HTTP personnalisé basé sur **Fetch API** avec gestion automatique des tokens JWT.

### Classe ApiClient

```typescript
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Méthodes HTTP
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T>
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>
  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T>

  // Refresh token
  async refreshToken(): Promise<boolean>
}

// Instance singleton
export const apiClient = new ApiClient(API_CONFIG.baseURL);
```

### Fonctionnalités clés

#### 1. Gestion automatique des tokens

```typescript
// Ajout automatique du token
if (requiresAuth) {
  const token = tokenManager.getAccessToken();
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }
}
```

#### 2. Refresh automatique sur 401

```typescript
if (response.status === 401 && requiresAuth) {
  const refreshed = await this.refreshToken();
  if (refreshed) {
    return this.request<T>(endpoint, options);  // Retry
  } else {
    tokenManager.clearTokens();
    window.location.href = loginPath;
  }
}
```

#### 3. Ajout automatique de organization_subdomain

```typescript
const orgSlug = localStorage.getItem('current_organization_slug');
if (orgSlug && !url.includes('organization_subdomain=')) {
  const separator = url.includes('?') ? '&' : '?';
  url = `${url}${separator}organization_subdomain=${orgSlug}`;
}
```

#### 4. Gestion des erreurs

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

---

## Configuration API

### Fichier : `lib/api/config.ts`

Configuration centralisée de tous les endpoints.

### Structure

```typescript
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const;

export const API_ENDPOINTS = {
  AUTH: { ... },
  CORE: { ... },
  HR: { ... },
  INVENTORY: { ... },
  NOTIFICATIONS: { ... },
  AI: { ... },
} as const;
```

### Endpoints dynamiques

```typescript
DETAIL: (id: string) => `/hr/employees/${id}/`,
UPDATE: (id: string) => `/hr/employees/${id}/`,
ACTIVATE: (id: string) => `/hr/employees/${id}/activate/`,
```

---

## Services

### Pattern de service

Chaque module a ses propres services qui encapsulent les appels API.

#### Structure type

```typescript
// lib/services/hr/employee.service.ts

/**
 * Liste tous les employés
 */
export async function getEmployees(
  organizationSlug: string,
  params?: EmployeeFilters
): Promise<EmployeeListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('organization_subdomain', organizationSlug);
  
  // Ajouter les filtres
  if (params?.search) searchParams.append('search', params.search);
  
  const url = `${API_ENDPOINTS.HR.EMPLOYEES.LIST}?${searchParams}`;
  return await cacheManager.get<EmployeeListResponse>(url, { ttl: 5 * 60 * 1000 });
}

/**
 * Créer un employé
 */
export async function createEmployee(data: EmployeeCreate): Promise<Employee> {
  return cacheManager.post<Employee>(
    API_ENDPOINTS.HR.EMPLOYEES.CREATE,
    data,
    {
      invalidateCache: [API_ENDPOINTS.HR.EMPLOYEES.LIST],
    }
  );
}
```

### Exports centralisés

Chaque dossier de services a un `index.ts` pour les exports :

```typescript
// lib/services/hr/index.ts

export * from './employee.service';
export * from './department.service';
export * from './contract.service';
export * from './leave.service';
export * from './payroll.service';
export * from './attendance.service';
```

### Utilisation dans les composants

```typescript
import { getEmployees, createEmployee } from '@/lib/services/hr';

// Dans un composant
const employees = await getEmployees(orgSlug, { search: 'John' });
const newEmployee = await createEmployee({ ... });
```

---

## Base Service

### Fichier : `lib/api/base-service.ts`

Classe de base pour créer des services avec CRUD standard.

```typescript
export class BaseService<T, CreateT = Partial<T>, UpdateT = Partial<T>> {
  constructor(
    private endpoints: {
      list: string;
      create: string;
      detail: (id: string) => string;
      update: (id: string) => string;
      delete: (id: string) => string;
    }
  ) {}

  async getAll(): Promise<T[]> {
    const response = await cacheManager.get<{ results: T[] }>(
      this.endpoints.list,
      { ttl: 5 * 60 * 1000 }
    );
    return response.results || [];
  }

  async getById(id: string): Promise<T> {
    return cacheManager.get<T>(this.endpoints.detail(id), { ttl: 5 * 60 * 1000 });
  }

  async create(data: CreateT): Promise<T> {
    return cacheManager.post<T>(this.endpoints.create, data, {
      invalidateCache: [this.endpoints.list],
    });
  }

  async update(id: string, data: UpdateT): Promise<T> {
    return cacheManager.patch<T>(this.endpoints.update(id), data, {
      invalidateCache: [this.endpoints.list, this.endpoints.detail(id)],
    });
  }

  async delete(id: string): Promise<void> {
    return cacheManager.delete(this.endpoints.delete(id), {
      invalidateCache: [this.endpoints.list],
    });
  }
}
```

### Exemple d'utilisation

```typescript
// lib/services/hr/position.service.ts

export const positionService = new BaseService({
  list: API_ENDPOINTS.HR.POSITIONS.LIST,
  create: API_ENDPOINTS.HR.POSITIONS.CREATE,
  detail: API_ENDPOINTS.HR.POSITIONS.DETAIL,
  update: API_ENDPOINTS.HR.POSITIONS.UPDATE,
  delete: API_ENDPOINTS.HR.POSITIONS.DELETE,
});
```

---

## Token Manager

### Fichier : `lib/api/client.ts`

Gestionnaire de tokens JWT stockés dans localStorage.

```typescript
export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setTokens: (access: string, refresh: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  saveUser: (user: any): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: (): any => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
};
```

---

## Types de requêtes

### RequestOptions

```typescript
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;  // Si true, ajoute le token (défaut: true)
}
```

### Exemples

#### GET avec cache

```typescript
const data = await cacheManager.get<Employee[]>(
  '/hr/employees/',
  { ttl: 5 * 60 * 1000 }  // Cache 5 minutes
);
```

#### POST avec invalidation

```typescript
const newEmployee = await cacheManager.post<Employee>(
  '/hr/employees/',
  { first_name: 'John', ... },
  {
    invalidateCache: ['/hr/employees/'],  // Invalide la liste
  }
);
```

#### Endpoint public (sans auth)

```typescript
const response = await apiClient.post(
  '/auth/login/',
  { email, password },
  { requiresAuth: false }
);
```

---

## Gestion des erreurs

### Try/Catch dans les services

```typescript
export async function getEmployees(): Promise<Employee[]> {
  try {
    const response = await cacheManager.get<EmployeeListResponse>(
      API_ENDPOINTS.HR.EMPLOYEES.LIST
    );
    return response.results || [];
  } catch (error) {
    console.error('Error fetching employees:', error);
    // Retourner une valeur par défaut ou re-throw
    return [];
  }
}
```

### Gestion dans les composants

```typescript
const handleSubmit = async (data: EmployeeCreate) => {
  try {
    await createEmployee(data);
    toast.success('Employé créé avec succès');
    router.push('/hr/employees');
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message);
    } else {
      toast.error('Une erreur est survenue');
    }
  }
};
```

---

## Bonnes pratiques

### Services

1. **Un fichier par entité** : `employee.service.ts`, `department.service.ts`
2. **Exports nommés** : `export async function getEmployees()`
3. **Types explicites** : Typer tous les paramètres et retours
4. **Documentation** : JSDoc pour chaque fonction
5. **Gestion d'erreurs** : Try/catch avec fallbacks appropriés

### API Client

1. **Ne pas utiliser directement apiClient** : Passer par les services
2. **Centraliser les endpoints** : Dans `api/config.ts`
3. **Typer les réponses** : Utiliser les types de `lib/types/`
4. **Invalider le cache** : Après toute mutation

### Tokens

1. **Refresh automatique** : Géré par apiClient
2. **Redirection après logout** : Nettoyer localStorage
3. **SSR-safe** : Vérifier `typeof window !== 'undefined'`

---

## Références

- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [REST API Design](https://restfulapi.net/)
