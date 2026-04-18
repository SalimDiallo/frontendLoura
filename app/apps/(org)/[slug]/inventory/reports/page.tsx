"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { getSalesAnalytics } from "@/lib/services/inventory/stats.service";
import type {
  DailySalesData,
  MonthlySalesData,
  SalesAnalyticsResponse
} from "@/lib/types/inventory";
import { cn, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  Clock,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ==========================================
// Sober color system — essential colors only
// ==========================================

const COLORS = {
  primary: "hsl(var(--primary))",
  primaryMuted: "hsl(var(--primary) / 0.15)",
  primarySubtle: "hsl(var(--primary) / 0.08)",
  chart: {
    hourly: "#6366f1",
    daily: "#3b82f6",
    monthly: "#10b981",
  },
  rank: ["#f59e0b", "#94a3b8", "#cd7f32"],
};

// ==========================================
// Custom Tooltip — clean & minimal
// ==========================================

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel = "Moy. CA",
  subLabel,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: Record<string, unknown> }>;
  label?: string;
  valueLabel?: string;
  subLabel?: (data: Record<string, unknown>) => string | null;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-popover-foreground">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {valueLabel}: <span className="font-medium text-foreground">{formatCurrency(data.value)}</span>
      </p>
      {subLabel && (
        <p className="text-xs text-muted-foreground">
          {subLabel(data.payload)}
        </p>
      )}
    </div>
  );
}

// ==========================================
// KPI Summary — using neutral design
// ==========================================

