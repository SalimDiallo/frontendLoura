import { COMMON_PERMISSIONS } from '@/lib/types/permissions';

export interface PermissionItem {
  code: string;
  label: string;
  category: string;
  module: 'hr' | 'inventory';
  depends: string[];
}

export const AVAILABLE_PERMISSIONS: PermissionItem[] = [
  // ============================================
  // HR MODULE
  // ============================================

  // Employees
  { code: COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES, label: "Voir les employés", category: "Employés", module: "hr", depends: [] },
  { code: COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES, label: "Créer des employés", category: "Employés", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES] },
  { code: COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES, label: "Modifier des employés", category: "Employés", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES] },
  { code: COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES, label: "Supprimer des employés", category: "Employés", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES] },
  // { code: COMMON_PERMISSIONS.HR.MANAGE_EMPLOYEE_PERMISSIONS, label: "Gérer les permissions", category: "Employés", module: "hr", depends: [] },

  // Departments
  { code: COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS, label: "Voir les départements", category: "Départements", module: "hr", depends: [] },
  { code: COMMON_PERMISSIONS.HR.CREATE_DEPARTMENTS, label: "Créer des départements", category: "Départements", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS] },
  { code: COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS, label: "Modifier des départements", category: "Départements", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS] },
  { code: COMMON_PERMISSIONS.HR.DELETE_DEPARTMENTS, label: "Supprimer des départements", category: "Départements", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS] },

  // Positions
  { code: COMMON_PERMISSIONS.HR.VIEW_POSITIONS, label: "Voir les postes", category: "Postes", module: "hr", depends: [] },
  { code: COMMON_PERMISSIONS.HR.CREATE_POSITIONS, label: "Créer des postes", category: "Postes", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_POSITIONS] },
  { code: COMMON_PERMISSIONS.HR.UPDATE_POSITIONS, label: "Modifier des postes", category: "Postes", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_POSITIONS] },
  { code: COMMON_PERMISSIONS.HR.DELETE_POSITIONS, label: "Supprimer des postes", category: "Postes", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_POSITIONS] },

  // Roles
  { code: COMMON_PERMISSIONS.HR.VIEW_ROLES, label: "Voir les rôles", category: "Rôles", module: "hr", depends: [] },
  { code: COMMON_PERMISSIONS.HR.CREATE_ROLES, label: "Créer des rôles", category: "Rôles", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_ROLES] },
  { code: COMMON_PERMISSIONS.HR.UPDATE_ROLES, label: "Modifier des rôles", category: "Rôles", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_ROLES] },
  { code: COMMON_PERMISSIONS.HR.DELETE_ROLES, label: "Supprimer des rôles", category: "Rôles", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_ROLES] },

  // Contracts
  { code: COMMON_PERMISSIONS.HR.VIEW_CONTRACTS, label: "Voir les contrats", category: "Contrats", module: "hr", depends: [] },
  { code: COMMON_PERMISSIONS.HR.CREATE_CONTRACTS, label: "Créer des contrats", category: "Contrats", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_CONTRACTS] },
  { code: COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS, label: "Modifier des contrats", category: "Contrats", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_CONTRACTS] },
  { code: COMMON_PERMISSIONS.HR.DELETE_CONTRACTS, label: "Supprimer des contrats", category: "Contrats", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_CONTRACTS] },

  // Leave Requests
  { code: COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS, label: "Voir les congés", category: "Congés", module: "hr", depends: [] },
  // { code: COMMON_PERMISSIONS.HR.CREATE_LEAVE_REQUESTS, label: "Demander des congés", category: "Congés", module: "hr", depends: [] },
  { code: COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS, label: "Gerer les soldes et approuver des congés des autres", category: "Congés", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS] },

  // Payroll
  { code: COMMON_PERMISSIONS.HR.VIEW_PAYROLL, label: "Voir la paie", category: "Paie", module: "hr", depends: [] },
  { code: COMMON_PERMISSIONS.HR.CREATE_PAYROLL, label: "Créer des bulletins", category: "Paie", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_PAYROLL] },
  { code: COMMON_PERMISSIONS.HR.UPDATE_PAYROLL, label: "Modifier la paie", category: "Paie", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_PAYROLL] },
  { code: COMMON_PERMISSIONS.HR.DELETE_PAYROLL, label: "Supprimer la paie", category: "Paie", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_PAYROLL] },
  { code: COMMON_PERMISSIONS.HR.APPROVE_PAYROLL, label: "Approuver des avances", category: "Paie", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_PAYROLL] },
  // { code: COMMON_PERMISSIONS.HR.PROCESS_PAYROLL, label: "Marquer comme payée", category: "Paie", module: "hr", depends: [] },
  // { code: COMMON_PERMISSIONS.HR.EXPORT_PAYROLL, label: "Exporter la paie", category: "Paie", module: "hr", depends: [] },

  // Attendance
  // { code: COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE, label: "Voir ses pointages", category: "Pointages", module: "hr", depends: [] },
  { code: COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE, label: "Voir tous les pointages", category: "Pointages", module: "hr", depends: [] },
  // { code: COMMON_PERMISSIONS.HR.CREATE_ATTENDANCE, label: "Créer des pointages", category: "Pointages", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE] },
  // { code: COMMON_PERMISSIONS.HR.UPDATE_ATTENDANCE, label: "Modifier des pointages", category: "Pointages", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE] },
  // { code: COMMON_PERMISSIONS.HR.DELETE_ATTENDANCE, label: "Supprimer des pointages", category: "Pointages", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE] },
  { code: COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE, label: "Approuver des pointages", category: "Pointages", module: "hr", depends: [COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE] },
  { code: COMMON_PERMISSIONS.HR.MANUAL_CHECKIN, label: "Pointage manuel", category: "Pointages", module: "hr", depends: [] },
  { code: COMMON_PERMISSIONS.HR.CREATE_QR_SESSION, label: "Générer des QR codes", category: "Pointages", module: "hr", depends: [] },

  // ============================================
  // INVENTORY MODULE
  // ============================================

  // === CATEGORIES ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_CATEGORIES, label: "Voir les catégories", category: "Catégories", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_CATEGORIES, label: "Créer des catégories", category: "Catégories", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_CATEGORIES] },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_CATEGORIES, label: "Modifier des catégories", category: "Catégories", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_CATEGORIES] },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_CATEGORIES, label: "Supprimer des catégories", category: "Catégories", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_CATEGORIES] },

  // === WAREHOUSES ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES, label: "Voir les entrepôts", category: "Entrepôts", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_WAREHOUSES, label: "Créer des entrepôts", category: "Entrepôts", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES] },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_WAREHOUSES, label: "Modifier des entrepôts", category: "Entrepôts", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES] },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_WAREHOUSES, label: "Supprimer des entrepôts", category: "Entrepôts", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES] },

  // === SUPPLIERS ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_SUPPLIERS, label: "Voir les fournisseurs", category: "Fournisseurs", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_SUPPLIERS, label: "Créer des fournisseurs", category: "Fournisseurs", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_SUPPLIERS] },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_SUPPLIERS, label: "Modifier des fournisseurs", category: "Fournisseurs", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_SUPPLIERS] },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_SUPPLIERS, label: "Supprimer des fournisseurs", category: "Fournisseurs", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_SUPPLIERS] },

  // === PRODUCTS ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS, label: "Voir les produits", category: "Produits", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_PRODUCTS, label: "Créer des produits", category: "Produits", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS] },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_PRODUCTS, label: "Modifier des produits", category: "Produits", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS] },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_PRODUCTS, label: "Supprimer des produits", category: "Produits", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS] },

  // === STOCK ===
  { 
    code: COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK, 
    label: "Voir les stocks", 
    category: "Stocks et Mouvements", 
    module: "inventory", 
    depends: [] 
  },
  { 
    code: COMMON_PERMISSIONS.INVENTORY.MANAGE_STOCK, 
    label: "Manager les stocks", 
    category: "Stocks et Mouvements", 
    module: "inventory", 
    depends: [
      COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
      COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES,
      COMMON_PERMISSIONS.INVENTORY.VIEW_SUPPLIERS
    ] 
  },
  // { code: COMMON_PERMISSIONS.INVENTORY.ADJUST_STOCK, label: "Faire  l'Inventaire", category: "Stocks", module: "inventory", depends: [] },

  // === CUSTOMERS ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_CUSTOMERS, label: "Voir les clients", category: "Clients", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_CUSTOMERS, label: "Créer des clients", category: "Clients", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_CUSTOMERS] },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_CUSTOMERS, label: "Modifier des clients", category: "Clients", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_CUSTOMERS] },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_CUSTOMERS, label: "Supprimer des clients", category: "Clients", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_CUSTOMERS] },


  // // === MOVEMENTS ===
  // { code: COMMON_PERMISSIONS.INVENTORY.VIEW_MOVEMENTS, label: "Voir les mouvements", category: "Mouvements", module: "inventory", depends: [] },
  // { code: COMMON_PERMISSIONS.INVENTORY.CREATE_MOVEMENTS, label: "Créer des mouvements", category: "Mouvements", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_MOVEMENTS] },
  // { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_MOVEMENTS, label: "Modifier des mouvements", category: "Mouvements", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_MOVEMENTS] },
  // { code: COMMON_PERMISSIONS.INVENTORY.DELETE_MOVEMENTS, label: "Annuler des mouvements", category: "Mouvements", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_MOVEMENTS] },

  // === ORDERS ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS, label: "Voir les commandes", category: "Commandes", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_ORDERS, label: "Créer des commandes", category: "Commandes", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS] },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_ORDERS, label: "Confirmer & Modifier des commandes", category: "Commandes", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS] },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_ORDERS, label: "Annuler des commandes", category: "Commandes", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS] },
  { code: COMMON_PERMISSIONS.INVENTORY.RECEIVE_ORDERS, label: "Réceptionner des commandes", category: "Commandes", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS] },

  // === STOCK COUNTS ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK_COUNTS, label: "Voir les inventaires", category: "Inventaires", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_STOCK_COUNTS, label: "Créer des inventaires", category: "Inventaires", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK_COUNTS] },
  { code: COMMON_PERMISSIONS.INVENTORY.VALIDATE_STOCK_COUNTS, label: "Valider des inventaires", category: "Inventaires", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK_COUNTS] },

  // === EXPENSES ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_EXPENSES, label: "Voir les dépenses", category: "Dépenses", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_EXPENSES, label: "Enregistrer des dépenses", category: "Dépenses", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_EXPENSES] },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_EXPENSES, label: "Modifier des dépenses", category: "Dépenses", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_EXPENSES] },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_EXPENSES, label: "Supprimer des dépenses", category: "Dépenses", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_EXPENSES] },

  // === SALES ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_SALES, label: "Voir les ventes && créances", category: "Ventes && créances", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_SALES, label: "Créer des ventes && créances", category: "Ventes && créances", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_SALES] },
  { code: COMMON_PERMISSIONS.INVENTORY.UPDATE_SALES, label: "Modifier des ventes && créances (paiements)", category: "Ventes && créances", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_SALES] },
  { code: COMMON_PERMISSIONS.INVENTORY.DELETE_SALES, label: "Annuler des ventes && créances", category: "Ventes && créances", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_SALES] },

  // === PAYMENTS ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_PAYMENTS, label: "Voir les paiements", category: "Paiements", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.CREATE_PAYMENTS, label: "Enregistrer des paiements", category: "Paiements", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_PAYMENTS] },

  // === REPORTS ===
  { code: COMMON_PERMISSIONS.INVENTORY.VIEW_REPORTS, label: "Voir les rapports", category: "Rapports", module: "inventory", depends: [] },
  { code: COMMON_PERMISSIONS.INVENTORY.EXPORT_REPORTS, label: "Exporter les rapports", category: "Rapports", module: "inventory", depends: [COMMON_PERMISSIONS.INVENTORY.VIEW_REPORTS] },

{ 
  code: COMMON_PERMISSIONS.INVENTORY.MANAGE_DOCUMENTS,
  label: "Gérer les documents (Peut gérer (créer/modifier/supprimer) les documents)",
  category: "Documents",
  module: "inventory",
  depends: [],
},
];
