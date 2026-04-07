# Implémentation du système de gestion des modules d'organisation

## 📋 Vue d'ensemble

Le système de **gestion des modules** a été entièrement implémenté pour permettre une activation/désactivation flexible des fonctionnalités selon la catégorie d'organisation. Ce document récapitule l'implémentation complète du backend et du frontend.

---

## 🎯 Objectifs atteints

✅ **Architecture modulaire et extensible**
✅ **Pré-sélection automatique des modules selon la catégorie**
✅ **Formulaire multi-étapes pour la création d'organisation**
✅ **API REST complète pour gérer les modules**
✅ **Interface utilisateur intuitive et moderne**

---

## 🔧 Backend (Django)

### 1. Modèles de données

**Fichier:** `/backend/app/core/models.py`

#### Module
```python
class Module(TimeStampedModel):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    app_name = models.CharField(max_length=50)
    icon = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=50, default='general')
    default_for_all = models.BooleanField(default=False)
    default_categories = models.JSONField(default=list, blank=True)
    is_core = models.BooleanField(default=False)
    depends_on = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
```

#### OrganizationModule
```python
class OrganizationModule(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    is_enabled = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)
    enabled_by = models.ForeignKey(BaseUser, on_delete=models.SET_NULL, null=True)
```

### 2. Système de Registry

**Fichier:** `/backend/app/core/modules.py`

- `ModuleDefinition` : Classe pour définir un module
- `ModuleRegistry` : Registry centralisé
- **6 modules RH définis** :
  - `hr.employees` (Gestion des employés) - **Core**
  - `hr.permissions` (Permissions et rôles) - **Core**
  - `hr.payroll` (Module de paie)
  - `hr.leave` (Module de congés)
  - `hr.attendance` (Module de pointage)
  - `hr.contracts` (Gestion des contrats)

### 3. Management Commands

#### `initialize_modules`
```bash
python manage.py initialize_modules
# Options: --dry-run, --force
```
Initialise ou met à jour les modules dans la base de données.

#### `create_sample_categories`
```bash
python manage.py create_sample_categories --with-modules
```
Crée les catégories et affiche les modules par défaut.

### 4. API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/core/modules/` | Liste tous les modules |
| GET | `/api/core/modules/defaults/?category_id=X` | Modules par défaut pour une catégorie |
| GET | `/api/core/modules/by_category/` | Modules groupés par catégorie |
| GET | `/api/core/organization-modules/` | Modules d'une organisation |
| POST | `/api/core/organization-modules/{id}/enable/` | Activer un module |
| POST | `/api/core/organization-modules/{id}/disable/` | Désactiver un module |
| POST | `/api/core/organizations/` | Créer une organisation avec modules |

### 5. Serializers

- `ModuleSerializer` : Sérialisation des modules
- `OrganizationModuleSerializer` : Relation organisation-module
- `OrganizationCreateSerializer` : Création avec modules automatiques ou manuels
- `OrganizationSerializer` : Inclut les modules activés

### 6. Mapping Catégories → Modules

| Catégorie | Modules par défaut |
|-----------|-------------------|
| **Technologie** | employees, payroll, leave, contracts, permissions (5) |
| **Commerce** | employees, payroll, leave, attendance, contracts, permissions (6) |
| **Restauration** | employees, leave, attendance, permissions (4) |
| **Agriculture** | employees, attendance, permissions (3) |
| **Agence de voyage** | employees, permissions (2) |

*17 catégories configurées au total*

---

## 💻 Frontend (Next.js)

### 1. Types TypeScript

**Fichier:** `/frontend/lourafrontend/lib/types/core/index.ts`

```typescript
export interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  app_name: string;
  icon: string;
  category: string;
  default_for_all: boolean;
  default_categories: string[];
  requires_subscription_tier: string;
  depends_on: string[];
  is_core: boolean;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleCreateData {
  module_code: string;
  is_enabled?: boolean;
  settings?: OrganizationModuleSettings;
}
```

### 2. Service API

**Fichier:** `/frontend/lourafrontend/lib/services/core/module.service.ts`

```typescript
export const moduleService = {
  async getAll(): Promise<Module[]>
  async getById(id: string): Promise<Module>
  async getDefaultModules(params): Promise<DefaultModulesResponse>
  async getByCategory(): Promise<Record<string, Module[]>>
}
```

