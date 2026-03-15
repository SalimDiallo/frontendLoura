/**
 * Prompt pour notifier l'utilisateur d'une mise à jour disponible du Service Worker
 */

'use client';

import { useServiceWorker } from '@/lib/hooks/useServiceWorker';
import { RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';

export function ServiceWorkerUpdatePrompt() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isUpdateAvailable || isDismissed) {
    return null;
  }

  const handleUpdate = () => {
    updateServiceWorker();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-blue-500/10">
            <RefreshCw className="size-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Mise à jour disponible
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Une nouvelle version de l'application est disponible. Mettre à jour maintenant ?
            </p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                className="text-xs"
              >
                <RefreshCw className="size-3 mr-1" />
                Mettre à jour
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs"
              >
                Plus tard
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Fermer"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
