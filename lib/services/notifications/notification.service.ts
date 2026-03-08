/**
 * Service Notifications
 * ---------------------
 * Abstraction sur les endpoints /api/notifications/*.
 * Suit le même pattern que les autres services du projet (alert.service, etc.).
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  Notification,
  NotificationCreate,
  NotificationFilters,
  NotificationPreference,
  NotificationPreferenceUpdate,
  NotificationStats,
  UnreadCountResponse,
  MarkAllAsReadResponse,
  PaginatedNotificationResponse,
} from '@/lib/types/notifications';

// ---------------------------------------------------------------------------
// Liste des notifications
// ---------------------------------------------------------------------------

/**
 * Récupère la liste paginée des notifications du user courant.
 */
export async function getNotifications(
  params?: NotificationFilters & { page?: number; page_size?: number }
): Promise<PaginatedNotificationResponse> {
  const searchParams = new URLSearchParams();

  if (params?.is_read !== undefined) searchParams.append('is_read', String(params.is_read));
  if (params?.notification_type) searchParams.append('notification_type', params.notification_type);
  if (params?.priority) searchParams.append('priority', params.priority);
  if (params?.entity_type) searchParams.append('entity_type', params.entity_type);
  if (params?.page !== undefined) searchParams.append('page', String(params.page));
  if (params?.page_size !== undefined) searchParams.append('page_size', String(params.page_size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `${API_ENDPOINTS.NOTIFICATIONS.LIST}?${queryString}`
    : API_ENDPOINTS.NOTIFICATIONS.LIST;

  return apiClient.get<PaginatedNotificationResponse>(url);
}

// ---------------------------------------------------------------------------
// Détail d'une notification
// ---------------------------------------------------------------------------

export async function getNotification(id: string): Promise<Notification> {
  return apiClient.get<Notification>(API_ENDPOINTS.NOTIFICATIONS.DETAIL(id));
}

// ---------------------------------------------------------------------------
// Créer une notification
// ---------------------------------------------------------------------------

export async function createNotification(data: NotificationCreate): Promise<Notification> {
  return apiClient.post<Notification>(API_ENDPOINTS.NOTIFICATIONS.CREATE, data);
}

// ---------------------------------------------------------------------------
// Supprimer une notification
// ---------------------------------------------------------------------------

export async function deleteNotification(id: string): Promise<void> {
  return apiClient.delete<void>(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
}

// ---------------------------------------------------------------------------
// Marquer comme lue (une seule)
// ---------------------------------------------------------------------------

export async function markAsRead(id: string): Promise<Notification> {
  return apiClient.post<Notification>(API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(id));
}

// ---------------------------------------------------------------------------
// Marquer tout comme lu
// ---------------------------------------------------------------------------

export async function markAllAsRead(): Promise<MarkAllAsReadResponse> {
  return apiClient.post<MarkAllAsReadResponse>(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ);
}

// ---------------------------------------------------------------------------
// Suppression par lot
// ---------------------------------------------------------------------------

export async function batchDeleteNotifications(ids: string[]): Promise<{ message: string; count: number }> {
  return apiClient.post<{ message: string; count: number }>(API_ENDPOINTS.NOTIFICATIONS.BATCH_DELETE, { ids });
}

// ---------------------------------------------------------------------------
// Nombre de non lues
// ---------------------------------------------------------------------------

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiClient.get<UnreadCountResponse>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
}

// ---------------------------------------------------------------------------
// Stats récapitulatives
// ---------------------------------------------------------------------------

export async function getNotificationStats(): Promise<NotificationStats> {
  return apiClient.get<NotificationStats>(API_ENDPOINTS.NOTIFICATIONS.STATS);
}

// ---------------------------------------------------------------------------
// Préférences
// ---------------------------------------------------------------------------

export async function getPreferences(): Promise<NotificationPreference> {
  return apiClient.get<NotificationPreference>(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES_LIST);
}

export async function updatePreferences(data: NotificationPreferenceUpdate): Promise<NotificationPreference> {
  return apiClient.patch<NotificationPreference>(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES_LIST, data);
}
