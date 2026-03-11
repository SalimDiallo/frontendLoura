"use client";

import {
  ABCAnalysisChart,
  CreditsReportChart,
  FinancialAnalysisChart,
  SalesPerformanceChart,
} from "@/components/inventory/AdvancedReportsCharts";
import { Button, Card } from "@/components/ui";
import {
  downloadMovementsExport,
  downloadProductsCatalogPdf,
  downloadStockListExport,
  downloadStockReportPdf,
  getABCAnalysis,
  getCreditsReport,
  getFinancialAnalysis,
  getInventoryOverview,
  getLowRotationProducts,
  getMovementHistory,
  getSalesPerformance,
  getStockByCategory,
  getStockByWarehouse,
  getStockCountsSummary,
  getTopProducts,
} from "@/lib/services/inventory";
import type {
  ABCAnalysisResponse,
  CategoryStockReport,
  CreditsReportResponse,
  FinancialAnalysisResponse,
  InventoryStats,
  LowRotationProductsResponse,
  MovementHistoryResponse,
  SalesPerformanceResponse,
  StockCountsSummaryResponse,
  TopProduct,
  WarehouseStockReport,
} from "@/lib/types/inventory";
import { cn, formatCurrency, formatCompactCurrency, formatNumber } from "@/lib/utils";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  Clock,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Package,
  RefreshCw,
  RotateCw,
  Tags,
  TrendingUp,
  Warehouse
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ReportTab = "overview" | "warehouses" | "categories" | "movements" | "rotation" | "counts" | "financial" | "abc" | "credits" | "sales";

const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Theme-aware tooltip styles
const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--popover-foreground))",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  padding: "8px 12px",
};

// Professional neutral palette
const CHART_PALETTE = [
  "hsl(215, 16%, 57%)",  // slate
  "hsl(217, 91%, 60%)",  // blue
  "hsl(152, 69%, 46%)",  // green
  "hsl(32, 95%, 52%)",   // orange
  "hsl(262, 83%, 58%)",  // purple
  "hsl(189, 94%, 43%)",  // cyan
  "hsl(340, 82%, 52%)",  // pink
  "hsl(45, 93%, 47%)",   // yellow
];

