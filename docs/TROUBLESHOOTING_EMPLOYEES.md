# Troubleshooting - Impossible de Lister les Employés

## Problème
Vous ne pouvez pas voir la liste des employés dans `/apps/{slug}/hr/employees`

## Causes Possibles et Solutions

### 1. **Authentification Incorrecte**

#### Vérification
Ouvrez la console du navigateur (F12) et vérifiez :
```javascript
// Dans la console :
localStorage.getItem('access_token')
localStorage.getItem('user')
```

#### Problème Possible
- Vous êtes connecté avec un **AdminUser** mais vous essayez d'accéder aux employés d'une organisation dont vous n'êtes PAS l'admin
- Le token a expiré

#### Solution
1. **Vérifier que vous êtes l'admin de l'organisation** :
   - Le backend filtre automatiquement les employés par organisation
   - Si vous êtes AdminUser, vous ne verrez que les employés des organisations que vous avez créées
   - Vérifiez dans la console : votre user ID doit correspondre au `admin` de l'organisation

2. **Se reconnecter** :
   - Allez sur `/core/login`
   - Connectez-vous avec vos credentials AdminUser
   - Retournez sur la page des employés

### 2. **Aucun Employé dans l'Organisation**

#### Vérification
Ouvrez la console réseau (F12 > Network) :
- Filtrez par "employees"
- Rechargez la page
- Vérifiez la réponse de l'API

#### Réponse Attendue
```json
{
  "count": 0,
  "next": null,
  "previous": null,
  "results": []
}
```

#### Solution
Créer un employé via :
1. **L'interface** : `/apps/{slug}/hr/employees/create`
2. **L'API directement** (voir `requests_test/test_hr_endpoints.http:72`)

### 3. **Erreur API Backend**

#### Vérification dans la Console
```
Error loading employees: ApiError { status: 403, message: "..." }
Error loading employees: ApiError { status: 401, message: "..." }
Error loading employees: ApiError { status: 500, message: "..." }
```

#### Solutions par Code d'Erreur

**401 Unauthorized** :
- Token expiré → Se reconnecter
- Token invalide → Vider localStorage et se reconnecter
```javascript
localStorage.clear()
// Puis reconnectez-vous
```

**403 Forbidden** :
- Vous n'avez pas les permissions
- Vous n'êtes pas membre de cette organisation
- Solution : Vérifier que vous êtes bien l'admin de l'organisation

**500 Internal Server Error** :
- Erreur backend
- Vérifier les logs du backend Django

### 4. **Problème de Filtrage Backend**

Le backend (`app/hr/views.py:191-202`) filtre selon le type d'utilisateur :

```python
def get_queryset(self):
    user = self.request.user

    if isinstance(user, AdminUser):
        # AdminUser voit les employés de TOUTES ses organisations
        org_ids = user.organizations.values_list('id', flat=True)
        return Employee.objects.filter(organization_id__in=org_ids)

    elif isinstance(user, Employee):
        # Employee voit les employés de SON organisation uniquement
        return Employee.objects.filter(organization=user.organization)

    return Employee.objects.none()
```

#### Vérification
Dans le backend Django shell :
```bash
cd /home/salim/Projets/loura/stack/backend
python manage.py shell
```

```python
from core.models import AdminUser, Organization
from hr.models import Employee

# Trouver votre user
user = AdminUser.objects.get(email="votre@email.com")

# Vérifier vos organisations
orgs = user.organizations.all()
print(f"Organisations: {list(orgs)}")

# Vérifier les employés
org_ids = user.organizations.values_list('id', flat=True)
employees = Employee.objects.filter(organization_id__in=org_ids)
print(f"Employés: {list(employees)}")
```

### 5. **Erreur d'Hydration (déjà corrigée)**

Si vous voyez encore des erreurs d'hydration, c'est que les composants `OrgAccessGuard` et `PermissionProvider` ne sont pas correctement montés.

#### Vérification
Les fichiers suivants doivent contenir `isMounted` :
- `components/apps/common/org-access-guard.tsx:30`
- `components/apps/common/permission-provider.tsx:40`

## Procédure de Diagnostic Complète

### Étape 1 : Vérifier l'Authentification
```javascript
// Console navigateur
const token = localStorage.getItem('access_token');
const user = JSON.parse(localStorage.getItem('user'));

console.log('Token:', token ? 'Présent' : 'Absent');
console.log('User:', user);
```

### Étape 2 : Vérifier l'Appel API
1. Ouvrir DevTools (F12)
2. Onglet Network
3. Recharger la page `/apps/{slug}/hr/employees`
4. Chercher la requête `employees/`
5. Vérifier :
   - **Status Code** : 200, 401, 403, 500 ?
   - **Response** : Contenu de la réponse
   - **Request Headers** : Token présent ?

### Étape 3 : Vérifier les Logs Console
```
Employees data: { count: 0, results: [] }  ← Pas d'employés
Error loading employees: ...                ← Erreur API
```

### Étape 4 : Tester avec l'API Directement

Utilisez le fichier `requests_test/test_hr_endpoints.http` :

```http
### Variables
@accessToken = VOTRE_TOKEN_ICI
@baseUrl = http://localhost:8000/api/hr

### Tester la liste des employés
GET {{baseUrl}}/employees/
Authorization: Bearer {{accessToken}}
```

Si ça fonctionne en HTTP mais pas dans le frontend → Problème frontend
Si ça ne fonctionne pas en HTTP → Problème backend

## Solutions Rapides

### Solution 1 : Reset Complet
```javascript
// Console navigateur
localStorage.clear();
// Puis reconnectez-vous
```

### Solution 2 : Créer un Employé Test
Via l'API ou l'interface, créez un employé pour tester.

### Solution 3 : Vérifier le Backend
```bash
cd /home/salim/Projets/loura/stack/backend
python manage.py runserver

# Dans un autre terminal
python manage.py shell

# Vérifier les données
from hr.models import Employee
print(Employee.objects.all())
```

## Commandes Utiles

### Frontend
```bash
cd /home/salim/Projets/loura/stack/frontend/lourafrontend

# Vérifier les logs
pnpm dev

# Vérifier les imports
grep -r "getEmployees" app/
```

### Backend
```bash
cd /home/salim/Projets/loura/stack/backend

# Lancer le serveur
python manage.py runserver

# Voir les logs en temps réel
# Les logs s'affichent dans le terminal

# Créer un employé via shell
python manage.py shell
```

```python
from core.models import Organization
from hr.models import Employee

org = Organization.objects.first()
emp = Employee.objects.create(
    email="test@test.com",
    first_name="Test",
    last_name="User",
    organization=org,
    employment_status="active"
)
emp.set_password("Test123!")
emp.save()
```

## Vérification Finale

Si tout est correct, vous devriez voir :
1. **Console navigateur** : `Employees data: { count: N, results: [...] }`
2. **Network** : Status 200 avec des données
3. **Interface** : Liste des employés affichée

## Besoin d'Aide ?

Si le problème persiste :
1. Regardez les logs console (F12)
2. Regardez les logs backend (terminal Django)
3. Vérifiez le status code de la requête API
4. Envoyez ces informations pour diagnostic
