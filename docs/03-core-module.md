# Module Core

## Vue d'ensemble

Le module **Core** est le module fondamental de l'application Loura. Il gère :

- **Authentification** : Login/logout admin et employés, gestion des tokens JWT
- **Organisations** : CRUD complet des organisations (multi-tenant)
- **Catégories** : Catégories de modules (HR, Inventory, etc.)
- **Modules** : Modules activables par organisation

---

## Structure

```
├── app/
│   ├── auth/                    # Routes d'authentification
│   │   ├── admin/              # Login admin
│   │   │   └── page.tsx
│   │   ├── employee/           # Login employé
│   │   │   └── page.tsx
│   │   └── register/           # Inscription (admin + org)
│   │       └── page.tsx
│   └── core/                   # Routes core publiques
│
├── components/core/            # Composants Core
│   ├── auth-layout.tsx         # Layout authentification
│   ├── organization-form.tsx   # Formulaire organisation
│   ├── organization-card.tsx   # Card organisation
│   ├── organization-wizard.tsx # Wizard création org
│   ├── organization-module-manager.tsx  # Gestion modules
│   ├── dashboard-layout.tsx    # Layout dashboard
│   ├── app-sidebar.tsx         # Sidebar principale
│   ├── module-selector.tsx     # Sélecteur de modules
│   └── index.ts                # Exports
│
├── lib/services/core/          # Services Core
│   ├── auth.service.ts         # Service authentification
│   ├── organization.service.ts # Service organisations
│   ├── organization-cached.service.ts  # Version avec cache
│   ├── module.service.ts       # Service modules
│   ├── organization-module.service.ts  # Service org-modules
│   ├── category.service.ts     # Service catégories
│   └── index.ts                # Exports
│
└── lib/types/core/             # Types Core
    ├── auth.types.ts           # Types authentification
    ├── organization.types.ts   # Types organisations
    ├── module.types.ts         # Types modules
    └── index.ts                # Exports
```

---

## Authentification

### Flux d'authentification

```
User (login form)
  ↓
authService.login(email, password, userType)
  ↓
API POST /auth/login/
  ↓
Response: { access, refresh, user }
  ↓
tokenManager.setTokens(access, refresh)
tokenManager.saveUser(user)
  ↓
useAuthStore.setUser(user)
  ↓
Redirect → /apps/[slug]/dashboard (ou /auth/employee si employee sans org)
```

### Endpoints

```typescript
AUTH: {
  LOGIN: '/auth/login/',                    // Login unifié
  REGISTER: '/auth/register/',              // Inscription admin + org
  LOGOUT: '/auth/logout/',
  REFRESH: '/auth/refresh/',                // Refresh token
  ME: '/auth/me/',                          // User courant
  UPDATE_PROFILE: '/auth/profile/update/',
  CHANGE_PASSWORD: '/auth/profile/change-password/',
}
```

### Service d'authentification

`lib/services/core/auth.service.ts`

```typescript
export const authService = {
  /**
   * Connexion utilisateur (admin ou employee)
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      { requiresAuth: false }
    );

    // Stocker tokens et user
    tokenManager.setTokens(response.access, response.refresh);
    tokenManager.saveUser(response.user);

    return response;
  },

  /**
   * Inscription (admin + organisation)
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data,
      { requiresAuth: false }
    );

    // Auto-login après inscription
    tokenManager.setTokens(response.access, response.refresh);
    tokenManager.saveUser(response.user);

    return response;
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      tokenManager.clearTokens();
    }
  },

  /**
   * Récupérer l'utilisateur courant
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
  },

  /**
   * Mettre à jour le profil
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.patch<User>(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data);
  },

  /**
   * Changer le mot de passe
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  },
};
```

### Types d'authentification

`lib/types/core/auth.types.ts`

```typescript
export interface LoginCredentials {
  email: string;
  password: string;
  userType?: 'admin' | 'employee';
}

export interface RegisterData {
  // Admin
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirm: string;

  // Organisation
  organization_name: string;
  subdomain: string;
  phone?: string;
  address?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  userType: 'admin' | 'employee';
  organization?: {
    id: string;
    name: string;
    subdomain: string;
  };
  employee?: {
    id: string;
    role?: {
      name: string;
      permissions: string[];
    };
  };
}
```

### JWT Token Management

`lib/api/client.ts`

```typescript
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },

  clearTokens: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  saveUser: (user: any): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: (): any => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
};
```

### Refresh automatique

Lors d'une erreur 401, le token est automatiquement rafraîchi :

```typescript
// lib/api/client.ts
if (response.status === 401 && requiresAuth) {
  const refreshed = await this.refreshToken();
  if (refreshed) {
    // Réessayer la requête
    return this.request<T>(endpoint, options);
  } else {
    // Rediriger vers login
    tokenManager.clearTokens();
    window.location.href = loginPath;
  }
}
```

