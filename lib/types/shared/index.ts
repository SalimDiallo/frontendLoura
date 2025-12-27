/**
 * Types partagés entre tous les modules
 * Ces types sont réutilisables et aident à maintenir la cohérence du code
 */

// Export permission types
export * from './permissions';

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Format standard des erreurs API
 */
export interface ApiErrorResponse {
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

/**
 * Format standard des réponses paginées
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Format de réponse simple avec message
 */
export interface MessageResponse {
  message: string;
  success?: boolean;
}

/**
 * Format de liste simple (sans pagination)
 */
export type ListResponse<T> = T[];

// ============================================================================
// FORM STATES
// ============================================================================

/**
 * État d'un formulaire
 */
export interface FormState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * État de soumission d'un formulaire
 */
export interface SubmitState<T = unknown> {
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: T | null;
}

// ============================================================================
// LOADING & DATA STATES
// ============================================================================

/**
 * États de chargement possibles
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * État générique pour les données async
 */
export interface DataState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}

/**
 * État générique pour les données avec actions
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isSuccess: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Crée un type Update à partir d'un type Create (tous les champs deviennent optionnels)
 * Utilisé pour éviter la duplication: `export interface XXXUpdate extends Partial<XXXCreate> {}`
 *
 * @example
 * ```typescript
 * // Avant:
 * export interface EmployeeUpdate extends Partial<EmployeeCreate> {}
 *
 * // Après:
 * export type EmployeeUpdate = UpdateOf<EmployeeCreate>;
 * ```
 */
export type UpdateOf<T> = Partial<T>;

/**
 * Rend certaines propriétés requises
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Rend certaines propriétés optionnelles
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type pour les fonctions de callback
 */
export type Callback<T = void> = () => T;

/**
 * Type pour les fonctions async de callback
 */
export type AsyncCallback<T = void> = () => Promise<T>;

/**
 * Type pour les handlers d'événements
 */
export type EventHandler<E = React.SyntheticEvent> = (event: E) => void;

/**
 * Type pour un identifiant (string ou number)
 */
export type ID = string | number;

/**
 * Type nullable
 */
export type Nullable<T> = T | null;

/**
 * Type pour les valeurs de select/dropdown
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * Type pour les paramètres de filtrage
 */
export interface FilterParams {
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Type pour les critères de tri
 */
export interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================================================
// ACTION TYPES (pour les reducers ou states)
// ============================================================================

/**
 * Type d'action CRUD standard
 */
export type CrudAction = 'create' | 'read' | 'update' | 'delete';

/**
 * État d'une modal
 */
export interface ModalState<T = unknown> {
  isOpen: boolean;
  mode: CrudAction | null;
  data: T | null;
}

/**
 * Type pour les confirmations
 */
export interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: Callback | null;
  onCancel?: Callback | null;
}

