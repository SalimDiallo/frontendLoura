"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, Alert } from "@/components/ui";
import { QuickSelect } from "@/components/ui/quick-select";
import { createMovement, getProducts, getWarehouses, getSuppliers, getCustomers, createSupplier, createCustomer } from "@/lib/services/inventory";
import { MovementType } from "@/lib/types/inventory";
import type { MovementCreate, Warehouse, ProductList, Supplier, Customer } from "@/lib/types/inventory";
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Settings,
  CheckCircle,
  Loader2,
  Package,
  Search,
  Users,
  Building2,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MOVEMENT_TYPES = [
  {
    value: MovementType.IN,
    label: "Entrée",
    description: "Réception de marchandises",
    icon: ArrowDownCircle,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-500",
    btnColor: "#16a34a",
  },
  {
    value: MovementType.OUT,
    label: "Sortie",
    description: "Vente, distribution",
    icon: ArrowUpCircle,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-500",
    btnColor: "#dc2626",
  },
  {
    value: MovementType.TRANSFER,
    label: "Transfert",
    description: "Entre entrepôts",
    icon: ArrowRightLeft,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-500",
    btnColor: "#2563eb",
  },
  {
    value: MovementType.ADJUSTMENT,
    label: "Ajustement",
    description: "Correction inventaire",
    icon: Settings,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    border: "border-orange-500",
    btnColor: "#ea580c",
  },
];