### Hook useAuth

`lib/hooks/use-auth.ts`

```typescript
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}
```

---

## Organisations

### Fonctionnalités

- **CRUD complet** : Créer, lire, mettre à jour, supprimer
- **Multi-tenant** : Chaque organisation est isolée
- **Logo** : Upload/suppression de logo
- **Activation/Désactivation** : Activer ou désactiver une organisation
- **Modules** : Gestion des modules activés par organisation

### Endpoints

```typescript
ORGANIZATIONS: {
  LIST: '/core/organizations/',
  CREATE: '/core/organizations/',
  DETAIL: (id: string) => `/core/organizations/${id}/`,
  UPDATE: (id: string) => `/core/organizations/${id}/`,
  DELETE: (id: string) => `/core/organizations/${id}/`,
  ACTIVATE: (id: string) => `/core/organizations/${id}/activate/`,
  DEACTIVATE: (id: string) => `/core/organizations/${id}/deactivate/`,
  UPLOAD_LOGO: (id: string) => `/core/organizations/${id}/logo/`,
}
```

### Service d'organisations

`lib/services/core/organization.service.ts`

```typescript
export const organizationService = {
  /**
   * Récupérer toutes les organisations
   */
  async getAll(): Promise<Organization[]> {
    const response = await cacheManager.get<{ results: Organization[] }>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
      { ttl: 2 * 60 * 1000 }  // 2 minutes
    );
    return response.results || [];
  },

  /**
   * Récupérer une organisation par ID
   */
  async getById(id: string): Promise<Organization> {
    return cacheManager.get<Organization>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
      { ttl: 5 * 60 * 1000 }  // 5 minutes
    );
  },

  /**
   * Récupérer une organisation par slug
   */
  async getBySlug(slug: string): Promise<Organization | null> {
    const organizations = await this.getAll();
    return organizations.find((org) =>
      org.subdomain.toLowerCase() === slug.toLowerCase()
    ) || null;
  },

  /**
   * Créer une organisation
   */
  async create(data: OrganizationCreateData): Promise<Organization> {
    return cacheManager.post<Organization>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.CREATE,
      data,
      {
        invalidateCache: [API_ENDPOINTS.CORE.ORGANIZATIONS.LIST],
      }
    );
  },

  /**
   * Mettre à jour une organisation (PATCH)
   */
  async update(id: string, data: OrganizationUpdateData): Promise<Organization> {
    return cacheManager.patch<Organization>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE(id),
      data,
      {
        invalidateCache: [
          API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
          API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
        ],
      }
    );
  },

  /**
   * Supprimer une organisation
   */
  async delete(id: string): Promise<void> {
    return cacheManager.delete(
      API_ENDPOINTS.CORE.ORGANIZATIONS.DELETE(id),
      {
        invalidateCache: [
          API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
          API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
        ],
      }
    );
  },

  /**
   * Activer une organisation
   */
  async activate(id: string): Promise<{ message: string; organization: Organization }> {
    return cacheManager.post(
      API_ENDPOINTS.CORE.ORGANIZATIONS.ACTIVATE(id),
      undefined,
      {
        invalidateCache: [
          API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
          API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
        ],
      }
    );
  },

  /**
   * Désactiver une organisation
   */
  async deactivate(id: string): Promise<{ message: string; organization: Organization }> {
    return cacheManager.post(
      API_ENDPOINTS.CORE.ORGANIZATIONS.DEACTIVATE(id),
      undefined,
      {
        invalidateCache: [
          API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
          API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
        ],
      }
    );
  },

  /**
   * Upload logo
   */
  async uploadLogo(id: string, file: File): Promise<{ message: string; organization: Organization }> {
    const formData = new FormData();
    formData.append('logo', file);

    const token = localStorage.getItem('access_token');

    const response = await fetch(
      `${API_CONFIG.baseURL}${API_ENDPOINTS.CORE.ORGANIZATIONS.UPLOAD_LOGO(id)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur upload' }));
      throw new Error(error.error || 'Erreur lors de l\'upload');
    }

    return response.json();
  },
};
```

### Types d'organisations

`lib/types/core/organization.types.ts`

```typescript
export interface Organization {
  id: string;
  name: string;
  subdomain: string;  // Slug unique
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  admin?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  enabled_modules?: string[];
}

export interface OrganizationCreateData {
  name: string;
  subdomain: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface OrganizationUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}
