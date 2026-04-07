# Gestion des modules dans la page d'édition d'organisation

## 📋 Vue d'ensemble

La page d'édition d'organisation (`/core/dashboard/organizations/[id]/edit`) a été améliorée avec un **gestionnaire de modules professionnel et intuitif** qui permet d'activer/désactiver les modules en temps réel.

---

## ✨ Nouvelles fonctionnalités

### 1. **Section Modules fonctionnels**

Une nouvelle section a été ajoutée à la page d'édition avec :

- **Affichage des modules actifs** : Cartes vertes avec badge "Actif"
- **Affichage des modules disponibles** : Cartes grises cliquables
- **Boutons d'action** : Activer/Désactiver avec feedback visuel
- **Protection des modules core** : Impossible de désactiver les modules obligatoires
- **Indication des dépendances** : Badges montrant les modules requis

### 2. **Design professionnel**

#### Modules actifs
- Fond **vert clair** (`emerald-50/50`)
- Bordure **verte** (`emerald-200`)
- Icône colorée dans un cercle vert
- Badge "Core" pour les modules obligatoires
- Bouton "Désactiver" (rouge) ou "Obligatoire" (grisé)

#### Modules disponibles
- Fond **gris clair** (`muted/30`)
- Bordure standard
- Icône grisée
- Bouton "Activer" (bleu primaire)
- Effet hover avec bordure primaire

### 3. **Interactions utilisateur**

#### Activation d'un module
1. Cliquer sur le bouton **"Activer"** d'un module disponible
2. Le bouton affiche **"Activation..."** avec spinner
3. Appel API : `POST /api/core/organization-modules/{id}/enable/`
4. Le module passe dans la section "Modules actifs"
5. Feedback visuel immédiat

#### Désactivation d'un module
1. Cliquer sur le bouton **"Désactiver"** d'un module actif (non-core)
2. Le bouton affiche **"Traitement..."** avec spinner
3. Appel API : `POST /api/core/organization-modules/{id}/disable/`
4. Le module passe dans la section "Modules disponibles"
5. Feedback visuel immédiat

---

## 🔧 Architecture technique

### Composant principal

**Fichier:** `/components/core/organization-module-manager.tsx`

```tsx
<OrganizationModuleManager organizationId={organizationId} />
```

#### Props
- `organizationId` : ID de l'organisation à gérer

#### État interne
- `allModules` : Tous les modules disponibles dans le système
- `orgModules` : Modules de l'organisation (activés + désactivés)
- `processingModules` : Set des IDs de modules en cours de traitement
- `loading` : État de chargement
- `error` : Message d'erreur éventuel

### Service API

**Fichier:** `/lib/services/core/organization-module.service.ts`

```typescript
export const organizationModuleService = {
  async getAll(): Promise<OrganizationModule[]>
  async enable(id: string): Promise<{...}>
  async disable(id: string): Promise<{...}>
}
```

### Types TypeScript

```typescript
interface OrganizationModule {
  id: string;
  module: string;
  module_details: Module;
  is_enabled: boolean;
  settings: OrganizationModuleSettings;
  enabled_at: string;
  enabled_by: string | null;
}
```

---

## 🎨 Interface utilisateur

### Structure de la page

```
┌─────────────────────────────────────────────────┐
│  Configurer l'organisation         [← Retour]  │
│  Modifiez les informations...                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │  Identité        │  │  État du compte  │    │
│  │  - Nom           │  │  - Statut: Actif │    │
│  │  - Catégorie     │  │  - Créé le...    │    │
│  │  - Sous-domaine  │  │                  │    │
│  └──────────────────┘  │  [Zone de danger]│    │
│                        └──────────────────┘    │
│  ┌──────────────────┐                          │
│  │  Régionalisation │                          │
│  │  - Pays          │                          │
│  │  - Devise        │                          │
│  │  - Email contact │                          │
│  └──────────────────┘                          │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  📦 Modules fonctionnels                 │  │
│  │                                           │  │
│  │  ✅ Modules actifs (4)                   │  │
│  │  ┌─────────────────────────────────┐    │  │
│  │  │ 👥 Gestion des employés   [Core]│    │  │
│  │  │ Module pour gérer...             │    │  │
│  │  │                      [Obligatoire]    │  │
│  │  └─────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────┐    │  │
│  │  │ 💰 Module de paie                │    │  │
│  │  │ Fiches de paie...                │    │  │
│  │  │ • Requiert: Gestion employés     │    │  │
│  │  │                      [Désactiver]     │  │
│  │  └─────────────────────────────────┘    │  │
│  │                                           │  │
│  │  ❌ Modules disponibles (2)             │  │
│  │  ┌─────────────────────────────────┐    │  │
│  │  │ ⏰ Module de pointage            │    │  │
│  │  │ Suivi des présences...           │    │  │
│  │  │                         [Activer]     │  │
│  │  └─────────────────────────────────┘    │  │
│  │                                           │  │
│  │  ℹ️ À propos des modules                │  │
│  │  • Les modules Core sont obligatoires   │  │
│  │  • Certains modules ont des dépendances │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│                    [Annuler]  [Enregistrer]     │
└─────────────────────────────────────────────────┘
```

