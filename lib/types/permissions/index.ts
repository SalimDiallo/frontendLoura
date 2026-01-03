export * from './base';
export * from './hr';
export * from './inventory';

import { HR_PERMISSIONS } from './hr';
import { INVENTORY_PERMISSIONS } from './inventory';

/**
 * Aggregated Permissions Object
 * This serves as the single source of truth while keeping definitions modular.
 */
export const COMMON_PERMISSIONS = {
  HR: HR_PERMISSIONS,
  INVENTORY: INVENTORY_PERMISSIONS,
  // Add other modules here
} as const;
