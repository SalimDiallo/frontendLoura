/**
 * Hook pour monitorer l'état de synchronisation
 */

'use client';

import { useEffect, useState } from 'react';
import { syncManager, SyncState } from '@/lib/offline/sync-manager';

export function useSyncStatus() {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getState());
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    // S'abonner aux changements d'état
    const unsubscribe = syncManager.addListener((state) => {
      setSyncState(state);
    });

    // Récupérer le nombre de mutations en attente
    const updatePendingCount = async () => {
      const count = await syncManager.getPendingCount();
      setPendingCount(count);
    };

    updatePendingCount();

    // Mettre à jour le count périodiquement
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    ...syncState,
    pendingCount,
    forceSync: () => syncManager.forceSync(),
  };
}
