"use client";

import { Can } from "@/components/apps/common";
import { Badge, Button, Input } from "@/components/ui";
import { QuickSelect } from "@/components/ui/quick-select";
import {
  createCustomer,
  createSale,
  getCustomers,
  getProducts,
  getWarehouses,
} from "@/lib/services/inventory";
import type { Customer, ProductList, Warehouse } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  Banknote,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CreditCard,
  Edit3,
  Loader2,
  Minus,
  Package,
  Percent,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface CartItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  original_price: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  remaining_qty?: number;
}

export default function QuickSalePOSPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [products, setProducts] = useState<ProductList[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [defaultWarehouse, setDefaultWarehouse] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaid, setIsPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>();

  // Mobile cart visibility
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Filtrage avancé
  const [productFilter, setProductFilter] = useState<{
    warehouseId: string;
  }>({
    warehouseId: "",
  });

  // Remise globale
  const [globalDiscountType, setGlobalDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0);
  const [showDiscountOptions, setShowDiscountOptions] = useState(false);

  // Ajout client via QuickSelect
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Édition prix
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Récupérer la quantité restante pour un produit
  const getRemainingQty = (product: ProductList): number => {
    if ("remaining_qty" in product && typeof (product as any).remaining_qty === "number") {
      return (product as any).remaining_qty;
    }
    if ("total_stock" in product && typeof (product as any).total_stock === "number") {
      return (product as any).total_stock;
    }
    if ("stock" in product && typeof (product as any).stock === "number") {
      return (product as any).stock;
    }
    if ("qty" in product && typeof (product as any).qty === "number") {
      return (product as any).qty;
    }
    return 0;
  };

  const filteredProducts = products.filter((p) => {
    // @ts-ignore
    if (productFilter.warehouseId && (p.warehouse_id ?? p.warehouseId) && (p.warehouse_id ?? p.warehouseId) !== productFilter.warehouseId) {
      return false;
    }
    return searchTerm === ""
      ? true
      : p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Ajout au panier
  const addToCart = useCallback((product: ProductList) => {
    const remaining = getRemainingQty(product);
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        if (nextQty > remaining) {
          setError(`Stock insuffisant pour "${product.name}" (restant: ${remaining})`);
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: nextQty }
            : item
        );
      }
      if (remaining < 1) {
        setError(`Impossible d'ajouter "${product.name}". Stock épuisé !`);
        return prev;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: 1,
          unit_price: product.selling_price || 0,
          original_price: product.selling_price || 0,
          discount_type: "percentage",
          discount_value: 0,
          remaining_qty: remaining,
        },
      ];
    });
    setSuccess(null);
    setError(null);
  }, []);

  // Quantité directe
  const updateQuantityDirect = (productId: string, qty: number) => {
    const product = products.find((p) => p.id === productId);
    const remaining = product ? getRemainingQty(product) : 0;
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          let newQty = Math.max(1, Math.floor(qty));
          if (remaining > 0 && newQty > remaining) {
            setError(`Stock insuffisant (restant: ${remaining}) pour "${item.product_name}".`);
            newQty = remaining;
          }
          return { ...item, quantity: newQty, remaining_qty: remaining };
        }
        return item;
      })
    );
  };

  // UpdateQuantity +delta
  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    const remaining = product ? getRemainingQty(product) : 0;
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          let wanted = item.quantity + delta;
          if (wanted < 1) wanted = 1;
          if (remaining > 0 && wanted > remaining) {
            setError(`Stock insuffisant (restant: ${remaining}) pour "${item.product_name}".`);
            wanted = remaining;
          }
          return { ...item, quantity: wanted, remaining_qty: remaining };
        }
        return item;
      })
    );
  };

  // Mise à jour du prix unitaire
  const updateUnitPrice = (productId: string, price: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, unit_price: Math.max(0, price) }
          : item
      )
    );
  };

  // Réinitialiser au prix original
  const resetPrice = (productId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, unit_price: item.original_price }
          : item
      )
    );
    setEditingPriceId(null);
  };

  const updateItemDiscount = (productId: string, discountType: "percentage" | "fixed", discountValue: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, discount_type: discountType, discount_value: Math.max(0, discountValue) }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  // Calculs
  const subtotal = cart.reduce((acc, item) => {
    const itemTotal = item.quantity * item.unit_price;
    const itemDiscount = item.discount_type === "percentage"
      ? itemTotal * (item.discount_value / 100)
      : item.discount_value;
    return acc + Math.max(0, itemTotal - itemDiscount);
  }, 0);

  const globalDiscountAmount = globalDiscountType === "percentage"
    ? subtotal * (globalDiscountValue / 100)
    : globalDiscountValue;
  const total = Math.max(0, subtotal - globalDiscountAmount);
  const totalSavings = cart.reduce((acc, item) => {
    const itemTotal = item.quantity * item.unit_price;
    const itemDiscount = item.discount_type === "percentage"
      ? itemTotal * (item.discount_value / 100)
      : item.discount_value;
    return acc + itemDiscount;
  }, 0) + globalDiscountAmount;

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // --- ENCAISSER DIRECTEMENT ---
  const handleInstantSale = async () => {
    if (cart.length === 0) return;
    if (!defaultWarehouse) {
      setError("Aucun entrepôt configuré");
      return;
    }

    if (!isPaid && !selectedCustomer) {
      setError("Un client est requis pour une vente à crédit (non payée)");
      return;
    }

    for (const item of cart) {
      const product = products.find((p) => p.id === item.product_id);
      const remaining = product ? getRemainingQty(product) : 0;
      if (item.quantity > remaining) {
        setError(`Stock insuffisant pour "${item.product_name}". Restant: ${remaining}.`);
        return;
      }
      if (item.quantity < 1) {
        setError(`Quantité pour "${item.product_name}" invalide !`);
        return;
      }
    }

    try {
      setProcessing(true);
      setError(null);

      await createSale({
        warehouse: defaultWarehouse,
        customer: selectedCustomer || undefined,
        payment_method: isPaid ? paymentMethod : "credit",
        paid_amount: isPaid ? total : 0,
        is_credit_sale: !isPaid,
        due_date: !isPaid ? dueDate : undefined,
        discount_type: globalDiscountType,
        discount_value: globalDiscountValue,
        items: cart.map((item) => ({
          product: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
        })),
      });

      setSuccess(`Vente de ${formatCurrency(total)} enregistrée !`);
      setCart([]);
      setIsPaid(true);
      setPaymentMethod("cash");
      setGlobalDiscountValue(0);
      setGlobalDiscountType("percentage");
      setShowDiscountOptions(false);
      setSelectedCustomer("");
      setDueDate(undefined);
      setShowMobileCart(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la vente");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, warehousesData, customersData] = await Promise.all([
        getProducts({ is_active: true }),
        getWarehouses(),
        getCustomers({ is_active: true }),
      ]);
      setProducts(productsData);
      setWarehouses(warehousesData);
      setCustomers(customersData);
      if (warehousesData.length > 0) {
        setDefaultWarehouse(warehousesData[0].id);
        setProductFilter({ warehouseId: warehousesData[0].id });
      }
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.ctrlKey && cart.length > 0) {
        const isInputFocused = document.activeElement?.tagName === "INPUT";
        if (!isInputFocused) {
          e.preventDefault();
          handleInstantSale();
        }
      }
      if (e.key === "Escape") {
        if (showMobileCart) {
          setShowMobileCart(false);
        } else if (searchTerm) {
          setSearchTerm("");
          searchInputRef.current?.blur();
        } else if (cart.length > 0) {
          setCart([]);
          setGlobalDiscountValue(0);
        }
      }
      if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchTerm, cart, total, defaultWarehouse, isPaid, paymentMethod, showMobileCart]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
   <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_SALES} showMessage>
       <div className="h-screen flex flex-col lg:flex-row bg-muted/30 overflow-hidden">
      {/* Notifications */}
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-red-600 text-white px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:bg-white/20 p-1 rounded">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* LEFT: Products */}
      <div className="flex-1 flex flex-col p-3 lg:p-4 overflow-hidden">
        {/* Header + Search */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center gap-2">
            <QuickSelect
              label="Entrepôt"
              items={warehouses.map(w => ({ id: w.id, name: w.name, subtitle: w.city || w.code }))}
              selectedId={productFilter.warehouseId}
              onSelect={(id) => setProductFilter(f => ({ ...f, warehouseId: id as string }))}
              placeholder="Tout"
              icon={undefined}
              accentColor="blue"
              createLabel={undefined}
            />
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm bg-background"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {filteredProducts.map((product) => {
              const remainingQty = getRemainingQty(product);
              const inCart = cart.find((item) => item.product_id === product.id);
              const outOfStock = remainingQty <= 0;
              
              return (
                <button
                  key={product.id}
                  onClick={() => !outOfStock && addToCart(product)}
                  disabled={outOfStock}
                  className={cn(
                    "relative p-3 rounded-lg border text-left transition-all",
                    "hover:shadow-sm active:scale-[0.98] bg-background",
                    inCart
                      ? "border-primary/50 bg-primary/5"
                      : outOfStock
                        ? "border-red-200 bg-red-50/50 dark:bg-red-950/10 opacity-60"
                        : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  {/* Stock badge */}
                  <div className="absolute left-1.5 top-1.5">
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded",
                      outOfStock 
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                        : remainingQty <= 5
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {remainingQty}
                    </span>
                  </div>

                  {/* Cart quantity badge */}
                  {inCart && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      {inCart.quantity}
                    </div>
                  )}

                  <div className="pt-4">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{product.sku}</p>
                    <p className="text-base font-bold text-primary mt-1.5">{formatCurrency(product.selling_price || 0)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Aucun produit trouvé</p>
            </div>
          )}
        </div>

        {/* Mobile Cart Toggle */}
        <div className="lg:hidden mt-3">
          <Button
            onClick={() => setShowMobileCart(true)}
            className={cn(
              "w-full h-12 text-base font-semibold",
              cart.length > 0 ? "bg-primary" : "bg-muted text-muted-foreground"
            )}
            disabled={cart.length === 0}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Panier ({itemCount})
            {cart.length > 0 && (
              <span className="ml-auto">{formatCurrency(total)}</span>
            )}
          </Button>
        </div>
      </div>

      {/* RIGHT: Cart Panel - Desktop */}
      <div className="hidden lg:flex w-80 xl:w-96 bg-background border-l flex-col">
        <CartPanel
          cart={cart}
          products={products}
          customers={customers}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          isPaid={isPaid}
          setIsPaid={setIsPaid}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          dueDate={dueDate}
          setDueDate={setDueDate}
          globalDiscountType={globalDiscountType}
          setGlobalDiscountType={setGlobalDiscountType}
          globalDiscountValue={globalDiscountValue}
          setGlobalDiscountValue={setGlobalDiscountValue}
          showDiscountOptions={showDiscountOptions}
          setShowDiscountOptions={setShowDiscountOptions}
          creatingCustomer={creatingCustomer}
          setCreatingCustomer={setCreatingCustomer}
          editingPriceId={editingPriceId}
          setEditingPriceId={setEditingPriceId}
          total={total}
          subtotal={subtotal}
          totalSavings={totalSavings}
          itemCount={itemCount}
          processing={processing}
          handleInstantSale={handleInstantSale}
          updateQuantity={updateQuantity}
          updateQuantityDirect={updateQuantityDirect}
          updateUnitPrice={updateUnitPrice}
          resetPrice={resetPrice}
          updateItemDiscount={updateItemDiscount}
          removeFromCart={removeFromCart}
          setCart={setCart}
          getRemainingQty={getRemainingQty}
          createCustomer={createCustomer}
          setCustomers={setCustomers}
        />
      </div>

      {/* Mobile Cart Overlay */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <button onClick={() => setShowMobileCart(false)} className="p-1.5 -ml-1.5 hover:bg-muted rounded-lg">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-semibold">Panier</h2>
            <Badge className="ml-auto">{itemCount} articles</Badge>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CartPanel
              cart={cart}
              products={products}
              customers={customers}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              isPaid={isPaid}
              setIsPaid={setIsPaid}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              dueDate={dueDate}
              setDueDate={setDueDate}
              globalDiscountType={globalDiscountType}
              setGlobalDiscountType={setGlobalDiscountType}
              globalDiscountValue={globalDiscountValue}
              setGlobalDiscountValue={setGlobalDiscountValue}
              showDiscountOptions={showDiscountOptions}
              setShowDiscountOptions={setShowDiscountOptions}
              creatingCustomer={creatingCustomer}
              setCreatingCustomer={setCreatingCustomer}
              editingPriceId={editingPriceId}
              setEditingPriceId={setEditingPriceId}
              total={total}
              subtotal={subtotal}
              totalSavings={totalSavings}
              itemCount={itemCount}
              processing={processing}
              handleInstantSale={handleInstantSale}
              updateQuantity={updateQuantity}
              updateQuantityDirect={updateQuantityDirect}
              updateUnitPrice={updateUnitPrice}
              resetPrice={resetPrice}
              updateItemDiscount={updateItemDiscount}
              removeFromCart={removeFromCart}
              setCart={setCart}
              getRemainingQty={getRemainingQty}
              createCustomer={createCustomer}
              setCustomers={setCustomers}
              isMobile
            />
          </div>
        </div>
      )}
    </div>
   </Can>
  );
}

