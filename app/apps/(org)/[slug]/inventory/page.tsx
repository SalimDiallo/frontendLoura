"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Alert, Badge, Card } from "@/components/ui";
import {
  getInventoryOverview,
  getTopProducts,
  getStockByWarehouse,
  getStockByCategory,
  getMovementHistory,
} from "@/lib/services/inventory";
import type {
  InventoryStats,
  TopProduct,
  WarehouseStockReport,
  CategoryStockReport,
  MovementHistoryResponse,
} from "@/lib/types/inventory";
import {
  HiOutlineCube,
  HiOutlineArchiveBox,
  HiOutlineShoppingCart,
  HiOutlineArrowRight,
} from "react-icons/hi2";
import {
  Package,
  DollarSign,
  AlertTriangle,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  RefreshCcw,
  FileText,
  Bell,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

// Couleurs sobres
const NEUTRAL_COLORS = {
  primary: "hsl(220, 13%, 46%)",
  secondary: "hsl(220, 9%, 56%)",
  success: "hsl(142, 40%, 40%)",
  warning: "hsl(32, 60%, 50%)",
  danger: "hsl(0, 50%, 50%)",
};

export default function InventoryOverviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStockReport[]>([]);
  const [categoryStock, setCategoryStock] = useState<CategoryStockReport[]>([]);
  const [movementHistory, setMovementHistory] = useState<MovementHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [slug]);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [statsData, topProductsData, warehouseData, categoryData, movementData] = await Promise.all([
        getInventoryOverview().catch(() => null),
        getTopProducts().catch(() => []),
        getStockByWarehouse().catch(() => []),
        getStockByCategory().catch(() => []),
        getMovementHistory(14).catch(() => null),
      ]);

      setStats(statsData);
      setTopProducts(topProductsData);
      setWarehouseStock(warehouseData);
      setCategoryStock(categoryData);
      setMovementHistory(movementData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Données pour le graphique des mouvements
  const movementChartData = useMemo(() => {
    if (!movementHistory?.history) return [];
    return movementHistory.history.slice(-14).map((day) => ({
      date: new Date(day.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      entrees: day.in.count,
      sorties: day.out.count,
    }));
  }, [movementHistory]);

  // Données pour le graphique des entrepôts
  const warehouseBarData = useMemo(() => {
    return warehouseStock.slice(0, 5).map((wh) => ({
      name: wh.code,
      fullName: wh.name,
      stock: wh.total_quantity,
      value: wh.total_value,
    }));
  }, [warehouseStock]);

  const chartConfig = {
    entrees: { label: "Entrées", color: NEUTRAL_COLORS.success },
    sorties: { label: "Sorties", color: NEUTRAL_COLORS.danger },
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "GNF",
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("fr-FR").format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-medium">Erreur</h3>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      </div>
    );
  }

  const stockHealthPercent = stats
    ? Math.round(((stats.total_products - stats.low_stock_count) / Math.max(stats.total_products, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gestion des stocks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vue d'ensemble de votre inventaire</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
          >
            <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Link href={`/apps/${slug}/inventory/documents`}>
            <Button variant="outline" size="sm">
              <Receipt className="mr-2 h-4 w-4" />
              Documents
            </Button>
          </Link>
          <Link href={`/apps/${slug}/inventory/reports`}>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Rapports
            </Button>
          </Link>
          <Link href={`/apps/${slug}/inventory/products`}>
            <Button size="sm">
              <Package className="mr-2 h-4 w-4" />
              Produits
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards - Design sobre */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Produits</p>
                <p className="text-xl font-semibold">{formatNumber(stats.total_products)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 xl:col-span-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valeur du stock</p>
                <p className="text-xl font-semibold">{formatCurrency(stats.total_stock_value)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center",
                stats.low_stock_count > 0 ? "bg-orange-100 dark:bg-orange-950/30" : "bg-muted"
              )}>
                <AlertTriangle className={cn(
                  "h-4 w-4",
                  stats.low_stock_count > 0 ? "text-orange-600" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock bas</p>
                <p className={cn("text-xl font-semibold", stats.low_stock_count > 0 && "text-orange-600")}>
                  {stats.low_stock_count}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center",
                stats.active_alerts > 0 ? "bg-red-100 dark:bg-red-950/30" : "bg-muted"
              )}>
                <Bell className={cn(
                  "h-4 w-4",
                  stats.active_alerts > 0 ? "text-red-600" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alertes</p>
                <p className={cn("text-xl font-semibold", stats.active_alerts > 0 && "text-red-600")}>
                  {stats.active_alerts}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Commandes</p>
                <p className="text-xl font-semibold">{stats.pending_orders}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Section Actions Rapides - Simple et clair */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          ⚡ Actions Rapides
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nouvelle Vente */}
          <Link href={`/apps/${slug}/inventory/sales/new`} className="block">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border hover:border-green-400 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Nouvelle Vente</p>
                  <p className="text-xs text-muted-foreground">Le stock se déduit auto.</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Nouveau Produit */}
          <Link href={`/apps/${slug}/inventory/products/new`} className="block">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border hover:border-blue-400 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Ajouter Produit</p>
                  <p className="text-xs text-muted-foreground">Créer un nouveau produit</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Mouvement */}
          <Link href={`/apps/${slug}/inventory/movements/new`} className="block">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border hover:border-orange-400 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Mouvement Stock</p>
                  <p className="text-xs text-muted-foreground">Entrée / Sortie / Transfert</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Pro Forma */}
          <Link href={`/apps/${slug}/inventory/documents/proformas/new`} className="block">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border hover:border-purple-400 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Pro Forma</p>
                  <p className="text-xs text-muted-foreground">Devis pour client</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </Card>

      {/* Section Graphiques */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Graphique des mouvements */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Activité des mouvements</h3>
              <p className="text-xs text-muted-foreground">14 derniers jours</p>
            </div>
            {movementHistory?.summary && (
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="text-muted-foreground">{movementHistory.summary.total_in}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-muted-foreground">{movementHistory.summary.total_out}</span>
                </div>
              </div>
            )}
          </div>
          
          {movementChartData.length > 0 ? (
            <div className="h-[220px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={movementChartData}>
                  <defs>
                    <linearGradient id="gradientIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(150, 40%, 50%)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(150, 40%, 50%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 60%, 55%)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(0, 60%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="entrees"
                    stroke="hsl(150, 40%, 45%)"
                    strokeWidth={1.5}
                    fill="url(#gradientIn)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sorties"
                    stroke="hsl(0, 55%, 50%)"
                    strokeWidth={1.5}
                    fill="url(#gradientOut)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </Card>

        {/* Graphique en barres des entrepôts */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-medium">Stock par entrepôt</h3>
            <p className="text-xs text-muted-foreground">Top 5 entrepôts par quantité</p>
          </div>

          {warehouseBarData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                  <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                  <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={50} />
                  <Tooltip
                    formatter={(value: number) => formatNumber(value)}
                    labelFormatter={(label) => warehouseBarData.find(w => w.name === label)?.fullName || label}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="stock" radius={[0, 3, 3, 0]} barSize={20} fill="hsl(220, 13%, 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              Aucun entrepôt disponible
            </div>
          )}
        </Card>
      </div>

      {/* Indicateur de santé du stock + Top produits */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Indicateur de santé */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-medium">Santé du stock</h3>
            <p className="text-xs text-muted-foreground">Taux de produits en stock suffisant</p>
          </div>

          <div className="flex flex-col items-center py-4">
            <div className="relative w-28 h-28">
              <svg className="transform -rotate-90 w-28 h-28">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted/30"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke={stockHealthPercent >= 80 ? "hsl(150, 40%, 45%)" : stockHealthPercent >= 50 ? "hsl(35, 60%, 50%)" : "hsl(0, 55%, 50%)"}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(stockHealthPercent / 100) * 302} 302`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold">{stockHealthPercent}%</span>
              </div>
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <div className="text-center">
                <p className="font-medium">{stats ? stats.total_products - stats.low_stock_count : 0}</p>
                <p className="text-xs text-muted-foreground">OK</p>
              </div>
              <div className="text-center">
                <p className={cn("font-medium", stats?.low_stock_count && stats.low_stock_count > 0 && "text-orange-600")}>
                  {stats?.low_stock_count || 0}
                </p>
                <p className="text-xs text-muted-foreground">Bas</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Top produits</h3>
              <p className="text-xs text-muted-foreground">Par valeur de stock</p>
            </div>
            <Link href={`/apps/${slug}/inventory/reports`}>
              <Button variant="ghost" size="sm" className="text-xs">
                Voir tout
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-2">
            {topProducts.length > 0 ? (
              topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(product.stock_value)}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(product.total_stock)} u.</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Aucun produit trouvé
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-5">
        <h3 className="font-medium mb-3">Actions rapides</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Link href={`/apps/${slug}/inventory/products`}>
            <Button variant="outline" className="w-full justify-start h-10">
              <HiOutlineCube className="mr-2 h-4 w-4" />
              Gérer les produits
            </Button>
          </Link>
          <Link href={`/apps/${slug}/inventory/warehouses`}>
            <Button variant="outline" className="w-full justify-start h-10">
              <HiOutlineArchiveBox className="mr-2 h-4 w-4" />
              Gérer les entrepôts
            </Button>
          </Link>
          <Link href={`/apps/${slug}/inventory/movements`}>
            <Button variant="outline" className="w-full justify-start h-10">
              <HiOutlineArrowRight className="mr-2 h-4 w-4" />
              Mouvements de stock
            </Button>
          </Link>
          <Link href={`/apps/${slug}/inventory/orders`}>
            <Button variant="outline" className="w-full justify-start h-10">
              <HiOutlineShoppingCart className="mr-2 h-4 w-4" />
              Commandes
            </Button>
          </Link>
          <Link href={`/apps/${slug}/inventory/documents`}>
            <Button variant="outline" className="w-full justify-start h-10 text-primary border-primary/30 hover:bg-primary/5">
              <Receipt className="mr-2 h-4 w-4" />
              Devis & Factures
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
