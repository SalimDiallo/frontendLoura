"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getSales, cancelSale } from "@/lib/services/inventory";
import type { SaleList } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  Eye,
  FileText,
  Ban,
  Keyboard,
  X,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SalesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [sales, setSales] = useState<SaleList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    loadSales();
  }, [slug, filterStatus]);

  // Keyboard shortcuts
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
        if (cancelConfirmId) {
          setCancelConfirmId(null);
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

      if ((e.ctrlKey && e.key === "k") || e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        router.push(`/apps/${slug}/inventory/sales/quick`);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredSales.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter" && selectedIndex >= 0) {
        const sale = filteredSales[selectedIndex];
        if (sale) {
          router.push(`/apps/${slug}/inventory/sales/${sale.id}`);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slug, router, showShortcuts, selectedIndex, cancelConfirmId]);

  useEffect(() => {
    if (selectedIndex >= 0 && tableRef.current) {
      const rows = tableRef.current.querySelectorAll("tr");
      rows[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSales({ payment_status: filterStatus });
      setSales(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des ventes");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelSale(id);
      setCancelConfirmId(null);
      loadSales();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'annulation");
    }
  };

  const filteredSales = sales.filter((sale) =>
    searchTerm === ""
      ? true
      : sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "partial":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "paid":
        return "success";
      case "partial":
        return "warning";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const totalSales = filteredSales.reduce((acc, s) => acc + s.total_amount, 0);
  const totalPaid = filteredSales.reduce((acc, s) => acc + s.paid_amount, 0);
  const totalRemaining = totalSales - totalPaid;

  return (
    <div className="space-y-6 p-6">
      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowShortcuts(false)}
        >
          <Card className="w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Raccourcis clavier
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <ShortcutItem keys={["Ctrl", "K"]} description="Rechercher" />
              <ShortcutItem keys={["N"]} description="Caisse Express" />
              <ShortcutItem keys={["↑", "↓"]} description="Naviguer" />
              <ShortcutItem keys={["Enter"]} description="Voir le détail" />
              <ShortcutItem keys={["Esc"]} description="Annuler" />
            </div>
          </Card>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Annuler la vente</h2>
            <p className="text-muted-foreground mb-6">
              Êtes-vous sûr de vouloir annuler cette vente ? Le stock sera restauré.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCancelConfirmId(null)}>
                Non, garder
              </Button>
              <Button variant="destructive" onClick={() => handleCancel(cancelConfirmId)}>
                Oui, annuler
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ventes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos ventes et remises
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)}>
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/inventory/sales/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Mode avancé
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg">
            <Link href={`/apps/${slug}/inventory/sales/quick`}>
              <Zap className="mr-2 h-4 w-4" />
              Caisse Express
              <kbd className="ml-2 hidden sm:inline-flex h-5 items-center rounded border border-white/30 bg-white/20 px-1.5 font-mono text-xs">
                N
              </kbd>
            </Link>
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
                placeholder="Rechercher par numéro ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-20"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === undefined ? "default" : "outline"}
              onClick={() => setFilterStatus(undefined)}
              size="sm"
            >
              Tous
            </Button>
            <Button
              variant={filterStatus === "paid" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "paid" ? undefined : "paid")}
              size="sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Payées
            </Button>
            <Button
              variant={filterStatus === "partial" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "partial" ? undefined : "partial")}
              size="sm"
            >
              <Clock className="mr-2 h-4 w-4" />
              Partielles
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "pending" ? undefined : "pending")}
              size="sm"
            >
              <Clock className="mr-2 h-4 w-4" />
              En attente
            </Button>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total ventes</p>
              <p className="text-2xl font-bold">{filteredSales.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="text-xl font-bold">{formatCurrency(totalSales)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payé</p>
              <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
              <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reste à payer</p>
              <p className="text-xl font-bold">{formatCurrency(totalRemaining)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sales List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">N° Vente</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Client</th>
                <th className="text-left p-4 font-medium">Entrepôt</th>
                <th className="text-right p-4 font-medium">Total</th>
                <th className="text-right p-4 font-medium">Payé</th>
                <th className="text-center p-4 font-medium">Statut</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune vente trouvée</p>
                    <p className="text-sm mt-2">
                      Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour créer une vente
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale, index) => (
                  <tr
                    key={sale.id}
                    className={cn(
                      "border-b transition-colors cursor-pointer",
                      selectedIndex === index
                        ? "bg-primary/10 ring-2 ring-primary ring-inset"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => router.push(`/apps/${slug}/inventory/sales/${sale.id}`)}
                    tabIndex={0}
                  >
                    <td className="p-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {sale.sale_number}
                      </code>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(sale.sale_date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{sale.customer_name || "Client anonyme"}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {sale.warehouse_name || "-"}
                    </td>
                    <td className="p-4 text-right font-bold">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="p-4 text-right">
                      <span className={cn(
                        sale.paid_amount >= sale.total_amount && "text-green-600",
                        sale.paid_amount > 0 && sale.paid_amount < sale.total_amount && "text-orange-600"
                      )}>
                        {formatCurrency(sale.paid_amount)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(sale.payment_status)}
                        <Badge variant={getStatusVariant(sale.payment_status)}>
                          {sale.payment_status_display}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/sales/${sale.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/sales/${sale.id}/receipt`}>
                            <FileText className="h-4 w-4" />
                          </Link>
                        </Button>
                        {sale.payment_status !== "paid" && sale.payment_status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelConfirmId(sale.id);
                            }}
                          >
                            <Ban className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
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
        <p>Total: {filteredSales.length} vente(s)</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            {sales.filter((s) => s.payment_status === "paid").length} payées
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-orange-600" />
            {sales.filter((s) => s.payment_status === "partial").length} partielles
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-yellow-600" />
            {sales.filter((s) => s.payment_status === "pending").length} en attente
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Appuyez sur <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">?</kbd> pour voir tous les raccourcis clavier
      </p>
    </div>
  );
}

function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd key={i} className="px-2 py-1 rounded border bg-muted font-mono text-xs min-w-[24px] text-center">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
