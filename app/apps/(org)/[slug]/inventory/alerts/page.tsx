"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert as AlertUI, Badge, Card, Input } from "@/components/ui";
import { getAlerts, resolveAlert, generateAlerts } from "@/lib/services/inventory";
import type { Alert, AlertSeverity, AlertType } from "@/lib/types/inventory";
import {
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
  Calendar,
  Package,
  TrendingDown,
  Clock,
  XCircle,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, KeyboardHint } from "@/components/ui/shortcuts-help";

export default function AlertsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string | undefined>(undefined);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [showResolved, setShowResolved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAlerts();
  }, [slug, filterSeverity, filterType, showResolved]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { is_resolved: showResolved };
      if (filterSeverity) params.severity = filterSeverity;
      if (filterType) params.type = filterType;
      const data = await getAlerts(params);
      setAlerts(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    if (!confirm("Marquer cette alerte comme résolue ?")) return;
    try {
      await resolveAlert(id);
      await loadAlerts();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la résolution");
    }
  };

  const handleGenerate = async () => {
    if (!confirm("Générer automatiquement les alertes de stock ?")) return;
    try {
      setGenerating(true);
      const result = await generateAlerts();
      alert(`${result.count} alerte(s) générée(s)`);
      await loadAlerts();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const filteredAlerts = alerts.filter((alert) =>
    searchTerm === ""
      ? true
      : alert.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Définir les raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.help(() => setShowShortcuts(true)),
    commonShortcuts.escape(() => {
      if (showShortcuts) {
        setShowShortcuts(false);
      } else if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearchTerm("");
      } else {
        setSelectedIndex(-1);
      }
    }),
    commonShortcuts.arrowDown(() => {
      setSelectedIndex((prev) => Math.min(prev + 1, filteredAlerts.length - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    { key: "g", action: handleGenerate, description: "Générer les alertes" },
    { key: "r", action: () => {
      if (selectedIndex >= 0 && filteredAlerts[selectedIndex] && !filteredAlerts[selectedIndex].is_resolved) {
        handleResolve(filteredAlerts[selectedIndex].id);
      }
    }, description: "Résoudre l'alerte sélectionnée" },
    { key: "t", action: () => setShowResolved(!showResolved), description: "Basculer actives/résolues" },
    commonShortcuts.filter("1", () => setFilterSeverity(undefined), "Toutes les sévérités"),
    commonShortcuts.filter("2", () => setFilterSeverity(filterSeverity === "critical" ? undefined : "critical"), "Critiques"),
    commonShortcuts.filter("3", () => setFilterSeverity(filterSeverity === "high" ? undefined : "high"), "Élevées"),
    commonShortcuts.filter("4", () => setFilterType(filterType === "low_stock" ? undefined : "low_stock"), "Stock faible"),
    commonShortcuts.filter("5", () => setFilterType(filterType === "out_of_stock" ? undefined : "out_of_stock"), "Rupture"),
  ], [slug, router, showShortcuts, selectedIndex, filteredAlerts, filterSeverity, filterType, showResolved]);

  useKeyboardShortcuts({ shortcuts });

  const getSeverityBadge = (severity: AlertSeverity) => {
    const config: Record<AlertSeverity, { variant: "default" | "destructive" | "secondary"; icon: any; label: string }> = {
      low: { variant: "secondary", icon: <Info className="h-3 w-3" />, label: "Faible" },
      medium: { variant: "default", icon: <AlertCircle className="h-3 w-3" />, label: "Moyenne" },
      high: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" />, label: "Élevée" },
      critical: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" />, label: "Critique" },
    };

    const { variant, icon, label } = config[severity] || config.low;

    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        {icon}
        {label}
      </Badge>
    );
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "low_stock":
        return <TrendingDown className="h-5 w-5 text-orange-600" />;
      case "out_of_stock":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "expiring_soon":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "expired":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertTypeLabel = (type: AlertType) => {
    const labels: Record<AlertType, string> = {
      low_stock: "Stock faible",
      out_of_stock: "Rupture de stock",
      expiring_soon: "Expire bientôt",
      expired: "Expiré",
      other: "Autre",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Chargement">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Modal des raccourcis */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Alertes"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alertes de stock</h1>
          <p className="text-muted-foreground mt-1">
            Surveillez et gérez les alertes de votre inventaire
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            aria-label="Afficher les raccourcis clavier"
            title="Raccourcis clavier (?)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            <RefreshCw className={cn("mr-2 h-4 w-4", generating && "animate-spin")} />
            Générer les alertes
            <kbd className="ml-2 hidden sm:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">G</kbd>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par produit ou message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-20"
                aria-label="Rechercher des alertes"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrer les alertes">
            <Button
              variant={showResolved ? "outline" : "default"}
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
              aria-pressed={!showResolved}
            >
              {showResolved ? "Résolues" : "Actives"}
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">T</kbd>
            </Button>
            <Button
              variant={filterSeverity === "critical" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSeverity(filterSeverity === "critical" ? undefined : "critical")}
              aria-pressed={filterSeverity === "critical"}
            >
              Critiques
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">2</kbd>
            </Button>
            <Button
              variant={filterSeverity === "high" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSeverity(filterSeverity === "high" ? undefined : "high")}
              aria-pressed={filterSeverity === "high"}
            >
              Élevées
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">3</kbd>
            </Button>
            <Button
              variant={filterType === "low_stock" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(filterType === "low_stock" ? undefined : "low_stock")}
              aria-pressed={filterType === "low_stock"}
            >
              Stock faible
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">4</kbd>
            </Button>
            <Button
              variant={filterType === "out_of_stock" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(filterType === "out_of_stock" ? undefined : "out_of_stock")}
              aria-pressed={filterType === "out_of_stock"}
            >
              Rupture
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">5</kbd>
            </Button>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <AlertUI variant="error" title="Erreur" role="alert">
          {error}
        </AlertUI>
      )}

      {/* Alerts List */}
      <div className="space-y-4" role="list" aria-label="Liste des alertes">
        {filteredAlerts.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" aria-hidden="true" />
            <p className="text-muted-foreground">
              {showResolved ? "Aucune alerte résolue" : "Aucune alerte active"}
            </p>
          </Card>
        ) : (
          filteredAlerts.map((alert, index) => (
            <Card
              key={alert.id}
              className={cn(
                "p-6 transition-all cursor-pointer",
                alert.is_resolved && "opacity-60 bg-muted/30",
                alert.severity === "critical" && !alert.is_resolved && "border-red-500 border-2",
                selectedIndex === index && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedIndex(index)}
              tabIndex={0}
              role="listitem"
              aria-selected={selectedIndex === index}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn(
                    "p-3 rounded-lg",
                    alert.severity === "critical" && "bg-red-100",
                    alert.severity === "high" && "bg-orange-100",
                    alert.severity === "medium" && "bg-yellow-100",
                    alert.severity === "low" && "bg-blue-100"
                  )}>
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getSeverityBadge(alert.severity)}
                      <Badge variant="outline">{getAlertTypeLabel(alert.alert_type)}</Badge>
                      {alert.is_resolved && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Résolue
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{alert.message}</h3>
                    {alert.product_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Package className="h-4 w-4" />
                        <span>{alert.product_name}</span>
                        {alert.product_sku && (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                            {alert.product_sku}
                          </code>
                        )}
                      </div>
                    )}
                    {alert.warehouse_name && (
                      <p className="text-sm text-muted-foreground">
                        Entrepôt: {alert.warehouse_name}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Créée: {new Date(alert.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {alert.resolved_at && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>
                            Résolue: {new Date(alert.resolved_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {!alert.is_resolved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolve(alert.id);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Résoudre
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Total: {filteredAlerts.length} alerte(s)</p>
        <div className="flex gap-4">
          <span>{alerts.filter(a => !a.is_resolved && a.severity === 'critical').length} critiques</span>
          <span>{alerts.filter(a => !a.is_resolved && a.severity === 'high').length} élevées</span>
          <span>{alerts.filter(a => a.is_resolved).length} résolues</span>
        </div>
      </div>

      {/* Hint */}
      <KeyboardHint />
    </div>
  );
}
