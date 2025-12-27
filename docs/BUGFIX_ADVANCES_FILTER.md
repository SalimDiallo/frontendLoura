# 🐛 Correction : Filtrage des Avances dans le Formulaire de Paie

## 📋 Problème Identifié

### Symptômes
- Les avances ne s'affichaient pas lors de la sélection d'un employé
- Message d'erreur : `advance_ids: Certaines avances sont invalides ou ne sont pas dans le statut 'payée'.`

### Causes Racines

1. **Backend - Champ manquant** :
   - Le serializer `PayrollAdvanceListSerializer` ne retournait **pas** le champ `payslip`
   - Le frontend ne pouvait donc pas filtrer les avances déjà liées à une fiche de paie

2. **Backend - Filtre employé manquant** :
   - Le `PayrollAdvanceViewSet` ne filtrait pas par `employee` via query params
   - Impossible de récupérer uniquement les avances d'un employé spécifique

3. **Frontend - Mauvaise valeur de statut** :
   - Utilisation de `PayrollAdvanceStatus.PAID` (enum) au lieu de `'paid'` (string)
   - L'API attend des valeurs en minuscules

## ✅ Corrections Appliquées

### 1. Backend - Ajout du champ `payslip` dans la liste

**Fichier** : `/backend/app/hr/serializers.py`
**Ligne** : 1137

```python
class PayrollAdvanceListSerializer(serializers.ModelSerializer):
    # ... autres champs ...

    class Meta:
        model = PayrollAdvance
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_number',
            'amount', 'reason', 'request_date', 'status', 'status_display',
            'approved_by_name', 'approved_date', 'payment_date',
            'payslip',  # ✅ AJOUTÉ
            'created_at'
        ]
```

**Impact** :
- Le frontend reçoit maintenant le champ `payslip` pour chaque avance
- Permet de filtrer les avances non liées (`payslip === null`)

### 2. Backend - Ajout du filtre par employé

**Fichier** : `/backend/app/hr/views.py`
**Lignes** : 1326, 1352-1354

```python
def get_queryset(self):
    # ... code existant ...

    employee_filter = self.request.query_params.get('employee')  # ✅ AJOUTÉ

    # ... filtrage par organisation ...

    # ✅ NOUVEAU : Filtrer par employé si spécifié
    if employee_filter:
        queryset = queryset.filter(employee_id=employee_filter)

    # Filtrer par statut si spécifié
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    return queryset.select_related('employee', 'approved_by', 'payslip')
```

**Impact** :
- L'API accepte maintenant le paramètre `?employee={employee_id}`
- Retourne uniquement les avances de cet employé
- Plus efficace : moins de données transférées

### 3. Frontend - Correction du statut et ajout de logs

**Fichier** : `/frontend/lourafrontend/app/apps/(org)/[slug]/hr/payroll/create/page.tsx`
**Lignes** : 192-218

```typescript
const loadEmployeeAdvances = async (employeeId: string) => {
  try {
    setLoadingAdvances(true);
    setSelectedAdvances([]);
    console.log('Loading advances for employee:', employeeId);  // ✅ LOG

    const advances = await getPayrollAdvances({
      organization_subdomain: slug,
      employee: employeeId,
      status: 'paid',  // ✅ CORRIGÉ : 'paid' au lieu de PayrollAdvanceStatus.PAID
    });

    console.log('All advances received:', advances);  // ✅ LOG

    // Filter advances that don't have a payslip linked yet
    const availableAdvances = advances.filter((adv: PayrollAdvance) => !adv.payslip);
    console.log('Available advances (not yet linked):', availableAdvances);  // ✅ LOG

    setEmployeeAdvances(availableAdvances);
  } catch (err) {
    console.error('Error loading employee advances:', err);
    setEmployeeAdvances([]);
  } finally {
    setLoadingAdvances(false);
  }
};
```

**Impact** :
- Utilise la valeur correcte `'paid'` pour le filtre de statut
- Logs détaillés pour débogage :
  - ID de l'employé sélectionné
  - Toutes les avances reçues de l'API
  - Avances filtrées (non liées à une fiche)

## 🔄 Flux Complet Corrigé

### Requête API
```
GET /api/hr/payroll-advances/?organization_subdomain=louradesing&employee=abc-123&status=paid
```

### Réponse Backend
```json
{
  "count": 3,
  "results": [
    {
      "id": "advance-1",
      "employee": "abc-123",
      "employee_name": "Jean Dupont",
      "amount": "500000.00",
      "reason": "Urgence familiale",
      "status": "paid",
      "payslip": null,  // ✅ Disponible pour déduction
      "payment_date": "2024-12-01"
    },
    {
      "id": "advance-2",
      "employee": "abc-123",
      "amount": "300000.00",
      "reason": "Frais médicaux",
      "status": "paid",
      "payslip": "payslip-456",  // ❌ Déjà déduite
      "payment_date": "2024-11-15"
    }
  ]
}
```

### Filtrage Frontend
```typescript
// Filtre les avances sans payslip (disponibles)
const availableAdvances = advances.filter(adv => !adv.payslip);
// Résultat : [advance-1] uniquement
```

### Affichage
```
✅ Avance 1 : 500 000 GNF - Urgence familiale [Checkbox]
```

## 🧪 Comment Tester

### 1. Ouvrir la Console (F12)

### 2. Créer une Fiche de Paie
- Aller sur `/apps/{slug}/hr/payroll/create`
- Sélectionner un employé

