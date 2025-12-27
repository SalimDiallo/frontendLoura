# Implémentation du Système de Permissions

## Résumé

Un système complet de gestion des permissions a été implémenté pour contrôler l'accès aux routes et fonctionnalités de l'application.

## Fichiers Créés

### Types et Configuration

1. **`lib/types/shared/permissions.ts`**
   - Types pour les ressources et actions (ResourceType, PermissionAction)
   - Interfaces pour les vérifications de permissions
   - Helpers pour créer et parser les codes de permissions
   - Constantes de permissions communes (COMMON_PERMISSIONS)

2. **`lib/config/route-permissions.ts`**
   - Configuration des permissions requises pour chaque route
   - Fonction helper pour obtenir la config d'une route
   - Matching des routes dynamiques

### Composants

3. **`components/apps/common/org-access-guard.tsx`**
   - Vérifie que l'utilisateur est authentifié
   - Vérifie que l'utilisateur est membre de l'organisation
   - Vérifie que l'organisation est active
   - Affiche un message d'erreur élégant si accès refusé

4. **`components/apps/common/permission-provider.tsx`**
   - Context Provider pour les permissions
   - Charge les permissions de l'utilisateur pour l'organisation
   - Fournit les fonctions hasPermission, can, cannot, etc.

5. **`components/apps/common/protected-route.tsx`**
   - Composant `ProtectedRoute` pour protéger une route complète
   - Composant `Can` pour afficher conditionnellement du contenu
   - Composant `Cannot` pour l'inverse de Can

6. **`components/apps/common/index.ts`**
   - Export centralisé de tous les composants de permissions

### Hooks

7. **`lib/hooks/use-permissions.ts`**
   - Hook `usePermissions()` pour utiliser les permissions
   - Hook `useOrganizationPermissions()` pour une organisation spécifique
   - Fonctions helpers pour vérifier les permissions

### Fichiers Modifiés

8. **`app/apps/(org)/[slug]/layout.tsx`**
   - Ajout du `OrgAccessGuard` et `PermissionProvider`
   - Protection de toutes les routes de l'organisation

9. **`app/apps/(org)/[slug]/hr/employees/page.tsx`** (exemple)
   - Protection de la route avec `ProtectedRoute`
   - Actions conditionnelles avec `Can`
   - Boutons protégés par permissions

10. **`lib/types/shared/index.ts`**
    - Export des types de permissions

11. **`lib/hooks/index.ts`**
    - Export des hooks de permissions

### Documentation

12. **`PERMISSIONS_GUIDE.md`**
    - Guide complet d'utilisation du système de permissions
    - Exemples de code
    - Bonnes pratiques

13. **`PERMISSIONS_IMPLEMENTATION.md`** (ce fichier)
    - Résumé de l'implémentation

## Fonctionnalités

### Protection à Deux Niveaux

1. **Niveau Organisation (OrgAccessGuard)**
   - Authentification requise
   - Appartenance à l'organisation (admin ou employé)
   - Organisation active
   - Redirection automatique si non autorisé

2. **Niveau Permissions (ProtectedRoute & Can)**
   - Vérification des permissions spécifiques
   - OR logic (au moins une permission)
   - AND logic (toutes les permissions)
   - Custom checks possibles

### Composants de Protection

#### ProtectedRoute
```tsx
<ProtectedRoute config={HR_ROUTE_PERMISSIONS['/hr/employees']}>
  <PageContent />
</ProtectedRoute>
```

#### Can
```tsx
<Can permission="employee.create">
  <Button>Créer</Button>
</Can>

<Can anyPermission={['employee.create', 'employee.manage']}>
  <Button>Action</Button>
</Can>

<Can allPermissions={['employee.view', 'department.view']}>
  <Button>Action</Button>
</Can>
```

#### Cannot
```tsx
<Cannot permission="employee.delete">
  <Message>Vous ne pouvez pas supprimer</Message>
</Cannot>
```

### Hooks

