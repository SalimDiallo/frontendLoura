"use client";

import { Can } from "@/components/apps/common";
import { DeleteConfirmation } from "@/components/common/confirmation-dialog";
import { Badge, Button, Card } from "@/components/ui";
import { ShortcutsHelpModal } from "@/components/ui/shortcuts-help";
import { KeyboardShortcut, commonShortcuts, useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { deleteProduct, getProduct, getProductMovements, getProductStockByWarehouse, getWarehouses } from "@/lib/services/inventory";
import type { Movement, Product, Stock } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  DollarSign,
  Edit,
  HelpCircle,
  Package,
  Trash2,
  TrendingUp,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Suppression state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Quick stock modal
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
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du produit");
    } finally {
      setLoading(false);
    }
  };

  // Handler to open delete confirmation dialog
  const handleRequestDelete = () => {
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  // Handler that runs after confirmation in the dialog
  const handleConfirmDelete = async () => {
    if (!product) return;
    setDeleteError(null);

    // Vérifier si le produit peut être supprimé
    const totalStock = stocks.reduce((sum, s) => sum + parseFloat(String(s.quantity || 0)), 0);
    if (totalStock > 0) {
      setDeleteError(`Impossible de supprimer ce produit car il a ${totalStock} unités en stock. Veuillez d'abord vider le stock.`);
      return;
    }

    setIsDeleteLoading(true);
    try {
      await deleteProduct(productId);
      setIsDeleteLoading(false);
      setShowDeleteDialog(false);
      router.push(`/apps/${slug}/inventory/products`);
    } catch (err: any) {
      const errorMessage = err.data?.error || err.message || "Erreur lors de la suppression";
      setDeleteError(errorMessage);
      setIsDeleteLoading(false);
      // Ne pas fermer le dialog si erreur, il reste ouvert pour afficher l'erreur
      // setShowDeleteDialog(false);  // <-- Surtout NE PAS fermer sur erreur !
    }
  };

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    { key: "e", action: () => router.push(`/apps/${slug}/inventory/products/${productId}/edit`), description: "Modifier le produit" },
    { key: "m", action: () => router.push(`/apps/${slug}/inventory/movements?product=${productId}`), description: "Voir tous les mouvements" },
    { key: "r", action: () => loadProductDetails(), description: "Rafraîchir" },
    commonShortcuts.help(() => setShowShortcuts(true)),

  ], [slug, productId, router, showShortcuts]);

  useKeyboardShortcuts({ shortcuts });

  // --- Utils sécurisé pour prix, stocks, valeur etc ---
  function safeNumber(val?: any, fallback: number = 0): number {
    const n = typeof val === "number" ? val : parseFloat(val || "");
    if (isNaN(n) || val === null || val === undefined) return fallback;
    return n;
  }

  // Valeur du stock = stock total * prix d'achat (ou 0 si un manquant)
  const totalStock = safeNumber(product?.total_stock, 0);

  // Prix achat sécurisé (unitaire)
  const purchasePrice = safeNumber(product?.purchase_price, 0);

  // Prix vente sécurisé (unitaire)
  const sellingPrice = safeNumber(product?.selling_price, 0);

  // Valeur du stock : si product.stock_value est renseigné, on l'utilise. Sinon, calcul à la volée.
  const stockValue =
    product?.stock_value != null && !isNaN(product.stock_value)
      ? safeNumber(product.stock_value, 0)
      : totalStock * purchasePrice;

  // Marge en %, prend en compte null et division par 0 ou prix achat null/0.
  let marginDisplay = "-";
  if (purchasePrice > 0) {
    const margin = ((sellingPrice - purchasePrice) / purchasePrice) * 100;
    marginDisplay = `${margin.toFixed(2)}%`;
  } else if (sellingPrice > 0) {
    // 100% si vente et prix achat manquant
    marginDisplay = "100.00%";
  } else if (purchasePrice === 0 && sellingPrice === 0) {
    marginDisplay = "-";
  }

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS} showMessage>
      <div className="space-y-6 p-6">
        {/* Modal des raccourcis */}
        <ShortcutsHelpModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          shortcuts={shortcuts}
          title="Raccourcis clavier - Produit"
        />
        {/* Modal confirmation suppression */}
        <DeleteConfirmation
          open={showDeleteDialog}
          onOpenChange={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title={`Supprimer le produit "${product?.name}" ?`}
          description={deleteError ??
            "Cette action est irréversible. Êtes-vous sûr de vouloir supprimer ce produit de l'inventaire ?"
          
          }
          loading={isDeleteLoading}
        />
        
     
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
              <h1 className="text-3xl font-bold">{product?.name}</h1>
              <p className="text-muted-foreground mt-1">
                SKU: <code className="bg-muted px-2 py-1 rounded text-sm">{product?.sku}</code>
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
            <Badge variant={product?.is_active ? "success" : "secondary"}>
              {product?.is_active ? "Actif" : "Inactif"}
            </Badge>
            {product?.is_low_stock && (
              <Badge variant="error">Stock bas</Badge>
            )}
            <Can allPermissions={[COMMON_PERMISSIONS.INVENTORY.UPDATE_PRODUCTS]}>
              <Link href={`/apps/${slug}/inventory/products/${productId}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                  <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-xs">E</kbd>
                </Button>
              </Link>
            </Can>
           <Can permission={COMMON_PERMISSIONS.INVENTORY.DELETE_PRODUCTS}>
           { totalStock === 0 &&
            <Button variant="destructive" onClick={handleRequestDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
           }
           </Can>
          </div>
        </div>

        {/* Main Info */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock total</p>
                <p className="text-3xl font-bold mt-2">{totalStock}</p>
                <p className="text-xs text-muted-foreground mt-1">{product?.unit}</p>
              </div>
              <Package className="h-10 w-10 text-foreground opacity-80" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur du stock</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(stockValue)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prix d&apos;achat</p>
                <p className="text-2xl font-bold mt-2">
                  {purchasePrice > 0 ? formatCurrency(purchasePrice) : "-"}
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
                  {sellingPrice > 0 ? formatCurrency(sellingPrice) : "-"}
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
                <dd className="font-medium">{product?.category_name || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Code-barres:</dt>
                <dd className="font-medium font-mono">{product?.barcode || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Unité:</dt>
                <dd className="font-medium">{product?.unit}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Stock minimum:</dt>
                <dd className="font-medium">{product?.min_stock_level}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Stock maximum:</dt>
                <dd className="font-medium">{product?.max_stock_level}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Marge:</dt>
                <dd className={cn(
                  "font-medium",
                  (purchasePrice > 0 && sellingPrice > purchasePrice) ? "text-green-600" : (purchasePrice > 0 ? "text-red-600" : "text-muted-foreground")
                )}>
                  {marginDisplay}
                </dd>
              </div>
            </dl>
            {product?.description && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{product?.description}</p>
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
                      <p className="text-2xl font-bold">{safeNumber(stock.quantity, 0)}</p>
                      <p className="text-xs text-muted-foreground">{product?.unit}</p>
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
                      <td className="p-3 text-right font-medium">{safeNumber(movement.quantity, 0)}</td>
                      <td className="p-3 text-muted-foreground">{movement.reference || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Can>
  );
}
