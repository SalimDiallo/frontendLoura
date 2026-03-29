# Module Notifications

## Vue d'ensemble

Le module **Notifications** fournit un système de notifications en temps réel basé sur **Server-Sent Events (SSE)**.

### Fonctionnalités

- **Notifications temps réel** : Push instantané via SSE
- **Types de notifications** : Info, success, warning, error
- **CRUD** : Gestion complète des notifications
- **Marquage lu/non lu** : Suivi de lecture
- **Statistiques** : Compteurs et analytics
- **Préférences** : Configuration par utilisateur
- **Batch operations** : Opérations en masse

---

## Structure

```
├── app/apps/(org)/[slug]/notifications/
│   └── page.tsx               # Liste des notifications

├── components/common/
│   └── core/
│       └── notification-panel.tsx  # Panneau de notifications

└── lib/
    ├── services/notifications/
    │   └── notification.service.ts
    ├── hooks/
    │   └── use-notifications.ts    # Hook principal
    └── contexts/
        └── NotificationContext.tsx # Context provider
```

---

## Server-Sent Events (SSE)

### Principe

SSE permet au serveur d'envoyer des événements au client en temps réel sur une connexion HTTP persistante.

```
Client → Ouvre connexion SSE (/notifications/stream/)
  ↓
Serveur → Envoie événements en temps réel
  ↓
Client → Reçoit et traite événements
```

### Endpoint SSE

```typescript
NOTIFICATIONS: {
  STREAM: '/notifications/stream/',  // Connexion SSE
}
```

### Hook useNotifications

`lib/hooks/use-notifications.ts`

```typescript
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Connexion SSE
    const eventSource = new EventSource(
      `${API_CONFIG.baseURL}/notifications/stream/`,
      { withCredentials: true }
    );

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Afficher notification toast
      toast.info(notification.message);
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Reconnexion automatique après 5s
      setTimeout(connectSSE, 5000);
    };

    return () => eventSource.close();
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
```

---

## Endpoints

```typescript
NOTIFICATIONS: {
  // CRUD
  LIST: '/notifications/notifications/',
  CREATE: '/notifications/notifications/',
  DETAIL: (id: string) => `/notifications/notifications/${id}/`,
  DELETE: (id: string) => `/notifications/notifications/${id}/`,

  // Actions
  MARK_AS_READ: (id: string) => `/notifications/notifications/${id}/mark-as-read/`,
  MARK_ALL_AS_READ: '/notifications/notifications/mark-all-as-read/',
  BATCH_DELETE: '/notifications/notifications/batch-delete/',
  UNREAD_COUNT: '/notifications/notifications/unread-count/',
  STATS: '/notifications/notifications/stats/',

  // Préférences
  PREFERENCES_LIST: '/notifications/preferences/',

  // SSE
  STREAM: '/notifications/stream/',
}
```

---

## Service de notifications

`lib/services/notifications/notification.service.ts`

```typescript
export const notificationService = {
  /**
   * Liste des notifications
   */
  async getAll(params?: {
    is_read?: boolean;
    type?: string;
    page?: number;
  }): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.is_read !== undefined) {
      searchParams.append('is_read', String(params.is_read));
    }
    if (params?.type) searchParams.append('type', params.type);
    if (params?.page) searchParams.append('page', String(params.page));

    const url = `${API_ENDPOINTS.NOTIFICATIONS.LIST}?${searchParams}`;
    return cacheManager.get<NotificationListResponse>(url, { ttl: 30 * 1000 });
  },

  /**
   * Marquer comme lu
   */
  async markAsRead(id: string): Promise<Notification> {
    return cacheManager.post<Notification>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(id),
      undefined,
      {
        invalidateCache: [
          API_ENDPOINTS.NOTIFICATIONS.LIST,
          API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
        ],
      }
    );
  },

  /**
   * Marquer toutes comme lues
   */
  async markAllAsRead(): Promise<{ message: string }> {
    return cacheManager.post(
      API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ,
      undefined,
      {
        invalidateCache: [
          API_ENDPOINTS.NOTIFICATIONS.LIST,
          API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
        ],
      }
    );
  },

  /**
   * Nombre de notifications non lues
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return cacheManager.get<{ count: number }>(
      API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
      { ttl: 30 * 1000 }
    );
  },

  /**
   * Supprimer en masse
   */
  async batchDelete(ids: string[]): Promise<{ message: string }> {
    return cacheManager.post(
      API_ENDPOINTS.NOTIFICATIONS.BATCH_DELETE,
      { notification_ids: ids },
      {
        invalidateCache: [API_ENDPOINTS.NOTIFICATIONS.LIST],
      }
    );
  },
};
```

