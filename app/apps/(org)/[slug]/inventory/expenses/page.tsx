"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { PDFPreviewModal } from "@/components/ui/pdf-preview-modal";
import { 
  getExpenses, 
  getExpenseSummary, 
  deleteExpense, 
  getExpenseCategories,
  downloadExpensesPdf,
  getExpensesPdfBlob 
} from "@/lib/services/inventory";
import type { Expense, ExpenseCategory, ExpenseSummary } from "@/lib/types/inventory";
import {
  Plus,
  Search,
  AlertTriangle,
  Receipt,
  Calendar,
  Eye,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  PieChart,
  Download,
  Keyboard,
  X,
  Filter,
  Wallet,
  FileText,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const [loadingPdf, setLoadingPdf] = useState(false);
  
  // PDF Preview state
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [pdfFilename, setPdfFilename] = useState("");

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
  }, [slug, router, showShortcuts, selectedIndex, deleteConfirmId]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " GNF";
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p className="text-muted-foreground mb-6">
              Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirmId)}>
                Supprimer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dépenses</h1>
          <p className="text-muted-foreground mt-1">
            Suivi et gestion des dépenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)}>
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/inventory/expenses/categories`}>
              <PieChart className="mr-2 h-4 w-4" />
              Catégories
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/apps/${slug}/inventory/expenses/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle dépense
              <kbd className="ml-2 hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-xs">
                N
              </kbd>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-xl font-bold">{formatCurrency(summary.daily_total)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ce mois</p>
                <p className="text-xl font-bold">{formatCurrency(summary.monthly_total)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cette année</p>
                <p className="text-xl font-bold">{formatCurrency(summary.yearly_total)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nb. dépenses</p>
                <p className="text-xl font-bold">{expenses.length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par description, numéro ou bénéficiaire..."
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
              variant={filterCategory === undefined ? "default" : "outline"}
              onClick={() => setFilterCategory(undefined)}
              size="sm"
            >
              <Filter className="mr-2 h-4 w-4" />
              Toutes
            </Button>
            {categories.slice(0, 4).map((cat) => (
              <Button
                key={cat.id}
                variant={filterCategory === cat.id ? "default" : "outline"}
                onClick={() => setFilterCategory(filterCategory === cat.id ? undefined : cat.id)}
                size="sm"
              >
                {cat.name}
              </Button>
            ))}
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

      {/* Category Summary */}
      {summary && summary.by_category.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Répartition par catégorie (ce mois)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {summary.by_category.map((cat, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-muted/50 text-center"
              >
                <p className="text-sm text-muted-foreground truncate">
                  {cat.category__name || "Sans catégorie"}
                </p>
                <p className="font-bold text-lg">{formatCurrency(cat.total)}</p>
                <p className="text-xs text-muted-foreground">{cat.count} dépense(s)</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Expenses List */}
      <Card>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Liste des dépenses</h3>
          <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-left p-4 font-medium">Catégorie</th>
                <th className="text-left p-4 font-medium">Bénéficiaire</th>
                <th className="text-right p-4 font-medium">Montant</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune dépense trouvée</p>
                    <p className="text-sm mt-2">
                      Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour ajouter une dépense
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense, index) => (
                  <tr
                    key={expense.id}
                    className={cn(
                      "border-b transition-colors cursor-pointer",
                      selectedIndex === index
                        ? "bg-primary/10 ring-2 ring-primary ring-inset"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => router.push(`/apps/${slug}/inventory/expenses/${expense.id}`)}
                    tabIndex={0}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(expense.expense_date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{expense.description}</div>
                      {expense.expense_number && (
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {expense.expense_number}
                        </code>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="default">
                        {expense.category_name || "Sans catégorie"}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {expense.beneficiary || "-"}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-red-600">
                        -{formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/expenses/${expense.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/inventory/expenses/${expense.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(expense.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
        <p>Total: {filteredExpenses.length} dépense(s)</p>
        <p>
          Montant total: <span className="font-bold text-red-600">
            -{formatCurrency(filteredExpenses.reduce((acc, e) => acc + e.amount, 0))}
          </span>
        </p>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Appuyez sur <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">?</kbd> pour voir tous les raccourcis clavier
      </p>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exporter les dépenses
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowExportModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie (optionnel)</label>
                <select
                  value={exportCategory}
                  onChange={(e) => setExportCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Date début</label>
                  <Input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date fin</label>
                  <Input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p>📊 Le PDF inclura :</p>
                <ul className="mt-1 ml-4 list-disc">
                  <li>Liste des dépenses filtrées</li>
                  <li>Total par catégorie</li>
                  <li>Montant global</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowExportModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={loadingPdf}
                onClick={async () => {
                  try {
                    setLoadingPdf(true);
                    const params = {
                      category: exportCategory || undefined,
                      start_date: exportStartDate || undefined,
                      end_date: exportEndDate || undefined,
                    };
                    
                    const blobUrl = await getExpensesPdfBlob(params);
                    
                    const dateRange = exportStartDate && exportEndDate 
                      ? `${exportStartDate}_${exportEndDate}` 
                      : new Date().toISOString().split('T')[0];
                    
                    setPdfPreviewUrl(blobUrl);
                    setPdfFilename(`depenses_${dateRange}.pdf`);
                    setPdfPreviewOpen(true);
                    setShowExportModal(false);
                  } catch (err) {
                    setError("Erreur lors du chargement du PDF");
                  } finally {
                    setLoadingPdf(false);
                  }
                }}
              >
                {loadingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                Prévisualiser
              </Button>
              <Button
                className="flex-1"
                disabled={loadingPdf}
                onClick={async () => {
                  try {
                    setLoadingPdf(true);
                    await downloadExpensesPdf({
                      category: exportCategory || undefined,
                      start_date: exportStartDate || undefined,
                      end_date: exportEndDate || undefined,
                    });
                    setShowExportModal(false);
                  } catch (err) {
                    setError("Erreur lors du téléchargement du PDF");
                  } finally {
                    setLoadingPdf(false);
                  }
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewModal 
        isOpen={pdfPreviewOpen}
        onClose={() => {
          if (pdfPreviewUrl) window.URL.revokeObjectURL(pdfPreviewUrl);
          setPdfPreviewOpen(false);
          setPdfPreviewUrl("");
        }}
        title="Rapport des dépenses"
        pdfUrl={pdfPreviewUrl}
        filename={pdfFilename}
      />
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
