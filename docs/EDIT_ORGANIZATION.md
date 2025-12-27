# ✏️ Page de Modification d'Organisation

## 📍 Emplacement

**Fichier:** `app/dashboard/organizations/[id]/edit/page.tsx`

**URL:** `/dashboard/organizations/{id}/edit`

---

## ✨ Fonctionnalités

### Chargement des données
- Récupère l'organisation existante par son ID
- Charge la liste des catégories disponibles
- Pré-remplit automatiquement le formulaire avec les données actuelles

### Formulaire de modification
- **Nom de l'organisation** (modifiable)
- **Sous-domaine** (lecture seule - non modifiable)
- **Catégorie** (sélection via dropdown)
- **URL du logo** (optionnel)
- **Paramètres:**
  - Pays (code ISO 2 lettres)
  - Devise (code ISO 3 lettres)
  - Thème (Clair/Sombre)
  - Email de contact

### Gestion du statut
- Affiche le statut actuel (Actif/Inactif)
- Badge visuel (vert = actif, rouge = inactif)
- Information: Le statut se modifie depuis le dashboard

### Actions
- **Annuler** → Retour au dashboard
- **Enregistrer** → Sauvegarde les modifications et retour au dashboard

---

## 🔧 Modifications Techniques

### 1. Nouveau fichier créé
```
app/dashboard/organizations/[id]/edit/page.tsx
```

### 2. Type mis à jour
**Fichier:** `lib/types/core/index.ts`

```typescript
export interface OrganizationUpdateData {
  name?: string;
  subdomain?: string;
  logo_url?: string;
  category?: number;
  is_active?: boolean;
  settings?: Partial<OrganizationSettings>;  // ← Ajouté
}
```

### 3. Gestion des valeurs par défaut
**✅ IMPORTANT:** Toutes les valeurs par défaut viennent de la base de données

```typescript
// ❌ AVANT - Valeurs hardcodées
const [formData, setFormData] = useState({
  name: '',
  logo_url: '',
  settings: {
    country: 'GN',      // ← Hardcodé
    currency: 'GNF',    // ← Hardcodé
    theme: 'light',     // ← Hardcodé
  },
});

// ✅ MAINTENANT - Vide au début, rempli depuis la BDD
const [formData, setFormData] = useState({});

// Chargement depuis la BDD
setFormData({
  name: orgData.name,                          // ← Depuis la BDD
  logo_url: orgData.logo_url || undefined,     // ← Depuis la BDD
  category: orgData.category || undefined,     // ← Depuis la BDD
  settings: {
    country: orgData.settings.country || undefined,      // ← Depuis la BDD
    currency: orgData.settings.currency,                 // ← Depuis la BDD
    theme: orgData.settings.theme || undefined,          // ← Depuis la BDD
    contact_email: orgData.settings.contact_email || undefined, // ← Depuis la BDD
  },
});
```

**Avantages:**
- ✅ Aucune valeur hardcodée par défaut
- ✅ Respect des données existantes dans la base
- ✅ Pas d'écrasement de valeurs vides avec des defaults
- ✅ Les inputs contrôlés utilisent `?? ''` pour afficher des chaînes vides si undefined

---

## 🚀 Utilisation

### Depuis le Dashboard

1. Cliquer sur le bouton **"Modifier"** sur une organisation
2. Modifier les champs souhaités
3. Cliquer sur **"Enregistrer les modifications"**

### Navigation directe

```
http://localhost:3000/dashboard/organizations/{organization-id}/edit
```

---

## 📝 Différences avec la page de création

| Fonctionnalité | Création | Modification |
|----------------|----------|--------------|
| Sous-domaine | Modifiable | **Lecture seule** |
| Chargement initial | Vide | **Pré-rempli** |
| API appelée | `POST /organizations/` | `PATCH /organizations/{id}/` |
| Titre | "Nouvelle Organisation" | "Modifier l'Organisation" |
| Affichage statut | Non | **Oui (lecture seule)** |

---

## 🔐 Sécurité

- Nécessite une authentification JWT
- Seul le propriétaire de l'organisation peut la modifier
- Le sous-domaine ne peut pas être changé (pour éviter les conflits)

---

## 🎯 API Endpoint utilisé

```typescript
// Service
organizationService.update(organizationId, formData)

// Endpoint
PATCH /api/core/organizations/{id}/

// Données envoyées
{
  name: "Nouveau nom",
  logo_url: "https://...",
  category: 1,
  settings: {
    country: "GN",
    currency: "GNF",
    theme: "light",
    contact_email: "contact@example.com"
  }
}
```

---

## 🧪 Test de la fonctionnalité

### 1. Démarrer le frontend
```bash
npm run dev
```

### 2. Naviguer vers le dashboard
```
http://localhost:3000/dashboard
```

### 3. Tester la modification
1. Cliquer sur **"Modifier"** sur une organisation existante
2. Changer le nom (ex: "Mon Entreprise Modifiée")
3. Changer la catégorie
4. Modifier les paramètres (devise, pays, etc.)
5. Cliquer sur **"Enregistrer les modifications"**
6. Vérifier que les changements apparaissent dans le dashboard

---

## 🐛 Gestion des erreurs

### Organisation introuvable (404)
- Affiche un message "Organisation introuvable"
- Redirige automatiquement vers le dashboard après 2 secondes

### Erreur de chargement
- Affiche l'erreur en haut du formulaire
- Badge rouge avec le message d'erreur

### Erreur de sauvegarde
- Affiche l'erreur en haut du formulaire
- Le formulaire reste rempli
- L'utilisateur peut corriger et réessayer

---

## 💡 Améliorations futures possibles

1. **Upload de logo**
   - Intégrer un système d'upload d'image
   - Au lieu d'une URL, permettre l'upload direct

2. **Prévisualisation**
   - Aperçu du logo avant sauvegarde
   - Prévisualisation du thème

3. **Validation avancée**
   - Vérifier que l'email de contact est valide
   - Valider les codes pays/devise avec une API

4. **Historique des modifications**
   - Afficher qui a modifié l'organisation et quand
   - Log des changements

5. **Confirmation avant sortie**
   - Avertir si l'utilisateur quitte avec des modifications non sauvegardées

---

## 🔗 Fichiers liés

- **Page de création:** `app/dashboard/organizations/create/page.tsx`
- **Page dashboard:** `app/dashboard/page.tsx`
- **Service d'organisation:** `lib/services/core/organization.service.ts`
- **Types:** `lib/types/core/index.ts`
- **API Config:** `lib/api/config.ts`

---

## ✅ Checklist de vérification

- [x] Page de modification créée
- [x] Type `OrganizationUpdateData` mis à jour avec `settings`
- [x] Chargement des données existantes
- [x] Pré-remplissage du formulaire
- [x] Sous-domaine en lecture seule
- [x] Affichage du statut actuel
- [x] Gestion des erreurs (404, erreurs de sauvegarde)
- [x] Redirection après sauvegarde réussie
- [x] Bouton "Annuler" fonctionnel
- [x] Intégration avec le service `organizationService`

---

**La page de modification d'organisation est maintenant complète et fonctionnelle !** ✅
