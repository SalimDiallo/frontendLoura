/**
 * useSSE — Hook pour la connexion Server-Sent Events vers /notifications/stream/
 * ---------------------------------------------------------------------------
 * - Connecte un EventSource vers le backend dès que le composant monte.
 * - Gère la reconnexion automatique avec backoff exponentiel.
 * - Rafraîchit le token JWT avant chaque reconnexion.
 * - Met à jour le store Zustand en temps réel :
 *     • `event: notification`   → ajoute la notif dans la liste
 *     • `event: unread_count`   → met à jour le badge
 *     • `event: heartbeat`      → confirme la connexion + sync compteur
 * - Se déconnecte proprement à l'unmount.
 *
 * Usage :
 *   useSSE();  // dans un layout parent — pas besoin de props
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/api/config';
import { tokenManager, apiClient } from '@/lib/api/client';
import { useNotificationStore } from '@/lib/store/notification-store';
import type { Notification } from '@/lib/types/notifications';

// ---------------------------------------------------------------------------
// Constantes de reconnexion
// ---------------------------------------------------------------------------
const RECONNECT_DELAY_INITIAL = 2000;    // 2 s
const RECONNECT_DELAY_MAX     = 60000;   // 60 s
const RECONNECT_MULTIPLIER   = 1.5;
const TOKEN_REFRESH_INTERVAL  = 13 * 60 * 1000; // 13 min — refresh avant expiration (token TTL = 15 min)

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSSE() {
  const esRef = useRef<EventSource | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_DELAY_INITIAL);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Store actions
  const setUnreadCount         = useNotificationStore((s) => s.setUnreadCount);
  const addNotificationLocally = useNotificationStore((s) => s.addNotificationLocally);
  const setSSEConnected        = useNotificationStore((s) => s.setSSEConnected);

  // ---------------------------------------------------------------------------
  // Construire l'URL du stream avec token + org
  // ---------------------------------------------------------------------------
  const buildStreamURL = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;

    const token = tokenManager.getAccessToken();
    if (!token) return null;

    const orgSlug = localStorage.getItem('current_organization_slug');

    const params = new URLSearchParams();
    params.set('token', token);
    if (orgSlug) params.set('org', orgSlug);

    return `${API_CONFIG.baseURL}${API_ENDPOINTS.NOTIFICATIONS.STREAM}?${params.toString()}`;
  }, []);

  // ---------------------------------------------------------------------------
  // Ouvrir la connexion SSE
  // ---------------------------------------------------------------------------
  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Fermer une connexion précédente
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = buildStreamURL();
    if (!url) {
      // Pas de token → pas connecté
      setSSEConnected(false);
      return;
    }

    const es = new EventSource(url);
    esRef.current = es;

    // --- Connexion réussie → réinitialiser le backoff ----------------------
    es.onopen = () => {
      if (!mountedRef.current) return;
      reconnectDelayRef.current = RECONNECT_DELAY_INITIAL;
      setSSEConnected(true);
    };

    // --- Nouvelle notification reçue ---------------------------------------
    es.addEventListener('notification', (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const notif = JSON.parse(event.data) as Notification;
        addNotificationLocally(notif);
      } catch {
        // JSON malformé → ignorer
      }
    });

    // --- Mise à jour du compteur non lus ------------------------------------
    es.addEventListener('unread_count', (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const { count } = JSON.parse(event.data) as { count: number };
        setUnreadCount(count);
      } catch {
        // ignorer
      }
    });

    // --- Heartbeat (keepalive avec sync compteur) --------------------------
    es.addEventListener('heartbeat', (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const { count } = JSON.parse(event.data) as { count: number; ts: number };
        setUnreadCount(count);
        setSSEConnected(true);
      } catch {
        // ignorer
      }
    });

    // --- Erreur d'authentification -----------------------------------------
    es.addEventListener('error_event', (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const { message } = JSON.parse(event.data) as { message: string };
        console.warn('[SSE] Erreur serveur:', message);
      } catch {
        // ignorer
      }
    });

    // --- Erreur / déconnexion → refresh token puis reconnexion -------------
    es.onerror = () => {
      if (!mountedRef.current) return;

      es.close();
      esRef.current = null;
      setSSEConnected(false);

      // Backoff exponentiel
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(
        delay * RECONNECT_MULTIPLIER,
        RECONNECT_DELAY_MAX
      );

      reconnectTimerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;

        // Rafraîchir le token avant de reconnecter — le token a peut-être expiré
        try {
          await apiClient.refreshToken();
        } catch {
          // Si le refresh échoue, on essaie quand même de reconnecter
          // (le token est peut-être encore valide et l'erreur était réseau)
        }

        connect();
      }, delay);
    };
  }, [buildStreamURL, setUnreadCount, addNotificationLocally, setSSEConnected]);

  // ---------------------------------------------------------------------------
  // Rafraîchir le token périodiquement et reconnecter le stream
  // ---------------------------------------------------------------------------
  const scheduleTokenRefresh = useCallback(() => {
    tokenRefreshTimerRef.current = setInterval(async () => {
      if (!mountedRef.current) return;

      // Rafraîchir le token puis reconnecter avec le nouveau token
      try {
        const refreshed = await apiClient.refreshToken();
        if (refreshed) {
          connect(); // Reconnecter avec le nouveau token
        }
      } catch {
        // Le refresh a échoué, on laisse le backoff gérer
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, [connect]);

  // ---------------------------------------------------------------------------
  // Reconnecter quand la page redevient visible (tab switch)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        // Reconnecter si la connexion est morte
        if (!esRef.current || esRef.current.readyState === EventSource.CLOSED) {
          connect();
        }
      }
    };

    // Reconnecter quand le réseau revient
    const handleOnline = () => {
      if (mountedRef.current) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [connect]);

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    connect();
    scheduleTokenRefresh();

    return () => {
      mountedRef.current = false;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
      }
      setSSEConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect, scheduleTokenRefresh]);
}
