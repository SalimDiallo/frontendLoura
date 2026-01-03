/**
 * Inventory Permissions - Codes must match backend database values
 * Backend format: `{module}.{action}_{resource}` (e.g., inventory.view_product)
 */

export const INVENTORY_PERMISSIONS = {
  // Products
  VIEW_PRODUCTS: 'inventory.view_product',
  CREATE_PRODUCTS: 'inventory.create_product',
  UPDATE_PRODUCTS: 'inventory.update_product',
  DELETE_PRODUCTS: 'inventory.delete_product',

  // Stock
  VIEW_STOCK: 'inventory.view_stock',
  MANAGE_STOCK: 'inventory.manage_stock',
  ADJUST_STOCK: 'inventory.adjust_stock',

  // Warehouses
  VIEW_WAREHOUSES: 'inventory.view_warehouse',
  CREATE_WAREHOUSES: 'inventory.create_warehouse',
  UPDATE_WAREHOUSES: 'inventory.update_warehouse',
  DELETE_WAREHOUSES: 'inventory.delete_warehouse',

  // Suppliers
  VIEW_SUPPLIERS: 'inventory.view_supplier',
  CREATE_SUPPLIERS: 'inventory.create_supplier',
  UPDATE_SUPPLIERS: 'inventory.update_supplier',
  DELETE_SUPPLIERS: 'inventory.delete_supplier',

  // Categories
  VIEW_CATEGORIES: 'inventory.view_category',
  CREATE_CATEGORIES: 'inventory.create_category',
  UPDATE_CATEGORIES: 'inventory.update_category',
  DELETE_CATEGORIES: 'inventory.delete_category',

  // Sales
  VIEW_SALES: 'inventory.view_sale',
  CREATE_SALES: 'inventory.create_sale',
  UPDATE_SALES: 'inventory.update_sale',
  DELETE_SALES: 'inventory.delete_sale',

  // Orders (Purchases)
  VIEW_ORDERS: 'inventory.view_order',
  CREATE_ORDERS: 'inventory.create_order',
  UPDATE_ORDERS: 'inventory.update_order',
  DELETE_ORDERS: 'inventory.delete_order',
} as const;
