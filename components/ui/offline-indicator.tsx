/**
 * Indicateur d'état offline/online avec synchronisation
 */

'use client';

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useSyncStatus } from '@/lib/hooks/useSyncStatus';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { status, pendingCount, forceSync, progress, completedMutations, failedMutations } = useSyncStatus();

  // Ne rien afficher si tout est normal (online et pas de sync)
  if (isOnline && status === 'idle' && pendingCount === 0 && !wasOffline) {
    return null;
  }

  // Message du tooltip
  const getTooltipContent = () => {
    if (!isOnline) {
      return pendingCount > 0
        ? `Mode hors ligne - ${pendingCount} modification(s) en attente`
        : 'Mode hors ligne - Les modifications seront synchronisées à la reconnexion';
    }

    if (status === 'syncing') {
      return `Synchronisation en cours... ${completedMutations}/${completedMutations + failedMutations} (${Math.round(progress)}%)`;
    }

    if (status === 'success') {
      return 'Synchronisation réussie !';
    }

    if (status === 'error') {
      return `Erreur de synchronisation - ${failedMutations} échec(s)`;
    }

    if (pendingCount > 0) {
      return `${pendingCount} modification(s) en attente de synchronisation`;
    }

    if (wasOffline) {
      return 'Connexion rétablie !';
    }

    return 'En ligne';
  };

  // Icône à afficher
  const getIcon = () => {
    if (!isOnline) {
      return <CloudOff className="size-3.5" />;
    }

    if (status === 'syncing') {
      return <RefreshCw className="size-3.5 animate-spin" />;
    }

    if (status === 'success') {
      return <CheckCircle2 className="size-3.5" />;
    }

    if (status === 'error') {
      return <AlertCircle className="size-3.5" />;
    }

    return <Cloud className="size-3.5" />;
  };

  // Couleur du badge
  const getBadgeVariant = () => {
    if (!isOnline) return 'secondary';
    if (status === 'syncing') return 'info';
    if (status === 'success') return 'success';
    if (status === 'error') return 'error';
    if (pendingCount > 0) return 'warning';
    return 'default';
  };

  const badgeClasses = cn(
    'gap-1.5 px-2.5 py-1 transition-all duration-200',
    !isOnline && 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200',
    status === 'syncing' && 'bg-primary/10 text-primary hover:bg-primary/20 border-primary',
    status === 'success' && 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200',
    status === 'error' && 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200'
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge variant={getBadgeVariant()} className={badgeClasses}>
              {getIcon()}
              <span className="text-[11px] font-medium">
                {!isOnline && 'Hors ligne'}
                {isOnline && status === 'syncing' && 'Synchronisation'}
                {isOnline && status === 'success' && 'Synchronisé'}
                {isOnline && status === 'error' && 'Erreur sync'}
                {isOnline && status === 'idle' && pendingCount > 0 && `${pendingCount} en attente`}
                {isOnline && status === 'idle' && pendingCount === 0 && wasOffline && 'En ligne'}
              </span>
              {pendingCount > 0 && (
                <span className="size-5 flex items-center justify-center rounded-full bg-current/20 text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </Badge>

            {/* Bouton de sync manuel si mutations en attente */}
            {isOnline && pendingCount > 0 && status !== 'syncing' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={forceSync}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className="size-3 mr-1" />
                Synchroniser
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
