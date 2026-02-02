/**
 * Inventory Permissions - Codes must match backend database values
 * Backend format: `{module}.{action}_{resource}` (e.g., inventory.view_product)
 */

export const INVENTORY_PERMISSIONS = {
  // === CATEGORIES ===
  VIEW_CATEGORIES: 'inventory.view_categories',
  CREATE_CATEGORIES: 'inventory.create_categories',
  UPDATE_CATEGORIES: 'inventory.update_categories',
  DELETE_CATEGORIES: 'inventory.delete_categories',

  // === WAREHOUSES ===
  VIEW_WAREHOUSES: 'inventory.view_warehouses',
  CREATE_WAREHOUSES: 'inventory.create_warehouses',
  UPDATE_WAREHOUSES: 'inventory.update_warehouses',
  DELETE_WAREHOUSES: 'inventory.delete_warehouses',

  // === SUPPLIERS ===
  VIEW_SUPPLIERS: 'inventory.view_suppliers',
  CREATE_SUPPLIERS: 'inventory.create_suppliers',
  UPDATE_SUPPLIERS: 'inventory.update_suppliers',
  DELETE_SUPPLIERS: 'inventory.delete_suppliers',

  // === PRODUCTS ===
  VIEW_PRODUCTS: 'inventory.view_products',
  CREATE_PRODUCTS: 'inventory.create_products',
  UPDATE_PRODUCTS: 'inventory.update_products',
  DELETE_PRODUCTS: 'inventory.delete_products',

  // === STOCK ===
  VIEW_STOCK: 'inventory.view_stock',
  MANAGE_STOCK: 'inventory.manage_stock',
  ADJUST_STOCK: 'inventory.adjust_stock',

  // === MOVEMENTS ===
  VIEW_MOVEMENTS: 'inventory.view_movements',
  CREATE_MOVEMENTS: 'inventory.create_movements',
  UPDATE_MOVEMENTS: 'inventory.update_movements',
  DELETE_MOVEMENTS: 'inventory.delete_movements',

  // === ORDERS ===
  VIEW_ORDERS: 'inventory.view_orders',
  CREATE_ORDERS: 'inventory.create_orders',
  UPDATE_ORDERS: 'inventory.update_orders',
  DELETE_ORDERS: 'inventory.delete_orders',
  RECEIVE_ORDERS: 'inventory.receive_orders',

  // === STOCK COUNTS ===
  VIEW_STOCK_COUNTS: 'inventory.view_stock_counts',
  CREATE_STOCK_COUNTS: 'inventory.create_stock_counts',
  VALIDATE_STOCK_COUNTS: 'inventory.validate_stock_counts',

  // === SALES ===
  VIEW_SALES: 'inventory.view_sales',
  CREATE_SALES: 'inventory.create_sales',
  UPDATE_SALES: 'inventory.update_sales',
  DELETE_SALES: 'inventory.delete_sales',

  // === CUSTOMERS ===
  VIEW_CUSTOMERS: 'inventory.view_customers',
  CREATE_CUSTOMERS: 'inventory.create_customers',
  UPDATE_CUSTOMERS: 'inventory.update_customers',
  DELETE_CUSTOMERS: 'inventory.delete_customers',

  // === PAYMENTS ===
  VIEW_PAYMENTS: 'inventory.view_payments',
  CREATE_PAYMENTS: 'inventory.create_payments',

  // === REPORTS ===
  VIEW_REPORTS: 'inventory.view_reports',
  EXPORT_REPORTS: 'inventory.export_reports',
} as const;
