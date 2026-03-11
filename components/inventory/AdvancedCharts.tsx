"use client";

import { Card } from "@/components/ui";
import type {
  ABCDistribution,
  CategoryPerformance,
  InventoryStats,
  SalesTrendItem,
} from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Info,
  Minus,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Can } from "../apps/common";

// Hook to detect dark mode
const useIsDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
};

// Professional, sober color palette - dark mode compatible
const getChartColors = (isDark: boolean) => ({
  // Bars/Primary elements - muted blues
  accent: isDark ? "hsl(215, 25%, 65%)" : "hsl(215, 20%, 45%)",

  // Success/profit - muted greens
  success: isDark ? "hsl(142, 45%, 55%)" : "hsl(142, 40%, 42%)",

  // Warning - muted amber
  warning: isDark ? "hsl(38, 60%, 60%)" : "hsl(38, 65%, 50%)",

  // Danger - muted red
  danger: isDark ? "hsl(0, 60%, 65%)" : "hsl(0, 65%, 55%)",

  // Primary bars - neutral slate with good contrast
  primary: isDark ? "hsl(215, 20%, 60%)" : "hsl(215, 18%, 35%)",

  // Secondary elements
  secondary: isDark ? "hsl(215, 14%, 60%)" : "hsl(215, 14%, 50%)",

  // Grid lines - very subtle
  grid: isDark ? "hsl(217, 20%, 20%)" : "hsl(214, 20%, 88%)",

  // Text - better contrast
  text: isDark ? "hsl(210, 20%, 75%)" : "hsl(222, 20%, 35%)",

  // Muted bar color - for less important data
  muted: isDark ? "hsl(215, 15%, 45%)" : "hsl(215, 15%, 55%)",
});

