"use client";

import {
  ABCAnalysisChart,
  CategoryPerformanceChart,
  KeyMetricsGrid,
  MetricCard,
  SalesTrendChart,
  StockHealthGauge,
} from "@/components/inventory/AdvancedCharts";
import {
  ChartCardSkeleton,
  DashboardSkeleton,
  DataTableSkeleton,
  DonutChartSkeleton,
  GaugeSkeleton,
  MetricCardSkeleton,
  ProgressListSkeleton,
  TableSkeleton,
} from "@/components/inventory/DashboardSkeleton";
import { Button, Card } from "@/components/ui";
import {
  getInventoryOverview,
  getStockByWarehouse,
  getTopProducts
} from "@/lib/services/inventory";
import type {
  InventoryStats,
  TopProduct,
  WarehouseStockReport
} from "@/lib/types/inventory";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  ArrowUpRight,
  BarChart3,
  Package,
  RefreshCcw,
  Warehouse
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Permissions/authorization
import { Can } from "@/components/apps/common/protected-route";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";

export default function InventoryOverviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStockReport[]>([]);

  // Progressive loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [slug]);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingStats(true);
        setLoadingProducts(true);
        setLoadingWarehouses(true);
      }

      // Load stats first (priority)
      getInventoryOverview()
        .then((data) => {
          setStats(data);
          setLoadingStats(false);
        })
        .catch((err) => {
          console.error("Error loading stats:", err);
          setLoadingStats(false);
        });

      // Load products (secondary priority)
      getTopProducts()
        .then((data) => {
          setTopProducts(data || []);
          setLoadingProducts(false);
        })
        .catch((err) => {
          console.error("Error loading products:", err);
          setLoadingProducts(false);
        });

      // Load warehouses (tertiary priority)
      getStockByWarehouse()
        .then((data) => {
          setWarehouseStock(data || []);
          setLoadingWarehouses(false);
        })
        .catch((err) => {
          console.error("Error loading warehouses:", err);
          setLoadingWarehouses(false);
        });
    } catch (err: any) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Show full skeleton on initial load
  if (loadingStats && !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Fixed, clean */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Vue d'ensemble</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Gestion des stocks</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadDashboardData(true)}
                disabled={refreshing}
              >
                <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
                <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_REPORTS}>
                     <Link href={`/apps/${slug}/inventory/reports`}>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Rapports
                  </Button>
                </Link>
                </Can>
                <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS}>
                <Link href={`/apps/${slug}/inventory/products`}>
                  <Button size="sm">
                    <Package className="mr-2 h-4 w-4" />
                    Produits
                  </Button>
                </Link>
                </Can>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics - Top priority */}
        {loadingStats || !stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <KeyMetricsGrid stats={stats} />
        )}

        {/* Secondary Metrics Grid */}
        {loadingStats || !stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <MetricCardSkeleton key={i} compact />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS}>
              <MetricCard
                label="Produits"
                value={formatNumber(stats.total_products)}
                subtitle={`${stats.warehouse_count} entrepôts`}
                compact
              />
            </Can>
            <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS}>
              <MetricCard
                label="Valeur du stock"
                value={formatCurrency(stats.total_stock_value)}
                subtitle={`Marge potentielle: ${formatCurrency(stats.potential_margin)}`}
                compact
              />
            </Can>
            <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_REPORTS}>
              <MetricCard
                label="Revenus (7j)"
                value={formatCurrency(stats.revenue_7d)}
                variation={stats.revenue_variation_7d}
                compact
              />
            </Can>
            <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS}>
              <MetricCard
                label="Commandes"
                value={stats.pending_orders}
                subtitle={`Valeur: ${formatCurrency(stats.pending_orders_value)}`}
                compact
              />
            </Can>
            <Can allPermissions={[COMMON_PERMISSIONS.INVENTORY.VIEW_SALES, COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK]}>
              <MetricCard
                label="Alertes"
                value={stats.active_alerts}
                subtitle={`${stats.low_stock_count} produits en stock bas`}
                compact
              />
            </Can>
          </div>
        )}

        {/* Charts Row 1: Trends + ABC */}
        {loadingStats || !stats ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartCardSkeleton />
            </div>
            <DonutChartSkeleton />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES}>
                <SalesTrendChart data={stats.sales_trend} showProfit />
              </Can>
            </div>
            <div>
              <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS}>
                <ABCAnalysisChart
                  distribution={stats.abc_distribution}
                  totalProducts={stats.total_products}
                />
              </Can>
            </div>
          </div>
        )}

        {/* Charts Row 2: Category Performance + Stock Health */}
        {loadingStats || !stats ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartCardSkeleton />
            </div>
            <GaugeSkeleton />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Can allPermissions={[
              COMMON_PERMISSIONS.INVENTORY.VIEW_CATEGORIES,
              COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
            ]}>
              <div className="lg:col-span-2">
                <CategoryPerformanceChart
                  data={stats.category_performance}
                  metric="revenue"
                />
              </div>
            </Can>
            <Can allPermissions={[
              COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
            ]}>
              <div>
                <StockHealthGauge
                  current={stats.total_products}
                  total={stats.total_products}
                  lowStock={stats.low_stock_count}
                  outOfStock={stats.out_of_stock_count}
                />
                </div>
              </Can>
          </div>
        )}

        {/* Data Tables Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Products Table */}
          {loadingProducts ? (
            <TableSkeleton rows={8} />
          ) : (
            <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Top produits</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Par valeur de stock</p>
                  </div>
                  <Link href={`/apps/${slug}/inventory/products`}>
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      Voir tout
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-1">
                  {topProducts.slice(0, 8).map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2.5 rounded hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs text-muted-foreground font-mono w-6 text-right">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(product.stock_value)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(product.total_stock)} u.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Can>
          )}

          {/* Warehouses Distribution */}
          {loadingWarehouses ? (
            <ProgressListSkeleton items={8} />
          ) : (
            <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Entrepôts</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Distribution du stock</p>
                  </div>
                  <Link href={`/apps/${slug}/inventory/warehouses`}>
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      Voir tout
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-1">
                  {warehouseStock.slice(0, 8).map((warehouse, index) => {
                    const total = warehouseStock.reduce((sum, w) => sum + w.total_value, 0);
                    const percent = total > 0 ? (warehouse.total_value / total) * 100 : 0;

                    return (
                      <div
                        key={warehouse.id}
                        className="p-2.5 rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Warehouse className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium text-foreground truncate">
                              {warehouse.name}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-foreground ml-2">
                            {formatCurrency(warehouse.total_value)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-foreground rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono w-12 text-right">
                            {percent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                          <span>{warehouse.product_count} produits</span>
                          <span>{formatNumber(warehouse.total_quantity)} unités</span>
                          {warehouse.low_stock_count > 0 && (
                            <span className="text-amber-700 dark:text-amber-500">
                              {warehouse.low_stock_count} stock bas
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Can>
          )}
        </div>

        {/* Category Performance Table */}
        {loadingStats || !stats ? (
          <DataTableSkeleton />
        ) : (
          <Can allPermissions={[COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS]}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Performance par catégorie</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Rotation et revenus (90j)</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 font-medium">Catégorie</th>
                      <th className="text-right py-2 font-medium">Produits</th>
                      <th className="text-right py-2 font-medium">Stock</th>
                      <th className="text-right py-2 font-medium">Valeur stock</th>
                      <th className="text-right py-2 font-medium">Revenus 90j</th>
                      <th className="text-right py-2 font-medium">Rotation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.category_performance.slice(0, 10).map((cat, index) => (
                    <tr key={cat.category_id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 text-sm font-medium text-foreground">
                        {cat.category_name}
                      </td>
                      <td className="py-3 text-sm text-right text-muted-foreground">
                        {cat.product_count}
                      </td>
                      <td className="py-3 text-sm text-right text-muted-foreground font-mono">
                        {formatNumber(cat.stock_quantity)}
                      </td>
                      <td className="py-3 text-sm text-right font-medium text-foreground">
                        {formatCurrency(cat.stock_value)}
                      </td>
                      <td className="py-3 text-sm text-right font-medium text-foreground">
                        {formatCurrency(cat.revenue_90d)}
                      </td>
                      <td className="py-3 text-sm text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            cat.turnover_ratio >= 4 && "text-emerald-700 dark:text-emerald-500",
                            cat.turnover_ratio >= 2 && cat.turnover_ratio < 4 && "text-slate-700 dark:text-slate-400",
                            cat.turnover_ratio < 2 && "text-amber-700 dark:text-amber-500"
                          )}
                        >
                          {cat.turnover_ratio.toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Can>
        )}

        {/* Quick Actions - Minimalist */}
        <Can
          anyPermissions={[
            COMMON_PERMISSIONS.INVENTORY.CREATE_SALES,
            COMMON_PERMISSIONS.INVENTORY.CREATE_PRODUCTS,
            COMMON_PERMISSIONS.INVENTORY.MANAGE_STOCK,
            COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS,
            COMMON_PERMISSIONS.INVENTORY.MANAGE_DOCUMENTS,
          ]}
        >
          <Card className="p-4 bg-muted/30">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_SALES}>
                <Link href={`/apps/${slug}/inventory/sales/new`}>
                  <Button variant="outline" size="sm" className="h-9">
                    Nouvelle vente
                  </Button>
                </Link>
              </Can>
              <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_PRODUCTS}>
                <Link href={`/apps/${slug}/inventory/products/new`}>
                  <Button variant="outline" size="sm" className="h-9">
                    Ajouter produit
                  </Button>
                </Link>
              </Can>
              <Can permission={COMMON_PERMISSIONS.INVENTORY.MANAGE_STOCK}>
                <Link href={`/apps/${slug}/inventory/movements/new`}>
                  <Button variant="outline" size="sm" className="h-9">
                    Mouvement stock
                  </Button>
                </Link>
              </Can>
              <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS}>
                <Link href={`/apps/${slug}/inventory/orders`}>
                  <Button variant="outline" size="sm" className="h-9">
                    Commandes
                  </Button>
                </Link>
              </Can>
              <Can permission={COMMON_PERMISSIONS.INVENTORY.MANAGE_DOCUMENTS}>
                <Link href={`/apps/${slug}/inventory/documents`}>
                  <Button variant="outline" size="sm" className="h-9">
                    Documents
                  </Button>
                </Link>
              </Can>
            </div>
          </Card>
        </Can>
      </div>
    </div>
  );
}
