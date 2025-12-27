# Frontend Loura - Guide d'intégration

Ce document décrit l'intégration du frontend Next.js avec l'API Django backend pour la gestion des organisations.

## 🚀 Démarrage rapide

### 1. Installation des dépendances

```bash
pnpm install
# ou
npm install
# ou
yarn install
```

### 2. Configuration de l'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/core
```

### 3. Lancer le serveur de développement

```bash
pnpm dev
# ou
npm run dev
# ou
yarn dev
```

Le frontend sera accessible sur [http://localhost:3000](http://localhost:3000)

---

## 📁 Structure du projet

```
lourafrontend/
├── app/                          # App Router Next.js 16
│   ├── login/                    # Page de connexion
│   ├── register/                 # Page d'inscription
│   ├── dashboard/                # Dashboard principal
│   │   └── organizations/
│   │       └── create/           # Création d'organisation
│   ├── layout.tsx                # Layout racine
│   └── page.tsx                  # Page d'accueil
├── lib/
│   ├── api/
│   │   ├── client.ts             # Client API avec gestion JWT
│   │   └── config.ts             # Configuration API
│   ├── services/
│   │   ├── auth.service.ts       # Service d'authentification
│   │   ├── category.service.ts  # Service des catégories
│   │   ├── organization.service.ts # Service des organisations
│   │   └── index.ts              # Export centralisé
│   ├── types/
│   │   └── index.ts              # Types TypeScript
│   └── utils.ts                  # Utilitaires
└── public/                       # Fichiers statiques
```

---

## 🔑 Authentification

### Inscription

```typescript
import { authService } from '@/lib/services';

const handleRegister = async () => {
  const response = await authService.register({
    email: 'user@example.com',
    first_name: 'John',
    last_name: 'Doe',
    password: 'SecurePassword123!',
    password_confirm: 'SecurePassword123!',
  });

  // Les tokens sont automatiquement stockés
  console.log('Utilisateur créé:', response.user);
};
```

### Connexion

```typescript
const handleLogin = async () => {
  const response = await authService.login({
    email: 'user@example.com',
    password: 'SecurePassword123!',
  });

  console.log('Utilisateur connecté:', response.user);
};
```

### Déconnexion

```typescript
const handleLogout = async () => {
  await authService.logout();
  // Les tokens sont automatiquement supprimés
};
```

### Vérifier l'authentification

```typescript
const isLoggedIn = authService.isAuthenticated();
const currentUser = authService.getStoredUser();
```

---

## 🏢 Gestion des organisations

### Lister les organisations

```typescript
import { organizationService } from '@/lib/services';

const loadOrganizations = async () => {
  const organizations = await organizationService.getAll();
  console.log(organizations);
};
```

### Créer une organisation

```typescript
const createOrganization = async () => {
  const newOrg = await organizationService.create({
    name: 'Ma Super Entreprise',
    subdomain: 'super-entreprise',
    category: 1,
    logo_url: 'https://example.com/logo.png',
    settings: {
      country: 'GN',
      currency: 'GNF',
      theme: 'light',
      contact_email: 'contact@example.com',
    },
  });

  console.log('Organisation créée:', newOrg);
};
```

### Modifier une organisation

```typescript
// Modification partielle (PATCH)
const updateOrganization = async (id: string) => {
  const updated = await organizationService.update(id, {
    name: 'Nouveau nom',
    category: 2,
  });

  console.log('Organisation modifiée:', updated);
};

// Modification complète (PUT)
const replaceOrganization = async (id: string) => {
  const replaced = await organizationService.replace(id, {
    name: 'Nouveau nom',
    subdomain: 'nouveau-subdomain',
    // ... tous les champs requis
  });
};
```

### Activer/Désactiver

```typescript
// Activer
await organizationService.activate(orgId);

// Désactiver
await organizationService.deactivate(orgId);
```

### Supprimer

```typescript
await organizationService.delete(orgId);
```

---

## 📂 Gestion des catégories

### Lister les catégories

```typescript
import { categoryService } from '@/lib/services';

