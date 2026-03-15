/**
 * Provider pour le Service Worker
 * Enregistre le SW et affiche le prompt de mise à jour
 * Gère le pré-cache progressif de toutes les routes
 */

'use client';

import { useServiceWorker } from '@/lib/hooks/useServiceWorker';
import { ServiceWorkerUpdatePrompt } from '@/components/ui/sw-update-prompt';
import { CacheProgressIndicator } from '@/components/ui/cache-progress-indicator';
import { useEffect } from 'react';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { isSupported, isRegistered } = useServiceWorker();

  useEffect(() => {
    if (isSupported && isRegistered) {
      console.log('[PWA] Service Worker actif et prêt');
      console.log('[PWA] Le pré-cache progressif démarrera automatiquement via CacheProgressIndicator');
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
