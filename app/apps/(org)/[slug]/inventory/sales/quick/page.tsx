"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button, Alert, Card, Input, Badge } from "@/components/ui";
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
  Zap,
  X,
  CheckCircle,
  AlertTriangle,
  Settings,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export default function QuickSalePOSPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Data
  const [products, setProducts] = useState<ProductList[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [defaultWarehouse, setDefaultWarehouse] = useState<string>("");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // UI States
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastSaleTotal, setLastSaleTotal] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load data
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

      // Premier entrepôt par défaut
      if (warehousesData.length > 0) {
        setDefaultWarehouse(warehousesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  // Filtered products
  const filteredProducts = products.filter((p) =>
    searchTerm === ""
      ? true
      : p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cart operations - CLIC 1: Ajouter au panier
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

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  // Calculate total
  const total = cart.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("fr-GN", {
        style: "decimal",
        minimumFractionDigits: 0,
      }).format(amount) + " GNF"
    );
  };

  // CLIC 2: Encaisser instantanément
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
        items: cart.map((item) => ({
          product: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });

      setLastSaleTotal(total);
      setSuccess(`✅ Vente de ${formatCurrency(total)} enregistrée !`);
      setCart([]);

      // Auto-hide success after 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la vente");
    } finally {
      setProcessing(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter: Encaisser
      if (e.key === "Enter" && !e.ctrlKey && cart.length > 0) {
        const isInputFocused = document.activeElement?.tagName === "INPUT";
        if (!isInputFocused) {
          e.preventDefault();
          handleInstantSale();
        }
      }

      // Escape: Vider panier ou search
      if (e.key === "Escape") {
        if (searchTerm) {
          setSearchTerm("");
          searchInputRef.current?.blur();
        } else if (cart.length > 0) {
          setCart([]);
        }
      }

      // Ctrl+K or /: Focus search
      if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchTerm, cart, total, defaultWarehouse]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background to-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-muted-foreground">Chargement du point de vente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/20 overflow-hidden">
      {/* Success Toast */}
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <CheckCircle className="h-6 w-6" />
            <span className="text-lg font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <span className="text-lg font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:bg-white/20 p-1 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header compact */}
      <div className="bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/apps/${slug}/inventory/sales`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Caisse Express</h1>
              <p className="text-xs text-muted-foreground">2 clics pour vendre</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {warehouses.find(w => w.id === defaultWarehouse)?.name || "Entrepôt"}
          </Badge>
          <Link href={`/apps/${slug}/inventory/sales/new`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Mode avancé
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 overflow-hidden">
        {/* Left: Products Grid (3/4) */}
        <div className="lg:col-span-3 flex flex-col p-4 overflow-hidden">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Rechercher un produit... (appuyez sur /)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg bg-background shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Products Grid - Cliquables */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product_id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                      "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                      "bg-background",
                      inCart
                        ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                        : "border-transparent hover:border-primary/30"
                    )}
                  >
                    {/* Badge quantité */}
                    {inCart && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg">
                        {inCart.quantity}
                      </div>
                    )}

                    {/* Icône produit */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center mb-3",
                        inCart ? "bg-primary/20" : "bg-muted"
                      )}
                    >
                      <Package className={cn("h-6 w-6", inCart ? "text-primary" : "text-muted-foreground")} />
                    </div>

                    {/* Nom produit */}
                    <p className="font-medium text-sm truncate mb-1">{product.name}</p>

                    {/* SKU */}
                    <p className="text-xs text-muted-foreground truncate mb-2">{product.sku}</p>

                    {/* Prix */}
                    <p className="text-lg font-bold text-primary">{formatCurrency(product.selling_price || 0)}</p>

                    {/* Stock */}
                    <p className="text-xs text-muted-foreground mt-1">
                      Stock: {product.total_stock || 0}
                    </p>
                  </button>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Package className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg">Aucun produit trouvé</p>
                <p className="text-sm">Essayez une autre recherche</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart Panel (1/4) */}
        <div className="bg-background border-l flex flex-col shadow-xl">
          {/* Cart Header */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Panier
              </h2>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <ShoppingCart className="h-10 w-10 opacity-30" />
                </div>
                <p className="font-medium">Panier vide</p>
                <p className="text-sm mt-1">Cliquez sur un produit pour l'ajouter</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="p-3 rounded-lg bg-muted/30 border border-transparent hover:border-muted-foreground/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm truncate flex-1 pr-2">{item.product_name}</p>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.product_id, -1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, 1)}
                          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-bold text-sm">{formatCurrency(item.quantity * item.unit_price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer - ENCAISSER */}
          <div className="border-t p-4 space-y-4 bg-gradient-to-t from-muted/20 to-transparent">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>

            {/* BOUTON ENCAISSER - CLIC 2 */}
            <Button
              className={cn(
                "w-full h-16 text-xl font-bold rounded-xl transition-all",
                cart.length > 0
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                  : ""
              )}
              size="lg"
              disabled={cart.length === 0 || processing}
              onClick={handleInstantSale}
            >
              {processing ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-6 w-6 border-3 border-current border-t-transparent rounded-full" />
                  Traitement...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Receipt className="h-6 w-6" />
                  Encaisser
                </div>
              )}
            </Button>

            {/* Hint */}
            <p className="text-center text-xs text-muted-foreground">
              Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Entrée</kbd> pour encaisser
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-muted/30 border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono">/</kbd> Rechercher
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Entrée</kbd> Encaisser
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Échap</kbd> Annuler
          </span>
        </div>
        <span>{products.length} produits disponibles</span>
      </div>
    </div>
  );
}