### 3. Composants React

#### `ModuleSelector`
**Fichier:** `/frontend/lourafrontend/components/core/module-selector.tsx`

- Affichage des modules avec icônes
- Sélection/désélection (modules non-core)
- Affichage des dépendances
- Groupement par catégorie
- Indicateur "Obligatoire" pour modules core

#### `OrganizationWizard`
**Fichier:** `/frontend/lourafrontend/components/core/organization-wizard.tsx`

Formulaire **multi-étapes** (5 étapes) :

1. **Informations de base**
   - Nom de l'organisation
   - Upload du logo
   - Sous-domaine (auto-généré)

2. **Catégorie d'activité**
   - Sélection parmi 17 catégories
   - Info sur l'impact sur les modules

3. **Modules fonctionnels**
   - Sélection des modules
   - Pré-sélection automatique selon catégorie
   - Modules core verrouillés

4. **Paramètres régionaux**
   - Pays (QuickSelect)
   - Devise (QuickSelect)
   - Email de contact

5. **Validation**
   - Récapitulatif complet
   - Création de l'organisation

**Fonctionnalités:**
- Indicateur de progression (step indicator)
- Navigation avant/arrière
- Validation à chaque étape
- Preview en temps réel
- Gestion des erreurs

### 4. Page de création

**Fichier:** `/frontend/lourafrontend/app/core/dashboard/organizations/create/page.tsx`

```tsx
'use client';

import { OrganizationWizard } from '@/components/core';

export default function CreateOrganizationPage() {
  return <OrganizationWizard />;
}
```

### 5. Configuration API

**Fichier:** `/frontend/lourafrontend/lib/api/config.ts`

```typescript
CORE: {
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
  },
}
```

---

## 🚀 Utilisation

### Backend

1. **Initialiser les modules**
   ```bash
   cd /home/salim/Projets/loura/stack/backend/app
   python manage.py initialize_modules
   ```

2. **Créer les catégories**
   ```bash
   python manage.py create_sample_categories --with-modules
   ```

3. **Lancer le serveur**
   ```bash
   python manage.py runserver
   ```

### Frontend

1. **Installer les dépendances**
   ```bash
   cd /home/salim/Projets/loura/stack/frontend/lourafrontend
   pnpm install
   ```

2. **Lancer le dev server**
   ```bash
   pnpm dev
   ```

3. **Accéder à la page de création**
   ```
   http://localhost:3000/core/dashboard/organizations/create
   ```

---

## 📊 Flux de création d'organisation

### Scénario 1 : Activation automatique (Recommandé)

```json
POST /api/core/organizations/
{
  "name": "Mon Entreprise Tech",
  "subdomain": "mon-entreprise-abc123",
  "category": 1,  // Technologie
  "settings": {
    "currency": "GNF",
    "country": "GN"
  }
}
```

**Résultat:** 5 modules automatiquement activés selon la catégorie

### Scénario 2 : Activation manuelle

```json
POST /api/core/organizations/
{
  "name": "Mon Entreprise",
  "subdomain": "mon-entreprise-abc123",
  "category": 1,
  "modules": [
    { "module_code": "hr.employees", "is_enabled": true },
    { "module_code": "hr.payroll", "is_enabled": true },
    { "module_code": "hr.leave", "is_enabled": true }
  ],
  "settings": { "currency": "GNF", "country": "GN" }
}
```

**Résultat:** Seuls les modules spécifiés sont activés

---

## 🎨 Captures d'écran du parcours

### Étape 1 : Informations
- Champ nom avec auto-génération du sous-domaine
- Upload de logo (drag & drop ou sélection)
- Preview en temps réel

### Étape 2 : Catégorie
- Liste déroulante des 17 catégories
- Info bulle sur l'impact des modules

### Étape 3 : Modules
- Grille de modules avec icônes
- Badges "Obligatoire" pour les core
- Indication des dépendances
- Compteur de modules sélectionnés

### Étape 4 : Paramètres
- QuickSelect pour pays (recherche)
- QuickSelect pour devise
- Email de contact optionnel

### Étape 5 : Validation
- Récapitulatif complet
- Liste des modules sélectionnés
- Bouton "Créer l'organisation"

---

## 📝 Documentation technique

### Backend
- `/backend/app/core/MODULE_SYSTEM.md` : Documentation complète du système de modules

