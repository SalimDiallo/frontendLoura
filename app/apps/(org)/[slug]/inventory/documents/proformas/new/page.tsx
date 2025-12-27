"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Input, Label } from "@/components/ui";
import { createProforma, getProducts, getCustomers } from "@/lib/services/inventory";
import type { ProformaCreate, ProductList, Customer } from "@/lib/types/inventory";
import {
  ArrowLeft,
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  FileText,
  Search,
  Calculator,
  Calendar,
} from "lucide-react";
import Link from "next/link";

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

  useEffect(() => {
    loadData();
  }, []);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/apps/${slug}/inventory/documents/proformas`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle facture pro forma</h1>
          <p className="text-muted-foreground">
            Créez un devis pour votre client
          </p>
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
          {/* Left Column - Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Search */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
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
                          onClick={() => addItem(product)}
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(product.selling_price || 0)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Items */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">
                Articles ({items.length})
              </h2>
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun article ajouté</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.product_id}
                      className="border rounded-lg p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <code className="text-xs bg-muted px-1 rounded">{item.product_sku}</code>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <span className="text-muted-foreground">×</span>
                        <div className="w-28">
                          <Input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <span className="text-muted-foreground">=</span>
                        <span className="font-bold w-32 text-right">
                          {formatCurrency(item.subtotal)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Client</h2>
              <div className="space-y-4">
                <div>
                  <Label>Client existant</Label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Nouveau client</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Nom *</Label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nom du client"
                    required
                  />
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Adresse"
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Téléphone"
                  />
                </div>
              </div>
            </Card>

            {/* Validity */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Validité
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Durée de validité (jours)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Valide jusqu'au: {validityDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
            </Card>

            {/* Summary */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Total
              </h2>
              <div className="text-3xl font-bold">{formatCurrency(total)}</div>
            </Card>

            {/* Notes */}
            <Card className="p-4">
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conditions, remarques..."
                rows={3}
                className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading || items.length === 0}
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
                    Créer la pro forma
                  </div>
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href={`/apps/${slug}/inventory/documents/proformas`}>Annuler</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
