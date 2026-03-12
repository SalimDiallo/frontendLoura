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
// Note: categoryService is renamed to avoid conflict with inventory
export { categoryService as coreCategoryService } from './core/category.service';
export * from './core/organization.service';

// Services HR (employés, départements, congés, paie, etc.)
export * from './hr';

// Services Inventory (produits, stocks, mouvements, etc.)
// Note: categoryService is renamed to avoid conflict with core
export { categoryService as inventoryCategoryService } from './inventory/category.service';
export * from './inventory/warehouse.service';
export * from './inventory/supplier.service';
export * from './inventory/product.service';
export * from './inventory/movement.service';
export * from './inventory/order.service';
export * from './inventory/alert.service';
export * from './inventory/stock-count.service';
export * from './inventory/stats.service';
export * from './inventory/customer.service';
export * from './inventory/sales.service';
export * from './inventory/expense.service';
export * from './inventory/proforma.service';
export * from './inventory/delivery-note.service';
export * from './inventory/credit-sale.service';

// Services Notifications
export * from './notifications';

// Service PDF unifié
export * from './pdf.service';

