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
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";

type ReportTab = "overview" | "warehouses" | "categories" | "movements" | "rotation" | "counts";

// Fonction sécurisée pour les nombres
const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Couleurs pour les graphiques
const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

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
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(null);
    }
  };

  const formatCurrency = (value: any) => {
    const num = safeNumber(value);
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(num) + " GNF";
  };

  const formatNumber = (value: any) => {
    const num = safeNumber(value);
    return new Intl.NumberFormat("fr-FR").format(num);
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
    { id: "movements" as ReportTab, label: "Mouvements", icon: TrendingUp },
    { id: "rotation" as ReportTab, label: "Rotation", icon: RotateCw },
    { id: "counts" as ReportTab, label: "Inventaires", icon: ClipboardList },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-3 text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rapports & Analyses</h1>
          <p className="text-muted-foreground text-sm">Statistiques de votre inventaire</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/apps/${slug}/inventory/reports/calendar`}>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Calendrier
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => loadAllData(true)} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Actualiser
          </Button>
          <div className="relative group">
            <Button variant="default" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter ▼
            </Button>
            <div className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[200px]">
              <p className="text-xs text-muted-foreground px-2 pb-2 border-b mb-2">Format PDF</p>
              <button onClick={() => handleExport(downloadProductsCatalogPdf, "catalogue PDF")} disabled={exporting === "catalogue PDF"} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted flex items-center gap-2 disabled:opacity-50">
                <FileText className="h-4 w-4 text-red-500" />
                Catalogue produits
              </button>
              <button onClick={() => handleExport(downloadStockReportPdf, "stock PDF")} disabled={exporting === "stock PDF"} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted flex items-center gap-2 disabled:opacity-50">
                <FileText className="h-4 w-4 text-red-500" />
                Rapport de stock
              </button>
              <p className="text-xs text-muted-foreground px-2 pt-2 pb-2 border-t border-b my-2">Format Excel</p>
              <button onClick={() => handleExport(downloadStockListExport, "stocks Excel")} disabled={exporting === "stocks Excel"} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted flex items-center gap-2 disabled:opacity-50">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Liste des stocks
              </button>
              <button onClick={() => handleExport(() => downloadMovementsExport(movementDays), "mouvements Excel")} disabled={exporting === "mouvements Excel"} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted flex items-center gap-2 disabled:opacity-50">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Mouvements ({movementDays}j)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && stats && (
        <OverviewTab stats={stats} topProducts={topProducts} categoryStock={categoryStock} formatCurrency={formatCurrency} formatNumber={formatNumber} formatShortCurrency={formatShortCurrency} slug={slug} />
      )}
      {activeTab === "warehouses" && (
        <WarehousesTab data={warehouseStock} formatCurrency={formatCurrency} formatNumber={formatNumber} formatShortCurrency={formatShortCurrency} />
      )}
      {activeTab === "categories" && (
        <CategoriesTab data={categoryStock} formatCurrency={formatCurrency} formatNumber={formatNumber} />
      )}
      {activeTab === "movements" && (
        <MovementsTab data={movementHistory} days={movementDays} setDays={setMovementDays} formatNumber={formatNumber} />
      )}
      {activeTab === "rotation" && (
        <RotationTab data={lowRotation} days={rotationDays} setDays={setRotationDays} formatCurrency={formatCurrency} formatNumber={formatNumber} slug={slug} />
      )}
      {activeTab === "counts" && (
        <CountsTab data={stockCountsSummary} formatNumber={formatNumber} slug={slug} />
      )}
    </div>
  );
}

// ==========================================
// Overview Tab avec graphiques
// ==========================================
function OverviewTab({ stats, topProducts, categoryStock, formatCurrency, formatNumber, formatShortCurrency, slug }: any) {
  const totalProducts = safeNumber(stats.total_products);
  const lowStockCount = safeNumber(stats.low_stock_count);
  const stockHealthPercent = totalProducts > 0 ? Math.round(((totalProducts - lowStockCount) / totalProducts) * 100) : 100;

  // Données pour le graphique top produits
  const topProductsData = topProducts.slice(0, 5).map((p: any) => ({
    name: p.name?.substring(0, 15) + (p.name?.length > 15 ? "..." : ""),
    value: safeNumber(p.stock_value),
    stock: safeNumber(p.total_stock),
  }));

  // Données pour le pie chart catégories
  const categoryData = categoryStock.slice(0, 6).map((c: any, i: number) => ({
    name: c.name || "Sans catégorie",
    value: safeNumber(c.total_value),
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Produits" value={formatNumber(stats.total_products)} icon={Package} color="blue" />
        <StatCard label="Valeur stock" value={formatCurrency(stats.total_stock_value)} icon={DollarSign} color="green" />
        <StatCard label="Stock faible" value={formatNumber(stats.low_stock_count)} icon={TrendingDown} color="orange" />
        <StatCard label="Alertes" value={formatNumber(stats.active_alerts)} icon={AlertTriangle} color="red" />
        <StatCard label="Santé" value={`${stockHealthPercent}%`} icon={CheckCircle} color={stockHealthPercent >= 80 ? "green" : "orange"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Graphique Top Produits */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Top 5 produits par valeur
          </h3>
          {topProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={formatShortCurrency} fontSize={12} />
                <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelStyle={{ fontWeight: "bold" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
          )}
          <Link href={`/apps/${slug}/inventory/products`} className="block text-center text-sm text-primary hover:underline mt-2">
            Voir tous les produits →
          </Link>
        </Card>

        {/* Pie Chart Catégories */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Tags className="h-5 w-5 text-purple-600" />
            Répartition par catégorie
          </h3>
          {categoryData.length > 0 ? (
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={false}
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryData.map((cat: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate flex-1">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// Warehouses Tab avec graphique
// ==========================================
function WarehousesTab({ data, formatCurrency, formatNumber, formatShortCurrency }: any) {
  const chartData = data.map((wh: any) => ({
    name: wh.name?.substring(0, 12) + (wh.name?.length > 12 ? "..." : ""),
    value: safeNumber(wh.total_value),
    quantity: safeNumber(wh.total_quantity),
  }));

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Répartition du stock par entrepôt</p>

      {data.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Aucun entrepôt</Card>
      ) : (
        <>
          {/* Graphique */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Valeur par entrepôt</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis tickFormatter={formatShortCurrency} fontSize={12} />
                <Tooltip formatter={(value: any, name: string) => [formatCurrency(value), name === "value" ? "Valeur" : "Quantité"]} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Valeur" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Cartes détails */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((wh: any) => (
              <Card key={wh.id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Warehouse className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold truncate">{wh.name}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valeur</span>
                    <span className="font-semibold">{formatCurrency(wh.total_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produits</span>
                    <span>{safeNumber(wh.product_count)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantité</span>
                    <span>{formatNumber(wh.total_quantity)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Stock bas</span>
                    <span className="font-semibold">{safeNumber(wh.low_stock_count)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// Categories Tab avec pie chart
// ==========================================
function CategoriesTab({ data, formatCurrency, formatNumber }: any) {
  const totalValue = data.reduce((acc: number, c: any) => acc + safeNumber(c.total_value), 0);

  const chartData = data.map((c: any) => ({
    name: c.name || "Sans catégorie",
    value: safeNumber(c.total_value),
    products: safeNumber(c.product_count),
    quantity: safeNumber(c.total_quantity),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Répartition par catégorie</p>
        <p className="font-semibold">Total: {formatCurrency(totalValue)}</p>
      </div>

      {data.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Aucune catégorie</Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Répartition de la valeur</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? "..." : ""} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Liste détaillée */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Détails</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {chartData.map((cat: any, i: number) => {
                const percent = totalValue > 0 ? (cat.value / totalValue) * 100 : 0;
                return (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium flex-1">{cat.name}</span>
                      <span className="text-sm font-semibold">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{cat.products} produits • {formatNumber(cat.quantity)} unités</span>
                      <span>{formatCurrency(cat.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Movements Tab avec line chart
// ==========================================
function MovementsTab({ data, days, setDays, formatNumber }: any) {
  // Le backend retourne summary.total_in, summary.total_out, etc.
  const summary = data?.summary || {};
  const totalIn = safeNumber(summary.total_in);
  const totalOut = safeNumber(summary.total_out);
  const totalAdj = safeNumber(summary.total_adjustments);
  const totalTrans = safeNumber(summary.total_transfers);

  // Préparer les données pour le graphique à partir de history
  const historyData = data?.history || [];
  const dailyData = historyData.slice(-30).map((d: any) => {
    // Calculer le total de mouvements pour ce jour
    const inCount = safeNumber(d.in?.count);
    const outCount = safeNumber(d.out?.count);
    const adjCount = safeNumber(d.adjustment?.count);
    const transCount = safeNumber(d.transfer?.count);
    return {
      date: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      count: inCount + outCount + adjCount + transCount,
      in: inCount,
      out: outCount,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Historique sur {days} jours</p>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {[7, 14, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn("px-3 py-1 text-sm rounded-md transition-colors", days === d ? "bg-background shadow-sm" : "hover:bg-background/50")}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-green-500">
          <ArrowDownRight className="h-6 w-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">{formatNumber(totalIn)}</p>
          <p className="text-xs text-muted-foreground">Entrées</p>
        </Card>
        <Card className="p-4 border-l-4 border-red-500">
          <ArrowUpRight className="h-6 w-6 text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-600">{formatNumber(totalOut)}</p>
          <p className="text-xs text-muted-foreground">Sorties</p>
        </Card>
        <Card className="p-4 border-l-4 border-blue-500">
          <RotateCw className="h-6 w-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-blue-600">{formatNumber(totalAdj)}</p>
          <p className="text-xs text-muted-foreground">Ajustements</p>
        </Card>
        <Card className="p-4 border-l-4 border-purple-500">
          <TrendingUp className="h-6 w-6 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-purple-600">{formatNumber(totalTrans)}</p>
          <p className="text-xs text-muted-foreground">Transferts</p>
        </Card>
      </div>

      {/* Line Chart */}
      {dailyData.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Évolution des mouvements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" fontSize={11} tickMargin={10} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCount)" name="Mouvements" />
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
  // Calculer le nombre et la valeur totale depuis la liste
  const count = products.length;
  const totalValue = products.reduce((acc: number, p: any) => acc + safeNumber(p.stock_value), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Produits sans mouvement depuis</p>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {[30, 60, 90, 180].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={cn("px-3 py-1 text-sm rounded-md transition-colors", days === d ? "bg-background shadow-sm" : "hover:bg-background/50")}>
              {d}j
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold">Excellent !</p>
          <p className="text-muted-foreground text-sm">Tous vos produits ont eu des mouvements récents</p>
        </Card>
      ) : (
        <>
          <Card className="p-4 bg-orange-50 dark:bg-orange-950/30 border-orange-200">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="font-semibold">{count} produit(s) dormant(s)</p>
                <p className="text-sm text-muted-foreground">Valeur immobilisée: {formatCurrency(totalValue)}</p>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-3">
            {products.slice(0, 10).map((product: any) => (
              <Link key={product.id} href={`/apps/${slug}/inventory/products/${product.id}`}>
                <Card className="p-4 hover:bg-muted/50 transition-colors h-full">
                  <p className="font-medium truncate mb-1">{product.name}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Dernier mvt: {product.last_movement_date ? new Date(product.last_movement_date).toLocaleDateString("fr-FR") : "Jamais"}
                    </span>
                    <span className="font-semibold">{formatNumber(safeNumber(product.total_stock))} unités</span>
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
  // Le backend retourne stock_counts et summary
  const recentCounts = data?.stock_counts || [];
  const summary = data?.summary || {};
  
  // Calculer le total des articles comptés
  const totalItemsCounted = recentCounts.reduce((acc: number, c: any) => acc + safeNumber(c.item_count), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Historique des inventaires</p>
        <Link href={`/apps/${slug}/inventory/stock-counts/new`}>
          <Button size="sm"><ClipboardList className="h-4 w-4 mr-2" />Nouvel inventaire</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={formatNumber(summary.total_counts)} icon={ClipboardList} color="blue" />
        <StatCard label="Validés" value={formatNumber(summary.validated_counts)} icon={CheckCircle} color="green" />
        <StatCard label="En cours" value={formatNumber(summary.pending_counts)} icon={Clock} color="orange" />
        <StatCard label="Articles" value={formatNumber(totalItemsCounted)} icon={Package} color="purple" />
      </div>

      {recentCounts.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Derniers inventaires</h3>
          <div className="space-y-2">
            {recentCounts.map((count: any) => (
              <Link key={count.id} href={`/apps/${slug}/inventory/stock-counts/${count.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{count.count_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {count.count_date ? new Date(count.count_date).toLocaleDateString("fr-FR") : "Non planifié"}
                      {count.warehouse_name && ` • ${count.warehouse_name}`}
                    </p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full font-medium",
                    count.status === "validated" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    count.status === "completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    count.status === "in_progress" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                    "bg-muted"
                  )}>
                    {count.status_display || count.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ==========================================
// Stat Card Component
// ==========================================
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const bgColors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30",
    green: "bg-green-100 dark:bg-green-900/30",
    orange: "bg-orange-100 dark:bg-orange-900/30",
    red: "bg-red-100 dark:bg-red-900/30",
    purple: "bg-purple-100 dark:bg-purple-900/30",
  };
  const textColors: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600",
    red: "text-red-600",
    purple: "text-purple-600",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColors[color])}>
          <Icon className={cn("h-5 w-5", textColors[color])} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold truncate">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}
