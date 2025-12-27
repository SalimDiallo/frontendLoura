/**
 * Service de gestion des erreurs
 * Centralise la gestion et le formatage des erreurs
 */

import { ApiError } from '../api/client';

/**
 * Type d'erreur applicative
 */
export type ErrorType = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'server'
  | 'unknown';

/**
 * Interface pour une erreur formatée
 */
export interface FormattedError {
  type: ErrorType;
  message: string;
  details?: Record<string, string[]>;
  originalError?: unknown;
}

/**
 * Messages d'erreur par défaut
 */
const DEFAULT_ERROR_MESSAGES: Record<ErrorType, string> = {
  network: 'Erreur de connexion. Vérifiez votre connexion internet.',
  authentication: 'Session expirée. Veuillez vous reconnecter.',
  authorization: "Vous n'avez pas les droits nécessaires pour cette action.",
  validation: 'Données invalides. Veuillez vérifier les informations saisies.',
  not_found: 'La ressource demandée est introuvable.',
  conflict: 'Un conflit est survenu. La ressource existe peut-être déjà.',
  server: 'Erreur serveur. Veuillez réessayer plus tard.',
  unknown: 'Une erreur inattendue est survenue.',
};

/**
 * Détermine le type d'erreur à partir du code HTTP
 */
function getErrorTypeFromStatus(status: number): ErrorType {
  if (status === 0) return 'network';
  if (status === 401) return 'authentication';
  if (status === 403) return 'authorization';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 422 || status === 400) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * Formate une erreur pour l'affichage
 */
export function formatError(error: unknown): FormattedError {
  // Erreur API personnalisée
  if (error instanceof ApiError) {
    const type = getErrorTypeFromStatus(error.status);
    
    return {
      type,
      message: error.message || DEFAULT_ERROR_MESSAGES[type],
      details: error.data?.errors,
      originalError: error,
    };
  }

  // Erreur standard
  if (error instanceof Error) {
    // Erreur réseau
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: 'network',
        message: DEFAULT_ERROR_MESSAGES.network,
        originalError: error,
      };
    }

    return {
      type: 'unknown',
      message: error.message || DEFAULT_ERROR_MESSAGES.unknown,
      originalError: error,
    };
  }

  // Erreur sous forme de string
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
    };
  }

  // Erreur inconnue
  return {
    type: 'unknown',
    message: DEFAULT_ERROR_MESSAGES.unknown,
    originalError: error,
  };
}

/**
 * Extrait les messages d'erreur de validation
 */
export function extractValidationErrors(
  details?: Record<string, string[]>
): string[] {
  if (!details) return [];
  
  return Object.entries(details).flatMap(([field, messages]) =>
    messages.map((msg) => `${field}: ${msg}`)
  );
}

/**
 * Vérifie si une erreur est une erreur d'authentification
 */
export function isAuthenticationError(error: unknown): boolean {
  return formatError(error).type === 'authentication';
}

/**
 * Vérifie si une erreur est une erreur d'autorisation
 */
export function isAuthorizationError(error: unknown): boolean {
  return formatError(error).type === 'authorization';
}

/**
 * Vérifie si une erreur est une erreur réseau
 */
export function isNetworkError(error: unknown): boolean {
  return formatError(error).type === 'network';
}

/**
 * Log une erreur de manière standardisée (pour le développement)
 */
export function logError(error: unknown, context?: string): void {
  const formatted = formatError(error);
  
  console.error(`[${formatted.type.toUpperCase()}]${context ? ` ${context}:` : ''}`, {
    message: formatted.message,
    details: formatted.details,
    originalError: formatted.originalError,
  });
}
