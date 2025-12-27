# Page de Détails des Employés - Documentation

## 🎯 Fonctionnalité Implémentée

Une page complète de détails pour chaque employé, affichant toutes les informations personnelles, professionnelles, contrats, permissions et compensation.

## 📁 Fichiers Concernés

```
✅ app/apps/(org)/[slug]/hr/employees/[id]/page.tsx
   → Page de détails complète de l'employé
   → Gestion des permissions avec composant Can
   → Onglets pour organiser les informations
   → Affichage des contrats et rôles

✅ app/apps/(org)/[slug]/hr/employees/page.tsx
   → Liste des employés
   → Filtres et recherche
   → Actions protégées par permissions
```

---

## ✨ Fonctionnalités de la Page de Détails

### 1. En-tête de l'Employé

**Affichage :**
- Avatar avec initiales (cercle coloré)
- Nom complet (prénom + nom)
- Rôle et département
- Email (cliquable - mailto:)
- Téléphone (cliquable - tel:)
- Matricule employé
- Badges de statut :
  - Statut d'emploi (Actif, En congé, Suspendu, Terminé)
  - Statut du compte (Actif/Inactif)

**Actions :**
```tsx
<Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
  <Button
    onClick={handleToggleStatus}
    variant="outline"
    size="sm"
    disabled={toggling}
  >
    <HiOutlineCog className="size-4 mr-2" />
    {toggling ? 'Chargement...' : employee.is_active ? 'Désactiver' : 'Activer'}
  </Button>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
  <Button asChild>
    <Link href={`/apps/${slug}/hr/employees/${id}/edit`}>
      Modifier
    </Link>
  </Button>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES}>
  <Button variant="destructive" onClick={handleDelete}>
    Supprimer
  </Button>
</Can>
```

---

### 2. Onglets d'Information

#### **Tab 1: Vue d'ensemble**

**Informations personnelles :**
- Date de naissance
- Genre
- Adresse complète (adresse, ville, pays)

**Informations d'emploi :**
- Date d'embauche
- Manager
- Position/Poste
- Statut d'emploi

**Contact d'urgence :**
- Nom
- Téléphone
- Relation

```tsx
<TabsContent value="overview">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card>
      <h3>Informations personnelles</h3>
      {/* Date de naissance, genre, adresse */}
    </Card>
    <Card>
      <h3>Informations d'emploi</h3>
      {/* Date embauche, manager, position */}
    </Card>
  </div>
  {/* Contact d'urgence */}
</TabsContent>
```

---

#### **Tab 2: Emploi**

**Détails complets :**
- Matricule
- Département
- Position
- Manager
- Date d'embauche
- Date de fin (si applicable)
- Statut d'emploi
- Statut du compte

---

#### **Tab 3: Rôles & Permissions**

**Protection :**
```tsx
<Can permission={COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEE_PERMISSIONS}>
  <TabsTrigger value="permissions">Rôles & Permissions</TabsTrigger>
</Can>
```

**Affichage :**
- **Rôle principal :**
  - Nom du rôle
  - Description
  - Code du rôle
  - Badge "Système" si c'est un rôle système
  - Nombre de permissions

- **Permissions du rôle :**
  - Groupées par catégorie
  - Affichage en grille (2 colonnes sur desktop)
  - Badge avec point bleu pour chaque permission

- **Permissions supplémentaires :**
  - Permissions custom en plus du rôle
  - Groupées par catégorie
  - Badge orange pour différencier

- **Résumé :**
  - Total des permissions actives

**Bouton Modifier :**
```tsx
<Button asChild>
  <Link href={`/apps/${slug}/hr/employees/${id}/roles-permissions`}>
    Modifier
  </Link>
</Button>
```

---

#### **Tab 4: Compensation**

**Protection :**
```tsx
<Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEE_COMPENSATION}>
  <Card>
    {/* Informations salaire */}
  </Card>
</Can>
```

**Affichage :**
- Salaire de base (formaté avec séparateurs)
- Devise (GNF par défaut)

---

#### **Tab 5: Contrats**

