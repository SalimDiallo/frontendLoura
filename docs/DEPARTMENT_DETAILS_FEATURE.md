# Page de Détails des Départements - Documentation

## 🎯 Fonctionnalité Implémentée

Une page complète de détails pour chaque département, affichant toutes les informations, statistiques et employés associés.

## 📁 Fichier Créé

```
✅ app/apps/(org)/[slug]/hr/departments/[id]/page.tsx
   → Page de détails complète du département
   → Gestion des permissions
   → Statistiques en temps réel
   → Liste des employés
   → Actions (Modifier, Activer/Désactiver, Supprimer)
```

---

## ✨ Fonctionnalités

### 1. Informations du Département

**Affichage :**
- Nom du département
- Code unique
- Description (si disponible)
- Statut (Actif/Inactif)
- Date de création

**Layout :**
```tsx
<Card className="p-6">
  <h2 className="text-xl font-semibold mb-4">Informations du Département</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Champs d'information */}
  </div>
</Card>
```

---

### 2. Statistiques en Temps Réel

**3 Cards de statistiques :**

**Employés Actifs :**
- Icône : `HiOutlineUsers`
- Couleur : Bleu
- Compte : Employés avec `is_active=true` et `employment_status='active'`

**Total Employés :**
- Icône : `HiOutlineUserGroup`
- Couleur : Violet
- Compte : Tous les employés du département

**Employés Inactifs :**
- Icône : `HiOutlineXCircle`
- Couleur : Orange
- Compte : Employés inactifs ou avec statut différent de 'active'

**Code :**
```tsx
const activeEmployees = employees.filter(
  e => e.is_active && e.employment_status === 'active'
);
const inactiveEmployees = employees.filter(
  e => !e.is_active || e.employment_status !== 'active'
);

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Cards de stats */}
</div>
```

---

### 3. Liste des Employés

**Tableau complet :**
- Nom complet
- Email
- Poste (position)
- Statut d'emploi (Actif, En congé, Suspendu, Terminé)
- Statut (Actif/Inactif)
- Action "Voir" pour accéder aux détails de l'employé

**Badges colorés selon statut :**
```tsx
<Badge
  variant={
    employee.employment_status === 'active' ? 'success'
    : employee.employment_status === 'on_leave' ? 'warning'
    : 'secondary'
  }
>
  {statusLabel}
</Badge>
```

**États spéciaux :**
- **Loading** : Spinner pendant le chargement
- **Vide** : Message avec CTA pour ajouter un employé
- **Liste** : Tableau avec tous les employés

---

### 4. Actions Disponibles

**Header Actions :**

**Retour :**
```tsx
<Button onClick={() => router.back()} variant="outline" size="sm">
  <HiOutlineArrowLeft className="size-4" />
</Button>
```

**Activer/Désactiver :**
- Permission : `attendance.update_department`
- Fonction : `handleToggleStatus()`
- Appel API : `activateDepartment()` ou `deactivateDepartment()`
- État : `toggling` pour désactiver le bouton pendant l'action

```tsx
<Button onClick={handleToggleStatus} disabled={toggling}>
  {department.is_active ? 'Désactiver' : 'Activer'}
</Button>
```

**Modifier :**
- Permission : `attendance.update_department`
- Lien : `/apps/${slug}/hr/departments/${departmentId}/edit`

**Supprimer :**
- Permission : `attendance.delete_department`
- Fonction : `handleDelete()`
- Confirmation requise avec `window.confirm()`
- **Désactivé** si des employés sont assignés au département
- Redirection vers la liste après suppression

```tsx
<Button
  onClick={handleDelete}
  variant="destructive"
  disabled={deleting || employees.length > 0}
  title={employees.length > 0 ? 'Impossible de supprimer...' : ''}
>
  <HiOutlineTrash className="size-4 mr-2" />
  {deleting ? 'Suppression...' : 'Supprimer'}
</Button>
```

---

### 5. Gestion des Permissions

**Permissions utilisées :**

| Action | Permission | Code |
|--------|-----------|------|
| Voir la page | `department.view` | `COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS` |
| Modifier | `department.update` | `COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENT` |
| Supprimer | `department.delete` | `COMMON_PERMISSIONS.HR.DELETE_DEPARTMENT` |
| Ajouter employé | `employee.create` | `COMMON_PERMISSIONS.HR.CREATE_EMPLOYEE` |
| Voir employé | `employee.view` | `COMMON_PERMISSIONS.HR.VIEW_EMPLOYEE` |

**Utilisation du composant `<Can>` :**
```tsx
<Can permission={COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENT}>
  <Button onClick={handleToggleStatus}>Activer/Désactiver</Button>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.DELETE_DEPARTMENT}>
  <Button onClick={handleDelete}>Supprimer</Button>
</Can>
```

---

### 6. États de Chargement

