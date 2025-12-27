# Fix Backend : Périodes de Paie - Organisation

## Problème

Le frontend envoie uniquement :
```json
{
  "name": "Janvier 2025",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "payment_date": "2025-02-05"  // optionnel
}
```

Mais le backend a besoin de l'`organization_id`, ce qui cause l'erreur :
```
NOT NULL constraint failed: payroll_periods.organization_id
```

## Solution

Le backend doit **automatiquement** extraire l'organisation depuis le **token JWT** de l'utilisateur authentifié, exactement comme pour les autres modèles (Payslip, Employee, etc.).

### Dans le Serializer (`PayrollPeriodCreateSerializer`)

```python
class PayrollPeriodCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollPeriod
        fields = ['name', 'start_date', 'end_date', 'payment_date']
        # NE PAS inclure 'organization' dans les fields

    def create(self, validated_data):
        # Récupérer l'organisation depuis le contexte de la requête
        request = self.context.get('request')

        # Ajouter automatiquement l'organisation
        validated_data['organization'] = request.user.organization

        return PayrollPeriod.objects.create(**validated_data)
```

### Dans la Vue (`PayrollPeriodViewSet`)

```python
class PayrollPeriodViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollPeriodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrer par organisation de l'utilisateur"""
        return PayrollPeriod.objects.filter(
            organization=self.request.user.organization
        )

    def get_serializer_class(self):
        """Utiliser le bon serializer selon l'action"""
        if self.action in ['create', 'update', 'partial_update']:
            return PayrollPeriodCreateSerializer
        return PayrollPeriodSerializer

    def perform_create(self, serializer):
        """Créer avec l'organisation de l'utilisateur"""
        serializer.save(organization=self.request.user.organization)
```

### Validation du champ `payment_date`

Le champ `payment_date` est **optionnel**. Si le frontend envoie une chaîne vide `""`, Django retourne une erreur de format.

**Solution dans le Serializer** :

```python
class PayrollPeriodCreateSerializer(serializers.ModelSerializer):
    payment_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = PayrollPeriod
        fields = ['name', 'start_date', 'end_date', 'payment_date']

    def validate_payment_date(self, value):
        """Convertir chaîne vide en None"""
        if value == '':
            return None
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['organization'] = request.user.organization

        # Supprimer payment_date s'il est None
        if validated_data.get('payment_date') is None:
            validated_data.pop('payment_date', None)

        return PayrollPeriod.objects.create(**validated_data)
```

## Exemple de Requête Attendue

### Requête POST
```http
POST /api/hr/payroll-periods/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Janvier 2025",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "payment_date": "2025-02-05"
}
```

### Réponse Attendue
```json
{
  "id": "uuid-123",
  "organization": "org-uuid",
  "name": "Janvier 2025",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "payment_date": "2025-02-05",
  "status": "draft",
  "payslip_count": 0,
  "total_net_salary": null,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

## Vérification

Après cette modification, le frontend pourra créer des périodes de paie sans avoir à gérer l'organisation manuellement, ce qui est cohérent avec le reste de l'application.
