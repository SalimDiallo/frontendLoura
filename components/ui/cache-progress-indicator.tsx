/**
 * Indicateur de progression du pré-cache (Pages + Données API)
 * Affiche la progression en parallèle du cache des routes et des données
 */

'use client';

import type { CacheProgress } from '@/lib/offline/route-discovery';
import type { DataCacheProgress } from '@/lib/offline/api-discovery';
import { getCacheProgress, isPrecacheComplete, precacheAllRoutes } from '@/lib/offline/route-discovery';
import { getDataCacheProgress, isDataCacheComplete, precacheAllApiData } from '@/lib/offline/api-discovery';
import { cn } from '@/lib/utils';
import { Check, Download, Loader2, X, Database, Layout } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Progress } from './progress';

export function CacheProgressIndicator() {
  const [pagesProgress, setPagesProgress] = useState<CacheProgress | null>(null);
  const [dataProgress, setDataProgress] = useState<DataCacheProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Vérifier s'il y a une progression en cours ou si c'est la première visite
    const currentPagesProgress = getCacheProgress();
    const currentDataProgress = getDataCacheProgress();
    const pagesComplete = isPrecacheComplete();
    const dataComplete = isDataCacheComplete();
    const hasDismissed = sessionStorage.getItem('cache_progress_dismissed') === 'true';

    if (hasDismissed) {
      setIsDismissed(true);
      return;
    }

    // Si l'un des deux est en cours, afficher
    if (currentPagesProgress?.inProgress || currentDataProgress?.inProgress) {
      setPagesProgress(currentPagesProgress);
      setDataProgress(currentDataProgress);
      setIsVisible(true);
    } else if (!pagesComplete || !dataComplete) {
      // Première visite, démarrer le pré-cache après 5 secondes
      const timer = setTimeout(() => {
        startPrecache();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const startPrecache = async () => {
    setIsVisible(true);

    // Lancer les deux pré-caches EN PARALLÈLE
    await Promise.all([
      // Pré-cache des pages
      precacheAllRoutes((newProgress) => {
        setPagesProgress(newProgress);
      }),

      // Pré-cache des données API (avec un délai de 2s pour étaler la charge)
      new Promise<void>(resolve => {
        setTimeout(async () => {
          await precacheAllApiData((newProgress) => {
            setDataProgress(newProgress);
          });
          resolve();
        }, 2000);
      }),
    ]);

    // Auto-masquer après 3 secondes quand les deux sont terminés
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem('cache_progress_dismissed', 'true');
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  // Calculer les pourcentages
  const pagesPercentage = pagesProgress && pagesProgress.total > 0
    ? Math.round((pagesProgress.cached / pagesProgress.total) * 100)
    : 0;

  const dataPercentage = dataProgress && dataProgress.total > 0
    ? Math.round((dataProgress.cached / dataProgress.total) * 100)
    : 0;

  // Statuts
  const pagesComplete = pagesProgress ? !pagesProgress.inProgress : false;
  const dataComplete = dataProgress ? !dataProgress.inProgress : false;
  const allComplete = pagesComplete && dataComplete;

  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-lg animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "shrink-0 p-2 rounded-full",
            allComplete
              ? "bg-green-500/10"
              : "bg-blue-500/10"
          )}>
            {allComplete ? (
              <Check className="size-5 text-green-600" />
            ) : (
              <Loader2 className="size-5 text-blue-600 animate-spin" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* En-tête */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {allComplete ? 'Pré-cache terminé !' : 'Préparation du mode offline...'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {allComplete
                  ? 'Application disponible hors ligne !'
                  : 'Cache des pages et données en cours'
                }
              </p>
            </div>

            {/* Progression Pages */}
            {pagesProgress && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <Layout className="size-3 text-muted-foreground" />
                  <span className="font-medium">Pages</span>
                  <span className="text-muted-foreground">
                    ({pagesProgress.cached}/{pagesProgress.total})
                  </span>
                  {pagesComplete && (
                    <Check className="size-3 text-green-600 ml-auto" />
                  )}
                </div>
                {!pagesComplete && (
                  <Progress value={pagesPercentage} className="h-1.5" />
                )}
              </div>
            )}

            {/* Progression Données */}
            {dataProgress && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <Database className="size-3 text-muted-foreground" />
                  <span className="font-medium">Données</span>
                  <span className="text-muted-foreground">
                    ({dataProgress.cached}/{dataProgress.total})
                  </span>
                  {dataComplete && (
                    <Check className="size-3 text-green-600 ml-auto" />
                  )}
                </div>
                {!dataComplete && (
                  <Progress value={dataPercentage} className="h-1.5" />
                )}
              </div>
            )}

            {/* Progression globale */}
            {!allComplete && pagesProgress && dataProgress && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
                <Download className="size-3" />
                <span>
                  Global: {Math.round((pagesPercentage + dataPercentage) / 2)}%
                </span>
              </div>
            )}

            {/* Résumé final */}
            {allComplete && pagesProgress && dataProgress && (
              <div className="flex items-center gap-2 text-xs text-green-600 pt-1 border-t">
                <Check className="size-3" />
                <span>
                  {pagesProgress.cached} pages + {dataProgress.cached} endpoints cachés
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Fermer"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