export default function NewMovementPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductList[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const generateRef = (type: MovementType) => {
    const prefixes: Record<MovementType, string> = {
      [MovementType.IN]: "ENT",
      [MovementType.OUT]: "SOR",
      [MovementType.TRANSFER]: "TRF",
      [MovementType.ADJUSTMENT]: "AJT",
    };
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefixes[type]}-${dateStr}-${random}`;
  };

  const [formData, setFormData] = useState<MovementCreate & { supplier_id?: string; customer_id?: string }>({
    product: "",
    warehouse: "",
    movement_type: MovementType.IN,
    quantity: 0,
    movement_date: new Date().toISOString().split("T")[0],
    reference: generateRef(MovementType.IN),
    notes: "",
    supplier_id: "",
    customer_id: "",
  });

  const handleTypeChange = (type: MovementType) => {
    setFormData(prev => ({
      ...prev,
      movement_type: type,
      reference: generateRef(type),
      supplier_id: "",
      customer_id: "",
    }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, warehousesData, suppliersData, customersData] = await Promise.all([
        getProducts({ is_active: true }),
        getWarehouses({ is_active: true }),
        getSuppliers({ is_active: true }).catch(() => []),
        getCustomers({ is_active: true }).catch(() => []),
      ]);
      setProducts(productsData);
      setWarehouses(warehousesData);
      setSuppliers(suppliersData);
      setCustomers(customersData);
      if (warehousesData.length > 0) {
        setFormData(prev => ({ ...prev, warehouse: warehousesData[0].id }));
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.product) {
      setError("Sélectionnez un produit");
      return;
    }
    if (!formData.warehouse) {
      setError("Sélectionnez un entrepôt");
      return;
    }
    if (formData.quantity <= 0) {
      setError("La quantité doit être supérieure à 0");
      return;
    }
    if (formData.movement_type === MovementType.TRANSFER && !formData.destination_warehouse) {
      setError("Sélectionnez un entrepôt de destination");
      return;
    }

    try {
      setLoading(true);
      
      let notes = formData.notes || "";
      if (formData.movement_type === MovementType.IN && formData.supplier_id) {
        const supplier = suppliers.find(s => s.id === formData.supplier_id);
        if (supplier) notes = `Fournisseur: ${supplier.name}\n${notes}`.trim();
      }
      if (formData.movement_type === MovementType.OUT && formData.customer_id) {
        const customer = customers.find(c => c.id === formData.customer_id);
        if (customer) notes = `Client: ${customer.name}\n${notes}`.trim();
      }
      
      const { supplier_id, customer_id, ...movementData } = formData;
      await createMovement({ ...movementData, notes });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/apps/${slug}/inventory/movements`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = MOVEMENT_TYPES.find(t => t.value === formData.movement_type)!;
  const filteredProducts = products.filter(p =>
    productSearch === "" ? true :
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );
  const selectedProduct = products.find(p => p.id === formData.product);

  if (success) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4", selectedType.bg)}>
            <CheckCircle className={cn("h-10 w-10", selectedType.color)} />
          </div>
          <h2 className="text-xl font-bold mb-2">Mouvement créé !</h2>
          <p className="text-muted-foreground">Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/apps/${slug}/inventory/movements`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Nouveau mouvement</h1>
          <p className="text-sm text-muted-foreground">Enregistrer une entrée, sortie ou transfert</p>
        </div>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground">1. Type de mouvement</h3>
          <div className="grid grid-cols-4 gap-2">
            {MOVEMENT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.movement_type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center transition-all",
                    isSelected ? `${type.border} ${type.bg}` : "border-muted hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn("h-6 w-6 mx-auto mb-1", isSelected ? type.color : "text-muted-foreground")} />
                  <span className={cn("text-xs font-medium", isSelected && type.color)}>{type.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Produit */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground">2. Produit</h3>
          {selectedProduct ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedProduct.sku}</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(prev => ({ ...prev, product: "" }))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Aucun produit</div>
                ) : (
                  filteredProducts.slice(0, 8).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => { setFormData(prev => ({ ...prev, product: product.id })); setProductSearch(""); }}
                      className="w-full p-3 text-left hover:bg-muted/50 flex items-center gap-3"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Fournisseur (pour entrées) */}
        {formData.movement_type === MovementType.IN && (
          <Card className="p-4 border-green-200 dark:border-green-800">
            <h3 className="font-medium mb-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Fournisseur (optionnel)
            </h3>
            <QuickSelect
              label="Fournisseur"
              items={suppliers.map(s => ({ id: s.id, name: s.name, subtitle: s.phone }))}
              selectedId={formData.supplier_id || ""}
              onSelect={(id) => setFormData(prev => ({ ...prev, supplier_id: id }))}
              onCreate={async (name, phone) => {
                const code = `SUP-${Date.now().toString(36).toUpperCase()}`;
                const newSupplier = await createSupplier({ name, phone: phone || "", code });
                setSuppliers(prev => [...prev, newSupplier]);
                return { id: newSupplier.id, name: newSupplier.name };
              }}
              placeholder="Rechercher ou créer un fournisseur..."
              icon={Building2}
              accentColor="green"
              createLabel="Nouveau fournisseur"
              extraFieldLabel="Téléphone (optionnel)"
            />
          </Card>
        )}

        {/* Client (pour sorties) */}
        {formData.movement_type === MovementType.OUT && (
          <Card className="p-4 border-blue-200 dark:border-blue-800">
            <h3 className="font-medium mb-3 text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Client (optionnel)
            </h3>
            <QuickSelect
              label="Client"
              items={customers.map(c => ({ id: c.id, name: c.name, subtitle: c.phone }))}
              selectedId={formData.customer_id || ""}
              onSelect={(id) => setFormData(prev => ({ ...prev, customer_id: id }))}
              onCreate={async (name, phone) => {
                const code = `CLI-${Date.now().toString(36).toUpperCase()}`;
                const newCustomer = await createCustomer({ name, phone: phone || "", code });
                setCustomers(prev => [...prev, newCustomer]);
                return { id: newCustomer.id, name: newCustomer.name };
              }}
              placeholder="Rechercher ou créer un client..."
              icon={Users}
              accentColor="blue"
              createLabel="Nouveau client"
              extraFieldLabel="Téléphone (optionnel)"
            />
          </Card>
        )}

        {/* Détails */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground">3. Détails</h3>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  {formData.movement_type === MovementType.TRANSFER ? "Source" : "Entrepôt"}
                </label>
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
              <div>
                <label className="block text-xs font-medium mb-1">Quantité</label>
                <Input
                  type="number"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="1"
                  className="text-lg font-bold"
                />
              </div>
            </div>

            {formData.movement_type === MovementType.TRANSFER && (
              <div>
                <label className="block text-xs font-medium mb-1">Destination</label>
                <select
                  value={formData.destination_warehouse || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination_warehouse: e.target.value }))}
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {warehouses.filter(w => w.id !== formData.warehouse).map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1">Référence</label>
              <Input
                value={formData.reference || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                placeholder="Optionnel..."
              />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading || !formData.product || !formData.warehouse || formData.quantity <= 0}
          className="w-full h-12 text-lg font-semibold"
          style={{ backgroundColor: selectedType.btnColor }}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {React.createElement(selectedType.icon, { className: "mr-2 h-5 w-5" })}
              Enregistrer {selectedType.label.toLowerCase()}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
