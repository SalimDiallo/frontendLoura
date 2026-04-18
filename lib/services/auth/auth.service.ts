/**
 * Service d'authentification unifié
 * ===================================
 * Un seul service pour Admin et Employee.
 * Le backend retourne user_type pour la redirection.
 */

import { apiClient, tokenManager } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { cacheManager } from '@/lib/offline';
import { useAuthStore, usePermissionsStore, User } from '@/lib/store';

// TTL pour les données d'authentification
const CACHE_TTL = {
  CURRENT_USER: 2 * 60 * 1000, // 2 minutes pour l'utilisateur courant
};

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
  date_of_birth?: string,
  address?:string,
  is_active: boolean;
  city?: string;
  postal_code?: string;
  country?: string;
  nationality?: string;
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  contract?: {
    id: string;
    name: string;
    type?: string;
    start_date?: string;
    end_date?: string;
  };
  hire_date?: string;
  termination_date?: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    user_type: "admin" | "employee";
  };
  role?: { id: string; name: string };
  created_at: string;
  // Fields spécifiques Admin
  organizations?: Array<{
    id: string;
    name: string;
    subdomain: string;
    logo_url?: string;
    is_active: boolean;
    settings: {
      currency?: string;
      country?: string;
    };
  }>;
  // Fields spécifiques Employee
  employee_id?: string;
  organization?: {
    id: string;
    name: string;
    subdomain: string;
    logo_url?: string;
    settings: {
      currency?: string;
      country?: string;
    };
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

    if (response.access && response.refresh && response) {
      tokenManager.setTokens(response.access, response.refresh);
      tokenManager.saveUser({ ...response.user, userType: response.user_type });
      useAuthStore.getState().setUser(response?.user as User, response.user_type);
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
      useAuthStore.getState().setUser(response.user as User, response.user_type);

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

      // Déclencher le warmup offline-first
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loura:login'));
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
    const response = await cacheManager.get<UnifiedUser>(
      API_ENDPOINTS.AUTH.ME,
      { ttl: CACHE_TTL.CURRENT_USER }
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
    const response = await cacheManager.patch<{ user: UnifiedUser; message: string }>(
      API_ENDPOINTS.AUTH.UPDATE_PROFILE,
      data,
      {
        invalidateCache: [API_ENDPOINTS.AUTH.ME],
        requiresOnline: true, // Mise à jour de profil nécessite une connexion
      }
    );

    const storedUser = tokenManager.getUser();
    const userType = storedUser?.userType || 'admin';

    tokenManager.saveUser({ ...response.user, userType });
    useAuthStore.getState().setUser(response.user as User, userType);

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

  // ============================================================================
  // MULTI-ORGANIZATION ENDPOINTS
  // ============================================================================

  /**
   * Liste des organisations d'un employé
   */
  async getMyOrganizations(): Promise<{
    organizations: Array<{
      id: string;
      name: string;
      subdomain: string;
      logo_url?: string;
      is_active: boolean;
      is_primary: boolean;
      employment_status: string;
      hire_date?: string;
      department?: { id: string; name: string };
      position?: { id: string; title: string };
      assigned_role?: { id: string; code: string; name: string };
    }>;
    count: number;
  }> {
    const response = await apiClient.get<{
      organizations: Array<{
        id: string;
        name: string;
        subdomain: string;
        logo_url?: string;
        is_active: boolean;
        is_primary: boolean;
        employment_status: string;
        hire_date?: string;
        department?: { id: string; name: string };
        position?: { id: string; title: string };
        assigned_role?: { id: string; code: string; name: string };
      }>;
      count: number;
    }>(API_ENDPOINTS.AUTH.MY_ORGANIZATIONS);

    return response;
  },

  /**
   * Sélectionner une organisation (après login ou acceptation d'invitation)
   */
  async selectOrganization(organizationId: string): Promise<AuthResponse> {
    const response = await apiClient.post<{
      message: string;
      organization: any;
      access: string;
      refresh: string;
    }>(
      API_ENDPOINTS.AUTH.SELECT_ORGANIZATION,
      { organization_id: organizationId }
    );

    // Mettre à jour les tokens
    if (response.access && response.refresh) {
      tokenManager.setTokens(response.access, response.refresh);

      // Mettre à jour le slug d'organisation
      if (response.organization?.subdomain) {
        localStorage.setItem('current_organization_slug', response.organization.subdomain);
      }

      // Recharger l'utilisateur complet avec les nouveaux JWT
      try {
        const user = await this.getCurrentUser();

        // Retourner une AuthResponse compatible
        return {
          user,
          user_type: user.user_type,
          access: response.access,
          refresh: response.refresh,
          message: response.message,
        } as AuthResponse;
      } catch (error) {
        console.error('Error reloading user after organization selection:', error);
        throw error;
      }
    }

    throw new Error('Invalid response from server');
  },

  /**
   * Changer d'organisation en cours de session
   */
  async switchOrganization(organizationId: string): Promise<AuthResponse> {
    const switchResponse = await apiClient.post<{
      message: string;
      organization: any;
      access: string;
      refresh: string;
    }>(
      API_ENDPOINTS.AUTH.SWITCH_ORGANIZATION,
      { organization_id: organizationId }
    );

    // Mettre à jour les tokens
    if (switchResponse.access && switchResponse.refresh) {
      tokenManager.setTokens(switchResponse.access, switchResponse.refresh);

      // Mettre à jour le slug d'organisation
      if (switchResponse.organization?.subdomain) {
        localStorage.setItem('current_organization_slug', switchResponse.organization.subdomain);
      }

      // Invalider le cache pour recharger les données de la nouvelle organisation
      await cacheManager.clearAllCache();

      // Recharger l'utilisateur complet avec les nouveaux JWT (en bypassant le cache)
      try {
        const user = await apiClient.get<UnifiedUser>(API_ENDPOINTS.AUTH.ME);

        // Mettre à jour les stores
        tokenManager.saveUser({ ...user, userType: user.user_type });
        useAuthStore.getState().setUser(user, user.user_type);

        // Si Employee, charger les permissions
        if (user.user_type === 'employee' && user.permissions) {
          usePermissionsStore.getState().setPermissions(user.permissions);
        }

        // Retourner une AuthResponse compatible
        return {
          user,
          user_type: user.user_type,
          access: switchResponse.access,
          refresh: switchResponse.refresh,
          message: switchResponse.message,
        } as AuthResponse;
      } catch (error) {
        console.error('Error reloading user after organization switch:', error);
        throw error;
      }
    }

    throw new Error('Invalid response from server');
  },
};


// Re-export types for compatibility
export type { AuthResponse as EmployeeAuthResponse, LoginCredentials as EmployeeLoginCredentials };
export type CurrentUser = UnifiedUser | null;
