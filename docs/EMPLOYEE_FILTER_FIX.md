# Correction du Filtrage des Employés par Organisation

## Problème Initial
Les employés de toutes les organisations de l'AdminUser étaient retournés, pas seulement ceux de l'organisation courante.

## Cause
Le backend filtrait par **toutes** les organisations de l'utilisateur, sans tenir compte de l'organisation spécifique demandée dans l'URL.

## Solution Implémentée

### 1. Backend - Modification du ViewSet (`app/hr/views.py:191-225`)

**Avant** :
```python
def get_queryset(self):
    if isinstance(user, AdminUser):
        org_ids = user.organizations.values_list('id', flat=True)
        return Employee.objects.filter(organization_id__in=org_ids)
```

**Après** :
```python
def get_queryset(self):
    # Accepte les paramètres de query:
    # - organization_subdomain: filtre par subdomain
    # - organization: filtre par ID

    org_subdomain = self.request.query_params.get('organization_subdomain')
    org_id = self.request.query_params.get('organization')

    if isinstance(user, AdminUser):
        accessible_orgs = user.organizations.all()

        if org_subdomain:
            # Filtre par subdomain spécifique
            queryset = Employee.objects.filter(
                organization__subdomain=org_subdomain,
                organization__in=accessible_orgs
            )
        elif org_id:
            # Filtre par ID spécifique
            queryset = Employee.objects.filter(
                organization_id=org_id,
                organization__in=accessible_orgs
            )
        else:
            # Pas de filtre = tous les employés de toutes les orgs
            queryset = Employee.objects.filter(organization__in=accessible_orgs)
```

### 2. Frontend - Service (`lib/services/hr/employee.service.ts:19-60`)

**Avant** :
```typescript
export async function getEmployees(params?: {...}): Promise<EmployeeListResponse>
```

**Après** :
```typescript
export async function getEmployees(
  organizationSlug: string,  // ← Nouveau paramètre obligatoire
  params?: {...}
): Promise<EmployeeListResponse> {
  const searchParams = new URLSearchParams();

  // Envoie le subdomain au backend
  searchParams.append('organization_subdomain', organizationSlug);
  // ...
}
```

### 3. Frontend - Page (`app/apps/(org)/[slug]/hr/employees/page.tsx:59`)

**Avant** :
```typescript
const data = await getEmployees();
```

**Après** :
```typescript
const data = await getEmployees(slug);  // ← Passe le slug de l'org
```

## Comportement Final

### Cas 1 : AdminUser accède à `/apps/louradesign/hr/employees`
- Frontend envoie : `GET /api/hr/employees/?organization_subdomain=louradesign`
- Backend vérifie :
  1. L'AdminUser a-t-il accès à "louradesign" ? ✓
  2. Retourne uniquement les employés de "louradesign"

### Cas 2 : AdminUser accède à `/apps/autre-org/hr/employees`
- Frontend envoie : `GET /api/hr/employees/?organization_subdomain=autre-org`
- Backend vérifie :
  1. L'AdminUser a-t-il accès à "autre-org" ?
  2. Si non → Retourne liste vide
  3. Si oui → Retourne les employés de "autre-org"

### Cas 3 : Employee accède à `/apps/son-org/hr/employees`
- Frontend envoie : `GET /api/hr/employees/?organization_subdomain=son-org`
- Backend ignore le paramètre et retourne toujours les employés de l'organisation de l'Employee

## Sécurité

✅ **Vérification des permissions** : Le backend vérifie toujours que l'AdminUser a accès à l'organisation demandée
✅ **Isolation multi-tenant** : Un Employee ne voit que son organisation, même s'il essaie de modifier l'URL
✅ **Pas de bypass possible** : Le backend fait la vérification côté serveur

## Tests

### Test 1 : Lister les employés d'une organisation spécifique
```http
GET http://localhost:8000/api/hr/employees/?organization_subdomain=louradesign
Authorization: Bearer {{accessToken}}
```

**Résultat attendu** : Uniquement les employés de "louradesign"

### Test 2 : Lister tous les employés (sans filtre)
```http
GET http://localhost:8000/api/hr/employees/
Authorization: Bearer {{accessToken}}
```

**Résultat attendu** : Employés de toutes les organisations de l'AdminUser

### Test 3 : Tenter d'accéder à une org non autorisée
```http
GET http://localhost:8000/api/hr/employees/?organization_subdomain=org-non-autorisee
Authorization: Bearer {{accessToken}}
```

**Résultat attendu** : Liste vide (pas d'erreur, juste aucun résultat)

## Fichiers Modifiés

1. **Backend** :
   - `app/hr/views.py` (ligne 191-225)
   - `requests_test/test_hr_endpoints.http` (ligne 68-79)

2. **Frontend** :
   - `lib/services/hr/employee.service.ts` (ligne 19-60)
   - `app/apps/(org)/[slug]/hr/employees/page.tsx` (ligne 54, 59)

## Migration

### Si vous avez d'autres appels à `getEmployees()`

Recherchez tous les appels :
```bash
cd lourafrontend
grep -r "getEmployees()" app/ lib/
```

Mettez-les à jour pour passer le slug :
```typescript
// Avant
const employees = await getEmployees();

// Après
const employees = await getEmployees(organizationSlug);
```

## Améliorations Futures

1. **Cache des employés** : Éviter de recharger à chaque navigation
2. **Pagination** : Pour les grandes listes
3. **Recherche côté serveur** : Plus performant pour de gros volumes
4. **WebSocket** : Mise à jour en temps réel quand un employé est ajouté/modifié

## Notes Importantes

- Le paramètre `organization_subdomain` est maintenant **automatiquement ajouté** par le service
- Les développeurs n'ont qu'à passer le slug, le reste est géré
- Le backend reste rétrocompatible : sans paramètre, il retourne tous les employés autorisés
