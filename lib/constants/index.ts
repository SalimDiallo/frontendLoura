/**
 * Constantes globales de l'application
 * Centralise toutes les constantes pour faciliter la maintenance
 */

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================================================
// DATES & TIME
// ============================================================================

export const DATE_FORMATS = {
  /** Format de date standard français */
  FR_DATE: 'dd/MM/yyyy',
  /** Format de date avec heure */
  FR_DATETIME: 'dd/MM/yyyy HH:mm',
  /** Format ISO */
  ISO: 'yyyy-MM-dd',
  /** Format pour les inputs date */
  INPUT_DATE: 'yyyy-MM-dd',
  /** Format pour les inputs datetime-local */
  INPUT_DATETIME: "yyyy-MM-dd'T'HH:mm",
} as const;

export const TIME_FORMATS = {
  /** Format 24h */
  H24: 'HH:mm',
  /** Format 24h avec secondes */
  H24_SECONDS: 'HH:mm:ss',
  /** Format 12h */
  H12: 'hh:mm a',
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
} as const;

// ============================================================================
// UI
// ============================================================================

export const UI = {
  /** Durée par défaut des toasts (ms) */
  TOAST_DURATION: 5000,
  /** Durée des animations (ms) */
  ANIMATION_DURATION: 200,
  /** Debounce pour la recherche (ms) */
  SEARCH_DEBOUNCE: 300,
  /** Délai avant affichage du loading (ms) */
  LOADING_DELAY: 200,
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebar_state',
  LANGUAGE: 'language',
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
  AUTH: {
    SELECTION: '/auth',
    ADMIN_LOGIN: '/auth/admin',
    EMPLOYEE_LOGIN: '/auth/employee',
    LOGOUT: '/auth/logout',
  },
  CORE: {
    DASHBOARD: '/core/dashboard',
    ORGANIZATIONS: '/core/dashboard/organizations',
    CATEGORIES: '/core/dashboard/categories',
    SETTINGS: '/core/dashboard/settings',
  },
  APPS: {
    HOME: '/apps',
    ORG: (slug: string) => `/apps/${slug}`,
    HR: {
      ROOT: (slug: string) => `/apps/${slug}/hr`,
      EMPLOYEES: (slug: string) => `/apps/${slug}/hr/employees`,
      DEPARTMENTS: (slug: string) => `/apps/${slug}/hr/departments`,
      ROLES: (slug: string) => `/apps/${slug}/hr/roles`,
      LEAVES: (slug: string) => `/apps/${slug}/hr/leaves`,
      PAYROLL: (slug: string) => `/apps/${slug}/hr/payroll`,
      ATTENDANCE: (slug: string) => `/apps/${slug}/hr/attendance`,
      CONTRACTS: (slug: string) => `/apps/${slug}/hr/contracts`,
    },
  },
} as const;

// ============================================================================
// BREAKPOINTS (correspondant à Tailwind)
// ============================================================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================================================
// COLORS (couleurs thématiques)
// ============================================================================

export const STATUS_COLORS = {
  success: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  warning: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
  error: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  info: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  default: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30',
} as const;
