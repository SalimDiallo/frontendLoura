"use client";

import { Can } from "@/components/apps/common/protected-route";
import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PDFPreviewWrapper } from "@/components/ui/pdf-preview";
import { usePDF } from "@/lib/hooks/usePDF";
import { cancelSale, getSales } from "@/lib/services/inventory";
import type { SaleList } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye as EyeIcon,
  FileText,
  Keyboard,
  Plus,
  Search,
  ShoppingCart,
  Truck,
  X,
  XCircle,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
          <h1 className="text-3xl font-bold tracking-tight">Ventes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos ventes et remises
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(true)} className="h-9">
            <Keyboard className="h-4 w-4" />
          </Button>
          <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_SALES}>
            <Button variant="outline" size="sm" asChild className="h-9">
              <Link href={`/apps/${slug}/inventory/sales/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Avancé
              </Link>
            </Button>
            <Button size="sm" asChild className="h-9 bg-emerald-600 hover:bg-emerald-700">
              <Link href={`/apps/${slug}/inventory/sales/quick`}>
                <Zap className="mr-2 h-4 w-4" />
                Caisse Express
                <kbd className="ml-2 hidden sm:inline-flex h-5 items-center rounded border border-white/30 bg-white/20 px-1.5 font-mono text-[10px]">
                  N
                </kbd>
              </Link>
            </Button>
          </Can>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par numéro ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-20 h-10"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === undefined ? "default" : "outline"}
              onClick={() => setFilterStatus(undefined)}
              size="sm"
              className="h-10 px-4"
            >
              Tous
            </Button>
            <Button
              variant={filterStatus === "paid" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "paid" ? undefined : "paid")}
              size="sm"
              className="h-10 px-4"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Payées
            </Button>
            <Button
              variant={filterStatus === "partial" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "partial" ? undefined : "partial")}
              size="sm"
              className="h-10 px-4"
            >
              <Clock className="mr-2 h-4 w-4" />
              Partielles
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              onClick={() => setFilterStatus(filterStatus === "pending" ? undefined : "pending")}
              size="sm"
              className="h-10 px-4"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-slate-500">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ventes</p>
            <p className="text-2xl font-bold">{filteredSales.length}</p>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold">{formatCurrency(totalSales)}</p>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payé</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reste</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totalRemaining)}</p>
          </div>
        </Card>
      </div>

      {/* Sales List */}
      <Card className="overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">N° Vente</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Client</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Entrepôt</th>
                <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Qté</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Total</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Payé</th>
                <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Statut</th>
                <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">Aucune vente trouvée</p>
                    <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_SALES}>
                      <p className="text-xs mt-2">
                        Appuyez sur <kbd className="px-2 py-1 rounded border bg-muted font-mono text-xs">N</kbd> pour créer une vente
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
                        ? "bg-primary/5 ring-1 ring-primary ring-inset"
                        : "hover:bg-muted/30"
                    )}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => router.push(`/apps/${slug}/inventory/sales/${sale.id}`)}
                    tabIndex={0}
                  >
                    <td className="px-4 py-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono font-semibold">
                        {sale.sale_number}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(sale.sale_date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium truncate max-w-[150px] block">{sale.customer_name || "Client anonyme"}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm hidden md:table-cell">
                      {sale.warehouse_name || "-"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {sale.item_count || 0}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-sm">
                      {formatCurrency(Number(sale.total_amount) || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span className={cn(
                        "font-medium",
                        (Number(sale.paid_amount) || 0) >= (Number(sale.total_amount) || 0) && "text-emerald-600",
                        (Number(sale.paid_amount) || 0) > 0 && (Number(sale.paid_amount) || 0) < (Number(sale.total_amount) || 0) && "text-orange-600"
                      )}>
                        {formatCurrency(Number(sale.paid_amount) || 0)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant={getStatusVariant(sale.payment_status)} className="text-xs px-2.5 py-1">
                        {sale.payment_status_display}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                          <Link href={`/apps/${slug}/inventory/sales/${sale.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="h-4 w-4 mr-1.5" />
                              <span className="text-xs font-medium">Documents</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Reçu</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                preview(
                                  `/inventory/sales/${sale.id}/receipt/`,
                                  `Reçu - ${sale.sale_number}`,
                                  `Recu_${sale.sale_number}.pdf`
                                );
                              }}
                            >
                              <EyeIcon className="text-blue-600" />
                              Aperçu
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                download(
                                  `/inventory/sales/${sale.id}/receipt/`,
                                  `Recu_${sale.sale_number}.pdf`
                                );
                              }}
                            >
                              <Download className="text-emerald-600" />
                              Télécharger
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuLabel>Facture</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                preview(
                                  `/inventory/sales/${sale.id}/invoice/`,
                                  `Facture - ${sale.sale_number}`,
                                  `Facture_${sale.sale_number}.pdf`
                                );
                              }}
                            >
                              <EyeIcon className="text-blue-600" />
                              Aperçu
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                download(
                                  `/inventory/sales/${sale.id}/invoice/`,
                                  `Facture_${sale.sale_number}.pdf`
                                );
                              }}
                            >
                              <Download className="text-emerald-600" />
                              Télécharger
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild>
                              <Link
                                href={`/apps/${slug}/inventory/documents/delivery-notes/new?sale=${sale.id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Truck className="text-blue-600" />
                                <span className="text-blue-600 font-medium">Bon de livraison</span>
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {sale.payment_status !== "paid" && sale.payment_status !== "cancelled" && (
                          <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_SALES}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 hover:bg-red-50 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelConfirmId(sale.id);
                              }}
                            >
                              <Ban className="h-4 w-4" />
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
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold">{filteredSales.length} vente(s)</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="text-muted-foreground">{sales.filter((s) => s.payment_status === "paid").length} payées</span>
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <span className="text-muted-foreground">{sales.filter((s) => s.payment_status === "partial").length} partielles</span>
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              <span className="text-muted-foreground">{sales.filter((s) => s.payment_status === "pending").length} en attente</span>
            </span>
          </div>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        <kbd className="px-2 py-1 rounded border bg-muted font-mono text-xs">?</kbd> pour voir les raccourcis clavier
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
