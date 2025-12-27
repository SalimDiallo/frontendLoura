"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, Alert, Badge } from "@/components/ui";
import { QuickSelect } from "@/components/ui/quick-select";
import { createOrder, getSuppliers, getWarehouses, getProducts, createSupplier, createWarehouse } from "@/lib/services/inventory";
import type { OrderCreate, OrderItemCreate, Supplier, Warehouse, ProductList } from "@/lib/types/inventory";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Truck,
  Building2,
  Calendar,
  Search,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NewOrderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<ProductList[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showTransport, setShowTransport] = useState(false);

  // Générer numéro de commande
  const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CMD-${dateStr}-${random}`;
  };

  const [formData, setFormData] = useState({
    supplier: "",
    warehouse: "",
    order_number: generateOrderNumber(),
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    notes: "",
    // Transport (optionnel)
    transport_mode: "",
    transport_company: "",
    tracking_number: "",
    transport_cost: 0,
    transport_included: false, // true = inclus dans le prix, false = à ajouter
    transport_notes: "",
  });

  const [items, setItems] = useState<OrderItemCreate[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suppliersData, warehousesData, productsData] = await Promise.all([
        getSuppliers({ is_active: true }),
        getWarehouses({ is_active: true }),
        getProducts({ is_active: true }),
      ]);
      setSuppliers(suppliersData);
      setWarehouses(warehousesData);
      setProducts(productsData);
      // Sélectionner par défaut
      if (warehousesData.length > 0) {
        setFormData(prev => ({ ...prev, warehouse: warehousesData[0].id }));
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    }
  };

  const addProduct = (product: ProductList) => {
    // Vérifier si déjà ajouté
    if (items.some(i => i.product === product.id)) {
      setItems(items.map(i => 
        i.product === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, {
        product: product.id,
        quantity: 1,
        unit_price: product.purchase_price || 0,
      }]);
    }
    setProductSearch("");
  };

  const updateItem = (productId: string, field: keyof OrderItemCreate, value: number) => {
    setItems(items.map(i => 
      i.product === productId ? { ...i, [field]: value } : i
    ));
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.product !== productId));
  };

  const calculateTotal = () => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  // Si frais inclus, le total ne change pas. Sinon, on ajoute les frais de transport.
  const transportFees = formData.transport_included ? 0 : (formData.transport_cost || 0);
  const totalWithTransport = calculateTotal() + transportFees;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

  const filteredProducts = products.filter(p =>
    productSearch === "" ? false :
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.supplier) {
      setError("Sélectionnez un fournisseur");
      return;
    }
    if (!formData.warehouse) {
      setError("Sélectionnez un entrepôt");
      return;
    }
    if (items.length === 0) {
      setError("Ajoutez au moins un produit");
      return;
    }

    try {
      setLoading(true);
      const orderData: OrderCreate = {
        supplier: formData.supplier,
        warehouse: formData.warehouse,
        order_number: formData.order_number,
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || null,
        notes: formData.notes,
        total_amount: totalWithTransport,
        items: items.filter(item => item.product && item.quantity > 0),
        // Champs transport
        transport_mode: formData.transport_mode,
        transport_company: formData.transport_company,
        tracking_number: formData.tracking_number,
        transport_cost: formData.transport_cost,
        transport_included: formData.transport_included,
        transport_notes: formData.transport_notes,
      };

      await createOrder(orderData);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/apps/${slug}/inventory/orders`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Commande créée !</h2>
          <p className="text-muted-foreground">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/apps/${slug}/inventory/orders`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Nouvelle commande</h1>
          <p className="text-sm text-muted-foreground">Commande fournisseur (achat)</p>
        </div>
      </div>

      {/* Error */}
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Étape 1: Fournisseur & Entrepôt */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            1. Fournisseur & Destination
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-2">Fournisseur *</label>
              <QuickSelect
                label="Fournisseur"
                items={suppliers.map(s => ({ id: s.id, name: s.name, subtitle: s.phone || s.email }))}
                selectedId={formData.supplier}
                onSelect={(id) => setFormData(prev => ({ ...prev, supplier: id }))}
                onCreate={async (name, phone) => {
                  const code = `SUP-${Date.now().toString(36).toUpperCase()}`;
                  const newSupplier = await createSupplier({ name, phone: phone || "", code });
                  setSuppliers(prev => [...prev, newSupplier]);
                  return { id: newSupplier.id, name: newSupplier.name };
                }}
                placeholder="Rechercher un fournisseur..."
                icon={Building2}
                accentColor="green"
                createLabel="Nouveau fournisseur"
                extraFieldLabel="Téléphone (optionnel)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2">Entrepôt destination *</label>
              <QuickSelect
                label="Entrepôt"
                items={warehouses.map(w => ({ id: w.id, name: w.name, subtitle: w.city || w.code }))}
                selectedId={formData.warehouse}
                onSelect={(id) => setFormData(prev => ({ ...prev, warehouse: id }))}
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
              />
            </div>
          </div>
        </Card>

        {/* Étape 2: Dates */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            2. Dates
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">N° commande</label>
              <div className="flex gap-1">
                <Input
                  value={formData.order_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_number: e.target.value }))}
                  className="font-mono text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, order_number: generateOrderNumber() }))}>
                  🔄
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Date commande</label>
              <Input
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Livraison prévue</label>
              <Input
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        {/* Étape 3: Produits */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" />
            3. Produits ({items.length})
          </h3>

          {/* Recherche produit */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit à ajouter..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-10"
            />
            {filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredProducts.slice(0, 8).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="w-full p-3 text-left hover:bg-muted/50 flex items-center justify-between border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <Badge variant="outline">{formatCurrency(product.purchase_price)}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Liste des produits ajoutés */}
          {items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Recherchez et ajoutez des produits</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const product = products.find(p => p.id === item.product);
                return (
                  <div key={item.product} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product?.name}</p>
                      <p className="text-xs text-muted-foreground">{product?.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.product, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-center"
                        min="1"
                      />
                      <span className="text-xs text-muted-foreground">×</span>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.product, "unit_price", parseFloat(e.target.value) || 0)}
                        className="w-24 h-8"
                        min="0"
                      />
                      <span className="font-medium text-sm w-28 text-right">{formatCurrency(item.quantity * item.unit_price)}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.product)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Étape 4: Transport (optionnel) */}
        <Card className="p-4">
          <button
            type="button"
            onClick={() => setShowTransport(!showTransport)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              4. Transport (optionnel)
            </h3>
            {showTransport ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showTransport && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Mode de transport</label>
                  <select
                    value={formData.transport_mode}
                    onChange={(e) => setFormData(prev => ({ ...prev, transport_mode: e.target.value }))}
                    className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  >
                    <option value="">Non spécifié</option>
                    <option value="routier">🚚 Routier</option>
                    <option value="maritime">🚢 Maritime</option>
                    <option value="aerien">✈️ Aérien</option>
                    <option value="ferroviaire">🚂 Ferroviaire</option>
                    <option value="retrait">📦 Retrait sur place</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Transporteur</label>
                  <Input
                    value={formData.transport_company}
                    onChange={(e) => setFormData(prev => ({ ...prev, transport_company: e.target.value }))}
                    placeholder="Nom du transporteur..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">N° de suivi</label>
                  <Input
                    value={formData.tracking_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                    placeholder="Numéro de tracking..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Frais de transport</label>
                  <Input
                    type="number"
                    value={formData.transport_cost || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, transport_cost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              {formData.transport_cost > 0 && (
                <label className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.transport_included}
                    onChange={(e) => setFormData(prev => ({ ...prev, transport_included: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">
                    <strong>Frais inclus dans le prix des produits</strong>
                    <span className="block text-xs text-muted-foreground">
                      {formData.transport_included 
                        ? "Les frais de transport sont déjà compris dans le prix d'achat des produits"
                        : "Les frais de transport seront ajoutés au total de la commande"
                      }
                    </span>
                  </span>
                </label>
              )}
              <div>
                <label className="block text-xs font-medium mb-1">Notes transport</label>
                <textarea
                  value={formData.transport_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, transport_notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  placeholder="Instructions de livraison, contact..."
                />
              </div>
            </div>
          )}
        </Card>

        {/* Notes générales */}
        <Card className="p-4">
          <label className="block text-xs font-medium mb-1">Notes (optionnel)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            placeholder="Notes générales sur la commande..."
          />
        </Card>

        {/* Récapitulatif & Actions */}
        <Card className="p-4 bg-muted/30">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Sous-total produits</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
            {formData.transport_cost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  Frais de transport
                  {formData.transport_included && (
                    <Badge variant="outline" className="text-xs">Inclus</Badge>
                  )}
                </span>
                <span className={formData.transport_included ? "line-through text-muted-foreground" : ""}>
                  {formData.transport_included ? "(déjà inclus)" : formatCurrency(formData.transport_cost)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totalWithTransport)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || items.length === 0 || !formData.supplier || !formData.warehouse}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Package className="mr-2 h-5 w-5" />
                  Créer la commande
                </>
              )}
            </Button>
            <Link href={`/apps/${slug}/inventory/orders`}>
              <Button type="button" variant="outline" className="h-12">Annuler</Button>
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
