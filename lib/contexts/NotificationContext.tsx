"use client";

import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import { getUnreadCount } from '@/lib/services/notifications';
import type { Notification } from '@/lib/types/notifications';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface NotificationContextValue {
  unreadCount: number;
  requestNotificationPermission: () => Promise<void>;
  hasPermission: boolean;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasAskedPermission, setHasAskedPermission] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const { permission, requestPermission, showNotification, isSupported } = usePushNotifications();

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

  // Connecter au WebSocket pour les notifications en temps réel
  const connectWebSocket = useCallback(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    const orgSlug = localStorage.getItem('current_organization_slug');

    if (!token || !orgSlug) {
      console.log('Token ou organisation manquant, impossible de se connecter au WebSocket');
      return;
    }

    try {
      // Déterminer l'URL WebSocket en fonction de l'environnement
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
      const wsBaseUrl = apiUrl.replace(/^https?:\/\//, '').replace('/api', '');

      const wsUrl = `${wsProtocol}://${wsBaseUrl}/ws/notifications/?token=${token}&organization=${orgSlug}`;

      console.log('Connexion au WebSocket des notifications...');
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket des notifications connecté');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'notification') {
            const notification: Notification = data.notification;

            // Incrémenter le compteur de non lues
            setUnreadCount((prev) => prev + 1);

            // Afficher la notification push si la permission est accordée
            if (permission === 'granted') {
              showNotification(notification.title, {
                body: notification.message,
                tag: notification.id,
                data: {
                  url: notification.action_url,
                  notificationId: notification.id,
                },
                icon: '/favicon.ico',
              });
            }
          } else if (data.type === 'unread_count') {
            setUnreadCount(data.count);
          }
        } catch (error) {
          console.error('Erreur lors du traitement du message WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket des notifications déconnecté');
        wsRef.current = null;

        // Tentative de reconnexion avec backoff exponentiel
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnexion dans ${delay}ms (tentative ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Erreur lors de la création du WebSocket:', error);
    }
  }, [permission, showNotification]);

  // Charger le compteur initial et connecter le WebSocket
  useEffect(() => {
    refreshUnreadCount();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [refreshUnreadCount, connectWebSocket]);

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
