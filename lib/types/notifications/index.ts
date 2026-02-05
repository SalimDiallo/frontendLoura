// ============================================
// Notifications — TypeScript Types
// ============================================

// --- Enums & Littéraux -------------------------------------------------

export type NotificationType = 'alert' | 'system' | 'user';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export enum NotificationTypeEnum {
  ALERT = 'alert',
  SYSTEM = 'system',
  USER = 'user',
}

export enum NotificationPriorityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// --- Notification (lecture) --------------------------------------------

export interface Notification {
  id: string;
  organization: string;
  recipient: string;
  sender: string | null;
  sender_name: string | null;
  notification_type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entity_type: string;
  entity_id: string;
  action_url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Notification (création) ------------------------------------------

export interface NotificationCreate {
  notification_type?: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
}

// --- Notification Preferences ------------------------------------------

export interface NotificationPreference {
  id: string;
  organization: string;
  user: string;
  receive_alerts: boolean;
  receive_system: boolean;
  receive_user: boolean;
  min_priority: NotificationPriority;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferenceUpdate {
  receive_alerts?: boolean;
  receive_system?: boolean;
  receive_user?: boolean;
  min_priority?: NotificationPriority;
}

// --- Filtres pour la liste ---------------------------------------------

export interface NotificationFilters {
  is_read?: boolean;
  notification_type?: NotificationType;
  priority?: NotificationPriority;
  entity_type?: string;
}

// --- Réponses API ------------------------------------------------------

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface MarkAllAsReadResponse {
  message: string;
  count: number;
}

// --- Réponse paginée (réutilise le pattern existant) ------------------

export interface PaginatedNotificationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}
