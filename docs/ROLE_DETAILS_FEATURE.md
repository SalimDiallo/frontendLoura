# Page de Détails des Rôles - Documentation

## 🎯 Fonctionnalité Implémentée

Une page complète de détails pour chaque rôle, affichant les informations du rôle, les permissions associées et les métadonnées système.

## 📁 Fichiers Concernés

```
✅ app/apps/(org)/[slug]/hr/roles/[id]/page.tsx
   → Page de détails complète du rôle
   → Gestion des permissions avec composant Can
   → Affichage des permissions groupées par catégorie
   → Protection des rôles système

✅ app/apps/(org)/[slug]/hr/roles/page.tsx
   → Liste des rôles
   → Filtres et recherche
   → Actions protégées par permissions
```

---

## ✨ Fonctionnalités de la Page de Détails

### 1. En-tête du Rôle

**Affichage :**
- Titre "Détails du rôle"
- Bouton retour vers la liste
- Nom du rôle
- Badges :
  - "Rôle système" (si `is_system_role = true`)
  - Statut (Actif/Inactif)

**Actions :**
```tsx
<Can permission={COMMON_PERMISSIONS.HR.UPDATE_ROLES}>
  <Button variant="outline" asChild>
    <Link href={`/apps/${slug}/hr/roles/${id}/edit`}>
      Modifier
    </Link>
  </Button>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.DELETE_ROLES}>
  <Button
    variant="destructive"
    onClick={handleDelete}
    disabled={deleting || role.is_system_role}
  >
    Supprimer
  </Button>
</Can>
```

**Protection des rôles système :**
- Les rôles système ne peuvent pas être supprimés
- Bouton "Supprimer" désactivé si `is_system_role = true`
- Tooltip : "Les rôles système ne peuvent pas être supprimés"

---

### 2. Informations du Rôle

**Card principale :**
- **Nom** : Titre en gras
- **Code** : Affiché dans un badge `<code>` avec style monospace
- **Nombre de permissions** : Count des permissions associées
- **Description** : Texte libre (optionnel)
- **Badges de statut** :
  - "Rôle système" (badge info)
  - "Actif" (badge vert success) / "Inactif" (badge gris outline)

```tsx
<Card className="p-6">
  <h2>{role.name}</h2>
  <div className="flex gap-2">
    {role.is_system_role && <Badge variant="info">Rôle système</Badge>}
    <Badge variant={role.is_active ? "success" : "outline"}>
      {role.is_active ? "Actif" : "Inactif"}
    </Badge>
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <div>Code</div>
      <code>{role.code}</code>
    </div>
    <div>
      <div>Nombre de permissions</div>
      <div>{role.permissions?.length || 0} permissions</div>
    </div>
  </div>

  {role.description && (
    <div>
      <div>Description</div>
      <p>{role.description}</p>
    </div>
  )}
</Card>
```

---

### 3. Permissions Associées

**Card des permissions :**
- Titre avec icône `HiOutlineShieldCheck`
- Badge avec le nombre total de permissions
- Permissions **groupées par catégorie**

**Affichage par catégorie :**
```tsx
{Object.entries(
  role.permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {})
).map(([category, perms]) => (
  <div key={category}>
    <div className="flex items-center gap-2">
      <div>{category}</div>
      <Badge variant="info">{perms.length}</Badge>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {perms.map((permission) => (
        <div key={permission.id}>
          <div>• {permission.name}</div>
          <div className="text-xs">{permission.code}</div>
        </div>
      ))}
    </div>
  </div>
))}
```

**Layout des permissions :**
- Grille 3 colonnes sur desktop
- Grille 2 colonnes sur tablette
- Colonne unique sur mobile
- Chaque permission affiche :
  - Point bleu (`•`)
  - Nom de la permission
  - Code de la permission (petit texte gris)

**État vide :**
```tsx
{role.permissions?.length === 0 && (
  <div className="text-center py-8">
    <HiOutlineShieldCheck className="size-12 mx-auto opacity-50" />
    <p>Aucune permission attribuée à ce rôle</p>
  </div>
)}
```

---

### 4. Informations Système

**Card métadonnées :**
- Date de création (formatée en français avec heure)
- Date de dernière modification (formatée en français avec heure)

```tsx
<Card className="p-6">
  <h3>Informations système</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <div>Créé le</div>
      <div>{new Date(role.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}</div>
    </div>
    <div>
      <div>Dernière modification</div>
      <div>{new Date(role.updated_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}</div>
    </div>
  </div>
</Card>
```

---

## 🔐 Permissions Utilisées

### Page de Détails (`[id]/page.tsx`)

| Action | Permission | Code |
|--------|-----------|------|
| Voir la page | `role.view` | `COMMON_PERMISSIONS.HR.VIEW_ROLES` |
| Modifier | `role.update` | `COMMON_PERMISSIONS.HR.UPDATE_ROLES` |
| Supprimer | `role.delete` | `COMMON_PERMISSIONS.HR.DELETE_ROLES` |

