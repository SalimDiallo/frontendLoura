/**
 * Service de base abstrait pour les opérations CRUD
 * Facilite la création de nouveaux services avec des méthodes standardisées
 *
 * @template T - Type de l'entité
 * @template TCreate - Type pour la création
 * @template TUpdate - Type pour la mise à jour
 * @template TFilters - Type pour les filtres
 */

import type { FilterParams, PaginatedResponse } from '@/lib/types/shared';
import { cacheManager } from '@/lib/offline';

// Configuration du cache pour BaseService
const CACHE_TTL = {
  LIST: 5 * 60 * 1000,    // 5 minutes pour les listes
  DETAIL: 10 * 60 * 1000, // 10 minutes pour les détails
};

/**
 * Configuration d'un endpoint CRUD
 */
export interface CrudEndpoints {
  LIST: string;
  CREATE: string;
  DETAIL: (id: string) => string;
  UPDATE: (id: string) => string;
  DELETE: (id: string) => string;
}

/**
 * Options pour les requêtes de liste
 */
export type ListOptions = FilterParams;

/**
 * Classe de base pour les services CRUD
 */
export abstract class BaseService<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  TFilters extends FilterParams = FilterParams
> {
  protected abstract readonly endpoints: CrudEndpoints;

  /**
   * Récupère une liste paginée d'entités
   */
  async list(filters?: TFilters): Promise<PaginatedResponse<T>> {
    const queryParams = this.buildQueryParams(filters);
    const endpoint = queryParams
      ? `${this.endpoints.LIST}?${queryParams}`
      : this.endpoints.LIST;
    return cacheManager.get<PaginatedResponse<T>>(endpoint, { ttl: CACHE_TTL.LIST });
  }

  /**
   * Récupère une entité par son ID
   */
  async getById(id: string): Promise<T> {
    return cacheManager.get<T>(this.endpoints.DETAIL(id), { ttl: CACHE_TTL.DETAIL });
  }

  /**
   * Crée une nouvelle entité
   */
  async create(data: TCreate): Promise<T> {
    return cacheManager.post<T>(this.endpoints.CREATE, data, {
      invalidateCache: [this.endpoints.LIST],
    });
  }

  /**
   * Met à jour une entité existante
   */
  async update(id: string, data: TUpdate): Promise<T> {
    return cacheManager.patch<T>(this.endpoints.UPDATE(id), data, {
      invalidateCache: [this.endpoints.LIST, this.endpoints.DETAIL(id)],
    });
  }

  /**
   * Supprime une entité
   */
  async delete(id: string): Promise<void> {
    return cacheManager.delete(this.endpoints.DELETE(id), {
      invalidateCache: [this.endpoints.LIST, this.endpoints.DETAIL(id)],
    });
  }

  /**
   * Récupère tous les résultats (sans pagination) - helper pratique
   */
  async getAll(filters?: TFilters): Promise<T[]> {
    const response = await this.list(filters);
    return response.results || [];
  }

  /**
   * Construit les paramètres de requête à partir des filtres
   */
  protected buildQueryParams(filters?: TFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return params.toString();
  }
}

/**
 * Mixin pour ajouter des fonctionnalités d'activation/désactivation
 */
export interface ActivatableEndpoints extends CrudEndpoints {
  ACTIVATE: (id: string) => string;
  DEACTIVATE: (id: string) => string;
}

/**
 * Interface pour les entités activables
 */
export interface Activatable {
  is_active: boolean;
}

/**
 * Service avec fonctionnalités d'activation
 */
export abstract class ActivatableService<
  T extends Activatable,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  TFilters extends FilterParams = FilterParams
> extends BaseService<T, TCreate, TUpdate, TFilters> {
  protected abstract readonly endpoints: ActivatableEndpoints;

  /**
   * Active une entité
   */
  async activate(id: string): Promise<T> {
    return cacheManager.post<T>(this.endpoints.ACTIVATE(id), undefined, {
      invalidateCache: [this.endpoints.LIST, this.endpoints.DETAIL(id)],
    });
  }

  /**
   * Désactive une entité
   */
  async deactivate(id: string): Promise<T> {
    return cacheManager.post<T>(this.endpoints.DEACTIVATE(id), undefined, {
      invalidateCache: [this.endpoints.LIST, this.endpoints.DETAIL(id)],
    });
  }

  /**
   * Bascule l'état d'activation
   */
  async toggleActive(id: string, currentState: boolean): Promise<T> {
    return currentState ? this.deactivate(id) : this.activate(id);
  }
}
