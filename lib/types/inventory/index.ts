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
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  OVERSTOCK = 'overstock',
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
  country?: string;
  contact_person?: string;
  tax_id?: string;
  payment_terms?: string;
  notes?: string;
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
  country?: string;
  contact_person?: string;
  tax_id?: string;
  payment_terms?: string;
  notes?: string;
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
  supplier_name?: string;
  warehouse: string;
  warehouse_name?: string;
  order_number: string;
  order_date: string;
  expected_delivery_date?: string | null;
  actual_delivery_date?: string | null;
  status: OrderStatus;
  status_display?: string;
  total_amount: number;
  notes?: string;
  items?: OrderItem[];
  item_count?: number;
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
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  active_alerts: number;
  pending_orders: number;
  warehouse_count: number;
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