### Liste des Rôles (`page.tsx`)

| Action | Permission | Code |
|--------|-----------|------|
| Voir la page | `role.view` | `COMMON_PERMISSIONS.HR.VIEW_ROLES` |
| Créer rôle | `role.create` | `COMMON_PERMISSIONS.HR.CREATE_ROLES` |
| Voir détails | `role.view` | `COMMON_PERMISSIONS.HR.VIEW_ROLES` |
| Modifier rôle | `role.update` | `COMMON_PERMISSIONS.HR.UPDATE_ROLES` |
| Supprimer rôle | `role.delete` | `COMMON_PERMISSIONS.HR.DELETE_ROLES` |

---

## 🎨 Design & UX

### Badges Cohérents

**Statut du rôle :**
```tsx
// Actif
<Badge variant="success">Actif</Badge>

// Inactif
<Badge variant="outline">Inactif</Badge>  // ✅ Cohérent avec départements et employés
```

**Type de rôle :**
```tsx
// Rôle système
<Badge variant="info">Rôle système</Badge>

// Badge pour le nombre de permissions
<Badge variant="info">{count}</Badge>
```

### Couleurs des Permissions

- Point de couleur : `bg-primary` (bleu)
- Fond des permissions : `bg-muted/50` (gris clair transparent)
- Nom en gras : `font-medium`
- Code en petit : `text-xs text-muted-foreground`

### Layout Responsive

**Desktop (> 1024px) :**
- Grille 3 colonnes pour les permissions
- Grille 2 colonnes pour les métadonnées

**Tablette (768px - 1024px) :**
- Grille 2 colonnes pour les permissions
- Grille 2 colonnes pour les métadonnées

**Mobile (< 768px) :**
- Colonne unique partout
- Cards empilées

---

## 📊 Services Utilisés

### Role Service

```typescript
// Récupérer les détails d'un rôle
getRole(id: string): Promise<Role>

// Supprimer un rôle
deleteRole(id: string): Promise<void>

// Liste des rôles
getRoles(): Promise<Role[]>
```

---

## 🔄 Flux Utilisateur

### 1. Accès à la Page

**Depuis la liste :**
```
/apps/{org}/hr/roles
  → Clic sur "Voir les détails" dans le menu dropdown
  → Redirection vers /apps/{org}/hr/roles/{id}
```

**Navigation directe :**
```
URL: /apps/{org}/hr/roles/{role-id}
```

### 2. Actions Disponibles

**Modifier le rôle :**
```
Clic sur "Modifier" (header)
  → Redirection vers /apps/{org}/hr/roles/{id}/edit
  → Formulaire pré-rempli avec :
    - Nom
    - Code
    - Description
    - Sélection des permissions
```

**Supprimer le rôle :**
```
Clic sur "Supprimer"
  → Si rôle système:
    → Bouton désactivé
    → Tooltip "Les rôles système ne peuvent pas être supprimés"
  → Sinon:
    → Confirmation (window.confirm)
    → Si confirmé:
      → Appel API (deleteRole)
      → Redirection vers /apps/{org}/hr/roles
```

**Retour à la liste :**
```
Clic sur bouton "←" ou "Retour à la liste"
  → Redirection vers /apps/{org}/hr/roles
```

---

## 📋 Liste des Rôles - Fonctionnalités

### 1. Statistiques

**3 Cards :**
- Total rôles (count depuis API)
- Actifs (`is_active = true`)
- Inactifs (`is_active = false`)

### 2. Recherche

**Fonctionnalités :**
- Recherche par nom ou code
- Filtrage en temps réel côté client
- Icône de loupe à gauche de l'input

### 3. Tableau des Rôles

**Colonnes :**
- Nom (+ badge "Système" si applicable)
- Code (badge monospace)
- Description
- Nombre de permissions
- Statut (badge coloré)
- Actions (dropdown menu)

**Actions du menu :**
```tsx
<Can permission={COMMON_PERMISSIONS.HR.VIEW_ROLES}>
  <DropdownMenuItem>Voir les détails</DropdownMenuItem>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.UPDATE_ROLES}>
  <DropdownMenuItem>Modifier</DropdownMenuItem>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.DELETE_ROLES}>
  <DropdownMenuItem disabled={role.is_system_role}>
    {role.is_system_role ? "Supprimer (protégé)" : "Supprimer"}
  </DropdownMenuItem>
</Can>
```

### 4. Protection des Rôles Système

**Validation supplémentaire :**
```tsx
const handleDelete = async (id: string, isSystemRole: boolean) => {
  if (isSystemRole) {
    alert("Les rôles système ne peuvent pas être supprimés. Vous pouvez uniquement les désactiver.");
    return;
  }

  if (!confirm("Êtes-vous sûr de vouloir supprimer ce rôle ?")) return;

  // Suppression...
};
```