### États visuels

#### Module actif (activé)
```
┌─────────────────────────────────────────────┐
│ [Icône verte]  Gestion des employés  [Core]│
│                                              │
│ Module complet pour gérer les employés...   │
│                                              │
│                            [Obligatoire]     │  (si core)
│                            [Désactiver]      │  (si non-core)
└─────────────────────────────────────────────┘
  ↑ Fond vert clair, bordure verte
```

#### Module disponible (désactivé)
```
┌─────────────────────────────────────────────┐
│ [Icône grise]  Module de pointage          │
│                                              │
│ Suivi des présences et heures de travail... │
│                                              │
│ • Requiert: Gestion des employés            │
│                               [Activer]      │
└─────────────────────────────────────────────┘
  ↑ Fond gris clair, bordure standard
```

#### Module en traitement
```
┌─────────────────────────────────────────────┐
│ [Icône]  Nom du module                      │
│                                              │
│ Description...                               │
│                                              │
│                   [⟳ Traitement...]          │
└─────────────────────────────────────────────┘
  ↑ Bouton désactivé avec spinner
```

---

## 🔄 Flux de données

### Chargement initial

```
1. Composant monté
   ↓
2. loadData()
   ↓
3. Promise.all([
     moduleService.getAll(),          // Tous les modules du système
     organizationModuleService.getAll() // Modules de l'org
   ])
   ↓
4. Grouper par état (actifs / disponibles)
   ↓
5. Affichage
```

### Activation d'un module

```
1. Utilisateur clique "Activer"
   ↓
2. Ajouter ID au Set processingModules
   ↓
3. organizationModuleService.enable(id)
   ↓
4. API: POST /api/core/organization-modules/{id}/enable/
   ↓
5. Recharger les données (loadData)
   ↓
6. Retirer ID du Set processingModules
   ↓
7. Affichage mis à jour
```

### Désactivation d'un module

```
1. Utilisateur clique "Désactiver"
   ↓
2. Ajouter ID au Set processingModules
   ↓
3. organizationModuleService.disable(id)
   ↓
4. API: POST /api/core/organization-modules/{id}/disable/
   ↓
5. Recharger les données (loadData)
   ↓
6. Retirer ID du Set processingModules
   ↓
7. Affichage mis à jour
```

---

## 🎯 Cas d'usage

### Cas 1 : Activer le module de pointage

**Contexte:** Une entreprise commence avec les modules de base et souhaite ajouter le pointage.

**Actions:**
1. Accéder à la page d'édition de l'organisation
2. Scroller jusqu'à la section "Modules fonctionnels"
3. Trouver "Module de pointage" dans "Modules disponibles"
4. Cliquer sur **"Activer"**
5. Le module passe dans "Modules actifs"
6. ✅ Les employés peuvent maintenant pointer

### Cas 2 : Désactiver le module de paie

**Contexte:** Une petite entreprise n'utilise pas le module de paie et souhaite le désactiver.

**Actions:**
1. Accéder à la page d'édition de l'organisation
2. Scroller jusqu'à la section "Modules fonctionnels"
3. Trouver "Module de paie" dans "Modules actifs"
4. Cliquer sur **"Désactiver"**
5. Le module passe dans "Modules disponibles"
6. ✅ Le module n'est plus accessible dans le menu

### Cas 3 : Tentative de désactivation d'un module core

**Contexte:** Un utilisateur essaie de désactiver "Gestion des employés".

**Actions:**
1. Accéder à la section modules
2. Trouver "Gestion des employés" avec badge **[Core]**
3. Le bouton affiche **"Obligatoire"** (grisé)
4. Tooltip : "Ce module ne peut pas être désactivé"
5. ❌ Impossible de désactiver

---

## 🔒 Règles de gestion

### Modules Core
- **Ne peuvent PAS être désactivés**
- Badge "Core" affiché
- Bouton "Obligatoire" grisé
- Tooltip explicatif

### Modules avec dépendances
- Affichage des badges "Requiert: ..."
- La désactivation ne vérifie PAS automatiquement les dépendances inverses
- ⚠️ **TODO futur** : Vérifier qu'aucun module actif ne dépend du module à désactiver

