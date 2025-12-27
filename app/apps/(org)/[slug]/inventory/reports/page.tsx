"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Alert } from "@/components/ui";
import {
  getInventoryOverview,
  getTopProducts,
  getStockByWarehouse,
  getStockByCategory,
  getMovementHistory,
  getLowRotationProducts,
  getStockCountsSummary,
  downloadStockListExport,
  downloadMovementsExport,
  downloadAlertsExport,
  downloadProductsCatalogPdf,
  downloadStockReportPdf,
} from "@/lib/services/inventory";
import type {
  InventoryStats,
  TopProduct,
  WarehouseStockReport,
  CategoryStockReport,
  MovementHistoryResponse,
  LowRotationProductsResponse,
  StockCountsSummaryResponse,
} from "@/lib/types/inventory";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  FileDown,
  Package,
  AlertTriangle,
  ShoppingCart,
  Archive,
  Warehouse,
  Tags,
  RotateCw,
  ClipboardList,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, KeyboardHint } from "@/components/ui/shortcuts-help";
import { Keyboard } from "lucide-react";
import {
  MovementsChart,
  CategoriesChart,
  WarehousesChart,
  StockCountsChart,
} from "@/components/inventory/ReportsCharts";
import { 
  PDFPreviewModal, 
  usePDFPreview 
} from '@/components/ui';
import { API_ENDPOINTS } from "@/lib/api/config";

// Tabs pour navigation dans les rapports
type ReportTab = "overview" | "warehouses" | "categories" | "movements" | "rotation" | "counts";

