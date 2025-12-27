"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HiOutlineBanknotes,
  HiOutlinePlusCircle,
  HiOutlineEllipsisVertical,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
} from "react-icons/hi2";
import { formatCurrency } from "@/lib/utils";
import {
  getPayrolls,
  getPayrollStats,
  markPayrollAsPaid,
  deletePayroll,
  generatePayrollsForPeriod,
  downloadPayrollPDF,
  generateBulkPayslips,
} from "@/lib/services/hr";
import { getPayrollPeriods } from "@/lib/services/hr/payroll-period.service";
import { getPayrollAdvances } from "@/lib/services/hr/payroll-advance.service";
import type { Payroll, PayrollStatus, PayrollPeriod, PayrollAdvance } from "@/lib/types/hr";
import { Can } from "@/components/apps/common";
import { ResourceType, PermissionAction } from "@/lib/types/shared";
import { Label } from "@/components/ui/label";
import { PDFPreviewModal } from '@/components/ui';
import { API_CONFIG } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi2";

export default function PayrollPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Data state
  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [filteredPayslips, setFilteredPayslips] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total_payrolls: 0,
    total_gross_salary: 0,
    total_net_salary: 0,
    total_deductions: 0,
    average_salary: 0,
    paid_count: 0,
    pending_count: 0,
    draft_count: 0,
  });

  // Quick actions data
  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null);
  const [pendingAdvances, setPendingAdvances] = useState<PayrollAdvance[]>([]);
  const [loadingQuickData, setLoadingQuickData] = useState(false);

  // UI state
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; payslipId: string | null }>({
    open: false,
    payslipId: null,
  });
  const [markPaidDialog, setMarkPaidDialog] = useState<{ open: boolean; payslipId: string | null }>({
    open: false,
    payslipId: null,
  });
  const [bulkGenerateDialog, setBulkGenerateDialog] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [configDialog, setConfigDialog] = useState(false);

  // PDF Preview state
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    pdfUrl: string;
    title: string;
    filename: string;
  }>({
    isOpen: false,
    pdfUrl: '',
    title: '',
    filename: '',
  });

  // Custom deductions configuration
  const [deductionConfig, setDeductionConfig] = useState({
    cnps_percentage: 3.6,
    tax_percentage: 10,
    custom_deductions: [] as { name: string; amount: number }[],
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    loadQuickActionData();
    loadDeductionConfig();
  }, [slug]);

  useEffect(() => {
    filterPayslips();
  }, [payslips, searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // Charger les fiches de paie
      const payrollsData = await getPayrolls(slug, { page_size: 100 });
      setPayslips(payrollsData.results);

      // Charger les statistiques
      try {
        const statsData = await getPayrollStats(slug, { year: currentYear, month: currentMonth });
        setStats(statsData);
      } catch (statsErr) {
        console.warn('Stats endpoint not available, calculating from payroll data:', statsErr);
        // Calculer les stats à partir des données de paie
        calculateLocalStats(payrollsData.results);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des données";
      setError(errorMessage);
      console.error('Error loading payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalStats = (payrollData: Payroll[]) => {
    const draftCount = payrollData.filter(p => p.status === 'draft').length;
    const pendingCount = payrollData.filter(p => p.status === 'pending').length;
    const paidCount = payrollData.filter(p => p.status === 'paid').length;
    const totalNet = payrollData.reduce((sum, p) => sum + p.net_salary, 0);
    const totalGross = payrollData.reduce((sum, p) => sum + p.gross_salary, 0);

    setStats({
      total_payrolls: payrollData.length,
      total_gross_salary: totalGross,
      total_net_salary: totalNet,
      total_deductions: totalGross - totalNet,
      average_salary: payrollData.length > 0 ? totalNet / payrollData.length : 0,
      paid_count: paidCount,
      pending_count: pendingCount,
      draft_count: draftCount,
    });
  };

  const loadQuickActionData = async () => {
    try {
      setLoadingQuickData(true);

      // Load current/active period
      const periodsData = await getPayrollPeriods(slug, { status: 'active', page_size: 1 });
      if (periodsData.results.length > 0) {
        setCurrentPeriod(periodsData.results[0]);
      }

      // Load pending advances
      const advancesData = await getPayrollAdvances({
        organization_subdomain: slug,
        status: 'pending',
      });
      setPendingAdvances(advancesData);
    } catch (err) {
      console.warn('Error loading quick action data:', err);
    } finally {
      setLoadingQuickData(false);
    }
  };

  const loadDeductionConfig = () => {
    try {
      const savedConfig = localStorage.getItem(`deduction_config_${slug}`);
      if (savedConfig) {
        setDeductionConfig(JSON.parse(savedConfig));
      }
    } catch (err) {
      console.warn('Error loading deduction config:', err);
    }
  };

  const saveDeductionConfig = () => {
    try {
      localStorage.setItem(`deduction_config_${slug}`, JSON.stringify(deductionConfig));
      setConfigDialog(false);
      setSuccess('Configuration enregistrée avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de la configuration');
    }
  };

  const filterPayslips = () => {
    let filtered = [...payslips];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.employee_details?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.employee_details?.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredPayslips(filtered);
    setCurrentPage(1);
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      setProcessingId(id);
      await markPayrollAsPaid(id);
      setMarkPaidDialog({ open: false, payslipId: null });
      await loadData();
    } catch (err) {
      setError("Erreur lors de la mise à jour");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setProcessingId(id);
      await deletePayroll(id);
      setDeleteDialog({ open: false, payslipId: null });
      await loadData();
    } catch (err) {
      setError("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePreviewPDF = async (payslipId: string, employeeName: string) => {
    try {
      setProcessingId(payslipId);
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${API_CONFIG.baseURL}/hr/payslips/${payslipId}/export_pdf/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Organization-Slug': slug,
          },
        }
      );
      
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      setPdfPreview({
        isOpen: true,
        pdfUrl: url,
        title: `Fiche de paie - ${employeeName}`,
        filename: `Fiche_Paie_${employeeName.replace(/\s+/g, '_')}.pdf`,
      });
    } catch (err) {
      setError("Erreur lors du chargement du PDF");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const closePdfPreview = () => {
    if (pdfPreview.pdfUrl) {
      window.URL.revokeObjectURL(pdfPreview.pdfUrl);
    }
    setPdfPreview({
      isOpen: false,
      pdfUrl: '',
      title: '',
      filename: '',
    });
  };

  const handleQuickGenerate = async () => {
    if (!currentPeriod) {
      setError("Aucune période de paie active trouvée. Veuillez créer une période de paie d'abord.");
      return;
    }

    try {
      setBulkGenerating(true);
      setError(null);
      setSuccess(null);

      // NOTE: Custom deduction configuration is saved in localStorage for display purposes.
      // The backend currently uses hardcoded CNPS (3.6%) and tax (10%) percentages.
      // To apply custom percentages, the backend API would need to be enhanced to accept
      // these parameters in the request payload.
      const result = await generateBulkPayslips(currentPeriod.id, {
        auto_deduct_advances: true,
        // TODO: Add support for custom deductions when backend is enhanced:
        // custom_cnps_percentage: deductionConfig.cnps_percentage,
        // custom_tax_percentage: deductionConfig.tax_percentage,
        // custom_deductions: deductionConfig.custom_deductions,
      });

      let message = `✅ ${result.created} fiche(s) de paie créée(s) avec succès !`;
      if (result.advances_deducted > 0) {
        message += ` ✨ ${result.advances_deducted} avance(s) déduite(s) automatiquement.`;
      }
      if (result.skipped > 0) {
        message += ` ⚠️ ${result.skipped} fiche(s) ignorée(s) (déjà existante).`;
      }

      setSuccess(message);
      await loadData();
      await loadQuickActionData();
    } catch (err: any) {
      const errorMessage = err?.data?.detail || err?.message || "Erreur lors de la génération automatique";
      setError(errorMessage);
      console.error('Quick generation error:', err);
    } finally {
      setBulkGenerating(false);
    }
  };

  const handleBulkGenerate = async (payrollPeriodId?: string) => {
    if (!payrollPeriodId) {
      setError("Veuillez sélectionner une période de paie depuis l'onglet 'Périodes'");
      return;
    }

    try {
      setBulkGenerating(true);
      const result = await generatePayrollsForPeriod(payrollPeriodId);

      let message = `✅ ${result.created} fiche(s) de paie créée(s) avec succès !`;
      if (result.skipped > 0) {
        message += `\n⚠️ ${result.skipped} fiche(s) ignorée(s) (déjà existante).`;
      }
      if (result.errors.length > 0) {
        message += `\n\n❌ Erreurs (${result.errors.length}) :\n${result.errors.slice(0, 5).join('\n')}`;
        if (result.errors.length > 5) {
          message += `\n... et ${result.errors.length - 5} autre(s)`;
        }
      }

      alert(message);
      setBulkGenerateDialog(false);
      await loadData();
    } catch (err) {
      setError("Erreur lors de la génération groupée");
      console.error(err);
    } finally {
      setBulkGenerating(false);
    }
  };

  const getStatusBadge = (status: PayrollStatus) => {
    const statusConfig = {
      draft: { label: "Brouillon", variant: "default" as const },
      pending: { label: "En attente", variant: "warning" as const },
      paid: { label: "Payé", variant: "success" as const },
      cancelled: { label: "Annulé", variant: "error" as const },
    };

    const config = statusConfig[status] || { label: status, variant: "default" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Pagination
  const totalPages = Math.ceil(filteredPayslips.length / itemsPerPage);
  const paginatedPayslips = filteredPayslips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    // Navigation de base
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.new(() => router.push(`/apps/${slug}/hr/payroll/create`)),
    commonShortcuts.help(() => setShowShortcuts(true)),
    commonShortcuts.escape(() => {
      if (showShortcuts) {
        setShowShortcuts(false);
      } else if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearchQuery("");
      } else {
        setSelectedIndex(-1);
      }
    }),

    // Navigation dans la liste
    commonShortcuts.arrowDown(() => {
      setSelectedIndex((prev) => Math.min(prev + 1, paginatedPayslips.length - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    commonShortcuts.enter(() => {
      if (selectedIndex >= 0 && paginatedPayslips[selectedIndex]) {
        router.push(`/apps/${slug}/hr/payroll/${paginatedPayslips[selectedIndex].id}`);
      }
    }),

    // Actions sur la fiche de paie sélectionnée
    { key: "p", action: () => {
      if (selectedIndex >= 0 && paginatedPayslips[selectedIndex]) {
        handlePreviewPDF(paginatedPayslips[selectedIndex].id, paginatedPayslips[selectedIndex].employee_details?.full_name || "");
      }
    }, description: "Aperçu PDF de la fiche sélectionnée" },
    { key: "m", action: () => {
      if (selectedIndex >= 0 && paginatedPayslips[selectedIndex] && paginatedPayslips[selectedIndex].status !== "paid") {
        setMarkPaidDialog({ open: true, payslipId: paginatedPayslips[selectedIndex].id });
      }
    }, description: "Marquer comme payée" },

    // Génération
    { key: "g", action: () => {
      if (currentPeriod && !bulkGenerating) {
        handleQuickGenerate();
      }
    }, description: "Générer toutes les fiches" },

    // Filtres de statut (1-4)
    commonShortcuts.filter("1", () => setStatusFilter(statusFilter === "all" ? "all" : "all"), "Tous les statuts"),
    commonShortcuts.filter("2", () => setStatusFilter(statusFilter === "draft" ? "all" : "draft"), "Filtrer: Brouillons"),
    commonShortcuts.filter("3", () => setStatusFilter(statusFilter === "pending" ? "all" : "pending"), "Filtrer: En attente"),
    commonShortcuts.filter("4", () => setStatusFilter(statusFilter === "paid" ? "all" : "paid"), "Filtrer: Payées"),

    // Réinitialisation et pagination
    { key: "r", action: () => {
      setSearchQuery("");
      setStatusFilter("all");
    }, description: "Réinitialiser les filtres" },
    { key: ",", action: () => {
      if (currentPage > 1) setCurrentPage(currentPage - 1);
    }, description: "Page précédente" },
    { key: ".", action: () => {
      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    }, description: "Page suivante" },

    // Liens rapides
    { key: "t", action: () => router.push(`/apps/${slug}/hr/payroll/periods`), description: "Ouvrir les périodes" },
    { key: "a", action: () => router.push(`/apps/${slug}/hr/payroll/advances`), description: "Ouvrir les avances" },
  ], [slug, router, showShortcuts, selectedIndex, paginatedPayslips, statusFilter, currentPage, totalPages, currentPeriod, bulkGenerating]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Masse salariale nette",
      value: formatCurrency(stats.total_net_salary),
      subtitle: `Brut: ${formatCurrency(stats.total_gross_salary)}`,
      icon: HiOutlineCurrencyDollar,
      color: "green",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      trend: stats.total_net_salary > 0 ? "up" : "neutral",
    },
    {
      title: "Fiches de paie",
      value: stats.total_payrolls,
      subtitle: `Moyenne: ${formatCurrency(stats.average_salary)}`,
      icon: HiOutlineDocumentText,
      color: "blue",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "En attente de paiement",
      value: stats.draft_count + stats.pending_count,
      subtitle: `${stats.draft_count} brouillon(s), ${stats.pending_count} en attente`,
      icon: HiOutlineChartBar,
      color: "orange",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Payées",
      value: stats.paid_count,
      subtitle: `Total déductions: ${formatCurrency(stats.total_deductions)}`,
      icon: HiOutlineCheckCircle,
      color: "purple",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Modal des raccourcis */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Paie"
      />

      {error && (
        <Alert variant="error" className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
          >
            <HiOutlineXMark className="size-4" />
          </Button>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="flex items-center justify-between">
          <span>{success}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccess(null)}
          >
            <HiOutlineXMark className="size-4" />
          </Button>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HiOutlineBanknotes className="size-7" />
            Gestion de la Paie
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les fiches de paie et suivez la masse salariale
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            aria-label="Afficher les raccourcis clavier"
            title="Raccourcis clavier (?)"
          >
            <HiOutlineQuestionMarkCircle className="size-4" />
          </Button>
          <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.CREATE}`}>
            <Button variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/payroll/periods`}>
                <HiOutlineCalendar className="size-4 mr-2" />
                Périodes
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">T</kbd>
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/payroll/advances`}>
                <HiOutlineCurrencyDollar className="size-4 mr-2" />
                Avances
                <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">A</kbd>
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/apps/${slug}/hr/payroll/create`}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Nouvelle fiche
                <ShortcutBadge shortcut={shortcuts.find(s => s.key === "n")!} />
              </Link>
            </Button>
          </Can>
        </div>
      </div>

      {/* Quick Actions Section */}
      <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.CREATE}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quick Generate Card */}
          <Card className="border shadow-sm">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <HiOutlineSparkles className="size-5" />
                    Génération Automatique
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Générez toutes les fiches de paie en 1 clic
                  </p>
                </div>
              </div>

              {currentPeriod ? (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Période actuelle</p>
                    <p className="font-semibold text-sm mt-1">{currentPeriod.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(currentPeriod.start_date).toLocaleDateString('fr-FR')} - {new Date(currentPeriod.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      • Salaires récupérés automatiquement
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      • Avances déduites automatiquement
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      • CNPS ({deductionConfig.cnps_percentage}%) et Impôts ({deductionConfig.tax_percentage}%) calculés
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleQuickGenerate}
                      disabled={bulkGenerating}
                      className="flex-1"
                    >
                      {bulkGenerating ? (
                        <>
                          <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <HiOutlineSparkles className="size-4 mr-2" />
                          Générer Toutes les Paies
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setConfigDialog(true)}
                      title="Configurer les déductions"
                    >
                      <HiOutlinePencil className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="warning">
                    <p className="text-sm">Aucune période de paie active trouvée.</p>
                  </Alert>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/apps/${slug}/hr/payroll/periods`}>
                      <HiOutlineCalendar className="size-4 mr-2" />
                      Créer une période de paie
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Pending Advances Card */}
          <Card className="border shadow-sm">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <HiOutlineCurrencyDollar className="size-5" />
                    Avances en Attente
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pendingAdvances.length} demande(s) à traiter
                  </p>
                </div>
                {pendingAdvances.length > 0 && (
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {pendingAdvances.length}
                  </Badge>
                )}
              </div>

              {pendingAdvances.length > 0 ? (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {pendingAdvances.slice(0, 3).map((advance) => (
                      <div
                        key={advance.id}
                        className="bg-muted rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {advance.employee_name || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(advance.amount)}
                          </p>
                        </div>
                        <Badge variant="default" className="ml-2 shrink-0">
                          En attente
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {pendingAdvances.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      + {pendingAdvances.length - 3} autre(s) demande(s)
                    </p>
                  )}

                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/apps/${slug}/hr/payroll/advances`}>
                      Gérer les avances
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
                      <HiOutlineCheckCircle className="size-6" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Aucune avance en attente
                    </p>
                  </div>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/apps/${slug}/hr/payroll/advances`}>
                      Voir toutes les avances
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </Can>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card
            key={stat.title}
            className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {typeof stat.value === 'number' && stat.value > 999999
                    ? stat.value
                    : stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.subtitle}
                  </p>
                )}
              </div>
              <div
                className={`flex size-12 items-center justify-center rounded-xl ${stat.bgColor}`}
              >
                <stat.icon className={`size-6 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <Card className="border-0 shadow-sm">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher un employé (nom, matricule)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20"
                aria-label="Rechercher des fiches de paie"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <HiOutlineFunnel className="size-4 mr-2" />
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              <HiOutlineXMark className="size-4 mr-2" />
              Réinitialiser
              <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-xs">R</kbd>
            </Button>
          )}
        </div>
      </Card>

      {/* Payslips Table */}
      <Card className="border-0 shadow-sm">
        <div className="border-b px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Fiches de paie</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredPayslips.length} fiche(s) trouvée(s)
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredPayslips.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <HiOutlineDocumentText className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {searchQuery || statusFilter !== "all"
                      ? "Aucun résultat"
                      : "Aucune fiche de paie"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || statusFilter !== "all"
                      ? "Essayez de modifier vos critères de recherche"
                      : "Commencez par créer des fiches de paie pour vos employés"}
                  </p>
                </div>
                {!searchQuery && statusFilter === "all" && (
                  <Button asChild>
                    <Link href={`/apps/${slug}/hr/payroll/create`}>
                      <HiOutlinePlusCircle className="size-4 mr-2" />
                      Créer une fiche de paie
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-right">Salaire de base</TableHead>
                    <TableHead className="text-right">Salaire brut</TableHead>
                    <TableHead className="text-right">Déductions</TableHead>
                    <TableHead className="text-right">Salaire net</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayslips.map((payslip, index) => (
                    <TableRow
                      key={payslip.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/50",
                        selectedIndex === index && "bg-primary/10 ring-1 ring-primary"
                      )}
                      onClick={() => setSelectedIndex(index)}
                      onDoubleClick={() => router.push(`/apps/${slug}/hr/payroll/${payslip.id}`)}
                      tabIndex={0}
                      role="row"
                      aria-selected={selectedIndex === index}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {payslip.employee_details?.full_name || 'N/A'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {payslip.employee_details?.employee_id || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {payslip.payroll_period_name || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payslip.start_date ? new Date(payslip.start_date).toLocaleDateString("fr-FR", { month: 'short', year: 'numeric' }) : 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(payslip.base_salary)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {formatCurrency(payslip.gross_salary)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-red-600">
                          -{formatCurrency(payslip.total_deductions || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(payslip.net_salary)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={processingId === payslip.id}
                            >
                              <HiOutlineEllipsisVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/apps/${slug}/hr/payroll/${payslip.id}`}>
                                <HiOutlineEye className="size-4 mr-2" />
                                Voir les détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handlePreviewPDF(
                                  payslip.id,
                                  payslip.employee_details?.full_name || 'Employee'
                                )
                              }
                            >
                              <HiOutlineEye className="size-4 mr-2" />
                              Aperçu PDF
                            </DropdownMenuItem>
                            <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.UPDATE}`}>
                              <DropdownMenuItem asChild>
                                <Link href={`/apps/${slug}/hr/payroll/${payslip.id}/edit`}>
                                  <HiOutlinePencil className="size-4 mr-2" />
                                  Modifier
                                </Link>
                              </DropdownMenuItem>
                            </Can>
                            {(payslip.status === "pending" || payslip.status === "draft") && (
                              <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.UPDATE}`}>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() =>
                                    setMarkPaidDialog({ open: true, payslipId: payslip.id })
                                  }
                                >
                                  <HiOutlineCheckCircle className="size-4 mr-2" />
                                  Marquer comme payé
                                </DropdownMenuItem>
                              </Can>
                            )}
                            <Can permission={`${ResourceType.EMPLOYEE}.${PermissionAction.DELETE}`}>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  setDeleteDialog({ open: true, payslipId: payslip.id })
                                }
                              >
                                <HiOutlineTrash className="size-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </Can>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages} ({filteredPayslips.length} fiches)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, payslipId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette fiche de paie ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, payslipId: null })}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog.payslipId && handleDelete(deleteDialog.payslipId)}
              disabled={processingId !== null}
            >
              {processingId ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Confirmation Dialog */}
      <Dialog open={markPaidDialog.open} onOpenChange={(open) => setMarkPaidDialog({ open, payslipId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme payé</DialogTitle>
            <DialogDescription>
              Confirmer que cette fiche de paie a été payée ? Le statut sera mis à jour en conséquence.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarkPaidDialog({ open: false, payslipId: null })}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onClick={() => markPaidDialog.payslipId && handleMarkAsPaid(markPaidDialog.payslipId)}
              disabled={processingId !== null}
            >
              {processingId ? "Traitement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkGenerateDialog} onOpenChange={setBulkGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Génération groupée</DialogTitle>
            <DialogDescription>
              Pour générer des fiches de paie en masse, veuillez d'abord créer une période de paie dans l'onglet "Périodes de paie".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkGenerateDialog(false)}
            >
              Annuler
            </Button>
            <Button asChild>
              <Link href={`/apps/${slug}/hr/payroll/periods`}>
                <HiOutlineCalendar className="size-4 mr-2" />
                Voir les périodes
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deductions Configuration Dialog */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration des Déductions</DialogTitle>
            <DialogDescription>
              Personnalisez les pourcentages de déduction et ajoutez des déductions personnalisées.
              Ces paramètres seront utilisés lors de la génération automatique des fiches de paie.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Standard Deductions */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Déductions Standards</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnps">CNPS (%)</Label>
                  <Input
                    id="cnps"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={deductionConfig.cnps_percentage}
                    onChange={(e) =>
                      setDeductionConfig({
                        ...deductionConfig,
                        cnps_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Pourcentage de cotisation CNPS
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax">Impôts (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={deductionConfig.tax_percentage}
                    onChange={(e) =>
                      setDeductionConfig({
                        ...deductionConfig,
                        tax_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Pourcentage d'imposition sur le salaire
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Deductions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Déductions Personnalisées</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDeductionConfig({
                      ...deductionConfig,
                      custom_deductions: [
                        ...deductionConfig.custom_deductions,
                        { name: '', amount: 0 },
                      ],
                    })
                  }
                >
                  <HiOutlinePlusCircle className="size-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              {deductionConfig.custom_deductions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Aucune déduction personnalisée.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cliquez sur "Ajouter" pour créer une déduction.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deductionConfig.custom_deductions.map((deduction, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`deduction-name-${index}`}>Nom</Label>
                          <Input
                            id={`deduction-name-${index}`}
                            placeholder="Ex: Assurance santé"
                            value={deduction.name}
                            onChange={(e) => {
                              const newDeductions = [...deductionConfig.custom_deductions];
                              newDeductions[index].name = e.target.value;
                              setDeductionConfig({
                                ...deductionConfig,
                                custom_deductions: newDeductions,
                              });
                            }}
                          />
                        </div>
                        <div className="w-32 space-y-2">
                          <Label htmlFor={`deduction-amount-${index}`}>Montant (GNF)</Label>
                          <Input
                            id={`deduction-amount-${index}`}
                            type="number"
                            min="0"
                            value={deduction.amount}
                            onChange={(e) => {
                              const newDeductions = [...deductionConfig.custom_deductions];
                              newDeductions[index].amount = parseFloat(e.target.value) || 0;
                              setDeductionConfig({
                                ...deductionConfig,
                                custom_deductions: newDeductions,
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newDeductions = deductionConfig.custom_deductions.filter(
                                (_, i) => i !== index
                              );
                              setDeductionConfig({
                                ...deductionConfig,
                                custom_deductions: newDeductions,
                              });
                            }}
                          >
                            <HiOutlineTrash className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Aperçu</h4>
              <Card className="p-4 bg-muted/50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>CNPS:</span>
                    <span className="font-medium">{deductionConfig.cnps_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impôts:</span>
                    <span className="font-medium">{deductionConfig.tax_percentage}%</span>
                  </div>
                  {deductionConfig.custom_deductions.length > 0 && (
                    <>
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-muted-foreground mb-2">Déductions fixes:</p>
                        {deductionConfig.custom_deductions.map((ded, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{ded.name || 'Sans nom'}:</span>
                            <span className="font-medium">{formatCurrency(ded.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Card>
              <p className="text-xs text-muted-foreground">
                ⚠️ Note: Les déductions personnalisées seront appliquées à tous les employés lors de la génération automatique.
                Pour des déductions spécifiques à un employé, créez la fiche de paie manuellement.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveDeductionConfig}>
              <HiOutlineCheckCircle className="size-4 mr-2" />
              Enregistrer la configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={closePdfPreview}
        title={pdfPreview.title}
        pdfUrl={pdfPreview.pdfUrl}
        filename={pdfPreview.filename}
      />

      {/* Hint */}
      <KeyboardHint />
    </div>
  );
}
