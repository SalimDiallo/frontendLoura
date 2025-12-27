# Fix Backend : Périodes de Paie - Organization (SOLUTION FINALE)

## Problème

Le backend essaie de récupérer `organization` depuis `request.data.get('organization')` mais le frontend ne l'envoie pas dans le body.

## Solution

Le frontend envoie maintenant `organization_subdomain` comme **query parameter** :
```
POST /api/hr/payroll-periods/?organization_subdomain=myorg
```

Le backend doit utiliser ce paramètre pour récupérer l'organisation, exactement comme pour les autres endpoints (voir `EmployeeViewSet`).

## Code Backend à Modifier

**Fichier:** `/backend/app/hr/views.py`

**Ligne 591+** - Remplacer la méthode `perform_create` de `PayrollPeriodViewSet` :

```python
class PayrollPeriodViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollPeriodSerializer
    permission_classes = [IsAdminUserOrEmployee, IsHRAdmin]

    def get_queryset(self):
        user = self.request.user
        from core.models import AdminUser

        if isinstance(user, AdminUser):
            org_ids = user.organizations.values_list('id', flat=True)
            return PayrollPeriod.objects.filter(organization_id__in=org_ids)
        elif isinstance(user, Employee):
            return PayrollPeriod.objects.filter(organization=user.organization)
        return PayrollPeriod.objects.none()

    def perform_create(self, serializer):
        """Créer une période avec l'organisation correcte"""
        user = self.request.user
        from core.models import AdminUser

        organization = None

        if isinstance(user, AdminUser):
            # Récupérer l'organization depuis le query param (comme EmployeeViewSet)
            org_subdomain = self.request.query_params.get('organization_subdomain')

            if org_subdomain:
                # Trouver l'organisation par subdomain parmi celles accessibles
                organization = user.organizations.filter(subdomain=org_subdomain).first()

            if not organization:
                # Fallback: utiliser la première organisation accessible
                organization = user.organizations.first()

            if not organization:
                raise serializers.ValidationError({
                    'organization': 'Aucune organisation accessible pour cet administrateur'
                })

        elif isinstance(user, Employee):
            # Pour les employés, utiliser leur organisation
            organization = user.organization
        else:
            raise serializers.ValidationError({'user': 'Non autorisé'})

        serializer.save(organization=organization)
```

## Explication

1. **AdminUser** : Récupère `organization_subdomain` depuis les query params
2. **Employee** : Utilise directement `user.organization`
3. **Validation** : Vérifie que l'organisation existe et est accessible

## Test

Après cette modification, tester avec :

```bash
# Depuis le frontend
curl -X POST http://localhost:8000/api/hr/payroll-periods/?organization_subdomain=myorg \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Janvier 2025",
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  }'
```

Devrait retourner :
```json
{
  "id": "uuid-123",
  "organization": "org-uuid",
  "name": "Janvier 2025",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "payment_date": null,
  "status": "draft",
  ...
}
```

## Alternative (Plus Simple)

Si vous voulez simplifier encore plus, vous pouvez aussi modifier le backend pour détecter automatiquement l'organisation depuis le token, sans query param :

```python
def perform_create(self, serializer):
    user = self.request.user
    from core.models import AdminUser

    if isinstance(user, AdminUser):
        # Pour AdminUser, prendre la première organisation
        # (ou implémenter une logique pour sélectionner la bonne)
        organization = user.organizations.first()
        if not organization:
            raise serializers.ValidationError({
                'organization': 'Aucune organisation accessible'
            })
    elif isinstance(user, Employee):
        organization = user.organization
    else:
        raise serializers.ValidationError({'user': 'Non autorisé'})

    serializer.save(organization=organization)
```

Mais la première solution avec `organization_subdomain` est **plus cohérente** avec le reste de votre codebase (voir `EmployeeViewSet`).
