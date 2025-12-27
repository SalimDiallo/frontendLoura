# Backend Implementation Guide - QR Code Attendance System (Double Scan)

## Vue d'ensemble
Ce document explique comment implémenter le système de pointage par QR code côté backend Django avec support du **double scan** (arrivée + sortie automatique).

Le système détecte automatiquement si l'employé doit faire un check-in ou check-out en fonction de son statut actuel.

## 1. Modèle Django

Ajoutez ce modèle dans `apps/hr/models.py` :

```python
import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone
from apps.core.models import Organization
from apps.hr.models import Employee

class QRCodeSession(models.Model):
    """
    Session QR Code pour le pointage (check-in ET check-out)
    Chaque session est liée à un employé spécifique et expire après un certain temps
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='qr_sessions')
    session_token = models.CharField(max_length=64, unique=True, db_index=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='qr_sessions')
    created_by = models.ForeignKey('core.AdminUser', on_delete=models.SET_NULL, null=True, related_name='created_qr_sessions')
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hr_qr_code_sessions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session_token']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"QR Session for {self.employee.get_full_name()} - {self.session_token[:8]}..."

    def is_expired(self):
        return timezone.now() > self.expires_at

    def get_qr_code_data(self):
        """Retourne les données à encoder dans le QR code"""
        import json
        return json.dumps({
            'session_token': self.session_token,
            'employee_name': self.employee.get_full_name(),
            'employee_id': str(self.employee.id),
        })
```

## 2. Serializers

Ajoutez dans `apps/hr/serializers/attendance.py` :

```python
from rest_framework import serializers
from apps.hr.models import QRCodeSession, Attendance
import secrets
from datetime import timedelta
from django.utils import timezone

class QRCodeSessionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_email = serializers.EmailField(source='employee.email', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    qr_code_data = serializers.SerializerMethodField()

    class Meta:
        model = QRCodeSession
        fields = [
            'id', 'organization', 'session_token', 'qr_code_data',
            'employee', 'employee_name', 'employee_email',
            'created_by', 'created_by_name',
            'expires_at', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'session_token', 'organization', 'created_by', 'created_at']

    def get_qr_code_data(self, obj):
        return obj.get_qr_code_data()


class QRCodeSessionCreateSerializer(serializers.Serializer):
    employee = serializers.UUIDField()
    expires_in_minutes = serializers.IntegerField(default=5, min_value=1, max_value=60)

    def validate_employee(self, value):
        from apps.hr.models import Employee
        try:
            employee = Employee.objects.get(id=value, organization=self.context['organization'])
            if not employee.is_active:
                raise serializers.ValidationError("Cet employé n'est pas actif")
            return employee
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Employé introuvable")

    def create(self, validated_data):
        employee = validated_data['employee']
        expires_in_minutes = validated_data['expires_in_minutes']

        # Générer un token unique
        session_token = secrets.token_urlsafe(32)

        # Calculer l'expiration
        expires_at = timezone.now() + timedelta(minutes=expires_in_minutes)

        # Créer la session
        session = QRCodeSession.objects.create(
            organization=self.context['organization'],
            employee=employee,
            session_token=session_token,
            expires_at=expires_at,
            created_by=self.context['request'].user,
            is_active=True
        )

        return session


class QRAttendanceCheckInSerializer(serializers.Serializer):
    """
    Serializer pour le check-in/check-out automatique via QR
    Le backend détermine automatiquement l'action à effectuer
    """
    session_token = serializers.CharField()
    location = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_session_token(self, value):
        try:
            session = QRCodeSession.objects.get(
                session_token=value,
                is_active=True
            )

            if session.is_expired():
                raise serializers.ValidationError("Cette session QR a expiré")

            return session
        except QRCodeSession.DoesNotExist:
            raise serializers.ValidationError("Session QR invalide")

    def create(self, validated_data):
        """
        Logique intelligente de check-in/check-out :
        - Si aucun pointage aujourd'hui OU check_in vide → check-in
        - Si check_in existe mais pas de check_out → check-out
        - Si check_in ET check_out existent → erreur (déjà pointé)
        """
        session = validated_data['session_token']
        location = validated_data.get('location', '')
        notes = validated_data.get('notes', '')

        today = timezone.now().date()
        now = timezone.now()

        # Chercher le pointage du jour
        try:
            attendance = Attendance.objects.get(
                employee=session.employee,
                date=today
            )

            # Vérifier si c'est un check-in ou check-out
            if not attendance.check_in:
                # Cas rare : pointage existe mais sans check-in
                action = 'check_in'
                attendance.check_in = now
                attendance.check_in_location = location
                attendance.check_in_notes = notes
                attendance.status = 'present'
                message = f"Arrivée enregistrée à {now.strftime('%H:%M')}"

            elif not attendance.check_out:
                # Check-out
                action = 'check_out'
                attendance.check_out = now
                attendance.check_out_location = location
                attendance.check_out_notes = notes

                # Calculer les heures travaillées
                duration = now - attendance.check_in
                hours = duration.total_seconds() / 3600
                attendance.total_hours = round(hours, 2)

                message = f"Sortie enregistrée à {now.strftime('%H:%M')} ({attendance.total_hours}h travaillées)"

            else:
                # Déjà pointé complètement
                session.is_active = False
                session.save()
                raise serializers.ValidationError(
                    f"Vous avez déjà pointé aujourd'hui (arrivée: {attendance.check_in.strftime('%H:%M')}, "
                    f"sortie: {attendance.check_out.strftime('%H:%M')})"
                )

            attendance.save()

        except Attendance.DoesNotExist:
            # Pas de pointage aujourd'hui → créer check-in
            action = 'check_in'
            attendance = Attendance.objects.create(
                employee=session.employee,
                date=today,
                check_in=now,
                check_in_location=location,
                check_in_notes=notes,
                status='present'
            )
            message = f"Arrivée enregistrée à {now.strftime('%H:%M')}"

        # Désactiver la session après utilisation
        session.is_active = False
        session.save()

        # Retourner l'attendance avec des infos supplémentaires
        return {
            'attendance': attendance,
            'action': action,
            'message': message
        }
```