**Page principale :**
```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin..." />
        <p className="mt-4">Chargement...</p>
      </div>
    </div>
  );
}
```

**Liste des employés :**
```tsx
{loadingEmployees ? (
  <div className="text-center py-8">
    <div className="inline-block h-6 w-6 animate-spin..." />
    <p className="mt-2">Chargement des employés...</p>
  </div>
) : (
  {/* Tableau */}
)}
```

---

### 7. Gestion des Erreurs

**Erreur de chargement :**
```tsx
if (error && !department) {
  return (
    <Alert variant="error">{error}</Alert>
    <Button onClick={() => router.back()}>Retour</Button>
  );
}
```

**Département introuvable :**
```tsx
if (!department) {
  return (
    <Alert variant="error">Département introuvable</Alert>
    <Button onClick={() => router.back()}>Retour</Button>
  );
}
```

**Erreurs d'actions :**
- Affichage d'une `Alert` en haut de la page
- Fermeture possible de l'alerte
- État d'erreur réinitialisé après chaque nouvelle action

```tsx
{error && (
  <Alert variant="error" onClose={() => setError(null)}>
    {error}
  </Alert>
)}
```

---

## 🔧 Services Utilisés

### Department Service

**Fonctions :**
```typescript
// Récupérer les détails
getDepartment(id: string): Promise<Department>

// Activer/Désactiver
activateDepartment(id: string): Promise<Department>
deactivateDepartment(id: string): Promise<Department>

// Supprimer
deleteDepartment(id: string): Promise<void>
```

### Employee Service

**Fonction :**
```typescript
getEmployees(organizationSlug: string, params?: {
  department?: string;  // ← Filtre par département
  search?: string;
  is_active?: boolean;
  // ...
}): Promise<EmployeeListResponse>
```

**Utilisation :**
```typescript
const data = await getEmployees(slug, {
  department: departmentId
});
```

---

## 🎨 Design & UX

### Layout Responsive

**Desktop (> 768px) :**
- Header avec boutons alignés horizontalement
- Stats en grille 3 colonnes
- Informations en grille 2 colonnes
- Tableau pleine largeur

**Mobile (< 768px) :**
- Header en colonne
- Stats en colonne (1 card par ligne)
- Informations en colonne
- Tableau avec scroll horizontal

### Couleurs & Badges

**Badges de statut :**
```tsx
// Actif
<Badge variant="success">
  <HiOutlineCheckCircle className="size-4 mr-1" />
  Actif
</Badge>

// Inactif
<Badge variant="secondary">
  <HiOutlineXCircle className="size-4 mr-1" />
  Inactif
</Badge>
```

**Statut d'emploi :**
- `active` → Badge vert (`success`)
- `on_leave` → Badge orange (`warning`)
- `suspended`, `terminated` → Badge gris (`secondary`)

### Icônes

**Icons utilisés :**
- `HiOutlineArrowLeft` : Retour
- `HiOutlineBriefcase` : Département
- `HiOutlinePencil` : Modifier
- `HiOutlineTrash` : Supprimer
- `HiOutlineUsers` : Employés actifs
- `HiOutlineUserGroup` : Total employés
- `HiOutlineXCircle` : Inactifs
- `HiOutlineCheckCircle` : Actif
- `HiOutlineCog` : Activer/Désactiver

---

## 🚀 Flux Utilisateur

### 1. Accès à la Page

**Depuis la liste des départements :**
```
/apps/{org}/hr/departments
  → Clic sur "Voir les détails" (menu dropdown)
  → Redirection vers /apps/{org}/hr/departments/{id}
```

**Navigation directe :**
```
URL: /apps/{org}/hr/departments/{department-id}
```

### 2. Actions Disponibles

**Modifier le département :**
```
Clic sur "Modifier"
  → Redirection vers /apps/{org}/hr/departments/{id}/edit
  → Formulaire pré-rempli
  → Sauvegarde
  → Retour aux détails
```

**Activer/Désactiver :**
```
Clic sur "Activer" ou "Désactiver"
  → Appel API (activateDepartment/deactivateDepartment)
  → Rechargement des détails
  → Badge de statut mis à jour
```

**Supprimer :**
```
Clic sur "Supprimer"
  → Confirmation (window.confirm)
  → Si confirmé:
    → Appel API (deleteDepartment)
    → Redirection vers /apps/{org}/hr/departments
  → Si annulé:
    → Aucune action
```

**Ajouter un employé :**
```
Clic sur "Ajouter un employé"
  → Redirection vers /apps/{org}/hr/employees/create?department={id}
  → Formulaire avec département pré-sélectionné
  → Après création:
    → Retour aux détails du département
    → Employé visible dans la liste
```

**Voir un employé :**
```
Clic sur "Voir" dans la ligne d'un employé
  → Redirection vers /apps/{org}/hr/employees/{employee-id}
  → Page de détails de l'employé
```

