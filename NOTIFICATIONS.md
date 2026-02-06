# Système de Notifications Push en Temps Réel

Ce système permet de recevoir des notifications en temps réel, même en dehors du navigateur, grâce aux notifications push natives et WebSocket.

## 🎯 Fonctionnalités

- ✅ **Notifications push natives** - Les notifications s'affichent même quand le navigateur est en arrière-plan
- ✅ **Temps réel avec WebSocket** - Connexion permanente au serveur pour recevoir les notifications instantanément
- ✅ **Demande de permission automatique** - Prompt élégant qui apparaît après 3 secondes
- ✅ **Compteur de notifications non lues** - Badge dans le header avec animation
- ✅ **Reconnexion automatique** - En cas de perte de connexion WebSocket
- ✅ **Gestion des préférences** - L'utilisateur peut refuser et ne sera pas redemandé

## 📁 Architecture

### Fichiers créés

```
lib/
├── hooks/
│   └── usePushNotifications.ts      # Hook pour gérer les notifications push natives
├── contexts/
│   ├── NotificationContext.tsx      # Provider avec WebSocket et compteur
│   └── index.ts                     # Export des contextes
components/
└── common/
    └── NotificationPermissionPrompt.tsx  # Prompt de demande de permission
```

### Composants principaux

#### 1. `usePushNotifications` Hook

Gère les notifications push natives du navigateur:

```typescript
const {
  permission,           // État actuel de la permission
  requestPermission,    // Demander la permission
  showNotification,     // Afficher une notification
  isSupported          // Support du navigateur
} = usePushNotifications();
```

#### 2. `NotificationContext` Provider

Fournit le contexte de notifications avec:
- Connexion WebSocket temps réel
- Compteur de notifications non lues
- Reconnexion automatique avec backoff exponentiel

```typescript
const {
  unreadCount,                    // Nombre de notifications non lues
  requestNotificationPermission,  // Demander la permission
  hasPermission,                  // Permission accordée
  refreshUnreadCount             // Rafraîchir le compteur
} = useNotifications();
```

#### 3. `NotificationPermissionPrompt` Component

Prompt élégant qui apparaît automatiquement après 3 secondes pour demander la permission.

## 🚀 Utilisation

### 1. Le provider est déjà intégré

Le `NotificationProvider` est déjà intégré dans le layout principal:

```tsx
// app/apps/(org)/[slug]/layout.tsx
<NotificationProvider>
  {/* Votre application */}
</NotificationProvider>
```

### 2. Utiliser le hook dans un composant

```tsx
import { useNotifications } from '@/lib/contexts/NotificationContext';

function MyComponent() {
  const { unreadCount, hasPermission } = useNotifications();

  return (
    <div>
      <p>Notifications non lues: {unreadCount}</p>
      <p>Permission: {hasPermission ? 'Accordée' : 'Refusée'}</p>
    </div>
  );
}
```

## 🔧 Configuration Backend

Le système attend une connexion WebSocket à l'URL:

```
ws://localhost:8000/ws/notifications/?token=ACCESS_TOKEN&organization=ORG_SLUG
```

### Messages WebSocket attendus

#### Nouvelle notification
```json
{
  "type": "notification",
  "notification": {
    "id": "uuid",
    "title": "Nouvelle vente",
    "message": "Une nouvelle vente a été créée",
    "action_url": "/apps/org/inventory/sales/123",
    "priority": "high",
    "notification_type": "alert"
  }
}
```

#### Mise à jour du compteur
```json
{
  "type": "unread_count",
  "count": 5
}
```

## 🎨 Comportement

### Demande de permission

1. L'utilisateur arrive sur l'application
2. Après **3 secondes**, un prompt élégant apparaît en bas à droite
3. L'utilisateur peut:
   - **Activer** - Les notifications seront affichées
   - **Plus tard** - Le prompt se ferme, sera redemandé après 5 secondes
   - **X (fermer)** - L'utilisateur ne sera plus jamais redemandé (stocké dans localStorage)

### Affichage des notifications

- ✅ Les notifications s'affichent **uniquement si l'onglet n'est PAS visible** (document.hidden)
- ✅ Vibration sur mobile (200ms, 100ms, 200ms)
- ✅ Icône et badge de l'application
- ✅ Fermeture automatique après 5 secondes
- ✅ Clic sur la notification → focus sur l'onglet et navigation vers l'URL

### Reconnexion WebSocket

En cas de déconnexion:
1. **Tentative 1** - Reconnexion immédiate (1s)
2. **Tentative 2** - Après 2s
3. **Tentative 3** - Après 4s
4. **Tentative 4** - Après 8s
5. **Tentative 5** - Après 16s
6. **Abandon** - Après 5 tentatives (max 30s de délai)

## 🔐 Sécurité

- Le token JWT est envoyé dans l'URL WebSocket
- L'organisation est vérifiée côté serveur
- Les notifications sont filtrées par organisation et utilisateur

## 🎭 UX/UI

### Badge de notifications

Le badge dans le header:
- 📍 Position: En haut à droite du bouton cloche
- 🔴 Couleur: Rouge (destructive)
- 🔢 Affichage: Nombre (ou "99+" si > 99)
- ✨ Animation: Bounce + pulse ring quand nouvelle notification

### Prompt de permission

- 📱 Responsive: S'adapte aux petits écrans
- 🎨 Design: Gradient avec bordure primaire
- 🔔 Icône: Cloche avec fond primaire
- ⚡ Animation: Slide-in depuis le bas

## 📊 Exemple Backend Django

```python
# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.organization = self.scope["organization"]

        # Rejoindre le groupe de notifications de l'utilisateur
        await self.channel_layer.group_add(
            f"notifications_{self.user.id}",
            self.channel_name
        )

        await self.accept()

        # Envoyer le compteur initial
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            "type": "unread_count",
            "count": unread_count
        }))

    async def notification_message(self, event):
        # Envoyer la notification au client
        await self.send(text_data=json.dumps({
            "type": "notification",
            "notification": event["notification"]
        }))
```

## 🐛 Debug

Pour activer les logs de debug:

```javascript
// Dans la console du navigateur
localStorage.setItem('debug_notifications', 'true');
```

Les logs incluront:
- État de la connexion WebSocket
- Messages reçus
- Tentatives de reconnexion
- Demandes de permission

## 📝 TODO Backend

Pour que le système fonctionne complètement, le backend doit implémenter:

1. ✅ Endpoint WebSocket `/ws/notifications/`
2. ✅ Authentification par token JWT
3. ✅ Filtrage par organisation
4. ✅ Envoi des messages au bon format
5. ✅ Gestion des groupes de channels par utilisateur

## 🎉 Conclusion

Le système est maintenant opérationnel côté frontend! Les notifications push s'afficheront automatiquement dès que le backend WebSocket sera configuré.