**Liste des contrats :**
- Badge type de contrat (CDI, CDD, Contractuel, Stage, Freelance)
- Badge statut (Actif/Inactif)
- Période (date début → date fin)
- Salaire de base + période (mois/heure/an/jour)
- Heures par semaine
- Description

**Actions protégées :**
```tsx
<Can permission={COMMON_PERMISSIONS.HR.CREATE_CONTRACTS}>
  <Button asChild>
    <Link href={`/apps/${slug}/hr/contracts/create?employee=${id}`}>
      Nouveau contrat
    </Link>
  </Button>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
  <Button asChild>
    <Link href={`/apps/${slug}/hr/contracts/${contract.id}`}>
      Voir
    </Link>
  </Button>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS}>
  <Button asChild>
    <Link href={`/apps/${slug}/hr/contracts/${contract.id}/edit`}>
      Modifier
    </Link>
  </Button>
</Can>
```

**États :**
- **Loading** : Skeleton animé
- **Vide** : Message + CTA "Créer un contrat"
- **Liste** : Cards pour chaque contrat

---

#### **Tab 6: Documents**

**Statut actuel :**
- Placeholder "Bientôt disponible"
- Message : "La gestion des documents sera bientôt disponible"

---

## 🔐 Permissions Utilisées

### Page de Détails (`[id]/page.tsx`)

| Action | Permission | Code |
|--------|-----------|------|
| Voir la page | `employee.view` | `COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES` |
| Modifier | `employee.update` | `COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES` |
| Supprimer | `employee.delete` | `COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES` |
| Gérer permissions | `employee.manage_permissions` | `COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEE_PERMISSIONS` |
| Voir compensation | `employee.view_compensation` | `COMMON_PERMISSIONS.HR.VIEW_EMPLOYEE_COMPENSATION` |
| Créer contrat | `contract.create` | `COMMON_PERMISSIONS.HR.CREATE_CONTRACTS` |
| Voir contrat | `contract.view` | `COMMON_PERMISSIONS.HR.VIEW_CONTRACTS` |
| Modifier contrat | `contract.update` | `COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS` |

### Liste des Employés (`page.tsx`)

| Action | Permission | Code |
|--------|-----------|------|
| Créer employé | `employee.create` | `COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES` |
| Voir employé | `employee.view` | `COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES` |
| Modifier employé | `employee.update` | `COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES` |
| Supprimer employé | `employee.delete` | `COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES` |

---

## 🎨 Design & UX

### Couleurs des Badges

**Types de contrat :**
```tsx
const contractTypeColors = {
  permanent: "bg-green-100 text-green-800 border-green-200",    // CDI
  temporary: "bg-blue-100 text-blue-800 border-blue-200",       // CDD
  contract: "bg-purple-100 text-purple-800 border-purple-200",  // Contractuel
  internship: "bg-orange-100 text-orange-800 border-orange-200",// Stage
  freelance: "bg-pink-100 text-pink-800 border-pink-200",       // Freelance
};
```

**Statuts :**
- Actif : Badge vert (`success`)
- Inactif : Badge gris (`outline`)
- En congé : Badge bleu (`warning`)
- Suspendu/Terminé : Badge gris (`outline`)

### Layout Responsive

**Desktop (> 768px) :**
- Grille 2 colonnes pour informations personnelles et emploi
- Permissions en grille 2 colonnes
- Tabs horizontaux

**Mobile (< 768px) :**
- Colonnes uniques
- Tabs scrollables
- Cards empilées

---

## 📊 Services Utilisés

### Employee Service

```typescript
// Récupérer les détails
getEmployee(id: string): Promise<Employee>

// Activer/Désactiver
activateEmployee(id: string): Promise<Employee>
deactivateEmployee(id: string): Promise<Employee>

// Supprimer
deleteEmployee(id: string): Promise<void>
```

### Contract Service

```typescript
// Récupérer les contrats d'un employé
getEmployeeContracts(orgSlug: string, employeeId: string): Promise<Contract[]>
```