interface MetricCardProps {
  label: string;
  value: string | number;
  previousValue?: string | number;
  variation?: number | null;
  subtitle?: string;
  compact?: boolean;
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  previousValue,
  variation,
  subtitle,
  compact = false,
  loading = false,
}: MetricCardProps) {
  const hasPositiveVariation = variation !== null && variation !== undefined && variation > 0;
  const hasNegativeVariation = variation !== null && variation !== undefined && variation < 0;
  const hasNoVariation = variation !== null && variation !== undefined && variation === 0;

  if (loading) {
    return (
      <div className={cn("bg-card border rounded-lg", compact ? "p-4" : "p-5")}>
        <div className="animate-pulse">
          <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
          {!compact && <div className="h-3 bg-muted rounded w-1/3"></div>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card border rounded-lg", compact ? "p-4" : "p-5")}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {label}
          </p>
          <p className={cn("font-semibold text-foreground", compact ? "text-2xl" : "text-3xl")}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {variation !== null && variation !== undefined && (
          <div className="flex flex-col items-end ml-2">
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                hasPositiveVariation && "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-500",
                hasNegativeVariation && "bg-red-50/80 text-red-700 dark:bg-red-950/20 dark:text-red-500",
                hasNoVariation && "bg-muted/50 text-muted-foreground"
              )}
            >
              {hasPositiveVariation && <TrendingUp className="h-3 w-3" />}
              {hasNegativeVariation && <TrendingDown className="h-3 w-3" />}
              {hasNoVariation && <Minus className="h-3 w-3" />}
              <span>{Math.abs(variation).toFixed(1)}%</span>
            </div>
            {previousValue && (
              <p className="text-xs text-muted-foreground mt-1">vs {previousValue}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function MiniSparkline({ data, color, height = 32 }: MiniSparklineProps) {
  const isDark = useIsDarkMode();
  const colors = getChartColors(isDark);
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color || colors.accent}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface SalesTrendChartProps {
  data: SalesTrendItem[];
  showProfit?: boolean;
}

export function SalesTrendChart({ data, showProfit = true }: SalesTrendChartProps) {
  const isDark = useIsDarkMode();
  const colors = getChartColors(isDark);

  // Toggle states for each series
  const [showRevenue, setShowRevenue] = useState(true);
  const [showBaseExpenses, setShowBaseExpenses] = useState(true);
  const [showPurchases, setShowPurchases] = useState(true);
  const [showProfitBar, setShowProfitBar] = useState(true);

  const chartData = useMemo(() => {
    return data.slice(-12).map((item) => ({
      month: item.label,
      revenue: item.revenue,
      base_expenses: item.base_expenses || 0,
      purchases: item.purchases || 0,
      expenses: item.expenses,
      profit: item.profit,
    }));
  }, [data]);

  const barColors = {
    revenue: isDark ? "hsl(215, 20%, 58%)" : "hsl(215, 20%, 42%)",
    base_expenses: isDark ? "hsl(0, 55%, 62%)" : "hsl(0, 55%, 52%)",
    purchases: isDark ? "hsl(25, 60%, 60%)" : "hsl(25, 60%, 50%)",
    profit: isDark ? "hsl(142, 38%, 52%)" : "hsl(142, 38%, 42%)",
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Tendance sur 12 mois</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Revenus, dépenses, achats et profit</p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowRevenue(!showRevenue)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              showRevenue
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                : "bg-transparent text-muted-foreground hover:bg-muted"
            )}
          >
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: showRevenue ? barColors.revenue : "currentColor", opacity: showRevenue ? 1 : 0.3 }}
            />
            <span>Revenus</span>
          </button>

          <button
            onClick={() => setShowBaseExpenses(!showBaseExpenses)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              showBaseExpenses
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                : "bg-transparent text-muted-foreground hover:bg-muted"
            )}
          >
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: showBaseExpenses ? barColors.base_expenses : "currentColor", opacity: showBaseExpenses ? 1 : 0.3 }}
            />
            <span>Dépenses</span>
          </button>

          <button
            onClick={() => setShowPurchases(!showPurchases)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              showPurchases
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                : "bg-transparent text-muted-foreground hover:bg-muted"
            )}
          >
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: showPurchases ? barColors.purchases : "currentColor", opacity: showPurchases ? 1 : 0.3 }}
            />
            <span>Achats</span>
          </button>

          <button
            onClick={() => setShowProfitBar(!showProfitBar)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              showProfitBar
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                : "bg-transparent text-muted-foreground hover:bg-muted"
            )}
          >
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: showProfitBar ? barColors.profit : "currentColor", opacity: showProfitBar ? 1 : 0.3 }}
            />
            <span>Profit</span>
          </button>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: colors.text }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: colors.text }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(148, 163, 184, 0.2)" : "1px solid rgba(15, 23, 42, 0.1)",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                padding: "10px 14px",
                boxShadow: isDark
                  ? "0 4px 16px rgba(0, 0, 0, 0.4)"
                  : "0 2px 12px rgba(0, 0, 0, 0.08)",
                color: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
              }}
              labelStyle={{
                color: isDark ? "hsl(210, 40%, 90%)" : "hsl(222, 47%, 20%)",
                fontWeight: "600",
                marginBottom: "6px",
                fontSize: "12px",
              }}
              itemStyle={{
                color: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
                padding: "2px 0",
              }}
              formatter={(value: number) => formatCurrency(value)}
            />

            {showRevenue && (
              <Bar
                dataKey="revenue"
                fill={barColors.revenue}
                radius={[4, 4, 0, 0]}
                barSize={18}
                opacity={0.92}
                name="Revenus"
              />
            )}

            {showBaseExpenses && (
              <Bar
                dataKey="base_expenses"
                fill={barColors.base_expenses}
                radius={[4, 4, 0, 0]}
                barSize={18}
                opacity={0.92}
                name="Dépenses"
              />
            )}

            {showPurchases && (
              <Bar
                dataKey="purchases"
                fill={barColors.purchases}
                radius={[4, 4, 0, 0]}
                barSize={18}
                opacity={0.92}
                name="Achats fournisseurs"
              />
            )}

            {showProfitBar && (
              <Bar
                dataKey="profit"
                fill={barColors.profit}
                radius={[4, 4, 0, 0]}
                barSize={18}
                opacity={0.92}
                name="Profit"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface CategoryPerformanceChartProps {
  data: CategoryPerformance[];
  metric: "revenue" | "turnover";
}

export function CategoryPerformanceChart({ data, metric }: CategoryPerformanceChartProps) {
  const isDark = useIsDarkMode();
  const colors = getChartColors(isDark);

  const chartData = useMemo(() => {
    return data.slice(0, 8).map((item) => ({
      name: item.category_name.length > 20
        ? item.category_name.substring(0, 20) + "..."
        : item.category_name,
      fullName: item.category_name,
      value: metric === "revenue" ? item.revenue_90d : item.turnover_ratio,
      products: item.product_count,
    }));
  }, [data, metric]);

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {metric === "revenue" ? "Revenus par catégorie" : "Rotation par catégorie"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {metric === "revenue" ? "90 derniers jours" : "Taux de rotation annualisé"}
        </p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: colors.text }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (metric === "revenue") {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                }
                return value.toString();
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: colors.text }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(148, 163, 184, 0.2)" : "1px solid rgba(15, 23, 42, 0.1)",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                padding: "10px 14px",
                boxShadow: isDark
                  ? "0 4px 16px rgba(0, 0, 0, 0.4)"
                  : "0 2px 12px rgba(0, 0, 0, 0.08)",
                color: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
              }}
              labelStyle={{
                color: isDark ? "hsl(210, 40%, 90%)" : "hsl(222, 47%, 20%)",
                fontWeight: "600",
                marginBottom: "6px",
                fontSize: "12px",
              }}
              itemStyle={{
                color: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
                padding: "2px 0",
              }}
              formatter={(value: number) =>
                metric === "revenue" ? formatCurrency(value) : `${value.toFixed(2)}x`
              }
              labelFormatter={(label) => chartData.find((d) => d.name === label)?.fullName || label}
            />
            <Bar
              dataKey="value"
              fill={isDark ? "hsl(215, 18%, 55%)" : "hsl(215, 18%, 40%)"}
              radius={[0, 4, 4, 0]}
              barSize={20}
              opacity={0.92}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

