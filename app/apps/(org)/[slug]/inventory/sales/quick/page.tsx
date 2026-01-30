"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Badge } from "@/components/ui";
import { QuickSelect } from "@/components/ui/quick-select";
import {
  createSale,
  getProducts,
  getWarehouses,
  getCustomers,
  createCustomer,
} from "@/lib/services/inventory";
import type { ProductList, Warehouse, Customer } from "@/lib/types/inventory";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Package,
  X,
  CheckCircle,
  AlertTriangle,
  Banknote,
  CreditCard,
  Smartphone,
  Check,
  Percent,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Loader2,
  Send,
  Save,
  Users,
  Calendar,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface CartItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  // Ajout field pour connaitre le stock restant de ce produit
  remaining_qty?: number;
}

export default function QuickSalePOSPage() {
  const params = useParams();
  const router = useRouter();
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

  // NEW ACTIONS ADDED
  const [savingDraft, setSavingDraft] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [salePreview, setSalePreview] = useState<any>(null);
  const [draftSuccess, setDraftSuccess] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Récupérer la quantité restante pour un produit (par warehouse)
  // Fallback 0 si info non fournie ou non trouvée
  const getRemainingQty = (product: ProductList): number => {
    // Vérifier toutes les propriétés possibles pour le stock
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

  // Correction : property 'warehouse_id' is not on ProductList, donc on ne filtre que si la propriété existe, sinon on ignore.
  const filteredProducts = products.filter((p) => {
    // rectifie l'erreur + filtre entrepôt
    // @ts-ignore
    if (productFilter.warehouseId && (p.warehouse_id ?? p.warehouseId) && (p.warehouse_id ?? p.warehouseId) !== productFilter.warehouseId) {
      return false;
    }
    return searchTerm === ""
      ? true
      : p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Ajout au panier : tient compte de la quantité restante en stock
  const addToCart = useCallback((product: ProductList) => {
    const remaining = getRemainingQty(product);
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        if (nextQty > remaining) {
          setError(
            `Stock insuffisant pour "${product.name}" (restant: ${remaining})`
          );
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: nextQty }
            : item
        );
      }
      if (remaining < 1) {
        setError(
          `Impossible d'ajouter "${product.name}". Stock épuisé !`
        );
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
          discount_type: "percentage",
          discount_value: 0,
          remaining_qty: remaining,
        },
      ];
    });
    setSuccess(null);
    setError(null);
  // eslint-disable-next-line
  }, []);

  // Quantité directe: jamais en négatif, jamais supérieure au stock restant
  const updateQuantityDirect = (productId: string, qty: number) => {
    // Chercher le produit original
    const product = products.find((p) => p.id === productId);
    const remaining = product ? getRemainingQty(product) : 0;
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          let newQty = Math.max(1, Math.floor(qty));
          if (remaining > 0 && newQty > remaining) {
            setError(
              `Stock insuffisant (restant: ${remaining}) pour "${item.product_name}".`
            );
            newQty = remaining;
          }
          return { ...item, quantity: newQty, remaining_qty: remaining };
        }
        return item;
      })
    );
  };

  // UpdateQuantity +delta: jamais < 1, jamais > stock
  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    const remaining = product ? getRemainingQty(product) : 0;
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          let wanted = item.quantity + delta;
          if (wanted < 1) wanted = 1;
          if (remaining > 0 && wanted > remaining) {
            setError(
              `Stock insuffisant (restant: ${remaining}) pour "${item.product_name}".`
            );
            wanted = remaining;
          }
          return { ...item, quantity: wanted, remaining_qty: remaining };
        }
        return item;
      })
    );
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

    // NOUVELLE VALIDATION: Si pas payé, un client est requis (créance)
    if (!isPaid && !selectedCustomer) {
      setError("Un client est requis pour une vente à crédit (non payée)");
      return;
    }

    // Vérifie le stock pour chaque produit au moment du paiement
    for (const item of cart) {
      const product = products.find((p) => p.id === item.product_id);
      const remaining = product ? getRemainingQty(product) : 0;
      if (item.quantity > remaining) {
        setError(
          `Stock insuffisant pour "${item.product_name}". Restant: ${remaining}.`
        );
        return;
      }
      if (item.quantity < 1) {
        setError(
          `Quantité pour "${item.product_name}" invalide !`
        );
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
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la vente");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
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
        if (searchTerm) {
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
    // eslint-disable-next-line
  }, [searchTerm, cart, total, defaultWarehouse, isPaid, paymentMethod, handleInstantSale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-muted/20 overflow-hidden">
      {/* Notifications */}
      {(success || draftSuccess) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{success || draftSuccess}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
            <button onClick={() => setError(null)} className="hover:bg-white/20 p-1 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* LEFT: Products + Filtres */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2">
            {/* Filtre entrepôt */}
            <QuickSelect
              label="Entrepôt"
              items={warehouses.map(w => ({ id: w.id, name: w.name, subtitle: w.city || w.code }))}
              selectedId={productFilter.warehouseId}
              onSelect={(id) => setProductFilter(f => ({ ...f, warehouseId: id as string }))}
              placeholder="Tout entrepôt"
              icon={undefined}
              accentColor="blue"
              createLabel={undefined}
            />
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher produit (nom ou SKU)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg bg-background"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Sélecteur rapide de quantité en push (masqué tant que pas hover) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredProducts.map((product) => {
              // Correction: quantités restantes!
              const remainingQty = getRemainingQty(product);
              const inCart = cart.find((item) => item.product_id === product.id);
              // couleur si épuisé
              const outOfStock = remainingQty <= 0;
              return (
                <div
                  key={product.id}
                  className={cn(
                    "relative group p-3 rounded-lg border text-left transition-all",
                    "hover:shadow-md active:scale-[0.98] bg-background cursor-pointer",
                    inCart
                      ? "border-primary ring-2 ring-primary/30"
                      : outOfStock
                        ? "border-red-400 bg-red-50 dark:bg-red-900/10 text-red-700"
                        : "border-border hover:border-primary/50"
                  )}
                  tabIndex={0}
                >
                  {/* Affiche quantité restante en badge */}
                  <div className="absolute left-1 top-1">
                    <Badge
                      variant={outOfStock ? "error" : "default"}
                      className={cn("text-[10px] py-0.5 px-2", outOfStock && "bg-red-600 text-white")}
                    >
                      Stock: {remainingQty}
                    </Badge>
                  </div>
                  {inCart && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {inCart.quantity}
                    </div>
                  )}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
                      inCart ? "bg-primary/20" : "bg-muted"
                    )}
                    onClick={() => !outOfStock && addToCart(product)}
                    title={outOfStock ? "Stock épuisé" : "Ajouter au panier"}
                    aria-disabled={outOfStock}
                  >
                    <Package className={cn("h-5 w-5", inCart ? "text-primary" : outOfStock ? "text-red-500" : "text-muted-foreground")} />
                  </div>
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  {/* Affichage rapide de référence */}
                  <p className="text-[11px] text-muted-foreground truncate">{product.sku}</p>
                  <p className="text-lg font-bold text-primary mt-1">{formatCurrency(product.selling_price || 0)}</p>
                  {inCart ? (
                    // UI de push quantity qui apparaît sur hover ou focus
                    <div className="absolute opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 left-0 right-0 -bottom-1 translate-y-full transition-opacity flex justify-center items-center gap-1 z-10 bg-white/95 border rounded-b-lg shadow p-1">
                      <button
                        onClick={() => updateQuantity(inCart.product_id, -1)}
                        disabled={inCart.quantity <= 1}
                        className="w-6 h-6 rounded-full border flex items-center justify-center text-primary hover:bg-muted disabled:opacity-20"
                        tabIndex={-1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <Input
                        type="number"
                        min="1"
                        max={remainingQty}
                        value={inCart.quantity}
                        className="w-10 h-6 text-center px-1 border"
                        onChange={e => updateQuantityDirect(
                          inCart.product_id,
                          Math.max(1, Math.min(Number(e.target.value) || 1, remainingQty))
                        )}
                        tabIndex={-1}
                      />
                      <button
                        onClick={() => updateQuantity(inCart.product_id, 1)}
                        disabled={inCart.quantity >= remainingQty}
                        className="w-6 h-6 rounded-full border flex items-center justify-center text-primary hover:bg-muted disabled:opacity-20"
                        tabIndex={-1}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      className={cn(
                        "absolute opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 left-0 right-0 -bottom-1 translate-y-full transition-opacity flex justify-center items-center gap-1 z-10 border rounded-b-lg shadow p-1 text-xs font-bold",
                        outOfStock && "bg-red-100 text-red-600 cursor-not-allowed"
                      )}
                      onClick={() => !outOfStock && addToCart(product)}
                      tabIndex={-1}
                      disabled={outOfStock}
                      type="button"
                    >
                      {outOfStock ? "Épuisé" : "+ Ajouter"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Package className="h-12 w-12 mb-3 opacity-30" />
              <p>Aucun produit trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Actions + Cart */}
      <div className="w-80 lg:w-96 bg-background border-l flex flex-col">
        {/* ACTIONS EN HAUT */}
        <div className="p-4 space-y-3 bg-muted/10 border-b">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">TOTAL</span>
            <div className="text-right">
              <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
              {totalSavings > 0 && (
                <p className="text-xs text-green-600">-{formatCurrency(totalSavings)} économisés</p>
              )}
              {previewLoading && (
                <Loader2 className="h-4 w-4 inline ml-2 animate-spin text-muted-foreground" />
              )}
              {salePreview && !!salePreview.taxes?.length && (
                <p className="text-xs text-amber-700 mt-1">
                  Taxes: {salePreview.taxes.map((tax: any) => (
                    <span key={tax.id}>{tax.name}: {formatCurrency(tax.amount)}</span>
                  ))}
                </p>
              )}
            </div>
          </div>

          {/* Attribuer CLIENT */}
          <div className={cn(
            "rounded-lg transition-all",
            !isPaid && !selectedCustomer && "ring-2 ring-red-500/50 bg-red-50/50 dark:bg-red-900/10"
          )}>
            <QuickSelect
              label="Client"
              items={customers.map(c => ({ id: c.id, name: c.name, subtitle: c.phone || c.email }))}
              selectedId={selectedCustomer}
              onSelect={setSelectedCustomer}
              onCreate={async (name, phone) => {
                setCreatingCustomer(true);
                try {
                  const code = `CLI-${Date.now().toString(36).toUpperCase()}`;
                  const newCustomer = await createCustomer({ name, phone: phone || "", code });
                  setCustomers(prev => [...prev, newCustomer]);
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
              <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 ml-2 font-medium">
                Client requis pour une vente à crédit
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className={cn(
                "w-full h-14 text-lg font-bold rounded-xl transition-all",
                cart.length > 0 && "bg-green-600 hover:bg-green-700"
              )}
              disabled={cart.length === 0 || processing}
              onClick={handleInstantSale}
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                  Traitement...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  ENCAISSER
                </div>
              )}
            </Button>
         
          </div>

          <label className={cn(
            "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all",
            isPaid 
              ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" 
              : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
          )}>
            <button
              type="button"
              onClick={() => setIsPaid(!isPaid)}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center transition-colors shadow-sm",
                isPaid ? "bg-green-600 text-white" : "bg-white dark:bg-gray-800 border-2 border-amber-500"
              )}
            >
              {isPaid ? <Check className="h-3 w-3" /> : (
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
            <div className="flex flex-col">
              <span className={cn(
                "text-sm font-semibold",
                isPaid ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
              )}>
                {isPaid ? "Payé intégralement" : "Vente à Crédit / Créance"}
              </span>
              {!isPaid && (
                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium italic">
                  * Client obligatoire
                </span>
              )}
            </div>
          </label>

          {isPaid && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all",
                  paymentMethod === "cash"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Banknote className="h-4 w-4" />
                <span className="text-xs font-medium">Espèces</span>
              </button>
              <button
                onClick={() => setPaymentMethod("card")}
                className={cn(
                  "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all",
                  paymentMethod === "card"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-xs font-medium">Carte</span>
              </button>
              <button
                onClick={() => setPaymentMethod("mobile_money")}
                className={cn(
                  "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all",
                  paymentMethod === "mobile_money"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-xs font-medium">Mobile</span>
              </button>
            </div>
          )}

          {/* Date d'échéance (si crédit) */}
          {!isPaid && (
            <div className="pt-2 border-t animate-in fade-in slide-in-from-top-1">
              <label className="text-xs font-semibold mb-1.5 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-amber-600" />
                Date d'échéance (Optionnel)
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="h-10 text-sm border-amber-200"
              />
              <p className="text-[10px] text-muted-foreground mt-1 italic">
                Laissez vide si pas de délai spécifique
              </p>
            </div>
          )}

          {/* Remise globale - Masquée par défaut */}
          {cart.length > 0 && (
            <button
              onClick={() => setShowDiscountOptions(!showDiscountOptions)}
              className="w-full flex items-center justify-between p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Remise {globalDiscountValue > 0 && (
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    -{globalDiscountType === "percentage" ? `${globalDiscountValue}%` : formatCurrency(globalDiscountValue)}
                  </Badge>
                )}
              </span>
              {showDiscountOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}

          {showDiscountOptions && cart.length > 0 && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Remise globale</p>
                {/* Toggle % / GNF */}
                <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
                  <button
                    onClick={() => setGlobalDiscountType("percentage")}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded transition-colors",
                      globalDiscountType === "percentage" ? "bg-background shadow" : ""
                    )}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setGlobalDiscountType("fixed")}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded transition-colors",
                      globalDiscountType === "fixed" ? "bg-background shadow" : ""
                    )}
                  >
                    GNF
                  </button>
                </div>
              </div>

              {/* Boutons rapides */}
              {globalDiscountType === "percentage" ? (
                <div className="flex gap-1">
                  {[0, 5, 10, 15, 20].map((disc) => (
                    <button
                      key={disc}
                      onClick={() => setGlobalDiscountValue(disc)}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded transition-colors",
                        globalDiscountValue === disc
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {disc === 0 ? "0%" : `-${disc}%`}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-1">
                  {[0, 1000, 5000, 10000, 20000].map((disc) => (
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
                      {disc === 0 ? "0" : `-${(disc / 1000)}k`}
                    </button>
                  ))}
                </div>
              )}

              {/* Saisie manuelle */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={globalDiscountValue || ""}
                  onChange={(e) => setGlobalDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder={globalDiscountType === "percentage" ? "Ex: 15" : "Ex: 5000"}
                  className="h-8 text-sm"
                />
                <span className="flex items-center text-xs text-muted-foreground">
                  {globalDiscountType === "percentage" ? "%" : "GNF"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cart Header */}
        <div className="px-4 py-2 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Panier</span>
            {itemCount > 0 && <Badge variant="secondary" className="text-xs">{itemCount}</Badge>}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { setCart([]); setGlobalDiscountValue(0); }}>
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          )}
        </div>

        {/* Cart Items EN BAS */}
        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-xs">Panier vide</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => {
                const itemSubtotal = item.quantity * item.unit_price;
                const itemDiscountAmount = item.discount_type === "percentage"
                  ? itemSubtotal * (item.discount_value / 100)
                  : item.discount_value;
                const itemTotal = Math.max(0, itemSubtotal - itemDiscountAmount);

                // secure that quantity can't be > remaining_qty
                const product = products.find(p => p.id === item.product_id);
                const remainingQty = product ? getRemainingQty(product) : (item.remaining_qty || 0);

                return (
                  <div key={item.product_id} className={cn("p-2 rounded-lg", remainingQty <= 0 ? "bg-red-100" : "bg-muted/30")}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex flex-col flex-1 pr-2">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        {item.product_sku && (
                          <span className="text-[10px] text-muted-foreground truncate">{item.product_sku}</span>
                        )}
                        <span className={cn("text-[10px]", remainingQty <= 0 ? "text-red-500" : "text-muted-foreground")}>
                          Stock restant: {remainingQty}
                        </span>
                      </div>
                      <button onClick={() => removeFromCart(item.product_id)} className="text-red-500 hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.product_id, -1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-30"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <Input
                          type="number"
                          min={1}
                          max={remainingQty}
                          value={item.quantity}
                          className="w-10 h-6 text-center px-1 border"
                          onChange={e =>
                            updateQuantityDirect(
                              item.product_id,
                              Math.max(1, Math.min(Number(e.target.value) || 1, remainingQty))
                            )
                          }
                        />
                        <button
                          onClick={() => updateQuantity(item.product_id, 1)}
                          disabled={item.quantity >= remainingQty}
                          className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-30"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm">{formatCurrency(itemTotal)}</span>
                        {item.discount_value > 0 && (
                          <p className="text-[10px] text-green-600">
                            -{item.discount_type === "percentage" ? `${item.discount_value}%` : formatCurrency(item.discount_value)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Remise par article - Saisie complète */}
                    {showDiscountOptions && (
                      <div className="mt-2 pt-2 border-t border-dashed flex items-center gap-1">
                        <Percent className="h-3 w-3 text-muted-foreground shrink-0" />
                        {/* Boutons rapides */}
                        {[0, 5, 10].map((d) => (
                          <button
                            key={d}
                            onClick={() => updateItemDiscount(item.product_id, "percentage", d)}
                            className={cn(
                              "w-6 h-6 text-[10px] rounded font-medium transition-colors shrink-0",
                              item.discount_type === "percentage" && item.discount_value === d
                                ? "bg-green-600 text-white"
                                : "bg-muted hover:bg-muted/80"
                            )}
                          >
                            {d}%
                          </button>
                        ))}
                        {/* Séparateur */}
                        <span className="text-muted-foreground text-xs mx-1">|</span>
                        {/* Saisie manuelle */}
                        <input
                          type="number"
                          min="0"
                          value={item.discount_value || ""}
                          onChange={(e) =>
                            updateItemDiscount(item.product_id, item.discount_type, parseFloat(e.target.value) || 0)
                          }
                          placeholder="..."
                          className="w-12 h-6 text-[10px] text-center rounded border bg-background px-1"
                        />
                        {/* Toggle type */}
                        <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded shrink-0">
                          <button
                            onClick={() => updateItemDiscount(item.product_id, "percentage", item.discount_value)}
                            className={cn(
                              "px-1 py-0.5 text-[10px] font-medium rounded transition-colors",
                              item.discount_type === "percentage" ? "bg-background shadow" : ""
                            )}
                          >
                            %
                          </button>
                          <button
                            onClick={() => updateItemDiscount(item.product_id, "fixed", item.discount_value)}
                            className={cn(
                              "px-1 py-0.5 text-[10px] font-medium rounded transition-colors",
                              item.discount_type === "fixed" ? "bg-background shadow" : ""
                            )}
                          >
                            GNF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-2 border-t text-center">
          <p className="text-xs text-muted-foreground">
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Entrée</kbd> encaisser
          </p>
        </div>
      </div>
    </div>
  );
}
