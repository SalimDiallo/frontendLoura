"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui";
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Legend,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type {
  WarehouseStockReport,
  CategoryStockReport,
  MovementHistoryResponse,
  LowRotationProductsResponse,
  StockCountsSummaryResponse,
} from "@/lib/types/inventory";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Couleurs pour les graphiques
const CHART_COLORS = [
  "hsl(215, 100%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(262, 83%, 58%)",
  "hsl(24, 95%, 53%)",
  "hsl(340, 82%, 52%)",
  "hsl(189, 94%, 43%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
];

interface ChartProps {
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
}

// ==========================================
// Graphique des mouvements (Area + Line)
// ==========================================
export function MovementsChart({
  data,
  formatNumber,
}: {
  data: MovementHistoryResponse | null;
  formatNumber: (v: number) => string;
}) {
  const chartData = useMemo(() => {
    if (!data?.history) return [];
    return data.history.map((day) => ({
      date: new Date(day.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
      entrees: day.in.count,
      sorties: day.out.count,
      transferts: day.transfer.count,
      ajustements: day.adjustment.count,
      total: day.in.count + day.out.count + day.transfer.count + day.adjustment.count,
      netFlow: day.in.count - day.out.count,
    }));
  }, [data]);

  const chartConfig = {
    entrees: { label: "Entrées", color: "hsl(142, 71%, 45%)" },
    sorties: { label: "Sorties", color: "hsl(0, 84%, 60%)" },
    transferts: { label: "Transferts", color: "hsl(215, 100%, 50%)" },
    total: { label: "Total", color: "hsl(262, 83%, 58%)" },
  };

  if (!data?.history?.length) {
    return (
      <div className="h-[320px] flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs en haut */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 border border-green-200/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-700 dark:text-green-300">Entrées</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-green-900 dark:text-green-100">
            {formatNumber(data.summary.total_in)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30 border border-red-200/50">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-xs text-red-700 dark:text-red-300">Sorties</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-red-900 dark:text-red-100">
            {formatNumber(data.summary.total_out)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border border-blue-200/50">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-700 dark:text-blue-300">Transferts</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-blue-900 dark:text-blue-100">
            {formatNumber(data.summary.total_transfers)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border border-purple-200/50">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-purple-700 dark:text-purple-300">Total</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-purple-900 dark:text-purple-100">
            {formatNumber(data.summary.total_movements)}
          </p>
        </div>
      </div>

      {/* Graphique principal */}
      <div className="h-[300px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="gradientIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="entrees"
              stroke="hsl(142, 71%, 45%)"
              strokeWidth={2}
              fill="url(#gradientIn)"
            />
            <Area
              type="monotone"
              dataKey="sorties"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth={2}
              fill="url(#gradientOut)"
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(262, 83%, 58%)"
              strokeWidth={2}
              dot={{ fill: "hsl(262, 83%, 58%)", r: 3 }}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// ==========================================
// Graphique des catégories (Donut + Barres)
// ==========================================
export function CategoriesChart({
  data,
  formatCurrency,
  formatNumber,
}: {
  data: CategoryStockReport[];
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
}) {
  const totalValue = data.reduce((acc, c) => acc + c.total_value, 0);
  const totalQuantity = data.reduce((acc, c) => acc + c.total_quantity, 0);

  const pieData = useMemo(() => {
    return data.slice(0, 8).map((cat, idx) => ({
      name: cat.name,
      value: cat.total_value,
      percentage: totalValue > 0 ? ((cat.total_value / totalValue) * 100).toFixed(1) : "0",
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [data, totalValue]);

  if (!data.length) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
        Aucune catégorie disponible
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Graphique Donut */}
      <Card className="p-4">
        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-purple-500" />
          Répartition par valeur
        </h4>
        <div className="h-[250px] flex items-center">
          <div className="w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 space-y-1.5 text-sm">
            {pieData.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.fill }} />
                <span className="truncate flex-1 text-xs" title={cat.name}>{cat.name}</span>
                <span className="text-xs font-medium">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Graphique en barres */}
      <Card className="p-4">
        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          Quantité par catégorie
        </h4>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" horizontal={false} />
              <XAxis type="number" fontSize={10} tickFormatter={formatNumber} />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={10}
                width={80}
                tickFormatter={(v) => v.length > 10 ? v.slice(0, 10) + "..." : v}
              />
              <Tooltip
                formatter={(value: number) => formatNumber(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="total_quantity" radius={[0, 4, 4, 0]} barSize={18}>
                {data.slice(0, 6).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tableau récapitulatif */}
      <Card className="p-4 lg:col-span-2">
        <h4 className="font-medium text-sm mb-3">Détail par catégorie</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Catégorie</th>
                <th className="pb-2 font-medium text-right">Produits</th>
                <th className="pb-2 font-medium text-right">Quantité</th>
                <th className="pb-2 font-medium text-right">Valeur</th>
                <th className="pb-2 font-medium text-right">Stock bas</th>
                <th className="pb-2 font-medium text-right">% Valeur</th>
              </tr>
            </thead>
            <tbody>
              {data.map((cat, idx) => (
                <tr key={cat.id || idx} className="border-b hover:bg-muted/30">
                  <td className="py-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    {cat.name}
                  </td>
                  <td className="py-2 text-right">{cat.product_count}</td>
                  <td className="py-2 text-right">{formatNumber(cat.total_quantity)}</td>
                  <td className="py-2 text-right text-green-600 font-medium">{formatCurrency(cat.total_value)}</td>
                  <td className="py-2 text-right">
                    <span className={cn(cat.low_stock_count > 0 ? "text-orange-600" : "text-green-600")}>
                      {cat.low_stock_count}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {totalValue > 0 ? ((cat.total_value / totalValue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium bg-muted/50">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">{data.reduce((acc, c) => acc + c.product_count, 0)}</td>
                <td className="py-2 text-right">{formatNumber(totalQuantity)}</td>
                <td className="py-2 text-right text-green-600">{formatCurrency(totalValue)}</td>
                <td className="py-2 text-right text-orange-600">{data.reduce((acc, c) => acc + c.low_stock_count, 0)}</td>
                <td className="py-2 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// Graphique des entrepôts (Comparatif)
// ==========================================
export function WarehousesChart({
  data,
  formatCurrency,
  formatNumber,
}: {
  data: WarehouseStockReport[];
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
}) {
  const maxValue = Math.max(...data.map((w) => w.total_value), 1);
  const totalValue = data.reduce((acc, w) => acc + w.total_value, 0);
  const totalStock = data.reduce((acc, w) => acc + w.total_quantity, 0);

  if (!data.length) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
        Aucun entrepôt disponible
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
          <p className="text-xs text-blue-700 dark:text-blue-300">Entrepôts</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{data.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30">
          <p className="text-xs text-green-700 dark:text-green-300">Valeur totale</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(totalValue)}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30">
          <p className="text-xs text-purple-700 dark:text-purple-300">Stock total</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatNumber(totalStock)}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30">
          <p className="text-xs text-orange-700 dark:text-orange-300">Alertes stock</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {data.reduce((acc, w) => acc + w.low_stock_count + w.out_of_stock_count, 0)}
          </p>
        </Card>
      </div>

      {/* Graphique comparatif */}
      <Card className="p-4">
        <h4 className="font-medium text-sm mb-4">Comparaison des entrepôts</h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
              <XAxis dataKey="code" fontSize={10} />
              <YAxis fontSize={10} tickFormatter={formatNumber} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "total_value" ? formatCurrency(value) : formatNumber(value),
                  name === "total_value" ? "Valeur" : name === "total_quantity" ? "Quantité" : name,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="total_quantity" name="Quantité" fill="hsl(215, 100%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="product_count" name="Produits" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cartes détaillées par entrepôt */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((wh, idx) => (
          <Card key={wh.id} className="p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
            <div className="pl-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="font-semibold">{wh.name}</h5>
                  <span className="text-xs text-muted-foreground">{wh.code}</span>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                  {((wh.total_value / maxValue) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Produits</p>
                  <p className="font-medium">{wh.product_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantité</p>
                  <p className="font-medium">{formatNumber(wh.total_quantity)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valeur</p>
                  <p className="font-medium text-green-600">{formatCurrency(wh.total_value)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alertes</p>
                  <p className={cn("font-medium", wh.low_stock_count + wh.out_of_stock_count > 0 ? "text-orange-600" : "text-green-600")}>
                    {wh.low_stock_count + wh.out_of_stock_count}
                  </p>
                </div>
              </div>
              {/* Barre de progression */}
              <div className="mt-3">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all rounded-full"
                    style={{
                      width: `${(wh.total_value / maxValue) * 100}%`,
                      backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// Graphique de précision des inventaires
// ==========================================
export function StockCountsChart({
  data,
  formatNumber,
}: {
  data: StockCountsSummaryResponse | null;
  formatNumber: (v: number) => string;
}) {
  if (!data?.stock_counts.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Aucun inventaire disponible
      </div>
    );
  }

  const accuracyData = data.stock_counts
    .filter((c) => c.accuracy_rate > 0)
    .map((c) => ({
      name: c.count_number,
      precision: c.accuracy_rate,
      ecarts: c.items_with_discrepancy,
      articles: c.item_count,
    }));

  const avgAccuracy = accuracyData.length > 0
    ? (accuracyData.reduce((acc, c) => acc + c.precision, 0) / accuracyData.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
          <p className="text-xs text-blue-700 dark:text-blue-300">Total inventaires</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{data.summary.total_counts}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30">
          <p className="text-xs text-green-700 dark:text-green-300">Validés</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{data.summary.validated_counts}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30">
          <p className="text-xs text-orange-700 dark:text-orange-300">En attente</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{data.summary.pending_counts}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-purple-600" />
            <p className="text-xs text-purple-700 dark:text-purple-300">Précision moyenne</p>
          </div>
          <p className={cn(
            "text-2xl font-bold",
            avgAccuracy >= 95 ? "text-green-600" : avgAccuracy >= 80 ? "text-orange-600" : "text-red-600"
          )}>
            {avgAccuracy.toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Graphique de précision */}
      {accuracyData.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium text-sm mb-4">Évolution de la précision</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis yAxisId="left" fontSize={10} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar yAxisId="right" dataKey="ecarts" name="Écarts" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="precision"
                  name="Précision %"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 71%, 45%)", r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
