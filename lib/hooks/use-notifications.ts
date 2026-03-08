/**
 * useNotifications — Hook React pour les notifications
 * ----------------------------------------------------
 * Encapsule toutes les interactions avec le store et le service.
 *
 * Usage dans un composant :
 *   const { notifications, unreadCount, fetchNotifications, markAsRead, ... } = useNotifications();
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useNotificationStore } from '@/lib/store/notification-store';
import {
  getNotifications,
  getUnreadCount as fetchUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  batchDeleteNotifications as apiBatchDelete,
  getNotificationStats,
  getPreferences,
  updatePreferences,
} from '@/lib/services/notifications';
import type {
  NotificationFilters,
  NotificationPreferenceUpdate,
} from '@/lib/types/notifications';


export function useNotifications(autoFetch = false) {
  // --- Store ------------------------------------------------------------------
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const error = useNotificationStore((s) => s.error);
  const totalCount = useNotificationStore((s) => s.totalCount);
  const hasNext = useNotificationStore((s) => s.hasNext);
  const currentPage = useNotificationStore((s) => s.currentPage);
  const filters = useNotificationStore((s) => s.filters);
  const preferences = useNotificationStore((s) => s.preferences);
  const sseConnected = useNotificationStore((s) => s.sseConnected);

  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const setLoading = useNotificationStore((s) => s.setLoading);
  const setError = useNotificationStore((s) => s.setError);
  const setFilters = useNotificationStore((s) => s.setFilters);
  const setCurrentPage = useNotificationStore((s) => s.setCurrentPage);
  const setPreferences = useNotificationStore((s) => s.setPreferences);
  const markAsReadLocally = useNotificationStore((s) => s.markAsReadLocally);
  const markAllAsReadLocally = useNotificationStore((s) => s.markAllAsReadLocally);
  const removeNotificationLocally = useNotificationStore((s) => s.removeNotificationLocally);
  const removeBatchLocally = useNotificationStore((s) => s.removeBatchLocally);

  // Refs to break circular deps for callbacks
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  // --- Fetch notifications --------------------------------------------------
  const fetchNotifications = useCallback(async (page?: number, f?: NotificationFilters) => {
    const resolvedPage = page ?? currentPageRef.current;
    const resolvedFilters = f ?? filtersRef.current;

    setLoading(true);
    setError(null);
    try {
      const response = await getNotifications({ ...resolvedFilters, page: resolvedPage, page_size: 20 });
      setNotifications(response.results, response.count, !!response.next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setNotifications]);

  // --- Fetch unread count ---------------------------------------------------
  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadCount();
      setUnreadCount(res.unread_count);
    } catch {
      // Silencieux
    }
  }, [setUnreadCount]);

  // --- Marquer une notification comme lue ------------------------------------
  const markAsRead = useCallback(async (id: string) => {
    markAsReadLocally(id); // optimistic update
    try {
      await apiMarkAsRead(id);
    } catch {
      // Resync en cas d'erreur
      await fetchNotifications();
    }
  }, [markAsReadLocally, fetchNotifications]);

  // --- Marquer tout comme lu -------------------------------------------------
  const markAllAsRead = useCallback(async () => {
    markAllAsReadLocally(); // optimistic update
    try {
      await apiMarkAllAsRead();
      setUnreadCount(0);
    } catch {
      await fetchNotifications();
    }
  }, [markAllAsReadLocally, setUnreadCount, fetchNotifications]);

  // --- Supprimer une notification --------------------------------------------
  const deleteNotification = useCallback(async (id: string) => {
    removeNotificationLocally(id); // optimistic update
    try {
      await apiDeleteNotification(id);
    } catch {
      await fetchNotifications();
    }
  }, [removeNotificationLocally, fetchNotifications]);

  // --- Supprimer un lot de notifications -------------------------------------
  const batchDelete = useCallback(async (ids: string[]) => {
    removeBatchLocally(ids); // optimistic update
    try {
      await apiBatchDelete(ids);
    } catch {
      await fetchNotifications();
    }
  }, [removeBatchLocally, fetchNotifications]);

  // --- Changer les filtres ---------------------------------------------------
  const applyFilters = useCallback((newFilters: NotificationFilters) => {
    setFilters(newFilters);           // met à jour le store + reset page à 1
    fetchNotifications(1, newFilters); // refetch immédiatement
  }, [setFilters, fetchNotifications]);

  // --- Pagination ------------------------------------------------------------
  const goToNextPage = useCallback(() => {
    const store = useNotificationStore.getState();
    if (store.hasNext) {
      const next = store.currentPage + 1;
      setCurrentPage(next);
      fetchNotifications(next);
    }
  }, [setCurrentPage, fetchNotifications]);

  const goToPreviousPage = useCallback(() => {
    const store = useNotificationStore.getState();
    if (store.currentPage > 1) {
      const prev = store.currentPage - 1;
      setCurrentPage(prev);
      fetchNotifications(prev);
    }
  }, [setCurrentPage, fetchNotifications]);

  // --- Stats -----------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    try {
      return await getNotificationStats();
    } catch {
      return null;
    }
  }, []);

  // --- Préférences ----------------------------------------------------------
  const fetchPreferences = useCallback(async () => {
    try {
      const prefs = await getPreferences();
      setPreferences(prefs);
      return prefs;
    } catch {
      return null;
    }
  }, [setPreferences]);

  const savePreferences = useCallback(async (data: NotificationPreferenceUpdate) => {
    try {
      const updated = await updatePreferences(data);
      setPreferences(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      return null;
    }
  }, [setPreferences, setError]);

  // --- Auto-fetch si demandé -------------------------------------------------
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications(1);
      refreshUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  // --- Exposition ------------------------------------------------------------
  return {
    // État
    notifications,
    unreadCount,
    isLoading,
    error,
    totalCount,
    hasNext,
    currentPage,
    filters,
    preferences,
    sseConnected,

    // Actions
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    batchDelete,
    applyFilters,
    goToNextPage,
    goToPreviousPage,
    fetchStats,
    fetchPreferences,
    savePreferences,
  };
}
