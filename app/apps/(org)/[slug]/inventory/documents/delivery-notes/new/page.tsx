"use client";

import { Can } from "@/components/apps/common";
import { Alert, Badge, Button, Card, Input, Label, QuickSelect } from "@/components/ui";
import {
  createDeliveryNote,
  getProducts,
  getSale,
  getSales,
} from "@/lib/services/inventory";
import type { ProductList, SaleList } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Edit3,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface DeliveryItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  max_quantity?: number; // Quantité max de la vente
  notes: string;
}

interface SaleInfo {
  sale_number: string;
  customer_name: string;
  sale_date: string;
  total: number;
}

export default function NewDeliveryNotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const preselectSaleId = searchParams.get("sale");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<SaleList[]>([]);
  const [products, setProducts] = useState<ProductList[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [saleDetailsLoading, setSaleDetailsLoading] = useState(false);

  // Form fields
  const [selectedSale, setSelectedSale] = useState<string>(preselectSaleId || "");
  const [saleInfo, setSaleInfo] = useState<SaleInfo | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [carrierName, setCarrierName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DeliveryItem[]>([]);

  // Product search
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [saleLoaded, setSaleLoaded] = useState(false);
  
  // Edit mode - permet de modifier même après sélection de vente
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // If a sale is preselected, populate recipient info from sale's customer
  useEffect(() => {
    if (preselectSaleId) {
      setSelectedSale(preselectSaleId);
    }
  }, [preselectSaleId]);

  // Load sale details when a sale is selected
  useEffect(() => {
    if (selectedSale) {
      loadSaleDetails(selectedSale);
    } else {
      // Reset when no sale selected
      setSaleInfo(null);
      setSaleLoaded(false);
      setItems([]);
      setRecipientName("");
      setEditMode(false);
    }
  }, [selectedSale]);

  const loadSaleDetails = async (saleId: string) => {
    try {
      setSaleDetailsLoading(true);
      const sale = await getSale(saleId);

      // Store sale info for display
      setSaleInfo({
        sale_number: sale.sale_number || "",
        customer_name: sale.customer_name || "Client inconnu",
        sale_date: sale.sale_date,
        total: sale.total_amount || 0,
      });

      // Pre-fill recipient info from customer or sale
      if (sale.customer_name) {
        setRecipientName(sale.customer_name);
      }

      // Pre-fill items from sale
      if (sale.items && sale.items.length > 0) {
        const saleItems: DeliveryItem[] = sale.items.map((item) => ({
          product_id: item.product,
          product_name: item.product_name || "Produit",
          product_sku: item.product_sku || "",
          quantity: item.quantity,
          max_quantity: item.quantity,
          notes: "",
        }));
        setItems(saleItems);
      }

      setSaleLoaded(true);
      setEditMode(false);
    } catch (err: any) {
      console.error("Erreur lors du chargement de la vente:", err);
      setSaleLoaded(false);
      setSaleInfo(null);
    } finally {
      setSaleDetailsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setSalesLoading(true);
      const [salesData, productsData] = await Promise.all([
        getSales({}),
        getProducts({ is_active: true }),
      ]);
      setSales(salesData);
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données");
    } finally {
      setSalesLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addProductItem = (product: ProductList) => {
    const existingIdx = items.findIndex((i) => i.product_id === product.id);
    if (existingIdx >= 0) {
      const updated = [...items];
      updated[existingIdx].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku || "",
          quantity: 1,
          notes: "",
        },
      ]);
    }
    setShowProductSearch(false);
    setProductSearch("");
  };

  const updateItem = (idx: number, field: keyof DeliveryItem, value: string | number) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const resetFromSale = () => {
    if (selectedSale) {
      loadSaleDetails(selectedSale);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSale) {
      setError("Une vente doit être sélectionnée");
      return;
    }
    if (!recipientName.trim()) {
      setError("Le nom du destinataire est requis");
      return;
    }
    if (!deliveryAddress.trim()) {
      setError("L'adresse de livraison est requise");
      return;
    }
    if (items.length === 0) {
      setError("Ajoutez au moins un article");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createDeliveryNote({
        sale: selectedSale,
        delivery_date: deliveryDate,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        delivery_address: deliveryAddress,
        carrier_name: carrierName,
        driver_name: driverName,
        vehicle_info: vehicleInfo,
        notes,
        items: items.map((item) => ({
          product: item.product_id,
          quantity: item.quantity,
          notes: item.notes,
        })),
      });

      router.push(`/apps/${slug}/inventory/documents/delivery-notes`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du bon de livraison");
    } finally {
      setLoading(false);
    }
  };

  const canEditItems = !saleLoaded || editMode;

  return (
  <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES} showMessage>
        <div className="p-6">
      {/* Product Search Modal */}
      {showProductSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Sélectionner un produit</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowProductSearch(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto border-t">
              {filteredProducts.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground text-sm">Aucun produit trouvé</p>
              ) : (
                filteredProducts.slice(0, 20).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="w-full text-left p-3 hover:bg-muted/50 border-b transition-colors"
                    onClick={() => addProductItem(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/apps/${slug}/inventory/documents/delivery-notes`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" /> Nouveau bon de livraison
          </h1>
          <p className="text-muted-foreground">Créez un bon de livraison pour une vente</p>
        </div>
      </div>

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
          {/* Left & Center — Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vente sélectionnée */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Vente associée
              </h2>
              
              {salesLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Chargement des ventes...
                </div>
              ) : (
                <div className="space-y-4">
                  <QuickSelect
                    label="Vente associée"
                    items={sales.map((sale) => ({
                      id: sale.id,
                      name: `${sale.sale_number} — ${sale.customer_name || "Client inconnu"}`,
                      subtitle: new Date(sale.sale_date).toLocaleDateString("fr-FR"),
                    }))}
                    selectedId={selectedSale}
                    onSelect={setSelectedSale}
                    placeholder="Sélectionner une vente..."
                    icon={ShoppingCart}
                    accentColor="primary"
                    required
                    canCreate={false}
                  />

                  {/* Sale Info Card */}
                  {saleDetailsLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm p-3 bg-muted/30 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" /> Chargement des détails...
                    </div>
                  )}

                  {saleInfo && !saleDetailsLoading && (
                    <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="info">
                              {saleInfo.sale_number}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(saleInfo.sale_date).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{saleInfo.customer_name}</span>
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {saleInfo.total.toLocaleString("fr-FR")} GNF
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant="success" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Sélectionnée
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Articles */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Articles à livrer
                  <Badge variant="secondary">{items.length}</Badge>
                </h2>
                <div className="flex items-center gap-2">
                  {saleLoaded && (
                    <>
                      {editMode ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="warning" className="text-xs">
                            <Edit3 className="h-3 w-3 mr-1" />
                            Mode édition
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={resetFromSale}
                            className="text-xs"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Réinitialiser
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditMode(true)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                      )}
                    </>
                  )}
                  {canEditItems && (
                    <Button type="button" size="sm" onClick={() => setShowProductSearch(true)}>
                      <Plus className="mr-1 h-3 w-3" /> Ajouter
                    </Button>
                  )}
                </div>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-muted/20">
                  <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedSale 
                      ? "Cette vente ne contient aucun article" 
                      : "Sélectionnez une vente pour charger les articles"
                    }
                  </p>
                  {canEditItems && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setShowProductSearch(true)}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Ajouter manuellement
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={`${item.product_id}-${idx}`}
                      className={`border rounded-lg p-4 transition-all ${
                        !canEditItems 
                          ? "bg-muted/20 border-muted" 
                          : "bg-background hover:border-primary/30 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">{item.product_sku}</code>
                        </div>
                        {canEditItems && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(idx)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Quantité
                            {item.max_quantity && (
                              <span className="ml-1 text-primary">(max: {item.max_quantity})</span>
                            )}
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max={item.max_quantity}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                            disabled={!canEditItems}
                            className={!canEditItems ? "bg-muted/50" : ""}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Notes (optionnel)</Label>
                          <Input
                            value={item.notes}
                            onChange={(e) => updateItem(idx, "notes", e.target.value)}
                            placeholder="Remarques..."
                            disabled={!canEditItems}
                            className={!canEditItems ? "bg-muted/50" : ""}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Notes générales */}
            <Card className="p-4">
              <Label className="text-base font-medium">Notes générales</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instructions spéciales, remarques pour la livraison..."
                rows={3}
                className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </Card>
          </div>

          {/* Right column — Destinataire & Transporteur */}
          <div className="space-y-6">
            {/* Destinataire */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Destinataire
              </h2>
              <div className="space-y-3">
                <div>
                  <Label>Nom du destinataire *</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nom complet"
                    required
                    className="mt-1"
                  />
                  {saleInfo && recipientName === saleInfo.customer_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ Pré-rempli depuis la vente
                    </p>
                  )}
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+224 6XX XXX XXX"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Adresse de livraison *</Label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Quartier, rue, repères..."
                    rows={2}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Date de livraison */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Date de livraison</h2>
              <div>
                <Label>Date prévue *</Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </Card>

            {/* Transporteur */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" /> Transporteur
                <Badge variant="outline" className="text-xs font-normal">Optionnel</Badge>
              </h2>
              <div className="space-y-3">
                <div>
                  <Label>Société de transport</Label>
                  <Input
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="Nom de l'entreprise"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Chauffeur</Label>
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Nom du chauffeur"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Véhicule</Label>
                  <Input
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                    placeholder="Marque, immatriculation..."
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-2 sticky bottom-6">
              <Button
                type="submit"
                disabled={loading || items.length === 0 || !selectedSale}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création en cours...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Créer le bon de livraison
                  </div>
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href={`/apps/${slug}/inventory/documents/delivery-notes`}>Annuler</Link>
              </Button>
              {!selectedSale && (
                <p className="text-xs text-center text-muted-foreground">
                  Sélectionnez une vente pour continuer
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  </Can>
  );
}
