/**
 * Hook générique pour charger et gérer un élément unique
 * Utilisé dans les pages de détail
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Configuration du hook
 */
export interface UseDetailDataOptions<T> {
  /**
   * Fonction pour récupérer l'élément
   */
  fetchFn: (id: string) => Promise<T>;
  
  /**
   * ID de l'élément à charger
   */
  id: string;
  
  /**
   * Charger automatiquement au montage
   */
  autoLoad?: boolean;

  /**
   * Callback appelé après chargement réussi
   */
  onSuccess?: (data: T) => void;

  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Error) => void;

  /**
   * Dépendances supplémentaires pour le rechargement
   */
  deps?: any[];
}

/**
 * État retourné par le hook
 */
export interface UseDetailDataReturn<T> {
  /** Données chargées */
  data: T | null;
  
  /** État de chargement */
  loading: boolean;
  
  /** Message d'erreur */
  error: string | null;
  
  /** Recharger les données */
  reload: () => Promise<void>;
  
  /** Rafraîchir (alias de reload) */
  refresh: () => Promise<void>;

  /** Mettre à jour les données localement sans rechargement */
  setData: (data: T | null) => void;
}

/**
 * Hook pour charger un élément unique
 */
export function useDetailData<T>({
  fetchFn,
  id,
  autoLoad = true,
  onSuccess,
  onError,
  deps = [],
}: UseDetailDataOptions<T>): UseDetailDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction de chargement des données
   */
  const loadData = useCallback(async () => {
    if (!id) {
      setError('ID manquant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFn(id);
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(errorMessage);
      console.error('useDetailData error:', err);

      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, id, onSuccess, onError]);

  /**
   * Charger les données au montage et quand l'ID change
   */
  useEffect(() => {
    if (autoLoad && id) {
      loadData();
    }
  }, [loadData, ...deps]);

  /**
   * Recharger les données
   */
  const reload = useCallback(async () => {
    await loadData();
  }, [loadData]);

  /**
   * Rafraîchir (alias de reload)
   */
  const refresh = reload;

  return {
    data,
    loading,
    error,
    reload,
    refresh,
    setData,
  };
}