const loadCategories = async () => {
  const categories = await categoryService.getAll();
  console.log(categories);
};
```

### Obtenir une catégorie

```typescript
const category = await categoryService.getById(1);
```

---

## 🎨 Types TypeScript

Tous les types sont définis dans `lib/types/index.ts` :

```typescript
import type {
  AdminUser,
  Organization,
  Category,
  OrganizationCreateData,
  OrganizationUpdateData,
  LoginCredentials,
  RegisterData,
} from '@/lib/types';
```

---

## 🛠️ Gestion des erreurs

```typescript
import { ApiError } from '@/lib/api/client';

try {
  const result = await organizationService.create(data);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Data:', error.data);
  } else {
    console.error('Erreur inattendue:', error);
  }
}
```

---

## 🔒 Protection des routes

Pour protéger une route, vérifiez l'authentification :

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Votre contenu protégé
  return <div>...</div>;
}
```

---

## 📝 Stockage local

Les données suivantes sont stockées dans `localStorage` :

- `access_token` : Token d'accès JWT
- `refresh_token` : Token de rafraîchissement JWT
- `user` : Informations de l'utilisateur (JSON)

Le client API gère automatiquement :
- L'ajout du token aux requêtes
- Le rafraîchissement du token expiré
- La déconnexion automatique en cas d'échec

---

## 🚦 Pages disponibles

| Route | Description | Protection |
|-------|-------------|-----------|
| `/` | Page d'accueil | Publique |
| `/login` | Connexion | Publique |
| `/register` | Inscription | Publique |
| `/dashboard` | Dashboard principal | Protégée |
| `/dashboard/organizations/create` | Création d'organisation | Protégée |

---

## 🔄 Rafraîchissement automatique des tokens

Le client API gère automatiquement le rafraîchissement des tokens :

1. Quand une requête retourne 401 (Unauthorized)
2. Le client tente de rafraîchir le token avec le `refresh_token`
3. Si réussi, la requête originale est relancée
4. Si échec, redirection vers `/login`

---

## 🎯 Prochaines étapes

1. **Middleware d'authentification** : Créer un middleware Next.js pour protéger les routes
2. **Context API** : Utiliser React Context pour gérer l'état utilisateur globalement
3. **React Hook Form** : Intégrer pour une meilleure gestion des formulaires
4. **Zod** : Ajouter la validation côté client
5. **TanStack Query** : Pour le cache et la gestion des états de requêtes
6. **Page d'édition** : Créer la page d'édition d'organisation
7. **Upload de fichiers** : Implémenter l'upload de logos
8. **Pagination** : Ajouter la pagination pour les listes longues

---

## 🐛 Débogage

### Activer les logs du client API

```typescript
// Dans lib/api/client.ts, ajoutez des console.log

private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  console.log('API Request:', endpoint, options);
  // ...
  console.log('API Response:', data);
  return data;
}
```

### Vérifier les tokens

```typescript
import { tokenManager } from '@/lib/api/client';

console.log('Access Token:', tokenManager.getAccessToken());
console.log('Refresh Token:', tokenManager.getRefreshToken());
console.log('User:', tokenManager.getUser());
```

---

## 📞 Support

Pour toute question :
- Backend API : Consultez `/backend/app/ORGANISATION_API.md`
- Types : Consultez `/lib/types/index.ts`
- Services : Consultez `/lib/services/*.ts`

---

## ✅ Checklist avant déploiement

- [ ] Configurer `NEXT_PUBLIC_API_URL` pour la production
- [ ] Activer HTTPS pour les cookies sécurisés
- [ ] Configurer CORS sur le backend
- [ ] Tester le rafraîchissement des tokens
- [ ] Vérifier la protection des routes
- [ ] Optimiser les images
- [ ] Ajouter les meta tags SEO
- [ ] Configurer les variables d'environnement

---

## 🎉 Conclusion

Le frontend est maintenant prêt à communiquer avec l'API Django backend. Vous pouvez :
- ✅ S'inscrire et se connecter
- ✅ Créer, modifier, afficher et supprimer des organisations
- ✅ Gérer les catégories
- ✅ Activer/désactiver des organisations

Bonne intégration ! 🚀
