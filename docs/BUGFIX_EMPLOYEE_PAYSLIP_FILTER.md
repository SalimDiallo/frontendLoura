# Correction du Bug - Filtre des Fiches de Paie par Employé

## 🐛 Problème Identifié

**Erreur :** "Employee mismatch: payslip employee XXX != advance employee YYY"

**Cause :** Lors de la sélection d'une fiche de paie pour déduire une avance, le système affichait TOUTES les fiches de paie de l'organisation au lieu de filtrer uniquement celles de l'employé concerné.

**Conséquence :** L'utilisateur pouvait sélectionner une fiche de paie d'un autre employé, causant une erreur 400 Bad Request.

## ✅ Solution Implémentée

### 1. **Backend - Ajout du Filtre par Employé** (`app/hr/views.py`)

**Avant :**
```python
def get_queryset(self):
    # ... code d'autorisation ...
    return Payslip.objects.filter(employee__organization=user.organization)
    # ❌ Pas de filtrage par employé depuis les query params
```

**Après :**
```python
def get_queryset(self):
    # ... code d'autorisation ...
    queryset = Payslip.objects.filter(employee__organization=user.organization)

    # ✅ Filtrage par paramètres de requête
    employee_id = self.request.query_params.get('employee')
    if employee_id:
        queryset = queryset.filter(employee_id=employee_id)

    status_filter = self.request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    return queryset
```

### 2. **Frontend - Double Filtrage de Sécurité** (`pages/advances/page.tsx`)

**Ajout d'un filtre côté client en plus du filtre backend :**

```typescript
const loadPayslipsForEmployee = async (employeeId: string, advanceAmount: number) => {
  // ✅ Requête avec filtre employee
  const payslipsData = await getPayrolls(slug, {
    employee: employeeId,
  });

  // ✅ Double filtrage côté client (sécurité)
  const employeePayslips = payslipsData.results.filter(
    (payslip: Payroll) => payslip.employee === employeeId
  );

  // ✅ Filtrage par salaire net suffisant
  const eligiblePayslips = employeePayslips.filter(
    (payslip: Payroll) => (payslip.net_salary || 0) >= advanceAmount
  );

  setPayslips(eligiblePayslips);
}
```

### 3. **Amélioration de l'Interface Utilisateur**

**Dialogue de déduction amélioré :**

```tsx
<DialogHeader>
  <DialogTitle>Déduire l'avance de la paie</DialogTitle>
  <DialogDescription>
    Sélectionnez la fiche de paie de {selectedAdvance?.employee_name} pour déduire cette avance
  </DialogDescription>
</DialogHeader>

{/* ✅ Alert informative */}
<Alert className="bg-amber-50 border-amber-200">
  <p className="font-semibold">Employé : {selectedAdvance.employee_name}</p>
  <p className="text-sm">
    Seules les fiches de paie de cet employé sont affichées ci-dessous
  </p>
</Alert>

{/* ✅ Label clair */}
<label>Fiche de paie de {selectedAdvance.employee_name} *</label>

{/* ✅ Message si aucune fiche disponible */}
{payslips.length === 0 && (
  <Alert variant="warning">
    Aucune fiche de paie disponible pour {selectedAdvance.employee_name}.
    Veuillez d'abord créer une fiche de paie pour cet employé.
  </Alert>
)}
```

### 4. **Logging Détaillé pour Débogage**

**Frontend :**
```javascript
console.log('Loading payslips for employee:', employeeId);
console.log('Payslips received:', payslipsData.results.length);
console.log('Payslips for this employee after frontend filter:', employeePayslips.length);
console.log('Eligible payslips (net salary >= advance):', eligiblePayslips.length);
```

**Backend :**
```python
logger.info(f"Payslip ID received: {payslip_id}")
logger.info(f"Looking for payslip with ID: {payslip_id}")
logger.info(f"Payslip found: {payslip.id} for employee {payslip.employee.get_full_name()}")
logger.error(f"Employee mismatch: payslip employee {payslip.employee.id} != advance employee {advance.employee.id}")
```

## 🧪 Tests de Vérification

### Test 1 : Filtre Backend

```bash
# Requête avec filtre employee
curl "http://localhost:8000/api/hr/payslips/?organization_subdomain=louradesing&employee=XXX-YYY-ZZZ"

# ✅ Doit retourner UNIQUEMENT les fiches de paie de l'employé XXX-YYY-ZZZ
```

### Test 2 : Interface Utilisateur

1. Créer une avance pour Employé A
2. Marquer comme payée
3. Cliquer sur "Déduire de la paie"
4. Vérifier que seules les fiches de paie de l'Employé A apparaissent
5. ✅ Les fiches de paie des autres employés ne doivent PAS apparaître

### Test 3 : Logs Console

```javascript
// Console du navigateur (F12)
Loading payslips for employee: cb81d5fb-c0f8-43e8-b37c-0e6576a616ff
Payslips received: 1
Payslips data: [{
  id: "xxx-yyy-zzz",
  employee: "cb81d5fb-c0f8-43e8-b37c-0e6576a616ff",  // ✅ Même ID
  employee_name: "Jean Dupont",
  net_salary: 4500000
}]
Payslips for this employee after frontend filter: 1
Eligible payslips (net salary >= advance): 1
```

## 📊 Fichiers Modifiés

### Backend
- ✅ `/backend/app/hr/views.py` (ligne 739-764)
  - Ajout du filtrage par `employee` query param
  - Ajout du filtrage par `status` query param

### Frontend
- ✅ `/frontend/lourafrontend/app/apps/(org)/[slug]/hr/payroll/advances/page.tsx`
  - Fonction `loadPayslipsForEmployee` avec double filtrage
  - Logging console détaillé
  - Messages d'erreur explicites
  - Interface du dialogue améliorée

## 🎯 Résultat

**Avant :**
- ❌ Toutes les fiches de paie affichées (tous employés)
- ❌ Sélection d'une mauvaise fiche → Erreur 400
- ❌ Message d'erreur cryptique

**Après :**
- ✅ Seules les fiches de paie de l'employé concerné
- ✅ Double filtrage (backend + frontend) pour sécurité maximale
- ✅ Interface claire avec nom de l'employé
- ✅ Messages explicites si aucune fiche disponible
- ✅ Impossible de sélectionner une fiche d'un autre employé

## 🔍 Vérification Rapide

```bash
# 1. Démarrer le backend avec logs
cd backend
python manage.py runserver

# 2. Démarrer le frontend
cd frontend/lourafrontend
pnpm dev

# 3. Ouvrir la console du navigateur (F12)

# 4. Tester le workflow :
#    - Créer avance pour Employé A
#    - Approuver & Payer
#    - Créer fiche de paie pour Employé A
#    - Déduire l'avance
#    - ✅ Vérifier que seule la fiche de l'Employé A apparaît
```

## 📝 Notes Importantes

1. **Double Filtrage** : Le filtrage est fait à la fois côté backend (sécurité) ET côté frontend (UX)
2. **Validation Salaire** : Seules les fiches avec un salaire net >= montant avance sont affichées
3. **Logs Détaillés** : Chaque étape est loggée pour faciliter le débogage
4. **Messages Clairs** : L'utilisateur comprend pourquoi certaines fiches n'apparaissent pas

---

**Date de correction :** Décembre 2024
**Statut :** ✅ Corrigé et testé
**Version :** 2.1
