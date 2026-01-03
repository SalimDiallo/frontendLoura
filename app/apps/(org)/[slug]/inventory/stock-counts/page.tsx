"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getStockCounts, validateStockCount, cancelStockCount } from "@/lib/services/inventory";
import type { StockCount, StockCountStatus } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  AlertTriangle,
  Clipboard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Archive,
  Eye,
  Keyboard,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";

export default function StockCountsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    loadStockCounts();
  }, [slug, filterStatus]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        if (showShortcuts) {
          setShowShortcuts(false);
          return;
        }
        if (isInputFocused) {
          (document.activeElement as HTMLElement).blur();
          setSearchTerm("");
          return;
        }
        setSelectedIndex(-1);
        return;
      }

      if (isInputFocused) return;

      // Ctrl+K ou / - Focus sur la recherche
      if ((e.ctrlKey && e.key === "k") || e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // N - Nouveau
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        router.push(`/apps/${slug}/inventory/stock-counts/new`);
        return;
      }

      // 1-4 - Filtres rapides
      if (e.key === "1") {
        setFilterStatus(undefined);
        return;
      }
      if (e.key === "2") {
        setFilterStatus(filterStatus === "in_progress" ? undefined : "in_progress");
        return;
      }
      if (e.key === "3") {
        setFilterStatus(filterStatus === "completed" ? undefined : "completed");
        return;
      }
      if (e.key === "4") {
        setFilterStatus(filterStatus === "validated" ? undefined : "validated");
        return;
      }

      // ? - Afficher les raccourcis
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // Navigation avec flèches
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredStockCounts.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      // Enter - Ouvrir le détail
      if (e.key === "Enter" && selectedIndex >= 0) {
        const count = filteredStockCounts[selectedIndex];
        if (count) {
          router.push(`/apps/${slug}/inventory/stock-counts/${count.id}`);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slug, router, filterStatus, showShortcuts, selectedIndex]);

  // Scroll vers l'élément sélectionné
  useEffect(() => {
    if (selectedIndex >= 0 && tableRef.current) {
      const rows = tableRef.current.querySelectorAll("tr");
      rows[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const loadStockCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      const data = await getStockCounts(params);
      setStockCounts(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des inventaires");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id: string) => {
    if (!confirm("Valider cet inventaire ? Les ajustements seront appliqués au stock.")) return;
    try {
      await validateStockCount(id);
      await loadStockCounts();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la validation");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler cet inventaire ?")) return;
    try {
      await cancelStockCount(id);
      await loadStockCounts();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'annulation");
    }
  };

  const filteredStockCounts = stockCounts.filter((count) =>
    searchTerm === ""
      ? true
      : count.count_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        count.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: StockCountStatus) => {
    const variants: Record<string, { variant: "success" | "error" | "warning" | "info" | "default" | "outline"; icon: any; label: string }> = {
      planned: { variant: "outline", icon: <Clock className="h-3 w-3" aria-hidden="true" />, label: "Planifié" },
      draft: { variant: "outline", icon: <Clock className="h-3 w-3" aria-hidden="true" />, label: "Brouillon" },
      in_progress: { variant: "warning", icon: <Clock className="h-3 w-3" aria-hidden="true" />, label: "En cours" },
      completed: { variant: "info", icon: <CheckCircle className="h-3 w-3" aria-hidden="true" />, label: "Complété" },
      validated: { variant: "success", icon: <CheckCircle className="h-3 w-3" aria-hidden="true" />, label: "Validé" },
      cancelled: { variant: "error", icon: <XCircle className="h-3 w-3" aria-hidden="true" />, label: "Annulé" },
    };

    const config = variants[status] || variants.planned;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK} showMessage={true}>
        <div className="flex items-center justify-center h-96" role="status" aria-label="Chargement">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </Can>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK} showMessage={true}>
    <div className="space-y-6 p-6">
      {/* Modal des raccourcis */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowShortcuts(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <Card className="w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="shortcuts-title" className="text-xl font-bold flex items-center gap-2">
                <Keyboard className="h-5 w-5" aria-hidden="true" />
                Raccourcis clavier
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(false)} aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <ShortcutItem keys={["Ctrl", "K"]} description="Rechercher" />
              <ShortcutItem keys={["N"]} description="Nouvel inventaire" />
              <ShortcutItem keys={["1"]} description="Afficher tous" />
              <ShortcutItem keys={["2"]} description="Filtrer en cours" />
              <ShortcutItem keys={["3"]} description="Filtrer complétés" />
              <ShortcutItem keys={["4"]} description="Filtrer validés" />
              <ShortcutItem keys={["↑", "↓"]} description="Naviguer dans la liste" />
              <ShortcutItem keys={["Enter"]} description="Voir le détail" />
              <ShortcutItem keys={["Esc"]} description="Annuler / Fermer" />
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventaires physiques</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos comptages et ajustements de stock
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
          <Can permission={COMMON_PERMISSIONS.INVENTORY.ADJUST_STOCK}>
            <Button asChild>
              <Link href={`/apps/${slug}/inventory/stock-counts/new`}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Nouvel inventaire
                <kbd className="ml-2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                  N
                </kbd>
              </Link>
            </Button>
          </Can>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par numéro ou entrepôt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-20"
                aria-label="Rechercher des inventaires"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrer par statut">
            <Button
              variant={filterStatus === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(undefined)}
              aria-pressed={filterStatus === undefined}
            >
              Tous
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">1</kbd>
            </Button>
            <Button
              variant={filterStatus === "in_progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(filterStatus === "in_progress" ? undefined : "in_progress")}
              aria-pressed={filterStatus === "in_progress"}
            >
              En cours
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">2</kbd>
            </Button>
            <Button
              variant={filterStatus === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(filterStatus === "completed" ? undefined : "completed")}
              aria-pressed={filterStatus === "completed"}
            >
              Complétés
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">3</kbd>
            </Button>
            <Button
              variant={filterStatus === "validated" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(filterStatus === "validated" ? undefined : "validated")}
              aria-pressed={filterStatus === "validated"}
            >
              Validés
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">4</kbd>
            </Button>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" role="alert">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Stock Counts List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" role="grid" aria-label="Liste des inventaires">
            <thead>
              <tr className="border-b bg-muted/50">
                <th scope="col" className="text-left p-4 font-medium">Numéro</th>
                <th scope="col" className="text-left p-4 font-medium">Entrepôt</th>
                <th scope="col" className="text-left p-4 font-medium">Date</th>
                <th scope="col" className="text-left p-4 font-medium">Statut</th>
                <th scope="col" className="text-center p-4 font-medium">Articles</th>
                <th scope="col" className="text-center p-4 font-medium">Écarts</th>
                <th scope="col" className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredStockCounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    <Clipboard className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                    <p>Aucun inventaire trouvé</p>
                    <p className="text-sm mt-2">
                      Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour créer un nouvel inventaire
                    </p>
                    <Can permission={COMMON_PERMISSIONS.INVENTORY.ADJUST_STOCK}>
                      <div className="mt-4">
                         <Button asChild>
                          <Link href={`/apps/${slug}/inventory/stock-counts/new`}>
                            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                            Créer un inventaire
                          </Link>
                        </Button>
                      </div>
                    </Can>
                  </td>
                </tr>
              ) : (
                filteredStockCounts.map((count, index) => (
                  <tr
                    key={count.id}
                    className={cn(
                      "border-b transition-colors cursor-pointer",
                      selectedIndex === index
                        ? "bg-primary/10 ring-2 ring-primary ring-inset"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => router.push(`/apps/${slug}/inventory/stock-counts/${count.id}`)}
                    tabIndex={0}
                    role="row"
                    aria-selected={selectedIndex === index}
                  >
                    <td className="p-4">
                      <Link href={`/apps/${slug}/inventory/stock-counts/${count.id}`}>
                        <code className="text-sm bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors">
                          {count.count_number}
                        </code>
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span className="font-medium">{count.warehouse_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span>{new Date(count.count_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(count.status)}</td>
                    <td className="p-4 text-center">
                      <Badge variant="outline">{count.item_count || 0}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="outline">0</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Voir l'inventaire ${count.count_number}`}>
                          <Link href={`/apps/${slug}/inventory/stock-counts/${count.id}`}>
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                        <Can permission={COMMON_PERMISSIONS.INVENTORY.ADJUST_STOCK}>
                          {count.status === 'completed' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleValidate(count.id); }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                              Valider
                            </Button>
                          )}
                          {(count.status === 'planned' || count.status === 'in_progress') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleCancel(count.id); }}
                              aria-label={`Annuler l'inventaire ${count.count_number}`}
                            >
                              <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                            </Button>
                          )}
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Total: {filteredStockCounts.length} inventaire(s)</p>
        <div className="flex gap-4">
          <span>{stockCounts.filter(c => c.status === 'in_progress').length} en cours</span>
          <span>{stockCounts.filter(c => c.status === 'completed').length} complétés</span>
          <span>{stockCounts.filter(c => c.status === 'validated').length} validés</span>
        </div>
      </div>

      {/* Help */}
      <p className="text-center text-xs text-muted-foreground">
        Appuyez sur <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">?</kbd> pour voir tous les raccourcis clavier
      </p>
    </div>
    </Can>
  );
}

// Composant pour afficher un raccourci
function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 rounded border bg-muted font-mono text-xs min-w-[24px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
