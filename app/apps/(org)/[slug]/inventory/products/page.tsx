"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getProducts, deleteProduct } from "@/lib/services/inventory";
import type { ProductList } from "@/lib/types/inventory";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";
import { Can } from "@/components/apps/common/protected-route";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";

export default function ProductsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [products, setProducts] = useState<ProductList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    loadProducts();
  }, [slug, filterActive, filterLowStock]);

  // Scroll vers l'élément sélectionné
  useEffect(() => {
    if (selectedIndex >= 0 && tableRef.current) {
      const rows = tableRef.current.querySelectorAll("tr");
      rows[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (filterActive !== undefined) params.is_active = filterActive;
      if (filterLowStock) params.low_stock = true;

      const data = await getProducts(params);
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${name}" ?`)) {
      return;
    }

    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  const filteredProducts = products.filter((product) =>
    searchTerm === ""
      ? true
      : product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Définir les raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.new(() => router.push(`/apps/${slug}/inventory/products/new`)),
    commonShortcuts.help(() => setShowShortcuts(true)),
    commonShortcuts.escape(() => {
      if (showShortcuts) {
        setShowShortcuts(false);
      } else if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearchTerm("");
      } else {
        setSelectedIndex(-1);
      }
    }),
    commonShortcuts.arrowDown(() => {
      setSelectedIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    commonShortcuts.enter(() => {
      if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
        router.push(`/apps/${slug}/inventory/products/${filteredProducts[selectedIndex].id}`);
      }
    }),
    commonShortcuts.filter("1", () => setFilterActive(undefined), "Tous les produits"),
    commonShortcuts.filter("2", () => setFilterActive(filterActive === true ? undefined : true), "Produits actifs"),
    commonShortcuts.filter("3", () => setFilterActive(filterActive === false ? undefined : false), "Produits inactifs"),
    commonShortcuts.filter("4", () => setFilterLowStock(!filterLowStock), "Stock bas"),
    { key: "e", action: () => {
      if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
        router.push(`/apps/${slug}/inventory/products/${filteredProducts[selectedIndex].id}/edit`);
      }
    }, description: "Éditer le produit sélectionné" },
  ], [slug, router, showShortcuts, selectedIndex, filteredProducts, filterActive, filterLowStock]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Chargement">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS} showMessage={true}>
      <div className="space-y-6 p-6">
        {/* Modal des raccourcis */}
        <ShortcutsHelpModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          shortcuts={shortcuts}
          title="Raccourcis clavier - Produits"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Produits</h1>
            <p className="text-muted-foreground mt-1">
              Gérez votre catalogue de produits
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              aria-label="Afficher les raccourcis clavier"
              title="Raccourcis clavier (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_PRODUCTS}>
              <Button asChild>
                <Link href={`/apps/${slug}/inventory/products/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau produit
                  <ShortcutBadge shortcut={shortcuts.find(s => s.key === "n")!} />
                </Link>
              </Button>
            </Can>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Rechercher par nom ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-20"
                  aria-label="Rechercher des produits"
                />
                <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                  Ctrl+K
                </kbd>
              </div>
            </div>
            <div className="flex gap-2" role="group" aria-label="Filtrer les produits">
              <Button
                variant={filterActive === undefined ? "default" : "outline"}
                onClick={() => setFilterActive(undefined)}
                aria-pressed={filterActive === undefined}
              >
                Tous
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">1</kbd>
              </Button>
              <Button
                variant={filterActive === true ? "default" : "outline"}
                onClick={() => setFilterActive(filterActive === true ? undefined : true)}
                aria-pressed={filterActive === true}
              >
                Actifs
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">2</kbd>
              </Button>
              <Button
                variant={filterActive === false ? "default" : "outline"}
                onClick={() => setFilterActive(filterActive === false ? undefined : false)}
                aria-pressed={filterActive === false}
              >
                Inactifs
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">3</kbd>
              </Button>
              <Button
                variant={filterLowStock ? "destructive" : "outline"}
                onClick={() => setFilterLowStock(!filterLowStock)}
                aria-pressed={filterLowStock}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Stock bas
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">4</kbd>
              </Button>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="error" role="alert">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <h3 className="font-semibold">Erreur</h3>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        {/* Products List */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full" role="grid" aria-label="Liste des produits">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="text-left p-4 font-medium">Produit</th>
                  <th scope="col" className="text-left p-4 font-medium">SKU</th>
                  <th scope="col" className="text-left p-4 font-medium">Catégorie</th>
                  <th scope="col" className="text-right p-4 font-medium">Prix d'achat</th>
                  <th scope="col" className="text-right p-4 font-medium">Prix de vente</th>
                  <th scope="col" className="text-right p-4 font-medium">Stock</th>
                  <th scope="col" className="text-center p-4 font-medium">Statut</th>
                  <th scope="col" className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody ref={tableRef}>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                      <p>Aucun produit trouvé</p>
                      <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_PRODUCTS}>
                        <p className="text-sm mt-2">
                          Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour créer un nouveau produit
                        </p>
                      </Can>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className={cn(
                        "border-b transition-colors cursor-pointer",
                        selectedIndex === index
                          ? "bg-primary/10 ring-2 ring-primary ring-inset"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => setSelectedIndex(index)}
                      onDoubleClick={() => router.push(`/apps/${slug}/inventory/products/${product.id}`)}
                      tabIndex={0}
                      role="row"
                      aria-selected={selectedIndex === index}
                    >
                      <td className="p-4">
                        <div className="font-medium">{product.name}</div>
                      </td>
                      <td className="p-4">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{product.sku}</code>
                      </td>
                      <td className="p-4">
                        {product.category_name || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'GNF',
                          maximumFractionDigits: 0,
                        }).format(product.purchase_price)}
                      </td>
                      <td className="p-4 text-right">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'GNF',
                          maximumFractionDigits: 0,
                        }).format(product.selling_price)}
                      </td>
                      <td className="p-4 text-right">
                        <span className={cn(
                          "font-medium",
                          (product.total_stock || 0) === 0 && "text-red-600",
                        )}>
                          {product.total_stock || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/apps/${slug}/inventory/products/${product.id}`}>
                            <Button variant="ghost" size="sm" aria-label={`Voir ${product.name}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_PRODUCTS}>
                            <Link href={`/apps/${slug}/inventory/products/${product.id}/edit`}>
                              <Button variant="ghost" size="sm" aria-label={`Éditer ${product.name}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </Can>
                          <Can permission={COMMON_PERMISSIONS.INVENTORY.DELETE_PRODUCTS}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(product.id, product.name);
                              }}
                              aria-label={`Supprimer ${product.name}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Total: {filteredProducts.length} produit(s)</p>
        </div>

        {/* Hint */}
        <KeyboardHint />
      </div>
    </Can>
  );
}
