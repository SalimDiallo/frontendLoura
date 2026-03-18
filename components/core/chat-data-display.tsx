"use client";

import React from "react";
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
  AreaChart,
  Area,
  Legend,
  ComposedChart,
} from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle, Info, BarChart3, PieChartIcon, Activity, ArrowUpRight } from "lucide-react";

// Premium color palette
const COLORS = [
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#14b8a6", // teal-500
  "#06b6d4", // cyan-500
];

const GRADIENT_PAIRS = [
  ["#6366f1", "#818cf8"],
  ["#8b5cf6", "#a78bfa"],
  ["#ec4899", "#f472b6"],
  ["#22c55e", "#4ade80"],
  ["#f97316", "#fb923c"],
];

interface ToolResult {
  tool: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

interface ChatDataDisplayProps {
  toolResults: ToolResult[];
  className?: string;
}

// Custom tooltip component for charts
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-lg shadow-xl shadow-black/5 px-3 py-2 text-xs">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-gray-600 dark:text-gray-400" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{formatStatValue(entry.value, entry.name)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Improved data table
function DataTable({ data, title }: { data: Record<string, unknown>[]; title?: string }) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]).filter(
    (key) => key !== "id" && !key.startsWith("_")
  );

  const getCellStyle = (value: unknown, col: string) => {
    if (typeof value === "boolean") {
      return value ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold";
    }
    if (typeof value === "number") {
      if (col.includes("profit") || col.includes("benefice")) {
        return value > 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold";
      }
      if (col.includes("dette") || col.includes("retard")) {
        return value > 0 ? "text-amber-600 font-semibold" : "text-gray-500";
      }
      return "font-mono font-medium text-gray-900 dark:text-gray-100";
    }
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower.includes("actif") || lower.includes("approuvé") || lower.includes("payé") || lower.includes("success")) {
        return "text-emerald-600";
      }
      if (lower.includes("en attente") || lower.includes("pending")) {
        return "text-amber-600";
      }
      if (lower.includes("suspendu") || lower.includes("rejeté") || lower.includes("overdue")) {
        return "text-red-600";
      }
    }
    return "";
  };

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-gray-200/60 dark:border-gray-800/40 bg-white dark:bg-gray-900/80 shadow-sm">
      {title && (
        <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900/80 border-b border-gray-200/40 dark:border-gray-800/40">
          <h4 className="font-semibold text-xs flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            {title}
            <span className="ml-auto text-[10px] font-normal text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full tabular-nums">
              {data.length}
            </span>
          </h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50/80 dark:bg-gray-800/30 border-b border-gray-200/40 dark:border-gray-800/40">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col}
                  className={cn(
                    "px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 capitalize text-[10px] tracking-wide uppercase",
                    idx === 0 && "sticky left-0 bg-gray-50/80 dark:bg-gray-800/30 z-10"
                  )}
                >
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/30">
            {data.slice(0, 15).map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col}
                    className={cn(
                      "px-3 py-2 text-xs",
                      getCellStyle(row[col], col),
                      colIdx === 0 && "sticky left-0 bg-inherit font-medium"
                    )}
                  >
                    {formatCellValue(row[col], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 15 && (
          <div className="px-3 py-2 bg-gray-50/50 dark:bg-gray-900/50 text-[10px] text-gray-400 text-center border-t border-gray-200/40 dark:border-gray-800/40 flex items-center justify-center gap-1.5">
            <Info className="w-3 h-3" />
            <span>+ {data.length - 15} autres résultats</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Stats cards with premium design
function StatsCards({ data, title }: { data: Record<string, unknown>; title?: string }) {
  const entries = Object.entries(data).filter(
    ([key]) => !key.startsWith("_") && key !== "id"
  );

  const getVariationIcon = (key: string, value: unknown) => {
    if (typeof value === "number") {
      if (key.includes("profit") || key.includes("benefice") || key.includes("ca")) {
        return value > 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
      }
      if (key.includes("dette") || key.includes("depense")) {
        return value > 0 ? <TrendingDown className="w-3.5 h-3.5 text-amber-500" /> : <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
      }
    }
    return null;
  };

  const getCardAccent = (idx: number) => COLORS[idx % COLORS.length];

  return (
    <div className="my-2">
      {title && (
        <h4 className="font-semibold text-xs mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Activity className="w-3.5 h-3.5 text-indigo-500" />
          {title}
        </h4>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {entries.map(([key, value], idx) => (
          <div
            key={key}
            className="rounded-xl border border-gray-200/40 dark:border-gray-800/40 bg-white dark:bg-gray-900/80 p-3 transition-all hover:shadow-md hover:scale-[1.01] group relative overflow-hidden"
          >
            {/* Accent line */}
            <div
              className="absolute top-0 left-0 w-full h-0.5 opacity-60"
              style={{ backgroundColor: getCardAccent(idx) }}
            />
            <div className="flex items-start justify-between mb-1">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ color: getCardAccent(idx) }}>
                {formatStatValue(value, key)}
              </div>
              {getVariationIcon(key, value)}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 capitalize font-medium leading-tight">
              {key.replace(/_/g, " ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bar chart display
function BarChartDisplay({ data, title }: { data: Record<string, unknown>[]; title?: string }) {
  if (!data || data.length === 0) return null;

  const numericKeys = Object.keys(data[0]).filter(
    (key) => typeof data[0][key] === "number" && key !== "id"
  );
  const labelKey = Object.keys(data[0]).find(
    (key) => typeof data[0][key] === "string" && key !== "id"
  ) || "nom";

  if (numericKeys.length === 0) return null;

  return (
    <div className="my-2 rounded-xl border border-gray-200/40 dark:border-gray-800/40 bg-white dark:bg-gray-900/80 p-3">
      {title && (
        <h4 className="font-semibold text-xs mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data.slice(0, 8)}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#94a3b8" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          {numericKeys.slice(0, 2).map((key, idx) => (
            <Bar
              key={key}
              dataKey={key}
              fill={COLORS[idx]}
              radius={[6, 6, 0, 0]}
              opacity={0.85}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pie chart display
function PieChartDisplay({ data, title }: { data: Record<string, unknown>; title?: string }) {
  const entries = Object.entries(data)
    .filter(([key, value]) => typeof value === "number" && !key.startsWith("_"))
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value: value as number }));

  if (entries.length === 0) return null;

  return (
    <div className="my-2 rounded-xl border border-gray-200/40 dark:border-gray-800/40 bg-white dark:bg-gray-900/80 p-3">
      {title && (
        <h4 className="font-semibold text-xs mb-2 text-center flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
          <PieChartIcon className="w-3.5 h-3.5 text-indigo-500" />
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={entries}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
          >
            {entries.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.85} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
        {entries.map((entry, idx) => (
          <div key={entry.name} className="flex items-center gap-1 text-[10px] bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded-full">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Line chart display
function LineChartDisplay({ data, title }: { data: Record<string, unknown>[]; title?: string }) {
  if (!data || data.length === 0) return null;

  const numericKeys = Object.keys(data[0]).filter(
    (key) => typeof data[0][key] === "number" && key !== "id"
  );
  const labelKey = Object.keys(data[0]).find(
    (key) => (typeof data[0][key] === "string" || key.includes("date") || key.includes("periode")) && key !== "id"
  ) || "label";

  if (numericKeys.length === 0) return null;

  return (
    <div className="my-2 rounded-xl border border-gray-200/40 dark:border-gray-800/40 bg-white dark:bg-gray-900/80 p-3">
      {title && (
        <h4 className="font-semibold text-xs mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#94a3b8" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          {numericKeys.slice(0, 3).map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[idx]}
              strokeWidth={2}
              dot={{ r: 3, fill: COLORS[idx] }}
              activeDot={{ r: 5, fill: COLORS[idx], stroke: '#fff', strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Area chart display
function AreaChartDisplay({ data, title }: { data: Record<string, unknown>[]; title?: string }) {
  if (!data || data.length === 0) return null;

  const numericKeys = Object.keys(data[0]).filter(
    (key) => typeof data[0][key] === "number" && key !== "id"
  );
  const labelKey = Object.keys(data[0]).find(
    (key) => typeof data[0][key] === "string" && key !== "id"
  ) || "label";

  if (numericKeys.length === 0) return null;

  return (
    <div className="my-2 rounded-xl border border-gray-200/40 dark:border-gray-800/40 bg-white dark:bg-gray-900/80 p-3">
      {title && (
        <h4 className="font-semibold text-xs mb-2 text-gray-700 dark:text-gray-300">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            {numericKeys.slice(0, 3).map((key, idx) => (
              <linearGradient key={key} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[idx]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS[idx]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#94a3b8" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          {numericKeys.slice(0, 3).map((key, idx) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="1"
              stroke={COLORS[idx]}
              fill={`url(#gradient-${idx})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Comparison chart
function ComparisonChartDisplay({ data, title }: { data: Record<string, unknown>[]; title?: string }) {
  if (!data || data.length === 0) return null;

  const numericKeys = Object.keys(data[0]).filter(
    (key) => typeof data[0][key] === "number" && key !== "id"
  );
  const labelKey = Object.keys(data[0]).find(
    (key) => typeof data[0][key] === "string" && key !== "id"
  ) || "label";

  if (numericKeys.length < 2) return null;

  return (
    <div className="my-2 rounded-xl border border-gray-200/40 dark:border-gray-800/40 bg-white dark:bg-gray-900/80 p-3">
      {title && (
        <h4 className="font-semibold text-xs mb-2 text-gray-700 dark:text-gray-300">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#94a3b8" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          <Bar dataKey={numericKeys[0]} fill={COLORS[0]} radius={[4, 4, 0, 0]} opacity={0.85} />
          {numericKeys.slice(1, 3).map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[idx + 1]}
              strokeWidth={2}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Format cell values - currency aware
function formatCellValue(value: unknown, columnName?: string): string {
  if (value === null || value === undefined) return "-";

  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  if (typeof value === "number") {
    const col = columnName?.toLowerCase() || "";

    // Currency
    if (col.includes("prix") || col.includes("montant") || col.includes("salaire") ||
        col.includes("ca") || col.includes("benefice") || col.includes("depense") ||
        col.includes("dette") || col.includes("credit") || col.includes("cout") ||
        col.includes("restant") || col.includes("total")) {
      return new Intl.NumberFormat("fr-FR", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }

    // Percentages
    if (col.includes("taux") || col.includes("pourcent") || col.includes("ratio")) {
      return `${value.toFixed(1)}%`;
    }

    // Quantities
    if (col.includes("stock") || col.includes("quantite") || col.includes("nombre")) {
      return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
    }

    // Hours
    if (col.includes("heure")) {
      return `${value.toFixed(1)}h`;
    }

    // Days
    if (col.includes("jour")) {
      return `${value} ${value > 1 ? "jours" : "jour"}`;
    }

    if (Number.isInteger(value)) return value.toLocaleString("fr-FR");
    return value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (typeof value === "string") {
    // Format dates
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        const date = new Date(value);
        return new Intl.DateTimeFormat("fr-FR", {
          year: "numeric",
          month: "short",
          day: "numeric"
        }).format(date);
      } catch {
        return value;
      }
    }

    // Status formatting (without emojis)
    const lower = value.toLowerCase();
    if (lower === "actif" || lower === "active") return "Actif";
    if (lower === "inactif" || lower === "inactive") return "Inactif";
    if (lower === "en attente" || lower === "pending") return "En attente";
    if (lower === "approuvé" || lower === "approved") return "Approuvé";
    if (lower === "rejeté" || lower === "rejected") return "Rejeté";
    if (lower === "payé" || lower === "paid") return "Payé";
    if (lower === "impayé" || lower === "unpaid") return "Impayé";

    return value;
  }

  return String(value);
}

function formatStatValue(value: unknown, key?: string): string {
  if (typeof value === "number") {
    const k = key?.toLowerCase() || "";

    // Currency values
    if (k.includes("montant") || k.includes("prix") || k.includes("ca") ||
        k.includes("benefice") || k.includes("salaire") || k.includes("depense") ||
        k.includes("dette") || k.includes("credit") || k.includes("total") ||
        k.includes("creance") || k.includes("restant")) {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
      }
      return value.toLocaleString("fr-FR");
    }

    // Percentages
    if (k.includes("taux") || k.includes("pourcent")) {
      return `${value.toFixed(1)}%`;
    }

    // Large values
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "k";

    return value.toLocaleString("fr-FR");
  }
  return String(value);
}

// Determine best chart type
function getBestChartType(data: Record<string, unknown>[], toolName: string): string {
  if (data.length === 0) return "none";

  const keys = Object.keys(data[0]);
  const hasDateField = keys.some(k => k.includes("date") || k.includes("periode") || k.includes("mois"));
  const hasMultipleNumeric = keys.filter(k => typeof data[0][k] === "number").length >= 2;

  if (hasDateField && data.length >= 3) {
    return hasMultipleNumeric ? "area" : "line";
  }

  if (toolName.includes("top") || toolName.includes("plus") || toolName.includes("classement")) {
    return "bar";
  }

  if (hasMultipleNumeric && data.length >= 3) {
    return "comparison";
  }

  return "bar";
}

// Main component
export function ChatDataDisplay({ toolResults, className }: ChatDataDisplayProps) {
  if (!toolResults || toolResults.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {toolResults.map((result, idx) => {
        if (!result.success || !result.data) {
          return result.error ? (
            <div key={idx} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl p-3 border border-red-200/60 dark:border-red-800/40">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{result.error}</span>
            </div>
          ) : null;
        }

        const data = result.data;
        const toolName = result.tool.replace(/_/g, " ");

        // LIST DATA
        if (Array.isArray(data) && data.length > 0) {
          const hasNumericData = Object.values(data[0]).some(
            (v) => typeof v === "number"
          );

          const chartType = getBestChartType(data, toolName);

          return (
            <div key={idx} className="space-y-2">
              <DataTable data={data} title={toolName} />
              {hasNumericData && data.length > 1 && (
                <>
                  {chartType === "line" && <LineChartDisplay data={data} title="Évolution" />}
                  {chartType === "area" && <AreaChartDisplay data={data} title="Évolution empilée" />}
                  {chartType === "bar" && <BarChartDisplay data={data} title="Comparaison" />}
                  {chartType === "comparison" && <ComparisonChartDisplay data={data} title="Analyse comparative" />}
                </>
              )}
            </div>
          );
        }

        // OBJECT DATA (STATS)
        else if (typeof data === "object" && data !== null) {
          const entries = Object.entries(data);
          const numericValues = entries.filter(([, v]) => typeof v === "number").length;
          const hasNestedArrays = entries.some(([, v]) => Array.isArray(v));

          return (
            <div key={idx} className="space-y-2">
              {!hasNestedArrays && (
                <StatsCards data={data as Record<string, unknown>} title={toolName} />
              )}

              {numericValues >= 3 && numericValues <= 6 && !hasNestedArrays && (
                <PieChartDisplay data={data as Record<string, unknown>} title="Répartition" />
              )}

              {hasNestedArrays && entries.map(([key, value]) => {
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
                  return (
                    <div key={key}>
                      <DataTable data={value} title={key.replace(/_/g, " ")} />
                      {value.length > 1 && Object.values(value[0]).some(v => typeof v === "number") && (
                        <BarChartDisplay data={value} />
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export default ChatDataDisplay;