## 3. Views

Ajoutez dans `apps/hr/views/attendance.py` :

```python
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.hr.serializers.attendance import (
    QRCodeSessionSerializer,
    QRCodeSessionCreateSerializer,
    QRAttendanceCheckInSerializer,
    AttendanceSerializer
)
from apps.hr.models import QRCodeSession
from apps.hr.permissions import CanCreateQRSession

class AttendanceViewSet(viewsets.ModelViewSet):
    # ... votre code existant ...

    @action(
        detail=False,
        methods=['post'],
        url_path='qr-session/create',
        permission_classes=[IsAuthenticated, CanCreateQRSession]
    )
    def create_qr_session(self, request):
        """
        Créer une session QR pour un employé (Admin avec permission uniquement)

        Permission requise: attendance.create_qr_session
        """
        serializer = QRCodeSessionCreateSerializer(
            data=request.data,
            context={
                'organization': request.organization,
                'request': request
            }
        )

        if serializer.is_valid():
            session = serializer.save()
            response_serializer = QRCodeSessionSerializer(session)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=False,
        methods=['get'],
        url_path='qr-session/(?P<session_id>[^/.]+)'
    )
    def get_qr_session(self, request, session_id=None):
        """
        Récupérer les détails d'une session QR
        """
        try:
            session = QRCodeSession.objects.get(
                id=session_id,
                organization=request.organization
            )
            serializer = QRCodeSessionSerializer(session)
            return Response(serializer.data)
        except QRCodeSession.DoesNotExist:
            return Response(
                {'error': 'Session introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(
        detail=False,
        methods=['post'],
        url_path='qr-check-in',
        permission_classes=[IsAuthenticated]  # Tous les employés peuvent scanner
    )
    def qr_check_in(self, request):
        """
        Pointer via QR code (check-in OU check-out automatique)

        Le backend détermine automatiquement :
        - Premier scan du jour → Check-in
        - Second scan du jour → Check-out
        - Déjà scanné 2 fois → Erreur

        Permission requise: Aucune (authentification suffisante)
        """
        serializer = QRAttendanceCheckInSerializer(data=request.data)

        if serializer.is_valid():
            result = serializer.save()

            # Sérialiser l'attendance
            attendance_serializer = AttendanceSerializer(result['attendance'])

            # Retourner avec l'action et le message
            return Response({
                'attendance': attendance_serializer.data,
                'action': result['action'],
                'message': result['message']
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

## 4. Permissions

Créez ou mettez à jour `apps/hr/permissions.py` :

```python
from rest_framework import permissions
from apps.core.utils.permissions import has_permission

