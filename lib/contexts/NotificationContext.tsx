"use client";

import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import { getUnreadCount } from '@/lib/services/notifications';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface NotificationContextValue {
  unreadCount: number;
  requestNotificationPermission: () => Promise<void>;
  hasPermission: boolean;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/**
 * NotificationProvider — gère le compteur non lues + permission push.
 *
 * Le temps réel est entièrement géré par le hook `useSSE()` qui met à jour
 * le store Zustand `useNotificationStore`. Ce provider ne fait plus de
 * WebSocket : il se contente de charger le compteur initial via REST
 * et de gérer la permission push du navigateur.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasAskedPermission, setHasAskedPermission] = useState(false);

  const { permission, requestPermission, isSupported } = usePushNotifications();

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Erreur lors du chargement du nombre de notifications non lues:', error);
    }
  }, []);

  // Demander la permission pour les notifications
  const requestNotificationPermission = useCallback(async () => {
    if (!isSupported || permission === 'granted' || hasAskedPermission) {
      return;
    }

    setHasAskedPermission(true);
    const result = await requestPermission();

    if (result === 'granted') {
      console.log('Permission de notification accordée');
    }
  }, [isSupported, permission, requestPermission, hasAskedPermission]);

  // Charger le compteur initial
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Demander automatiquement la permission après 5 secondes si non demandée
  useEffect(() => {
    if (!hasAskedPermission && isSupported && permission === 'default') {
      const timer = setTimeout(() => {
        requestNotificationPermission();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [hasAskedPermission, isSupported, permission, requestNotificationPermission]);

  const value: NotificationContextValue = {
    unreadCount,
    requestNotificationPermission,
    hasPermission: permission === 'granted',
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
