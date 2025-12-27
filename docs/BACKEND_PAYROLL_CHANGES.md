# Modifications Backend pour la Gestion de Paie

## Problème actuel

Le frontend utilise une structure flexible avec des **arrays d'items** pour les primes (allowances) et déductions, tandis que le backend Django utilise des **champs Decimal simples**. Cette approche frontend est plus flexible et permet de détailler chaque prime/déduction.

## Note sur les Périodes de Paie

Le modèle `PayrollPeriod` doit déjà exister côté backend. Si ce n'est pas le cas, voici sa structure requise :

```python
class PayrollPeriod(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='payroll_periods')
    name = models.CharField(max_length=255)  # Ex: "Janvier 2025"
    period_start = models.DateField()
    period_end = models.DateField()
    payment_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Brouillon'),
            ('processing', 'En cours'),
            ('approved', 'Approuvé'),
            ('paid', 'Payé'),
            ('closed', 'Clôturé'),
        ],
        default='draft'
    )

    class Meta:
        db_table = 'hr_payroll_periods'
        ordering = ['-period_start']
        unique_together = [['organization', 'period_start', 'period_end']]

    def __str__(self):
        return f"{self.name} ({self.period_start} - {self.period_end})"
```

## Structure Frontend (à conserver)

```typescript
export interface PayrollItem {
  name: string;
  amount: number;
  is_deduction: boolean;
}

export interface PayrollCreate {
  employee: string;
  payroll_period: string;
  base_salary: number;
  allowances?: PayrollItem[];  // Ex: [{name: "Prime transport", amount: 25000}, ...]
  deductions?: PayrollItem[];  // Ex: [{name: "CNPS", amount: 15000}, ...]
  currency?: string;
  worked_hours?: number;
  overtime_hours?: number;
  leave_days_taken?: number;
  payment_method?: string;
  notes?: string;
}
```

## Modifications Backend Requises

### 1. Modifier le modèle Payslip

**Fichier:** `/backend/app/hr/models.py`

```python
# Ajouter ce modèle AVANT Payslip
class PayslipItem(TimeStampedModel):
    """Représente une prime ou déduction dans une fiche de paie"""
    payslip = models.ForeignKey('Payslip', on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_deduction = models.BooleanField(default=False)  # True = déduction, False = prime

    class Meta:
        db_table = 'hr_payslip_items'
        ordering = ['is_deduction', 'name']

    def __str__(self):
        return f"{self.name}: {self.amount}"

# Modifier le modèle Payslip existant
class Payslip(TimeStampedModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='payslips')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payslips')
    payroll_period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE, related_name='payslips')

    # Salaire de base
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)

    # SUPPRIMER ces champs (remplacés par PayslipItem)
    # overtime_pay = models.DecimalField(...)
    # bonuses = models.DecimalField(...)
    # allowances = models.DecimalField(...)
    # tax = models.DecimalField(...)
    # social_security = models.DecimalField(...)
    # other_deductions = models.DecimalField(...)

    # Montants calculés (automatiquement à partir des items)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Autres champs (inchangés)
    currency = models.CharField(max_length=10, default='GNF')
    worked_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    leave_days_taken = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    status = models.CharField(max_length=20, choices=PAYSLIP_STATUS_CHOICES, default='draft')
    payment_method = models.CharField(max_length=50, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    payslip_file_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'hr_payslips'
        ordering = ['-payroll_period__period_start', '-created_at']
        unique_together = [['employee', 'payroll_period']]

    def calculate_totals(self):
        """Calcule les totaux à partir des items"""
        # Récupérer tous les items
        items = self.items.all()

        # Calculer total des primes
        total_allowances = sum(
            item.amount for item in items if not item.is_deduction
        )

        # Calculer total des déductions
        total_deductions = sum(
            item.amount for item in items if item.is_deduction
        )

        # Salaire brut = base + primes
        self.gross_salary = self.base_salary + total_allowances

        # Total déductions
        self.total_deductions = total_deductions

        # Salaire net = brut - déductions
        self.net_salary = self.gross_salary - self.total_deductions

        self.save()

    def __str__(self):
        return f"Payslip {self.employee.full_name} - {self.payroll_period.name}"
```

### 2. Créer la migration

```bash
cd /home/salim/Projets/loura/stack/backend
python manage.py makemigrations hr
python manage.py migrate hr
```

### 3. Modifier le Serializer

**Fichier:** `/backend/app/hr/serializers.py`

