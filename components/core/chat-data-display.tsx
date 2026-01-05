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
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info } from "lucide-react";

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

// Couleurs pour les statuts
const STATUS_COLORS: Record<string, string> = {
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  info: "#3b82f6",
};

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

// Composant pour afficher un tableau amélioré
function DataTable({ data, title }: { data: Record<string, unknown>[]; title?: string }) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]).filter(
    (key) => key !== "id" && !key.startsWith("_")
  );

  // Fonction pour obtenir une icône selon le type de colonne
  const getColumnIcon = (col: string) => {
    if (col.includes("employe") || col.includes("nom") || col.includes("client")) return "👤";
    if (col.includes("montant") || col.includes("prix") || col.includes("salaire") || col.includes("ca")) return "💰";
    if (col.includes("stock") || col.includes("quantite")) return "📦";
    if (col.includes("date") || col.includes("periode")) return "📅";
    if (col.includes("statut") || col.includes("status")) return "🏷️";
    if (col.includes("departement")) return "🏢";
    if (col.includes("produit")) return "📦";
    return "";
  };

  // Fonction pour styliser une cellule selon son contenu
  const getCellStyle = (value: unknown, col: string) => {
    if (typeof value === "boolean") {
      return value ? "text-green-600 font-semibold" : "text-red-600 font-semibold";
    }
    if (typeof value === "number") {
      if (col.includes("profit") || col.includes("benefice")) {
        return value > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold";
      }
      if (col.includes("dette") || col.includes("retard")) {
        return value > 0 ? "text-orange-600 font-semibold" : "text-muted-foreground";
      }
      return "font-mono font-medium";
    }
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower.includes("actif") || lower.includes("approuvé") || lower.includes("payé") || lower.includes("success")) {
        return "text-green-600";
      }
      if (lower.includes("en attente") || lower.includes("pending")) {
        return "text-orange-600";
      }
      if (lower.includes("suspendu") || lower.includes("rejeté") || lower.includes("overdue")) {
        return "text-red-600";
      }
    }
    return "";
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border bg-card shadow-sm">
      {title && (
        <div className="px-4 py-3 bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <span className="text-base">📊</span>
            {title}
            <span className="ml-auto text-xs font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full">
              {data.length} {data.length > 1 ? "résultats" : "résultat"}
            </span>
          </h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b-2">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col}
                  className={cn(
                    "px-4 py-3 text-left font-semibold text-muted-foreground capitalize",
                    idx === 0 && "sticky left-0 bg-muted/30 z-10"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {getColumnIcon(col) && <span>{getColumnIcon(col)}</span>}
                    {col.replace(/_/g, " ")}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.slice(0, 15).map((row, idx) => (
              <tr
                key={idx}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/5"
                )}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col}
                    className={cn(
                      "px-4 py-3",
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
          <div className="px-4 py-2.5 bg-muted/20 text-xs text-muted-foreground text-center border-t flex items-center justify-center gap-2">
            <Info className="w-3 h-3" />
            <span>... et {data.length - 15} autres résultats non affichés</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour afficher des statistiques en cartes avec indicateurs
function StatsCards({ data, title }: { data: Record<string, unknown>; title?: string }) {
  const entries = Object.entries(data).filter(
    ([key]) => !key.startsWith("_") && key !== "id"
  );

  // Détecter les variations (si clés contiennent "variation", "evolution", etc.)
  const getVariationIcon = (key: string, value: unknown) => {
    if (typeof value === "number") {
      if (key.includes("profit") || key.includes("benefice") || key.includes("ca")) {
        return value > 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />;
      }
      if (key.includes("dette") || key.includes("depense")) {
        return value > 0 ? <TrendingDown className="w-4 h-4 text-orange-500" /> : <TrendingUp className="w-4 h-4 text-green-500" />;
      }
    }
    return null;
  };

  const getCardStyle = (key: string, value: unknown) => {
    if (typeof value === "number") {
      if (key.includes("profit") || key.includes("benefice")) {
        return value > 0 ? "from-green-500/10 to-green-500/5 border-green-500/20" : "from-red-500/10 to-red-500/5 border-red-500/20";
      }
      if (key.includes("alerte") || key.includes("retard")) {
        return "from-orange-500/10 to-orange-500/5 border-orange-500/20";
      }
    }
    return "from-card to-muted/30";
  };

  return (
    <div className="my-3">
      {title && (
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          {title}
        </h4>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {entries.map(([key, value], idx) => (
          <div
            key={key}
            className={cn(
              "rounded-xl border bg-gradient-to-br p-4 transition-all hover:shadow-lg hover:scale-[1.02]",
              getCardStyle(key, value)
            )}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="text-2xl font-bold" style={{ color: COLORS[idx % COLORS.length] }}>
                {formatStatValue(value, key)}
              </div>
              {getVariationIcon(key, value)}
            </div>
            <div className="text-xs text-muted-foreground capitalize font-medium">
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

  const total = entries.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="my-3 rounded-xl border bg-card p-4">
      {title && (
        <h4 className="font-semibold text-sm mb-3 text-center">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={entries}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {entries.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatStatValue(value)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-2 mt-3">
        {entries.map((entry, idx) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-full">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="capitalize font-medium">{entry.name}</span>
            <span className="text-muted-foreground">({formatStatValue(entry.value)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Graphique en ligne pour les tendances temporelles
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
    <div className="my-3 rounded-xl border bg-card p-4">
      {title && (
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={labelKey} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          {numericKeys.slice(0, 3).map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[idx]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Graphique en aire pour visualisations empilées
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
    <div className="my-3 rounded-xl border bg-card p-4">
      {title && (
        <h4 className="font-semibold text-sm mb-3">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={labelKey} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          {numericKeys.slice(0, 3).map((key, idx) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="1"
              stroke={COLORS[idx]}
              fill={COLORS[idx]}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Graphique comparatif (barres + lignes)
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
    <div className="my-3 rounded-xl border bg-card p-4">
      {title && (
        <h4 className="font-semibold text-sm mb-3">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={labelKey} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey={numericKeys[0]} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
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

// Formatage des valeurs avec support devise et pourcentage
function formatCellValue(value: unknown, columnName?: string): string {
  if (value === null || value === undefined) return "-";

  if (typeof value === "boolean") {
    return value ? "✅" : "❌";
  }

  if (typeof value === "number") {
    const col = columnName?.toLowerCase() || "";

    // Devises (MAD, €, $)
    if (col.includes("prix") || col.includes("montant") || col.includes("salaire") ||
        col.includes("ca") || col.includes("benefice") || col.includes("depense") ||
        col.includes("dette") || col.includes("credit") || col.includes("cout")) {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "MAD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }

    // Pourcentages
    if (col.includes("taux") || col.includes("pourcent") || col.includes("ratio")) {
      return `${value.toFixed(1)}%`;
    }

    // Quantités
    if (col.includes("stock") || col.includes("quantite") || col.includes("nombre")) {
      return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
    }

    // Heures
    if (col.includes("heure")) {
      return `${value.toFixed(1)}h`;
    }

    // Jours
    if (col.includes("jour")) {
      return `${value} ${value > 1 ? "jours" : "jour"}`;
    }

    // Nombres par défaut
    if (Number.isInteger(value)) return value.toLocaleString("fr-FR");
    return value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (typeof value === "string") {
    // Formater les dates si détectées
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

    // Capitaliser les statuts
    const lower = value.toLowerCase();
    if (lower === "actif" || lower === "active") return "✅ Actif";
    if (lower === "inactif" || lower === "inactive") return "❌ Inactif";
    if (lower === "en attente" || lower === "pending") return "⏳ En attente";
    if (lower === "approuvé" || lower === "approved") return "✅ Approuvé";
    if (lower === "rejeté" || lower === "rejected") return "❌ Rejeté";
    if (lower === "payé" || lower === "paid") return "✅ Payé";
    if (lower === "impayé" || lower === "unpaid") return "⚠️ Impayé";

    return value;
  }

  return String(value);
}

function formatStatValue(value: unknown, key?: string): string {
  if (typeof value === "number") {
    const k = key?.toLowerCase() || "";

    // Devises
    if (k.includes("montant") || k.includes("prix") || k.includes("ca") ||
        k.includes("benefice") || k.includes("salaire") || k.includes("depense") ||
        k.includes("dette") || k.includes("credit")) {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M MAD`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k MAD`;
      }
      return `${value.toLocaleString("fr-FR")} MAD`;
    }

    // Pourcentages
    if (k.includes("taux") || k.includes("pourcent")) {
      return `${value.toFixed(1)}%`;
    }

    // Grandes valeurs
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "k";

    return value.toLocaleString("fr-FR");
  }
  return String(value);
}

// Fonction pour déterminer le meilleur type de graphique
function getBestChartType(data: Record<string, unknown>[], toolName: string): string {
  if (data.length === 0) return "none";

  const keys = Object.keys(data[0]);
  const hasDateField = keys.some(k => k.includes("date") || k.includes("periode") || k.includes("mois"));
  const hasMultipleNumeric = keys.filter(k => typeof data[0][k] === "number").length >= 2;

  // Tendances temporelles → Ligne ou Aire
  if (hasDateField && data.length >= 3) {
    return hasMultipleNumeric ? "area" : "line";
  }

  // Comparaisons entre catégories → Barres
  if (toolName.includes("top") || toolName.includes("plus") || toolName.includes("classement")) {
    return "bar";
  }

  // Multiples métriques → Comparaison (Barres + Lignes)
  if (hasMultipleNumeric && data.length >= 3) {
    return "comparison";
  }

  // Par défaut → Barres
  return "bar";
}

// Composant principal amélioré
export function ChatDataDisplay({ toolResults, className }: ChatDataDisplayProps) {
  if (!toolResults || toolResults.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {toolResults.map((result, idx) => {
        if (!result.success || !result.data) {
          return result.error ? (
            <div key={idx} className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/20">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{result.error}</span>
            </div>
          ) : null;
        }

        const data = result.data;
        const toolName = result.tool.replace(/_/g, " ");

        // === DONNÉES DE TYPE LISTE ===
        if (Array.isArray(data) && data.length > 0) {
          const hasNumericData = Object.values(data[0]).some(
            (v) => typeof v === "number"
          );

          // Déterminer le meilleur graphique
          const chartType = getBestChartType(data, toolName);

          return (
            <div key={idx} className="space-y-3">
              {/* Tableau de données */}
              <DataTable data={data} title={`📊 ${toolName}`} />

              {/* Graphiques selon le type de données */}
              {hasNumericData && data.length > 1 && (
                <>
                  {chartType === "line" && (
                    <LineChartDisplay data={data} title="📈 Évolution" />
                  )}
                  {chartType === "area" && (
                    <AreaChartDisplay data={data} title="📈 Évolution empilée" />
                  )}
                  {chartType === "bar" && (
                    <BarChartDisplay data={data} title="📊 Comparaison" />
                  )}
                  {chartType === "comparison" && (
                    <ComparisonChartDisplay data={data} title="🔀 Analyse comparative" />
                  )}
                </>
              )}
            </div>
          );
        }

        // === DONNÉES DE TYPE OBJET (STATISTIQUES) ===
        else if (typeof data === "object" && data !== null) {
          const entries = Object.entries(data);
          const numericValues = entries.filter(([, v]) => typeof v === "number").length;
          const hasNestedArrays = entries.some(([, v]) => Array.isArray(v));

          return (
            <div key={idx} className="space-y-3">
              {/* Cartes de statistiques */}
              {!hasNestedArrays && (
                <StatsCards data={data as Record<string, unknown>} title={`📈 ${toolName}`} />
              )}

              {/* Graphique circulaire pour répartitions */}
              {numericValues >= 3 && numericValues <= 6 && !hasNestedArrays && (
                <PieChartDisplay data={data as Record<string, unknown>} title="📊 Répartition" />
              )}

              {/* Gestion des objets avec tableaux imbriqués */}
              {hasNestedArrays && entries.map(([key, value]) => {
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
                  return (
                    <div key={key}>
                      <DataTable data={value} title={`📋 ${key.replace(/_/g, " ")}`} />
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
