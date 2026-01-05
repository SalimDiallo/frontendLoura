/**
 * Client API avec gestion des tokens JWT
 */

import { API_CONFIG, STORAGE_KEYS, API_ENDPOINTS } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Gestionnaire de tokens
 */
export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setTokens: (access: string, refresh: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  saveUser: (user: any): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: (): any => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
};

/**
 * Options de requête
 */
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Client API
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Méthode générique pour effectuer des requêtes
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, headers = {}, ...restOptions } = options;

    // Construction des headers
    const requestHeaders: Record<string, string> = {
      ...API_CONFIG.headers,
      ...(headers as Record<string, string>),
    };

    // Ajout du token d'authentification si nécessaire
    if (requiresAuth) {
      const token = tokenManager.getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Configuration de la requête
    const config: RequestInit = {
      ...restOptions,
      headers: requestHeaders,
    };

    try {
      // Ajouter organization_subdomain aux query params si disponible
      let url = `${this.baseURL}${endpoint}`;

      // Ne pas ajouter organization_subdomain pour les endpoints d'auth
      const isAuthEndpoint = endpoint.includes('/auth/') || endpoint.includes('/login') || endpoint.includes('/register');

      if (!isAuthEndpoint && typeof window !== 'undefined') {
        // Récupérer le slug depuis localStorage directement
        const orgSlug = localStorage.getItem('current_organization_slug');

        // Only append if not already present in queryString
        if (orgSlug && !url.includes('organization_subdomain=')) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}organization_subdomain=${orgSlug}`;
          console.log('[API Client] Added organization_subdomain to URL:', url);
        } else if (!orgSlug) {
          // console.warn('[API Client] No organization slug found in localStorage');
        }
      }

      const response = await fetch(url, config);

      // Gestion des erreurs HTTP
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        // Si erreur 401, le token est peut-être expiré
        if (response.status === 401 && requiresAuth) {
          // Tentative de rafraîchissement du token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Réessayer la requête originale
            return this.request<T>(endpoint, options);
          } else {
            // Impossible de rafraîchir, déconnexion
            // Déterminer le type d'utilisateur pour rediriger vers la bonne page de login
            const user = tokenManager.getUser();
            const userType = user?.userType || 'admin';
            const loginPath = userType === 'employee' ? '/auth/employee' : '/auth/admin';

            tokenManager.clearTokens();

            // Ne rediriger que si on est côté client
            if (typeof window !== 'undefined') {
              window.location.href = loginPath;
            }

            throw new ApiError('Session expirée', response.status, errorData);
          }
        }

        throw new ApiError(
          errorData.message || errorData.detail || 'Une erreur est survenue',
          response.status,
          errorData
        );
      }

      // Retour vide pour les 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      // Parse et retour du JSON
      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Erreur réseau',
        0
      );
    }
  }

  /**
   * Rafraîchissement du token
   */
  private async refreshToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      // Utiliser l'endpoint de refresh unifié
      const refreshEndpoint = API_ENDPOINTS.AUTH.REFRESH;

      const response = await fetch(`${this.baseURL}${refreshEndpoint}`, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      tokenManager.setTokens(data.access, data.refresh);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

// Instance du client API
export const apiClient = new ApiClient(API_CONFIG.baseURL);