// Cart Panel Component
function CartPanel({
  cart,
  products,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  isPaid,
  setIsPaid,
  paymentMethod,
  setPaymentMethod,
  dueDate,
  setDueDate,
  globalDiscountType,
  setGlobalDiscountType,
  globalDiscountValue,
  setGlobalDiscountValue,
  showDiscountOptions,
  setShowDiscountOptions,
  creatingCustomer,
  setCreatingCustomer,
  editingPriceId,
  setEditingPriceId,
  total,
  subtotal,
  totalSavings,
  itemCount,
  processing,
  handleInstantSale,
  updateQuantity,
  updateQuantityDirect,
  updateUnitPrice,
  resetPrice,
  updateItemDiscount,
  removeFromCart,
  setCart,
  getRemainingQty,
  createCustomer: createCustomerFn,
  setCustomers,
  isMobile = false,
}: any) {
  return (
    <div className="flex flex-col h-full">
      {/* Summary + Actions */}
      <div className="p-4 space-y-3 border-b bg-muted/20">
        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">TOTAL</span>
          <div className="text-right">
            <span className="text-2xl font-bold">{formatCurrency(total)}</span>
            {totalSavings > 0 && (
              <p className="text-xs text-emerald-600">-{formatCurrency(totalSavings)} économisés</p>
            )}
          </div>
        </div>

        {/* Client */}
        <div className={cn(
          "rounded-lg transition-all",
          !isPaid && !selectedCustomer && "ring-2 ring-red-500/30 bg-red-50/30 dark:bg-red-950/20 p-1"
        )}>
          <QuickSelect
            label="Client"
            items={customers.map((c: any) => ({ id: c.id, name: c.name, subtitle: c.phone || c.email }))}
            selectedId={selectedCustomer}
            onSelect={setSelectedCustomer}
            onCreate={async (name: string, phone?: string) => {
              setCreatingCustomer(true);
              try {
                const code = `CLI-${Date.now().toString(36).toUpperCase()}`;
                const newCustomer = await createCustomerFn({ name, phone: phone || "", code });
                setCustomers((prev: any) => [...prev, newCustomer]);
                setSelectedCustomer(newCustomer.id);
                return { id: newCustomer.id, name: newCustomer.name };
              } finally {
                setCreatingCustomer(false);
              }
            }}
            placeholder="Anonyme..."
            icon={Users}
            accentColor="green"
            createLabel="Créer"
            extraFieldLabel="Téléphone"
            disabled={creatingCustomer}
          />
          {!isPaid && !selectedCustomer && (
            <p className="text-[10px] text-red-600 mt-1 ml-1 font-medium">
              Client requis pour vente à crédit
            </p>
          )}
        </div>

        {/* Pay Button */}
        <Button
          className={cn(
            "w-full h-12 text-base font-semibold rounded-lg transition-all",
            cart.length > 0 && "bg-emerald-600 hover:bg-emerald-700"
          )}
          disabled={cart.length === 0 || processing}
          onClick={handleInstantSale}
        >
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Receipt className="h-5 w-5 mr-2" />
              ENCAISSER
            </>
          )}
        </Button>

        {/* Paid Toggle */}
        <button
          type="button"
          onClick={() => setIsPaid(!isPaid)}
          className={cn(
            "w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left",
            isPaid 
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
              : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded flex items-center justify-center shrink-0",
            isPaid ? "bg-emerald-600" : "border-2 border-amber-500"
          )}>
            {isPaid && <Check className="h-3 w-3 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <span className={cn(
              "text-sm font-medium block",
              isPaid ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
            )}>
              {isPaid ? "Payé intégralement" : "Vente à crédit"}
            </span>
          </div>
        </button>

        {/* Payment Methods */}
        {isPaid && (
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: "cash", label: "Espèces", icon: Banknote },
              { value: "card", label: "Carte", icon: CreditCard },
              { value: "mobile_money", label: "Mobile", icon: Smartphone },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setPaymentMethod(value)}
                className={cn(
                  "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all",
                  paymentMethod === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Due Date */}
        {!isPaid && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Échéance (optionnel)
            </label>
            <Input
              type="date"
              value={dueDate || ""}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="h-9 text-sm"
            />
          </div>
        )}

        {/* Discount Toggle */}
        {cart.length > 0 && (
          <button
            onClick={() => setShowDiscountOptions(!showDiscountOptions)}
            className="w-full flex items-center justify-between p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Remise
              {globalDiscountValue > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                  -{globalDiscountType === "percentage" ? `${globalDiscountValue}%` : formatCurrency(globalDiscountValue)}
                </Badge>
              )}
            </span>
            {showDiscountOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}

        {/* Discount Options */}
        {showDiscountOptions && cart.length > 0 && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Remise globale</p>
              <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded">
                {["percentage", "fixed"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setGlobalDiscountType(type as any)}
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded transition-colors",
                      globalDiscountType === type ? "bg-background shadow-sm" : ""
                    )}
                  >
                    {type === "percentage" ? "%" : "GNF"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {/* Quick preset buttons */}
              <div className="flex gap-1">
                {(globalDiscountType === "percentage" ? [0, 5, 10, 15, 20] : [0, 1000, 5000, 10000]).map((disc) => (
                  <button
                    key={disc}
                    onClick={() => setGlobalDiscountValue(disc)}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-medium rounded transition-colors",
                      globalDiscountValue === disc
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {disc === 0 ? "0" : globalDiscountType === "percentage" ? `-${disc}%` : `-${disc/1000}k`}
                  </button>
                ))}
              </div>

              {/* Manual input field */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground shrink-0">Ou saisir:</span>
                <Input
                  type="number"
                  min={0}
                  max={globalDiscountType === "percentage" ? 100 : undefined}
                  step={globalDiscountType === "percentage" ? 0.1 : 100}
                  value={globalDiscountValue}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    const maxValue = globalDiscountType === "percentage" ? 100 : subtotal;
                    setGlobalDiscountValue(Math.max(0, Math.min(value, maxValue)));
                  }}
                  placeholder={globalDiscountType === "percentage" ? "%" : "GNF"}
                  className="h-8 text-sm flex-1"
                />
                <span className="text-xs text-muted-foreground shrink-0 w-8">
                  {globalDiscountType === "percentage" ? "%" : "GNF"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
            <ShoppingCart className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Panier vide</p>
            <p className="text-xs mt-1">Sélectionnez des produits</p>
          </div>
        ) : (
          <div className="divide-y">
            {cart.map((item:any) => {
              const product = products.find((p: any) => p.id === item.product_id);
              const remainingQty = product ? getRemainingQty(product) : (item.remaining_qty || 0);
              const itemSubtotal = item.quantity * item.unit_price;
              const itemDiscountAmount = item.discount_type === "percentage"
                ? itemSubtotal * (item.discount_value / 100)
                : item.discount_value;
              const itemTotal = Math.max(0, itemSubtotal - itemDiscountAmount);
              const priceModified = item.unit_price !== item.original_price;

              return (
                <div key={item.product_id} className="p-3 hover:bg-muted/20">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product_name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.product_sku}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product_id)} 
                      className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Price Row */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-muted-foreground shrink-0">Prix:</span>
                    {editingPriceId === item.product_id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          type="number"
                          min={0}
                          value={item.unit_price}
                          onChange={(e) => updateUnitPrice(item.product_id, parseFloat(e.target.value) || 0)}
                          className="h-7 w-24 text-xs"
                          autoFocus
                        />
                        <button
                          onClick={() => setEditingPriceId(null)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        {priceModified && (
                          <button
                            onClick={() => resetPrice(item.product_id)}
                            className="text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingPriceId(item.product_id)}
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          priceModified ? "text-amber-600" : "text-foreground"
                        )}
                      >
                        {formatCurrency(item.unit_price)}
                        <Edit3 className="h-3 w-3 opacity-50" />
                        {priceModified && (
                          <span className="text-[10px] line-through text-muted-foreground">
                            {formatCurrency(item.original_price)}
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Quantity + Total Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <Input
                        type="number"
                        min={1}
                        max={remainingQty}
                        value={item.quantity}
                        className="w-12 h-7 text-center text-sm px-1"
                        onChange={e => updateQuantityDirect(
                          item.product_id,
                          Math.max(1, Math.min(Number(e.target.value) || 1, remainingQty))
                        )}
                      />
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        disabled={item.quantity >= remainingQty}
                        className="w-7 h-7 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="text-[10px] text-muted-foreground ml-1">/{remainingQty}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-sm">{formatCurrency(itemTotal)}</span>
                      {item.discount_value > 0 && (
                        <p className="text-[10px] text-emerald-600">
                          -{item.discount_type === "percentage" ? `${item.discount_value}%` : formatCurrency(item.discount_value)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Item Discount */}
                  {showDiscountOptions && (
                    <div className="mt-2 pt-2 border-t border-dashed space-y-1.5">
                      {/* Quick percentage buttons */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <Percent className="h-3 w-3 text-muted-foreground shrink-0" />
                        {[0, 5, 10].map((d) => (
                          <button
                            key={d}
                            onClick={() => updateItemDiscount(item.product_id, "percentage", d)}
                            className={cn(
                              "w-6 h-6 text-[10px] rounded font-medium transition-colors shrink-0",
                              item.discount_type === "percentage" && item.discount_value === d
                                ? "bg-emerald-600 text-white"
                                : "bg-muted hover:bg-muted/80"
                            )}
                          >
                            {d}%
                          </button>
                        ))}
                      </div>

                      {/* Manual input with type selector */}
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded shrink-0">
                          {["percentage", "fixed"].map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                updateItemDiscount(item.product_id, type as any, item.discount_value);
                              }}
                              className={cn(
                                "px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors",
                                item.discount_type === type ? "bg-background shadow-sm" : ""
                              )}
                            >
                              {type === "percentage" ? "%" : "GNF"}
                            </button>
                          ))}
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={item.discount_type === "percentage" ? 100 : itemSubtotal}
                          step={item.discount_type === "percentage" ? 0.1 : 100}
                          value={item.discount_value}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            const maxValue = item.discount_type === "percentage" ? 100 : itemSubtotal;
                            updateItemDiscount(item.product_id, item.discount_type, Math.max(0, Math.min(value, maxValue)));
                          }}
                          placeholder={item.discount_type === "percentage" ? "%" : "GNF"}
                          className="h-6 text-xs flex-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isMobile && (
        <div className="p-2 border-t text-center bg-muted/20">
          <p className="text-[10px] text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Entrée</kbd> encaisser
          </p>
        </div>
      )}
    </div>
  );
}