class CanCreateQRSession(permissions.BasePermission):
    """
    Permission pour créer des sessions QR
    Seuls les AdminUsers avec la permission 'attendance.create_qr_session' peuvent générer des QR
    """
    def has_permission(self, request, view):
        # Vérifier que c'est un AdminUser
        if not hasattr(request.user, 'adminuser'):
            return False

        # Vérifier la permission
        return has_permission(
            request.user,
            'attendance.create_qr_session',
            request.organization
        )
```

## 5. URLs

Les URLs sont déjà configurées via le ViewSet. Assurez-vous que votre `urls.py` contient :

```python
from rest_framework.routers import DefaultRouter
from apps.hr.views.attendance import AttendanceViewSet

router = DefaultRouter()
router.register(r'attendances', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
]
```

## 6. Permissions dans la base de données

Ajoutez la permission dans votre système :

```python
# Dans apps/hr/management/commands/init_permissions.py
from apps.core.models import Permission

Permission.objects.get_or_create(
    code='attendance.create_qr_session',
    defaults={
        'name': 'Générer des QR codes de pointage',
        'category': 'attendance',
        'description': 'Permet de générer des QR codes pour le pointage des employés'
    }
)
```

## 7. Migration

Créez et exécutez la migration :

```bash
python manage.py makemigrations hr
python manage.py migrate hr
python manage.py init_permissions  # Pour créer la permission
```

## 8. Tests

Exemple de tests complets :

```python
from django.test import TestCase
from rest_framework.test import APIClient
from django.utils import timezone
from datetime import timedelta
from apps.hr.models import QRCodeSession, Attendance

class QRAttendanceTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Créer organisation, admin, employé...

    def test_create_qr_session_with_permission(self):
        """Test création QR avec permission"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/hr/attendances/qr-session/create/', {
            'employee': str(self.employee.id),
            'expires_in_minutes': 5
        })
        self.assertEqual(response.status_code, 201)
        self.assertIn('session_token', response.data)

    def test_create_qr_session_without_permission(self):
        """Test création QR sans permission"""
        # Retirer la permission
        self.client.force_authenticate(user=self.admin_without_perm)
        response = self.client.post('/api/hr/attendances/qr-session/create/', {
            'employee': str(self.employee.id),
        })
        self.assertEqual(response.status_code, 403)

    def test_qr_check_in_first_scan(self):
        """Test premier scan → check-in"""
        session = QRCodeSession.objects.create(
            organization=self.org,
            employee=self.employee,
            session_token='test-token-123',
            expires_at=timezone.now() + timedelta(minutes=5)
        )

        self.client.force_authenticate(user=self.employee.user)
        response = self.client.post('/api/hr/attendances/qr-check-in/', {
            'session_token': session.session_token,
            'location': 'Bureau principal'
        })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['action'], 'check_in')
        self.assertIn('Arrivée enregistrée', response.data['message'])

    def test_qr_check_out_second_scan(self):
        """Test second scan → check-out"""
        # Créer un pointage avec check-in déjà fait
        attendance = Attendance.objects.create(
            employee=self.employee,
            date=timezone.now().date(),
            check_in=timezone.now() - timedelta(hours=8)
        )

        session = QRCodeSession.objects.create(
            organization=self.org,
            employee=self.employee,
            session_token='test-token-456',
            expires_at=timezone.now() + timedelta(minutes=5)
        )

        self.client.force_authenticate(user=self.employee.user)
        response = self.client.post('/api/hr/attendances/qr-check-in/', {
            'session_token': session.session_token,
            'location': 'Bureau principal'
        })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['action'], 'check_out')
        self.assertIn('Sortie enregistrée', response.data['message'])
        self.assertIsNotNone(response.data['attendance']['check_out'])

    def test_qr_scan_already_completed(self):
        """Test scan alors que déjà check-in + check-out"""
        # Créer un pointage complet
        Attendance.objects.create(
            employee=self.employee,
            date=timezone.now().date(),
            check_in=timezone.now() - timedelta(hours=8),
            check_out=timezone.now()
        )

        session = QRCodeSession.objects.create(
            organization=self.org,
            employee=self.employee,
            session_token='test-token-789',
            expires_at=timezone.now() + timedelta(minutes=5)
        )

        self.client.force_authenticate(user=self.employee.user)
        response = self.client.post('/api/hr/attendances/qr-check-in/', {
            'session_token': session.session_token
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn('déjà pointé', str(response.data))

    def test_expired_session(self):
        """Test scan avec session expirée"""
        session = QRCodeSession.objects.create(
            organization=self.org,
            employee=self.employee,
            session_token='expired-token',
            expires_at=timezone.now() - timedelta(minutes=1)  # Expiré
        )

        self.client.force_authenticate(user=self.employee.user)
        response = self.client.post('/api/hr/attendances/qr-check-in/', {
            'session_token': session.session_token
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn('expiré', str(response.data))
```

## 9. Tâche de nettoyage (Celery)

Créez une tâche pour nettoyer les sessions expirées :

```python
# Dans apps/hr/tasks.py
from celery import shared_task
from django.utils import timezone
from apps.hr.models import QRCodeSession

@shared_task
def cleanup_expired_qr_sessions():
    """
    Supprime les sessions QR expirées depuis plus de 24h
    À exécuter toutes les heures
    """
    cutoff = timezone.now() - timedelta(hours=24)
    deleted_count, _ = QRCodeSession.objects.filter(
        expires_at__lt=cutoff
    ).delete()

    return f"Supprimé {deleted_count} sessions QR expirées"

# Dans votre configuration Celery Beat
from celery.schedules import crontab

app.conf.beat_schedule = {
    'cleanup-qr-sessions': {
        'task': 'apps.hr.tasks.cleanup_expired_qr_sessions',
        'schedule': crontab(minute=0),  # Toutes les heures
    },
}
```

## Résumé des Endpoints

| Méthode | URL | Description | Permissions |
|---------|-----|-------------|-------------|
| POST | `/api/hr/attendances/qr-session/create/` | Créer une session QR | `attendance.create_qr_session` |
| GET | `/api/hr/attendances/qr-session/{id}/` | Récupérer une session QR | Authentifié |
| POST | `/api/hr/attendances/qr-check-in/` | Pointer (check-in/out auto) | Authentifié |

## Flux de données

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GÉNÉRATION QR (Admin avec permission)                   │
│    POST /qr-session/create/                                  │
│    → Créer QRCodeSession avec token unique                  │
│    → Expire dans 5 minutes                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SCAN QR (Employé)                                        │
│    POST /qr-check-in/ avec session_token                    │
│    → Vérifier token valide et non expiré                    │
│                                                              │
│    SI pas de pointage aujourd'hui:                          │
│      → Créer Attendance avec check_in                       │
│      → Retourner action='check_in'                          │
│                                                              │
│    SI pointage existe avec check_in seulement:              │
│      → Mettre à jour avec check_out                         │
│      → Calculer total_hours                                 │
│      → Retourner action='check_out'                         │
│                                                              │
│    SI pointage complet:                                     │
│      → Retourner erreur 400                                 │
│                                                              │
│    → Désactiver la session (usage unique)                   │
└─────────────────────────────────────────────────────────────┘
```

## Notes importantes

1. **Sécurité** :
   - Token généré avec `secrets.token_urlsafe(32)` (cryptographiquement sécurisé)
   - Sessions à usage unique (désactivées après scan)
   - Expiration automatique (5 min par défaut)
   - Permission granulaire pour la génération

2. **Logique automatique** :
   - Le backend détecte automatiquement check-in vs check-out
   - Pas besoin de spécifier le type de scan côté frontend
   - Calcul automatique des heures travaillées

3. **UX** :
   - Messages clairs retournés au frontend
   - Action explicite (check_in/check_out) dans la réponse
   - Gestion des cas d'erreur (déjà pointé, expiré, etc.)

4. **Performance** :
   - Index sur session_token pour recherche rapide
   - Tâche de nettoyage pour éviter l'accumulation
   - Désactivation immédiate après usage

5. **Permissions** :
   - Génération QR : `attendance.create_qr_session` (admin seulement)
   - Scan QR : Authentification suffisante (tous employés)
