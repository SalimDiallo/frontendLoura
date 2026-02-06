/**
 * useSSE — Hook pour la connexion Server-Sent Events vers /notifications/stream/
 * ---------------------------------------------------------------------------
 * - Connecte un EventSource vers le backend dès que le composant monte.
 * - Gère la reconnexion automatique avec backoff exponentiel.
 * - Met à jour le store Zustand en temps réel :
 *     • `event: notification`   → ajoute/met à jour la notif dans la liste
 *     • `event: unread_count`   → met à jour le badge
 * - Se déconnecte proprement à l'unmount.
 *
 * Usage :
 *   useSSE();  // dans un layout parent — pas besoin de props
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/api/config';
import { tokenManager } from '@/lib/api/client';
import { useNotificationStore } from '@/lib/store/notification-store';
import type { Notification } from '@/lib/types/notifications';

// ---------------------------------------------------------------------------
// Constantes de reconnexion
// ---------------------------------------------------------------------------
const RECONNECT_DELAY_INITIAL = 3000;   // 3 s
const RECONNECT_DELAY_MAX    = 30000;   // 30 s
const RECONNECT_MULTIPLIER  = 2;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSSE() {
  const esRef = useRef<EventSource | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_DELAY_INITIAL);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Store actions
  const setUnreadCount        = useNotificationStore((s) => s.setUnreadCount);
  const addNotificationLocally = useNotificationStore((s) => s.addNotificationLocally);

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

    // Fermer une connexion précédente si elle existe
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = buildStreamURL();
    if (!url) {
      // Pas de token → on ne se connecte pas (utilisateur non authentifié)
      return;
    }

    const es = new EventSource(url);
    esRef.current = es;

    // --- Connexion réussie → réinitialiser le backoff ----------------------
    es.onopen = () => {
      reconnectDelayRef.current = RECONNECT_DELAY_INITIAL;
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

    // --- Erreur / déconnexion → reconnexion avec backoff ---------------------
    es.onerror = () => {
      if (!mountedRef.current) return;

      es.close();
      esRef.current = null;

      // Backoff exponentiel
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * RECONNECT_MULTIPLIER, RECONNECT_DELAY_MAX);

      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    };
  }, [buildStreamURL, setUnreadCount, addNotificationLocally]);

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect]);
}
