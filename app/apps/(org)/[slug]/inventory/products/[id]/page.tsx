"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Alert, Badge, Card, Input, Label } from "@/components/ui";
import { getProduct, getProductStockByWarehouse, getProductMovements, deleteProduct, createMovement, getWarehouses } from "@/lib/services/inventory";
import type { Product, Stock, Movement, Warehouse, MovementCreate } from "@/lib/types/inventory";
import { MovementType } from "@/lib/types/inventory";
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  Warehouse as WarehouseIcon,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Plus,
  Minus,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, KeyboardHint } from "@/components/ui/shortcuts-help";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Quick stock modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalType, setStockModalType] = useState<'in' | 'out'>('in');
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockWarehouse, setStockWarehouse] = useState<string>('');
  const [stockReference, setStockReference] = useState('');
  const [stockSubmitting, setStockSubmitting] = useState(false);

  const quantityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productData, stocksData, movementsData, warehousesData] = await Promise.all([
        getProduct(productId),
        getProductStockByWarehouse(productId).catch(() => []),
        getProductMovements(productId).catch(() => []),
        getWarehouses({ is_active: true }).catch(() => []),
      ]);

      setProduct(productData);
      setStocks(stocksData);
      setMovements(movementsData.slice(0, 10));
      setWarehouses(warehousesData);

      // Auto-select warehouse if only one
      if (warehousesData.length === 1) {
        setStockWarehouse(warehousesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du produit");
    } finally {
      setLoading(false);
    }
  };

  const openStockModal = (type: 'in' | 'out') => {
    setStockModalType(type);
    setStockQuantity(1);
    setStockReference('');
    setShowStockModal(true);
    setTimeout(() => quantityInputRef.current?.focus(), 100);
  };

  const handleStockSubmit = async () => {
    // Convertir en float pour les comparaisons
    const qty = parseFloat(String(stockQuantity));
    if (!product || !stockWarehouse || isNaN(qty) || qty <= 0) {
      return;
    }

    // Vérification pour les sorties
    if (stockModalType === 'out') {
      const currentStock = stocks.find(s => s.warehouse === stockWarehouse);
      // Convertir en float pour la comparaison
      const available = parseFloat(String(currentStock?.quantity || 0));
      if (qty > available) {
        setError(`Stock insuffisant. Disponible: ${available}, demandé: ${qty}`);
        return;
      }
    }

    try {
      setStockSubmitting(true);
      setError(null);

      const movementData: MovementCreate = {
        product: productId,
        warehouse: stockWarehouse,
        movement_type: stockModalType === 'in' ? MovementType.IN : MovementType.OUT,
        quantity: stockQuantity,
        movement_date: new Date().toISOString().split("T")[0],
        reference: stockReference || `${stockModalType === 'in' ? 'ENTREE' : 'SORTIE'}-${Date.now()}`,
      };

      await createMovement(movementData);
      setShowStockModal(false);
      loadProductDetails(); // Reload to update stocks
    } catch (err: any) {
      const errorMessage = err.data?.quantity?.[0] || err.data?.error || err.message || "Erreur lors du mouvement";
      setError(errorMessage);
    } finally {
      setStockSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    // Vérifier si le produit peut être supprimé
    // Convertir en float pour la somme
    const totalStock = stocks.reduce((sum, s) => sum + parseFloat(String(s.quantity || 0)), 0);
    if (totalStock > 0) {
      alert(`Impossible de supprimer ce produit car il a ${totalStock} unités en stock. Veuillez d'abord vider le stock.`);
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) {
      return;
    }

    try {
      await deleteProduct(productId);
      router.push(`/apps/${slug}/inventory/products`);
    } catch (err: any) {
      const errorMessage = err.data?.error || err.message || "Erreur lors de la suppression";
      alert(errorMessage);
    }
  };

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    { key: "+", action: () => openStockModal('in'), description: "Ajouter du stock" },
    { key: "=", action: () => openStockModal('in'), description: "Ajouter du stock" },
    { key: "-", action: () => openStockModal('out'), description: "Retirer du stock" },
    { key: "e", action: () => router.push(`/apps/${slug}/inventory/products/${productId}/edit`), description: "Modifier le produit" },
    { key: "m", action: () => router.push(`/apps/${slug}/inventory/movements?product=${productId}`), description: "Voir tous les mouvements" },
    { key: "r", action: () => loadProductDetails(), description: "Rafraîchir" },
    commonShortcuts.help(() => setShowShortcuts(true)),
    commonShortcuts.escape(() => {
      if (showStockModal) setShowStockModal(false);
      else if (showShortcuts) setShowShortcuts(false);
    }),
  ], [slug, productId, router, showStockModal, showShortcuts]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-4">
        <Alert variant="error" title="Erreur">
          {error || "Produit introuvable"}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Modal des raccourcis */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Produit"
      />

      {/* Modal d'ajout/retrait de stock */}
      <Dialog open={showStockModal} onOpenChange={setShowStockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {stockModalType === 'in' ? (
                <>
                  <Plus className="h-5 w-5 text-green-500" />
                  Ajouter du stock
                </>
              ) : (
                <>
                  <Minus className="h-5 w-5 text-red-500" />
                  Retirer du stock
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {stockModalType === 'in' 
                ? "Enregistrer une entrée de stock pour ce produit"
                : "Enregistrer une sortie de stock pour ce produit"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Entrepôt *</Label>
              <select
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={stockWarehouse}
                onChange={(e) => setStockWarehouse(e.target.value)}
              >
                <option value="">Sélectionner un entrepôt</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Quantité *</Label>
              <Input
                ref={quantityInputRef}
                type="number"
                min="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 1)}
                className="text-lg font-bold"
              />
              {stockModalType === 'out' && stockWarehouse && (
                <p className="text-xs text-muted-foreground">
                  Stock disponible: {stocks.find(s => s.warehouse === stockWarehouse)?.quantity || 0} {product.unit}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Référence (optionnel)</Label>
              <Input
                placeholder="Ex: Commande #123, Vente..."
                value={stockReference}
                onChange={(e) => setStockReference(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleStockSubmit}
              disabled={stockSubmitting || !stockWarehouse || stockQuantity <= 0}
              className={stockModalType === 'in' 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
              }
            >
              {stockSubmitting ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : stockModalType === 'in' ? (
                <Plus className="mr-2 h-4 w-4" />
              ) : (
                <Minus className="mr-2 h-4 w-4" />
              )}
              {stockModalType === 'in' ? 'Ajouter' : 'Retirer'} {stockQuantity} {product.unit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/apps/${slug}/inventory/products`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground mt-1">
              SKU: <code className="bg-muted px-2 py-1 rounded text-sm">{product.sku}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            aria-label="Afficher les raccourcis clavier"
            title="Raccourcis clavier (?)"
          >
            <HelpCircle className="size-4" />
          </Button>
          <Badge variant={product.is_active ? "default" : "secondary"}>
            {product.is_active ? "Actif" : "Inactif"}
          </Badge>
          {product.is_low_stock && (
            <Badge variant="error">Stock bas</Badge>
          )}
          <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => openStockModal('in')}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
            <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1 font-mono text-xs">+</kbd>
          </Button>
          <Button variant="destructive" onClick={() => openStockModal('out')}>
            <Minus className="mr-2 h-4 w-4" />
            Retirer
            <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1 font-mono text-xs">-</kbd>
          </Button>
          <Link href={`/apps/${slug}/inventory/products/${productId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Modifier
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-xs">E</kbd>
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Stock total</p>
              <p className="text-3xl font-bold mt-2">{product.total_stock || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{product.unit}</p>
            </div>
            <Package className="h-10 w-10 text-blue-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valeur du stock</p>
              <p className="text-2xl font-bold mt-2">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'GNF',
                  maximumFractionDigits: 0,
                }).format(product.stock_value || 0)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-green-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Prix d'achat</p>
              <p className="text-2xl font-bold mt-2">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'GNF',
                  maximumFractionDigits: 0,
                }).format(product.purchase_price)}
              </p>
            </div>
            <ArrowDownCircle className="h-10 w-10 text-orange-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Prix de vente</p>
              <p className="text-2xl font-bold mt-2">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'GNF',
                  maximumFractionDigits: 0,
                }).format(product.selling_price)}
              </p>
            </div>
            <ArrowUpCircle className="h-10 w-10 text-purple-500 opacity-80" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Détails du produit */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Détails du produit</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Catégorie:</dt>
              <dd className="font-medium">{product.category_name || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Code-barres:</dt>
              <dd className="font-medium font-mono">{product.barcode || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Unité:</dt>
              <dd className="font-medium">{product.unit}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Stock minimum:</dt>
              <dd className="font-medium">{product.min_stock_level}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Stock maximum:</dt>
              <dd className="font-medium">{product.max_stock_level}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Marge:</dt>
              <dd className={cn(
                "font-medium",
                product.selling_price > product.purchase_price ? "text-green-600" : "text-red-600"
              )}>
                {((product.selling_price - product.purchase_price) / product.purchase_price * 100).toFixed(2)}%
              </dd>
            </div>
          </dl>
          {product.description && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>
          )}
        </Card>

        {/* Stock par entrepôt */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Stock par entrepôt</h2>
          {stocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <WarehouseIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun stock disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stocks.map((stock) => (
                <div key={stock.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{stock.warehouse_name}</p>
                    <p className="text-sm text-muted-foreground">{stock.warehouse_code}</p>
                    {stock.location && (
                      <p className="text-xs text-muted-foreground">📍 {stock.location}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stock.quantity}</p>
                    <p className="text-xs text-muted-foreground">{product.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Derniers mouvements */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Derniers mouvements</h2>
        {movements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucun mouvement enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Entrepôt</th>
                  <th className="text-right p-3 font-medium">Quantité</th>
                  <th className="text-left p-3 font-medium">Référence</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      {new Date(movement.movement_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-3">
                      <Badge variant={
                        movement.movement_type === 'in' ? 'success' :
                        movement.movement_type === 'out' ? 'error' :
                        'secondary'
                      }>
                        {movement.movement_type_display}
                      </Badge>
                    </td>
                    <td className="p-3">{movement.warehouse_name}</td>
                    <td className="p-3 text-right font-medium">{movement.quantity}</td>
                    <td className="p-3 text-muted-foreground">{movement.reference || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
