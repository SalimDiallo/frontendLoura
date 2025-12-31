// Sales & Commercial Documents Types

// ============================================
// Enums & Constants
// ============================================

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  CHECK = 'check',
  CARD = 'card',
  CREDIT = 'credit',
  OTHER = 'other',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum ProformaStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
}

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  SENT = 'sent',
  PARTIAL = 'partial',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliveryNoteStatus {
  PENDING = 'pending',
  READY = 'ready',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum CreditSaleStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

// ============================================
// Customer
// ============================================

export interface Customer {
  id: string;
  organization: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  secondary_phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  credit_limit: number;
  total_debt?: number;
  total_sales?: number;
  total_purchases?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  secondary_phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  credit_limit?: number;
  notes?: string;
  is_active?: boolean;
}

export interface CustomerUpdate extends Partial<CustomerCreate> {}

// ============================================
// Sale & SaleItem
// ============================================

export interface SaleItem {
  id: string;
  sale: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_type: DiscountType | string;
  discount_value: number;
  discount_amount: number;
  total: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItemCreate {
  product: string;
  quantity: number;
  unit_price: number;
  discount_type?: DiscountType | string;
  discount_value?: number;
}

export interface Sale {
  id: string;
  organization: string;
  customer?: string | null;
  customer_name?: string;
  warehouse: string;
  warehouse_name?: string;
  sale_number: string;
  sale_date: string;
  subtotal: number;
  subtotal_amount: number;
  discount_type: DiscountType | string;
  discount_value: number;
  discount_amount: number;
  cart_discount_type?: string;
  cart_discount_value?: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount?: number;
  payment_status: PaymentStatus | string;
  payment_status_display?: string;
  payment_method: PaymentMethod | string;
  payment_method_display?: string;
  is_credit: boolean;
  is_credit_sale: boolean;
  credit_due_date?: string;
  notes?: string;
  items?: SaleItem[];
  payments?: Payment[];
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SaleCreate {
  customer?: string | null;
  warehouse: string;
  sale_number?: string;
  sale_date?: string;
  discount_type?: DiscountType | string;
  discount_value?: number;
  cart_discount_type?: string;
  cart_discount_value?: number;
  tax_rate?: number;
  paid_amount?: number;
  payment_method?: PaymentMethod | string;
  is_credit?: boolean;
  is_credit_sale?: boolean;
  credit_due_date?: string;
  notes?: string;
  items?: SaleItemCreate[];
}

export interface SaleUpdate extends Partial<SaleCreate> {}

export interface SaleList {
  id: string;
  sale_number: string;
  customer_name?: string;
  warehouse_name?: string;
  sale_date: string;
  total_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  payment_status_display?: string;
  item_count?: number;
}

// ============================================
// Payment
// ============================================

export interface Payment {
  id: string;
  organization: string;
  sale?: string | null;
  sale_number?: string;
  receipt_number: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_method_display?: string;
  reference?: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreate {
  sale?: string;
  amount: number;
  payment_method?: PaymentMethod;
  reference?: string;
  notes?: string;
}

// ============================================
// Expense & ExpenseCategory
// ============================================

export interface ExpenseCategory {
  id: string;
  organization: string;
  name: string;
  description?: string;
  expense_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategoryCreate {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface Expense {
  id: string;
  organization: string;
  category?: string | null;
  category_name?: string;
  expense_number?: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: PaymentMethod;
  payment_method_display?: string;
  reference?: string;
  beneficiary?: string;
  notes?: string;
  receipt_image?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  category_id?: string | null;
  description: string;
  amount: number;
  expense_date: string;
  payment_method?: PaymentMethod | string;
  reference?: string;
  beneficiary?: string;
  notes?: string;
  receipt_image?: string;
}

export interface ExpenseUpdate extends Partial<ExpenseCreate> {}

export interface ExpenseSummary {
  daily_total: number;
  monthly_total: number;
  yearly_total: number;
  by_category: Array<{
    category__name: string | null;
    total: number;
    count: number;
  }>;
}

// ============================================
// ProformaInvoice & ProformaItem
// ============================================

export interface ProformaItem {
  id: string;
  proforma: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface ProformaItemCreate {
  product: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
}

export interface ProformaInvoice {
  id: string;
  organization: string;
  customer?: string | null;
  customer_name_display?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  proforma_number: string;
  issue_date: string;
  validity_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: ProformaStatus;
  status_display?: string;
  is_expired?: boolean;
  conditions?: string;
  notes?: string;
  converted_sale?: string | null;
  items?: ProformaItem[];
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProformaCreate {
  customer?: string | null;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  proforma_number?: string;
  issue_date?: string;
  validity_date?: string;
  validity_days?: number;
  discount_amount?: number;
  tax_amount?: number;
  status?: ProformaStatus;
  conditions?: string;
  notes?: string;
  items?: ProformaItemCreate[];
}

export interface ProformaUpdate extends Partial<ProformaCreate> {}

// ============================================
// PurchaseOrder & PurchaseOrderItem
// ============================================

export interface PurchaseOrderItem {
  id: string;
  purchase_order: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  received_quantity: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItemCreate {
  product: string;
  quantity: number;
  unit_price: number;
}

export interface PurchaseOrder {
  id: string;
  organization: string;
  supplier: string;
  supplier_name?: string;
  warehouse: string;
  warehouse_name?: string;
  order_number: string;
  order_date: string;
  expected_delivery_date?: string | null;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  status: PurchaseOrderStatus;
  status_display?: string;
  payment_terms?: string;
  notes?: string;
  items?: PurchaseOrderItem[];
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderCreate {
  supplier: string;
  warehouse: string;
  order_number?: string;
  order_date: string;
  expected_delivery_date?: string | null;
  shipping_cost?: number;
  tax_amount?: number;
  status?: PurchaseOrderStatus;
  payment_terms?: string;
  notes?: string;
  items?: PurchaseOrderItemCreate[];
}

// ============================================
// DeliveryNote & DeliveryNoteItem
// ============================================

export interface DeliveryNoteItem {
  id: string;
  delivery_note: string;
  product: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  delivered_quantity: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryNoteItemCreate {
  product: string;
  quantity: number;
  notes?: string;
}

export interface DeliveryNote {
  id: string;
  organization: string;
  sale: string;
  sale_number?: string;
  delivery_number: string;
  delivery_date: string;
  recipient_name: string;
  recipient_phone?: string;
  delivery_address: string;
  carrier_name?: string;
  driver_name?: string;
  vehicle_info?: string;
  status: DeliveryNoteStatus;
  status_display?: string;
  sender_signature?: string;
  recipient_signature?: string;
  delivered_at?: string | null;
  notes?: string;
  items?: DeliveryNoteItem[];
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryNoteCreate {
  sale: string;
  delivery_number?: string;
  delivery_date: string;
  recipient_name: string;
  recipient_phone?: string;
  delivery_address: string;
  carrier_name?: string;
  driver_name?: string;
  vehicle_info?: string;
  notes?: string;
  items?: DeliveryNoteItemCreate[];
}

// ============================================
// CreditSale & CreditPayment
// ============================================

export interface CreditPayment {
  id: string;
  credit_sale: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_method_display?: string;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditPaymentCreate {
  payment_date?: string;
  amount: number;
  payment_method?: PaymentMethod | string;
  reference?: string;
  notes?: string;
}

export interface CreditSale {
  id: string;
  organization: string;
  sale: string;
  sale_number?: string;
  customer: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  grace_period_days: number;
  status: CreditSaleStatus;
  status_display?: string;
  last_reminder_date?: string | null;
  reminder_count: number;
  days_until_due?: number;
  is_overdue?: boolean;
  notes?: string;
  payments?: CreditPayment[];
  payment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreditSaleSummary {
  total_credit: number;
  overdue_count: number;
  overdue_amount: number;
  due_soon_count: number;
  by_customer: Array<{
    customer__name: string;
    total: number;
    count: number;
  }>;
}
