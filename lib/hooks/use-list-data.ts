/**
 * Hook générique pour gérer des listes paginées avec filtres et recherche
 * Élimine la duplication de code dans ~90 pages
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PaginatedResponse, FilterParams } from '@/lib/types/shared';

/**
 * Configuration du hook
 */
export interface UseListDataOptions<T, F extends FilterParams> {
  /**
   * Fonction pour récupérer les données
   * @param params - Paramètres de pagination et filtres
   */
  fetchFn: (params: F & { page?: number; page_size?: number }) => Promise<PaginatedResponse<T>>;
  
  /**
   * Filtres initiaux
   */
  initialFilters?: Partial<F>;
  
  /**
   * Taille de page par défaut
   */
  pageSize?: number;
  
  /**
   * Charger automatiquement au montage
   */
  autoLoad?: boolean;

  /**
   * Dépendances supplémentaires pour le rechargement
   */
  deps?: any[];
}

/**
 * État retourné par le hook
 */
export interface UseListDataReturn<T, F extends FilterParams> {
  // Données
  data: T[];
  totalCount: number;
  
  // État de chargement
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  totalPages: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // Filtres
  filters: Partial<F>;
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void;
  setFilters: (filters: Partial<F>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  
  // Actions
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook pour gérer une liste paginée avec filtres
 */
export function useListData<T, F extends FilterParams = FilterParams>({
  fetchFn,
  initialFilters = {},
  pageSize = 20,
  autoLoad = true,
  deps = [],
}: UseListDataOptions<T, F>): UseListDataReturn<T, F> {
  // État des données
  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // État de chargement
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  
  // État de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  
  // État des filtres
  const [filters, setFiltersState] = useState<Partial<F>>(initialFilters);

  /**
   * Fonction de chargement des données
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters,
        page: currentPage,
        page_size: pageSize,
      } as F & { page: number; page_size: number };

      const response = await fetchFn(params);

      setData(response.results || []);
      setTotalCount(response.count || 0);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      console.error('useListData error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, filters, currentPage, pageSize]);

  /**
   * Charger les données au montage et quand les dépendances changent
   */
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [loadData, ...deps]);

  /**
   * Calculer le nombre total de pages
   */
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  /**
   * Vérifier si des filtres sont actifs
   */
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  }, [filters]);

  /**
   * Changer de page
   */
  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  /**
   * Page suivante
   */
  const nextPage = useCallback(() => {
    if (hasNext) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNext]);

  /**
   * Page précédente
   */
  const previousPage = useCallback(() => {
    if (hasPrevious) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPrevious]);

  /**
   * Définir un filtre unique
   */
  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset à la première page lors d'un changement de filtre
  }, []);

  /**
   * Définir plusieurs filtres
   */
  const setFilters = useCallback((newFilters: Partial<F>) => {
    setFiltersState(newFilters);
    setCurrentPage(1);
  }, []);

  /**
   * Réinitialiser les filtres
   */
  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
    setCurrentPage(1);
  }, [initialFilters]);

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
    // Données
    data,
    totalCount,
    
    // État
    loading,
    error,
    
    // Pagination
    currentPage,
    pageSize,
    hasNext,
    hasPrevious,
    totalPages,
    setPage,
    nextPage,
    previousPage,
    
    // Filtres
    filters,
    setFilter,
    setFilters,
    resetFilters,
    hasActiveFilters,
    
    // Actions
    reload,
    refresh,
  };
}