---

## 🔄 Flux Utilisateur

### 1. Accès à la Page

**Depuis la liste :**
```
/apps/{org}/hr/employees
  → Clic sur "Voir le profil" dans le menu dropdown
  → Redirection vers /apps/{org}/hr/employees/{id}
```

**Navigation directe :**
```
URL: /apps/{org}/hr/employees/{employee-id}
```

### 2. Actions Disponibles

**Activer/Désactiver l'employé :**
```
Clic sur "Activer" ou "Désactiver"
  → Appel API (activateEmployee/deactivateEmployee)
  → Rechargement des détails
  → Badge de statut mis à jour
```

**Modifier l'employé :**
```
Clic sur "Modifier" (header)
  → Redirection vers /apps/{org}/hr/employees/{id}/edit
  → Formulaire pré-rempli
```

**Supprimer l'employé :**
```
Clic sur "Supprimer"
  → Confirmation (window.confirm)
  → Si confirmé:
    → Appel API (deleteEmployee)
    → Redirection vers /apps/{org}/hr/employees
```

**Gérer les permissions :**
```
Clic sur "Modifier" dans l'onglet Permissions
  → Redirection vers /apps/{org}/hr/employees/{id}/roles-permissions
```

**Créer un contrat :**
```
Clic sur "Nouveau contrat"
  → Redirection vers /apps/{org}/hr/contracts/create?employee={id}
  → Formulaire avec employé pré-sélectionné
```

---

## 📋 Liste des Employés - Fonctionnalités

### 1. Statistiques

**4 Cards :**
- Total employés (count depuis API)
- Actifs (employment_status = 'active')
- En congé (employment_status = 'on_leave')
- Inactifs (employment_status = 'suspended' ou 'terminated')

### 2. Filtres Multiples

**Filtres disponibles :**
- Recherche texte (nom, email, matricule)
- Statut d'emploi (dropdown)
- Département (dropdown dynamique)
- Rôle (dropdown dynamique)
- Genre (dropdown)
- Actif/Inactif (dropdown)

**Affichage des filtres actifs :**
- Badges cliquables pour chaque filtre actif
- Bouton "Effacer tout" pour réinitialiser

### 3. Tableau des Employés

**Colonnes :**
- Employé (avatar + nom + email)
- Matricule
- Département
- Rôle
- Statut (badge coloré)
- Actions (dropdown menu)

**Actions du menu :**
```tsx
<Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
  <DropdownMenuItem>Voir le profil</DropdownMenuItem>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
  <DropdownMenuItem>Modifier</DropdownMenuItem>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
  <DropdownMenuItem onClick={() => handleToggleStatus(employee.id, employee.is_active)}>
    {employee.is_active ? 'Désactiver' : 'Activer'}
  </DropdownMenuItem>
</Can>

<Can permission={COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES}>
  <DropdownMenuItem>Supprimer</DropdownMenuItem>
</Can>
```

### 4. Pagination

**Fonctionnalités :**
- 20 employés par page
- Boutons Précédent/Suivant
- Indicateur de page courante
- Total des employés
- Désactivation automatique si filtres actifs

---

## 🧪 Tests Recommandés

### Page de Détails

**Affichage :**
- [ ] Employé avec toutes les infos s'affiche correctement
- [ ] Employé avec infos minimales s'affiche sans erreur
- [ ] Avatar avec initiales correct
- [ ] Badges de statut corrects

**Onglets :**
- [ ] Navigation entre onglets fonctionne
- [ ] Permissions affichées correctement (groupées par catégorie)
- [ ] Contrats listés avec détails complets
- [ ] Onglet compensation protégé par permission

**Actions :**
- [ ] Activer un employé inactif fonctionne
- [ ] Désactiver un employé actif fonctionne
- [ ] Badge de statut se met à jour après activation/désactivation
- [ ] Modifier redirige vers formulaire
- [ ] Supprimer fonctionne avec confirmation
- [ ] Liens vers contrats fonctionnent
- [ ] Liens vers gestion permissions fonctionnent

