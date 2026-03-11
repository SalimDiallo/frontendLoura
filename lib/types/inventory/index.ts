// Inventory Module Types

// Re-export sales types
export * from './sales';
// ============================================
// Enums & Constants
// ============================================

export enum ProductUnit {
  UNIT = 'unit',
  KG = 'kg',
  G = 'g',
  L = 'l',
  ML = 'ml',
  M = 'm',
  M2 = 'm2',
  M3 = 'm3',
  BOX = 'box',
  PACK = 'pack',
}

export enum MovementType {
  IN = 'in',
  OUT = 'out',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
}

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export enum StockCountStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VALIDATED = 'validated',
  CANCELLED = 'cancelled',
}

export enum AlertType {
  STOCK_WARNING = 'stock_warning',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  OVERSTOCK = 'overstock',
  HIGH_VALUE_LOW_STOCK = 'high_value_low_stock',
  NO_MOVEMENT = 'no_movement',
  EXPIRING_SOON = 'expiring_soon',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// ============================================
// Category
// ============================================

export interface Category {
  id: string;
  organization: string;
  name: string;
  code?: string;
  description?: string;
  parent?: string | null;
  parent_name?: string;
  product_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  code?: string;
  description?: string;
  parent?: string | null;
  is_active?: boolean;
}

export interface CategoryUpdate extends Partial<CategoryCreate> {}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

// ============================================
// Warehouse
// ============================================

export interface Warehouse {
  id: string;
  organization: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  manager_name?: string;
  phone?: string;
  email?: string;
  product_count?: number;
  total_stock_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseCreate {
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  manager_name?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

export interface WarehouseUpdate extends Partial<WarehouseCreate> {}

export interface WarehouseStats {
  product_count: number;
  // postal_code?: string;
  unique_products?: number;
  total_quantity?: number;
  total_stock_value: number;
  total_value?: number;
  low_stock_products: number;
  out_of_stock_products: number;
}

// ============================================
// Supplier
// ============================================

export interface Supplier {
  id: string;
  organization: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  contact_person?: string;
  tax_id?: string;
  payment_terms?: string;
  notes?: string;
  website?: string;
  order_count?: number;
  total_orders_amount?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierCreate {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  contact_person?: string;
  tax_id?: string;
  payment_terms?: string;
  notes?: string;
  website?: string;
  is_active?: boolean;
}

export interface SupplierUpdate extends Partial<SupplierCreate> {}

// ============================================
// Stock
// ============================================

export interface Stock {
  id: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  unit_cost?: number;
  warehouse: string;
  warehouse_name?: string;
  warehouse_code?: string;
  quantity: number;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface StockCreate {
  product: string;
  warehouse: string;
  quantity: number;
  location?: string;
}

export interface StockUpdate extends Partial<StockCreate> {}

// ============================================
// Product
// ============================================

export interface Product {
  id: string;
  organization: string;
  category?: string | null;
  category_name?: string;
  name: string;
  sku: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  unit: ProductUnit;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point?: number;
  barcode?: string;
  image_url?: string;
  notes?: string;
  stocks?: Stock[];
  total_stock?: number;
  stock_value?: number;
  is_low_stock?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  category?: string | null;
  name: string;
  sku: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  unit?: ProductUnit;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  barcode?: string;
  image_url?: string;
  notes?: string;
  is_active?: boolean;
}

export interface ProductUpdate extends Partial<ProductCreate> {}

export interface ProductList {
  id: string;
  organization: string;
  name: string;
  sku: string;
  category_name?: string;
  purchase_price: number;
  selling_price: number;
  unit: ProductUnit;
  total_stock?: number;
  is_active: boolean;
}

// ============================================
// Movement
// ============================================

export interface Movement {
  id: string;
  organization: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  warehouse: string;
  warehouse_name?: string;
  movement_type: MovementType;
  movement_type_display?: string;
  quantity: number;
  reference?: string;
  notes?: string;
  movement_date: string;
  destination_warehouse?: string | null;
  destination_warehouse_name?: string;
  // Liaison avec une commande (pour les entrées via réception)
  order?: string | null;
  order_number?: string | null;
  supplier_name?: string | null;
  // Liaison avec une vente (pour les sorties)
  sale?: string | null;
  sale_number?: string | null;
  customer_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MovementCreate {
  product: string;
  warehouse: string;
  movement_type: MovementType;
  quantity: number;
  reference?: string;
  notes?: string;
  movement_date: string;
  destination_warehouse?: string | null;
}

export interface MovementUpdate extends Partial<MovementCreate> {}

// ============================================
// Order & OrderItem
// ============================================

export interface OrderItem {
  id: string;
  order: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  received_quantity: number;
  total?: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItemCreate {
  product: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  organization: string;
  supplier: string;
  supplier_name?: string | null;
  warehouse: string;
  warehouse_name?: string | null;
  order_number: string;
  order_date: string;
  expected_delivery_date?: string | null;
  actual_delivery_date?: string | null;
  status: OrderStatus;
  status_display?: string | null;
  total_amount: number | string;
  notes?: string | null;
  items?: OrderItem[];
  item_count?: number;
  // Transport info
  transport_mode?: string | null;
  transport_company?: string | null;
  tracking_number?: string | null;
  transport_cost?: number | string | null;
  transport_included?: boolean | null;
  transport_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderCreate {
  supplier: string;
  warehouse: string;
  order_number?: string;
  order_date: string;
  expected_delivery_date?: string | null;
  status?: OrderStatus;
  total_amount?: number;
  notes?: string;
  items?: OrderItemCreate[];
  // Transport
  transport_mode?: string;
  transport_company?: string;
  tracking_number?: string;
  transport_cost?: number;
  transport_included?: boolean;
  transport_notes?: string;
}

export interface OrderUpdate extends Partial<OrderCreate> {}

export interface OrderList {
  id: string;
  order_number: string;
  supplier_name?: string;
  warehouse_name?: string;
  order_date: string;
  expected_delivery_date?: string | null;
  status: OrderStatus;
  status_display?: string;
  total_amount: number;
  item_count?: number;
  // Transport
  transport_mode?: string;
  transport_cost?: number;
  transport_included?: boolean;
}

// ============================================
// StockCount & StockCountItem
// ============================================

export interface StockCountItem {
  id: string;
  stock_count: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  expected_quantity: number;
  counted_quantity: number;
  difference?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockCountItemCreate {
  product: string;
  expected_quantity: number;
  counted_quantity: number;
  notes?: string;
}

export interface StockCount {
  id: string;
  organization: string;
  warehouse: string;
  warehouse_name?: string;
  count_number: string;
  count_date: string;
  status: StockCountStatus;
  status_display?: string;
  notes?: string;
  items?: StockCountItem[];
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface StockCountCreate {
  warehouse_id: string;
  count_number: string;
  count_date: string;
  status?: StockCountStatus;
  notes?: string;
}

export interface StockCountUpdate extends Partial<StockCountCreate> {}

// ============================================
// Alert
// ============================================

export interface Alert {
  id: string;
  organization: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  warehouse?: string | null;
  warehouse_name?: string;
  alert_type: AlertType;
  alert_type_display?: string;
  severity: AlertSeverity;
  severity_display?: string;
  message: string;
  is_resolved: boolean;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertCreate {
  product: string;
  warehouse?: string | null;
  alert_type: AlertType;
  severity?: AlertSeverity;
  message: string;
}

export interface AlertUpdate extends Partial<AlertCreate> {}

// ============================================
// Statistics & Reports
// ============================================

export interface InventoryStats {
  // Stock
  total_products: number;
  total_stock_value: number;
  total_stock_value_selling: number;
  total_stock_quantity: number;
  potential_margin: number;
  low_stock_count: number;
  out_of_stock_count: number;
  overstock_count: number;
  warehouse_count: number;

  // Sales (30d)
  revenue_30d: number;
  revenue_prev_30d: number;
  revenue_variation: number | null;
  sales_count_30d: number;
  avg_ticket: number;
  payment_methods: PaymentMethodBreakdown[];

  // Sales (7d) - Weekly comparison
  revenue_7d: number;
  revenue_prev_7d: number;
  revenue_variation_7d: number | null;
  sales_count_7d: number;
  sales_count_prev_7d: number;

  // Expenses (30d)
  expenses_30d: number;
  expenses_prev_30d: number;
  expenses_variation: number | null;
  expenses_count_30d: number;
  expense_by_category: ExpenseCategoryBreakdown[];
  // Breakdown of expenses
  base_expenses_30d: number;
  purchases_30d: number;
  purchases_count_30d: number;

  // Profitability
  net_profit_30d: number;
  margin_percent: number;

  // Credit / Receivables
  total_receivables: number;
  credit_count: number;
  overdue_count: number;
  overdue_amount: number;

  // Orders & Supply Chain
  pending_orders: number;
  pending_orders_value: number;
  supplier_count: number;
  customer_count: number;

  // Alerts
  active_alerts: number;
  alerts_by_severity: Record<string, number>;
  recent_alerts: RecentAlert[];

  // Trends & Charts
  sales_trend: SalesTrendItem[];
  top_selling_products: TopSellingProduct[];
  low_stock_products: LowStockProduct[];

  // Movements (30d)
  movements_30d: MovementsSummary30d;

  // Advanced Analytics
  stock_turnover_ratio: number;
  days_of_inventory: number;
  abc_distribution: ABCDistribution;
  category_performance: CategoryPerformance[];
}

export interface ABCDistribution {
  A: number;
  B: number;
  C: number;
}

export interface CategoryPerformance {
  category_id: string;
  category_name: string;
  stock_value: number;
  stock_quantity: number;
  product_count: number;
  revenue_90d: number;
  qty_sold_90d: number;
  turnover_ratio: number;
}

export interface PaymentMethodBreakdown {
  payment_method: string;
  count: number;
  total: number;
}

export interface ExpenseCategoryBreakdown {
  category__name: string;
  total: number;
  count: number;
}

export interface RecentAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  product__name: string;
  product__sku: string;
  warehouse__name: string | null;
  created_at: string | null;
}

export interface SalesTrendItem {
  month: string;
  label: string;
  revenue: number;
  sales_count: number;
  paid: number;
  expenses: number;
  base_expenses: number;
  purchases: number;
  profit: number;
}

export interface TopSellingProduct {
  id: string;
  name: string;
  sku: string;
  qty_sold: number;
  revenue: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  category__name: string | null;
  min_stock_level: number;
  purchase_price: number;
  current_stock: number;
  stock_val: number;
}

export interface MovementsSummary30d {
  total: number;
  entries: number;
  exits: number;
  transfers: number;
  adjustments: number;
  entries_value: number;
  exits_value: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  total_stock: number;
  stock_value: number;
}

// Stock par entrepôt
export interface WarehouseStockReport {
  id: string;
  name: string;
  code: string;
  product_count: number;
  total_quantity: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

// Stock par catégorie
export interface CategoryStockReport {
  id: string | null;
  name: string;
  product_count: number;
  total_quantity: number;
  total_value: number;
  low_stock_count: number;
}

// Détail d'un mouvement par type
export interface MovementTypeDetail {
  count: number;
  quantity: number;
  value: number;
}

// Historique des mouvements par jour
export interface DailyMovementHistory {
  date: string;
  in: MovementTypeDetail;
  out: MovementTypeDetail;
  transfer: MovementTypeDetail;
  adjustment: MovementTypeDetail;
}

// Résumé des mouvements
export interface MovementSummary {
  total_movements: number;
  total_in: number;
  total_out: number;
  total_transfers: number;
  total_adjustments: number;
}

// Réponse historique des mouvements
export interface MovementHistoryResponse {
  period_days: number;
  start_date: string;
  history: DailyMovementHistory[];
  summary: MovementSummary;
}

// Produit à faible rotation
export interface LowRotationProduct {
  id: string;
  name: string;
  sku: string;
  category_name: string | null;
  total_stock: number;
  stock_value: number;
  recent_out_movements: number;
  recent_out_quantity: number;
  last_movement_date: string | null;
  days_since_last_movement: number | null;
}

// Réponse produits à faible rotation
export interface LowRotationProductsResponse {
  period_days: number;
  products: LowRotationProduct[];
}

// Résumé d'un inventaire
export interface StockCountReportItem {
  id: string;
  count_number: string;
  count_date: string | null;
  warehouse_name: string | null;
  status: string;
  status_display: string;
  item_count: number;
  items_with_discrepancy: number;
  total_expected: number;
  total_counted: number;
  total_difference: number;
  absolute_difference: number;
  accuracy_rate: number;
}

// Résumé global des inventaires
export interface StockCountsSummary {
  total_counts: number;
  validated_counts: number;
  pending_counts: number;
}

// Réponse résumé des inventaires
export interface StockCountsSummaryResponse {
  stock_counts: StockCountReportItem[];
  summary: StockCountsSummary;
}

// ============================================
// Advanced Reports Types
// ============================================

// Analyse financière
export interface FinancialAnalysisSummary {
  revenue: number;
  cogs: number;
  gross_profit: number;
  gross_margin_percent: number;
  operating_expenses: number;
  base_expenses: number;
  purchases: number;
  net_profit: number;
  net_margin_percent: number;
  sales_count: number;
  avg_ticket: number;
  total_paid: number;
  total_discount: number;
  expenses_count: number;
  purchases_count: number;
}

export interface PaymentMethodDistribution {
  payment_method: string;
  total: number;
  count: number;
  percentage: number;
}

export interface CategoryRevenue {
  category_name: string;
  revenue: number;
  qty_sold: number;
  cogs: number;
  gross_profit: number;
  margin_percent: number;
}

export interface DailySales {
  day: string;
  revenue: number;
  count: number;
}

export interface FinancialAnalysisResponse {
  period: {
    days: number;
    start_date: string;
    end_date: string;
  };
  summary: FinancialAnalysisSummary;
  payment_methods: PaymentMethodDistribution[];
  top_categories: CategoryRevenue[];
  daily_trend: DailySales[];
}

// Analyse ABC/Pareto
export interface ABCProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  revenue: number;
  qty_sold: number;
  sales_count: number;
  revenue_percent: number;
  cumulative_percent: number;
  classification: 'A' | 'B' | 'C';
}

export interface ABCAnalysisDistribution {
  A: {
    count: number;
    revenue: number;
    revenue_percent: number;
  };
  B: {
    count: number;
    revenue: number;
    revenue_percent: number;
  };
  C: {
    count: number;
    revenue: number;
    revenue_percent: number;
  };
}

export interface ABCAnalysisResponse {
  period_days: number;
  total_revenue: number;
  total_products: number;
  products: ABCProduct[];
  abc_distribution: ABCAnalysisDistribution;
}

// Rapport crédits
export interface CreditByCustomer {
  customer_id: string;
  customer_name: string;
  total_debt: number;
  credits_count: number;
  overdue_count: number;
}

export interface RecentCredit {
  id: string;
  sale__sale_number: string;
  customer__name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string | null;
  status: string;
  created_at: string | null;
  days_overdue: number;
}

export interface CreditsReportSummary {
  total_credits: number;
  total_amount: number;
  total_paid: number;
  total_remaining: number;
  pending_count: number;
  partial_count: number;
  overdue_count: number;
  paid_count: number;
  overdue_amount: number;
  recovery_rate: number;
}

export interface CreditsReportResponse {
  summary: CreditsReportSummary;
  by_customer: CreditByCustomer[];
  recent_credits: RecentCredit[];
}

// Performance des ventes
export interface SalesPerformanceSummary {
  total_sales: number;
  total_revenue: number;
  avg_ticket: number;
  total_items_sold: number;
  unique_customers: number;
  conversion_rate: number;
}

export interface SalesByWeekday {
  weekday: number;
  weekday_name: string;
  count: number;
  revenue: number;
}

export interface SalesByHour {
  hour: number;
  count: number;
  revenue: number;
}

export interface TopProductSold {
  product__name: string;
  product__sku: string;
  qty_sold: number;
  revenue: number;
}

export interface SalesPerformanceResponse {
  period: {
    days: number;
    start_date: string;
    end_date: string;
  };
  summary: SalesPerformanceSummary;
  by_weekday: SalesByWeekday[];
  by_hour: SalesByHour[];
  top_products: TopProductSold[];
}

// ============================================
// API Response Types
// ============================================

export interface InventoryApiError {
  error?: string;
  detail?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
