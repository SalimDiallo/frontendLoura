/**
 * Service de base abstrait pour les opérations CRUD
 * Facilite la création de nouveaux services avec des méthodes standardisées
 * 
 * @template T - Type de l'entité
 * @template TCreate - Type pour la création
 * @template TUpdate - Type pour la mise à jour
 * @template TFilters - Type pour les filtres
 */

import { apiClient } from './client';
import type { PaginatedResponse, FilterParams } from '@/lib/types/shared';

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
    return apiClient.get<PaginatedResponse<T>>(endpoint);
  }

  /**
   * Récupère une entité par son ID
   */
  async getById(id: string): Promise<T> {
    return apiClient.get<T>(this.endpoints.DETAIL(id));
  }

  /**
   * Crée une nouvelle entité
   */
  async create(data: TCreate): Promise<T> {
    return apiClient.post<T>(this.endpoints.CREATE, data);
  }

  /**
   * Met à jour une entité existante
   */
  async update(id: string, data: TUpdate): Promise<T> {
    return apiClient.patch<T>(this.endpoints.UPDATE(id), data);
  }

  /**
   * Supprime une entité
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(this.endpoints.DELETE(id));
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
    return apiClient.post<T>(this.endpoints.ACTIVATE(id));
  }

  /**
   * Désactive une entité
   */
  async deactivate(id: string): Promise<T> {
    return apiClient.post<T>(this.endpoints.DEACTIVATE(id));
  }

  /**
   * Bascule l'état d'activation
   */
  async toggleActive(id: string, currentState: boolean): Promise<T> {
    return currentState ? this.deactivate(id) : this.activate(id);
  }
}
