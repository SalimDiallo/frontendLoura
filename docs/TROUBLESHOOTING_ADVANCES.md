# Guide de Dépannage - Déduction d'Avances

## Problème Identifié

**Erreur 400 Bad Request** lors de la déduction d'une avance d'une fiche de paie.

## Améliorations Apportées

### 1. Logging Backend Amélioré

Le backend Django (`app/hr/views.py`) a maintenant un logging détaillé pour diagnostiquer les problèmes:

```python
logger.info(f"Deduct from payslip called for advance {advance.id}")
logger.info(f"Request data: {request.data}")
logger.info(f"Advance status: {advance.status}")
logger.info(f"Payslip ID received: {payslip_id}")
```

### 2. Validation Frontend Renforcée

Le frontend (`app/apps/(org)/[slug]/hr/payroll/advances/page.tsx`) vérifie maintenant:

- ✅ Avance sélectionnée
- ✅ Fiche de paie sélectionnée
- ✅ ID de fiche de paie valide (string non vide)
- ✅ Logging console pour déboguer

### 3. Messages d'Erreur Plus Clairs

**Avant:**
```
"Erreur lors de la déduction"
```

**Maintenant:**
```
"Seules les avances payées peuvent être déduites. Statut actuel: Approuvée"
"Fiche de paie non trouvée (ID: xxx-xxx-xxx)"
"L'ID de la fiche de paie est requis (payslip_id)"
```

## Comment Tester

### Prérequis

1. Avoir une avance avec statut "paid"
2. Avoir au moins une fiche de paie pour le même employé

### Étapes de Test

#### 1. Vérifier les Logs Frontend

Ouvrez la console du navigateur (F12) et regardez:

```javascript
// Quand vous cliquez sur "Déduire de la paie"
Deducting advance: {
  advanceId: "xxx-xxx-xxx",
  payslipId: "yyy-yyy-yyy",
  amount: 500000,
  employee: "Jean Dupont"
}

// Appel au service
deductAdvanceFromPayslip called with: {
  id: "xxx-xxx-xxx",
  payslipId: "yyy-yyy-yyy"
}

// Payload envoyé
Sending payload: { payslip_id: "yyy-yyy-yyy" }
```

#### 2. Vérifier les Logs Backend

Dans le terminal du serveur Django:

```bash
# Démarrer le serveur en mode debug
python manage.py runserver

# Observer les logs
INFO - Deduct from payslip called for advance xxx-xxx-xxx
INFO - Request data: {'payslip_id': 'yyy-yyy-yyy'}
INFO - Advance status: paid
INFO - Payslip ID received: yyy-yyy-yyy
INFO - Looking for payslip with ID: yyy-yyy-yyy
INFO - Payslip found: yyy-yyy-yyy for employee Jean Dupont
INFO - Marking advance xxx-xxx-xxx as deducted
INFO - Advance xxx-xxx-xxx successfully marked as deducted
```

### Scénarios de Test

#### ✅ Scénario 1: Déduction Réussie

1. Créer une avance
2. L'approuver (action rapide "Approuver & Payer")
3. Créer une fiche de paie pour le même employé
4. Retourner sur les avances
5. Cliquer sur "Déduire de la paie"
6. Sélectionner la fiche de paie
7. Cliquer "Déduire et fermer"

**Résultat attendu:**
- ✅ Message de succès vert
- ✅ Avance marquée comme "Déduite (Close)"
- ✅ Console: "Deduction successful"

#### ❌ Scénario 2: Avance Pas Encore Payée

1. Créer une avance
2. L'approuver SANS la marquer comme payée
3. Essayer de déduire

**Résultat attendu:**
- ❌ Bouton "Déduire de la paie" n'apparaît pas
- (Le bouton n'apparaît que pour le statut "paid")

#### ❌ Scénario 3: Aucune Fiche de Paie Disponible

1. Avance payée pour employé X
2. Pas de fiche de paie pour employé X
3. Cliquer sur "Déduire de la paie"

**Résultat attendu:**
- ⚠️ Message: "Aucune fiche de paie éligible"
- ℹ️ Explication sur l'absence de fiches de paie

## Erreurs Possibles et Solutions

### Erreur 400: Bad Request

**Cause possible:** `payslip_id` non envoyé ou null

**Solution:**
1. Vérifier les logs console
2. Vérifier que `selectedPayslip` n'est pas vide
3. Vérifier le payload dans Network tab (F12 > Network)

### Erreur 403: Forbidden

**Cause:** Utilisateur n'a pas la permission "can_manage_payroll"

**Solution:**
1. Vérifier les permissions de l'utilisateur
2. Assigner le rôle approprié (HR Admin, Super Admin)

### Erreur 404: Not Found

**Cause:** Fiche de paie introuvable

**Solution:**
1. Vérifier que la fiche de paie existe
2. Vérifier l'UUID de la fiche de paie
3. Regarder les logs backend pour l'ID reçu

### Erreur 400: "Seules les avances payées..."

**Cause:** Avance n'a pas le statut "paid"

**Solution:**
1. Marquer l'avance comme payée d'abord
2. Utiliser l'action rapide "Approuver & Payer"

### Erreur 400: "Employee mismatch"

**Cause:** La fiche de paie et l'avance ne sont pas pour le même employé

**Solution:**
1. Vérifier que vous sélectionnez la bonne fiche de paie
2. Le système filtre normalement les fiches de paie par employé

## Vérifications de la Base de Données

```sql
-- Vérifier le statut d'une avance
SELECT id, employee_id, amount, status, payslip_id
FROM hr_payroll_advances
WHERE id = 'xxx-xxx-xxx';

-- Vérifier les fiches de paie d'un employé
SELECT id, employee_id, net_salary, status
FROM hr_payslips
WHERE employee_id = 'yyy-yyy-yyy';

-- Vérifier qu'une avance a bien été liée
SELECT pa.id, pa.amount, pa.status, pa.payslip_id, p.id as payslip_id_check
FROM hr_payroll_advances pa
LEFT JOIN hr_payslips p ON pa.payslip_id = p.id
WHERE pa.status = 'deducted';
```

## Checklist de Débogage

- [ ] Logs frontend dans la console
- [ ] Logs backend dans le terminal
- [ ] Vérifier le statut de l'avance (doit être "paid")
- [ ] Vérifier l'existence de la fiche de paie
- [ ] Vérifier les permissions de l'utilisateur
- [ ] Vérifier Network tab pour le payload exact
- [ ] Vérifier la base de données si nécessaire

## Contact Support

Si le problème persiste après ces vérifications:

1. Copier tous les logs (frontend + backend)
2. Noter l'ID de l'avance problématique
3. Noter l'ID de la fiche de paie sélectionnée
4. Fournir les détails au support technique

---

**Dernière mise à jour:** Décembre 2024
