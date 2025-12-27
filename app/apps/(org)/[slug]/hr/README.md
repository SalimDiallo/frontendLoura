# Module HR Frontend - Loura

## 📋 Vue d'ensemble

Le module RH (Ressources Humaines) frontend complet pour la plateforme Loura. Ce module s'intègre parfaitement avec le backend Django créé précédemment.

## 📁 Structure des fichiers

```
app/apps/(org)/[slug]/hr/
├── page.tsx                    # Dashboard principal HR
├── employees/
│   └── page.tsx               # Liste et gestion des employés
├── leaves/
│   └── page.tsx               # Gestion des congés
└── payroll/
    └── page.tsx               # Gestion de la paie
```

## 🎨 Pages créées

### 1. **Dashboard HR** (`/hr`)
Page d'accueil du module RH avec :
- **Statistiques clés** : Employés actifs, demandes de congés, masse salariale, contrats actifs
- **Actions rapides** : Liens vers les principales fonctionnalités
- **Activité récente** : Historique des dernières actions
- **Accès rapides** : Navigation vers les sous-modules

**Caractéristiques :**
- ✅ Design moderne avec cards et statistiques
- ✅ Icônes avec Hero Icons 2
- ✅ Responsive (mobile-first)
- ✅ Navigation intuitive vers les sous-modules

### 2. **Gestion des Employés** (`/hr/employees`)
Interface complète pour gérer les employés :
- **Liste des employés** avec recherche et filtres
- **Cartes statistiques** : Total, Actifs, En congé, Nouveaux
- **Table interactive** avec :
  - Informations complètes (nom, email, matricule)
  - Département et poste
  - Rôle et statut avec badges colorés
  - Menu d'actions (Voir, Modifier, Supprimer)
- **État vide** avec appel à l'action

**Caractéristiques :**
- ✅ Recherche en temps réel
- ✅ Badges de statut colorés (Actif, En congé, Suspendu, Terminé)
- ✅ Badges de rôle (Admin RH, Manager, Employé, Lecture seule)
- ✅ Menu dropdown pour chaque employé
- ✅ Responsive avec grille adaptative

### 3. **Gestion des Congés** (`/hr/leaves`)
Interface pour gérer les demandes de congés :
- **Statistiques** : En attente, Approuvés, Rejetés, Total
- **Système d'onglets** : Toutes, En attente, Approuvées, Rejetées
- **Table des demandes** avec :
  - Informations employé
  - Type de congé avec indicateur de couleur
  - Période et durée
  - Statut avec badges et icônes
  - Approbateur
  - Actions (Voir, Approuver, Rejeter)
- **Cartes supplémentaires** : Soldes de congés, Congés à venir

**Caractéristiques :**
- ✅ Filtrage par statut via onglets
- ✅ Badges de statut avec icônes
- ✅ Indicateurs colorés par type de congé
- ✅ Actions contextuelles selon le statut
- ✅ État vide informatif

### 4. **Gestion de la Paie** (`/hr/payroll`)
Interface pour gérer la paie et les fiches de paie :
- **Statistiques** : Masse salariale, Fiches de paie, En attente, Payées
- **Deux onglets principaux** :
  - **Périodes de paie** : Gestion des périodes mensuelles
  - **Fiches de paie** : Détails des fiches individuelles
- **Table des périodes** avec :
  - Nom de la période
  - Dates et date de paiement
  - Nombre de fiches
  - Total (masse salariale)
  - Statut et actions
- **Table des fiches** avec :
  - Informations employé
  - Salaire base, brut, net
  - Statut
  - Actions (Voir, Télécharger PDF, Marquer comme payé)

**Caractéristiques :**
- ✅ Formatage des montants en devise locale
- ✅ Système d'onglets pour séparer périodes et fiches
- ✅ Actions contextuelles selon le statut
- ✅ Support multi-devises
- ✅ État vide avec call-to-action

## 🎨 Design System

### Composants UI utilisés
- **Card** : Conteneurs pour les statistiques et sections
- **Button** : Actions principales et secondaires
- **Badge** : Statuts et rôles
- **Table** : Listes de données
- **Tabs** : Navigation entre vues
- **DropdownMenu** : Menus d'actions
- **Input** : Champs de recherche

