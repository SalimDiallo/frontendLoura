/**
 * Service de gestion des organisations - Module Core
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, API_CONFIG } from '@/lib/api/config';
import type {
  Organization,
  OrganizationCreateData,
  OrganizationUpdateData,
} from '@/lib/types/core';

export const organizationService = {
  /**
   * Récupérer toutes les organisations de l'utilisateur
   */
  async getAll(): Promise<Organization[]> {
    const response = await apiClient.get<{ count: number; results: Organization[] }>(API_ENDPOINTS.CORE.ORGANIZATIONS.LIST);
    return response.results || [];
  },

  /**
   * Récupérer une organisation par son ID
   */
  async getById(id: string): Promise<Organization> {
    return apiClient.get<Organization>(API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id));
  },

  /**
   * Récupérer une organisation par son subdomain/slug
   */
  async getBySlug(slug: string): Promise<Organization | null> {
    const organizations = await this.getAll();
    return organizations.find((org) => org.subdomain.toLowerCase() === slug.toLowerCase()) || null;
  },

  /**
   * Créer une nouvelle organisation
   */
  async create(data: OrganizationCreateData): Promise<Organization> {
    return apiClient.post<Organization>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.CREATE,
      data
    );
  },

  /**
   * Mettre à jour une organisation (PATCH - partiel)
   */
  async update(
    id: string,
    data: OrganizationUpdateData
  ): Promise<Organization> {
    return apiClient.patch<Organization>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE(id),
      data
    );
  },

  /**
   * Mettre à jour une organisation (PUT - complet)
   */
  async replace(
    id: string,
    data: OrganizationCreateData
  ): Promise<Organization> {
    return apiClient.put<Organization>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE(id),
      data
    );
  },

  /**
   * Supprimer une organisation
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.CORE.ORGANIZATIONS.DELETE(id));
  },

  /**
   * Activer une organisation
   */
  async activate(id: string): Promise<{ message: string; organization: Organization }> {
    return apiClient.post(API_ENDPOINTS.CORE.ORGANIZATIONS.ACTIVATE(id));
  },

  /**
   * Désactiver une organisation
   */
  async deactivate(id: string): Promise<{ message: string; organization: Organization }> {
    return apiClient.post(API_ENDPOINTS.CORE.ORGANIZATIONS.DEACTIVATE(id));
  },

  /**
   * Uploader le logo d'une organisation
   */
  async uploadLogo(id: string, file: File): Promise<{ message: string; organization: Organization }> {
    const formData = new FormData();
    formData.append('logo', file);
    
    // Use fetch directly because apiClient does JSON.stringify which breaks FormData
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.CORE.ORGANIZATIONS.UPLOAD_LOGO(id)}`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur upload' }));
      throw new Error(error.error || error.message || 'Erreur lors de l\'upload');
    }
    
    return response.json();
  },

  /**
   * Supprimer le logo d'une organisation
   */
  async deleteLogo(id: string): Promise<{ message: string }> {
    return apiClient.delete(API_ENDPOINTS.CORE.ORGANIZATIONS.UPLOAD_LOGO(id));
  },
};