```

---

## Modules

### Fonctionnalités

- **Liste des modules disponibles** : HR, Inventory, Accounting, etc.
- **Modules par catégorie** : Organisation par catégorie
- **Modules par défaut** : Modules activés par défaut
- **Organisation-Modules** : Gestion des modules activés par organisation

### Endpoints

```typescript
MODULES: {
  LIST: '/core/modules/',
  DETAIL: (id: string) => `/core/modules/${id}/`,
  DEFAULTS: '/core/modules/defaults/',
  BY_CATEGORY: '/core/modules/by_category/',
},

ORGANIZATION_MODULES: {
  LIST: '/core/organization-modules/',
  DETAIL: (id: string) => `/core/organization-modules/${id}/`,
  ENABLE: (id: string) => `/core/organization-modules/${id}/enable/`,
  DISABLE: (id: string) => `/core/organization-modules/${id}/disable/`,
}
```

### Service de modules

`lib/services/core/module.service.ts`

```typescript
export const moduleService = {
  /**
   * Liste tous les modules disponibles
   */
  async getAll(): Promise<Module[]> {
    const response = await cacheManager.get<{ results: Module[] }>(
      API_ENDPOINTS.CORE.MODULES.LIST,
      { ttl: 10 * 60 * 1000 }
    );
    return response.results || [];
  },

  /**
   * Modules par défaut
   */
  async getDefaults(): Promise<Module[]> {
    return cacheManager.get<Module[]>(
      API_ENDPOINTS.CORE.MODULES.DEFAULTS,
      { ttl: 10 * 60 * 1000 }
    );
  },

  /**
   * Modules par catégorie
   */
  async getByCategory(): Promise<Record<string, Module[]>> {
    return cacheManager.get(
      API_ENDPOINTS.CORE.MODULES.BY_CATEGORY,
      { ttl: 10 * 60 * 1000 }
    );
  },
};
```

---

## Catégories

### Endpoints

```typescript
CATEGORIES: {
  LIST: '/core/categories/',
  DETAIL: (id: number) => `/core/categories/${id}/`,
}
```

### Service de catégories

`lib/services/core/category.service.ts`

```typescript
export const categoryService = {
  /**
   * Liste toutes les catégories
   */
  async getAll(): Promise<Category[]> {
    const response = await cacheManager.get<{ results: Category[] }>(
      API_ENDPOINTS.CORE.CATEGORIES.LIST,
      { ttl: 10 * 60 * 1000 }
    );
    return response.results || [];
  },
};
```

---

## Composants Core

### OrganizationForm

Formulaire de création/modification d'organisation.

`components/core/organization-form.tsx`

- Validation avec Zod
- Gestion upload logo
- Support création et modification

### OrganizationWizard

Wizard multi-étapes pour créer une organisation complète.

`components/core/organization-wizard.tsx`

- Étape 1 : Informations organisation
- Étape 2 : Sélection des modules
- Étape 3 : Configuration initiale

### OrganizationModuleManager

Interface de gestion des modules activés pour une organisation.

`components/core/organization-module-manager.tsx`

- Activer/désactiver modules
- Groupement par catégorie
- Indicateurs visuels

### AppSidebar

Sidebar principale de l'application avec navigation multi-niveau.

`components/core/app-sidebar.tsx`

- Navigation par module
- Indicateurs d'état
- Responsive design

---

## Store Zustand

### Auth Store

`lib/store/auth-store.ts`

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: 'admin' | 'employee' | null;

  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  userType: null,

  setUser: (user) => set({
    user,
    isAuthenticated: true,
    userType: user.userType,
  }),

  logout: () => set({
    user: null,
    isAuthenticated: false,
    userType: null,
  }),
}));
```

---

## Routing

### Routes publiques

- `/auth/admin` - Login admin
- `/auth/employee` - Login employé
- `/auth/register` - Inscription

### Routes protégées

- `/apps/[slug]/*` - Application multi-tenant

### Protection des routes

```typescript
// middleware.ts ou layout
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const token = tokenManager.getAccessToken();
  if (!token) {
    redirect('/auth/admin');
  }
}
```

---

## Bonnes pratiques

### Authentification

1. Toujours utiliser `authService` pour les opérations d'auth
2. Ne jamais stocker de mots de passe en clair
3. Utiliser le refresh automatique des tokens
4. Rediriger après login selon le type d'utilisateur

### Organisations

1. Toujours filtrer par `organization_subdomain`
2. Utiliser le cache pour les données rarement modifiées
3. Invalider le cache après mutations
4. Vérifier les permissions avant toute action

### Multi-tenant

1. Stocker le slug actuel dans `localStorage`
2. Ajouter `organization_subdomain` aux requêtes API
3. Isoler le cache par organisation
4. Vérifier que l'utilisateur appartient à l'organisation

---

## Références

- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Multi-tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)