---

## Types de notifications

```typescript
export interface Notification {
  id: string;
  recipient: User;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  read_at?: string;
  link?: string;
  data?: Record<string, any>;
  created_at: string;
}

export interface NotificationListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Notification[];
}

export interface NotificationPreferences {
  id: string;
  user: User;
  email_notifications: boolean;
  push_notifications: boolean;
  notification_types: {
    leave_requests: boolean;
    payroll: boolean;
    attendance: boolean;
    inventory: boolean;
  };
}
```

---

## Composant NotificationPanel

`components/common/core/notification-panel.tsx`

Interface utilisateur pour afficher les notifications :

- Badge avec compteur non lu
- Dropdown avec liste
- Marquage lu/non lu
- Suppression
- Lien vers détail

```typescript
<NotificationPanel>
  <NotificationBadge count={unreadCount} />
  <NotificationDropdown>
    {notifications.map(notif => (
      <NotificationItem
        key={notif.id}
        notification={notif}
        onMarkAsRead={() => markAsRead(notif.id)}
        onDelete={() => deleteNotification(notif.id)}
      />
    ))}
  </NotificationDropdown>
</NotificationPanel>
```

---

## Contexte de notifications

`lib/contexts/NotificationContext.tsx`

Provider global pour les notifications :

```typescript
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Connexion SSE
  useEffect(() => {
    connectSSE();
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, ... }}>
      {children}
    </NotificationContext.Provider>
  );
}
```

---

## Gestion de la connexion SSE

### Reconnexion automatique

```typescript
const connectSSE = () => {
  const token = tokenManager.getAccessToken();
  if (!token) return;

  const eventSource = new EventSource(
    `${API_CONFIG.baseURL}/notifications/stream/?token=${token}`
  );

  eventSource.onopen = () => {
    console.log('[SSE] Connected');
  };

  eventSource.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    handleNotification(notification);
  };

  eventSource.onerror = () => {
    console.error('[SSE] Error, reconnecting in 5s...');
    eventSource.close();
    setTimeout(connectSSE, 5000);
  };
};
```

### Refresh token pour SSE

Comme `EventSource` ne supporte pas les headers personnalisés, le token est passé en query param :

```typescript
`/notifications/stream/?token=${token}`
```

Le backend valide ce token et le refresh automatiquement si nécessaire.

---

## Types de notifications envoyées

### Congés (HR)

- Nouvelle demande de congé
- Congé approuvé
- Congé rejeté

### Paie (HR)

- Nouvelle fiche de paie disponible
- Avance approuvée
- Avance rejetée

### Pointages (HR)

- Pointage approuvé
- Anomalie de pointage

### Inventory

- Stock bas
- Rupture de stock
- Nouvelle commande

---

## Push Notifications (PWA)

### Service Worker

Le Service Worker peut afficher des notifications natives :

```typescript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: data.link },
  });
});
```

### Subscription

```typescript
// lib/hooks/usePushNotifications.ts
export function usePushNotifications() {
  const subscribe = async () => {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    });

    // Envoyer subscription au backend
    await notificationService.savePushSubscription(subscription);
  };

  return { subscribe };
}
```

---

## Bonnes pratiques

### SSE

1. Toujours fermer la connexion lors du unmount
2. Implémenter la reconnexion automatique
3. Gérer les erreurs de connexion
4. Ne pas ouvrir plusieurs connexions simultanées

### Notifications

1. Limiter le nombre de notifications affichées
2. Marquer comme lu après lecture
3. Nettoyer les anciennes notifications
4. Grouper les notifications similaires

### Performance

1. Pagination pour la liste
2. Cache court pour les compteurs
3. Debounce pour les actions en masse
4. Utiliser les React.memo pour les items

---

## Références

- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
