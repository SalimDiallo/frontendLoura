"use client";

import { Card } from "@/components/ui";
import type {
  ABCAnalysisResponse,
  CreditsReportResponse,
  FinancialAnalysisResponse,
  SalesPerformanceResponse,
} from "@/lib/types/inventory";
import { cn, formatCompactCurrency } from "@/lib/utils";
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
  YAxis
} from "recharts";

// ==========================================
// Shared theme-aware tooltip style
// ==========================================
const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--popover-foreground))",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  padding: "8px 12px",
};

// Palette sobre et sobre
const COLORS = {
  blue: "hsl(217, 91%, 60%)",
  green: "hsl(152, 69%, 46%)",
  red: "hsl(0, 72%, 55%)",
  orange: "hsl(32, 95%, 52%)",
  purple: "hsl(262, 83%, 58%)",
  slate: "hsl(215, 16%, 57%)",
};

const ABC_COLORS = {
  A: COLORS.green,
  B: COLORS.orange,
  C: COLORS.slate,
};

// ==========================================
// Period selector
// ==========================================
function PeriodSelector({
  days,
  onDaysChange,
  options,
  loading,
  label,
}: {
  days: number;
  onDaysChange: (d: number) => void;
  options: number[];
  loading?: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      {label && (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
      <div className="flex gap-0.5 bg-muted/60 p-0.5 rounded-lg">
        {options.map((d) => (
          <button
            key={d}
            onClick={() => onDaysChange(d)}
            disabled={loading}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              days === d
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading && days === d ? (
              <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
            ) : (
              `${d}j`
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// KPI Card - clean and minimal
// ==========================================
function KpiCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  color?: "green" | "red" | "orange" | "blue" | "default";
}) {
  const colorClass =
    color === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : color === "red"
        ? "text-red-500 dark:text-red-400"
        : color === "orange"
          ? "text-amber-600 dark:text-amber-400"
          : color === "blue"
            ? "text-blue-600 dark:text-blue-400"
            : "text-foreground";

  return (
    <Card className="p-5 border bg-card">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={cn("text-xl font-bold tracking-tight", colorClass)}>
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
      )}
    </Card>
  );
}

// ==========================================
// Compact currency formatter for chart axes
// ==========================================
function compactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (value / 1_000).toFixed(0) + "K";
  return value.toFixed(0);
}


// ==========================================
// Graphique Analyse Financière
// ==========================================
export function FinancialAnalysisChart({
  data,
  formatCurrency,
  formatNumber,
  days,
  onDaysChange,
  loading,
}: {
  data: FinancialAnalysisResponse | null;
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
  days: number;
  onDaysChange: (days: number) => void;
  loading?: boolean;
}) {
  if (!data) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  const { summary, payment_methods, top_categories, daily_trend } = data;

  const marginData = [
    { name: "Revenus", value: summary.revenue, color: COLORS.blue },
    { name: "COGS", value: summary.cogs, color: COLORS.red },
    { name: "Dépenses", value: summary.operating_expenses, color: COLORS.orange },
    { name: "Profit Net", value: Math.abs(summary.net_profit), color: summary.net_profit >= 0 ? COLORS.green : COLORS.red },
  ];

  return (
    <div className="space-y-6">
      <PeriodSelector
        days={days}
        onDaysChange={onDaysChange}
        options={[7, 14, 30, 60, 90]}
        loading={loading}
        label={`Période : ${data.period.start_date} au ${data.period.end_date}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Revenus"
          value={formatCompactCurrency(summary.revenue)}
          subtitle={`${summary.sales_count} ventes`}
        />
        <KpiCard
          label="Profit Brut"
          value={formatCompactCurrency(summary.gross_profit)}
          subtitle={`Marge ${summary.gross_margin_percent.toFixed(1)}%`}
          color="green"
        />
        <KpiCard
          label="Profit Net"
          value={formatCompactCurrency(summary.net_profit)}
          subtitle={`Marge ${summary.net_margin_percent.toFixed(1)}%`}
          color={summary.net_profit >= 0 ? "green" : "red"}
        />
        <KpiCard
          label="Panier Moyen"
          value={formatCompactCurrency(summary.avg_ticket)}
          subtitle={`${summary.sales_count} transactions`}
          color="orange"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Répartition financière */}
        <Card className="p-5 border bg-card">
          <h4 className="text-sm font-semibold mb-5">Répartition financière</h4>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginData} layout="vertical" barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={compactCurrency}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={85}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {marginData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Méthodes de paiement */}
        <Card className="p-5 border bg-card">
          <h4 className="text-sm font-semibold mb-5">Méthodes de paiement</h4>
          <div className="space-y-2.5">
            {payment_methods.slice(0, 5).map((pm, idx) => {
              const barColors = [COLORS.green, COLORS.blue, COLORS.orange, COLORS.purple, COLORS.slate];
              const pct = pm.percentage;
              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: barColors[idx % 5] }}
                      />
                      <span className="text-sm font-medium capitalize">{pm.payment_method}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{formatCurrency(pm.total)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: barColors[idx % 5],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Évolution journalière */}
      {daily_trend.length > 0 && (
        <Card className="p-5 border bg-card">
          <h4 className="text-sm font-semibold mb-5">Évolution des revenus</h4>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_trend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={compactCurrency}
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: "hsl(var(--border))" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.green}
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: COLORS.green }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Top catégories */}
      <Card className="p-5 border bg-card">
        <h4 className="text-sm font-semibold mb-5">Rentabilité par catégorie</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-medium text-left text-muted-foreground text-[11px] uppercase tracking-wider">Catégorie</th>
                <th className="pb-3 font-medium text-right text-muted-foreground text-[11px] uppercase tracking-wider">Revenus</th>
                <th className="pb-3 font-medium text-right text-muted-foreground text-[11px] uppercase tracking-wider">COGS</th>
                <th className="pb-3 font-medium text-right text-muted-foreground text-[11px] uppercase tracking-wider">Profit</th>
                <th className="pb-3 font-medium text-right text-muted-foreground text-[11px] uppercase tracking-wider">Marge</th>
              </tr>
            </thead>
            <tbody>
              {top_categories.map((cat, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-medium">{cat.category_name}</td>
                  <td className="py-3 text-right tabular-nums">{formatCurrency(cat.revenue)}</td>
                  <td className="py-3 text-right tabular-nums text-red-500 dark:text-red-400">{formatCurrency(cat.cogs)}</td>
                  <td className="py-3 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(cat.gross_profit)}</td>
                  <td className="py-3 text-right">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      cat.margin_percent >= 30
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : cat.margin_percent >= 15
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    )}>
                      {cat.margin_percent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// Graphique Analyse ABC/Pareto
// ==========================================
export function ABCAnalysisChart({
  data,
  formatCurrency,
  formatNumber,
  days,
  onDaysChange,
  loading,
}: {
  data: ABCAnalysisResponse | null;
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
  days: number;
  onDaysChange: (days: number) => void;
  loading?: boolean;
}) {
  if (!data) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  const { abc_distribution, products } = data;

  const distributionData = [
    { name: "Classe A", desc: "80% du CA", value: abc_distribution.A.count, revenue: abc_distribution.A.revenue, fill: ABC_COLORS.A, pct: abc_distribution.A.revenue_percent },
    { name: "Classe B", desc: "15% du CA", value: abc_distribution.B.count, revenue: abc_distribution.B.revenue, fill: ABC_COLORS.B, pct: abc_distribution.B.revenue_percent },
    { name: "Classe C", desc: "5% du CA", value: abc_distribution.C.count, revenue: abc_distribution.C.revenue, fill: ABC_COLORS.C, pct: abc_distribution.C.revenue_percent },
  ];

  return (
    <div className="space-y-6">
      <PeriodSelector
        days={days}
        onDaysChange={onDaysChange}
        options={[30, 60, 90, 180, 365]}
        loading={loading}
        label={`Analyse sur ${data.period_days} jours · ${data.total_products} produits`}
      />

      {/* KPIs ABC en cards visuelles */}
      <div className="grid grid-cols-3 gap-4">
        {distributionData.map((d) => (
          <Card key={d.name} className="p-5 border bg-card relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-r"
              style={{ backgroundColor: d.fill }}
            />
            <div className="pl-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {d.name}
              </p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: d.fill }}>
                {d.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {d.pct.toFixed(1)}% du CA
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Graphique distribution */}
      <Card className="p-5 border bg-card">
        <h4 className="text-sm font-semibold mb-5">Distribution ABC</h4>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} layout="vertical" barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                formatter={(value: number, name: string) => [
                  name === "revenue" ? formatCurrency(value) : value,
                  name === "revenue" ? "CA" : "Produits"
                ]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Table produits */}
      <Card className="p-5 border bg-card">
        <h4 className="text-sm font-semibold mb-5">Top produits</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-medium text-left text-muted-foreground text-[11px] uppercase tracking-wider">Classe</th>
                <th className="pb-3 font-medium text-left text-muted-foreground text-[11px] uppercase tracking-wider">Produit</th>
                <th className="pb-3 font-medium text-right text-muted-foreground text-[11px] uppercase tracking-wider">CA</th>
                <th className="pb-3 font-medium text-right text-muted-foreground text-[11px] uppercase tracking-wider">% CA</th>
                <th className="pb-3 font-medium text-right text-muted-foreground text-[11px] uppercase tracking-wider">Cumulé</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 20).map((product, idx) => {
                const classColor = ABC_COLORS[product.classification as keyof typeof ABC_COLORS] || COLORS.slate;
                return (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: classColor }}
                      >
                        {product.classification}
                      </span>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium tabular-nums">{formatCurrency(product.revenue)}</td>
                    <td className="py-3 text-right text-muted-foreground tabular-nums">{product.revenue_percent.toFixed(2)}%</td>
                    <td className="py-3 text-right font-medium tabular-nums">{product.cumulative_percent.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// Graphique Rapport Crédits
// ==========================================
export function CreditsReportChart({
  data,
  formatCurrency,
}: {
  data: CreditsReportResponse | null;
  formatCurrency: (v: number) => string;
}) {
  if (!data) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  const { summary, by_customer, recent_credits } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Crédits actifs"
          value={String(summary.total_credits - summary.paid_count)}
          subtitle={`${formatCompactCurrency(summary.total_remaining)} dû`}
        />
        <KpiCard
          label="En retard"
          value={String(summary.overdue_count)}
          subtitle={formatCompactCurrency(summary.overdue_amount)}
          color="red"
        />
        <KpiCard
          label="Taux recouvrement"
          value={`${summary.recovery_rate.toFixed(1)}%`}
          subtitle={`${formatCompactCurrency(summary.total_paid)} payé`}
          color="green"
        />
        <KpiCard
          label="Partiel"
          value={String(summary.partial_count)}
          subtitle="Paiement en cours"
          color="orange"
        />
      </div>

      {/* Top clients débiteurs */}
      <Card className="p-5 border bg-card">
        <h4 className="text-sm font-semibold mb-5">Top clients débiteurs</h4>
        <div className="space-y-2">
          {by_customer.slice(0, 10).map((customer, idx) => {
            const maxDebt = by_customer[0]?.total_debt || 1;
            const pct = (customer.total_debt / maxDebt) * 100;
            return (
              <div key={idx} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{customer.customer_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {customer.credits_count} crédit{customer.credits_count > 1 ? 's' : ''}
                      {customer.overdue_count > 0 && (
                        <span className="text-red-500 dark:text-red-400 ml-1">
                          · {customer.overdue_count} en retard
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="font-semibold text-sm shrink-0 ml-3 tabular-nums">
                    {formatCurrency(customer.total_debt)}
                  </p>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: customer.overdue_count > 0 ? COLORS.red : COLORS.blue,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Crédits en cours */}
      <Card className="p-5 border bg-card">
        <h4 className="text-sm font-semibold mb-5">Crédits en cours</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-medium text-left text-muted-foreground text-[11px] uppercase tracking-wider">Vente</th>
                <th className="pb-3 font-medium text-left text-muted-foreground text-[11px] uppercase tracking-wider">Client</th>
                <th className="pb-3 font-medium text-right text-muted-foreground text-[11px] uppercase tracking-wider">Total</th>
                <th className="pb-3 font-medium text-right text-muted-foreground text-[11px] uppercase tracking-wider">Payé</th>
                <th className="pb-3 font-medium text-right text-muted-foreground text-[11px] uppercase tracking-wider">Restant</th>
                <th className="pb-3 font-medium text-left text-muted-foreground text-[11px] uppercase tracking-wider">Échéance</th>
                <th className="pb-3 font-medium text-left text-muted-foreground text-[11px] uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recent_credits.map((credit, idx) => {
                const isOverdue = credit.days_overdue > 0;
                return (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-medium">{credit.sale__sale_number}</td>
                    <td className="py-3 text-muted-foreground">{credit.customer__name}</td>
                    <td className="py-3 text-right tabular-nums">{formatCurrency(credit.total_amount)}</td>
                    <td className="py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(credit.paid_amount)}</td>
                    <td className="py-3 text-right tabular-nums font-medium">{formatCurrency(credit.remaining_amount)}</td>
                    <td className="py-3">
                      <span className={cn("text-xs", isOverdue && "text-red-500 dark:text-red-400")}>
                        {credit.due_date ? new Date(credit.due_date).toLocaleDateString('fr-FR') : '-'}
                        {isOverdue && ` (+${credit.days_overdue}j)`}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-medium rounded-full",
                        credit.status === "paid"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : credit.status === "partial"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            : isOverdue
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-muted text-muted-foreground"
                      )}>
                        {credit.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// Graphique Performance Ventes
// ==========================================
export function SalesPerformanceChart({
  data,
  formatCurrency,
  formatNumber,
  days,
  onDaysChange,
  loading,
}: {
  data: SalesPerformanceResponse | null;
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
  days: number;
  onDaysChange: (days: number) => void;
  loading?: boolean;
}) {
  if (!data) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  const { summary, by_weekday, by_hour, top_products } = data;

  return (
    <div className="space-y-6">
      <PeriodSelector
        days={days}
        onDaysChange={onDaysChange}
        options={[7, 14, 30, 60, 90]}
        loading={loading}
        label={`Période : ${data.period.start_date} au ${data.period.end_date}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Ventes" value={formatNumber(summary.total_sales)} />
        <KpiCard label="CA Total" value={formatCompactCurrency(summary.total_revenue)} color="green" />
        <KpiCard label="Panier Moyen" value={formatCompactCurrency(summary.avg_ticket)} color="orange" />
        <KpiCard label="Articles vendus" value={formatNumber(summary.total_items_sold)} />
        <KpiCard label="Clients uniques" value={formatNumber(summary.unique_customers)} color="blue" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ventes par jour */}
        <Card className="p-5 border bg-card">
          <h4 className="text-sm font-semibold mb-5">Ventes par jour de la semaine</h4>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={by_weekday} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="weekday_name"
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={compactCurrency}
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                />
                <Bar dataKey="revenue" fill={COLORS.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Ventes par heure */}
        {by_hour.length > 0 && (
          <Card className="p-5 border bg-card">
            <h4 className="text-sm font-semibold mb-5">Ventes par heure</h4>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={by_hour}>
                  <defs>
                    <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hour"
                    fontSize={10}
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={compactCurrency}
                    fontSize={10}
                    stroke="hsl(var(--muted-foreground))"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: "hsl(var(--border))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    fill="url(#hourGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: COLORS.blue }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Top produits */}
      <Card className="p-5 border bg-card">
        <h4 className="text-sm font-semibold mb-5">Top produits vendus</h4>
        <div className="grid md:grid-cols-2 gap-2.5">
          {top_products.map((product, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.product__name}</p>
                <p className="text-[11px] text-muted-foreground">{product.product__sku}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm tabular-nums">{formatNumber(product.qty_sold)}</p>
                <p className="text-[11px] text-muted-foreground tabular-nums">{formatCurrency(product.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
