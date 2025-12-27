"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getCreditSales, getCreditSalesSummary, sendCreditReminder } from "@/lib/services/inventory";
import type { CreditSale, CreditSaleSummary } from "@/lib/types/inventory";
import {
  Search,
  AlertTriangle,
  CreditCard,
  Calendar,
  Eye,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Keyboard,
  X,
  TrendingUp,
  Users,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CreditSalesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [summary, setSummary] = useState<CreditSaleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterOverdue, setFilterOverdue] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [reminderLoading, setReminderLoading] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    loadData();
  }, [slug, filterStatus, filterOverdue]);

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

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCreditSales.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter" && selectedIndex >= 0) {
        const credit = filteredCreditSales[selectedIndex];
        if (credit) {
          router.push(`/apps/${slug}/inventory/credit-sales/${credit.id}`);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slug, router, showShortcuts, selectedIndex]);

  useEffect(() => {
    if (selectedIndex >= 0 && tableRef.current) {
      const rows = tableRef.current.querySelectorAll("tr");
      rows[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [creditsData, summaryData] = await Promise.all([
        getCreditSales({ status: filterStatus, overdue: filterOverdue || undefined }),
        getCreditSalesSummary(),
      ]);
      setCreditSales(creditsData);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des ventes à crédit");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (id: string) => {
    try {
      setReminderLoading(id);
      await sendCreditReminder(id);
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi du rappel");
    } finally {
      setReminderLoading(null);
    }
  };

  const filteredCreditSales = creditSales.filter((credit) =>
    searchTerm === ""
      ? true
      : credit.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />;
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
      case "overdue":
        return "error";
      default:
        return "default";
    }
  };

  const getDaysColor = (days: number | undefined) => {
    if (days === undefined) return "";
    if (days < 0) return "text-red-600 font-bold";
    if (days <= 7) return "text-orange-600";
    return "text-green-600";
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
              <ShortcutItem keys={["↑", "↓"]} description="Naviguer" />
              <ShortcutItem keys={["Enter"]} description="Voir le détail" />
              <ShortcutItem keys={["Esc"]} description="Annuler" />
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ventes à crédit</h1>
          <p className="text-muted-foreground mt-1">
            Suivi des créances et paiements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)}>
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crédit total</p>
                <p className="text-xl font-bold">{formatCurrency(summary.total_credit)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-red-200 dark:border-red-900">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En retard</p>
                <p className="text-xl font-bold text-red-600">
                  {summary.overdue_count} ({formatCurrency(summary.overdue_amount)})
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-orange-200 dark:border-orange-900">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Échéance proche (7j)</p>
                <p className="text-xl font-bold text-orange-600">{summary.due_soon_count}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clients concernés</p>
                <p className="text-xl font-bold">{summary.by_customer.length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Top Debtors */}
      {summary && summary.by_customer.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top créanciers
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {summary.by_customer.slice(0, 5).map((customer, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-muted/50 text-center"
              >
                <p className="text-sm text-muted-foreground truncate">
                  {customer.customer__name}
                </p>
                <p className="font-bold text-lg text-orange-600">{formatCurrency(customer.total)}</p>
                <p className="text-xs text-muted-foreground">{customer.count} crédit(s)</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par numéro de vente ou client..."
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
              variant={!filterStatus && !filterOverdue ? "default" : "outline"}
              onClick={() => { setFilterStatus(undefined); setFilterOverdue(false); }}
              size="sm"
            >
              Tous
            </Button>
            <Button
              variant={filterOverdue ? "destructive" : "outline"}
              onClick={() => { setFilterOverdue(!filterOverdue); setFilterStatus(undefined); }}
              size="sm"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              En retard
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              onClick={() => { setFilterStatus(filterStatus === "pending" ? undefined : "pending"); setFilterOverdue(false); }}
              size="sm"
            >
              En attente
            </Button>
            <Button
              variant={filterStatus === "partial" ? "default" : "outline"}
              onClick={() => { setFilterStatus(filterStatus === "partial" ? undefined : "partial"); setFilterOverdue(false); }}
              size="sm"
            >
              Partiels
            </Button>
            <Button
              variant={filterStatus === "paid" ? "default" : "outline"}
              onClick={() => { setFilterStatus(filterStatus === "paid" ? undefined : "paid"); setFilterOverdue(false); }}
              size="sm"
            >
              Soldés
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

      {/* Credit Sales List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Vente</th>
                <th className="text-left p-4 font-medium">Client</th>
                <th className="text-right p-4 font-medium">Total</th>
                <th className="text-right p-4 font-medium">Payé</th>
                <th className="text-right p-4 font-medium">Reste</th>
                <th className="text-left p-4 font-medium">Échéance</th>
                <th className="text-center p-4 font-medium">Statut</th>
                <th className="text-center p-4 font-medium">Rappels</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredCreditSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune vente à crédit trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredCreditSales.map((credit, index) => (
                  <tr
                    key={credit.id}
                    className={cn(
                      "border-b transition-colors cursor-pointer",
                      selectedIndex === index
                        ? "bg-primary/10 ring-2 ring-primary ring-inset"
                        : "hover:bg-muted/50",
                      credit.is_overdue && "bg-red-50 dark:bg-red-950/20"
                    )}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => router.push(`/apps/${slug}/inventory/credit-sales/${credit.id}`)}
                    tabIndex={0}
                  >
                    <td className="p-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {credit.sale_number}
                      </code>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{credit.customer_name}</div>
                      {credit.customer_phone && (
                        <p className="text-sm text-muted-foreground">{credit.customer_phone}</p>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold">
                      {formatCurrency(credit.total_amount)}
                    </td>
                    <td className="p-4 text-right text-green-600">
                      {formatCurrency(credit.paid_amount)}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-orange-600">
                        {formatCurrency(credit.remaining_amount)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span>{new Date(credit.due_date).toLocaleDateString("fr-FR")}</span>
                          <p className={cn("text-xs", getDaysColor(credit.days_until_due))}>
                            {credit.days_until_due !== undefined && (
                              credit.days_until_due < 0
                                ? `${Math.abs(credit.days_until_due)} jour(s) de retard`
                                : credit.days_until_due === 0
                                ? "Échéance aujourd'hui"
                                : `${credit.days_until_due} jour(s) restant(s)`
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(credit.status)}
                        <Badge variant={getStatusVariant(credit.status)}>
                          {credit.status_display}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="default">
                        {credit.reminder_count || 0}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/credit-sales/${credit.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {credit.status !== "paid" && credit.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendReminder(credit.id);
                            }}
                            disabled={reminderLoading === credit.id}
                          >
                            {reminderLoading === credit.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {credit.status !== "paid" && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/apps/${slug}/inventory/credit-sales/${credit.id}/payment`}>
                              <Banknote className="h-4 w-4 text-green-600" />
                            </Link>
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
        <p>Total: {filteredCreditSales.length} crédit(s)</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-red-600" />
            {creditSales.filter((c) => c.is_overdue).length} en retard
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-orange-600" />
            {creditSales.filter((c) => c.status === "partial").length} partiels
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            {creditSales.filter((c) => c.status === "paid").length} soldés
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
