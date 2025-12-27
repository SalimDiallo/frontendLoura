# Guide de Gestion des Paies et Avances - Système Amélioré

## Vue d'ensemble

Le système de gestion des paies et avances a été considérablement amélioré pour offrir une expérience utilisateur plus intuitive et efficace.

## Fonctionnalités Clés

### 1. Gestion des Avances sur Salaire

#### Workflow Simplifié

**Ancien workflow** (5 étapes) :
1. Créer demande d'avance
2. Examiner la demande
3. Approuver la demande
4. Marquer comme payée
5. Déduire de la paie manuellement

**Nouveau workflow** (2 étapes) :
1. **Action rapide "Approuver & Payer"** : Approuve ET marque comme payée en un seul clic
2. **Déduction automatique** : Les avances sont automatiquement suggérées lors de la création de paie

#### Améliorations de l'Interface

##### Page de Gestion des Avances (`/hr/payroll/advances`)

**Nouvelles fonctionnalités** :
- ✅ **Action rapide** : Bouton "Approuver & Payer" pour traiter les demandes en attente en une seule action
- ✅ **Messages de succès/erreur** : Retours visuels clairs avec badges verts/rouges
- ✅ **Boutons colorés** : Codes couleur intuitifs pour chaque action
  - 🟢 Vert : Approuver & Payer
  - 🔵 Bleu : Marquer payée
  - 🟣 Violet : Déduire de la paie
- ✅ **Validation améliorée** :
  - Montant minimum : 1 000 GNF
  - Montant maximum : 10 000 000 GNF
  - Raison minimum : 10 caractères
  - Raison maximum : 500 caractères

##### Page de Création de Paie (`/hr/payroll/create`)

**Intégration des Avances** :
- 📋 **Composant `PayrollAdvancesSummary`** : Affichage moderne et clair des avances
- 🎯 **Sélection intuitive** : Cliquez sur une avance pour la sélectionner/désélectionner
- 💡 **Indicateurs visuels** :
  - Badge jaune pour les avances en attente
  - Badge vert pour les avances sélectionnées
  - Calcul automatique du total à déduire
- ⚠️ **Alertes contextuelles** : Messages clairs sur l'impact des déductions
- ✅ **État vide optimisé** : Message positif quand pas d'avances à déduire

### 2. Calculs Automatiques

#### Résumé de Paie

Le système calcule automatiquement :
1. **Salaire de base** : Depuis le contrat actif de l'employé
2. **Total des primes** : Somme des allocations ajoutées
3. **Salaire brut** : Base + Primes
4. **Déductions manuelles** : Impôts, cotisations, etc.
5. **Déductions d'avances** : Avances sélectionnées
6. **Salaire net** : Brut - (Déductions + Avances)

#### Visualisation Claire

```
Salaire de base:        5 000 000 GNF
+ Total primes:           500 000 GNF
─────────────────────────────────────
= Salaire brut:         5 500 000 GNF

- Déductions manuelles:   550 000 GNF
- Avances (2):            300 000 GNF
─────────────────────────────────────
= Salaire net:          4 650 000 GNF
```

### 3. Validation et Gestion des Erreurs

#### Validations Frontend

**Formulaire de demande d'avance** :
```typescript
- employee: Obligatoire, doit exister dans la liste
- amount:
  - Minimum: 1 000 GNF
  - Maximum: 10 000 000 GNF
  - Type: Nombre uniquement
- reason:
  - Minimum: 10 caractères
  - Maximum: 500 caractères
- notes: Maximum 1000 caractères (optionnel)
```

**Approbation/Rejet** :
```typescript
- rejection_reason:
  - Obligatoire si rejet
  - Minimum: 10 caractères
```

#### Gestion des Erreurs

**Messages d'erreur clairs** :
- ❌ Erreurs de validation affichées dans un badge rouge
- ✅ Messages de succès dans un badge vert
- 🔄 Bouton de fermeture pour chaque message
- 📱 Responsive et accessible

### 4. Workflow Backend Amélioré

#### Endpoints Optimisés

**`POST /hr/payroll-advances/{id}/approve/`**
- Approuve une avance
- Peut inclure des notes

**`POST /hr/payroll-advances/{id}/mark_as_paid/`**
- Marque comme payée
- Enregistre la date de paiement

**`POST /hr/payroll-advances/{id}/deduct_from_payslip/`**
- Déduit l'avance d'une fiche de paie
- Marque l'avance comme "deducted"
- Lie l'avance à la fiche de paie

