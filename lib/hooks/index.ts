/**
 * Export centralisé des hooks personnalisés
 */

export * from "./use-zod-form";
export * from "./use-permissions";
export * from "./use-attendance-permissions";
export * from "./use-auth";
export * from "./use-mobile";
export * from "./use-notifications";
export * from "./use-sse";

// Hooks de gestion de données
export * from "./use-list-data";
export * from "./use-detail-data";
export * from "./use-crud-actions";

// Hook de formulaire générique
export * from "./use-entity-form";

// Hooks PDF unifiés
export * from "./usePDF";

// Ré-export des endpoints PDF pour faciliter l'utilisation
export { PDFEndpoints } from '../services/pdf.service';

// Hooks offline et PWA
export * from './useOnlineStatus';
export * from './useSyncStatus';
export * from './useServiceWorker';