**UX :**
- Item du menu grisé si rôle système
- Texte "Supprimer (protégé)"
- Classe CSS : `text-muted-foreground cursor-not-allowed`
- Alert si tentative de suppression

---

## 🧪 Tests Recommandés

### Page de Détails

**Affichage :**
- [ ] Rôle avec toutes les infos s'affiche correctement
- [ ] Rôle sans permissions s'affiche avec message approprié
- [ ] Badge "Rôle système" affiché si applicable
- [ ] Badge de statut correct (Actif/Inactif)
- [ ] Permissions groupées par catégorie

**Actions :**
- [ ] Modifier redirige vers formulaire
- [ ] Supprimer fonctionne si non-système
- [ ] Supprimer désactivé si rôle système
- [ ] Tooltip affiché sur bouton désactivé
- [ ] Retour fonctionne

### Liste des Rôles

**Recherche :**
- [ ] Recherche par nom fonctionne
- [ ] Recherche par code fonctionne
- [ ] Recherche insensible à la casse

**Permissions :**
- [ ] Boutons masqués si permissions manquantes
- [ ] Menu dropdown adapté aux permissions
- [ ] Actions bloquées côté API si permissions manquantes

**Rôles système :**
- [ ] Badge "Système" affiché
- [ ] Suppression impossible
- [ ] Alert affichée si tentative de suppression
- [ ] Item du menu grisé

---

## 🎁 Améliorations Futures

**Suggestions :**

1. **Statistiques :**
   - Nombre d'employés par rôle
   - Permissions les plus utilisées
   - Graphique de distribution

2. **Gestion avancée :**
   - Dupliquer un rôle
   - Comparer deux rôles
   - Template de rôles

3. **Historique :**
   - Historique des modifications
   - Qui a modifié quand
   - Diff des permissions

4. **Export :**
   - Export PDF de la liste
   - Export Excel avec détails
   - Documentation auto des rôles

5. **Permissions :**
   - Vue hiérarchique des permissions
   - Recherche dans les permissions
   - Groupement personnalisé

6. **Employés :**
   - Liste des employés avec ce rôle
   - Lien direct vers les employés
   - Statistiques d'utilisation

7. **Validation :**
   - Vérifier les conflits de permissions
   - Suggestions de permissions manquantes
   - Templates pré-définis

8. **Activation/Désactivation :**
   - Toggle pour activer/désactiver
   - Impact sur les employés
   - Logs de changements

---

## 📝 Notes Techniques

### Gestion d'État

**États locaux (page détails) :**
```typescript
const [role, setRole] = useState<Role | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [deleting, setDeleting] = useState(false);
```

**États locaux (liste) :**
```typescript
const [roles, setRoles] = useState<Role[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState("");
const [deleting, setDeleting] = useState<string | null>(null);
```

### Groupement des Permissions

**Algorithme de regroupement :**
```typescript
const groupedPermissions = role.permissions.reduce((acc, perm) => {
  if (!acc[perm.category]) acc[perm.category] = [];
  acc[perm.category].push(perm);
  return acc;
}, {} as Record<string, Permission[]>);

// Rendu
Object.entries(groupedPermissions).map(([category, perms]) => (
  // Afficher la catégorie et ses permissions
));
```

### Formatage des Dates

```typescript
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Exemple : "15 décembre 2025 à 14:30"
```

---

## 🔗 Relations entre Pages

```
Liste Rôles (/hr/roles)
  │
  ├─→ Détails Rôle (/hr/roles/{id})
  │     │
  │     └─→ Modifier Rôle (/hr/roles/{id}/edit)
  │
  └─→ Créer Rôle (/hr/roles/create)
```

---

## 🔒 Sécurité

### Protection des Rôles Système

**Frontend :**
- Bouton de suppression désactivé
- Tooltip explicatif
- Alert si tentative de suppression

**Backend (attendu) :**
- Vérification `is_system_role` avant suppression
- Erreur 400 si tentative de suppression d'un rôle système
- Message : "System roles cannot be deleted"

### Permissions Cascades

**Important :**
- La suppression d'un rôle peut affecter les employés
- Backend devrait gérer l'intégrité référentielle
- Options possibles :
  - Empêcher suppression si employés assignés
  - Réassigner automatiquement à un rôle par défaut
  - Orpheliner les employés (à éviter)

---

## 📐 Structure des Données

### Type Role

```typescript
interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  is_system_role: boolean;
  permission_count?: number;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
  organization: string;
}
```

### Type Permission

```typescript
interface Permission {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  resource_type: string;
  action: string;
}
```

---

*Dernière mise à jour : 2025-12-15*
*Version : 1.0.0*
