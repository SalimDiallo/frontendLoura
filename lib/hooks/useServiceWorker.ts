/**
 * Hook pour gérer l'enregistrement et le cycle de vie du Service Worker
 */

'use client';

import { useEffect, useState } from 'react';

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
  });

  useEffect(() => {
    // Vérifier le support du Service Worker
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[SW] Service Workers not supported');
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    // Enregistrer le Service Worker
    registerServiceWorker();

    // Cleanup
    return () => {
      // Rien à nettoyer pour le moment
    };
  }, []);

  /**
   * Enregistre le Service Worker
   */
  const registerServiceWorker = async () => {
    try {
      console.log('[SW] Enregistrement du Service Worker...');

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Service Worker enregistré:', registration.scope);

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration,
      }));

      // Écouter les mises à jour
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Une mise à jour est disponible
              console.log('[SW] Mise à jour disponible');
              setState(prev => ({ ...prev, isUpdateAvailable: true }));
            }
          });
        }
      });

      // Vérifier les mises à jour périodiquement
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Toutes les heures

    } catch (error) {
      console.error('[SW] Erreur d\'enregistrement:', error);
    }
  };

  /**
   * Force la mise à jour du Service Worker
   */
  const updateServiceWorker = async () => {
    if (!state.registration) return;

    const newWorker = state.registration.waiting;

    if (newWorker) {
      // Dire au nouveau SW de prendre le contrôle
      newWorker.postMessage({ type: 'SKIP_WAITING' });

      // Recharger la page une fois activé
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };

  /**
   * Nettoie le cache du Service Worker
   */
  const clearCache = async (): Promise<boolean> => {
    const registration = state.registration;
    if (!registration || !registration.active) return false;

    const activeWorker = registration.active;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };

      activeWorker.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  };

  /**
   * Désenregistre le Service Worker
   */
  const unregisterServiceWorker = async (): Promise<boolean> => {
    if (!state.registration) return false;

    const success = await state.registration.unregister();
    if (success) {
      setState({
        isSupported: state.isSupported,
        isRegistered: false,
        isUpdateAvailable: false,
        registration: null,
      });
    }

    return success;
  };

  return {
    ...state,
    updateServiceWorker,
    clearCache,
    unregisterServiceWorker,
  };
}
