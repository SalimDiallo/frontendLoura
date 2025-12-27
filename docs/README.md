# 🚀 Loura Frontend

Frontend Next.js 16 avec architecture modulaire pour l'application Loura.

## 📋 Vue d'ensemble

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Architecture**: Modulaire (inspirée du backend Django)
- **API**: REST avec JWT Authentication

## 🏗️ Architecture

```
lourafrontend/
├── app/                # Next.js App Router
├── components/         # Composants React
│   ├── ui/            # Composants UI réutilisables
│   ├── core/          # Composants module Core
│   └── hr/            # Composants module HR
├── lib/               # Logique métier
│   ├── api/          # Client API
│   ├── services/     # Services par module
│   │   ├── core/
│   │   └── hr/
│   └── types/        # Types par module
│       ├── core/
│       ├── hr/
│       └── shared/
└── public/           # Fichiers statiques
```

## 📦 Modules

### Core
- Authentification (AdminUser)
- Organisations
- Catégories

### HR (à venir)
- Employés
- Départements
- Permissions

## 🎨 Composants UI disponibles

### Composants réutilisables (`components/ui/`)
- `Button` - Bouton avec variantes et loading
- `Input` - Champ de saisie avec label et erreur
- `Select` - Liste déroulante
- `Card` - Container avec header, body, footer
- `Alert` - Messages d'alerte
- `Badge` - Badges de statut

### Composants Core (`components/core/`)
- `OrganizationCard` - Card d'organisation
- `OrganizationForm` - Formulaire d'organisation
- `StatsCard` - Card de statistique
- `AuthLayout` - Layout d'authentification
- `DashboardLayout` - Layout du dashboard

## 🚀 Démarrage

### Installation

```bash
pnpm install
```

### Configuration

```bash
# Copier le fichier d'environnement
cp .env.local.example .env.local

# Éditer si nécessaire
nano .env.local
```

### Lancement

```bash
# Développement
pnpm dev

# Build
pnpm build

# Production
pnpm start
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `ARCHITECTURE.md` | Architecture complète du projet |
| `COMPONENTS_GUIDE.md` | Guide d'utilisation des composants |
| `README_INTEGRATION.md` | Guide d'intégration avec l'API |
| `QUICK_START.md` | Démarrage rapide |

## 🔗 Liens utiles

- Backend: `/backend/app/`
- API Docs: `/backend/app/ORGANISATION_API.md`
- Architecture Backend: `/backend/app/CLAUDE.md`

## 📝 Exemples

### Utiliser les composants UI

```tsx
import { Button, Input, Alert } from '@/components/ui';

<Button variant="primary" isLoading={isLoading}>
  Enregistrer
</Button>

<Input
  label="Email"
  type="email"
  error={errors.email}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

<Alert variant="success">Opération réussie</Alert>
```

### Utiliser les services

```tsx
import { authService, organizationService } from '@/lib/services/core';
import type { Organization } from '@/lib/types/core';

// Authentification
await authService.login({ email, password });

// Organisations
const orgs = await organizationService.getAll();
const newOrg = await organizationService.create(data);
```

### Utiliser les composants Core

```tsx
import { OrganizationCard, OrganizationForm } from '@/components/core';

<OrganizationCard
  organization={org}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

<OrganizationForm
  categories={categories}
  onSubmit={handleCreate}
  isLoading={isLoading}
/>
```

## 🎯 Pages disponibles

| Route | Description | Module |
|-------|-------------|--------|
| `/` | Page d'accueil | - |
| `/login` | Connexion | Core |
| `/register` | Inscription | Core |
| `/dashboard` | Dashboard | Core |
| `/dashboard/organizations/create` | Création d'organisation | Core |

## 🔐 Authentification

L'authentification utilise JWT avec:
- Access token (15 min)
- Refresh token (7 jours)
- Stockage localStorage
- Rafraîchissement automatique

```tsx
import { authService } from '@/lib/services/core';

// Vérifier l'authentification
if (!authService.isAuthenticated()) {
  router.push('/login');
}

// Récupérer l'utilisateur
const user = authService.getStoredUser();
```

## 📦 Structure modulaire

### Ajouter un nouveau module

```bash
# 1. Créer la structure
mkdir -p lib/types/accounting
mkdir -p lib/services/accounting
mkdir -p components/accounting

# 2. Créer les types
touch lib/types/accounting/index.ts

# 3. Créer les services
touch lib/services/accounting/invoice.service.ts
touch lib/services/accounting/index.ts

# 4. Créer les composants
touch components/accounting/invoice-card.tsx
touch components/accounting/index.ts
```

Voir `ARCHITECTURE.md` pour plus de détails.

## ✅ Bonnes pratiques

1. **Imports**
   ```tsx
   // ✅ Depuis l'index du module
   import { Button } from '@/components/ui';
   import { authService } from '@/lib/services/core';

   // ❌ Direct du fichier
   import { Button } from '@/components/ui/button';
   ```

2. **Types**
   ```tsx
   // ✅ Toujours typer
   const [user, setUser] = useState<AdminUser | null>(null);

   // ❌ Sans type
   const [user, setUser] = useState(null);
   ```

3. **Composants**
   - Réutilisables → `components/ui/`
   - Spécifiques → `components/{module}/`

## 🛠️ Scripts

```bash
# Développement
pnpm dev

# Build
pnpm build

# Démarrer en production
pnpm start

# Linter
pnpm lint
```

## 🐛 Débogage

### Problèmes CORS

Vérifier `backend/app/lourabackend/settings.py`:
```python
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

### Tokens invalides

```javascript
// Dans la console du navigateur
localStorage.clear()
```

### Backend non accessible

```bash
# Vérifier que Django tourne
curl http://localhost:8000/api/core/categories/
```

## 📞 Support

- **Frontend**: Consultez `ARCHITECTURE.md` et `COMPONENTS_GUIDE.md`
- **Backend**: Consultez `/backend/app/ORGANISATION_API.md`
- **Intégration**: Consultez `README_INTEGRATION.md`

## 🎉 Fonctionnalités

### Disponibles
- ✅ Authentification (Login/Register/Logout)
- ✅ Dashboard avec statistiques
- ✅ Gestion des organisations (CRUD)
- ✅ Sélection de catégories
- ✅ Activation/Désactivation d'organisations
- ✅ Composants UI réutilisables
- ✅ Architecture modulaire

### À venir
- 🚧 Page d'édition d'organisation
- 🚧 Upload de logos
- 🚧 Module HR (Employés)
- 🚧 Pagination
- 🚧 Filtres et recherche
- 🚧 Thème sombre
- 🚧 Internationalisation

## 📄 Licence

Propriétaire - Loura

---

**Version**: 1.0.0
**Dernière mise à jour**: 2025-11-17

Développé avec ❤️ par l'équipe Loura
