/**
 * Export centralisé des utilitaires
 */

// Classnames utility
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatters
export * from './formatters';

// Error handling
export * from './error-handler';

// Autres utils existants
export * from './attendance-permissions';
export * from './leave';
export * from './pdf-export';
