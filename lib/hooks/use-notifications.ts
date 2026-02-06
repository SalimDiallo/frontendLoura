/**
 * useNotifications — Hook React pour les notifications
 * ----------------------------------------------------
 * Encapsule toutes les interactions avec le store et le service.
 *
 * Usage dans un composant :
 *   const { notifications, unreadCount, fetchNotifications, markAsRead, ... } = useNotifications();
 */

'use client';

import { useCallback, useEffect } from 'react';

import { useNotificationStore } from '@/lib/store/notification-store';
import {
  getNotifications,
  getUnreadCount as fetchUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
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

  // --- Fetch notifications --------------------------------------------------
  const fetchNotifications = useCallback(async (page = currentPage, f = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getNotifications({ ...f, page, page_size: 20 });
      setNotifications(response.results, response.count, !!response.next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, setLoading, setError, setNotifications]);

  // --- Fetch unread count ---------------------------------------------------
  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadCount();
      setUnreadCount(res.unread_count);
    } catch {
      // Silencieux : le badge ne bloque pas l'UX
    }
  }, [setUnreadCount]);

  // --- Marquer une notification comme lue ------------------------------------
  const markAsRead = useCallback(async (id: string) => {
    markAsReadLocally(id); // optimistic update
    try {
      await apiMarkAsRead(id);
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      // En cas d'erreur, on refetch pour resynchroniser
      await fetchNotifications();
    }
  }, [markAsReadLocally, setUnreadCount, fetchNotifications, unreadCount]);

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

  // --- Changer les filtres ---------------------------------------------------
  const applyFilters = useCallback((newFilters: NotificationFilters) => {
    setFilters(newFilters);          // met à jour le store + reset page à 1
    fetchNotifications(1, newFilters); // refetch immédiatement avec les nouveaux filtres
  }, [setFilters, fetchNotifications]);

  // --- Pagination ------------------------------------------------------------
  const goToNextPage = useCallback(() => {
    if (hasNext) {
      const next = currentPage + 1;
      setCurrentPage(next);
      fetchNotifications(next);
    }
  }, [hasNext, currentPage, setCurrentPage, fetchNotifications]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      fetchNotifications(prev);
    }
  }, [currentPage, setCurrentPage, fetchNotifications]);

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
      fetchNotifications(1, filters);
      refreshUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, filters]);

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

    // Actions
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    applyFilters,
    goToNextPage,
    goToPreviousPage,
    fetchStats,
    fetchPreferences,
    savePreferences,
  };
}
