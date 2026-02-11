"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
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
  Package,
  AlertTriangle,
  Warehouse,
  Tags,
  RotateCw,
  ClipboardList,
  Calendar,
  DollarSign,
  RefreshCw,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Activity,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

type ReportTab = "overview" | "warehouses" | "categories" | "movements" | "rotation" | "counts";

const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const COLORS = ["#64748b", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export default function ReportsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStockReport[]>([]);
  const [categoryStock, setCategoryStock] = useState<CategoryStockReport[]>([]);
  const [movementHistory, setMovementHistory] = useState<MovementHistoryResponse | null>(null);
  const [lowRotation, setLowRotation] = useState<LowRotationProductsResponse | null>(null);
  const [stockCountsSummary, setStockCountsSummary] = useState<StockCountsSummaryResponse | null>(null);

  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [movementDays, setMovementDays] = useState(30);
  const [rotationDays, setRotationDays] = useState(90);

  const loadAllData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsData, topData, whData, catData, movData, rotData, countData] = await Promise.all([
        getInventoryOverview(),
        getTopProducts(),
        getStockByWarehouse(),
        getStockByCategory(),
        getMovementHistory(movementDays),
        getLowRotationProducts(rotationDays, 20),
        getStockCountsSummary(10),
      ]);

      setStats(statsData);
      setTopProducts(topData || []);
      setWarehouseStock(whData || []);
      setCategoryStock(catData || []);
      setMovementHistory(movData);
      setLowRotation(rotData);
      setStockCountsSummary(countData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [movementDays, rotationDays]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleExport = async (exportFn: () => Promise<void>, type: string) => {
    try {
      setExporting(type);
      await exportFn();
      setSuccessMessage(`Export ${type} téléchargé`);
      setShowExportMenu(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(null);
    }
  };

  const formatShortCurrency = (value: any) => {
    const num = safeNumber(value);
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const tabs = [
    { id: "overview" as ReportTab, label: "Vue d'ensemble", icon: BarChart3 },
    { id: "warehouses" as ReportTab, label: "Entrepôts", icon: Warehouse },
    { id: "categories" as ReportTab, label: "Catégories", icon: Tags },
    { id: "movements" as ReportTab, label: "Mouvements", icon: Activity },
    { id: "rotation" as ReportTab, label: "Rotation", icon: RotateCw },
    { id: "counts" as ReportTab, label: "Inventaires", icon: ClipboardList },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-3 text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-foreground text-background px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Rapports</h1>
          <p className="text-sm text-muted-foreground">Analyse de votre inventaire</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/apps/${slug}/inventory/reports/calendar`}>
            <Button variant="outline" size="sm" className="h-9">
              <Calendar className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Calendrier</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadAllData(true)} 
            disabled={refreshing}
            className="h-9"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <div className="relative">
            <Button 
              variant="default" 
              size="sm" 
              className="h-9"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Exporter
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-3 py-1.5">PDF</p>
                  <button 
                    onClick={() => handleExport(downloadProductsCatalogPdf, "catalogue")} 
                    disabled={!!exporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    Catalogue produits
                  </button>
                  <button 
                    onClick={() => handleExport(downloadStockReportPdf, "stock")} 
                    disabled={!!exporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    Rapport de stock
                  </button>
                  <div className="border-t my-1" />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-3 py-1.5">Excel</p>
                  <button 
                    onClick={() => handleExport(downloadStockListExport, "liste")} 
                    disabled={!!exporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Liste des stocks
                  </button>
                  <button 
                    onClick={() => handleExport(() => downloadMovementsExport(movementDays), "mouvements")} 
                    disabled={!!exporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Mouvements ({movementDays}j)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-foreground text-background" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && stats && (
          <OverviewTab 
            stats={stats} 
            topProducts={topProducts} 
            categoryStock={categoryStock} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber} 
            formatShortCurrency={formatShortCurrency} 
            slug={slug} 
          />
        )}
        {activeTab === "warehouses" && (
          <WarehousesTab 
            data={warehouseStock} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber} 
            formatShortCurrency={formatShortCurrency} 
          />
        )}
        {activeTab === "categories" && (
          <CategoriesTab 
            data={categoryStock} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber} 
          />
        )}
        {activeTab === "movements" && (
          <MovementsTab 
            data={movementHistory} 
            days={movementDays} 
            setDays={setMovementDays} 
            formatNumber={formatNumber} 
          />
        )}
        {activeTab === "rotation" && (
          <RotationTab 
            data={lowRotation} 
            days={rotationDays} 
            setDays={setRotationDays} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber} 
            slug={slug} 
          />
        )}
        {activeTab === "counts" && (
          <CountsTab 
            data={stockCountsSummary} 
            formatNumber={formatNumber} 
            slug={slug} 
          />
        )}
      </div>
    </div>
  );
}

// ==========================================
// Overview Tab
// ==========================================
function OverviewTab({ stats, topProducts, categoryStock, formatCurrency, formatNumber, formatShortCurrency, slug }: any) {
  const totalProducts = safeNumber(stats.total_products);
  const lowStockCount = safeNumber(stats.low_stock_count);
  const stockHealthPercent = totalProducts > 0 ? Math.round(((totalProducts - lowStockCount) / totalProducts) * 100) : 100;

  const topProductsData = topProducts.slice(0, 5).map((p: any) => ({
    name: p.name?.length > 12 ? p.name.substring(0, 12) + "..." : p.name,
    value: safeNumber(p.stock_value),
  }));

  const categoryData = categoryStock.slice(0, 6).map((c: any) => ({
    name: c.name || "Sans catégorie",
    value: safeNumber(c.total_value),
  }));

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Produits" value={formatNumber(stats.total_products)} icon={Package} />
        <StatCard label="Valeur stock" value={formatShortCurrency(stats.total_stock_value)} accent />
        <StatCard label="Stock faible" value={formatNumber(stats.low_stock_count)} warning={stats.low_stock_count > 0} />
        <StatCard label="Alertes" value={formatNumber(stats.active_alerts)} warning={stats.active_alerts > 0} />
        <StatCard label="Santé" value={`${stockHealthPercent}%`} positive={stockHealthPercent >= 80} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Products Chart */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Top 5 produits par valeur</h3>
            <Link href={`/apps/${slug}/inventory/products`} className="text-xs text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          {topProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tickFormatter={formatShortCurrency} fontSize={11} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={80} fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)} 
                  contentStyle={{ 
                    borderRadius: "8px", 
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                  }} 
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Aucune donnée
            </div>
          )}
        </Card>

        {/* Categories Pie */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">Répartition par catégorie</h3>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={70}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryData.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {categoryData.slice(0, 5).map((cat: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate text-muted-foreground">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
              Aucune donnée
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// Warehouses Tab
// ==========================================
function WarehousesTab({ data, formatCurrency, formatNumber, formatShortCurrency }: any) {
  const chartData = data.map((wh: any) => ({
    name: wh.name?.length > 10 ? wh.name.substring(0, 10) + "..." : wh.name,
    value: safeNumber(wh.total_value),
  }));

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Warehouse className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>Aucun entrepôt</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Chart */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-4">Valeur par entrepôt</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatShortCurrency} fontSize={11} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: any) => formatCurrency(value)} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((wh: any) => (
          <Card key={wh.id} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </div>
              <h4 className="font-medium text-sm truncate">{wh.name}</h4>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valeur</span>
                <span className="font-medium">{formatCurrency(wh.total_value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produits</span>
                <span>{safeNumber(wh.product_count)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantité</span>
                <span>{formatNumber(wh.total_quantity)}</span>
              </div>
              {safeNumber(wh.low_stock_count) > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Stock bas</span>
                  <span className="font-medium">{safeNumber(wh.low_stock_count)}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// Categories Tab
// ==========================================
function CategoriesTab({ data, formatCurrency, formatNumber }: any) {
  const totalValue = data.reduce((acc: number, c: any) => acc + safeNumber(c.total_value), 0);

  const chartData = data.map((c: any) => ({
    name: c.name || "Sans catégorie",
    value: safeNumber(c.total_value),
    products: safeNumber(c.product_count),
    quantity: safeNumber(c.total_quantity),
  }));

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Tags className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>Aucune catégorie</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data.length} catégories</p>
        <p className="text-sm font-medium">Total: {formatCurrency(totalValue)}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">Répartition de la valeur</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                strokeWidth={0}
              >
                {chartData.map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* List */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Détails</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {chartData.map((cat: any, i: number) => {
              const percent = totalValue > 0 ? (cat.value / totalValue) * 100 : 0;
              return (
                <div key={i} className="p-2.5 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-medium text-sm flex-1 truncate">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{percent.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{cat.products} produits • {formatNumber(cat.quantity)} unités</span>
                    <span className="font-medium text-foreground">{formatCurrency(cat.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// Movements Tab
// ==========================================
function MovementsTab({ data, days, setDays, formatNumber }: any) {
  const summary = data?.summary || {};
  const totalIn = safeNumber(summary.total_in);
  const totalOut = safeNumber(summary.total_out);
  const totalAdj = safeNumber(summary.total_adjustments);
  const totalTrans = safeNumber(summary.total_transfers);

  const historyData = data?.history || [];
  const dailyData = historyData.slice(-30).map((d: any) => {
    const inCount = safeNumber(d.in?.count);
    const outCount = safeNumber(d.out?.count);
    const adjCount = safeNumber(d.adjustment?.count);
    const transCount = safeNumber(d.transfer?.count);
    return {
      date: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      count: inCount + outCount + adjCount + transCount,
    };
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Historique sur {days} jours</p>
        <div className="flex gap-0.5 bg-muted p-0.5 rounded-lg">
          {[7, 14, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                days === d ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 border-l-2 border-l-emerald-500">
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-lg font-semibold text-emerald-600">{formatNumber(totalIn)}</p>
              <p className="text-xs text-muted-foreground">Entrées</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-l-2 border-l-red-500">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-lg font-semibold text-red-600">{formatNumber(totalOut)}</p>
              <p className="text-xs text-muted-foreground">Sorties</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-l-2 border-l-slate-500">
          <div className="flex items-center gap-2">
            <RotateCw className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-lg font-semibold">{formatNumber(totalAdj)}</p>
              <p className="text-xs text-muted-foreground">Ajustements</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-l-2 border-l-violet-500">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            <div>
              <p className="text-lg font-semibold text-violet-600">{formatNumber(totalTrans)}</p>
              <p className="text-xs text-muted-foreground">Transferts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      {dailyData.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">Évolution des mouvements</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={11} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2} 
                fill="url(#colorCount)" 
                name="Mouvements" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

// ==========================================
// Rotation Tab
// ==========================================
function RotationTab({ data, days, setDays, formatCurrency, formatNumber, slug }: any) {
  const products = data?.products || [];
  const totalValue = products.reduce((acc: number, p: any) => acc + safeNumber(p.stock_value), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Sans mouvement depuis</p>
        <div className="flex gap-0.5 bg-muted p-0.5 rounded-lg">
          {[30, 60, 90, 180].map((d) => (
            <button 
              key={d} 
              onClick={() => setDays(d)} 
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded transition-colors", 
                days === d ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-medium">Excellent !</p>
          <p className="text-sm text-muted-foreground">Tous vos produits ont eu des mouvements récents</p>
        </Card>
      ) : (
        <>
          <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-medium">{products.length} produit(s) dormant(s)</p>
                <p className="text-sm text-muted-foreground">Valeur immobilisée: {formatCurrency(totalValue)}</p>
              </div>
            </div>
          </Card>

          <div className="grid sm:grid-cols-2 gap-2">
            {products.slice(0, 10).map((product: any) => (
              <Link key={product.id} href={`/apps/${slug}/inventory/products/${product.id}`}>
                <Card className="p-3 hover:bg-muted/30 transition-colors">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>
                      Dernier: {product.last_movement_date 
                        ? new Date(product.last_movement_date).toLocaleDateString("fr-FR") 
                        : "Jamais"}
                    </span>
                    <span className="font-medium text-foreground">{formatNumber(safeNumber(product.total_stock))} unités</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// Counts Tab
// ==========================================
function CountsTab({ data, formatNumber, slug }: any) {
  const recentCounts = data?.stock_counts || [];
  const summary = data?.summary || {};
  const totalItemsCounted = recentCounts.reduce((acc: number, c: any) => acc + safeNumber(c.item_count), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Historique des inventaires</p>
        <Link href={`/apps/${slug}/inventory/stock-counts/new`}>
          <Button size="sm" className="h-8">
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Nouvel inventaire
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={formatNumber(summary.total_counts)} icon={ClipboardList} />
        <StatCard label="Validés" value={formatNumber(summary.validated_counts)} icon={CheckCircle} positive />
        <StatCard label="En cours" value={formatNumber(summary.pending_counts)} icon={Clock} warning={summary.pending_counts > 0} />
        <StatCard label="Articles" value={formatNumber(totalItemsCounted)} icon={Package} />
      </div>

      {recentCounts.length > 0 && (
        <Card className="divide-y">
          {recentCounts.map((count: any) => (
            <Link 
              key={count.id} 
              href={`/apps/${slug}/inventory/stock-counts/${count.id}`}
              className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
            >
              <div>
                <p className="font-medium text-sm">{count.count_number}</p>
                <p className="text-xs text-muted-foreground">
                  {count.count_date ? new Date(count.count_date).toLocaleDateString("fr-FR") : "Non planifié"}
                  {count.warehouse_name && ` • ${count.warehouse_name}`}
                </p>
              </div>
              <span className={cn(
                "px-2 py-0.5 text-[10px] rounded font-medium",
                count.status === "validated" 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                  : count.status === "completed" 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                    : count.status === "in_progress" 
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                      : "bg-muted"
              )}>
                {count.status_display || count.status}
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}

// ==========================================
// Stat Card Component
// ==========================================
function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  accent = false,
  positive = false,
  warning = false,
}: { 
  label: string; 
  value: string; 
  icon?: any;
  accent?: boolean;
  positive?: boolean;
  warning?: boolean;
}) {
  return (
    <Card className={cn(
      "p-3",
      accent && "bg-primary/5 border-primary/20"
    )}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            positive ? "bg-emerald-100 dark:bg-emerald-900/30" :
            warning ? "bg-amber-100 dark:bg-amber-900/30" :
            "bg-muted"
          )}>
            <Icon className={cn(
              "h-4 w-4",
              positive ? "text-emerald-600" :
              warning ? "text-amber-600" :
              "text-muted-foreground"
            )} />
          </div>
        )}
        <div className="min-w-0">
          <p className={cn(
            "text-base font-semibold truncate",
            positive && "text-emerald-600",
            warning && "text-amber-600"
          )}>
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}
