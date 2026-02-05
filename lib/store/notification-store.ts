/**
 * Store Zustand — Notifications
 * ------------------------------
 * Gère l'état global des notifications :
 *   - liste en mémoire
 *   - nombre de non lues (badge)
 *   - chargement / erreur
 *
 * Pas de persistence localStorage : les notifs sont toujours refetchées
 * depuis le backend à chaque montage.
 */

import { create } from 'zustand';
import type {
  Notification,
  NotificationFilters,
  NotificationPreference,
} from '@/lib/types/notifications';

// ---------------------------------------------------------------------------
// Interface du store
// ---------------------------------------------------------------------------

export interface NotificationState {
  // --- État --------------------------------------------------------------
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  preferences: NotificationPreference | null;

  // Pagination
  totalCount: number;
  currentPage: number;
  hasNext: boolean;

  // Filtres actifs
  filters: NotificationFilters;

  // --- Actions (mutateurs) ----------------------------------------------
  setNotifications: (notifications: Notification[], total: number, hasNext: boolean) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPreferences: (prefs: NotificationPreference | null) => void;
  setFilters: (filters: NotificationFilters) => void;
  setCurrentPage: (page: number) => void;

  /** Marque une notification comme lue dans l'état local (optimistic update). */
  markAsReadLocally: (id: string) => void;

  /** Marque toutes les notifications comme lues dans l'état local. */
  markAllAsReadLocally: () => void;

  /** Retire une notification de la liste locale. */
  removeNotificationLocally: (id: string) => void;

  /** Réinitialise entièrement le store. */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState = {
  notifications: [] as Notification[],
  unreadCount: 0,
  isLoading: false,
  error: null as string | null,
  preferences: null as NotificationPreference | null,
  totalCount: 0,
  currentPage: 1,
  hasNext: false,
  filters: {} as NotificationFilters,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useNotificationStore = create<NotificationState>((set) => ({
  ...initialState,

  // --- Setters ----------------------------------------------------------
  setNotifications: (notifications, total, hasNext) =>
    set({ notifications, totalCount: total, hasNext }),

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setPreferences: (preferences) => set({ preferences }),

  setFilters: (filters) => set({ filters, currentPage: 1 }),

  setCurrentPage: (currentPage) => set({ currentPage }),

  // --- Optimistic updates -----------------------------------------------
  markAsReadLocally: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((n) => n.id === id)?.is_read ? 0 : 1)),
    })),

  markAllAsReadLocally: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  removeNotificationLocally: (id) =>
    set((state) => {
      const removed = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        totalCount: state.totalCount - 1,
        unreadCount: removed && !removed.is_read ? state.unreadCount - 1 : state.unreadCount,
      };
    }),

  // --- Reset ------------------------------------------------------------
  reset: () => set(initialState),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const notificationSelectors = {
  getNotifications: (state: NotificationState) => state.notifications,
  getUnreadCount: (state: NotificationState) => state.unreadCount,
  getIsLoading: (state: NotificationState) => state.isLoading,
  getError: (state: NotificationState) => state.error,
  getPreferences: (state: NotificationState) => state.preferences,
  getTotalCount: (state: NotificationState) => state.totalCount,
  getHasNext: (state: NotificationState) => state.hasNext,
  getCurrentPage: (state: NotificationState) => state.currentPage,
  getFilters: (state: NotificationState) => state.filters,

  /** Non lues uniquement (filtre côté client pour une utilisation rapide) */
  getUnreadNotifications: (state: NotificationState) =>
    state.notifications.filter((n) => !n.is_read),
};
