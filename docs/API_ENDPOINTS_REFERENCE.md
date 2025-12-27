# 📡 Référence des Endpoints API

Ce document liste tous les endpoints disponibles dans l'application.

---

## 🔑 Configuration

**Base URL:** `http://localhost:8000/api/core` (développement)

**Import:**
```typescript
import { API_ENDPOINTS } from '@/lib/api/config';
```

---

## 📦 Module CORE

### Authentification

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `API_ENDPOINTS.CORE.AUTH.REGISTER` | POST | Inscription |
| `API_ENDPOINTS.CORE.AUTH.LOGIN` | POST | Connexion |
| `API_ENDPOINTS.CORE.AUTH.LOGOUT` | POST | Déconnexion |
| `API_ENDPOINTS.CORE.AUTH.REFRESH` | POST | Rafraîchir le token |
| `API_ENDPOINTS.CORE.AUTH.ME` | GET | Utilisateur actuel |

**Chemin réel:** `/auth/...`

**Exemples:**
```typescript
// Inscription
await apiClient.post(API_ENDPOINTS.CORE.AUTH.REGISTER, {
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
  password: 'password123',
  password_confirm: 'password123',
});

// Connexion
await apiClient.post(API_ENDPOINTS.CORE.AUTH.LOGIN, {
  email: 'user@example.com',
  password: 'password123',
});

// Déconnexion
await apiClient.post(API_ENDPOINTS.CORE.AUTH.LOGOUT, {
  refresh: refreshToken,
});

// Utilisateur actuel
const user = await apiClient.get(API_ENDPOINTS.CORE.AUTH.ME);
```

---

### Organisations

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `API_ENDPOINTS.CORE.ORGANIZATIONS.LIST` | GET | Liste des organisations |
| `API_ENDPOINTS.CORE.ORGANIZATIONS.CREATE` | POST | Créer une organisation |
| `API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id)` | GET | Détails d'une organisation |
| `API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE(id)` | PUT/PATCH | Modifier une organisation |
| `API_ENDPOINTS.CORE.ORGANIZATIONS.DELETE(id)` | DELETE | Supprimer une organisation |
| `API_ENDPOINTS.CORE.ORGANIZATIONS.ACTIVATE(id)` | POST | Activer une organisation |
| `API_ENDPOINTS.CORE.ORGANIZATIONS.DEACTIVATE(id)` | POST | Désactiver une organisation |

**Chemin réel:** `/organizations/...`

**Exemples:**
```typescript
// Lister toutes les organisations
const orgs = await apiClient.get(API_ENDPOINTS.CORE.ORGANIZATIONS.LIST);

// Créer une organisation
const newOrg = await apiClient.post(API_ENDPOINTS.CORE.ORGANIZATIONS.CREATE, {
  name: 'Ma Super Entreprise',
  subdomain: 'super-entreprise',
  category: 1,
  settings: {
    country: 'GN',
    currency: 'GNF',
  },
});

// Détails d'une organisation
const org = await apiClient.get(API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL('org-id'));

// Modifier une organisation (partiel)
const updated = await apiClient.patch(API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE('org-id'), {
  name: 'Nouveau nom',
});

// Modifier une organisation (complet)
const replaced = await apiClient.put(API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE('org-id'), {
  name: 'Nouveau nom',
  subdomain: 'nouveau-subdomain',
  // ... tous les champs requis
});

// Supprimer une organisation
await apiClient.delete(API_ENDPOINTS.CORE.ORGANIZATIONS.DELETE('org-id'));

// Activer une organisation
const result = await apiClient.post(API_ENDPOINTS.CORE.ORGANIZATIONS.ACTIVATE('org-id'));

// Désactiver une organisation
const result = await apiClient.post(API_ENDPOINTS.CORE.ORGANIZATIONS.DEACTIVATE('org-id'));
```

---

### Catégories

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `API_ENDPOINTS.CORE.CATEGORIES.LIST` | GET | Liste des catégories |
| `API_ENDPOINTS.CORE.CATEGORIES.DETAIL(id)` | GET | Détails d'une catégorie |

**Chemin réel:** `/categories/...`

**Exemples:**
```typescript
// Lister toutes les catégories
const categories = await apiClient.get(API_ENDPOINTS.CORE.CATEGORIES.LIST);

// Détails d'une catégorie
const category = await apiClient.get(API_ENDPOINTS.CORE.CATEGORIES.DETAIL(1));
```

---

## 🚧 Module HR (Placeholder)

### Employés

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `API_ENDPOINTS.HR.EMPLOYEES.LIST` | GET | Liste des employés |
| `API_ENDPOINTS.HR.EMPLOYEES.CREATE` | POST | Créer un employé |
| `API_ENDPOINTS.HR.EMPLOYEES.DETAIL(id)` | GET | Détails d'un employé |
| `API_ENDPOINTS.HR.EMPLOYEES.UPDATE(id)` | PUT/PATCH | Modifier un employé |
| `API_ENDPOINTS.HR.EMPLOYEES.DELETE(id)` | DELETE | Supprimer un employé |

**Chemin réel:** `/hr/employees/...`

**⚠️ Note:** Ces endpoints sont des placeholders. Le module HR n'est pas encore implémenté.

---