---

## 📊 Données Affichées

### Informations Principales

```typescript
interface DepartmentDetails {
  // Identité
  id: string;
  name: string;
  code: string;
  description?: string;

  // Statut
  is_active: boolean;

  // Dates
  created_at: string;
  updated_at: string;

  // Relations (non affiché directement)
  organization: string;
  manager?: string;
  parent_department?: string;
}
```

### Statistiques Calculées

```typescript
// Frontend calculation
const activeEmployees = employees.filter(
  e => e.is_active && e.employment_status === 'active'
).length;

const totalEmployees = employees.length;

const inactiveEmployees = employees.filter(
  e => !e.is_active || e.employment_status !== 'active'
).length;
```

### Liste des Employés

```typescript
interface EmployeeListItem {
  id: string;
  full_name: string;
  email: string;
  employee_id: string;
  position_title?: string;
  department_name?: string;
  employment_status: EmploymentStatus;
  is_active: boolean;
}
```

---

## 🔐 Sécurité

### Vérifications Permissions

**Chargement de la page :**
- Aucune permission spécifique requise pour voir
- Mais les actions sont protégées par permissions

**Actions protégées :**
- Activer/Désactiver : `UPDATE_DEPARTMENT`
- Modifier : `UPDATE_DEPARTMENT`
- Supprimer : `DELETE_DEPARTMENT`
- Ajouter employé : `CREATE_EMPLOYEE`
- Voir employé : `VIEW_EMPLOYEE`

### Validation Business

**Suppression impossible si :**
```typescript
employees.length > 0
// → Bouton désactivé avec tooltip explicatif
```

**Raison :**
- Intégrité des données
- Éviter les orphelins
- Forcer le réassignement des employés avant suppression

---

## 🧪 Tests Recommandés

### Scénarios de Test

**Affichage :**
- [ ] Département avec employés s'affiche correctement
- [ ] Département sans employé affiche le CTA
- [ ] Statistiques sont calculées correctement
- [ ] Badge de statut correct (Actif/Inactif)

**Actions :**
- [ ] Activer un département inactif
- [ ] Désactiver un département actif
- [ ] Modifier redirige vers le formulaire
- [ ] Supprimer impossible si employés présents
- [ ] Supprimer fonctionne si aucun employé
- [ ] Confirmation de suppression s'affiche

**Permissions :**
- [ ] Boutons masqués si permissions manquantes
- [ ] Actions bloquées côté API si permissions manquantes

**Erreurs :**
- [ ] ID invalide → Message d'erreur
- [ ] Département introuvable → Message d'erreur
- [ ] Erreur API → Message d'erreur avec retry

**Navigation :**
- [ ] Retour fonctionne
- [ ] Lien vers édition fonctionne
- [ ] Lien vers création employé fonctionne (avec pre-fill)
- [ ] Lien vers détails employé fonctionne

---

## 🎁 Améliorations Futures

**Suggestions :**

1. **Graphiques & Analytics :**
   - Évolution du nombre d'employés
   - Taux de turnover
   - Distribution par poste

2. **Hiérarchie :**
   - Afficher le département parent
   - Afficher les sous-départements
   - Organigramme visuel

3. **Manager :**
   - Afficher le manager du département
   - Lien vers le profil du manager
   - Historique des managers

4. **Export :**
   - Exporter la liste des employés (CSV, PDF)
   - Générer un rapport du département

5. **Timeline :**
   - Historique des changements
   - Qui a modifié quoi et quand

6. **Budgets :**
   - Budget alloué au département
   - Dépenses vs budget
   - Projection

7. **KPIs :**
   - Taux de présence
   - Performance moyenne
   - Objectifs atteints

8. **Communication :**
   - Envoyer un message à tous les employés
   - Notifications push
   - Annonces du département

---

## 📝 Notes Techniques

### Performance

**Optimisations :**
- Chargement parallèle (département + employés)
- Pas de sur-requêtes
- Filtrage côté serveur (API avec query params)

```typescript
// Chargement parallèle
useEffect(() => {
  loadDepartmentDetails();    // API 1
  loadDepartmentEmployees();  // API 2
}, [departmentId]);
```

### Gestion d'État

**États locaux :**
```typescript
const [department, setDepartment] = useState<Department | null>(null);
const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
const [loading, setLoading] = useState(true);
const [loadingEmployees, setLoadingEmployees] = useState(true);
const [error, setError] = useState<string | null>(null);
const [deleting, setDeleting] = useState(false);
const [toggling, setToggling] = useState(false);
```

**Pas de state management global nécessaire** (Redux, Zustand, etc.)
- Données spécifiques à cette page
- Pas de partage avec d'autres composants
- useState suffit

---

*Dernière mise à jour : 2025-12-15*
*Version : 1.0.0*
