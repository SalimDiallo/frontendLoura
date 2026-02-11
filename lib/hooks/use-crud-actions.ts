/**
 * Hook générique pour les actions CRUD (Create, Read, Update, Delete)
 * Fournit une interface standardisée pour les opérations courantes
 */

import { useState, useCallback } from 'react';
import type { BaseService } from '@/lib/api/base-service';

/**
 * Configuration du hook
 */
export interface UseCrudActionsOptions<T> {
  /**
   * Service à utiliser pour les opérations CRUD
   */
  service: BaseService<T, any, any, any>;

  /**
   * Callback appelé après une création réussie
   */
  onCreateSuccess?: (data: T) => void;

  /**
   * Callback appelé après une mise à jour réussie
   */
  onUpdateSuccess?: (data: T) => void;

  /**
   * Callback appelé après une suppression réussie
   */
  onDeleteSuccess?: () => void;

  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Error, action: 'create' | 'update' | 'delete') => void;
}

/**
 * État retourné par le hook
 */
export interface UseCrudActionsReturn<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  /** Créer un nouvel élément */
  create: (data: TCreate) => Promise<T | null>;
  
  /** Mettre à jour un élément */
  update: (id: string, data: TUpdate) => Promise<T | null>;
  
  /** Supprimer un élément */
  remove: (id: string) => Promise<boolean>;
  
  /** État de chargement global */
  loading: boolean;
  
  /** État de chargement par action */
  loadingStates: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  
  /** Erreur globale */
  error: string | null;
  
  /** Erreurs par action */
  errors: {
    create: string | null;
    update: string | null;
    delete: string | null;
  };
  
  /** Réinitialiser les erreurs */
  clearErrors: () => void;
}

/**
 * Hook pour gérer les actions CRUD
 */
export function useCrudActions<T, TCreate = Partial<T>, TUpdate = Partial<T>>({
  service,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
  onError,
}: UseCrudActionsOptions<T>): UseCrudActionsReturn<T, TCreate, TUpdate> {
  // États de chargement
  const [loadingStates, setLoadingStates] = useState({
    create: false,
    update: false,
    delete: false,
  });

  // États d'erreur
  const [errors, setErrors] = useState<{
    create: string | null;
    update: string | null;
    delete: string | null;
  }>({
    create: null,
    update: null,
    delete: null,
  });

  /**
   * Calculer l'état de chargement global
   */
  const loading = loadingStates.create || loadingStates.update || loadingStates.delete;

  /**
   * Calculer l'erreur globale
   */
  const error = errors.create || errors.update || errors.delete;

  /**
   * Créer un nouvel élément
   */
  const create = useCallback(async (data: TCreate): Promise<T | null> => {
    try {
      setLoadingStates((prev) => ({ ...prev, create: true }));
      setErrors((prev) => ({ ...prev, create: null }));

      const result = await service.create(data);

      if (onCreateSuccess) {
        onCreateSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création';
      setErrors((prev) => ({ ...prev, create: errorMessage }));
      console.error('Create error:', err);

      if (onError && err instanceof Error) {
        onError(err, 'create');
      }

      return null;
    } finally {
      setLoadingStates((prev) => ({ ...prev, create: false }));
    }
  }, [service, onCreateSuccess, onError]);

  /**
   * Mettre à jour un élément
   */
  const update = useCallback(async (id: string, data: TUpdate): Promise<T | null> => {
    try {
      setLoadingStates((prev) => ({ ...prev, update: true }));
      setErrors((prev) => ({ ...prev, update: null }));

      const result = await service.update(id, data);

      if (onUpdateSuccess) {
        onUpdateSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setErrors((prev) => ({ ...prev, update: errorMessage }));
      console.error('Update error:', err);

      if (onError && err instanceof Error) {
        onError(err, 'update');
      }

      return null;
    } finally {
      setLoadingStates((prev) => ({ ...prev, update: false }));
    }
  }, [service, onUpdateSuccess, onError]);

  /**
   * Supprimer un élément
   */
  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoadingStates((prev) => ({ ...prev, delete: true }));
      setErrors((prev) => ({ ...prev, delete: null }));

      await service.delete(id);

      if (onDeleteSuccess) {
        onDeleteSuccess();
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setErrors((prev) => ({ ...prev, delete: errorMessage }));
      console.error('Delete error:', err);

      if (onError && err instanceof Error) {
        onError(err, 'delete');
      }

      return false;
    } finally {
      setLoadingStates((prev) => ({ ...prev, delete: false }));
    }
  }, [service, onDeleteSuccess, onError]);

  /**
   * Réinitialiser toutes les erreurs
   */
  const clearErrors = useCallback(() => {
    setErrors({
      create: null,
      update: null,
      delete: null,
    });
  }, []);

  return {
    create,
    update,
    remove,
    loading,
    loadingStates,
    error,
    errors,
    clearErrors,
  };
}
