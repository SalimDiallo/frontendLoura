"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Input, Label, Badge } from "@/components/ui";
import { QuickSelect } from "@/components/ui/quick-select";
import { createSale, getProducts, getWarehouses, getCustomers, createCustomer, createWarehouse } from "@/lib/services/inventory";
import type { SaleCreate, SaleItemCreate, ProductList, Warehouse, Customer } from "@/lib/types/inventory";
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
}

export default function NewSalePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  
  // Remise globale
  const [cartDiscountType, setCartDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [cartDiscountValue, setCartDiscountValue] = useState<number>(0);

  useEffect(() => {
    loadData();
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

  const addToCart = (product: ProductList) => {
    const existingIndex = cart.findIndex((item) => item.product_id === product.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].subtotal = calculateItemSubtotal(newCart[existingIndex]);
      setCart(newCart);
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
      };
      setCart([...cart, newItem]);
    }
    setSearchTerm("");
    setShowProductSearch(false);
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

      const saleData: SaleCreate = {
        warehouse: selectedWarehouse,
        customer: selectedCustomer || undefined,
        notes,
        is_credit_sale: isCredit,
        discount_type: cartDiscountType,
        discount_value: cartDiscountValue,
        items: cart.map((item) => ({
          product: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
        })),
      };

      await createSale(saleData);
      router.push(`/apps/${slug}/inventory/sales`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de la vente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/apps/${slug}/inventory/sales`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Nouvelle vente</h1>
          <p className="text-muted-foreground">
            Créez une nouvelle vente - le stock sera automatiquement mis à jour
          </p>
        </div>
      </div>

      {/* Info Box - Comment ça marche */}
      <Alert className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <ShoppingCart className="h-4 w-4 text-blue-600" />
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Comment ça marche ?</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            1️⃣ Recherchez et ajoutez des produits au panier • 
            2️⃣ Choisissez un entrepôt et un client (optionnel) • 
            3️⃣ Validez la vente → Le stock est automatiquement déduit !
          </p>
        </div>
      </Alert>

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Search */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Produits
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowProductSearch(true);
                  }}
                  onFocus={() => setShowProductSearch(true)}
                  className="pl-10"
                />
                {showProductSearch && searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Aucun produit trouvé
                      </div>
                    ) : (
                      filteredProducts.slice(0, 10).map((product) => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-muted cursor-pointer flex items-center justify-between"
                          onClick={() => addToCart(product)}
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(product.selling_price || 0)}</p>
                            <p className="text-xs text-muted-foreground">
                              Stock: {product.total_stock || 0}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Cart Items */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">
                Panier ({cart.length} article{cart.length > 1 ? "s" : ""})
              </h2>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Votre panier est vide</p>
                  <p className="text-sm">Recherchez et ajoutez des produits</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div
                      key={item.product_id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {item.product_sku}
                          </code>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Quantité</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartItem(index, "quantity", parseInt(e.target.value) || 1)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Prix unitaire</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateCartItem(index, "unit_price", parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Type remise</Label>
                          <select
                            value={item.discount_type}
                            onChange={(e) =>
                              updateCartItem(index, "discount_type", e.target.value)
                            }
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="percentage">%</option>
                            <option value="fixed">GNF</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Remise</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.discount_value}
                            onChange={(e) =>
                              updateCartItem(index, "discount_value", parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                          {item.discount_value > 0 && (
                            <span className="text-red-500">
                              {" "}- {item.discount_type === "percentage"
                                ? `${item.discount_value}%`
                                : formatCurrency(item.discount_value)}
                            </span>
                          )}
                        </span>
                        <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Options */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Options</h2>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Entrepôt *</Label>
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
                    placeholder="Rechercher un entrepôt..."
                    icon={WarehouseIcon}
                    accentColor="blue"
                    createLabel="Nouvel entrepôt"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Client</Label>
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
                    placeholder="Rechercher ou créer un client..."
                    icon={Users}
                    accentColor="green"
                    createLabel="Nouveau client"
                    extraFieldLabel="Téléphone (optionnel)"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isCredit"
                    checked={isCredit}
                    onChange={(e) => setIsCredit(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <Label htmlFor="isCredit">Vente à crédit</Label>
                </div>
                {isCredit && (
                  <div>
                    <Label>Date d'échéance</Label>
                    <Input
                      type="date"
                      value={creditDueDate}
                      onChange={(e) => setCreditDueDate(e.target.value)}
                      required={isCredit}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Cart Discount */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Remise globale
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Type</Label>
                  <select
                    value={cartDiscountType}
                    onChange={(e) => setCartDiscountType(e.target.value as any)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">GNF</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Valeur</Label>
                  <Input
                    type="number"
                    min="0"
                    value={cartDiscountValue}
                    onChange={(e) => setCartDiscountValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </Card>

            {/* Summary */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Résumé
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>
                      Remise ({cartDiscountType === "percentage" ? `${cartDiscountValue}%` : "fixe"})
                    </span>
                    <span>-{formatCurrency(cartDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </Card>

            {/* Notes */}
            <Card className="p-4">
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes sur la vente..."
                rows={3}
                className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Création...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Valider la vente
                  </div>
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
  );
}