### Départements

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `API_ENDPOINTS.HR.DEPARTMENTS.LIST` | GET | Liste des départements |
| `API_ENDPOINTS.HR.DEPARTMENTS.CREATE` | POST | Créer un département |
| `API_ENDPOINTS.HR.DEPARTMENTS.DETAIL(id)` | GET | Détails d'un département |
| `API_ENDPOINTS.HR.DEPARTMENTS.UPDATE(id)` | PUT/PATCH | Modifier un département |
| `API_ENDPOINTS.HR.DEPARTMENTS.DELETE(id)` | DELETE | Supprimer un département |

**Chemin réel:** `/hr/departments/...`

**⚠️ Note:** Ces endpoints sont des placeholders. Le module HR n'est pas encore implémenté.

---

## 🎯 Utilisation dans les services

### Exemple: Service d'authentification

```typescript
// lib/services/core/auth.service.ts
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export const authService = {
  async login(credentials) {
    return apiClient.post(API_ENDPOINTS.CORE.AUTH.LOGIN, credentials);
  },

  async getCurrentUser() {
    return apiClient.get(API_ENDPOINTS.CORE.AUTH.ME);
  },
};
```

### Exemple: Service d'organisations

```typescript
// lib/services/core/organization.service.ts
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export const organizationService = {
  async getAll() {
    return apiClient.get(API_ENDPOINTS.CORE.ORGANIZATIONS.LIST);
  },

  async create(data) {
    return apiClient.post(API_ENDPOINTS.CORE.ORGANIZATIONS.CREATE, data);
  },

  async update(id, data) {
    return apiClient.patch(API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE(id), data);
  },
};
```

---

## 🔐 Authentification

Tous les endpoints (sauf AUTH.REGISTER, AUTH.LOGIN, AUTH.REFRESH) nécessitent un token JWT.

**Le client API gère automatiquement:**
- Ajout du token aux en-têtes
- Rafraîchissement automatique du token expiré
- Redirection vers /login si authentification échouée

**Utilisation:**
```typescript
// Pas besoin de gérer les tokens manuellement
const user = await apiClient.get(API_ENDPOINTS.CORE.AUTH.ME);
// Le token est automatiquement ajouté aux en-têtes
```

---

## 📝 Format des réponses

### Succès

```json
{
  "id": "uuid",
  "name": "Ma Super Entreprise",
  "created_at": "2025-11-17T10:00:00Z",
  ...
}
```

### Erreur

```json
{
  "message": "Message d'erreur",
  "detail": "Détails de l'erreur",
  ...
}
```

---

## 🔄 Ajouter un nouveau endpoint

### 1. Ajouter dans config.ts

```typescript
export const API_ENDPOINTS = {
  CORE: {
    // Nouveau endpoint
    PRODUCTS: {
      LIST: '/products/',
      CREATE: '/products/',
      DETAIL: (id: string) => `/products/${id}/`,
    },
  },
}
```

### 2. Utiliser dans un service

```typescript
export const productService = {
  async getAll() {
    return apiClient.get(API_ENDPOINTS.CORE.PRODUCTS.LIST);
  },
};
```

---

## 📊 Tableau récapitulatif

### Module CORE

| Resource | LIST | CREATE | DETAIL | UPDATE | DELETE | Actions |
|----------|------|--------|--------|--------|--------|---------|
| Auth | - | ✅ | ✅ | - | - | LOGIN, LOGOUT, REFRESH |
| Organizations | ✅ | ✅ | ✅ | ✅ | ✅ | ACTIVATE, DEACTIVATE |
| Categories | ✅ | - | ✅ | - | - | - |

### Module HR (Placeholder)

| Resource | LIST | CREATE | DETAIL | UPDATE | DELETE |
|----------|------|--------|--------|--------|--------|
| Employees | 🚧 | 🚧 | 🚧 | 🚧 | 🚧 |
| Departments | 🚧 | 🚧 | 🚧 | 🚧 | 🚧 |

---

## 💡 Bonnes pratiques

1. **Toujours utiliser `API_ENDPOINTS`**
   ```typescript
   // ✅ BON
   apiClient.get(API_ENDPOINTS.CORE.ORGANIZATIONS.LIST)

   // ❌ MAUVAIS
   apiClient.get('/organizations/')
   ```

2. **Utiliser les services au lieu d'appeler directement l'API**
   ```typescript
   // ✅ BON
   import { organizationService } from '@/lib/services/core';
   const orgs = await organizationService.getAll();

   // ❌ MAUVAIS
   import { apiClient, API_ENDPOINTS } from '@/lib/api';
   const orgs = await apiClient.get(API_ENDPOINTS.CORE.ORGANIZATIONS.LIST);
   ```

3. **Gérer les erreurs**
   ```typescript
   import { ApiError } from '@/lib/api/client';

   try {
     const orgs = await organizationService.getAll();
   } catch (error) {
     if (error instanceof ApiError) {
       console.error('Status:', error.status);
       console.error('Message:', error.message);
     }
   }
   ```

---

## 📞 Support

- **Configuration**: `lib/api/config.ts`
- **Client API**: `lib/api/client.ts`
- **Services**: `lib/services/core/`
- **Documentation API Backend**: `/backend/app/ORGANISATION_API.md`

---

**Tous les endpoints sont maintenant organisés et documentés !** 📡
