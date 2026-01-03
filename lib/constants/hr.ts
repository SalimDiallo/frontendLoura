import { COMMON_PERMISSIONS } from '@/lib/types/permissions';

export interface PermissionItem {
  code: string;
  label: string;
  category: string;
  module: 'hr' | 'inventory';
}

export const AVAILABLE_PERMISSIONS: PermissionItem[] = [
  // ============================================
  // HR MODULE
  // ============================================
  
  // Employees
  { code: COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES, label: "Voir les employés", category: "Employés", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES, label: "Créer des employés", category: "Employés", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES, label: "Modifier des employés", category: "Employés", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES, label: "Supprimer des employés", category: "Employés", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEE_PERMISSIONS, label: "Gérer les permissions", category: "Employés", module: "hr" },

  // Departments
  { code: COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS, label: "Voir les départements", category: "Départements", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.CREATE_DEPARTMENTS, label: "Créer des départements", category: "Départements", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS, label: "Modifier des départements", category: "Départements", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.DELETE_DEPARTMENTS, label: "Supprimer des départements", category: "Départements", module: "hr" },

  // Positions
  { code: COMMON_PERMISSIONS.HR.VIEW_POSITIONS, label: "Voir les postes", category: "Postes", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.CREATE_POSITIONS, label: "Créer des postes", category: "Postes", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.UPDATE_POSITIONS, label: "Modifier des postes", category: "Postes", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.DELETE_POSITIONS, label: "Supprimer des postes", category: "Postes", module: "hr" },

  // Roles
  { code: COMMON_PERMISSIONS.HR.VIEW_ROLES, label: "Voir les rôles", category: "Rôles", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.CREATE_ROLES, label: "Créer des rôles", category: "Rôles", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.UPDATE_ROLES, label: "Modifier des rôles", category: "Rôles", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.DELETE_ROLES, label: "Supprimer des rôles", category: "Rôles", module: "hr" },

  // Contracts
  { code: COMMON_PERMISSIONS.HR.VIEW_CONTRACTS, label: "Voir les contrats", category: "Contrats", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.CREATE_CONTRACTS, label: "Créer des contrats", category: "Contrats", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS, label: "Modifier des contrats", category: "Contrats", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.DELETE_CONTRACTS, label: "Supprimer des contrats", category: "Contrats", module: "hr" },

  // Leave Requests
  { code: COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS, label: "Voir les congés", category: "Congés", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.CREATE_LEAVE_REQUESTS, label: "Demander des congés", category: "Congés", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS, label: "Approuver des congés", category: "Congés", module: "hr" },
  
  // Payroll
  { code: COMMON_PERMISSIONS.HR.VIEW_PAYROLL, label: "Voir la paie", category: "Paie", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.CREATE_PAYROLL, label: "Créer des bulletins", category: "Paie", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.UPDATE_PAYROLL, label: "Modifier la paie", category: "Paie", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.EXPORT_PAYROLL, label: "Exporter la paie", category: "Paie", module: "hr" },

  // Attendance
  { code: COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE, label: "Voir ses pointages", category: "Pointages", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE, label: "Voir tous les pointages", category: "Pointages", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.CREATE_ATTENDANCE, label: "Créer des pointages", category: "Pointages", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE, label: "Modifier des pointages", category: "Pointages", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.DELETE_ATTENDANCE, label: "Supprimer des pointages", category: "Pointages", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE, label: "Approuver des pointages", category: "Pointages", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.MANUAL_CHECKIN, label: "Pointage manuel", category: "Pointages", module: "hr" },
  { code: COMMON_PERMISSIONS.HR.CREATE_QR_SESSION, label: "Générer des QR codes", category: "Pointages", module: "hr" },

  // ============================================
  // INVENTORY MODULE
  // ============================================
  
  // Products
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS, label: "Voir les produits", category: "Produits", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_PRODUCTS, label: "Créer des produits", category: "Produits", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_PRODUCTS, label: "Modifier des produits", category: "Produits", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_PRODUCTS, label: "Supprimer des produits", category: "Produits", module: "inventory" },

  // Stock
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK, label: "Voir le stock", category: "Stock", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.MANAGE_STOCK, label: "Entrées/Sorties", category: "Stock", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.ADJUST_STOCK, label: "Inventaires", category: "Stock", module: "inventory" },
  
  // Warehouses
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES, label: "Voir les entrepôts", category: "Entrepôts", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_WAREHOUSES, label: "Créer des entrepôts", category: "Entrepôts", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_WAREHOUSES, label: "Modifier des entrepôts", category: "Entrepôts", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_WAREHOUSES, label: "Supprimer des entrepôts", category: "Entrepôts", module: "inventory" },

  // Suppliers
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_SUPPLIERS, label: "Voir les fournisseurs", category: "Fournisseurs", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_SUPPLIERS, label: "Créer des fournisseurs", category: "Fournisseurs", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_SUPPLIERS, label: "Modifier des fournisseurs", category: "Fournisseurs", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_SUPPLIERS, label: "Supprimer des fournisseurs", category: "Fournisseurs", module: "inventory" },

  // Categories
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_CATEGORIES, label: "Voir les catégories", category: "Catégories", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_CATEGORIES, label: "Créer des catégories", category: "Catégories", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_CATEGORIES, label: "Modifier des catégories", category: "Catégories", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_CATEGORIES, label: "Supprimer des catégories", category: "Catégories", module: "inventory" },

  // Sales
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_SALES, label: "Voir les ventes", category: "Ventes", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_SALES, label: "Créer des ventes", category: "Ventes", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_SALES, label: "Modifier des ventes", category: "Ventes", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_SALES, label: "Supprimer des ventes", category: "Ventes", module: "inventory" },

  // Orders (Purchases)
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS, label: "Voir les commandes", category: "Achats", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_ORDERS, label: "Créer des commandes", category: "Achats", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_ORDERS, label: "Modifier des commandes", category: "Achats", module: "inventory" },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_ORDERS, label: "Supprimer des commandes", category: "Achats", module: "inventory" },
];
