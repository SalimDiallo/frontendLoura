"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Badge, Card, Input } from "@/components/ui";
import { getAlerts, resolveAlert, generateAlerts } from "@/lib/services/inventory";
import type { Alert } from "@/lib/types/inventory";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Package,
  XCircle,
  TrendingDown,
  Filter,
  Bell,
  BellOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AlertsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [showResolved]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAlerts({ is_resolved: showResolved });
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert(id);
      setSuccessMessage("Alerte résolue !");
      setTimeout(() => setSuccessMessage(null), 2000);
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const result = await generateAlerts();
      setSuccessMessage(`${result.created} créée(s), ${result.resolved} résolue(s)`);
      setTimeout(() => setSuccessMessage(null), 3000);
      loadAlerts();
    } catch (err) {
      console.error(err);
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

  const criticalCount = alerts.filter(a => a.severity === "critical" && !a.is_resolved).length;
  const highCount = alerts.filter(a => a.severity === "high" && !a.is_resolved).length;

  const getAlertStyle = (alert: Alert) => {
    if (alert.is_resolved) return "bg-muted/30 border-muted";
    if (alert.alert_type === "out_of_stock") return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
    if (alert.severity === "critical") return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
    if (alert.severity === "high") return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900";
    return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900";
  };

  const getAlertIcon = (alert: Alert) => {
    if (alert.alert_type === "out_of_stock") {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <TrendingDown className="h-5 w-5 text-orange-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-3 text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Alertes de stock
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {showResolved ? "Alertes résolues" : `${alerts.length} alerte(s) active(s)`}
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} size="sm">
          <RefreshCw className={cn("h-4 w-4 mr-2", generating && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      {!showResolved && (
        <div className="flex gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium">
              <XCircle className="h-4 w-4" />
              {criticalCount} rupture(s)
            </div>
          )}
          {highCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium">
              <TrendingDown className="h-4 w-4" />
              {highCount} stock(s) faible(s)
            </div>
          )}
          {criticalCount === 0 && highCount === 0 && alerts.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Aucune alerte
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button
          variant={showResolved ? "default" : "outline"}
          size="sm"
          onClick={() => setShowResolved(!showResolved)}
          className="gap-2"
        >
          {showResolved ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {showResolved ? "Résolues" : "Actives"}
        </Button>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Tout est en ordre !</h3>
            <p className="text-muted-foreground text-sm">
              {showResolved ? "Aucune alerte résolue" : "Aucune alerte active"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "p-4 rounded-lg border transition-all",
                getAlertStyle(alert),
                alert.is_resolved && "opacity-60"
              )}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  alert.is_resolved ? "bg-muted" : 
                  alert.alert_type === "out_of_stock" ? "bg-red-100 dark:bg-red-900/50" :
                  "bg-orange-100 dark:bg-orange-900/50"
                )}>
                  {alert.is_resolved ? (
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    getAlertIcon(alert)
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      alert.alert_type === "out_of_stock" 
                        ? "bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200"
                        : "bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200"
                    )}>
                      {alert.alert_type === "out_of_stock" ? "Rupture" : "Stock faible"}
                    </span>
                    {alert.is_resolved && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200">
                        Résolue
                      </span>
                    )}
                  </div>
                  <p className="font-medium truncate">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {alert.product_name && (
                      <Link 
                        href={`/apps/${slug}/inventory/products/${alert.product}`}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Package className="h-3 w-3" />
                        {alert.product_name}
                      </Link>
                    )}
                    <span>
                      {new Date(alert.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

                {/* Action */}
                {!alert.is_resolved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(alert.id)}
                    className="flex-shrink-0"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Résoudre
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        Les alertes sont générées automatiquement quand le stock descend en dessous du seuil défini
      </div>
    </div>
  );
}
