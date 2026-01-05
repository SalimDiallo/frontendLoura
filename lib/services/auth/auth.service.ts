/**
 * Service d'authentification unifié - Admin (Core) et Employee (HR)
 */

import { apiClient, tokenManager } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { useAuthStore, usePermissionsStore } from '@/lib/store';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  AdminUser,
} from '@/lib/types/core';
import type { Employee } from '@/lib/types/hr';

// ============================================================================
// Types pour l'authentification Employee
// ============================================================================

/**
 * Type pour les credentials de connexion employee
 */
export interface EmployeeLoginCredentials {
  email: string;
  password: string;
}

/**
 * Type pour la réponse d'authentification employee
 */
export interface EmployeeAuthResponse {
  employee: Employee;
  access: string;
  refresh: string;
  message: string;
}

/**
 * Type pour le changement de mot de passe
 */
export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export type CurrentUser = AdminUser | Employee | null;

// ============================================================================
// Service d'authentification Admin (Core)
// ============================================================================

export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.CORE.AUTH.REGISTER,
      data,
      { requiresAuth: false }
    );

    // Sauvegarder les tokens et l'utilisateur
    if (response.access && response.refresh) {
      tokenManager.setTokens(response.access, response.refresh);
      tokenManager.saveUser(response.user);

      // Mettre à jour le store Zustand
      useAuthStore.getState().setUser(response.user, 'admin');
    }

    return response;
  },

  /**
   * Connexion d'un utilisateur
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.CORE.AUTH.LOGIN,
      credentials,
      { requiresAuth: false }
    );

    // Sauvegarder les tokens et l'utilisateur
    if (response.access && response.refresh) {
      tokenManager.setTokens(response.access, response.refresh);
      tokenManager.saveUser(response.user);

      // Mettre à jour le store Zustand
      useAuthStore.getState().setUser(response.user, 'admin');
    }

    return response;
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.CORE.AUTH.LOGOUT, {
        refresh: tokenManager.getRefreshToken(),
      });
    } catch (error) {
      // Continuer même si l'API échoue
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Toujours nettoyer les tokens locaux
      tokenManager.clearTokens();

      // Nettoyer les stores Zustand
      useAuthStore.getState().clearUser();
    }
  },

  /**
   * Récupérer les informations de l'utilisateur connecté
   */
  async getCurrentUser(): Promise<CurrentUser> {
    
    const response = await apiClient.get<{user: CurrentUser}>(API_ENDPOINTS.CORE.AUTH.ME);
    tokenManager.saveUser(response.user);

    // Synchroniser avec le store Zustand
    useAuthStore.getState().setUser(response.user, 'admin');

    return response.user;
  },

  /**
   * Mettre à jour le profil de l'utilisateur
   */
  async updateProfile(data: { first_name?: string; last_name?: string }): Promise<AdminUser> {
    const response = await apiClient.patch<{ user: AdminUser; message: string }>(
      API_ENDPOINTS.CORE.AUTH.UPDATE_PROFILE,
      data
    );
    
    tokenManager.saveUser(response.user);
    useAuthStore.getState().setUser(response.user, 'admin');
    
    return response.user;
  },

  /**
   * Changer le mot de passe
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.CORE.AUTH.CHANGE_PASSWORD,
      data
    );
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  },

  /**
   * Récupérer l'utilisateur depuis le localStorage
   */
  getStoredUser(): AdminUser | null {
    return tokenManager.getUser();
  },
};

// ============================================================================
// Service d'authentification Employee (HR)
// ============================================================================

export const employeeAuthService = {
  /**
   * Connexion d'un employé
   */
  async login(credentials: EmployeeLoginCredentials): Promise<EmployeeAuthResponse> {
    const response = await apiClient.post<EmployeeAuthResponse>(
      API_ENDPOINTS.HR.AUTH.LOGIN,
      credentials,
      { requiresAuth: false }
    );

    // Sauvegarder les tokens et l'employé
    if (response.access && response.refresh) {
      tokenManager.setTokens(response.access, response.refresh);
      tokenManager.saveUser({ ...response.employee, userType: 'employee' });

      // Mettre à jour le store Zustand
      useAuthStore.getState().setUser(response.employee, 'employee');

      // Mettre à jour les permissions de l'employé (combinaison rôle + custom)
      if (response.employee.role) {
        usePermissionsStore.getState().setRole(response.employee.role);
      }

      // Stocker toutes les permissions (all_permissions contient rôle + custom)
      const allPermissions = response.employee.all_permissions || [];
      usePermissionsStore.getState().setPermissions(allPermissions);
    }

    console.log(response);

    return response;
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.HR.AUTH.LOGOUT, {
        refresh: tokenManager.getRefreshToken(),
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      tokenManager.clearTokens();

      // Nettoyer les stores Zustand
      useAuthStore.getState().clearUser();
      usePermissionsStore.getState().clearPermissions();
    }
  },

  /**
   * Récupérer les informations de l'employé connecté
   */
  async getCurrentEmployee(): Promise<Employee> {
    const response = await apiClient.get<Employee>(API_ENDPOINTS.HR.AUTH.ME);
    tokenManager.saveUser({ ...response, userType: 'employee' });

    // Synchroniser avec les stores Zustand
    useAuthStore.getState().setUser(response, 'employee');

    // Mettre à jour les permissions (combinaison rôle + custom)
    if (response.role) {
      usePermissionsStore.getState().setRole(response.role);
    }

    // Stocker toutes les permissions (all_permissions contient rôle + custom)
    const allPermissions = response.all_permissions || [];
    usePermissionsStore.getState().setPermissions(allPermissions);

    return response;
  },

  /**
   * Mettre à jour le profil de l'employé
   */
  async updateProfile(data: { phone?: string; address?: string; emergency_contact?: string; emergency_phone?: string }): Promise<Employee> {
    const response = await apiClient.patch<{ employee: Employee; message: string }>(
      API_ENDPOINTS.HR.AUTH.UPDATE_PROFILE,
      data
    );
    
    tokenManager.saveUser({ ...response.employee, userType: 'employee' });
    useAuthStore.getState().setUser(response.employee, 'employee');
    
    return response.employee;
  },

  /**
   * Changer le mot de passe
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.HR.AUTH.CHANGE_PASSWORD,
      data
    );
  },

  /**
   * Vérifier si l'utilisateur est authentifié en tant qu'employé
   */
  isAuthenticated(): boolean {
    const user = tokenManager.getUser();
    return !!tokenManager.getAccessToken() && user?.userType === 'employee';
  },

  /**
   * Récupérer l'employé depuis le localStorage
   */
  getStoredEmployee(): Employee | null {
    const user = tokenManager.getUser();
    if (user && user.userType === 'employee') {
      return user as Employee;
    }
    return null;
  },
};
