"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, Alert, Badge } from "@/components/ui";
import { getOrder, updateOrder, getSuppliers, getWarehouses, getProducts } from "@/lib/services/inventory";
import type { OrderUpdate, OrderItemCreate, Supplier, Warehouse, ProductList, Order } from "@/lib/types/inventory";
import {
  ArrowLeft,
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
  Lock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const orderId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<ProductList[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showTransport, setShowTransport] = useState(false);

  const [formData, setFormData] = useState({
    supplier: "",
    warehouse: "",
    order_number: "",
    order_date: "",
    expected_delivery_date: "",
    notes: "",
    transport_mode: "",
    transport_company: "",
    tracking_number: "",
    transport_cost: 0,
    transport_included: false,
    transport_notes: "",
  });

  const [items, setItems] = useState<OrderItemCreate[]>([]);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [orderData, suppliersData, warehousesData, productsData] = await Promise.all([
        getOrder(orderId),
        getSuppliers({ is_active: true }),
        getWarehouses({ is_active: true }),
        getProducts({ is_active: true }),
      ]);

      setOrder(orderData);
      setSuppliers(suppliersData);
      setWarehouses(warehousesData);
      setProducts(productsData);

      // Parser les notes pour extraire les infos transport
      let transportMode = "";
      let transportCompany = "";
      let trackingNumber = "";
      let transportCost = 0;
      let transportIncluded = false;
      let transportNotes = "";
      let cleanNotes = orderData.notes || "";

      if (orderData.notes) {
        const lines = orderData.notes.split("\n");
        const newNotes: string[] = [];
        lines.forEach((line: string) => {
          if (line.startsWith("Transport:")) {
            transportMode = line.replace("Transport:", "").trim();
          } else if (line.startsWith("Transporteur:")) {
            transportCompany = line.replace("Transporteur:", "").trim();
          } else if (line.startsWith("N° suivi:")) {
            trackingNumber = line.replace("N° suivi:", "").trim();
          } else if (line.startsWith("Frais transport:")) {
            const match = line.match(/(\d+)/);
            if (match) transportCost = parseInt(match[1]);
            if (line.includes("(inclus dans le prix)")) {
              transportIncluded = true;
            }
          } else if (line.startsWith("Notes transport:")) {
            transportNotes = line.replace("Notes transport:", "").trim();
          } else {
            newNotes.push(line);
          }
        });
        cleanNotes = newNotes.join("\n").trim();
        if (transportMode || transportCompany || trackingNumber || transportCost > 0) {
          setShowTransport(true);
        }
      }

      setFormData({
        supplier: orderData.supplier,
        warehouse: orderData.warehouse,
        order_number: orderData.order_number,
        order_date: orderData.order_date,
        expected_delivery_date: orderData.expected_delivery_date || "",
        notes: cleanNotes,
        transport_mode: transportMode,
        transport_company: transportCompany,
        tracking_number: trackingNumber,
        transport_cost: transportCost,
        transport_included: transportIncluded,
        transport_notes: transportNotes,
      });

      if (orderData.items && orderData.items.length > 0) {
        setItems(orderData.items.map((item: any) => ({
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })));
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si modifiable (seulement brouillon ou en attente)
  const canEdit = order && (order.status === "draft" || order.status === "pending");

  const addProduct = (product: ProductList) => {
    if (!canEdit) return;
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
    if (!canEdit) return;
    setItems(items.map(i => 
      i.product === productId ? { ...i, [field]: value } : i
    ));
  };

  const removeItem = (productId: string) => {
    if (!canEdit) return;
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
    if (!canEdit) return;
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
      setSaving(true);
      const orderData: OrderUpdate = {
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

      await updateOrder(orderId, orderData);
      router.push(`/apps/${slug}/inventory/orders/${orderId}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si commande confirmée/reçue/annulée : afficher un message
  if (!canEdit) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/apps/${slug}/inventory/orders/${orderId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Modifier la commande</h1>
          </div>
        </div>

        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Modification impossible</h2>
          <p className="text-muted-foreground mb-4">
            Cette commande a le statut <Badge className="mx-1">{order?.status === "confirmed" ? "Confirmée" : order?.status === "received" ? "Reçue" : "Annulée"}</Badge> 
            et ne peut plus être modifiée.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Seules les commandes en brouillon ou en attente peuvent être modifiées.
          </p>
          <Link href={`/apps/${slug}/inventory/orders/${orderId}`}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la commande
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/apps/${slug}/inventory/orders/${orderId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Modifier la commande</h1>
            <Badge variant="outline">{order?.order_number}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Statut: {order?.status === "draft" ? "Brouillon" : "En attente"}</p>
        </div>
      </div>

      {/* Warning */}
      <Alert variant="warning" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <span>Une fois la commande confirmée, vous ne pourrez plus la modifier.</span>
      </Alert>

      {/* Error */}
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Étape 1: Fournisseur & Entrepôt */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Fournisseur & Destination
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Fournisseur *</label>
              <select
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
              >
                <option value="">Sélectionner...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Entrepôt destination *</label>
              <select
                value={formData.warehouse}
                onChange={(e) => setFormData(prev => ({ ...prev, warehouse: e.target.value }))}
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
              >
                <option value="">Sélectionner...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Étape 2: Dates */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dates
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">N° commande</label>
              <Input
                value={formData.order_number}
                onChange={(e) => setFormData(prev => ({ ...prev, order_number: e.target.value }))}
                className="font-mono text-sm"
              />
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
            Produits ({items.length})
          </h3>

          {/* Recherche produit */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ajouter un produit..."
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

          {/* Liste des produits */}
          {items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucun produit</p>
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

        {/* Transport (optionnel) */}
        <Card className="p-4">
          <button
            type="button"
            onClick={() => setShowTransport(!showTransport)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Transport (optionnel)
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
                        ? "Les frais de transport sont déjà compris dans le prix d'achat"
                        : "Les frais de transport seront ajoutés au total"
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
                  placeholder="Instructions de livraison..."
                />
              </div>
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card className="p-4">
          <label className="block text-xs font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            placeholder="Notes générales..."
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
              disabled={saving || items.length === 0}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
            <Link href={`/apps/${slug}/inventory/orders/${orderId}`}>
              <Button type="button" variant="outline" className="h-12">Annuler</Button>
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