### Liste des Employés

**Filtres :**
- [ ] Recherche fonctionne (nom, email, matricule)
- [ ] Filtres se combinent correctement (AND logic)
- [ ] Badges de filtres actifs s'affichent
- [ ] Réinitialisation efface tous les filtres
- [ ] Dropdowns se peuplent dynamiquement

**Pagination :**
- [ ] Pagination fonctionne
- [ ] Désactivée si filtres actifs
- [ ] Indicateurs corrects

**Permissions :**
- [ ] Boutons masqués si permissions manquantes
- [ ] Menu dropdown adapté aux permissions
- [ ] Actions bloquées côté API si permissions manquantes

---

## 🎁 Améliorations Futures

**Suggestions :**

1. **Documents :**
   - Upload de documents (CV, diplômes, etc.)
   - Gestion des pièces jointes
   - Prévisualisation

2. **Historique :**
   - Historique des changements
   - Historique des contrats
   - Timeline de l'employé

3. **Performance :**
   - Évaluations annuelles
   - Objectifs et KPIs
   - Feedback 360°

4. **Formation :**
   - Formations suivies
   - Certifications
   - Plans de développement

5. **Présence :**
   - Historique de présence
   - Congés pris/restants
   - Heures supplémentaires

6. **Export :**
   - Export PDF du profil
   - Export Excel de la liste
   - Génération de fiches employé

7. **Communication :**
   - Envoyer un email
   - Voir les conversations
   - Notes et commentaires

8. **Graphiques :**
   - Évolution du salaire
   - Historique des positions
   - Performance dans le temps

---

## 📝 Notes Techniques

### Gestion d'État

**États locaux (page détails) :**
```typescript
const [employee, setEmployee] = useState<Employee | null>(null);
const [contracts, setContracts] = useState<Contract[]>([]);
const [loading, setLoading] = useState(true);
const [loadingContracts, setLoadingContracts] = useState(false);
const [error, setError] = useState<string | null>(null);
const [deleting, setDeleting] = useState(false);
```

**États locaux (liste) :**
```typescript
const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
const [totalCount, setTotalCount] = useState(0);
const [currentPage, setCurrentPage] = useState(1);
const [hasNext, setHasNext] = useState(false);
const [hasPrevious, setHasPrevious] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [filterStatus, setFilterStatus] = useState<string>("");
// ... autres filtres
```

### Optimisations

**Chargement parallèle :**
```typescript
useEffect(() => {
  loadEmployee();    // API 1
  loadContracts();   // API 2
}, [id]);
```

**Filtres calculés :**
```typescript
const departmentOptions = useMemo(
  () => [
    { value: "", label: "Tous les départements" },
    ...uniqueNonEmpty(employees.map((e) => e.department_name))
      .map((dep) => ({ value: dep, label: dep })),
  ],
  [employees]
);
```

### Helpers

```typescript
// Labels de genre
const getGenderLabel = (gender?: string) => {
  const labels = {
    male: "Homme",
    female: "Femme",
    other: "Autre",
  };
  return gender ? labels[gender] || gender : "-";
};

// Labels de type de contrat
const getContractTypeLabel = (type: string) => {
  const labels = {
    permanent: "CDI",
    temporary: "CDD",
    contract: "Contractuel",
    internship: "Stage",
    freelance: "Freelance",
  };
  return labels[type] || type;
};
```

---

## 🔗 Relations entre Pages

```
Liste Employés (/hr/employees)
  │
  ├─→ Détails Employé (/hr/employees/{id})
  │     │
  │     ├─→ Modifier Employé (/hr/employees/{id}/edit)
  │     │
  │     ├─→ Gérer Permissions (/hr/employees/{id}/roles-permissions)
  │     │
  │     ├─→ Voir Contrat (/hr/contracts/{contract_id})
  │     │
  │     └─→ Modifier Contrat (/hr/contracts/{contract_id}/edit)
  │
  └─→ Créer Employé (/hr/employees/create)
```

---

*Dernière mise à jour : 2025-12-15*
*Version : 1.0.0*
