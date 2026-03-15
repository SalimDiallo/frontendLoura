/**
 * Provider pour le Service Worker
 * Enregistre le SW et affiche le prompt de mise à jour
 * Gère le pré-cache progressif de toutes les routes
 * Gère l'enrichissement dynamique avec les données réelles de l'user
 */

'use client';

import { useServiceWorker } from '@/lib/hooks/useServiceWorker';
import { ServiceWorkerUpdatePrompt } from '@/components/ui/sw-update-prompt';
import { CacheProgressIndicator } from '@/components/ui/cache-progress-indicator';
import { enrichCacheWithDynamicData, isDynamicEnrichmentComplete } from '@/lib/offline';
import { useEffect } from 'react';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { isSupported, isRegistered } = useServiceWorker();

  useEffect(() => {
    if (isSupported && isRegistered) {
      console.log('[PWA] Service Worker actif et prêt');
      console.log('[PWA] Le pré-cache progressif démarrera automatiquement via CacheProgressIndicator');

      // Lancer l'enrichissement dynamique après le cache initial
      // Délai de 30 secondes pour laisser le cache initial se terminer
      // Et seulement si pas déjà fait
      const enrichTimer = setTimeout(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const isDone = isDynamicEnrichmentComplete();

        if (token && !isDone) {
          console.log('[PWA] 🔄 Lancement enrichissement dynamique...');
          enrichCacheWithDynamicData();
        }
      }, 30000); // 30 secondes

      return () => clearTimeout(enrichTimer);
    }
  }, [isSupported, isRegistered]);

  return (
    <>
      {children}
      <ServiceWorkerUpdatePrompt />
      <CacheProgressIndicator />
    </>
  );
}
