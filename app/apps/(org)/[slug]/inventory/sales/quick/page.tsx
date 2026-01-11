"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button, Input, Badge } from "@/components/ui";
import { createSale, getProducts, getWarehouses } from "@/lib/services/inventory";
import type { ProductList, Warehouse } from "@/lib/types/inventory";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;
}

export default function QuickSalePOSPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [products, setProducts] = useState<ProductList[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [defaultWarehouse, setDefaultWarehouse] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaid, setIsPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Remise globale
  const [globalDiscountType, setGlobalDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0);
  const [showDiscountOptions, setShowDiscountOptions] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, warehousesData] = await Promise.all([
        getProducts({ is_active: true }),
        getWarehouses(),
      ]);
      setProducts(productsData);
      setWarehouses(warehousesData);
      if (warehousesData.length > 0) {
        setDefaultWarehouse(warehousesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    searchTerm === ""
      ? true
      : p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = useCallback((product: ProductList) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.selling_price || 0,
          discount_type: "percentage",
          discount_value: 0,
        },
      ];
    });
    setSuccess(null);
    setError(null);
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
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

  // Calculs avec réductions
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

  const handleInstantSale = async () => {
    if (cart.length === 0) return;
    if (!defaultWarehouse) {
      setError("Aucun entrepôt configuré");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      await createSale({
        warehouse: defaultWarehouse,
        payment_method: paymentMethod,
        paid_amount: isPaid ? total : 0,
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

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la vente");
    } finally {
      setProcessing(false);
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
  }, [searchTerm, cart, total, defaultWarehouse, isPaid, paymentMethod]);

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
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{success}</span>
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

      {/* LEFT: Products */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Rechercher produit..."
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

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredProducts.map((product) => {
              const inCart = cart.find((item) => item.product_id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={cn(
                    "relative p-3 rounded-lg border text-left transition-all",
                    "hover:shadow-md active:scale-[0.98] bg-background",
                    inCart
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {inCart && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {inCart.quantity}
                    </div>
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
                    inCart ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Package className={cn("h-5 w-5", inCart ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-lg font-bold text-primary mt-1">{formatCurrency(product.selling_price || 0)}</p>
                </button>
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
            </div>
          </div>

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

          <label className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 cursor-pointer">
            <button
              type="button"
              onClick={() => setIsPaid(!isPaid)}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center transition-colors",
                isPaid ? "bg-green-600 text-white" : "border-2 border-gray-300"
              )}
            >
              {isPaid && <Check className="h-3 w-3" />}
            </button>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Payé intégralement</span>
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
                      {disc === 0 ? "0" : `-${(disc/1000)}k`}
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
                
                return (
                  <div key={item.product_id} className="p-2 rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm truncate flex-1 pr-2">{item.product_name}</p>
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
                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, 1)}
                          className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted"
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
                          onChange={(e) => updateItemDiscount(item.product_id, item.discount_type, parseFloat(e.target.value) || 0)}
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
