/**
 * Store Zustand pour l'authentification
 * Gère l'état de l'utilisateur connecté (Admin ou Employee)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState, User, UserType } from './types';

/**
 * Store d'authentification
 * Persiste les données dans localStorage
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      userType: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user: User, type: UserType) => {
        set({
          user,
          userType: type,
          isAuthenticated: !!user,
        });
      },

      clearUser: () => {
        set({
          user: null,
          userType: null,
          isAuthenticated: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage', // Clé dans localStorage
      storage: createJSONStorage(() => localStorage),
      // Ne persister que les données essentielles
      partialize: (state) => ({
        user: state.user,
        userType: state.userType,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Selectors pour accéder facilement aux données
 */
export const authSelectors = {
  // Récupérer l'utilisateur
  getUser: (state: AuthState) => state.user,

  // Récupérer le type d'utilisateur
  getUserType: (state: AuthState) => state.userType,

  // Vérifier si authentifié
  isAuthenticated: (state: AuthState) => state.isAuthenticated,

  // Vérifier si c'est un admin
  isAdmin: (state: AuthState) => state.userType === 'admin',

  // Vérifier si c'est un employé
  isEmployee: (state: AuthState) => state.userType === 'employee',

  // Récupérer l'email
  getEmail: (state: AuthState) => state.user?.email || '',

  // Récupérer le nom complet
  getFullName: (state: AuthState) => {
    if (!state.user) return '';
    const { first_name, last_name } = state.user;
    return `${first_name || ''} ${last_name || ''}`.trim() || 'Utilisateur';
  },
};
