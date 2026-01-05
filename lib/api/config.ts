/**
 * Configuration de l'API
 * Ce fichier contient la configuration de base pour les appels API
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Clés de stockage local
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const;

/**
 * Endpoints de l'API par module
 */
export const API_ENDPOINTS = {
  /**
   * Module CORE - Authentification, Organisations, Catégories
   */
  // Authentification unifiée (Admin et Employee)
  AUTH: {
    LOGIN: '/auth/login/',                         // Login unifié
    REGISTER: '/auth/register/',                   // Registration Admin + Organisation
    LOGOUT: '/auth/logout/',                       // Logout centralisé
    REFRESH: '/auth/refresh/',                     // Refresh centralisé
    ME: '/auth/me/',                               // Utilisateur courant
    UPDATE_PROFILE: '/auth/profile/update/',       // Mise à jour du profil
    CHANGE_PASSWORD: '/auth/profile/change-password/',  // Changement de mot de passe
  },

  CORE: {
    // Organisations
    ORGANIZATIONS: {
      LIST: '/core/organizations/',
      CREATE: '/core/organizations/',
      DETAIL: (id: string) => `/core/organizations/${id}/`,
      UPDATE: (id: string) => `/core/organizations/${id}/`,
      DELETE: (id: string) => `/core/organizations/${id}/`,
      ACTIVATE: (id: string) => `/core/organizations/${id}/activate/`,
      DEACTIVATE: (id: string) => `/core/organizations/${id}/deactivate/`,
      UPLOAD_LOGO: (id: string) => `/core/organizations/${id}/logo/`,
    },
    // Catégories
    CATEGORIES: {
      LIST: '/core/categories/',
      DETAIL: (id: number) => `/core/categories/${id}/`,
    },
  },

  /**
   * Module HR - Gestion des ressources humaines
   */
  HR: {
    // Employés
    EMPLOYEES: {
      LIST: '/hr/employees/',
      CREATE: '/hr/employees/',
      DETAIL: (id: string) => `/hr/employees/${id}/`,
      UPDATE: (id: string) => `/hr/employees/${id}/`,
      DELETE: (id: string) => `/hr/employees/${id}/`,
      ACTIVATE: (id: string) => `/hr/employees/${id}/activate/`,
      DEACTIVATE: (id: string) => `/hr/employees/${id}/deactivate/`,
    },
    // Départements
    DEPARTMENTS: {
      LIST: '/hr/departments/',
      CREATE: '/hr/departments/',
      DETAIL: (id: string) => `/hr/departments/${id}/`,
      UPDATE: (id: string) => `/hr/departments/${id}/`,
      DELETE: (id: string) => `/hr/departments/${id}/`,
      ACTIVATE: (id: string) => `/hr/departments/${id}/activate/`,
      DEACTIVATE: (id: string) => `/hr/departments/${id}/deactivate/`,
    },
    // Postes/Positions
    POSITIONS: {
      LIST: '/hr/positions/',
      CREATE: '/hr/positions/',
      DETAIL: (id: string) => `/hr/positions/${id}/`,
      UPDATE: (id: string) => `/hr/positions/${id}/`,
      DELETE: (id: string) => `/hr/positions/${id}/`,
    },
    // Rôles
    ROLES: {
      LIST: '/hr/roles/',
      CREATE: '/hr/roles/',
      DETAIL: (id: string) => `/hr/roles/${id}/`,
      UPDATE: (id: string) => `/hr/roles/${id}/`,
      DELETE: (id: string) => `/hr/roles/${id}/`,
    },
    // Permissions
    PERMISSIONS: {
      LIST: '/hr/permissions/',
      DETAIL: (id: string) => `/hr/permissions/${id}/`,
    },
    // Types de congés
    LEAVE_TYPES: {
      LIST: '/hr/leave-types/',
      CREATE: '/hr/leave-types/',
      DETAIL: (id: string) => `/hr/leave-types/${id}/`,
      UPDATE: (id: string) => `/hr/leave-types/${id}/`,
      DELETE: (id: string) => `/hr/leave-types/${id}/`,
    },
    // Soldes de congés
    LEAVE_BALANCES: {
      LIST: '/hr/leave-balances/',
      CREATE: '/hr/leave-balances/',
      DETAIL: (id: string) => `/hr/leave-balances/${id}/`,
      UPDATE: (id: string) => `/hr/leave-balances/${id}/`,
      DELETE: (id: string) => `/hr/leave-balances/${id}/`,
      EMPLOYEE: (employeeId: string) => `/hr/employees/${employeeId}/leave-balances/`,
    },
    // Demandes de congés
    LEAVE_REQUESTS: {
      LIST: '/hr/leave-requests/',
      CREATE: '/hr/leave-requests/',
      DETAIL: (id: string) => `/hr/leave-requests/${id}/`,
      UPDATE: (id: string) => `/hr/leave-requests/${id}/`,
      DELETE: (id: string) => `/hr/leave-requests/${id}/`,
      APPROVE: (id: string) => `/hr/leave-requests/${id}/approve/`,
      REJECT: (id: string) => `/hr/leave-requests/${id}/reject/`,
      EXPORT_PDF: (id: string) => `/hr/leave-requests/${id}/export-pdf/`,
    },
    // Périodes de paie
    PAYROLL_PERIODS: {
      LIST: '/hr/payroll-periods/',
      CREATE: '/hr/payroll-periods/',
      DETAIL: (id: string) => `/hr/payroll-periods/${id}/`,
      UPDATE: (id: string) => `/hr/payroll-periods/${id}/`,
      DELETE: (id: string) => `/hr/payroll-periods/${id}/`,
    },
    // Fiches de paie
    PAYSLIPS: {
      LIST: '/hr/payslips/',
      CREATE: '/hr/payslips/',
      DETAIL: (id: string) => `/hr/payslips/${id}/`,
      UPDATE: (id: string) => `/hr/payslips/${id}/`,
      DELETE: (id: string) => `/hr/payslips/${id}/`,
      MARK_PAID: (id: string) => `/hr/payslips/${id}/mark_as_paid/`,
      GENERATE_BULK: '/hr/payslips/generate_for_period/',
    },
    // Avances sur salaire
    PAYROLL_ADVANCES: {
      LIST: '/hr/payroll-advances/',
      CREATE: '/hr/payroll-advances/',
      DETAIL: (id: string) => `/hr/payroll-advances/${id}/`,
      UPDATE: (id: string) => `/hr/payroll-advances/${id}/`,
      DELETE: (id: string) => `/hr/payroll-advances/${id}/`,
      APPROVE: (id: string) => `/hr/payroll-advances/${id}/approve/`,
      REJECT: (id: string) => `/hr/payroll-advances/${id}/reject/`,
      MARK_PAID: (id: string) => `/hr/payroll-advances/${id}/mark_as_paid/`,
      DEDUCT_FROM_PAYSLIP: (id: string) => `/hr/payroll-advances/${id}/deduct_from_payslip/`,
    },
    // Calendrier
    CALENDAR: {
      LIST: '/hr/calendar/',
      CREATE: '/hr/calendar/',
      DETAIL: (id: string) => `/hr/calendar/${id}/`,
      UPDATE: (id: string) => `/hr/calendar/${id}/`,
      DELETE: (id: string) => `/hr/calendar/${id}/`,
    },
    // Statistiques
    STATS: {
      OVERVIEW: '/hr/stats/overview/',
      DEPARTMENTS: '/hr/stats/departments/',
      LEAVES: '/hr/stats/leaves/',
      PAYROLL: '/hr/stats/payroll/',
    },
    // Pointages/Attendance
    ATTENDANCES: {
      LIST: '/hr/attendances/',
      CREATE: '/hr/attendances/',
      DETAIL: (id: string) => `/hr/attendances/${id}/`,
      UPDATE: (id: string) => `/hr/attendances/${id}/`,
      DELETE: (id: string) => `/hr/attendances/${id}/`,
      CHECK_IN: '/hr/attendances/check-in/',
      CHECK_OUT: '/hr/attendances/check-out/',
      TODAY: '/hr/attendances/today/',
      START_BREAK: '/hr/attendances/start-break/',
      END_BREAK: '/hr/attendances/end-break/',
      APPROVE: (id: string) => `/hr/attendances/${id}/approve/`,
      STATS: '/hr/attendances/stats/',
      // QR Code endpoints
      QR_SESSION_CREATE: '/hr/attendances/qr-session/create/',
      QR_SESSION_DETAIL: (sessionId: string) => `/hr/attendances/qr-session/${sessionId}/`,
      QR_CHECK_IN: '/hr/attendances/qr-check-in/',
    },
    // Contrats
    CONTRACTS: {
      LIST: '/hr/contracts/',
      CREATE: '/hr/contracts/',
      DETAIL: (id: string) => `/hr/contracts/${id}/`,
      UPDATE: (id: string) => `/hr/contracts/${id}/`,
      DELETE: (id: string) => `/hr/contracts/${id}/`,
      EXPORT_PDF: (id: string) => `/hr/contracts/${id}/export-pdf/`,
    },
  },

  /**
   * Module INVENTORY - Gestion des stocks
   */
  INVENTORY: {
    // Catégories de produits
    CATEGORIES: {
      LIST: '/inventory/categories/',
      CREATE: '/inventory/categories/',
      DETAIL: (id: string) => `/inventory/categories/${id}/`,
      UPDATE: (id: string) => `/inventory/categories/${id}/`,
      DELETE: (id: string) => `/inventory/categories/${id}/`,
      TREE: '/inventory/categories/tree/',
    },
    // Entrepôts
    WAREHOUSES: {
      LIST: '/inventory/warehouses/',
      CREATE: '/inventory/warehouses/',
      DETAIL: (id: string) => `/inventory/warehouses/${id}/`,
      UPDATE: (id: string) => `/inventory/warehouses/${id}/`,
      DELETE: (id: string) => `/inventory/warehouses/${id}/`,
      INVENTORY: (id: string) => `/inventory/warehouses/${id}/inventory/`,
      STATS: (id: string) => `/inventory/warehouses/${id}/stats/`,
    },
    // Fournisseurs
    SUPPLIERS: {
      LIST: '/inventory/suppliers/',
      CREATE: '/inventory/suppliers/',
      DETAIL: (id: string) => `/inventory/suppliers/${id}/`,
      UPDATE: (id: string) => `/inventory/suppliers/${id}/`,
      DELETE: (id: string) => `/inventory/suppliers/${id}/`,
      ORDERS: (id: string) => `/inventory/suppliers/${id}/orders/`,
    },
    // Produits
    PRODUCTS: {
      LIST: '/inventory/products/',
      CREATE: '/inventory/products/',
      DETAIL: (id: string) => `/inventory/products/${id}/`,
      UPDATE: (id: string) => `/inventory/products/${id}/`,
      DELETE: (id: string) => `/inventory/products/${id}/`,
      STOCK_BY_WAREHOUSE: (id: string) => `/inventory/products/${id}/stock_by_warehouse/`,
      MOVEMENTS: (id: string) => `/inventory/products/${id}/movements/`,
    },
    // Stocks
    STOCKS: {
      LIST: '/inventory/stocks/',
      CREATE: '/inventory/stocks/',
      DETAIL: (id: string) => `/inventory/stocks/${id}/`,
      UPDATE: (id: string) => `/inventory/stocks/${id}/`,
      DELETE: (id: string) => `/inventory/stocks/${id}/`,
    },
    // Mouvements
    MOVEMENTS: {
      LIST: '/inventory/movements/',
      CREATE: '/inventory/movements/',
      DETAIL: (id: string) => `/inventory/movements/${id}/`,
      UPDATE: (id: string) => `/inventory/movements/${id}/`,
      DELETE: (id: string) => `/inventory/movements/${id}/`,
    },
    // Commandes
    ORDERS: {
      LIST: '/inventory/orders/',
      CREATE: '/inventory/orders/',
      DETAIL: (id: string) => `/inventory/orders/${id}/`,
      UPDATE: (id: string) => `/inventory/orders/${id}/`,
      DELETE: (id: string) => `/inventory/orders/${id}/`,
      CONFIRM: (id: string) => `/inventory/orders/${id}/confirm/`,
      RECEIVE: (id: string) => `/inventory/orders/${id}/receive/`,
      CANCEL: (id: string) => `/inventory/orders/${id}/cancel/`,
      EXPORT_PDF: (id: string) => `/inventory/orders/${id}/export-pdf/`,
    },
    // Inventaires physiques
    STOCK_COUNTS: {
      LIST: '/inventory/stock-counts/',
      CREATE: '/inventory/stock-counts/',
      DETAIL: (id: string) => `/inventory/stock-counts/${id}/`,
      UPDATE: (id: string) => `/inventory/stock-counts/${id}/`,
      DELETE: (id: string) => `/inventory/stock-counts/${id}/`,
      START: (id: string) => `/inventory/stock-counts/${id}/start/`,
      COMPLETE: (id: string) => `/inventory/stock-counts/${id}/complete/`,
      VALIDATE: (id: string) => `/inventory/stock-counts/${id}/validate/`,
      CANCEL: (id: string) => `/inventory/stock-counts/${id}/cancel/`,
      // Actions automatisées
      GENERATE_ITEMS: (id: string) => `/inventory/stock-counts/${id}/generate_items/`,
      AUTO_FILL_COUNTS: (id: string) => `/inventory/stock-counts/${id}/auto_fill_counts/`,
      DISCREPANCIES: (id: string) => `/inventory/stock-counts/${id}/discrepancies/`,
      SUMMARY: (id: string) => `/inventory/stock-counts/${id}/summary/`,
      // Items d'inventaire
      ITEMS: {
        LIST: (countId: string) => `/inventory/stock-counts/${countId}/items/`,
        CREATE: (countId: string) => `/inventory/stock-counts/${countId}/items/`,
        DETAIL: (countId: string, itemId: string) => `/inventory/stock-counts/${countId}/items/${itemId}/`,
        UPDATE: (countId: string, itemId: string) => `/inventory/stock-counts/${countId}/items/${itemId}/`,
        DELETE: (countId: string, itemId: string) => `/inventory/stock-counts/${countId}/items/${itemId}/`,
      },
      EXPORT_PDF: (id: string) => `/inventory/stock-counts/${id}/export-pdf/`,
    },
    // Alertes
    ALERTS: {
      LIST: '/inventory/alerts/',
      CREATE: '/inventory/alerts/',
      DETAIL: (id: string) => `/inventory/alerts/${id}/`,
      UPDATE: (id: string) => `/inventory/alerts/${id}/`,
      DELETE: (id: string) => `/inventory/alerts/${id}/`,
      RESOLVE: (id: string) => `/inventory/alerts/${id}/resolve/`,
      GENERATE: '/inventory/alerts/generate/',
    },
    // Statistiques et Rapports
    STATS: {
      OVERVIEW: '/inventory/stats/overview/',
      TOP_PRODUCTS: '/inventory/stats/top_products/',
      STOCK_BY_WAREHOUSE: '/inventory/stats/stock_by_warehouse/',
      STOCK_BY_CATEGORY: '/inventory/stats/stock_by_category/',
      MOVEMENT_HISTORY: '/inventory/stats/movement_history/',
      LOW_ROTATION_PRODUCTS: '/inventory/stats/low_rotation_products/',
      STOCK_COUNTS_SUMMARY: '/inventory/stats/stock_counts_summary/',
      // Exports CSV
      EXPORT_STOCK_LIST: '/inventory/stats/export_stock_list/',
      EXPORT_MOVEMENTS: '/inventory/stats/export_movements/',
      EXPORT_ALERTS: '/inventory/stats/export_alerts/',
      // Exports PDF
      EXPORT_PRODUCTS_PDF: '/inventory/stats/export_products_pdf/',
      EXPORT_STOCK_PDF: '/inventory/stats/export_stock_pdf/',
      GENERATE_QUOTE_PDF: '/inventory/stats/generate_quote_pdf/',
      GENERATE_INVOICE_PDF: '/inventory/stats/generate_invoice_pdf/',
    },
    // ============================================
    // Sales & Commercial Documents
    // ============================================
    
    // Clients
    CUSTOMERS: {
      LIST: '/inventory/customers/',
      CREATE: '/inventory/customers/',
      DETAIL: (id: string) => `/inventory/customers/${id}/`,
      UPDATE: (id: string) => `/inventory/customers/${id}/`,
      DELETE: (id: string) => `/inventory/customers/${id}/`,
      SALES_HISTORY: (id: string) => `/inventory/customers/${id}/sales_history/`,
      CREDIT_HISTORY: (id: string) => `/inventory/customers/${id}/credit_history/`,
    },
    // Ventes
    SALES: {
      LIST: '/inventory/sales/',
      CREATE: '/inventory/sales/',
      DETAIL: (id: string) => `/inventory/sales/${id}/`,
      UPDATE: (id: string) => `/inventory/sales/${id}/`,
      DELETE: (id: string) => `/inventory/sales/${id}/`,
      ADD_PAYMENT: (id: string) => `/inventory/sales/${id}/add_payment/`,
      RECEIPT: (id: string) => `/inventory/sales/${id}/receipt/`,
      CANCEL: (id: string) => `/inventory/sales/${id}/cancel/`,
    },
    // Paiements
    PAYMENTS: {
      LIST: '/inventory/payments/',
      CREATE: '/inventory/payments/',
      DETAIL: (id: string) => `/inventory/payments/${id}/`,
      EXPORT_PDF: (id: string) => `/inventory/payments/${id}/export-pdf/`,
    },
    // Catégories de dépenses
    EXPENSE_CATEGORIES: {
      LIST: '/inventory/expense-categories/',
      CREATE: '/inventory/expense-categories/',
      DETAIL: (id: string) => `/inventory/expense-categories/${id}/`,
      UPDATE: (id: string) => `/inventory/expense-categories/${id}/`,
      DELETE: (id: string) => `/inventory/expense-categories/${id}/`,
    },
    // Dépenses
    EXPENSES: {
      LIST: '/inventory/expenses/',
      CREATE: '/inventory/expenses/',
      DETAIL: (id: string) => `/inventory/expenses/${id}/`,
      UPDATE: (id: string) => `/inventory/expenses/${id}/`,
      DELETE: (id: string) => `/inventory/expenses/${id}/`,
      SUMMARY: '/inventory/expenses/summary/',
      EXPORT: '/inventory/expenses/export/',
    },
    // Factures pro forma
    PROFORMAS: {
      LIST: '/inventory/proformas/',
      CREATE: '/inventory/proformas/',
      DETAIL: (id: string) => `/inventory/proformas/${id}/`,
      UPDATE: (id: string) => `/inventory/proformas/${id}/`,
      DELETE: (id: string) => `/inventory/proformas/${id}/`,
      CONVERT_TO_SALE: (id: string) => `/inventory/proformas/${id}/convert_to_sale/`,
      EXPORT_PDF: (id: string) => `/inventory/proformas/${id}/export-pdf/`,
    },
    // Bons de commande d'achat
    PURCHASE_ORDERS: {
      LIST: '/inventory/purchase-orders/',
      CREATE: '/inventory/purchase-orders/',
      DETAIL: (id: string) => `/inventory/purchase-orders/${id}/`,
      UPDATE: (id: string) => `/inventory/purchase-orders/${id}/`,
      DELETE: (id: string) => `/inventory/purchase-orders/${id}/`,
      APPROVE: (id: string) => `/inventory/purchase-orders/${id}/approve/`,
      SEND: (id: string) => `/inventory/purchase-orders/${id}/send/`,
      EXPORT_PDF: (id: string) => `/inventory/purchase-orders/${id}/export-pdf/`,
    },
    // Bons de livraison
    DELIVERY_NOTES: {
      LIST: '/inventory/delivery-notes/',
      CREATE: '/inventory/delivery-notes/',
      DETAIL: (id: string) => `/inventory/delivery-notes/${id}/`,
      UPDATE: (id: string) => `/inventory/delivery-notes/${id}/`,
      DELETE: (id: string) => `/inventory/delivery-notes/${id}/`,
      MARK_DELIVERED: (id: string) => `/inventory/delivery-notes/${id}/mark_delivered/`,
      EXPORT_PDF: (id: string) => `/inventory/delivery-notes/${id}/export-pdf/`,
    },
    // Ventes à crédit
    CREDIT_SALES: {
      LIST: '/inventory/credit-sales/',
      DETAIL: (id: string) => `/inventory/credit-sales/${id}/`,
      ADD_PAYMENT: (id: string) => `/inventory/credit-sales/${id}/add_payment/`,
      SEND_REMINDER: (id: string) => `/inventory/credit-sales/${id}/send_reminder/`,
      SUMMARY: '/inventory/credit-sales/summary/',
    },
  },

  /**
   * Module AI - Assistant IA
   */
  AI: {
    CHAT: '/ai/chat/',
    CHAT_STREAM: '/ai/chat/stream/',
    MODELS: '/ai/models/',
    TOOLS: '/ai/tools/',
    CONVERSATIONS: {
      LIST: '/ai/conversations/',
      CREATE: '/ai/conversations/',
      DETAIL: (id: string) => `/ai/conversations/${id}/`,
      DELETE: (id: string) => `/ai/conversations/${id}/`,
      CLEAR: (id: string) => `/ai/conversations/${id}/clear/`,
      FEEDBACK: (id: string) => `/ai/conversations/${id}/feedback/`,
    },
  },
} as const;
