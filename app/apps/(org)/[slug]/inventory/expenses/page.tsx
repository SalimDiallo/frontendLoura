"use client";

import { Can } from "@/components/apps/common";
import { Alert, Badge, Button, Card, Input, PDFPreviewWrapper } from "@/components/ui";
import { usePDF } from "@/lib/hooks";
import {
  deleteExpense,
  getExpenseCategories,
  getExpenses,
  getExpenseSummary
} from "@/lib/services/inventory";
import type { Expense, ExpenseCategory, ExpenseSummary } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  Calendar,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Keyboard,
  PieChart,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // PDF Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportCategory, setExportCategory] = useState<string>("");

  const { preview, download, previewState, closePreview } = usePDF({
    onError: (err) => setError(err),
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    loadData();
  }, [slug, filterCategory]);

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
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
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
        router.push(`/apps/${slug}/inventory/expenses/new`);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredExpenses.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter" && selectedIndex >= 0) {
        const expense = filteredExpenses[selectedIndex];
        if (expense) {
          router.push(`/apps/${slug}/inventory/expenses/${expense.id}`);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slug, router, showShortcuts, selectedIndex, deleteConfirmId, expenses]);

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
      const [expensesData, categoriesData, summaryData] = await Promise.all([
        getExpenses({ category: filterCategory }),
        getExpenseCategories(),
        getExpenseSummary(),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des dépenses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const filteredExpenses = expenses.filter((expense) =>
    searchTerm === ""
      ? true
      : expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.expense_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.beneficiary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80" role="status">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-xs text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
   <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_EXPENSES} showMessage>
       <div className="space-y-4 p-3 md:p-4">
      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowShortcuts(false)}
        >
          <Card className="w-full max-w-sm p-3 m-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Raccourcis clavier
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <ShortcutItem keys={["Ctrl", "K"]} description="Rechercher" />
              <ShortcutItem keys={["N"]} description="Nouvelle dépense" />
              <ShortcutItem keys={["↑", "↓"]} description="Naviguer" />
              <ShortcutItem keys={["Enter"]} description="Voir le détail" />
              <ShortcutItem keys={["Esc"]} description="Annuler" />
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Can permission={COMMON_PERMISSIONS.INVENTORY.DELETE_EXPENSES}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-sm p-3 m-2">
              <h2 className="text-lg font-bold mb-2">Confirmer la suppression</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                  Annuler
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirmId)}>
                  Supprimer
                </Button>
              </div>
            </Card>
          </div>
        </Can>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold leading-tight">Dépenses</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suivi et gestion des dépenses
          </p>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)}>
            <Keyboard className="h-3 w-3" />
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link href={`/apps/${slug}/inventory/expenses/categories`}>
              <PieChart className="mr-1 h-3 w-3" />
              <span className="hidden md:inline">Catégories</span>
            </Link>
          </Button>
          <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_EXPENSES}>
            <Button asChild size="sm">
              <Link href={`/apps/${slug}/inventory/expenses/new`}>
                <Plus className="mr-1 h-3 w-3" />
                <span>Nouvelle</span>
                <kbd className="ml-1 hidden sm:inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]">
                  N
                </kbd>
              </Link>
            </Button>
          </Can>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card className="p-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-4 w-4 text-foreground dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                <p className="text-base font-bold">{formatCurrency(summary.daily_total)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-orange-100 dark:bg-orange-900">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ce mois</p>
                <p className="text-base font-bold">{formatCurrency(summary.monthly_total)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-red-100 dark:bg-red-900">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cette année</p>
                <p className="text-base font-bold">{formatCurrency(summary.yearly_total)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Receipt className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nb. dépenses</p>
                <p className="text-base font-bold">{expenses.length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-2">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-12 py-1 text-xs"
              />
              <kbd className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={filterCategory === undefined ? "default" : "outline"}
              onClick={() => setFilterCategory(undefined)}
              size="sm"
              className="px-2 py-1"
            >
              <Filter className="mr-1 h-3 w-3" />
              Toutes
            </Button>
            {categories.slice(0, 4).map((cat) => (
              <Button
                key={cat.id}
                variant={filterCategory === cat.id ? "default" : "outline"}
                onClick={() => setFilterCategory(filterCategory === cat.id ? undefined : cat.id)}
                size="sm"
                className="px-2 py-1"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" className="text-xs py-1 px-2">
          <AlertTriangle className="h-3 w-3" />
          <div>
            <h3 className="font-semibold text-xs">Erreur</h3>
            <p className="text-xs">{error}</p>
          </div>
        </Alert>
      )}

      {/* Category Summary */}
      {summary && summary.by_category.length > 0 && (
        <Card className="p-2">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
            <PieChart className="h-3 w-3" />
            Répartition par catégorie (ce mois)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {summary.by_category.map((cat, index) => (
              <div
                key={index}
                className="p-2 rounded-lg bg-muted/50 text-center"
              >
                <p className="text-xs text-muted-foreground truncate">
                  {cat.category__name || "Sans catégorie"}
                </p>
                <p className="font-bold text-base">{formatCurrency(cat.total)}</p>
                <p className="text-[11px] text-muted-foreground">{cat.count} dépense(s)</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Expenses List */}
      <Card>
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold text-sm">Dépenses</h3>
          <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
            <Download className="mr-1 h-3 w-3" />
            <span className="hidden md:inline">Exporter PDF</span>
            <span className="md:hidden"><Download className="h-3 w-3" /></span>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Date</th>
                <th className="text-left p-2 font-medium">Description</th>
                <th className="text-left p-2 font-medium">Cat.</th>
                <th className="text-left p-2 font-medium">Bénéficiaire</th>
                <th className="text-right p-2 font-medium">Montant</th>
                <th className="text-center p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-xs text-muted-foreground">
                    <Wallet className="h-6 w-6 mx-auto mb-3 opacity-50" />
                    <p>Aucune dépense trouvée</p>
                    <p className="text-xs mt-1">
                      Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">N</kbd> pour ajouter une dépense
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense, index) => (
                  <tr
                    key={expense.id}
                    className={cn(
                      "border-b transition-colors cursor-pointer text-xs",
                      selectedIndex === index
                        ? "bg-primary/10 ring-1 ring-primary ring-inset"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => router.push(`/apps/${slug}/inventory/expenses/${expense.id}`)}
                    tabIndex={0}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{new Date(expense.expense_date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium truncate">{expense.description}</div>
                      {expense.expense_number && (
                        <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                          {expense.expense_number}
                        </code>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge variant="default" className="text-[10px] px-1 py-0.5">
                        {expense.category_name || "Sans"}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground truncate max-w-[120px]">
                      {expense.beneficiary || "-"}
                    </td>
                    <td className="p-2 text-right">
                      <span className="font-bold text-red-600">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-0.5">
                        <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_EXPENSES}>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/apps/${slug}/inventory/expenses/${expense.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                        </Can>
                        <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_EXPENSES}>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/apps/${slug}/inventory/expenses/${expense.id}/edit`}>
                              <Edit className="h-3 w-3" />
                            </Link>
                          </Button>
                        </Can>
                        <Can permission={COMMON_PERMISSIONS.INVENTORY.DELETE_EXPENSES}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(expense.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
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
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <p>Total: {filteredExpenses.length} dépense(s)</p>
        <p>
          Total: <span className="font-bold text-red-600">
            {formatCurrency(filteredExpenses.reduce((acc, e) => acc + e.amount, 0))}
          </span>
        </p>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-1">
        <span className="hidden sm:inline">Appuyez sur</span>
        <kbd className="mx-1 px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">?</kbd>
        <span className="hidden sm:inline">pour voir tous les raccourcis</span>
      </p>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm p-3 m-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Exporter dépenses
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowExportModal(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-0.5">Catégorie (optionnel)</label>
                <select
                  value={exportCategory}
                  onChange={(e) => setExportCategory(e.target.value)}
                  className="w-full h-7 rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">Date début</label>
                  <Input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="h-7 px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">Date fin</label>
                  <Input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="h-7 px-2 py-1 text-xs"
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-2 text-xs text-muted-foreground">
                <p>Inclus :</p>
                <ul className="mt-0.5 ml-4 list-disc">
                  <li>Liste filtrée</li>
                  <li>Totaux catégorie</li>
                  <li>Montant global</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowExportModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const dateRange = exportStartDate && exportEndDate
                    ? `${exportStartDate}_${exportEndDate}`
                    : new Date().toISOString().split('T')[0];

                  const params = new URLSearchParams({
                    format: 'pdf',
                    ...(exportCategory && { category: exportCategory }),
                    ...(exportStartDate && { start_date: exportStartDate }),
                    ...(exportEndDate && { end_date: exportEndDate }),
                  });

                  preview(
                    `/inventory/expenses/export/?${params.toString()}`,
                    `Dépenses ${dateRange}`,
                    `depenses_${dateRange}.pdf`
                  );
                  setShowExportModal(false);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                Prévisualiser
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  const dateRange = exportStartDate && exportEndDate
                    ? `${exportStartDate}_${exportEndDate}`
                    : new Date().toISOString().split('T')[0];

                  const params = new URLSearchParams({
                    format: 'pdf',
                    ...(exportCategory && { category: exportCategory }),
                    ...(exportStartDate && { start_date: exportStartDate }),
                    ...(exportEndDate && { end_date: exportEndDate }),
                  });

                  download(
                    `/inventory/expenses/export/?${params.toString()}`,
                    `depenses_${dateRange}.pdf`
                  );
                  setShowExportModal(false);
                }}
              >
                <Download className="h-3 w-3 mr-1" />
                Télécharger
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewWrapper previewState={previewState} onClose={closePreview} />
    </div>
   </Can>
  );
}

// Petit kbd pour raccourcis affichés sur modale
function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs">{description}</span>
      <div className="flex gap-0.5">
        {keys.map((key, i) => (
          <kbd key={i} className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px] min-w-[20px] text-center">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