interface ABCAnalysisChartProps {
  distribution: ABCDistribution;
  totalProducts: number;
}

export function ABCAnalysisChart({ distribution, totalProducts }: ABCAnalysisChartProps) {
  const isDark = useIsDarkMode();
  const colors = getChartColors(isDark);

  const chartData = [
    {
      name: "A (Top 80%)",
      value: distribution.A,
      color: isDark ? "hsl(142, 35%, 52%)" : "hsl(142, 35%, 42%)"
    },
    {
      name: "B (80-95%)",
      value: distribution.B,
      color: isDark ? "hsl(215, 20%, 55%)" : "hsl(215, 20%, 45%)"
    },
    {
      name: "C (95-100%)",
      value: distribution.C,
      color: isDark ? "hsl(215, 12%, 48%)" : "hsl(215, 12%, 55%)"
    },
  ];

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Analyse ABC</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Classification Pareto</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>Par revenu (90j)</span>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <div className="h-[200px] w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: isDark ? "1px solid rgba(148, 163, 184, 0.2)" : "1px solid rgba(15, 23, 42, 0.1)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "500",
                  padding: "10px 14px",
                  boxShadow: isDark
                    ? "0 4px 16px rgba(0, 0, 0, 0.4)"
                    : "0 2px 12px rgba(0, 0, 0, 0.08)",
                  color: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
                }}
                labelStyle={{
                  color: isDark ? "hsl(210, 40%, 90%)" : "hsl(222, 47%, 20%)",
                  fontWeight: "600",
                  marginBottom: "6px",
                  fontSize: "12px",
                }}
                itemStyle={{
                  color: isDark ? "hsl(210, 40%, 98%)" : "hsl(222, 47%, 11%)",
                  padding: "2px 0",
                }}
                formatter={(value: number) =>
                  `${value} produits (${((value / totalProducts) * 100).toFixed(1)}%)`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="ml-6 space-y-3">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              ></div>
              <div>
                <p className="text-xs font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.value} produits
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

interface StockHealthGaugeProps {
  current: number;
  total: number;
  lowStock: number;
  outOfStock: number;
}

export function StockHealthGauge({ current, total, lowStock, outOfStock }: StockHealthGaugeProps) {
  const isDark = useIsDarkMode();
  const colors = getChartColors(isDark);

  const healthyCount = total - lowStock - outOfStock;
  const healthPercent = total > 0 ? Math.round((healthyCount / total) * 100) : 0;

  const getHealthColor = (percent: number) => {
    if (percent >= 80) return isDark ? "hsl(142, 35%, 55%)" : "hsl(142, 35%, 42%)";
    if (percent >= 50) return isDark ? "hsl(38, 50%, 60%)" : "hsl(38, 50%, 48%)";
    return isDark ? "hsl(0, 50%, 62%)" : "hsl(0, 50%, 52%)";
  };

  const healthColor = getHealthColor(healthPercent);

  return (
  <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK}>
      <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Santé du stock</h3>
        <p className="text-xs text-muted-foreground mt-0.5">État global des produits</p>
      </div>
      <div className="flex flex-col items-center py-4">
        {/* Gauge SVG */}
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={colors.grid}
              strokeWidth="8"
              fill="transparent"
              className="opacity-30"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={healthColor}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${(healthPercent / 100) * 352} 352`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{healthPercent}%</span>
            <span className="text-xs text-muted-foreground">en bonne santé</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-6 grid grid-cols-3 gap-6 w-full">
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground">{healthyCount}</p>
            <p className="text-xs text-muted-foreground">OK</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-amber-700 dark:text-amber-500">{lowStock}</p>
            <p className="text-xs text-muted-foreground">Stock bas</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-red-700 dark:text-red-500">{outOfStock}</p>
            <p className="text-xs text-muted-foreground">Rupture</p>
          </div>
        </div>
      </div>
    </Card>
  </Can>
  );
}

interface KeyMetricsGridProps {
  stats: InventoryStats;
}

export function KeyMetricsGrid({ stats }: KeyMetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK}>
        <MetricCard
          label="Rotation du stock"
          value={`${stats.stock_turnover_ratio.toFixed(1)}x`}
          subtitle={`${stats.days_of_inventory} jours de couverture`}
        />
      </Can>
      <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES}>
        <MetricCard
          label="Revenus (30j)"
          value={formatCurrency(stats.revenue_30d)}
          previousValue={formatCurrency(stats.revenue_prev_30d)}
          variation={stats.revenue_variation}
          subtitle={`${stats.sales_count_30d} ventes`}
        />
      </Can>
      <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_REPORTS}>
        <MetricCard
          label="Marge nette"
          value={`${stats.margin_percent.toFixed(1)}%`}
          subtitle={`Profit: ${formatCurrency(stats.net_profit_30d)}`}
        />
      </Can>
      <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES}>
        <MetricCard
          label="Créances"
          value={formatCurrency(stats.total_receivables)}
          subtitle={`${stats.overdue_count} en retard`}
        />
      </Can>
    </div>
  );
}
