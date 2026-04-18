/**
 * Export centralisé des types
 *
 * Ce fichier réexporte tous les types pour faciliter les imports.
 * Préférez importer depuis les modules spécifiques pour une meilleure organisation.
 */

// Types Core
export * from './core';

// Types partagés
export * from './shared';

// Types HR
export * from './hr';

// Types Inventory
// Note: Category and PaginatedResponse from inventory are not re-exported to avoid conflicts
// Use them directly from './inventory' if needed, or use the ones from './core' and './shared'
export type {
  ABCAnalysisDistribution,
  ABCAnalysisResponse, ABCDistribution, ABCProduct, Alert,
  AlertCreate, AlertSeverity, AlertType, AlertUpdate, CategoryCreate, CategoryPerformance, CategoryRevenue, CategoryStockReport, CategoryTree, CategoryUpdate, CreditByCustomer, CreditPayment,
  CreditPaymentCreate, CreditSale, CreditSaleStatus, CreditSaleSummary, CreditsReportResponse, CreditsReportSummary, Customer,
  CustomerCreate,
  CustomerUpdate, DailyAnalysis, DailyMovementHistory, DailySales, DailySalesData, DeliveryNote,
  DeliveryNoteCreate, DeliveryNoteItem,
  DeliveryNoteItemCreate, DeliveryNoteStatus, DiscountType, Expense, ExpenseCategory, ExpenseCategoryBreakdown, ExpenseCategoryCreate, ExpenseCreate, ExpenseSummary, ExpenseUpdate, FinancialAnalysisResponse, FinancialAnalysisSummary, HourlyAnalysis,
  // Sales Analytics types
  HourlySalesData, InventoryApiError,
  // Category types - use InventoryCategory to avoid conflict with CoreCategory
  Category as InventoryCategory,
  // PaginatedResponse - use InventoryPaginatedResponse to avoid conflict
  PaginatedResponse as InventoryPaginatedResponse, InventoryStats, LowRotationProduct,
  LowRotationProductsResponse, LowStockProduct, MonthlyAnalysis, MonthlySalesData, Movement,
  MovementCreate, MovementHistoryResponse, MovementSummary, MovementType, MovementTypeDetail, MovementUpdate, MovementsSummary30d, Order,
  OrderCreate, OrderItem,
  OrderItemCreate, OrderList, OrderStatus, OrderUpdate, Payment,
  PaymentCreate, PaymentMethod, PaymentMethodBreakdown, PaymentMethodDistribution,
  // Sales types
  PaymentStatus, Product,
  ProductCreate, ProductList,
  // All other inventory types
  ProductUnit, ProductUpdate, ProformaCreate, ProformaInvoice, ProformaItem,
  ProformaItemCreate, ProformaStatus, ProformaUpdate, PurchaseOrder,
  PurchaseOrderCreate, PurchaseOrderItem,
  PurchaseOrderItemCreate, RecentAlert, RecentCredit, Sale,
  SaleCreate, SaleItem,
  SaleItemCreate, SaleList, SaleUpdate, SalesAnalyticsPeriod, SalesAnalyticsResponse, SalesByHour, SalesByWeekday, SalesPerformanceResponse, SalesPerformanceSummary, SalesTrendItem, Stock, StockCount,
  StockCountCreate, StockCountItem,
  StockCountItemCreate, StockCountReportItem, StockCountStatus, StockCountUpdate, StockCountsSummary,
  StockCountsSummaryResponse, StockCreate,
  StockUpdate, Supplier,
  SupplierCreate,
  SupplierUpdate, TopProduct, TopProductSold, TopSellingProduct, Warehouse,
  WarehouseCreate, WarehouseStats, WarehouseStockReport, WarehouseUpdate
} from './inventory';

// Types Notifications
export * from './notifications';

