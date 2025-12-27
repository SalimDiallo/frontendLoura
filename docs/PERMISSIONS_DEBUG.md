# Guide de Diagnostic des Permissions

## 🔍 Comment vérifier si les permissions fonctionnent

### 1. Ouvrir la console du navigateur

Appuyez sur **F12** ou **Ctrl+Shift+I** pour ouvrir les DevTools de votre navigateur.

### 2. Regarder les logs

Lorsque vous chargez une page, vous devriez voir des logs comme ceci dans la console:

```
[usePermissions] Current user: {id: "...", email: "...", userType: "employee", ...}
[usePermissions] User type: employee
[usePermissions] Is admin: false
[usePermissions] Employee role: {code: "manager", name: "Manager d'équipe", ...}
[usePermissions] Employee all_permissions: [{code: "can_view_attendance", ...}, ...]
[usePermissions] Employee custom_permissions: []
[usePermissions] Final permissions: ["can_view_attendance", "can_approve_attendance", ...]
```

### 3. Vérifier les permissions dans localStorage

Dans la console, tapez:

```javascript
JSON.parse(localStorage.getItem('user'))
```

Vous devriez voir un objet avec:
- `userType: "employee"` (pour un employé)
- `role: { ... }` (le rôle complet avec permissions)
- `all_permissions: [...]` (toutes les permissions)

### 4. Tester les différents scénarios

#### Scénario A: Employee SANS permission `can_approve_attendance`

**Attendu:**
- ✅ Le bouton "Validations" dans `/hr/attendance` est CACHÉ
- ✅ Si vous accédez directement à `/hr/attendance/approvals`, vous êtes REDIRIGÉ vers `/hr/attendance`

#### Scénario B: Employee AVEC permission `can_approve_attendance`

**Attendu:**
- ✅ Le bouton "Validations" dans `/hr/attendance` est VISIBLE
- ✅ Vous pouvez accéder à `/hr/attendance/approvals`
- ✅ Vous pouvez approuver/rejeter des pointages

#### Scénario C: AdminUser

**Attendu:**
- ✅ Le bouton "Validations" est VISIBLE
- ✅ Accès complet à toutes les pages
- ✅ Peut tout faire (bypass toutes permissions)

### 5. Problèmes courants et solutions

#### Problème 1: Le bouton "Validations" ne s'affiche pas pour un manager

**Diagnostic:**
```javascript
// Dans la console
const user = JSON.parse(localStorage.getItem('user'))
console.log('User type:', user.userType)
console.log('Role:', user.role)
console.log('All permissions:', user.all_permissions)
```

**Solution:**
- Vérifiez que `user.all_permissions` contient bien `{code: "can_approve_attendance"}`
- Si non, vérifiez que le rôle du backend a bien cette permission

#### Problème 2: Les permissions sont vides `[]`

**Cause possible:** L'utilisateur stocké dans localStorage ne contient pas les bonnes données

**Solution:**
1. Se déconnecter
2. Se reconnecter pour forcer le rechargement des données
3. Vérifier que l'API `/hr/auth/me/` retourne bien `all_permissions`

#### Problème 3: "Cannot read property 'code' of undefined"

**Cause:** Le format des permissions dans localStorage n'est pas correct

**Solution:**
```javascript
// Effacer le cache
localStorage.clear()
// Se reconnecter
```

### 6. Tester l'API directement

#### Vérifier les permissions d'un employé

```bash
# 1. Se connecter
curl -X POST http://localhost:8000/api/hr/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@example.com", "password": "password"}'

# Récupérer le token access dans la réponse

# 2. Récupérer les infos de l'employé
curl -X GET http://localhost:8000/api/hr/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Organization-Slug: your-org"
```

La réponse devrait contenir:
```json
{
  "id": "...",
  "email": "...",
  "role": {
    "code": "manager",
    "name": "Manager d'équipe",
    "permissions": [
      {"code": "can_view_attendance", "name": "Voir les pointages"},
      {"code": "can_approve_attendance", "name": "Approuver des pointages"}
    ]
  },
  "all_permissions": [
    {"code": "can_view_attendance", "name": "Voir les pointages"},
    {"code": "can_approve_attendance", "name": "Approuver des pointages"}
  ],
  "custom_permissions": []
}
```

### 7. Vérifier les permissions au niveau API

#### Test: Employee normal essaie d'accéder aux validations

```bash
curl -X GET "http://localhost:8000/api/hr/attendances/?page=1&page_size=100" \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -H "X-Organization-Slug: your-org"
```

**Attendu:**
- Si l'employee n'a PAS `can_view_all_attendance`: retourne seulement SES pointages
- Si l'employee a `can_view_all_attendance`: retourne TOUS les pointages

#### Test: Employee essaie d'approuver un pointage

```bash
curl -X POST "http://localhost:8000/api/hr/attendances/ATTENDANCE_ID/approve/" \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -H "X-Organization-Slug: your-org" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'
```

**Attendu:**
- Si l'employee n'a PAS `can_approve_attendance`: erreur 403
- Si l'employee a `can_approve_attendance`: succès 200

## 🎯 Checklist de vérification complète

- [ ] Les logs `[usePermissions]` apparaissent dans la console
- [ ] `localStorage.getItem('user')` contient `userType`, `role`, et `all_permissions`
- [ ] Pour un AdminUser: `permissions = ['*']` dans les logs
- [ ] Pour un Employee: `permissions = [liste de codes]` dans les logs
- [ ] Le bouton "Validations" s'affiche/cache selon les permissions
- [ ] La redirection fonctionne si accès non autorisé à `/approvals`
- [ ] L'API retourne 403 si pas de permission
- [ ] L'API retourne les bonnes données selon les permissions (filtrage)

## 🚨 Si ça ne marche toujours pas

1. **Vérifiez que vous êtes bien connecté**
   ```javascript
   localStorage.getItem('access_token') // doit retourner un token
   ```

2. **Effacez complètement le cache**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

3. **Reconnectez-vous** et vérifiez immédiatement les logs

4. **Vérifiez le rôle dans la base de données**
   - Le rôle a-t-il bien les permissions ?
   - L'employee a-t-il bien un rôle assigné ?

5. **Vérifiez les constantes backend**
   - Fichier: `/backend/app/hr/constants.py`
   - Le rôle contient-il `can_approve_attendance` ?
