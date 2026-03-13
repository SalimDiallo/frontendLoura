export * from './hr';
export * from './inventory';

import { HR_MODULES, HR_PERMISSIONS } from './hr';
import { INVENTORY_MODULES, INVENTORY_PERMISSIONS } from './inventory';

/**
 * Aggregated Permissions Object
 * This serves as the single source of truth while keeping definitions modular.
 */
export const COMMON_PERMISSIONS = {
  HR: HR_PERMISSIONS,
  INVENTORY: INVENTORY_PERMISSIONS,
} as const;

export const COMMON_MODULES = {
  HR: HR_MODULES,
  INVENTORY: INVENTORY_MODULES,
} as const;
