"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Input, Card, Alert, Badge, Label } from "@/components/ui";
import { createMovement, getProducts, getWarehouses, getProductStockByWarehouse } from "@/lib/services/inventory";
import type { Product, Warehouse, MovementCreate, Stock } from "@/lib/types/inventory";
import { MovementType } from "@/lib/types/inventory";
import {
  ArrowUpCircle,
  X,
  Search,
  Package,
  Warehouse as WarehouseIcon,
  Check,
  Loader2,
  Zap,
} from "lucide-react";

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationSlug: string;
}

export function QuickSaleModal({
  isOpen,
  onClose,
  onSuccess,
  organizationSlug,
}: QuickSaleModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductStocks, setSelectedProductStocks] = useState<Stock[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Search state
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);

  const productInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    if (isOpen) {
      loadData();
      // Focus on product search on open
      setTimeout(() => productInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Ctrl+Enter to submit
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedProduct, selectedWarehouse, quantity]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, warehousesData] = await Promise.all([
        getProducts({ is_active: true }),
        getWarehouses({ is_active: true }),
      ]);
      setProducts(productsData as Product[]);
      setWarehouses(warehousesData);
      // Auto-select first warehouse if only one
      if (warehousesData.length === 1) {
        setSelectedWarehouse(warehousesData[0]);
        setWarehouseSearch(warehousesData[0].name);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSelectedProductStocks([]);
    setSelectedWarehouse(null);
    setQuantity(1);
    setReference("");
    setNotes("");
    setProductSearch("");
    setWarehouseSearch("");
    setError(null);
    setSuccess(false);
  };

  // Helper pour obtenir le stock d'un produit dans un entrepôt spécifique
  // Utilise les stocks chargés depuis l'API (selectedProductStocks)
  const getStockInWarehouse = (warehouseId: string): number => {
    if (!selectedProductStocks || !selectedProductStocks.length) {
      return 0;
    }
    
    // Normaliser les IDs pour la comparaison (tous en string lowercase)
    const normalizedWarehouseId = String(warehouseId).toLowerCase().trim();
    
    const stock = selectedProductStocks.find(s => {
      const stockWarehouseId = String(s.warehouse || '').toLowerCase().trim();
      return stockWarehouseId === normalizedWarehouseId;
    });
    
    // Convertir en float pour s'assurer d'avoir une valeur numérique
    return parseFloat(String(stock?.quantity || 0));
  };

  const handleSubmit = async () => {
    if (!selectedProduct || !selectedWarehouse) {
      setError("Veuillez sélectionner un produit et un entrepôt");
      return;
    }

    // Convertir en float pour la comparaison
    const qty = parseFloat(String(quantity));
    if (isNaN(qty) || qty <= 0) {
      setError("La quantité doit être supérieure à 0");
      return;
    }

    // Validation côté frontend: vérifier le stock disponible
    const availableStock = getStockInWarehouse(selectedWarehouse.id);
    if (qty > availableStock) {
      setError(
        `Stock insuffisant. Stock disponible: ${availableStock} ${selectedProduct.unit || 'unités'}. ` +
        `Vous demandez: ${qty}. Le stock ne peut pas devenir négatif.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const movementData: MovementCreate = {
        product: selectedProduct.id,
        warehouse: selectedWarehouse.id,
        movement_type: MovementType.OUT,
        quantity,
        movement_date: new Date().toISOString().split("T")[0],
        reference: reference || `VENTE-${Date.now()}`,
        notes,
      };

      await createMovement(movementData);
      setSuccess(true);
      
      // Wait a moment to show success, then close
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err: any) {
      // Extraire le message d'erreur du backend
      let errorMessage = "Erreur lors de la création du mouvement";
      
      if (err.data) {
        // Erreur de validation du backend
        if (err.data.quantity) {
          errorMessage = Array.isArray(err.data.quantity) 
            ? err.data.quantity.join(". ") 
            : err.data.quantity;
        } else if (err.data.error) {
          errorMessage = err.data.error;
        } else if (err.data.detail) {
          errorMessage = err.data.detail;
        } else if (typeof err.data === 'string') {
          errorMessage = err.data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
      w.code.toLowerCase().includes(warehouseSearch.toLowerCase())
  );

  const handleProductSelect = async (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setShowProductDropdown(false);
    
    // Charger les stocks du produit sélectionné
    try {
      const stocks = await getProductStockByWarehouse(product.id);
      setSelectedProductStocks(stocks);
      console.log("Stocks loaded for product:", product.name, stocks);
    } catch (err) {
      console.error("Error loading stocks:", err);
      setSelectedProductStocks([]);
    }
    
    // Focus on quantity after product selection
    setTimeout(() => quantityInputRef.current?.focus(), 50);
  };

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setWarehouseSearch(warehouse.name);
    setShowWarehouseDropdown(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-sale-title"
    >
      <Card
        ref={modalRef}
        className="w-full max-w-lg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 id="quick-sale-title" className="text-xl font-bold">
                Sortie rapide
              </h2>
              <p className="text-sm text-muted-foreground">
                Enregistrer une vente ou sortie de stock
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Success State */}
        {success && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-green-600 dark:text-green-400">
              Sortie enregistrée avec succès !
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && !success && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Form */}
        {!loading && !success && (
          <div className="space-y-4">
            {/* Error */}
            {error && (
              <Alert variant="error" title="Erreur">
                {error}
              </Alert>
            )}

            {/* Product Search */}
            <div className="relative">
              <Label htmlFor="product-search">
                Produit <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={productInputRef}
                  id="product-search"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                    if (!e.target.value) setSelectedProduct(null);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="Rechercher un produit (nom ou SKU)..."
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
              {showProductDropdown && productSearch && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Aucun produit trouvé
                    </div>
                  ) : (
                    filteredProducts.slice(0, 10).map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="w-full p-3 text-left hover:bg-muted flex items-center justify-between"
                        onClick={() => handleProductSelect(product)}
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.sku}
                          </div>
                        </div>
                        <Badge variant="default">
                          Stock: {product.total_stock || 0}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedProduct && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  Stock total: <strong>{selectedProduct.total_stock || 0}</strong> {selectedProduct.unit}
                  {selectedWarehouse && (
                    <span className="ml-2">
                      (Dans <strong>{selectedWarehouse.name}</strong>: <strong>{getStockInWarehouse(selectedWarehouse.id)}</strong>)
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Warehouse Search */}
            <div className="relative">
              <Label htmlFor="warehouse-search">
                Entrepôt <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <WarehouseIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="warehouse-search"
                  value={warehouseSearch}
                  onChange={(e) => {
                    setWarehouseSearch(e.target.value);
                    setShowWarehouseDropdown(true);
                    if (!e.target.value) setSelectedWarehouse(null);
                  }}
                  onFocus={() => setShowWarehouseDropdown(true)}
                  placeholder="Sélectionner un entrepôt..."
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
              {showWarehouseDropdown && warehouseSearch && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                  {filteredWarehouses.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Aucun entrepôt trouvé
                    </div>
                  ) : (
                    filteredWarehouses.map((warehouse) => (
                      <button
                        key={warehouse.id}
                        type="button"
                        className="w-full p-3 text-left hover:bg-muted"
                        onClick={() => handleWarehouseSelect(warehouse)}
                      >
                        <div className="font-medium">{warehouse.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {warehouse.code}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="grid gap-4 grid-cols-2">
              <div>
                <Label htmlFor="quantity">
                  Quantité <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={quantityInputRef}
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="mt-1 text-lg font-bold text-center"
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-1"
                  placeholder="Ex: VENTE-001"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Commentaires sur la sortie..."
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-xs">
                  Ctrl+Enter
                </kbd>{" "}
                pour valider
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !selectedProduct || !selectedWarehouse || quantity <= 0}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle className="mr-2 h-4 w-4" />
                      Enregistrer la sortie
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