function SummaryKPIs({ data }: { data: SalesAnalyticsResponse }) {
  const { hourly_analysis, daily_analysis, monthly_analysis, total_revenue } = data;

  const kpis = [
    {
      label: "CA Total",
      value: formatCompactCurrency(total_revenue),
      icon: TrendingUp,
    },
    {
      label: "Heure de pointe",
      value: hourly_analysis.peak_hour?.label ?? "—",
      sub: hourly_analysis.peak_hour
        ? `${formatCompactCurrency(hourly_analysis.peak_hour.avg_revenue)}/sem`
        : undefined,
      icon: Clock,
    },
    {
      label: "Meilleur jour",
      value: daily_analysis.peak_day?.day_name ?? "—",
      sub: daily_analysis.peak_day
        ? `${formatCompactCurrency(daily_analysis.peak_day.avg_revenue)}/sem`
        : undefined,
      icon: Calendar,
    },
    {
      label: "Meilleur mois",
      value: monthly_analysis.peak_month?.month_name ?? "—",
      sub: monthly_analysis.peak_month
        ? `${formatCompactCurrency(monthly_analysis.peak_month.avg_revenue)}/an`
        : undefined,
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map(({ label, value, sub, icon: KIcon }) => (
        <Card key={label} className="hover:-translate-y-0 cursor-default">
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <KIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{label}</p>
                <p className="text-lg font-bold tracking-tight truncate">{value}</p>
                {sub && (
                  <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ==========================================
// Shared chart axis config
// ==========================================

const axisProps = {
  tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
  axisLine: false,
  tickLine: false,
} as const;

// ==========================================
// Hourly Sales Chart
// ==========================================

function HourlySalesChart({ data }: { data: SalesAnalyticsResponse }) {
  const { hourly_analysis } = data;
  const { data: hourlyData, peak_hour, weeks_analyzed } = hourly_analysis;

  const filteredData = hourlyData.filter((h) => h.hour >= 6 && h.hour <= 23);
  const maxRevenue = Math.max(...filteredData.map((h) => h.avg_revenue));

  return (
    <Card className="hover:-translate-y-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-[18px] h-[18px] text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Analyse Horaire</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Moy. hebdo. sur {weeks_analyzed} semaines
              </CardDescription>
            </div>
          </div>
          {peak_hour && peak_hour.avg_revenue > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-muted-foreground">Pic</p>
              <p className="text-sm font-semibold">{peak_hour.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatCompactCurrency(peak_hour.avg_revenue)}/sem
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} barCategoryGap="15%">
              <defs>
                <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.chart.hourly} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={COLORS.chart.hourly} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.4}
                vertical={false}
              />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis
                {...axisProps}
                tickFormatter={(v: number) => formatCompactCurrency(v)}
                width={72}
              />
              <Tooltip
                content={<ChartTooltip valueLabel="Moy. CA" />}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
              />
              <Bar dataKey="avg_revenue" radius={[4, 4, 0, 0]} maxBarSize={24}>
                {filteredData.map((entry, i) => (
                  <Cell
                    key={`h-${i}`}
                    fill={COLORS.chart.hourly}
                    fillOpacity={entry.avg_revenue === maxRevenue ? 1 : 0.55}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// Daily Sales Chart
// ==========================================

function DailySalesChart({ data }: { data: SalesAnalyticsResponse }) {
  const { daily_analysis } = data;
  const { data: dailyData, peak_day, weeks_analyzed } = daily_analysis;

  const maxRevenue = Math.max(...dailyData.map((d) => d.avg_revenue));
  const ranked = [...dailyData].sort((a, b) => b.avg_revenue - a.avg_revenue);

  return (
    <Card className="hover:-translate-y-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-[18px] h-[18px] text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Analyse Journalière</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Moy. sur {Math.round(weeks_analyzed)} semaines
              </CardDescription>
            </div>
          </div>
          {peak_day && peak_day.avg_revenue > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-muted-foreground">Meilleur jour</p>
              <p className="text-sm font-semibold">{peak_day.day_name}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} barCategoryGap="18%">
              <defs>
                <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.chart.daily} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={COLORS.chart.daily} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.4}
                vertical={false}
              />
              <XAxis dataKey="day_name" {...axisProps} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                {...axisProps}
                tickFormatter={(v: number) => formatCompactCurrency(v)}
                width={72}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    valueLabel="Moy. CA"
                    subLabel={(d) =>
                      `~${(d as unknown as DailySalesData).avg_count?.toFixed(1) ?? "?"} ventes/sem`
                    }
                  />
                }
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
              />
              <Bar dataKey="avg_revenue" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {dailyData.map((entry, i) => (
                  <Cell
                    key={`d-${i}`}
                    fill={COLORS.chart.daily}
                    fillOpacity={entry.avg_revenue === maxRevenue ? 1 : 0.55}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Clean ranking */}
        <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
          {ranked.slice(0, 3).map((day, i) => {
            const pct = maxRevenue > 0 ? (day.avg_revenue / maxRevenue) * 100 : 0;
            return (
              <div key={day.day_name} className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: COLORS.rank[i] }}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium w-20 truncate">{day.day_name}</span>
                <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: COLORS.chart.daily,
                      opacity: i === 0 ? 1 : 0.6,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-24 text-right tabular-nums">
                  {formatCompactCurrency(day.avg_revenue)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// Monthly Sales Chart
// ==========================================

function MonthlySalesChart({ data }: { data: SalesAnalyticsResponse }) {
  const { monthly_analysis } = data;
  const { data: monthlyData, peak_month, years_analyzed } = monthly_analysis;

  const maxRev = Math.max(...monthlyData.map((m) => m.avg_revenue));

  return (
    <Card className="hover:-translate-y-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-[18px] h-[18px] text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Analyse Mensuelle</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Moy. annuelle sur {years_analyzed} an{years_analyzed > 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
          {peak_month && peak_month.avg_revenue > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-muted-foreground">Meilleur mois</p>
              <p className="text-sm font-semibold">{peak_month.month_name}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.chart.monthly} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={COLORS.chart.monthly} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.4}
                vertical={false}
              />
              <XAxis dataKey="month_short" {...axisProps} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                {...axisProps}
                tickFormatter={(v: number) => formatCompactCurrency(v)}
                width={72}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    valueLabel="Moy. CA"
                    subLabel={(d) =>
                      `~${(d as unknown as MonthlySalesData).avg_count?.toFixed(1) ?? "?"} ventes/an`
                    }
                  />
                }
                cursor={{ stroke: "hsl(var(--border))" }}
              />
              <Area
                type="monotone"
                dataKey="avg_revenue"
                stroke={COLORS.chart.monthly}
                strokeWidth={2.5}
                fill="url(#monthlyGrad)"
                dot={{
                  r: 3.5,
                  fill: COLORS.chart.monthly,
                  strokeWidth: 2,
                  stroke: "hsl(var(--card))",
                }}
                activeDot={{
                  r: 5,
                  fill: COLORS.chart.monthly,
                  strokeWidth: 2,
                  stroke: "hsl(var(--card))",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mini heatmap grid */}
        <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {monthlyData.map((month) => {
            const intensity = maxRev > 0 ? month.avg_revenue / maxRev : 0;
            return (
              <div
                key={month.month}
                className="flex flex-col items-center p-1.5 rounded-md text-center transition-colors"
                style={{
                  backgroundColor: `color-mix(in srgb, ${COLORS.chart.monthly} ${Math.round(intensity * 20 + 4)}%, transparent)`,
                }}
              >
                <span className="text-[10px] font-medium text-muted-foreground leading-none">
                  {month.month_short}
                </span>
                <span className="text-[11px] font-bold mt-0.5 leading-none tabular-nums">
                  {formatCompactCurrency(month.avg_revenue)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// Main Page
// ==========================================

export default function ReportsPage() {
  const [data, setData] = useState<SalesAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const result = await getSalesAnalytics();
      setData(result);
    } catch (err) {
      console.error("Failed to load sales analytics:", err);
      setError("Impossible de charger les données. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen">
      {/* Header — clean, minimal */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Performance des Ventes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tendances horaires, journalières et mensuelles
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing || loading}
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium",
            "border border-border bg-card text-foreground",
            "hover:bg-muted/60 transition-colors duration-150",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "active:scale-[0.97]"
          )}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* Loading state — minimal spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-80 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Chargement des analyses…
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="p-6 border-destructive/30 hover:-translate-y-0">
          <div className="text-center">
            <p className="text-sm text-destructive font-medium mb-3">{error}</p>
            <button
              onClick={() => fetchData()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Réessayer
            </button>
          </div>
        </Card>
      )}

      {/* Data loaded */}
      {data && !loading && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* KPI cards */}
          <SummaryKPIs data={data} />

          {/* Hourly analysis — full width */}
          <HourlySalesChart data={data} />

          {/* Daily + Monthly — side by side on large screens */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <DailySalesChart data={data} />
            <MonthlySalesChart data={data} />
          </div>
        </div>
      )}
    </div>
  );
}