```python
class PayslipItemSerializer(serializers.ModelSerializer):
    """Serializer pour les items de paie (primes et déductions)"""
    class Meta:
        model = PayslipItem
        fields = ['id', 'name', 'amount', 'is_deduction']
        read_only_fields = ['id']

class PayslipSerializer(serializers.ModelSerializer):
    """Serializer complet pour lecture"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    payroll_period_name = serializers.CharField(source='payroll_period.name', read_only=True)
    period_start = serializers.DateField(source='payroll_period.period_start', read_only=True)
    period_end = serializers.DateField(source='payroll_period.period_end', read_only=True)

    # Inclure les items (primes et déductions)
    allowances = serializers.SerializerMethodField()
    deductions = serializers.SerializerMethodField()

    employee_details = EmployeeListSerializer(source='employee', read_only=True)

    class Meta:
        model = Payslip
        fields = [
            'id', 'employee', 'employee_name', 'employee_id',
            'payroll_period', 'payroll_period_name', 'period_start', 'period_end',
            'base_salary', 'allowances', 'deductions',
            'gross_salary', 'total_deductions', 'net_salary',
            'currency', 'worked_hours', 'overtime_hours', 'leave_days_taken',
            'status', 'payment_method', 'payment_date', 'payment_reference',
            'payslip_file_url', 'notes',
            'created_at', 'updated_at', 'employee_details'
        ]
        read_only_fields = ['gross_salary', 'total_deductions', 'net_salary', 'created_at', 'updated_at']

    def get_allowances(self, obj):
        """Retourner seulement les items qui sont des primes (is_deduction=False)"""
        items = obj.items.filter(is_deduction=False)
        return PayslipItemSerializer(items, many=True).data

    def get_deductions(self, obj):
        """Retourner seulement les items qui sont des déductions (is_deduction=True)"""
        items = obj.items.filter(is_deduction=True)
        return PayslipItemSerializer(items, many=True).data

class PayslipCreateSerializer(serializers.ModelSerializer):
    """Serializer pour création/modification"""
    allowances = PayslipItemSerializer(many=True, required=False)
    deductions = PayslipItemSerializer(many=True, required=False)

    class Meta:
        model = Payslip
        fields = [
            'employee', 'payroll_period', 'base_salary',
            'allowances', 'deductions',
            'currency', 'worked_hours', 'overtime_hours', 'leave_days_taken',
            'payment_method', 'notes'
        ]

    def create(self, validated_data):
        # Extraire les items
        allowances_data = validated_data.pop('allowances', [])
        deductions_data = validated_data.pop('deductions', [])

        # Ajouter l'organisation automatiquement
        validated_data['organization'] = self.context['request'].user.organization

        # Créer le payslip
        payslip = Payslip.objects.create(**validated_data)

        # Créer les primes
        for allowance in allowances_data:
            PayslipItem.objects.create(
                payslip=payslip,
                is_deduction=False,
                **allowance
            )

        # Créer les déductions
        for deduction in deductions_data:
            PayslipItem.objects.create(
                payslip=payslip,
                is_deduction=True,
                **deduction
            )

        # Calculer les totaux
        payslip.calculate_totals()

        return payslip

    def update(self, instance, validated_data):
        # Extraire les items
        allowances_data = validated_data.pop('allowances', None)
        deductions_data = validated_data.pop('deductions', None)

        # Mettre à jour les champs de base
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si des allowances/deductions sont fournis, les remplacer complètement
        if allowances_data is not None or deductions_data is not None:
            # Supprimer tous les anciens items
            instance.items.all().delete()

            # Recréer les primes
            if allowances_data:
                for allowance in allowances_data:
                    PayslipItem.objects.create(
                        payslip=instance,
                        is_deduction=False,
                        **allowance
                    )

            # Recréer les déductions
            if deductions_data:
                for deduction in deductions_data:
                    PayslipItem.objects.create(
                        payslip=instance,
                        is_deduction=True,
                        **deduction
                    )

        # Recalculer les totaux
        instance.calculate_totals()

        return instance
```

### 4. Exemple de requête POST attendue

```json
{
  "employee": "uuid-employee",
  "payroll_period": "uuid-period",
  "base_salary": 500000,
  "allowances": [
    {"name": "Prime de transport", "amount": 25000},
    {"name": "Prime de logement", "amount": 50000},
    {"name": "Prime d'ancienneté", "amount": 30000}
  ],
  "deductions": [
    {"name": "Cotisation sociale (CNPS)", "amount": 18000},
    {"name": "Impôt sur le revenu", "amount": 50000},
    {"name": "Avance sur salaire", "amount": 20000}
  ],
  "currency": "GNF",
  "payment_method": "bank_transfer",
  "notes": "Paie du mois de janvier 2025"
}
```

### 5. Exemple de réponse GET attendue

```json
{
  "id": "uuid",
  "employee": "uuid-employee",
  "employee_name": "Jean Dupont",
  "employee_id": "EMP001",
  "payroll_period": "uuid-period",
  "payroll_period_name": "Janvier 2025",
  "period_start": "2025-01-01",
  "period_end": "2025-01-31",
  "base_salary": 500000,
  "allowances": [
    {"id": 1, "name": "Prime de transport", "amount": 25000, "is_deduction": false},
    {"id": 2, "name": "Prime de logement", "amount": 50000, "is_deduction": false},
    {"id": 3, "name": "Prime d'ancienneté", "amount": 30000, "is_deduction": false}
  ],
  "deductions": [
    {"id": 4, "name": "Cotisation sociale (CNPS)", "amount": 18000, "is_deduction": true},
    {"id": 5, "name": "Impôt sur le revenu", "amount": 50000, "is_deduction": true},
    {"id": 6, "name": "Avance sur salaire", "amount": 20000, "is_deduction": true}
  ],
  "gross_salary": 605000,
  "total_deductions": 88000,
  "net_salary": 517000,
  "currency": "GNF",
  "status": "draft",
  "payment_method": "bank_transfer",
  "notes": "Paie du mois de janvier 2025",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

## Avantages de cette approche

1. **Flexibilité**: Permet d'ajouter autant de primes/déductions que nécessaire
2. **Détails**: Chaque prime/déduction a un nom explicite
3. **Historique**: Conserve l'historique exact des éléments de paie
4. **Évolutivité**: Facile d'ajouter des métadonnées aux items (taux, base de calcul, etc.)
5. **Reporting**: Facilite les analyses par type de prime/déduction

## Notes importantes

- Les champs `gross_salary`, `total_deductions` et `net_salary` sont **calculés automatiquement** par la méthode `calculate_totals()`
- Le backend doit **toujours recalculer** ces montants lors de la création/modification
- Le frontend envoie seulement `base_salary`, `allowances` et `deductions`
- Le champ `is_deduction` est géré automatiquement par le serializer (False pour allowances, True pour deductions)