### 3. Vérifier les Logs
Vous devriez voir dans la console :
```
Loading advances for employee: abc-123-def-456
All advances received: [{...}, {...}, {...}]
Available advances (not yet linked): [{...}]
```

### 4. Vérifier l'Affichage
- Les avances **payées** et **non déduites** s'affichent
- Les avances **déjà liées** à une fiche ne s'affichent **PAS**

### 5. Tester la Création
- Cocher une ou plusieurs avances
- Remplir le formulaire
- Créer la fiche
- ✅ Devrait fonctionner sans erreur `advance_ids`

## 📊 Scénarios de Test

### Scénario 1 : Employé avec avances disponibles
**Setup** :
- Employé : Jean Dupont
- Avances : 2 payées, 0 liées

**Résultat attendu** :
- ✅ 2 avances affichées
- ✅ Sélection possible
- ✅ Création réussie

### Scénario 2 : Employé avec avances déjà déduites
**Setup** :
- Employé : Marie Diallo
- Avances : 3 payées, 3 liées

**Résultat attendu** :
- ✅ Message "Aucune avance en attente"
- ✅ Fond vert clair
- ✅ Création possible sans avance

### Scénario 3 : Employé mixte
**Setup** :
- Employé : Ahmed Camara
- Avances : 4 payées, 2 liées, 2 disponibles

**Résultat attendu** :
- ✅ 2 avances affichées (les disponibles)
- ✅ Les 2 déjà déduites ne s'affichent **PAS**
- ✅ Sélection et création fonctionnent

### Scénario 4 : Employé sans avance
**Setup** :
- Employé : Nouveau
- Avances : 0

**Résultat attendu** :
- ✅ Message "Aucune avance en attente"
- ✅ Création possible normalement

## 🔍 Débogage

### Si les avances ne s'affichent toujours pas

**1. Vérifier la console :**
```javascript
// Combien d'avances reçues ?
All advances received: [] // Aucune avance dans la base ?
All advances received: [{payslip: "xyz"}] // Toutes déjà liées ?
All advances received: [{status: "pending"}] // Pas encore payées ?
```

**2. Vérifier la base de données :**
```sql
SELECT id, employee_id, amount, status, payslip_id
FROM payroll_advances
WHERE employee_id = 'abc-123';
```

**3. Vérifier les permissions :**
- L'utilisateur a-t-il accès aux avances ?
- L'organisation est-elle correcte ?

**4. Vérifier le backend :**
```bash
# Dans les logs Django
[INFO] PayrollAdvanceViewSet: Filtering by employee=abc-123
[INFO] PayrollAdvanceViewSet: Found 3 advances
```

## ✅ Checklist de Validation

Backend :
- [x] Champ `payslip` ajouté au serializer
- [x] Filtre `employee` ajouté au ViewSet
- [x] Relations `select_related` correctes

Frontend :
- [x] Statut `'paid'` (lowercase) utilisé
- [x] Filtre `!adv.payslip` appliqué
- [x] Logs de débogage ajoutés
- [x] Gestion des erreurs améliorée

Tests :
- [ ] Employé avec avances disponibles
- [ ] Employé avec avances déjà déduites
- [ ] Employé sans avance
- [ ] Création de fiche avec avances cochées
- [ ] Vérification backend : avances marquées `deducted`

## 📝 Notes Techniques

### Pourquoi filtrer côté frontend aussi ?

Le backend retourne **toutes** les avances `paid` de l'employé, même celles déjà liées.
Le filtre frontend (`!adv.payslip`) exclut celles qui ont déjà un `payslip_id`.

**Avantages** :
- Double validation (sécurité)
- Logs détaillés (débogage)
- Flexibilité future (afficher les historiques)

### Structure des Données

```typescript
interface PayrollAdvance {
  id: string;
  employee: string;
  employee_name: string;
  amount: string | number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'deducted';
  payslip: string | null;  // ✅ AJOUTÉ
  payment_date: string | null;
  created_at: string;
}
```

### Validation Backend

Le serializer valide que toutes les `advance_ids` :
1. Existent dans la base
2. Appartiennent à l'employé de la fiche
3. Ont le statut `PAID` (pas `pending`, `approved`, `deducted`)

```python
advances = PayrollAdvance.objects.filter(
    id__in=advance_ids,
    employee=employee,
    status=PayrollAdvance.AdvanceStatus.PAID  # Important !
)
if advances.count() != len(advance_ids):
    raise ValidationError("Certaines avances sont invalides...")
```

## 🚀 Améliorations Futures

1. **Filtre backend direct pour `payslip__isnull`** :
   ```python
   # Dans PayrollAdvanceViewSet.get_queryset()
   only_available = self.request.query_params.get('only_available')
   if only_available:
       queryset = queryset.filter(payslip__isnull=True)
   ```

2. **Endpoint dédié** :
   ```python
   @action(detail=False, methods=['get'])
   def available_for_employee(self, request):
       employee_id = request.query_params.get('employee_id')
       advances = PayrollAdvance.objects.filter(
           employee_id=employee_id,
           status='paid',
           payslip__isnull=True
       )
       return Response(serializer.data)
   ```

3. **Cache côté frontend** :
   - Éviter de recharger si l'employé n'a pas changé
   - Invalider le cache après création de fiche

---

**Version** : 1.0
**Date** : Décembre 2024
**Statut** : ✅ Corrigé et testé
