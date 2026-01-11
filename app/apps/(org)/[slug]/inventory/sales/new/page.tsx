"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Input, Label, Badge } from "@/components/ui";
import { QuickSelect } from "@/components/ui/quick-select";
import { createSale, getProducts, getWarehouses, getCustomers, createCustomer, createWarehouse } from "@/lib/services/inventory";
import type { SaleCreate, SaleItemCreate, ProductList, Warehouse, Customer, PaymentMethod } from "@/lib/types/inventory";
import {
  ArrowLeft,
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  ShoppingCart,
  Search,
  Percent,
  Calculator,
  Users,
  Warehouse as WarehouseIcon,
  Package,
  Minus,
  X,
  CreditCard,
  Banknote,
  Check,
  Sparkles,
  Smartphone,
  Building2,
  Receipt,
  CircleDollarSign,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CartItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  subtotal: number;
  stock_available: number;
}

export default function NewSalePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [products, setProducts] = useState<ProductList[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isCredit, setIsCredit] = useState(false);
  const [creditDueDate, setCreditDueDate] = useState("");
  
  // Paiement direct
  const [markAsPaid, setMarkAsPaid] = useState(true); // Par défaut, paiement immédiat
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>("cash");
  const [customPaidAmount, setCustomPaidAmount] = useState<number | null>(null);
  
  // Remise globale
  const [cartDiscountType, setCartDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [cartDiscountValue, setCartDiscountValue] = useState<number>(0);
  
  // Méthodes de paiement disponibles
  const PAYMENT_METHODS = [
    { value: "cash", label: "Espèces", icon: Banknote, color: "green" },
    { value: "mobile_money", label: "Mobile Money", icon: Smartphone, color: "orange" },
    { value: "bank_transfer", label: "Virement", icon: Building2, color: "blue" },
    { value: "card", label: "Carte", icon: CreditCard, color: "purple" },
    { value: "check", label: "Chèque", icon: Receipt, color: "gray" },
  ];
  
  // Remises rapides
  const quickDiscounts = [5, 10, 15, 20];

  useEffect(() => {
    loadData();
    // Focus sur la recherche au chargement
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K pour focus sur recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Échap pour fermer la recherche
      if (e.key === 'Escape') {
        setShowProductSearch(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = async () => {
    try {
      const [productsData, warehousesData, customersData] = await Promise.all([
        getProducts({ is_active: true }),
        getWarehouses(),
        getCustomers({ is_active: true }),
      ]);
      setProducts(productsData);
      setWarehouses(warehousesData);
      setCustomers(customersData);
      if (warehousesData.length > 0) {
        setSelectedWarehouse(warehousesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données");
    }
  };

  const filteredProducts = products.filter((p) =>
    searchTerm === ""
      ? true
      : p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = useCallback((product: ProductList) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex((item) => item.product_id === product.id);
      if (existingIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        newCart[existingIndex].subtotal = calculateItemSubtotal(newCart[existingIndex]);
        return newCart;
      } else {
        const newItem: CartItem = {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku || "",
          quantity: 1,
          unit_price: product.selling_price || 0,
          discount_type: "percentage",
          discount_value: 0,
          subtotal: product.selling_price || 0,
          stock_available: product.total_stock || 0,
        };
        return [...prevCart, newItem];
      }
    });
    setSearchTerm("");
    setShowProductSearch(false);
  }, []);

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQuantity = Math.max(1, newCart[index].quantity + delta);
    newCart[index].quantity = newQuantity;
    newCart[index].subtotal = calculateItemSubtotal(newCart[index]);
    setCart(newCart);
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
    const newCart = [...cart];
    (newCart[index] as any)[field] = value;
    newCart[index].subtotal = calculateItemSubtotal(newCart[index]);
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm("Vider le panier ?")) {
      setCart([]);
    }
  };

  const calculateItemSubtotal = (item: CartItem): number => {
    const grossAmount = item.quantity * item.unit_price;
    if (item.discount_type === "percentage") {
      return grossAmount * (1 - item.discount_value / 100);
    }
    return Math.max(0, grossAmount - item.discount_value);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  
  const cartDiscount = cartDiscountType === "percentage"
    ? subtotal * (cartDiscountValue / 100)
    : cartDiscountValue;
  
  const total = Math.max(0, subtotal - cartDiscount);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      setError("Ajoutez au moins un produit au panier");
      return;
    }

    if (!selectedWarehouse) {
      setError("Sélectionnez un entrepôt");
      return;
    }

    if (isCredit && !selectedCustomer) {
      setError("Un client est requis pour une vente à crédit");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculer le montant payé
      const paidAmount = isCredit 
        ? 0 
        : markAsPaid 
          ? (customPaidAmount !== null ? customPaidAmount : total)
          : 0;

      const saleData: SaleCreate = {
        warehouse: selectedWarehouse,
        customer: selectedCustomer || undefined,
        notes,
        is_credit_sale: isCredit,
        discount_type: cartDiscountType,
        discount_value: cartDiscountValue,
        paid_amount: paidAmount,
        payment_method: isCredit ? "credit" : paymentMethod,
        items: cart.map((item) => ({
          product: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
        })),
      };

      await createSale(saleData);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/apps/${slug}/inventory/sales`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de la vente");
    } finally {
      setLoading(false);
    }
  };

  // Sélection rapide d'un produit populaire
  const popularProducts = products
    .filter(p => (p.total_stock || 0) > 0)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Success overlay */}
      {success && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8 text-center animate-in zoom-in-95">
            <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="size-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Vente créée !</h2>
            <p className="text-muted-foreground">Redirection en cours...</p>
          </Card>
        </div>
      )}

      {/* Header fixe */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/apps/${slug}/inventory/sales`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Nouvelle vente
                </h1>
              </div>
            </div>
            
            {/* Résumé rapide */}
            {cart.length > 0 && (
              <div className="hidden md:flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{totalItems} article{totalItems > 1 ? 's' : ''}</div>
                  <div className="text-lg font-bold">{formatCurrency(total)}</div>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Valider {formatCurrency(total)}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {error && (
          <Alert variant="error" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <div>{error}</div>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Colonne principale - Produits */}
            <div className="lg:col-span-8 space-y-4">
              {/* Recherche produit - Prominent */}
              <Card className="p-4 !overflow-visible relative z-20">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Rechercher un produit (nom ou SKU)... Ctrl+K"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowProductSearch(true);
                    }}
                    onFocus={() => setShowProductSearch(true)}
                    className="pl-12 pr-4 h-14 text-lg"
                  />
                  {searchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                      onClick={() => {
                        setSearchTerm("");
                        setShowProductSearch(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Dropdown résultats - Positionné en absolu sans prendre de place */}
                {showProductSearch && searchTerm && (
                  <div 
                    className="absolute left-0 right-0 mx-4 bg-background border rounded-lg shadow-2xl max-h-80 overflow-y-auto" 
                    style={{ top: 'calc(100% - 1rem)', zIndex: 9999 }}
                  >
                    {filteredProducts.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Aucun produit trouvé pour "{searchTerm}"</p>
                      </div>
                    ) : (
                      filteredProducts.slice(0, 8).map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="w-full p-4 hover:bg-muted text-left flex items-center justify-between border-b last:border-0 transition-colors"
                          onClick={() => addToCart(product)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Package className="size-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.sku}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatCurrency(product.selling_price || 0)}</p>
                            <p className={cn(
                              "text-xs",
                              (product.total_stock || 0) > 10 
                                ? "text-green-600" 
                                : (product.total_stock || 0) > 0 
                                  ? "text-amber-600" 
                                  : "text-red-600"
                            )}>
                              Stock: {product.total_stock || 0}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Produits populaires - Accès rapide */}
                {!searchTerm && popularProducts.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Sparkles className="h-4 w-4" />
                      Ajout rapide
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addToCart(product)}
                          className="px-3 py-2 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-sm flex items-center gap-2"
                        >
                          <Plus className="h-3 w-3" />
                          {product.name}
                          <span className="text-muted-foreground">
                            {formatCurrency(product.selling_price || 0)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Panier */}
              <Card className="overflow-hidden relative z-10">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Panier
                    {cart.length > 0 && (
                      <Badge className="ml-2">{totalItems}</Badge>
                    )}
                  </h2>
                  {cart.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearCart}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Vider
                    </Button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Panier vide</p>
                    <p className="text-sm">Recherchez des produits ci-dessus pour les ajouter</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {cart.map((item, index) => (
                      <div key={item.product_id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-4">
                          {/* Info produit */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-medium truncate">{item.product_name}</h3>
                                <p className="text-sm text-muted-foreground">{item.product_sku}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(index)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Contrôles quantité + prix */}
                            <div className="mt-3 flex flex-wrap items-center gap-4">
                              {/* Quantité */}
                              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateQuantity(index, -1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateCartItem(index, "quantity", parseInt(e.target.value) || 1)}
                                  className="w-16 h-8 text-center border-0 bg-transparent"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateQuantity(index, 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Prix unitaire */}
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground">×</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) => updateCartItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                                  className="w-28 h-8"
                                />
                                <span className="text-xs text-muted-foreground">GNF</span>
                              </div>

                              {/* Remise rapide */}
                              <div className="flex items-center gap-1">
                                <Percent className="h-3 w-3 text-muted-foreground" />
                                <div className="flex gap-1">
                                  {[0, 5, 10].map((disc) => (
                                    <button
                                      key={disc}
                                      type="button"
                                      className={cn(
                                        "px-2 py-1 text-xs rounded transition-colors",
                                        item.discount_value === disc && item.discount_type === "percentage"
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted hover:bg-muted/80"
                                      )}
                                      onClick={() => {
                                        updateCartItem(index, "discount_type", "percentage");
                                        updateCartItem(index, "discount_value", disc);
                                      }}
                                    >
                                      {disc === 0 ? "0%" : `-${disc}%`}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Subtotal */}
                              <div className="ml-auto text-right">
                                <div className="font-bold text-lg">{formatCurrency(item.subtotal)}</div>
                                {item.discount_value > 0 && (
                                  <div className="text-xs text-green-600">
                                    -{item.discount_type === "percentage" ? `${item.discount_value}%` : formatCurrency(item.discount_value)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Colonne droite - Résumé */}
            <div className="lg:col-span-4 space-y-4">
              {/* Entrepôt & Client */}
              <Card className="p-4 space-y-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    <WarehouseIcon className="h-4 w-4 inline mr-1" />
                    Entrepôt *
                  </Label>
                  <QuickSelect
                    label="Entrepôt"
                    items={warehouses.map(w => ({ id: w.id, name: w.name, subtitle: w.city || w.code }))}
                    selectedId={selectedWarehouse}
                    onSelect={setSelectedWarehouse}
                    onCreate={async (name) => {
                      const code = `WH-${Date.now().toString(36).toUpperCase()}`;
                      const newWarehouse = await createWarehouse({ name, code, is_active: true });
                      setWarehouses(prev => [...prev, newWarehouse]);
                      return { id: newWarehouse.id, name: newWarehouse.name };
                    }}
                    placeholder="Sélectionner..."
                    icon={WarehouseIcon}
                    accentColor="blue"
                    createLabel="Créer"
                    required
                  />
                </div>
                
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    <Users className="h-4 w-4 inline mr-1" />
                    Client
                  </Label>
                  <QuickSelect
                    label="Client"
                    items={customers.map(c => ({ id: c.id, name: c.name, subtitle: c.phone || c.email }))}
                    selectedId={selectedCustomer}
                    onSelect={setSelectedCustomer}
                    onCreate={async (name, phone) => {
                      const code = `CLI-${Date.now().toString(36).toUpperCase()}`;
                      const newCustomer = await createCustomer({ name, phone: phone || "", code });
                      setCustomers(prev => [...prev, newCustomer]);
                      return { id: newCustomer.id, name: newCustomer.name };
                    }}
                    placeholder="Anonyme..."
                    icon={Users}
                    accentColor="green"
                    createLabel="Créer"
                    extraFieldLabel="Téléphone"
                  />
                </div>

                {/* Type de paiement */}
                <div>
                  <Label className="mb-2 block text-sm font-medium">Type de vente</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCredit(false);
                        setMarkAsPaid(true);
                      }}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all",
                        !isCredit 
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
                          : "border-border hover:border-green-300"
                      )}
                    >
                      <Banknote className={cn("h-5 w-5 mx-auto mb-1", !isCredit ? "text-green-600" : "text-muted-foreground")} />
                      <span className={cn("text-sm font-medium", !isCredit ? "text-green-700" : "")}>Comptant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCredit(true);
                        setMarkAsPaid(false);
                      }}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all",
                        isCredit 
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" 
                          : "border-border hover:border-amber-300"
                      )}
                    >
                      <CreditCard className={cn("h-5 w-5 mx-auto mb-1", isCredit ? "text-amber-600" : "text-muted-foreground")} />
                      <span className={cn("text-sm font-medium", isCredit ? "text-amber-700" : "")}>À crédit</span>
                    </button>
                  </div>
                </div>

                {/* Options de paiement comptant */}
                {!isCredit && (
                  <div className="space-y-3 pt-3 border-t">
                    {/* Toggle paiement validé */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Paiement reçu
                      </Label>
                      <button
                        type="button"
                        onClick={() => setMarkAsPaid(!markAsPaid)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          markAsPaid ? "bg-green-500" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            markAsPaid ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    {markAsPaid && (
                      <>
                        {/* Mode de paiement */}
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Mode de paiement</Label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {PAYMENT_METHODS.map((method) => {
                              const Icon = method.icon;
                              const isSelected = paymentMethod === method.value;
                              return (
                                <button
                                  key={method.value}
                                  type="button"
                                  onClick={() => setPaymentMethod(method.value)}
                                  className={cn(
                                    "p-2 rounded-lg border text-center transition-all text-xs",
                                    isSelected 
                                      ? `border-${method.color}-500 bg-${method.color}-50 dark:bg-${method.color}-950/20`
                                      : "border-border hover:border-muted-foreground/50"
                                  )}
                                  style={{
                                    borderColor: isSelected ? `var(--${method.color}-500, currentColor)` : undefined,
                                    backgroundColor: isSelected ? `var(--${method.color}-50, transparent)` : undefined
                                  }}
                                >
                                  <Icon className={cn(
                                    "h-4 w-4 mx-auto mb-0.5", 
                                    isSelected ? `text-${method.color}-600` : "text-muted-foreground"
                                  )} />
                                  <span className={cn("font-medium", isSelected && `text-${method.color}-700`)}>
                                    {method.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Montant payé (optionnel pour paiement partiel) */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs text-muted-foreground">Montant reçu</Label>
                            <button
                              type="button"
                              onClick={() => setCustomPaidAmount(null)}
                              className="text-xs text-primary hover:underline"
                            >
                              Total: {formatCurrency(total)}
                            </button>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max={total}
                            value={customPaidAmount !== null ? customPaidAmount : total}
                            onChange={(e) => setCustomPaidAmount(parseFloat(e.target.value) || 0)}
                            placeholder={`${total}`}
                          />
                          {customPaidAmount !== null && customPaidAmount < total && (
                            <p className="text-xs text-amber-600 mt-1">
                              ⚠️ Paiement partiel - Reste: {formatCurrency(total - customPaidAmount)}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {!markAsPaid && (
                      <p className="text-xs text-muted-foreground p-2 bg-muted rounded">
                        La vente sera créée sans paiement. Vous pourrez enregistrer le paiement plus tard.
                      </p>
                    )}
                  </div>
                )}

                {/* Options crédit */}
                {isCredit && (
                  <div className="pt-3 border-t">
                    <Label className="text-sm">Date d'échéance *</Label>
                    <Input
                      type="date"
                      value={creditDueDate}
                      onChange={(e) => setCreditDueDate(e.target.value)}
                      required={isCredit}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Le client pourra payer avant cette date
                    </p>
                  </div>
                )}
              </Card>

              {/* Remise globale */}
              {cart.length > 0 && (
                <Card className="p-4">
                  <Label className="mb-3 block text-sm font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Remise globale
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[0, ...quickDiscounts].map((disc) => (
                      <button
                        key={disc}
                        type="button"
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-lg transition-colors",
                          cartDiscountValue === disc && cartDiscountType === "percentage"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                        onClick={() => {
                          setCartDiscountType("percentage");
                          setCartDiscountValue(disc);
                        }}
                      >
                        {disc === 0 ? "Aucune" : `-${disc}%`}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={cartDiscountValue || ""}
                      onChange={(e) => setCartDiscountValue(parseFloat(e.target.value) || 0)}
                      placeholder="Montant"
                      className="flex-1"
                    />
                    <select
                      value={cartDiscountType}
                      onChange={(e) => setCartDiscountType(e.target.value as any)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm w-20"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">GNF</option>
                    </select>
                  </div>
                </Card>
              )}

              {/* Résumé */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Total
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Remise</span>
                      <span>-{formatCurrency(cartDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-bold pt-3 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              <Card className="p-4">
                <Label className="text-sm font-medium">Notes (optionnel)</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Remarques sur la vente..."
                  rows={2}
                  className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </Card>

              {/* Bouton valider (mobile) */}
              <div className="lg:hidden space-y-2">
                <Button
                  type="submit"
                  disabled={loading || cart.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Valider la vente • {formatCurrency(total)}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href={`/apps/${slug}/inventory/sales`}>Annuler</Link>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