**`POST /hr/payslips/`** (création)
```json
{
  "employee": "uuid",
  "payroll_period": "uuid",
  "base_salary": 5000000,
  "allowances": [...],
  "deductions": [...],
  "advance_ids": ["uuid1", "uuid2"]  // ✨ Nouveau
}
```

### 5. Statuts des Avances

```
pending   → Demande créée, en attente d'approbation
approved  → Approuvée, en attente de paiement
paid      → Payée, en attente de déduction
deducted  → Déduite et clôturée ✅
rejected  → Rejetée ❌
```

## Guide d'Utilisation

### Pour le RH : Traiter une Demande d'Avance

#### Méthode Rapide (Recommandée)
1. Aller sur `/hr/payroll/advances`
2. Trouver la demande en attente
3. Cliquer sur **"Approuver & Payer"** 🟢
4. Confirmer l'action
5. ✅ L'avance est approuvée ET marquée comme payée

#### Méthode Détaillée
1. Cliquer sur **"Examiner"**
2. Vérifier les détails
3. Soit :
   - **Approuver** : Puis marquer comme payée plus tard
   - **Rejeter** : Avec raison obligatoire (min 10 caractères)

### Pour le RH : Créer une Fiche de Paie

1. Aller sur `/hr/payroll/create`
2. Sélectionner l'employé
   - ✨ Les avances payées s'affichent automatiquement
3. Vérifier la période de paie
4. Le salaire de base se remplit depuis le contrat
5. Ajouter primes et déductions si besoin
6. **Sélectionner les avances à déduire** (clic sur chaque carte)
7. Vérifier le résumé
8. Soumettre

#### Résultat
- ✅ Fiche de paie créée avec déductions
- ✅ Avances automatiquement liées et marquées "deducted"
- ✅ Salaire net ajusté

## Architecture Technique

### Composants Clés

#### Frontend

```
components/hr/
  └── payroll-advances-summary.tsx  ✨ Nouveau composant

app/apps/(org)/[slug]/hr/payroll/
  ├── advances/page.tsx              📝 Amélioré
  └── create/page.tsx                📝 Amélioré

lib/services/hr/
  ├── payroll-advance.service.ts
  └── payroll.service.ts
```

#### Backend

```python
app/hr/
  ├── models.py           # PayrollAdvance model
  ├── serializers.py      # Serializers avec validation
  ├── views.py            # ViewSets avec actions custom
  └── permissions.py      # Permissions granulaires
```

### Modèle de Données

```python
class PayrollAdvance(TimeStampedModel):
    employee: FK(Employee)
    amount: Decimal
    reason: TextField
    status: Choices[pending, approved, rejected, paid, deducted]
    approved_by: FK(Employee, null=True)
    approved_date: DateTime(null=True)
    payment_date: Date(null=True)
    payslip: FK(Payslip, null=True)  # Lien vers la fiche de paie
    deduction_month: Date(null=True)
    notes: TextField(blank=True)
```

## Bonnes Pratiques

### Pour les Administrateurs

1. **Traiter les demandes rapidement** : Utilisez l'action rapide "Approuver & Payer"
2. **Vérifier les montants** : S'assurer que l'avance ne dépasse pas le salaire mensuel
3. **Documenter** : Utiliser le champ "Notes" pour les cas particuliers

### Pour les RH

1. **Déduire systématiquement** : Ne pas oublier de sélectionner les avances lors de la création de paie
2. **Vérifier le solde** : S'assurer que le salaire net reste positif après déductions
3. **Suivre les statuts** : Utiliser les filtres pour voir les avances en attente

## Changelog

### Version 2.0 (Décembre 2024)

#### Nouveautés
- ✨ Action rapide "Approuver & Payer"
- ✨ Composant `PayrollAdvancesSummary`
- ✨ Sélection interactive des avances
- ✨ Messages de succès/erreur améliorés
- ✨ Validation renforcée (montants, longueurs)
- ✨ Calculs automatiques affichés en temps réel

#### Améliorations
- 🎨 Interface modernisée avec codes couleur
- 📱 Meilleure expérience mobile
- ⚡ Performance optimisée
- 🔒 Validation côté client et serveur
- 🎯 Workflow réduit de 5 à 2 étapes

#### Corrections
- 🐛 Gestion d'erreur améliorée
- 🐛 Messages d'erreur plus clairs
- 🐛 Validation des montants
- 🐛 État vide géré proprement

## Support

Pour toute question ou problème :
- Documentation complète : `/docs`
- Issues GitHub : [Lien vers repo]
- Contact : [Email support]

---

**Dernière mise à jour** : Décembre 2024
**Version** : 2.0
**Auteur** : Équipe Loura
