"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getSales, cancelSale, getSaleReceiptUrl, getSaleInvoiceUrl } from "@/lib/services/inventory";
import type { SaleList } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  Eye as EyeIcon,
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
  MoreVertical,
  Download,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { Can } from "@/components/apps/common/protected-route";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { usePDF } from "@/lib/hooks/usePDF";
import { PDFPreviewWrapper } from "@/components/ui/pdf-preview";

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  const { preview, download, previewState, closePreview } = usePDF();

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
      <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES} showMessage={true}>
        <div className="flex items-center justify-center h-96" role="status">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </Can>
    );
  }

  const totalSales = filteredSales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
  const totalPaid = filteredSales.reduce((acc, s) => acc + (Number(s.paid_amount) || 0), 0);
  const totalRemaining = totalSales - totalPaid;

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES} showMessage={true}>
      <div className="space-y-4 p-4">
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
          <h1 className="text-2xl font-bold">Ventes</h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos ventes et remises
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)}>
            <Keyboard className="h-3.5 w-3.5" />
          </Button>
          <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_SALES}>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/apps/${slug}/inventory/sales/new`}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Avancé
              </Link>
            </Button>
            <Button size="sm" asChild className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg">
              <Link href={`/apps/${slug}/inventory/sales/quick`}>
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Caisse
                <kbd className="ml-1.5 hidden sm:inline-flex h-4 items-center rounded border border-white/30 bg-white/20 px-1 font-mono text-[10px]">
                  N
                </kbd>
              </Link>
            </Button>
          </Can>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-16 h-8 text-sm"
              />
              <kbd className="absolute right-2.5 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Button
              variant={filterStatus === undefined ? "default" : "outline"}
              onClick={() => setFilterStatus(undefined)}
              size="sm"
              className="h-8 text-xs px-2.5"
            >
              Tous
            </Button>
            <Button
              variant={filterStatus === "paid" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "paid" ? undefined : "paid")}
              size="sm"
              className="h-8 text-xs px-2.5"
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Payées
            </Button>
            <Button
              variant={filterStatus === "partial" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "partial" ? undefined : "partial")}
              size="sm"
              className="h-8 text-xs px-2.5"
            >
              <Clock className="mr-1 h-3 w-3" />
              Partielles
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "pending" ? undefined : "pending")}
              size="sm"
              className="h-8 text-xs px-2.5"
            >
              <Clock className="mr-1 h-3 w-3" />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900">
              <ShoppingCart className="h-4 w-4 text-foreground dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ventes</p>
              <p className="text-lg font-bold">{filteredSales.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900">
              <Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-base font-bold">{formatCurrency(totalSales)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payé</p>
              <p className="text-base font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900">
              <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reste</p>
              <p className="text-base font-bold text-orange-600">{formatCurrency(totalRemaining)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sales List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-xs">N° Vente</th>
                <th className="text-left px-3 py-2 font-medium text-xs">Date</th>
                <th className="text-left px-3 py-2 font-medium text-xs">Client</th>
                <th className="text-left px-3 py-2 font-medium text-xs hidden md:table-cell">Entrepôt</th>
                <th className="text-center px-2 py-2 font-medium text-xs">Qté</th>
                <th className="text-right px-3 py-2 font-medium text-xs">Total</th>
                <th className="text-right px-3 py-2 font-medium text-xs">Payé</th>
                <th className="text-center px-2 py-2 font-medium text-xs">Statut</th>
                <th className="text-center px-2 py-2 font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-6 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Aucune vente trouvée</p>
                    <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_SALES}>
                      <p className="text-xs mt-2">
                        Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour créer une vente
                      </p>
                    </Can>
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
                    <td className="px-3 py-2">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {sale.sale_number}
                      </code>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{new Date(sale.sale_date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-medium truncate max-w-[120px] block">{sale.customer_name || "Client anonyme"}</span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs hidden md:table-cell">
                      {sale.warehouse_name || "-"}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {sale.item_count || 0}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-xs">
                      {formatCurrency(Number(sale.total_amount) || 0)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      <span className={cn(
                        (Number(sale.paid_amount) || 0) >= (Number(sale.total_amount) || 0) && "text-green-600 font-medium",
                        (Number(sale.paid_amount) || 0) > 0 && (Number(sale.paid_amount) || 0) < (Number(sale.total_amount) || 0) && "text-orange-600"
                      )}>
                        {formatCurrency(Number(sale.paid_amount) || 0)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(sale.payment_status)}
                        <Badge variant={getStatusVariant(sale.payment_status)} className="text-[10px] px-1.5 py-0">
                          {sale.payment_status_display}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                          <Link href={`/apps/${slug}/inventory/sales/${sale.id}`}>
                            <EyeIcon className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === sale.id ? null : sale.id);
                            }}
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                          {openMenuId === sale.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                                <div className="py-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      preview(
                                        `/inventory/sales/${sale.id}/receipt/`,
                                        `Reçu - ${sale.sale_number}`,
                                        `Recu_${sale.sale_number}.pdf`
                                      );
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer w-full text-left"
                                  >
                                    <EyeIcon className="h-3.5 w-3.5" />
                                    Aperçu reçu
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      download(
                                        `/inventory/sales/${sale.id}/receipt/`,
                                        `Recu_${sale.sale_number}.pdf`
                                      );
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer w-full text-left"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    Télécharger reçu
                                  </button>
                                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      preview(
                                        `/inventory/sales/${sale.id}/invoice/`,
                                        `Facture - ${sale.sale_number}`,
                                        `Facture_${sale.sale_number}.pdf`
                                      );
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer w-full text-left"
                                  >
                                    <EyeIcon className="h-3.5 w-3.5" />
                                    Aperçu facture
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      download(
                                        `/inventory/sales/${sale.id}/invoice/`,
                                        `Facture_${sale.sale_number}.pdf`
                                      );
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer w-full text-left"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    Télécharger facture
                                  </button>
                                  <Link
                                    href={`/apps/${slug}/inventory/documents/delivery-notes/new?sale=${sale.id}`}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-t border-gray-200 dark:border-gray-700"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Truck className="h-3.5 w-3.5 text-blue-600" />
                                    Créer bon de livraison
                                  </Link>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        {sale.payment_status !== "paid" && sale.payment_status !== "cancelled" && (
                          <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_SALES}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelConfirmId(sale.id);
                              }}
                            >
                              <Ban className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </Can>
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
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>{filteredSales.length} vente(s)</p>
        <div className="flex gap-3">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            {sales.filter((s) => s.payment_status === "paid").length} payées
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-orange-600" />
            {sales.filter((s) => s.payment_status === "partial").length} partielles
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-yellow-600" />
            {sales.filter((s) => s.payment_status === "pending").length} en attente
          </span>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[9px]">?</kbd> raccourcis
      </p>

      {/* PDF Preview Modal */}
      <PDFPreviewWrapper
        previewState={previewState}
        onClose={closePreview}
      />
    </div>
    </Can>
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
