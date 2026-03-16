/**
 * Hook pour surveiller la progression du téléchargement offline-first (Data Warmup)
 *
 * Usage:
 * ```tsx
 * const { progress, isDownloading, forceRefresh } = useWarmupStatus();
 * ```
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { dataWarmup, type WarmupProgress } from '@/lib/offline';

export function useWarmupStatus() {
  const [progress, setProgress] = useState<WarmupProgress>(dataWarmup.getProgress());

  useEffect(() => {
    const unsubscribe = dataWarmup.subscribe(setProgress);
    return unsubscribe;
  }, []);

  const forceRefresh = useCallback(async () => {
    await dataWarmup.forceWarmup();
  }, []);

  const cancel = useCallback(() => {
    dataWarmup.cancel();
  }, []);

  return {
    progress,
    phase: progress.phase,
    percentage: progress.percentage,
    isDownloading: progress.phase !== 'idle' && progress.phase !== 'complete' && progress.phase !== 'error',
    isComplete: progress.phase === 'complete',
    isError: progress.phase === 'error',
    completedEndpoints: progress.completedEndpoints,
    totalEndpoints: progress.totalEndpoints,
    failedEndpoints: progress.failedEndpoints,
    currentEndpoint: progress.currentEndpoint,
    errors: progress.errors,
    forceRefresh,
    cancel,
  };
}