### Palette de couleurs
- **Bleu** : Employés, navigation
- **Vert** : Statuts approuvés, paie
- **Orange** : En attente, alertes
- **Rouge** : Statuts rejetés, suppressions
- **Violet** : Congés, RH admin
- **Gris** : Informations neutres

### Icônes (Hero Icons 2)
- `HiOutlineUsers` : Employés
- `HiOutlineCalendar` : Congés
- `HiOutlineBanknotes` : Paie
- `HiOutlineBriefcase` : Contrats
- `HiOutlineCheckCircle` : Approbation
- `HiOutlineXCircle` : Rejet
- Et bien d'autres...

## 🔗 Intégration avec le Backend

### Endpoints API à connecter

#### Employés
```typescript
GET    /api/hr/employees/           // Liste des employés
POST   /api/hr/employees/           // Créer un employé
GET    /api/hr/employees/:id/       // Détails
PATCH  /api/hr/employees/:id/       // Modifier
DELETE /api/hr/employees/:id/       // Supprimer
POST   /api/hr/employees/:id/activate/   // Activer
POST   /api/hr/employees/:id/deactivate/ // Désactiver
```

#### Congés
```typescript
GET    /api/hr/leave-requests/      // Liste des demandes
POST   /api/hr/leave-requests/      // Créer une demande
GET    /api/hr/leave-requests/:id/  // Détails
POST   /api/hr/leave-requests/:id/approve/  // Approuver
POST   /api/hr/leave-requests/:id/reject/   // Rejeter
GET    /api/hr/leave-balances/      // Soldes de congés
GET    /api/hr/leave-types/         // Types de congés
```

#### Paie
```typescript
GET    /api/hr/payroll-periods/     // Périodes de paie
POST   /api/hr/payroll-periods/     // Créer une période
GET    /api/hr/payslips/            // Fiches de paie
POST   /api/hr/payslips/            // Créer une fiche
POST   /api/hr/payslips/:id/mark_as_paid/  // Marquer comme payé
```

## 📝 Prochaines étapes

### À implémenter
1. **Connexion API**
   - Créer les hooks React Query pour les appels API
   - Gérer les états de chargement et erreurs
   - Implémenter la pagination

2. **Formulaires**
   - Créer un employé (modal ou page)
   - Modifier un employé
   - Créer une demande de congé
   - Créer une période de paie

3. **Pages de détails**
   - Profil employé complet
   - Détails d'une demande de congé
   - Détails d'une fiche de paie

4. **Fonctionnalités avancées**
   - Calendrier des congés
   - Graphiques et statistiques
   - Export PDF des fiches de paie
   - Notifications
   - Historique des modifications

5. **Permissions**
   - Implémenter les restrictions basées sur les rôles
   - Différencier AdminUser et Employee

## 🚀 Utilisation

### Navigation
Le menu de navigation est déjà configuré dans `org-sidebar.tsx` avec :
- Menu principal "RH" qui pointe vers `/apps/[slug]/hr`
- Sous-menu déroulant avec :
  - Employés → `/apps/[slug]/hr/employees`
  - Congés → `/apps/[slug]/hr/leaves`
  - Paie → `/apps/[slug]/hr/payroll`

### Workflow typique

**Pour un Admin RH :**
1. Accéder au dashboard RH
2. Créer/gérer les employés
3. Approuver les demandes de congés
4. Générer et traiter la paie

**Pour un Manager :**
1. Voir les employés de son équipe
2. Approuver/rejeter les congés
3. Consulter les informations de paie

**Pour un Employé :**
1. Voir son profil
2. Demander des congés
3. Consulter ses fiches de paie

## 🎯 Points clés

- ✅ **100% TypeScript** pour la sécurité des types
- ✅ **Responsive Design** mobile-first
- ✅ **Accessibilité** avec ARIA labels
- ✅ **Performance** avec lazy loading prévu
- ✅ **UX moderne** avec animations subtiles
- ✅ **Code maintenable** et bien structuré

## 📱 Responsive Breakpoints

- **Mobile** : < 640px (sm)
- **Tablet** : 640px - 1024px (md/lg)
- **Desktop** : > 1024px (lg/xl)

Toutes les pages s'adaptent automatiquement à ces breakpoints avec des grilles responsives.

---

**Note** : Les données affichées sont actuellement des mock data. Il faudra implémenter les appels API pour récupérer les vraies données du backend Django.