export default function ReportsPage() {
  const params = useParams();
  const slug = params.slug as string;

  // États pour chaque type de données
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStockReport[]>([]);
  const [categoryStock, setCategoryStock] = useState<CategoryStockReport[]>([]);
  const [movementHistory, setMovementHistory] = useState<MovementHistoryResponse | null>(null);
  const [lowRotation, setLowRotation] = useState<LowRotationProductsResponse | null>(null);
  const [stockCountsSummary, setStockCountsSummary] = useState<StockCountsSummaryResponse | null>(null);

  // États UI
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Paramètres de filtre
  const [movementDays, setMovementDays] = useState(30);
  const [rotationDays, setRotationDays] = useState(90);

  // PDF Preview
  const { previewState, openPreview, closePreview } = usePDFPreview();

  // Fonction pour gérer les exports
  const handleExport = async (
    exportFn: () => Promise<void>,
    type: string
  ) => {
    try {
      setExporting(type);
      setExportSuccess(null);
      await exportFn();
      setExportSuccess(`Export ${type} téléchargé avec succès`);
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || `Erreur lors de l'export ${type}`);
    } finally {
      setExporting(null);
    }
  };

  // Charger toutes les données
  const loadAllData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Charger toutes les données en parallèle
      const [
        statsData,
        topProductsData,
        warehouseData,
        categoryData,
        movementData,
        rotationData,
        countsData,
      ] = await Promise.all([
        getInventoryOverview(),
        getTopProducts(),
        getStockByWarehouse(),
        getStockByCategory(),
        getMovementHistory(movementDays),
        getLowRotationProducts(rotationDays, 20),
        getStockCountsSummary(10),
      ]);

      setStats(statsData);
      setTopProducts(topProductsData);
      setWarehouseStock(warehouseData);
      setCategoryStock(categoryData);
      setMovementHistory(movementData);
      setLowRotation(rotationData);
      setStockCountsSummary(countsData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des rapports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [movementDays, rotationDays]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Définir les raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.help(() => setShowShortcuts(true)),
    commonShortcuts.escape(() => {
      if (showShortcuts) {
        setShowShortcuts(false);
      }
    }),
    { key: "r", action: () => loadAllData(true), description: "Actualiser les données" },
    { key: "1", action: () => setActiveTab("overview"), description: "Vue d'ensemble" },
    { key: "2", action: () => setActiveTab("warehouses"), description: "Par entrepôt" },
    { key: "3", action: () => setActiveTab("categories"), description: "Par catégorie" },
    { key: "4", action: () => setActiveTab("movements"), description: "Mouvements" },
    { key: "5", action: () => setActiveTab("rotation"), description: "Rotation" },
    { key: "6", action: () => setActiveTab("counts"), description: "Inventaires" },
  ], [showShortcuts, loadAllData]);

  useKeyboardShortcuts({ shortcuts });

  // Formatage monétaire
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "GNF",
      maximumFractionDigits: 0,
    }).format(value);

  // Formatage nombre
  const formatNumber = (value: number) =>
    new Intl.NumberFormat("fr-FR").format(value);

  // Calcul du pourcentage pour les barres de progression
  const getPercentage = (value: number, max: number) =>
    max > 0 ? Math.min((value / max) * 100, 100) : 0;

  // Rendu du chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  // Tabs de navigation
  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Vue d'ensemble", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "warehouses", label: "Par entrepôt", icon: <Warehouse className="h-4 w-4" /> },
    { id: "categories", label: "Par catégorie", icon: <Tags className="h-4 w-4" /> },
    { id: "movements", label: "Mouvements", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "rotation", label: "Rotation", icon: <RotateCw className="h-4 w-4" /> },
    { id: "counts", label: "Inventaires", icon: <ClipboardList className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Modal des raccourcis */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Rapports"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Rapports et analyses</h1>
          <p className="text-muted-foreground mt-1">
            Statistiques détaillées et exports de données
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/apps/${slug}/inventory/reports/calendar`}>
            <Button className="bg-primary hover:bg-primary/90">
              <Calendar className="mr-2 h-4 w-4" />
              Calendrier des activités
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            aria-label="Afficher les raccourcis clavier"
            title="Raccourcis clavier (?)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => loadAllData(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Actualiser
            <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">R</kbd>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport(downloadStockListExport, "stocks")}
            disabled={exporting === "stocks"}
          >
            {exporting === "stocks" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Package className="mr-2 h-4 w-4" />
            )}
            Export stocks
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport(() => downloadMovementsExport(movementDays), "mouvements")}
            disabled={exporting === "mouvements"}
          >
            {exporting === "mouvements" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            Export mouvements
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport(downloadAlertsExport, "alertes")}
            disabled={exporting === "alertes"}
          >
            {exporting === "alertes" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Export alertes
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              const date = new Date().toISOString().split('T')[0];
              try {
                await openPreview(
                  API_ENDPOINTS.INVENTORY.STATS.EXPORT_PRODUCTS_PDF,
                  "Catalogue des produits",
                  `catalogue_produits_${date}.pdf`
                );
              } catch (error) {
                setError("Erreur lors du chargement du catalogue PDF");
              }
            }}
            disabled={previewState.loading}
          >
            {previewState.loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Catalogue PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              const date = new Date().toISOString().split('T')[0];
              try {
                await openPreview(
                  API_ENDPOINTS.INVENTORY.STATS.EXPORT_STOCK_PDF,
                  "Rapport de stock",
                  `rapport_stock_${date}.pdf`
                );
              } catch (error) {
                setError("Erreur lors du chargement du rapport PDF");
              }
            }}
            disabled={previewState.loading}
          >
            {previewState.loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Rapport stock PDF
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {exportSuccess && (
        <Alert variant="success" title="Succès">
          {exportSuccess}
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert variant="error" title="Erreur" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu par tab */}
      {activeTab === "overview" && stats && (
        <OverviewTab
          stats={stats}
          topProducts={topProducts}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />
      )}

      {activeTab === "warehouses" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Stock par entrepôt</h2>
            <p className="text-sm text-muted-foreground">
              Analyse détaillée de la répartition du stock entre les entrepôts
            </p>
          </div>
          <WarehousesChart
            data={warehouseStock}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        </div>
      )}

      {activeTab === "categories" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Stock par catégorie</h2>
            <p className="text-sm text-muted-foreground">
              Analyse de la répartition du stock par catégorie de produits
            </p>
          </div>
          <CategoriesChart
            data={categoryStock}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        </div>
      )}

      {activeTab === "movements" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Historique des mouvements</h2>
              <p className="text-sm text-muted-foreground">
                Analyse des mouvements sur les {movementDays} derniers jours
              </p>
            </div>
            <div className="flex gap-2">
              {[7, 14, 30, 60, 90].map((d) => (
                <Button
                  key={d}
                  variant={movementDays === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMovementDays(d)}
                >
                  {d}j
                </Button>
              ))}
            </div>
          </div>
          <MovementsChart data={movementHistory} formatNumber={formatNumber} />
        </div>
      )}

      {activeTab === "rotation" && (
        <RotationTab
          data={lowRotation}
          days={rotationDays}
          setDays={setRotationDays}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />
      )}

      {activeTab === "counts" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Résumé des inventaires</h2>
            <p className="text-sm text-muted-foreground">
              Historique et statistiques des inventaires physiques
            </p>
          </div>
          <StockCountsChart data={stockCountsSummary} formatNumber={formatNumber} />
          <StockCountsTab data={stockCountsSummary} formatNumber={formatNumber} />
        </div>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={previewState.isOpen}
        onClose={closePreview}
        title={previewState.title}
        pdfUrl={previewState.pdfUrl}
        filename={previewState.filename}
      />
    </div>
  );
}

// ==========================================
// Overview Tab Component
// ==========================================
function OverviewTab({
  stats,
  topProducts,
  formatCurrency,
  formatNumber,
}: {
  stats: InventoryStats;
  topProducts: TopProduct[];
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Produits actifs</p>
              <p className="text-3xl font-bold mt-2">{stats.total_products}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Entrepôts</p>
              <p className="text-3xl font-bold mt-2">{stats.warehouse_count}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Archive className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Alertes actives</p>
              <p className="text-3xl font-bold mt-2">{stats.active_alerts}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Commandes en cours</p>
              <p className="text-3xl font-bold mt-2">{stats.pending_orders}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Value Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">Valeur totale du stock</h3>
            <p className="text-sm text-muted-foreground">Basée sur le prix d'achat</p>
          </div>
        </div>
        <p className="text-4xl font-bold">{formatCurrency(stats.total_stock_value)}</p>
      </Card>

      {/* Alerts Breakdown & Top Products */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Alerts */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">État du stock</h3>
              <p className="text-sm text-muted-foreground">Situation actuelle</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Stock bas</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{stats.low_stock_count}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Produits sous le seuil minimum</p>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Stock sain</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {stats.total_products - stats.low_stock_count}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Produits avec stock suffisant</p>
            </div>
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Top produits par valeur</h3>
              <p className="text-sm text-muted-foreground">Les 10 plus grandes valeurs de stock</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                  <span className="text-xs font-medium text-muted-foreground w-5">
                    #{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(product.stock_value)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(product.total_stock)} unités
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun produit trouvé
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// Warehouses Tab Component
// ==========================================
function WarehousesTab({
  data,
  formatCurrency,
  formatNumber,
  getPercentage,
}: {
  data: WarehouseStockReport[];
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
  getPercentage: (v: number, max: number) => number;
}) {
  const maxValue = Math.max(...data.map((w) => w.total_value), 1);
  const maxQuantity = Math.max(...data.map((w) => w.total_quantity), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stock par entrepôt</h2>
          <p className="text-sm text-muted-foreground">
            Répartition du stock entre les différents entrepôts
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <Card className="p-8 text-center">
          <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun entrepôt trouvé</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.map((warehouse) => (
            <Card key={warehouse.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Warehouse className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{warehouse.code}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Produits</p>
                      <p className="font-semibold">{warehouse.product_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Quantité totale</p>
                      <p className="font-semibold">{formatNumber(warehouse.total_quantity)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stock bas</p>
                      <p className="font-semibold text-orange-600">{warehouse.low_stock_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rupture</p>
                      <p className="font-semibold text-red-600">{warehouse.out_of_stock_count}</p>
                    </div>
                  </div>
                </div>

                {/* Value */}
                <div className="lg:w-64">
                  <p className="text-sm text-muted-foreground mb-1">Valeur du stock</p>
                  <p className="text-2xl font-bold text-green-600 mb-2">
                    {formatCurrency(warehouse.total_value)}
                  </p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${getPercentage(warehouse.total_value, maxValue)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Categories Tab Component
// ==========================================
function CategoriesTab({
  data,
  formatCurrency,
  formatNumber,
  getPercentage,
}: {
  data: CategoryStockReport[];
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
  getPercentage: (v: number, max: number) => number;
}) {
  const maxValue = Math.max(...data.map((c) => c.total_value), 1);
  const totalValue = data.reduce((acc, c) => acc + c.total_value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stock par catégorie</h2>
          <p className="text-sm text-muted-foreground">
            Répartition du stock par catégorie de produits
          </p>
        </div>
        <Card className="px-4 py-2">
          <p className="text-xs text-muted-foreground">Valeur totale</p>
          <p className="font-bold text-green-600">{formatCurrency(totalValue)}</p>
        </Card>
      </div>

      {data.length === 0 ? (
        <Card className="p-8 text-center">
          <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune catégorie trouvée</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((category, index) => {
            const percentage = totalValue > 0 ? (category.total_value / totalValue) * 100 : 0;
            const colors = [
              "bg-blue-500",
              "bg-green-500",
              "bg-purple-500",
              "bg-orange-500",
              "bg-pink-500",
              "bg-cyan-500",
              "bg-yellow-500",
              "bg-red-500",
            ];
            const color = colors[index % colors.length];

            return (
              <Card key={category.id || "uncategorized"} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", color)} />
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {category.product_count} produits
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                  <div
                    className={cn("h-full transition-all", color)}
                    style={{ width: `${getPercentage(category.total_value, maxValue)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Quantité</p>
                    <p className="font-semibold text-sm">{formatNumber(category.total_quantity)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valeur</p>
                    <p className="font-semibold text-sm text-green-600">
                      {formatCurrency(category.total_value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stock bas</p>
                    <p className="font-semibold text-sm text-orange-600">
                      {category.low_stock_count}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Movements Tab Component
// ==========================================
function MovementsTab({
  data,
  days,
  setDays,
  formatNumber,
  formatCurrency,
}: {
  data: MovementHistoryResponse | null;
  days: number;
  setDays: (d: number) => void;
  formatNumber: (v: number) => string;
  formatCurrency: (v: number) => string;
}) {
  const periodOptions = [7, 14, 30, 60, 90];

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Aucun mouvement trouvé</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtre */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Historique des mouvements</h2>
          <p className="text-sm text-muted-foreground">
            Analyse des mouvements sur les {data.period_days} derniers jours
          </p>
        </div>
        <div className="flex gap-2">
          {periodOptions.map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}j
            </Button>
          ))}
        </div>
      </div>

      {/* Résumé */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entrées</p>
              <p className="text-xl font-bold text-green-600">{data.summary.total_in}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sorties</p>
              <p className="text-xl font-bold text-red-600">{data.summary.total_out}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <RefreshCcw className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transferts</p>
              <p className="text-xl font-bold text-blue-600">{data.summary.total_transfers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ajustements</p>
              <p className="text-xl font-bold text-purple-600">{data.summary.total_adjustments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Historique par jour */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Détail par jour</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-center py-2 px-3 text-green-600">Entrées</th>
                <th className="text-center py-2 px-3 text-red-600">Sorties</th>
                <th className="text-center py-2 px-3 text-blue-600">Transferts</th>
                <th className="text-center py-2 px-3 text-purple-600">Ajustements</th>
                <th className="text-right py-2 px-3">Total mouvements</th>
              </tr>
            </thead>
            <tbody>
              {data.history.length > 0 ? (
                data.history.slice(-15).reverse().map((day) => {
                  const total = day.in.count + day.out.count + day.transfer.count + day.adjustment.count;
                  return (
                    <tr key={day.date} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">
                        {new Date(day.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="text-center py-2 px-3">
                        {day.in.count > 0 && (
                          <span className="text-green-600">{day.in.count}</span>
                        )}
                      </td>
                      <td className="text-center py-2 px-3">
                        {day.out.count > 0 && (
                          <span className="text-red-600">{day.out.count}</span>
                        )}
                      </td>
                      <td className="text-center py-2 px-3">
                        {day.transfer.count > 0 && (
                          <span className="text-blue-600">{day.transfer.count}</span>
                        )}
                      </td>
                      <td className="text-center py-2 px-3">
                        {day.adjustment.count > 0 && (
                          <span className="text-purple-600">{day.adjustment.count}</span>
                        )}
                      </td>
                      <td className="text-right py-2 px-3 font-semibold">{total}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun mouvement sur cette période
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// Rotation Tab Component
// ==========================================
function RotationTab({
  data,
  days,
  setDays,
  formatCurrency,
  formatNumber,
}: {
  data: LowRotationProductsResponse | null;
  days: number;
  setDays: (d: number) => void;
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
}) {
  const periodOptions = [30, 60, 90, 180];

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <RotateCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Données non disponibles</p>
      </Card>
    );
  }

  const totalValue = data.products.reduce((acc, p) => acc + p.stock_value, 0);

  return (
    <div className="space-y-6">
      {/* Header avec filtre */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Produits à faible rotation</h2>
          <p className="text-sm text-muted-foreground">
            Stock dormant sur les {data.period_days} derniers jours
          </p>
        </div>
        <div className="flex gap-2">
          {periodOptions.map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}j
            </Button>
          ))}
        </div>
      </div>

      {/* Alert Value */}
      <Alert variant="warning" title="Valeur du stock dormant">
        <div className="flex items-center justify-between">
          <span>
            {data.products.length} produits représentent une valeur de stock dormant de
          </span>
          <span className="font-bold text-lg">{formatCurrency(totalValue)}</span>
        </div>
      </Alert>

      {/* Products List */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Produit</th>
                <th className="text-left py-2 px-3">Catégorie</th>
                <th className="text-right py-2 px-3">Stock</th>
                <th className="text-right py-2 px-3">Valeur</th>
                <th className="text-center py-2 px-3">Sorties récentes</th>
                <th className="text-right py-2 px-3">Dernier mouvement</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length > 0 ? (
                data.products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {product.category_name || "-"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatNumber(product.total_stock)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-green-600">
                      {formatCurrency(product.stock_value)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          product.recent_out_movements === 0
                            ? "bg-red-100 text-red-700"
                            : product.recent_out_movements < 3
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        )}
                      >
                        {product.recent_out_movements}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {product.days_since_last_movement !== null ? (
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {product.days_since_last_movement} jours
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun produit à faible rotation trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// Stock Counts Tab Component
// ==========================================
function StockCountsTab({
  data,
  formatNumber,
}: {
  data: StockCountsSummaryResponse | null;
  formatNumber: (v: number) => string;
}) {
  if (!data) {
    return (
      <Card className="p-8 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Données non disponibles</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Résumé des inventaires</h2>
        <p className="text-sm text-muted-foreground">
          Historique et statistiques des inventaires physiques
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total inventaires</p>
              <p className="text-xl font-bold">{data.summary.total_counts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Validés</p>
              <p className="text-xl font-bold text-green-600">{data.summary.validated_counts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En attente</p>
              <p className="text-xl font-bold text-orange-600">{data.summary.pending_counts}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Stock Counts */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Inventaires récents</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">N° Inventaire</th>
                <th className="text-left py-2 px-3">Entrepôt</th>
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-center py-2 px-3">Statut</th>
                <th className="text-right py-2 px-3">Articles</th>
                <th className="text-right py-2 px-3">Écarts</th>
                <th className="text-right py-2 px-3">Précision</th>
              </tr>
            </thead>
            <tbody>
              {data.stock_counts.length > 0 ? (
                data.stock_counts.map((count) => (
                  <tr key={count.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-3 font-medium">{count.count_number}</td>
                    <td className="py-3 px-3">{count.warehouse_name || "-"}</td>
                    <td className="py-3 px-3">
                      {count.count_date
                        ? new Date(count.count_date).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          count.status === "validated"
                            ? "bg-green-100 text-green-700"
                            : count.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : count.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-700"
                            : count.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {count.status_display}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">{count.item_count}</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={cn(
                          count.items_with_discrepancy > 0 ? "text-red-600" : "text-green-600"
                        )}
                      >
                        {count.items_with_discrepancy}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={cn(
                          "font-medium",
                          count.accuracy_rate >= 95
                            ? "text-green-600"
                            : count.accuracy_rate >= 80
                            ? "text-orange-600"
                            : "text-red-600"
                        )}
                      >
                        {count.accuracy_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun inventaire trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