```tsx
const { can, cannot, hasPermission } = usePermissionContext();

if (can('employee', 'delete')) {
  // Action autorisée
}

if (hasPermission('employee.create')) {
  // Permission présente
}
```

## Codes de Permissions

Format : `resource.action`

### Exemples
- `employee.view` - Voir les employés
- `employee.create` - Créer des employés
- `employee.update` - Modifier des employés
- `employee.delete` - Supprimer des employés
- `employee.manage` - Gestion complète
- `department.view` - Voir les départements
- `role.view` - Voir les rôles
- `leave_request.approve` - Approuver les congés
- `payroll.export` - Exporter les fiches de paie

## Configuration des Routes

### Format de Configuration

```typescript
'/hr/employees': {
  requiredPermissions: [
    { resource: ResourceType.EMPLOYEE, action: PermissionAction.VIEW }
  ],
  deniedMessage: "Message personnalisé",
  redirectTo: '/path/to/redirect', // Optionnel
}
```

### Routes Protégées (HR Module)

- `/hr` - Dashboard HR
- `/hr/employees` - Liste des employés
- `/hr/employees/create` - Création d'employé
- `/hr/employees/[id]` - Détails d'employé
- `/hr/employees/[id]/edit` - Modification d'employé
- `/hr/departments` - Liste des départements
- `/hr/departments/create` - Création de département
- `/hr/departments/[id]/edit` - Modification de département
- `/hr/roles` - Liste des rôles
- `/hr/roles/create` - Création de rôle
- `/hr/roles/[id]/edit` - Modification de rôle
- `/hr/leaves` - Demandes de congés
- `/hr/leaves/create` - Création de demande
- `/hr/payroll` - Fiches de paie

## Flux d'Authentification

1. Utilisateur accède à `/apps/{slug}/...`
2. `OrgAccessGuard` vérifie :
   - Token d'authentification présent ?
   - Utilisateur membre de l'organisation ?
   - Organisation active ?
3. Si OK → `PermissionProvider` charge les permissions
4. Chaque page vérifie les permissions avec `ProtectedRoute`
5. Les actions utilisent `Can` pour affichage conditionnel

## Intégration Backend (TODO)

Actuellement, les permissions sont mockées. Pour connecter au backend :

1. **Modifier `permission-provider.tsx` ligne 48-70** :
   ```typescript
   // Remplacer les données mockées par un vrai appel API
   const response = await apiClient.get<Employee>(
     `/hr/auth/me/?organization=${slug}`
   );
   ```

2. **Gérer le cache** pour éviter les appels multiples

3. **Implémenter le rafraîchissement** des permissions

## Avantages du Système

1. **Sécurité Multi-Niveaux**
   - Organisation + Permissions
   - Protection route ET actions

2. **Flexible**
   - OR/AND logic
   - Custom checks
   - Messages personnalisés

3. **User-Friendly**
   - Messages d'erreur clairs
   - Redirection intelligente
   - UI élégante

4. **Maintenable**
   - Configuration centralisée
   - Types TypeScript stricts
   - Documentation complète

5. **Performant**
   - Context React
   - Vérifications côté client
   - Chargement optimisé

## Tests à Effectuer

- [ ] Accès sans authentification
- [ ] Accès à une organisation non membre
- [ ] Accès à une organisation désactivée
- [ ] Routes avec permissions manquantes
- [ ] Routes avec permissions correctes
- [ ] Boutons conditionnels
- [ ] Navigation directe via URL
- [ ] Différents rôles utilisateurs

## Prochaines Étapes

1. Connecter au backend Django
2. Implémenter le cache de permissions
3. Ajouter plus de routes protégées
4. Créer des tests unitaires
5. Ajouter des analytics de permissions
6. Gérer les permissions hiérarchiques (manager, etc.)

## Support

Pour toute question ou problème :
1. Consulter `PERMISSIONS_GUIDE.md`
2. Vérifier les types dans `lib/types/shared/permissions.ts`
3. Examiner l'exemple dans `app/apps/(org)/[slug]/hr/employees/page.tsx`
