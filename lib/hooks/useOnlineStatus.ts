/**
 * Hook pour détecter l'état de connexion online/offline
 */

'use client';

import { useEffect, useState } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean; // Indique si on vient de repasser online après avoir été offline
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    // Handlers pour les événements online/offline
    const handleOnline = () => {
      console.log('[Network] État: ONLINE');
      setIsOnline(true);
      setWasOffline(true);

      // Reset wasOffline après 5 secondes
      setTimeout(() => {
        setWasOffline(false);
      }, 5000);
    };

    const handleOffline = () => {
      console.log('[Network] État: OFFLINE');
      setIsOnline(false);
      setWasOffline(false);
    };

    // Ajouter les listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