### Architecture
- **Modèle de données :** Module + OrganizationModule
- **Registry centralisé :** ModuleRegistry dans `modules.py`
- **Management commands :** `initialize_modules`, `create_sample_categories`
- **API REST :** ViewSets pour Module et OrganizationModule

### Extensibilité

Pour ajouter un nouveau module :

1. **Définir dans `core/modules.py`**
   ```python
   NEW_MODULE = ModuleDefinition(
       code='hr.performance',
       name='Évaluation des performances',
       description='...',
       app_name='hr',
       icon='TrendingUp',
       category='hr',
       default_categories=['Technologie', 'Services'],
       depends_on=['hr.employees'],
       order=7
   )
   ```

2. **Ajouter au registry**
   ```python
   def register_all_modules():
       modules = [
           EMPLOYEES_MODULE,
           # ...
           NEW_MODULE,  # ← Ajouter ici
       ]
   ```

3. **Initialiser**
   ```bash
   python manage.py initialize_modules
   ```

---

## ✅ Tests recommandés

### Backend
```bash
# Test de création avec modules auto
curl -X POST http://localhost:8000/api/core/organizations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Org", "subdomain": "test-org-123", "category": 1}'

# Vérifier les modules
curl http://localhost:8000/api/core/modules/defaults/?category_id=1
```

### Frontend
1. Créer une organisation avec catégorie "Technologie" → Vérifier 5 modules pré-sélectionnés
2. Créer une organisation avec catégorie "Commerce" → Vérifier 6 modules pré-sélectionnés
3. Tester la désélection d'un module non-core
4. Tester l'upload de logo
5. Vérifier le récapitulatif avant validation

---

## 🐛 Dépannage

### Backend

**Problème:** `ModuleDoesNotExist` lors de la création
```bash
# Solution: Initialiser les modules
python manage.py initialize_modules
```

**Problème:** Catégories manquantes
```bash
# Solution: Créer les catégories
python manage.py create_sample_categories
```

### Frontend

**Problème:** `Cannot read property 'map' of undefined` sur modules
```typescript
// Vérifier que l'API retourne bien un tableau
const modules = await moduleService.getAll();
console.log(modules);
```

**Problème:** Modules non pré-sélectionnés
- Vérifier que la catégorie est bien sélectionnée
- Vérifier que `loadDefaultModules` est appelé
- Vérifier les modules dans la réponse API

---

## 📦 Fichiers créés/modifiés

### Backend
- ✅ `core/models.py` (Module, OrganizationModule)
- ✅ `core/modules.py` (Registry et définitions)
- ✅ `core/serializers.py` (ModuleSerializer, etc.)
- ✅ `core/views.py` (ModuleViewSet, OrganizationModuleViewSet)
- ✅ `core/urls.py` (Routes modules)
- ✅ `core/management/commands/initialize_modules.py`
- ✅ `core/management/commands/create_sample_categories.py` (modifié)
- ✅ `core/MODULE_SYSTEM.md` (documentation)

### Frontend
- ✅ `lib/types/core/index.ts` (types Module)
- ✅ `lib/api/config.ts` (endpoints modules)
- ✅ `lib/services/core/module.service.ts`
- ✅ `components/core/module-selector.tsx`
- ✅ `components/core/organization-wizard.tsx`
- ✅ `app/core/dashboard/organizations/create/page.tsx` (remplacé)

---

## 🎉 Résumé

Le système de gestion des modules est **entièrement fonctionnel** :

- ✅ 6 modules RH définis et initialisés
- ✅ 17 catégories d'organisations avec mapping modules
- ✅ API REST complète (CRUD + actions)
- ✅ Formulaire multi-étapes (5 étapes)
- ✅ Pré-sélection automatique selon catégorie
- ✅ Interface moderne et intuitive
- ✅ Documentation complète

**URL de test:** http://localhost:3000/core/dashboard/organizations/create

---

## 🔗 Liens utiles

- Backend API: http://localhost:8000/api/core/modules/
- Frontend: http://localhost:3000/core/dashboard/organizations/create
- Documentation backend: `/backend/app/core/MODULE_SYSTEM.md`
- Admin Django: http://localhost:8000/admin/

---

**Date d'implémentation:** 2026-03-12
**Version:** 1.0.0
**Auteur:** Claude Code + Équipe Loura