// Compact formatter for chart axes
function compactCurrency(value: any): string {
  const num = safeNumber(value);
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (num / 1_000).toFixed(0) + "K";
  return num.toFixed(0);
}

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

  const [financialAnalysis, setFinancialAnalysis] = useState<FinancialAnalysisResponse | null>(null);
  const [abcAnalysis, setABCAnalysis] = useState<ABCAnalysisResponse | null>(null);
  const [creditsReport, setCreditsReport] = useState<CreditsReportResponse | null>(null);
  const [salesPerformance, setSalesPerformance] = useState<SalesPerformanceResponse | null>(null);

  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [loadingABC, setLoadingABC] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);

  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [movementDays, setMovementDays] = useState(30);
  const [rotationDays, setRotationDays] = useState(90);
  const [financialDays, setFinancialDays] = useState(30);
  const [abcDays, setABCDays] = useState(90);
  const [salesPerfDays, setSalesPerfDays] = useState(30);

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

  const loadFinancialAnalysis = useCallback(async (forceReload = false) => {
    if (!financialAnalysis || forceReload) {
      try {
        setLoadingFinancial(true);
        const data = await getFinancialAnalysis(financialDays);
        setFinancialAnalysis(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFinancial(false);
      }
    }
  }, [financialAnalysis, financialDays]);

  const loadABCAnalysis = useCallback(async (forceReload = false) => {
    if (!abcAnalysis || forceReload) {
      try {
        setLoadingABC(true);
        const data = await getABCAnalysis(abcDays);
        setABCAnalysis(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingABC(false);
      }
    }
  }, [abcAnalysis, abcDays]);

  const loadCreditsReport = useCallback(async () => {
    if (!creditsReport) {
      try {
        setLoadingCredits(true);
        const data = await getCreditsReport();
        setCreditsReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCredits(false);
      }
    }
  }, [creditsReport]);

  const loadSalesPerformance = useCallback(async (forceReload = false) => {
    if (!salesPerformance || forceReload) {
      try {
        setLoadingSales(true);
        const data = await getSalesPerformance(salesPerfDays);
        setSalesPerformance(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSales(false);
      }
    }
  }, [salesPerformance, salesPerfDays]);

  const handleFinancialDaysChange = async (newDays: number) => {
    setFinancialDays(newDays);
    setLoadingFinancial(true);
    try {
      const data = await getFinancialAnalysis(newDays);
      setFinancialAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFinancial(false);
    }
  };

  const handleABCDaysChange = async (newDays: number) => {
    setABCDays(newDays);
    setLoadingABC(true);
    try {
      const data = await getABCAnalysis(newDays);
      setABCAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingABC(false);
    }
  };

  const handleSalesPerfDaysChange = async (newDays: number) => {
    setSalesPerfDays(newDays);
    setLoadingSales(true);
    try {
      const data = await getSalesPerformance(newDays);
      setSalesPerformance(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'financial') loadFinancialAnalysis();
    if (activeTab === 'abc') loadABCAnalysis();
    if (activeTab === 'credits') loadCreditsReport();
    if (activeTab === 'sales') loadSalesPerformance();
  }, [activeTab, loadFinancialAnalysis, loadABCAnalysis, loadCreditsReport, loadSalesPerformance]);

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

  const tabs = [
    { id: "overview" as ReportTab, label: "Vue d'ensemble", icon: BarChart3 },
    { id: "financial" as ReportTab, label: "Analyse Financière", icon: DollarSign },
    { id: "sales" as ReportTab, label: "Performance Ventes", icon: TrendingUp },
    { id: "abc" as ReportTab, label: "Analyse ABC", icon: BarChart3 },
    { id: "credits" as ReportTab, label: "Crédits", icon: CheckCircle },
    { id: "warehouses" as ReportTab, label: "Entrepôts", icon: Warehouse },
    { id: "categories" as ReportTab, label: "Catégories", icon: Tags },
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
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-foreground text-background px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Rapports</h1>
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
                <div className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-3 py-1.5">PDF</p>
                  <button 
                    onClick={() => handleExport(downloadProductsCatalogPdf, "catalogue")} 
                    disabled={!!exporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    Catalogue produits
                  </button>
                  <button 
                    onClick={() => handleExport(downloadStockReportPdf, "stock")} 
                    disabled={!!exporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    Rapport de stock
                  </button>
                  <div className="border-t my-1" />
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-3 py-1.5">Excel</p>
                  <button 
                    onClick={() => handleExport(downloadStockListExport, "liste")} 
                    disabled={!!exporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Liste des stocks
                  </button>
                  <button 
                    onClick={() => handleExport(() => downloadMovementsExport(movementDays), "mouvements")} 
                    disabled={!!exporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50 transition-colors"
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

      {/* Tabs - clean underline style */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap relative",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
              )}
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
            slug={slug}
          />
        )}
        {activeTab === "financial" && (
          <>
            {loadingFinancial && <TabLoader text="Chargement de l'analyse financière..." />}
            {!loadingFinancial && (
              <FinancialAnalysisChart
                data={financialAnalysis}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                days={financialDays}
                onDaysChange={handleFinancialDaysChange}
                loading={loadingFinancial}
              />
            )}
          </>
        )}
        {activeTab === "abc" && (
          <>
            {loadingABC && <TabLoader text="Chargement de l'analyse ABC..." />}
            {!loadingABC && (
              <ABCAnalysisChart
                data={abcAnalysis}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                days={abcDays}
                onDaysChange={handleABCDaysChange}
                loading={loadingABC}
              />
            )}
          </>
        )}
        {activeTab === "credits" && (
          <>
            {loadingCredits && <TabLoader text="Chargement du rapport crédits..." />}
            {!loadingCredits && (
              <CreditsReportChart
                data={creditsReport}
                formatCurrency={formatCurrency}
              />
            )}
          </>
        )}
        {activeTab === "sales" && (
          <>
            {loadingSales && <TabLoader text="Chargement de la performance ventes..." />}
            {!loadingSales && (
              <SalesPerformanceChart
                data={salesPerformance}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                days={salesPerfDays}
                onDaysChange={handleSalesPerfDaysChange}
                loading={loadingSales}
              />
            )}
          </>
        )}
        {activeTab === "warehouses" && (
          <WarehousesTab 
            data={warehouseStock} 
            formatCurrency={formatCurrency} 
            formatNumber={formatNumber} 
          />
        )}
        {activeTab === "categories" && (
          <CategoriesTab
            data={categoryStock}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
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
// Tab Loader
// ==========================================
function TabLoader({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

// ==========================================
// Overview Tab
// ==========================================
function OverviewTab({ stats, topProducts, categoryStock, formatCurrency, formatNumber, slug }: any) {
  const totalProducts = safeNumber(stats.total_products);
  const lowStockCount = safeNumber(stats.low_stock_count);
  const stockHealthPercent = totalProducts > 0 ? Math.round(((totalProducts - lowStockCount) / totalProducts) * 100) : 100;

  const topProductsData = topProducts.slice(0, 5).map((p: any) => ({
    name: p.name?.length > 15 ? p.name.substring(0, 15) + "…" : p.name,
    value: safeNumber(p.stock_value),
  }));

  const categoryData = categoryStock.slice(0, 6).map((c: any) => ({
    name: c.name || "Sans catégorie",
    value: safeNumber(c.total_value),
  }));

  const totalCatValue = categoryData.reduce((acc: number, c: any) => acc + c.value, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          icon={Package}
          label="Produits"
          value={formatNumber(stats.total_products)}
        />
        <KPICard
          label="Valeur stock"
          value={compactCurrency(stats.total_stock_value)}
          color="blue"
        />
        <KPICard
          label="Stock faible"
          value={formatNumber(stats.low_stock_count)}
          color={stats.low_stock_count > 0 ? "orange" : "green"}
        />
        <KPICard
          label="Alertes"
          value={formatNumber(stats.active_alerts)}
          color={stats.active_alerts > 0 ? "red" : "green"}
        />
        <KPICard
          label="Santé"
          value={`${stockHealthPercent}%`}
          color={stockHealthPercent >= 80 ? "green" : "orange"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top Products Chart */}
        <Card className="p-5 border bg-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold">Top 5 produits par valeur</h3>
            <Link href={`/apps/${slug}/inventory/products`} className="text-xs text-primary hover:underline font-medium">
              Voir tout
            </Link>
          </div>
          {topProductsData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" barSize={20} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={compactCurrency}
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(217, 91%, 60%)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Aucune donnée
            </div>
          )}
        </Card>

        {/* Categories Donut */}
        <Card className="p-5 border bg-card">
          <h3 className="text-sm font-semibold mb-5">Répartition par catégorie</h3>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-1/2 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={75}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {categoryData.map((_: any, index: number) => (
                        <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {categoryData.slice(0, 5).map((cat: any, i: number) => {
                  const pct = totalCatValue > 0 ? ((cat.value / totalCatValue) * 100).toFixed(0) : "0";
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}
                      />
                      <span className="truncate text-sm text-muted-foreground flex-1">{cat.name}</span>
                      <span className="text-xs font-medium tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
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
function WarehousesTab({ data, formatCurrency, formatNumber }: any) {
  const chartData = data.map((wh: any) => ({
    name: wh.name?.length > 10 ? wh.name.substring(0, 10) + "…" : wh.name,
    value: safeNumber(wh.total_value),
  }));

  const totalValue = data.reduce((acc: number, wh: any) => acc + safeNumber(wh.total_value), 0);

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Warehouse className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Aucun entrepôt</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card className="p-5 border bg-card">
        <h3 className="text-sm font-semibold mb-5">Valeur par entrepôt</h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                fontSize={11}
                axisLine={false}
                tickLine={false}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tickFormatter={compactCurrency}
                fontSize={11}
                axisLine={false}
                tickLine={false}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={tooltipStyle}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
              />
              <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((wh: any, idx: number) => {
          const pct = totalValue > 0 ? ((safeNumber(wh.total_value) / totalValue) * 100) : 0;
          return (
            <Card key={wh.id} className="p-4 border bg-card relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-r"
                style={{ backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }}
              />
              <div className="pl-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold text-sm truncate">{wh.name}</h4>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valeur</span>
                    <span className="font-medium tabular-nums">{formatCurrency(wh.total_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produits</span>
                    <span className="tabular-nums">{safeNumber(wh.product_count)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantité</span>
                    <span className="tabular-nums">{formatNumber(wh.total_quantity)}</span>
                  </div>
                  {safeNumber(wh.low_stock_count) > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>Stock bas</span>
                      <span className="font-medium tabular-nums">{safeNumber(wh.low_stock_count)}</span>
                    </div>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
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
      <div className="text-center py-16 text-muted-foreground">
        <Tags className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Aucune catégorie</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data.length} catégories</p>
        <p className="text-sm font-semibold tabular-nums">Total: {formatCurrency(totalValue)}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Pie Chart */}
        <Card className="p-5 border bg-card">
          <h3 className="text-sm font-semibold mb-5">Répartition de la valeur</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                >
                  {chartData.map((_: any, index: number) => (
                    <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* List */}
        <Card className="p-5 border bg-card">
          <h3 className="text-sm font-semibold mb-4">Détails</h3>
          <div className="space-y-2.5 max-h-[270px] overflow-y-auto">
            {chartData.map((cat: any, i: number) => {
              const percent = totalValue > 0 ? (cat.value / totalValue) * 100 : 0;
              return (
                <div key={i} className="p-3 bg-muted/30 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}
                    />
                    <span className="font-medium text-sm flex-1 truncate">{cat.name}</span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">{percent.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{cat.products} produits • {formatNumber(cat.quantity)} unités</span>
                    <span className="font-medium text-foreground tabular-nums">{formatCurrency(cat.value)}</span>
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
// Counts Tab
// ==========================================
function CountsTab({ data, formatNumber, slug }: any) {
  const recentCounts = data?.stock_counts || [];
  const summary = data?.summary || {};
  const totalItemsCounted = recentCounts.reduce((acc: number, c: any) => acc + safeNumber(c.item_count), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Historique des inventaires</p>
        <Link href={`/apps/${slug}/inventory/stock-counts/new`}>
          <Button size="sm" className="h-8">
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Nouvel inventaire
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total" value={formatNumber(summary.total_counts)} icon={ClipboardList} />
        <KPICard label="Validés" value={formatNumber(summary.validated_counts)} icon={CheckCircle} color="green" />
        <KPICard
          label="En cours"
          value={formatNumber(summary.pending_counts)}
          icon={Clock}
          color={summary.pending_counts > 0 ? "orange" : undefined}
        />
        <KPICard label="Articles" value={formatNumber(totalItemsCounted)} icon={Package} />
      </div>

      {recentCounts.length > 0 && (
        <Card className="border bg-card divide-y divide-border">
          {recentCounts.map((count: any) => (
            <Link 
              key={count.id} 
              href={`/apps/${slug}/inventory/stock-counts/${count.id}`}
              className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
            >
              <div>
                <p className="font-medium text-sm">{count.count_number}</p>
                <p className="text-xs text-muted-foreground">
                  {count.count_date ? new Date(count.count_date).toLocaleDateString("fr-FR") : "Non planifié"}
                  {count.warehouse_name && ` · ${count.warehouse_name}`}
                </p>
              </div>
              <span className={cn(
                "px-2.5 py-0.5 text-[10px] rounded-full font-medium",
                count.status === "validated" 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                  : count.status === "completed" 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                    : count.status === "in_progress" 
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                      : "bg-muted text-muted-foreground"
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
// KPI Card Component
// ==========================================
function KPICard({ 
  label, 
  value, 
  icon: Icon, 
  color,
}: { 
  label: string; 
  value: string; 
  icon?: any;
  color?: "green" | "orange" | "red" | "blue";
}) {
  const colorClasses = {
    green: {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      icon: "text-emerald-600 dark:text-emerald-400",
    },
    orange: {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      icon: "text-amber-600 dark:text-amber-400",
    },
    red: {
      text: "text-red-500 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
      icon: "text-red-500 dark:text-red-400",
    },
    blue: {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      icon: "text-blue-600 dark:text-blue-400",
    },
  };

  const c = color ? colorClasses[color] : null;

  return (
    <Card className="p-3.5 border bg-card">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            c?.bg || "bg-muted"
          )}>
            <Icon className={cn("h-4 w-4", c?.icon || "text-muted-foreground")} />
          </div>
        )}
        <div className="min-w-0">
          <p className={cn(
            "text-base font-bold truncate tabular-nums",
            c?.text || "text-foreground"
          )}>
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}
