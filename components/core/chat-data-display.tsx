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
} from "recharts";
import { cn } from "@/lib/utils";

// Couleurs pour les graphiques
const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
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

// Composant pour afficher un tableau
function DataTable({ data, title }: { data: Record<string, unknown>[]; title?: string }) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]).filter(
    (key) => key !== "id" && !key.startsWith("_")
  );


  return (
    <div className="my-3 overflow-hidden rounded-xl border bg-card">
      {title && (
        <div className="px-4 py-2 bg-muted/50 border-b">
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left font-medium text-muted-foreground capitalize"
                >
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.slice(0, 10).map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/20 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2.5">
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && (
          <div className="px-4 py-2 bg-muted/20 text-xs text-muted-foreground text-center">
            ... et {data.length - 10} autres
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour afficher des statistiques en cartes
function StatsCards({ data, title }: { data: Record<string, unknown>; title?: string }) {
  const entries = Object.entries(data).filter(
    ([key]) => !key.startsWith("_") && key !== "id"
  );

  return (
    <div className="my-3">
      {title && (
        <h4 className="font-semibold text-sm mb-2">{title}</h4>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {entries.map(([key, value], idx) => (
          <div
            key={key}
            className="rounded-xl border bg-gradient-to-br from-card to-muted/30 p-3 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: COLORS[idx % COLORS.length] }}>
              {formatStatValue(value)}
            </div>
            <div className="text-xs text-muted-foreground capitalize mt-1">
              {key.replace(/_/g, " ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant pour afficher un graphique en barres
function BarChartDisplay({ data, title }: { data: Record<string, unknown>[]; title?: string }) {
  if (!data || data.length === 0) return null;

  // Trouver les colonnes numériques pour le graphique
  const numericKeys = Object.keys(data[0]).filter(
    (key) => typeof data[0][key] === "number" && key !== "id"
  );
  const labelKey = Object.keys(data[0]).find(
    (key) => typeof data[0][key] === "string" && key !== "id"
  ) || "nom";

  if (numericKeys.length === 0) return null;

  return (
    <div className="my-3 rounded-xl border bg-card p-4">
      {title && (
        <h4 className="font-semibold text-sm mb-3">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data.slice(0, 8)}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={labelKey} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          {numericKeys.slice(0, 2).map((key, idx) => (
            <Bar
              key={key}
              dataKey={key}
              fill={COLORS[idx]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Composant pour afficher un graphique circulaire
function PieChartDisplay({ data, title }: { data: Record<string, unknown>; title?: string }) {
  const entries = Object.entries(data)
    .filter(([key, value]) => typeof value === "number" && !key.startsWith("_"))
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value: value as number }));

  if (entries.length === 0) return null;

  return (
    <div className="my-3 rounded-xl border bg-card p-4">
      {title && (
        <h4 className="font-semibold text-sm mb-3 text-center">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={entries}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {entries.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {entries.map((entry, idx) => (
          <div key={entry.name} className="flex items-center gap-1 text-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="capitalize">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Formatage des valeurs
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toLocaleString("fr-FR");
    return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  }
  return String(value);
}

function formatStatValue(value: unknown): string {
  if (typeof value === "number") {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "k";
    return value.toLocaleString("fr-FR");
  }
  return String(value);
}

// Composant principal
export function ChatDataDisplay({ toolResults, className }: ChatDataDisplayProps) {
  if (!toolResults || toolResults.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {toolResults.map((result, idx) => {
        if (!result.success || !result.data) {
          return result.error ? (
            <div key={idx} className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              ⚠️ {result.error}
            </div>
          ) : null;
        }

        const data = result.data;
        const toolName = result.tool.replace(/_/g, " ");

        // Déterminer le type d'affichage
        if (Array.isArray(data) && data.length > 0) {
          // C'est une liste - afficher en tableau et graphique
          const hasNumericData = Object.values(data[0]).some(
            (v) => typeof v === "number"
          );

          return (
            <div key={idx}>
              <DataTable data={data} title={`📊 ${toolName}`} />
              {hasNumericData && data.length > 1 && (
                <BarChartDisplay data={data} title="Visualisation" />
              )}
            </div>
          );
        } else if (typeof data === "object" && data !== null) {
          // C'est un objet - afficher en stats
          const numericValues = Object.values(data).filter(
            (v) => typeof v === "number"
          ).length;

          return (
            <div key={idx}>
              <StatsCards data={data as Record<string, unknown>} title={`📈 ${toolName}`} />
              {numericValues >= 3 && (
                <PieChartDisplay data={data as Record<string, unknown>} />
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export default ChatDataDisplay;
