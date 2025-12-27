"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import {
  getStockCount,
  validateStockCount,
  cancelStockCount,
  addStockCountItem,
  updateStockCountItem,
  deleteStockCountItem,
  getProducts,
  startStockCount,
  completeStockCount,
  generateStockCountItems,
  autoFillStockCounts,
  getStockCountSummary,
  getStockCountDiscrepancies,
  getCategories,
  exportStockCountPdf,
} from "@/lib/services/inventory";
import type { StockCount, StockCountItem, StockCountStatus, ProductList, Category } from "@/lib/types/inventory";
import type { StockCountSummary, DiscrepanciesResponse, GenerateItemsOptions } from "@/lib/services/inventory/stock-count.service";
import {
  ArrowLeft,
  Save,
  Loader2,
  Clipboard,
  Calendar,
  Archive,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  AlertTriangle,
  Plus,
  Trash2,
  Keyboard,
  X,
  Search,
  Zap,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Play,
  Check,
  Download,
  FileDown,
  Filter,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function StockCountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [stockCount, setStockCount] = useState<StockCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  
  // Modal ajout d'article
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<ProductList[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductList | null>(null);
  const [expectedQty, setExpectedQty] = useState("");
  const [countedQty, setCountedQty] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  // Modal génération automatique
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [generateOptions, setGenerateOptions] = useState<GenerateItemsOptions>({
    include_zero_stock: false,
    overwrite: false,
  });
  const [generating, setGenerating] = useState(false);

  // Statistiques avancées
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<StockCountSummary | null>(null);
  const [discrepancies, setDiscrepancies] = useState<DiscrepanciesResponse | null>(null);
  const [showDiscrepanciesOnly, setShowDiscrepanciesOnly] = useState(false);
  
  // Export PDF
  const [pdfLoading, setPdfLoading] = useState(false);

  const countInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    loadStockCount();
  }, [id]);

  // Charger les produits et catégories pour les modals
  useEffect(() => {
    if ((showAddModal || showGenerateModal) && products.length === 0) {
      loadProducts();
    }
    if (showGenerateModal && categories.length === 0) {
      loadCategories();
    }
  }, [showAddModal, showGenerateModal]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        if (showGenerateModal) {
          setShowGenerateModal(false);
          return;
        }
        if (showAddModal) {
          setShowAddModal(false);
          resetAddForm();
          return;
        }
        if (showShortcuts) {
          setShowShortcuts(false);
          return;
        }
        if (isInputFocused) {
          (document.activeElement as HTMLElement).blur();
          return;
        }
        setSelectedItemIndex(-1);
        return;
      }

      if (isInputFocused || showAddModal || showGenerateModal) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // A pour ajouter un article
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        if (isEditable) {
          setShowAddModal(true);
        }
        return;
      }

      // G pour générer automatiquement
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        if (isEditable) {
          setShowGenerateModal(true);
        }
        return;
      }

      // S pour démarrer
      if ((e.key === "s" || e.key === "S") && e.ctrlKey) {
        e.preventDefault();
        if (stockCount?.status === "planned" || stockCount?.status === "draft") {
          handleStart();
        }
        return;
      }

      // C pour compléter
      if ((e.key === "c" || e.key === "C") && e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        if (stockCount?.status === "in_progress") {
          handleComplete();
        }
        return;
      }

      // Navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedItemIndex((prev) =>
          Math.min(prev + 1, (stockCount?.items?.length || 0) - 1)
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedItemIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      // Enter pour éditer la quantité comptée
      if (e.key === "Enter" && selectedItemIndex >= 0) {
        e.preventDefault();
        countInputRefs.current[selectedItemIndex]?.focus();
        return;
      }

      // Supprimer avec Delete
      if (e.key === "Delete" && selectedItemIndex >= 0) {
        e.preventDefault();
        const item = stockCount?.items?.[selectedItemIndex];
        if (item && isEditable) {
          handleDeleteItem(item.id);
        }
        return;
      }

      // V pour valider
      if ((e.key === "v" || e.key === "V") && e.ctrlKey) {
        e.preventDefault();
        if (stockCount?.status === "completed") {
          handleValidate();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts, selectedItemIndex, stockCount, showAddModal, showGenerateModal]);

  const loadStockCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStockCount(id);
      setStockCount(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de l'inventaire");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts({ is_active: true });
      setProducts(data);
    } catch (err: any) {
      console.error("Erreur chargement produits:", err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error("Erreur chargement catégories:", err);
    }
  };

  const loadSummary = async () => {
    if (!stockCount) return;
    try {
      const data = await getStockCountSummary(stockCount.id);
      setSummary(data);
      setShowSummary(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du résumé");
    }
  };

  const loadDiscrepancies = async () => {
    if (!stockCount) return;
    try {
      const data = await getStockCountDiscrepancies(stockCount.id);
      setDiscrepancies(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des écarts");
    }
  };

  const handleExportPdf = async () => {
    if (!stockCount) return;
    try {
      setPdfLoading(true);
      await exportStockCountPdf(stockCount.id);
      setSuccess("PDF téléchargé avec succès !");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'export PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleStart = async () => {
    if (!stockCount) return;
    try {
      setSaving(true);
      setError(null);
      await startStockCount(stockCount.id);
      setSuccess("Inventaire démarré !");
      await loadStockCount();
    } catch (err: any) {
      setError(err.message || "Erreur lors du démarrage");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!stockCount) return;
    if (!confirm("Marquer cet inventaire comme complété ? Les comptages ne pourront plus être modifiés.")) return;
    try {
      setSaving(true);
      setError(null);
      await completeStockCount(stockCount.id);
      setSuccess("Inventaire complété !");
      await loadStockCount();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la complétion");
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!stockCount) return;
    if (!confirm("Valider cet inventaire ? Les ajustements seront appliqués au stock.")) return;

    try {
      setSaving(true);
      setError(null);
      await validateStockCount(stockCount.id);
      setSuccess("Inventaire validé avec succès ! Les ajustements ont été appliqués.");
      await loadStockCount();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la validation");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!stockCount) return;
    if (!confirm("Annuler cet inventaire ?")) return;

    try {
      setSaving(true);
      setError(null);
      await cancelStockCount(stockCount.id);
      setSuccess("Inventaire annulé.");
      await loadStockCount();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'annulation");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateItems = async () => {
    if (!stockCount) return;
    
    try {
      setGenerating(true);
      setError(null);
      const result = await generateStockCountItems(stockCount.id, generateOptions);
      setSuccess(result.message);
      setShowGenerateModal(false);
      setGenerateOptions({ include_zero_stock: false, overwrite: false });
      await loadStockCount();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoFill = async () => {
    if (!stockCount) return;
    if (!confirm("Pré-remplir toutes les quantités comptées avec les quantités attendues ? Cette action affectera tous les articles.")) return;

    try {
      setSaving(true);
      setError(null);
      const result = await autoFillStockCounts(stockCount.id);
      setSuccess(result.message);
      await loadStockCount();
    } catch (err: any) {
      setError(err.message || "Erreur lors du pré-remplissage");
    } finally {
      setSaving(false);
    }
  };

  const resetAddForm = () => {
    setSelectedProduct(null);
    setProductSearch("");
    setExpectedQty("");
    setCountedQty("");
    setItemNotes("");
  };

  const handleAddItem = async () => {
    if (!stockCount || !selectedProduct) return;

    try {
      setAddingItem(true);
      setError(null);
      await addStockCountItem(stockCount.id, {
        product: selectedProduct.id,
        expected_quantity: parseInt(expectedQty) || 0,
        counted_quantity: parseInt(countedQty) || 0,
        notes: itemNotes || undefined,
      });
      setSuccess("Article ajouté avec succès !");
      setShowAddModal(false);
      resetAddForm();
      await loadStockCount();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout de l'article");
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!stockCount) return;
    if (!confirm("Supprimer cet article de l'inventaire ?")) return;

    try {
      setSaving(true);
      await deleteStockCountItem(stockCount.id, itemId);
      setSuccess("Article supprimé.");
      await loadStockCount();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItemCount = async (itemId: string, newCount: number) => {
    if (!stockCount) return;

    try {
      await updateStockCountItem(stockCount.id, itemId, {
        counted_quantity: newCount,
      });
      await loadStockCount();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    }
  };

  const getStatusBadge = (status: StockCountStatus) => {
    const variants: Record<string, { variant: "success" | "error" | "warning" | "info" | "default" | "outline"; icon: any; label: string }> = {
      planned: { variant: "outline", icon: <Clock className="h-3 w-3" />, label: "Planifié" },
      draft: { variant: "outline", icon: <Clock className="h-3 w-3" />, label: "Brouillon" },
      in_progress: { variant: "warning", icon: <Clock className="h-3 w-3" />, label: "En cours" },
      completed: { variant: "info", icon: <CheckCircle className="h-3 w-3" />, label: "Complété" },
      validated: { variant: "success", icon: <CheckCircle className="h-3 w-3" />, label: "Validé" },
      cancelled: { variant: "error", icon: <XCircle className="h-3 w-3" />, label: "Annulé" },
    };

    const config = variants[status] || variants.planned;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Filtrer les produits pour la recherche
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Vérifier si le produit est déjà dans l'inventaire
  const isProductInInventory = (productId: string) => {
    return stockCount?.items?.some((item) => item.product === productId);
  };

  // Filtrer les items affichés
  const displayedItems = showDiscrepanciesOnly
    ? stockCount?.items?.filter((item) => item.difference !== undefined && item.difference !== 0) || []
    : stockCount?.items || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Chargement">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!stockCount) {
    return (
      <div className="p-6">
        <Alert variant="error">Inventaire non trouvé</Alert>
        <Button asChild className="mt-4">
          <Link href={`/apps/${slug}/inventory/stock-counts`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>
    );
  }

  const isEditable = stockCount.status === "planned" || stockCount.status === "in_progress" || stockCount.status === "draft";
  const canStart = stockCount.status === "planned" || stockCount.status === "draft";
  const canComplete = stockCount.status === "in_progress";
  const canValidate = stockCount.status === "completed";
  const canCancel = isEditable;

  // Calcul des statistiques
  const totalItems = stockCount.items?.length || 0;
  const itemsWithDiscrepancy = stockCount.items?.filter(
    (item) => item.difference !== undefined && item.difference !== 0
  ).length || 0;
  const totalExpected = stockCount.items?.reduce((sum, item) => sum + item.expected_quantity, 0) || 0;
  const totalCounted = stockCount.items?.reduce((sum, item) => sum + item.counted_quantity, 0) || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Modal génération automatique */}
      {showGenerateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowGenerateModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="generate-title"
        >
          <Card className="w-full max-w-lg p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="generate-title" className="text-xl font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                Génération automatique
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowGenerateModal(false)} aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cette action va générer automatiquement tous les articles d'inventaire à partir du stock actuel de l'entrepôt <strong>{stockCount.warehouse_name}</strong>.
              </p>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="include_zero"
                    checked={generateOptions.include_zero_stock}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, include_zero_stock: e.target.checked })}
                    className="rounded border-input"
                  />
                  <label htmlFor="include_zero" className="text-sm">
                    Inclure les produits avec stock = 0
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overwrite"
                    checked={generateOptions.overwrite}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, overwrite: e.target.checked })}
                    className="rounded border-input"
                  />
                  <label htmlFor="overwrite" className="text-sm text-orange-600">
                    ⚠️ Remplacer les articles existants
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Filtrer par catégorie (optionnel)</label>
                  <select
                    value={generateOptions.category_id || ""}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, category_id: e.target.value || undefined })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Infos */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 Les quantités attendues seront récupérées du stock actuel. Les quantités comptées seront initialisées à 0.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleGenerateItems} disabled={generating}>
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Générer les articles
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal ajout d'article */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => { setShowAddModal(false); resetAddForm(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-title"
        >
          <Card className="w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="add-item-title" className="text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5" aria-hidden="true" />
                Ajouter un article
              </h2>
              <Button variant="ghost" size="sm" onClick={() => { setShowAddModal(false); resetAddForm(); }} aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Recherche produit */}
              <div>
                <label className="text-sm font-medium mb-2 block">Produit *</label>
                {selectedProduct ? (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div>
                      <p className="font-medium">{selectedProduct.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.sku}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un produit..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto border rounded-md">
                      {filteredProducts.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground text-center">
                          Aucun produit trouvé
                        </p>
                      ) : (
                        filteredProducts.slice(0, 20).map((product) => {
                          const alreadyAdded = isProductInInventory(product.id);
                          return (
                            <button
                              key={product.id}
                              className={cn(
                                "w-full text-left p-3 hover:bg-muted/50 border-b last:border-b-0 transition-colors",
                                alreadyAdded && "opacity-50 cursor-not-allowed"
                              )}
                              onClick={() => !alreadyAdded && setSelectedProduct(product)}
                              disabled={alreadyAdded}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-muted-foreground">{product.sku}</p>
                                </div>
                                {alreadyAdded && (
                                  <Badge variant="outline" className="text-xs">Déjà ajouté</Badge>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantités */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantité attendue *</label>
                  <Input
                    type="number"
                    value={expectedQty}
                    onChange={(e) => setExpectedQty(e.target.value)}
                    placeholder="0"
                    min={0}
                  />
                  {selectedProduct && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Stock actuel: {selectedProduct.total_stock || 0}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantité comptée</label>
                  <Input
                    type="number"
                    value={countedQty}
                    onChange={(e) => setCountedQty(e.target.value)}
                    placeholder="0"
                    min={0}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes optionnelles..."
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => { setShowAddModal(false); resetAddForm(); }}>
                  Annuler
                </Button>
                <Button
                  onClick={handleAddItem}
                  disabled={!selectedProduct || !expectedQty || addingItem}
                >
                  {addingItem ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Ajouter
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal des raccourcis */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowShortcuts(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <Card className="w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="shortcuts-title" className="text-xl font-bold flex items-center gap-2">
                <Keyboard className="h-5 w-5" aria-hidden="true" />
                Raccourcis clavier
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(false)} aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <ShortcutItem keys={["A"]} description="Ajouter un article" />
              <ShortcutItem keys={["G"]} description="Générer automatiquement" />
              <ShortcutItem keys={["Ctrl", "S"]} description="Démarrer l'inventaire" />
              <ShortcutItem keys={["Ctrl", "C"]} description="Compléter l'inventaire" />
              <ShortcutItem keys={["↑", "↓"]} description="Naviguer dans les articles" />
              <ShortcutItem keys={["Enter"]} description="Éditer la quantité comptée" />
              <ShortcutItem keys={["Delete"]} description="Supprimer l'article sélectionné" />
              <ShortcutItem keys={["Ctrl", "V"]} description="Valider l'inventaire" />
              <ShortcutItem keys={["Esc"]} description="Annuler / Fermer" />
              <ShortcutItem keys={["?"]} description="Afficher l'aide" />
            </div>
          </Card>
        </div>
      )}

      {/* Modal résumé */}
      {showSummary && summary && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSummary(false)}
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Résumé de l'inventaire
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSummary(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Taux de conformité</p>
                  <p className="text-3xl font-bold text-green-600">{summary.statistics.match_rate}%</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Articles corrects</p>
                  <p className="text-3xl font-bold">{summary.statistics.items_matched}</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Écarts détectés</p>
                  <p className="text-3xl font-bold text-orange-600">{summary.statistics.items_with_discrepancy}</p>
                </Card>
              </div>

              {/* Quantités */}
              <div>
                <h3 className="font-semibold mb-2">Quantités</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Attendu</p>
                    <p className="text-xl font-bold">{summary.quantities.total_expected}</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Compté</p>
                    <p className="text-xl font-bold">{summary.quantities.total_counted}</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Différence nette</p>
                    <p className={cn(
                      "text-xl font-bold",
                      summary.quantities.net_difference > 0 && "text-green-600",
                      summary.quantities.net_difference < 0 && "text-red-600"
                    )}>
                      {summary.quantities.net_difference > 0 ? "+" : ""}{summary.quantities.net_difference}
                    </p>
                  </div>
                </div>
              </div>

              {/* Valeurs */}
              <div>
                <h3 className="font-semibold mb-2">Valeurs</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Valeur attendue</p>
                    <p className="text-xl font-bold">{summary.values.total_expected_value.toLocaleString()} FCFA</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Valeur comptée</p>
                    <p className="text-xl font-bold">{summary.values.total_counted_value.toLocaleString()} FCFA</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Impact</p>
                    <p className={cn(
                      "text-xl font-bold",
                      summary.values.value_difference > 0 && "text-green-600",
                      summary.values.value_difference < 0 && "text-red-600"
                    )}>
                      {summary.values.value_difference > 0 ? "+" : ""}{summary.values.value_difference.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              </div>

              {/* Répartition */}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  {summary.statistics.items_surplus} surplus
                </span>
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  {summary.statistics.items_deficit} déficits
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild aria-label="Retour à la liste">
            <Link href={`/apps/${slug}/inventory/stock-counts`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Clipboard className="h-8 w-8" aria-hidden="true" />
                {stockCount.count_number}
              </h1>
              {getStatusBadge(stockCount.status)}
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Archive className="h-4 w-4" aria-hidden="true" />
                {stockCount.warehouse_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {new Date(stockCount.count_date).toLocaleDateString("fr-FR")}
              </span>
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
            <Keyboard className="h-4 w-4" />
          </Button>
          
          {/* Actions de workflow */}
          {canStart && (
            <Button variant="outline" onClick={handleStart} disabled={saving}>
              <Play className="mr-2 h-4 w-4" />
              Démarrer
            </Button>
          )}
          {canComplete && (
            <Button variant="outline" onClick={handleComplete} disabled={saving}>
              <Check className="mr-2 h-4 w-4" />
              Compléter
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          )}
          {canValidate && (
            <Button onClick={handleValidate} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Valider l'inventaire
            </Button>
          )}
          <Button variant="outline" onClick={handleExportPdf} disabled={pdfLoading}>
            {pdfLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" role="status">
          {success}
        </Alert>
      )}

      {/* Actions rapides - Automatisation */}
      {isEditable && (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">Actions automatisées</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGenerateModal(true)}
                className="bg-white dark:bg-background"
              >
                <Zap className="mr-2 h-4 w-4" />
                Générer tous les articles
                <kbd className="ml-2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs">G</kbd>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoFill}
                disabled={saving || totalItems === 0}
                className="bg-white dark:bg-background"
              >
                <Copy className="mr-2 h-4 w-4" />
                Pré-remplir les comptages
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSummary}
                disabled={totalItems === 0}
                className="bg-white dark:bg-background"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Voir le résumé
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Articles comptés</p>
          <p className="text-2xl font-bold">{totalItems}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Quantité attendue</p>
          <p className="text-2xl font-bold">{totalExpected}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Quantité comptée</p>
          <p className="text-2xl font-bold">{totalCounted}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Écarts</p>
          <p className={cn(
            "text-2xl font-bold",
            itemsWithDiscrepancy > 0 ? "text-orange-600" : "text-green-600"
          )}>
            {itemsWithDiscrepancy}
          </p>
        </Card>
      </div>

      {/* Notes */}
      {stockCount.notes && (
        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-muted-foreground">{stockCount.notes}</p>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" aria-hidden="true" />
            Articles ({totalItems})
          </h2>
          <div className="flex items-center gap-2">
            {/* Filtre écarts */}
            <Button
              variant={showDiscrepanciesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDiscrepanciesOnly(!showDiscrepanciesOnly)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showDiscrepanciesOnly ? "Tous" : "Écarts seulement"}
              {itemsWithDiscrepancy > 0 && (
                <Badge variant="outline" className="ml-2">{itemsWithDiscrepancy}</Badge>
              )}
            </Button>
            {isEditable && (
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Ajouter un article
                <kbd className="ml-2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                  A
                </kbd>
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" role="grid" aria-label="Articles de l'inventaire">
            <thead>
              <tr className="border-b bg-muted/50">
                <th scope="col" className="text-left p-4 font-medium">Produit</th>
                <th scope="col" className="text-right p-4 font-medium">Qté attendue</th>
                <th scope="col" className="text-right p-4 font-medium">Qté comptée</th>
                <th scope="col" className="text-right p-4 font-medium">Écart</th>
                <th scope="col" className="text-left p-4 font-medium">Notes</th>
                {isEditable && <th scope="col" className="text-center p-4 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={isEditable ? 6 : 5} className="text-center p-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                    <p>{showDiscrepanciesOnly ? "Aucun écart détecté" : "Aucun article dans cet inventaire"}</p>
                    {isEditable && !showDiscrepanciesOnly && (
                      <div className="text-sm mt-2 space-y-1">
                        <p>
                          Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">G</kbd> pour générer automatiquement
                        </p>
                        <p>
                          ou <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">A</kbd> pour ajouter manuellement
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b transition-colors",
                      selectedItemIndex === index
                        ? "bg-primary/10 ring-2 ring-primary ring-inset"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedItemIndex(index)}
                    tabIndex={0}
                    role="row"
                    aria-selected={selectedItemIndex === index}
                  >
                    <td className="p-4">
                      <div className="font-medium">{item.product_name}</div>
                      <p className="text-sm text-muted-foreground">{item.product_sku}</p>
                    </td>
                    <td className="p-4 text-right font-mono">
                      {item.expected_quantity}
                    </td>
                    <td className="p-4 text-right">
                      {isEditable ? (
                        <Input
                          ref={(el) => { countInputRefs.current[index] = el; }}
                          type="number"
                          defaultValue={item.counted_quantity}
                          className="w-24 text-right ml-auto"
                          min={0}
                          aria-label={`Quantité comptée pour ${item.product_name}`}
                          onBlur={(e) => {
                            const newValue = parseInt(e.target.value);
                            if (newValue !== item.counted_quantity) {
                              handleUpdateItemCount(item.id, newValue);
                            }
                          }}
                        />
                      ) : (
                        <span className="font-mono">{item.counted_quantity}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {item.difference !== undefined && (
                        <span
                          className={cn(
                            "font-bold",
                            item.difference > 0 && "text-green-600",
                            item.difference < 0 && "text-red-600",
                            item.difference === 0 && "text-muted-foreground"
                          )}
                        >
                          {item.difference > 0 ? "+" : ""}
                          {item.difference}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground max-w-xs truncate">
                      {item.notes || "-"}
                    </td>
                    {isEditable && (
                      <td className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item.id);
                          }}
                          aria-label={`Supprimer ${item.product_name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Help */}
      <p className="text-center text-xs text-muted-foreground">
        Appuyez sur <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">?</kbd> pour voir tous les raccourcis clavier
      </p>
    </div>
  );
}

// Composant pour afficher un raccourci
function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 rounded border bg-muted font-mono text-xs min-w-[24px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
