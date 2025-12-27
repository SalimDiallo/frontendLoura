/**
 * Export centralisé de tous les services
 * 
 * Usage recommandé:
 * import { authService, employeeAuthService } from '@/lib/services';
 * import { employeeService, departmentService } from '@/lib/services/hr';
 */

// Services d'authentification
export * from './auth';

// Services Core (organisations, catégories)
export * from './core';

// Services HR (employés, départements, congés, paie, etc.)
export * from './hr';

// Services Inventory (produits, stocks, mouvements, etc.)
export * from './inventory';

