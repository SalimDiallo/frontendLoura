/**
 * Service d'authentification unifié
 * ===================================
 * Un seul service pour Admin et Employee.
 * Le backend retourne user_type pour la redirection.
 */

import { apiClient, tokenManager } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { useAuthStore, usePermissionsStore } from '@/lib/store';
import type { AdminUser } from '@/lib/types/core';
import type { Employee } from '@/lib/types/hr';

// ============================================================================
// TYPES
// ============================================================================

/** Credentials de connexion (Admin ou Employee) */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Données d'inscription Admin + Organisation */
export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

/** Réponse d'authentification unifiée */
export interface AuthResponse {
  user: UnifiedUser;
  user_type: 'admin' | 'employee';
  access: string;
  refresh: string;
  message: string;
  organization?: {
    id: string;
    name: string;
    subdomain: string;
  };
}

/** Utilisateur unifié (Admin ou Employee) */
export interface UnifiedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  user_type: 'admin' | 'employee';
  is_active: boolean;
  created_at: string;
  // Fields spécifiques Admin
  organizations?: Array<{
    id: string;
    name: string;
    subdomain: string;
    logo_url?: string;
    is_active: boolean;
  }>;
  // Fields spécifiques Employee
  employee_id?: string;
  organization?: {
    id: string;
    name: string;
    subdomain: string;
    logo_url?: string;
  };
  organization_subdomain?: string; // Compatibilité ancien format
  department?: { id: string; name: string };
  position?: { id: string; title: string };
  employment_status?: string;
  permissions?: string[];
}

/** Données pour changement de mot de passe */
export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

// ============================================================================
// SERVICE D'AUTHENTIFICATION UNIFIÉ
// ============================================================================

export const authService = {
  /**
   * Inscription Admin + Organisation
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data,
      { requiresAuth: false }
    );

    if (response.access && response.refresh) {
      tokenManager.setTokens(response.access, response.refresh);
      tokenManager.saveUser({ ...response.user, userType: response.user_type });
      useAuthStore.getState().setUser(response.user, response.user_type);
    }

    return response;
  },

  /**
   * Connexion unifiée (Admin ou Employee)
   * Le backend détermine le type via l'email
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      { requiresAuth: false }
    );

    if (response.access && response.refresh) {
      tokenManager.setTokens(response.access, response.refresh);
      tokenManager.saveUser({ ...response.user, userType: response.user_type });
      
      // Mettre à jour le store Zustand
      useAuthStore.getState().setUser(response.user, response.user_type);

      // Si Employee, charger les permissions
      if (response.user_type === 'employee' && response.user.permissions) {
        usePermissionsStore.getState().setPermissions(response.user.permissions);
      }

      // Stocker le slug de l'organisation pour les requêtes API
      if (response.user_type === 'employee' && response.user.organization) {
        localStorage.setItem('current_organization_slug', response.user.organization.subdomain);
      } else if (response.user_type === 'admin' && response.user.organizations?.[0]) {
        localStorage.setItem('current_organization_slug', response.user.organizations[0].subdomain);
      }
    }

    return response;
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
        refresh: tokenManager.getRefreshToken(),
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      tokenManager.clearTokens();
      localStorage.removeItem('current_organization_slug');
      useAuthStore.getState().clearUser();
      usePermissionsStore.getState().clearPermissions();
    }
  },

  /**
   * Récupérer l'utilisateur courant
   */
  async getCurrentUser(): Promise<UnifiedUser> {
    const response = await apiClient.get<UnifiedUser>(
      API_ENDPOINTS.AUTH.ME
    );
    
    tokenManager.saveUser({ ...response, userType: response.user_type });
    useAuthStore.getState().setUser(response, response.user_type);

    // Si Employee, charger les permissions
    if (response.user_type === 'employee' && response.permissions) {
      usePermissionsStore.getState().setPermissions(response.permissions);
    }

    return response;
  },

  /**
   * Mettre à jour le profil
   */
  async updateProfile(data: Partial<UnifiedUser>): Promise<UnifiedUser> {
    const response = await apiClient.patch<{ user: UnifiedUser; message: string }>(
      API_ENDPOINTS.AUTH.UPDATE_PROFILE,
      data
    );
    
    const storedUser = tokenManager.getUser();
    const userType = storedUser?.userType || 'admin';
    
    tokenManager.saveUser({ ...response.user, userType });
    useAuthStore.getState().setUser(response.user, userType);
    
    return response.user;
  },

  /**
   * Changer le mot de passe
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      data
    );
  },

  /**
   * Vérifier si authentifié
   */
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  },

  /**
   * Récupérer l'utilisateur stocké
   */
  getStoredUser(): UnifiedUser | null {
    return tokenManager.getUser();
  },

  /**
   * Récupérer le type d'utilisateur
   */
  getUserType(): 'admin' | 'employee' | null {
    const user = tokenManager.getUser();
    return user?.userType || null;
  },

  /**
   * Vérifier si l'utilisateur est Admin
   */
  isAdmin(): boolean {
    return this.getUserType() === 'admin';
  },

  /**
   * Vérifier si l'utilisateur est Employee
   */
  isEmployee(): boolean {
    return this.getUserType() === 'employee';
  },

  /**
   * Récupérer l'organisation courante
   */
  getCurrentOrganization() {
    const user = this.getStoredUser();
    if (!user) return null;

    if (user.user_type === 'employee' && user.organization) {
      return user.organization;
    }
    if (user.user_type === 'admin' && user.organizations?.[0]) {
      return user.organizations[0];
    }
    return null;
  },
};


// Re-export types for compatibility
export type { LoginCredentials as EmployeeLoginCredentials };
export type { AuthResponse as EmployeeAuthResponse };
export type CurrentUser = UnifiedUser | null;
