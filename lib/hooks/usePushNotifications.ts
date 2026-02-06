/**
 * Hook pour gérer les notifications push du navigateur
 */

import { useEffect, useState } from 'react';

interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (title: string, options?: NotificationOptions) => void;
  isSupported: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Vérifier si les notifications sont supportées
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('Les notifications ne sont pas supportées par ce navigateur');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return 'denied';
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported) {
      console.warn('Les notifications ne sont pas supportées');
      return;
    }

    if (permission !== 'granted') {
      console.warn('Permission de notification non accordée');
      return;
    }

    // Vérifier si le document est visible
    const isDocumentHidden = document.hidden;

    // Seulement afficher la notification si l'onglet n'est pas visible
    if (isDocumentHidden) {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options,
      });

      // Fermer automatiquement après 5 secondes
      setTimeout(() => notification.close(), 5000);

      // Focus sur la fenêtre quand on clique sur la notification
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();

        // Si une URL est fournie dans les options, y naviguer
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };
    }
  };

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported,
  };
}