### Modules standards
- Peuvent être activés/désactivés librement
- Changement immédiat
- Pas de confirmation demandée (action réversible)

---

## 🚀 Améliorations futures possibles

### Court terme
1. **Confirmation de désactivation**
   - Modal de confirmation avant désactivation
   - Message d'avertissement si des fonctionnalités sont en cours d'utilisation

2. **Vérification des dépendances inverses**
   - Empêcher la désactivation si un autre module actif en dépend
   - Afficher la liste des modules dépendants

3. **Statistiques d'utilisation**
   - Afficher le nombre d'utilisations du module
   - Date de dernière utilisation

### Long terme
1. **Configuration des modules**
   - Paramètres spécifiques par module
   - Modal de configuration à l'activation

2. **Permissions par module**
   - Restreindre l'accès aux fonctionnalités selon les modules
   - Menu dynamique selon les modules activés

3. **Tarification par module**
   - Afficher le coût de chaque module
   - Calcul automatique de la facture

4. **Modules marketplace**
   - Modules tiers développés par la communauté
   - Système d'installation/désinstallation

---

## 📝 Documentation technique

### Fichiers créés/modifiés

#### Nouveaux fichiers
- ✅ `/lib/services/core/organization-module.service.ts`
- ✅ `/components/core/organization-module-manager.tsx`

#### Fichiers modifiés
- ✅ `/lib/services/core/index.ts` (export du service)
- ✅ `/components/core/index.ts` (export du composant)
- ✅ `/app/core/dashboard/organizations/[id]/edit/page.tsx` (intégration)

### API utilisées

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/core/modules/` | GET | Liste tous les modules |
| `/api/core/organization-modules/` | GET | Modules de l'organisation |
| `/api/core/organization-modules/{id}/enable/` | POST | Activer un module |
| `/api/core/organization-modules/{id}/disable/` | POST | Désactiver un module |

---

## 🧪 Tests

### Tests manuels recommandés

1. **Test d'activation**
   ```
   1. Aller sur /core/dashboard/organizations/{id}/edit
   2. Identifier un module désactivé
   3. Cliquer "Activer"
   4. Vérifier qu'il passe dans "Modules actifs"
   5. Rafraîchir la page → Le module reste actif
   ```

2. **Test de désactivation**
   ```
   1. Identifier un module actif (non-core)
   2. Cliquer "Désactiver"
   3. Vérifier qu'il passe dans "Modules disponibles"
   4. Rafraîchir la page → Le module reste désactivé
   ```

3. **Test modules core**
   ```
   1. Identifier "Gestion des employés" ou "Permissions"
   2. Vérifier le badge [Core]
   3. Vérifier le bouton "Obligatoire" grisé
   4. Tenter de cliquer → Aucun effet
   ```

4. **Test de chargement**
   ```
   1. Charger la page
   2. Vérifier l'affichage du loader
   3. Vérifier que les modules s'affichent correctement
   4. Vérifier le compteur "X / Y activés"
   ```

5. **Test d'erreur**
   ```
   1. Désactiver le backend
   2. Tenter d'activer un module
   3. Vérifier l'affichage d'un message d'erreur
   ```

---

## 🎨 Design system

### Couleurs utilisées

#### Modules actifs
- Fond : `bg-emerald-50/50 dark:bg-emerald-950/20`
- Bordure : `border-emerald-200 dark:border-emerald-800`
- Icône : `text-emerald-600 dark:text-emerald-400`
- Badge Core : `variant="outline"`

#### Modules disponibles
- Fond : `bg-muted/30`
- Bordure : `border-border`
- Icône : `text-muted-foreground`
- Hover : `hover:border-primary/50`

#### Boutons
- Activer : `bg-primary text-primary-foreground`
- Désactiver : `text-destructive border-destructive/20`
- Obligatoire : `bg-muted text-muted-foreground opacity-50`

### Icônes

- Modules actifs : `CheckCircle` (vert)
- Modules disponibles : `XCircle` (gris)
- Activer : `Power`
- Désactiver : `PowerOff`
- Loading : `Loader2` (avec animation spin)
- Info : `Package` (bleu)

---

## ✅ Checklist d'implémentation

- [x] Service API `organization-module.service.ts`
- [x] Composant `OrganizationModuleManager`
- [x] Intégration dans la page d'édition
- [x] Gestion du loading
- [x] Gestion des erreurs
- [x] Protection des modules core
- [x] Affichage des dépendances
- [x] Design professionnel
- [x] Feedback visuel (spinners)
- [x] Boîte d'information
- [x] Responsive design
- [x] Documentation

---

**URL de test:** http://localhost:3000/core/dashboard/organizations/[id]/edit

**Date de création:** 2026-03-12
**Version:** 1.0.0
