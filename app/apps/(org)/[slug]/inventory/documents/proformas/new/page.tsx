"use client";

import { Alert, Button, Card, Input, Label, QuickSelect } from "@/components/ui";
import { formatCurrency } from "@/lib";
import { createProforma, getCustomers, getProducts } from "@/lib/services/inventory";
import type { Customer, ProductList, ProformaCreate } from "@/lib/types/inventory";
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  Calendar,
  FileText,
  Package,
  Save,
  Search,
  Trash2,
  User,
  X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ProformaItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function NewProformaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductList[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  const [items, setItems] = useState<ProformaItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showProductSearch && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showProductSearch]);

  const loadData = async () => {
    try {
      const [productsData, customersData] = await Promise.all([
        getProducts({ is_active: true }),
        getCustomers({ is_active: true }),
      ]);
      setProducts(productsData);
      setCustomers(customersData);
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

  const addItem = (product: ProductList) => {
    const existingIndex = items.findIndex((item) => item.product_id === product.id);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].subtotal = newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
      setItems(newItems);
    } else {
      const newItem: ProformaItem = {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku || "",
        quantity: 1,
        unit_price: product.selling_price || 0,
        subtotal: product.selling_price || 0,
      };
      setItems([...items, newItem]);
    }
    setSearchTerm("");
    setShowProductSearch(false);
  };

  const updateItem = (index: number, field: keyof ProformaItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    newItems[index].subtotal = newItems[index].quantity * newItems[index].unit_price;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    if (customerId) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        setClientName(customer.name);
        setClientAddress(customer.address || "");
        setClientPhone(customer.phone || "");
      }
    }
  };

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + validityDays);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError("Ajoutez au moins un produit");
      return;
    }

    if (!clientName.trim()) {
      setError("Le nom du client est requis");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const proformaData: ProformaCreate = {
        customer: selectedCustomer || undefined,
        client_name: clientName,
        client_address: clientAddress,
        client_phone: clientPhone,
        validity_days: validityDays,
        notes,
        items: items.map((item) => ({
          product: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      await createProforma(proformaData);
      router.push(`/apps/${slug}/inventory/documents/proformas`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de la pro forma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 to-background">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/apps/${slug}/inventory/documents/proformas`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Nouvelle facture pro forma
              </h1>
              <p className="text-sm text-muted-foreground">
                Créez un devis pour votre client
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <Alert variant="error">
            <AlertTriangle className="h-4 w-4" />
            <div className="flex-1">
              <h3 className="font-semibold">Erreur</h3>
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Products */}
            <div className="lg:col-span-2 space-y-6 overflow-visible">
              {/* Product Search */}
              <Card className="p-5 shadow-md overflow-visible">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
                  <Search className="h-5 w-5" />
                  Rechercher des produits
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Nom du produit, SKU..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowProductSearch(e.target.value.length > 0);
                    }}
                    onFocus={() => searchTerm.length > 0 && setShowProductSearch(true)}
                    className="pl-10 h-11"
                  />
                </div>
              </Card>

              {/* Dropdown as Portal */}
              {showProductSearch && searchTerm && (
                <>
                  <div
                    className="fixed inset-0"
                    style={{ zIndex: 9998 }}
                    onClick={() => setShowProductSearch(false)}
                  />
                  <div
                    className="fixed bg-white dark:bg-gray-800 border rounded-lg shadow-xl max-h-80 overflow-y-auto"
                    style={{
                      zIndex: 9999,
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`,
                    }}
                  >
                    {filteredProducts.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Aucun produit trouvé</p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {filteredProducts.slice(0, 10).map((product) => (
                          <div
                            key={product.id}
                            className="p-3 hover:bg-muted cursor-pointer flex items-center justify-between border-b last:border-0"
                            onClick={() => addItem(product)}
                          >
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {product.sku}
                              </code>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-primary">
                                {formatCurrency(product.selling_price || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Stock: {product.total_stock || 0}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Items */}
              <Card className="p-5 shadow-md overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <Package className="h-5 w-5" />
                    Articles ajoutés
                  </h2>
                  <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                    {items.length} article{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border-2 border-dashed">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Aucun article ajouté</p>
                    <p className="text-sm mt-1">Recherchez et ajoutez des produits ci-dessus</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item.product_id}
                        className="border rounded-lg p-4 bg-gradient-to-r from-background to-muted/20 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-base">{item.product_name}</p>
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                              {item.product_sku}
                            </code>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Quantité</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(index, "quantity", parseInt(e.target.value) || 1)
                              }
                              className="mt-1"
                            />
                          </div>
                          <span className="text-muted-foreground mt-6">×</span>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Prix unitaire</Label>
                            <Input
                              type="number"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                              }
                              className="mt-1"
                            />
                          </div>
                          <span className="text-muted-foreground mt-6">=</span>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Sous-total</Label>
                            <div className="mt-1 h-10 flex items-center">
                              <span className="font-bold text-lg text-primary">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column - Client & Summary */}
            <div className="space-y-6">
              {/* Client */}
              <Card className="p-5 shadow-md">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
                  <User className="h-5 w-5" />
                  Informations client
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Client existant</Label>
                    <QuickSelect
                      label="Client existant"
                      items={customers.map((c) => ({
                        id: c.id,
                        name: c.name,
                        subtitle: c.phone || c.email || undefined,
                      }))}
                      selectedId={selectedCustomer}
                      onSelect={handleCustomerChange}
                      placeholder="Rechercher ou sélectionner un client..."
                      icon={User}
                      accentColor="primary"
                      canCreate={false}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Nom <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nom du client"
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Adresse</Label>
                    <Input
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Adresse complète"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Téléphone</Label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+224 XXX XX XX XX"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </Card>

              {/* Validity */}
              <Card className="p-5 shadow-md">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
                  <Calendar className="h-5 w-5" />
                  Validité du devis
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Durée de validité (jours)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={validityDays}
                      onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Valide jusqu'au
                    </p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-1">
                      {validityDate.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Summary */}
              <Card className="p-5 shadow-md bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
                  <Calculator className="h-5 w-5" />
                  Montant total
                </h2>
                <div className="text-4xl font-bold text-primary">{formatCurrency(total)}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {items.length} article{items.length !== 1 ? "s" : ""}
                </p>
              </Card>

              {/* Notes */}
              <Card className="p-5 shadow-md">
                <Label className="text-sm font-medium">Notes & conditions</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Conditions de paiement, remarques particulières..."
                  rows={4}
                  className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="w-full h-12 text-base font-semibold shadow-lg"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                      Création en cours...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      Créer la pro forma
                    </div>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  asChild
                >
                  <Link href={`/apps/${slug}/inventory/documents/proformas`}>Annuler</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
