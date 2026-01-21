"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HiOutlineBanknotes,
  HiOutlinePlusCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineCurrencyDollar,
} from "react-icons/hi2";
import { formatCurrency, cn } from "@/lib/utils";
import {
  getPayrolls,
  markPayrollAsPaid,
  deletePayroll,
  generateBulkPayslips,
} from "@/lib/services/hr";
import { getPayrollPeriods, createPayrollPeriod, deletePayrollPeriod } from "@/lib/services/hr/payroll-period.service";
import { getPayrollAdvances, createPayrollAdvance, approvePayrollAdvance, rejectPayrollAdvance } from "@/lib/services/hr/payroll-advance.service";
import { getEmployees } from "@/lib/services/hr/employee.service";
import type { Payroll, PayrollStatus, PayrollPeriod, PayrollAdvance, EmployeeListItem } from "@/lib/types/hr";
import { PayrollAdvanceStatus } from "@/lib/types/hr";
import { API_CONFIG } from "@/lib/api/config";
import { PDFPreviewModal } from "@/components/ui";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types";

// ============================================
// MAIN COMPONENT
// ============================================

export default function PayrollPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Main states
  const [activeTab, setActiveTab] = useState("payslips");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Data states
  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [advances, setAdvances] = useState<PayrollAdvance[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedAdvance, setSelectedAdvance] = useState<PayrollAdvance | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Period form
  const [periodForm, setPeriodForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    payment_date: "",
  });

  // Advance form
  const [advanceForm, setAdvanceForm] = useState({
    employee: "",
    amount: "",
    reason: "",
  });

  // PDF preview
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    pdfUrl: string;
    title: string;
    filename: string;
  }>({ isOpen: false, pdfUrl: "", title: "", filename: "" });

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [payrollsData, periodsData, advancesData, employeesData] = await Promise.all([
        getPayrolls(slug, { page_size: 100 }),
        getPayrollPeriods(slug, { page_size: 100 }),
        getPayrollAdvances({ organization_subdomain: slug }).catch(() => []),
        getEmployees(slug, { page_size: 100 }),
      ]);

      setPayslips(payrollsData.results);
      setPeriods(periodsData.results);
      setAdvances(advancesData || []);
      setEmployees(employeesData.results);
      
      // Get current active period (most recent with status draft/processing)
      const activePeriod = periodsData.results.find(p => p.status === "draft" || p.status === "processing") || periodsData.results[0];
      setCurrentPeriod(activePeriod || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Stats
  const stats = useMemo(() => {
    return {
      // Payslips
      totalPayslips: payslips.length,
      paidPayslips: payslips.filter(p => p.status === "paid").length,
      pendingPayslips: payslips.filter(p => p.status !== "paid").length,
      totalNet: payslips.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0),
      // Advances
      totalAdvances: advances.length,
      pendingAdvances: advances.filter(a => a.status === PayrollAdvanceStatus.PENDING).length,
      approvedAdvances: advances.filter(a => a.status === PayrollAdvanceStatus.APPROVED).length,
      // Periods
      totalPeriods: periods.length,
    };
  }, [payslips, advances, periods]);

  // Filtered data
  const filteredPayslips = useMemo(() => {
    return payslips.filter(p =>
      !searchQuery ||
      p.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [payslips, searchQuery]);

  const filteredAdvances = useMemo(() => {
    return advances.filter(a =>
      !searchQuery ||
      a.employee_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [advances, searchQuery]);

  // ============================================
  // ACTIONS
  // ============================================

  const handleGenerate = async () => {
    if (!currentPeriod) {
      setError("Aucune période de paie. Créez-en une d'abord.");
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const result = await generateBulkPayslips(currentPeriod.id, { auto_deduct_advances: true });

      let message = `✅ ${result.created} fiche(s) créée(s)`;
      if (result.advances_deducted > 0) {
        message += ` • ${result.advances_deducted} avance(s) déduite(s)`;
      }
      setSuccess(message);
      await loadData();
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      setProcessingId(id);
      await markPayrollAsPaid(id);
      setSuccess("✅ Fiche marquée comme payée");
      await loadData();
    } catch {
      setError("Erreur lors de la mise à jour");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeletePayslip = async (id: string) => {
    if (!confirm("Supprimer cette fiche de paie ?")) return;
    try {
      await deletePayroll(id);
      setSuccess("✅ Fiche supprimée");
      await loadData();
    } catch {
      setError("Erreur lors de la suppression");
    }
  };

  const handlePreviewPDF = async (payslipId: string, employeeName: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_CONFIG.baseURL}/hr/payslips/${payslipId}/export_pdf/`,
        { headers: { Authorization: `Bearer ${token}`, "X-Organization-Slug": slug } }
      );
      if (!response.ok) throw new Error("Erreur");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfPreview({
        isOpen: true,
        pdfUrl: url,
        title: `Fiche de paie - ${employeeName}`,
        filename: `Fiche_Paie_${employeeName.replace(/\s+/g, "_")}.pdf`,
      });
    } catch {
      setError("Erreur lors du chargement du PDF");
    }
  };

  // Period actions
  const initPeriodForm = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setPeriodForm({
      name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0],
      payment_date: "",
    });
    setShowPeriodDialog(true);
  };

  const handleCreatePeriod = async () => {
    if (!periodForm.name || !periodForm.start_date || !periodForm.end_date) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setProcessingId("period");
      await createPayrollPeriod(slug, periodForm);
      setSuccess("✅ Période créée");
      setShowPeriodDialog(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    if (!confirm("Supprimer cette période ?")) return;
    try {
      await deletePayrollPeriod(id);
      setSuccess("✅ Période supprimée");
      await loadData();
    } catch {
      setError("Impossible de supprimer cette période");
    }
  };

  // Advance actions
  const handleCreateAdvance = async () => {
    if (!advanceForm.employee || !advanceForm.amount || !advanceForm.reason) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      setProcessingId("advance");
      await createPayrollAdvance({
        employee: advanceForm.employee,
        amount: Number(advanceForm.amount),
        reason: advanceForm.reason,
      });
      setSuccess("✅ Demande d'avance créée");
      setShowAdvanceDialog(false);
      setAdvanceForm({ employee: "", amount: "", reason: "" });
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAdvance = async (advance: PayrollAdvance) => {
    try {
      setProcessingId(advance.id);
      await approvePayrollAdvance(advance.id);
      setSuccess(`✅ Avance approuvée - sera déduite à la prochaine paie`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'approbation");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectAdvance = async () => {
    if (!selectedAdvance || !rejectionReason) {
      setError("Veuillez fournir une raison");
      return;
    }

    try {
      setProcessingId(selectedAdvance.id);
      await rejectPayrollAdvance(selectedAdvance.id, rejectionReason);
      setSuccess("✅ Avance rejetée");
      setShowRejectDialog(false);
      setSelectedAdvance(null);
      setRejectionReason("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Erreur lors du rejet");
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getPayslipStatusBadge = (status: PayrollStatus) => {
    const config: Record<string, { label: string; variant: "default" | "warning" | "success" | "error" }> = {
      draft: { label: "Brouillon", variant: "default" },
      pending: { label: "En attente", variant: "warning" },
      paid: { label: "Payé", variant: "success" },
      cancelled: { label: "Annulé", variant: "error" },
    };
    const { label, variant } = config[status] || { label: status, variant: "default" };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getAdvanceStatusBadge = (status: PayrollAdvanceStatus) => {
    const config: Record<string, { label: string; variant: "default" | "warning" | "success" | "error" }> = {
      pending: { label: "En attente", variant: "warning" },
      approved: { label: "Approuvée", variant: "success" },
      rejected: { label: "Rejetée", variant: "error" },
      deducted: { label: "Déduite", variant: "default" },
    };
    const { label, variant } = config[status] || { label: status, variant: "default" };
    return <Badge variant={variant}>{label}</Badge>;
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
   <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL} showMessage>
     <div className="space-y-6">
      {/* PDF Modal */}
      <PDFPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={() => {
          if (pdfPreview.pdfUrl) window.URL.revokeObjectURL(pdfPreview.pdfUrl);
          setPdfPreview({ isOpen: false, pdfUrl: "", title: "", filename: "" });
        }}
        pdfUrl={pdfPreview.pdfUrl}
        title={pdfPreview.title}
        filename={pdfPreview.filename}
      />

      {/* Messages */}
      {error && (
        <Alert variant="error" className="flex justify-between items-center">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <HiOutlineXCircle className="size-4" />
          </Button>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="flex justify-between items-center">
          <span>{success}</span>
          <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
            <HiOutlineCheckCircle className="size-4" />
          </Button>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HiOutlineBanknotes className="size-7" />
            Gestion de la Paie
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.totalPayslips} fiche(s) • {formatCurrency(stats.totalNet)} net total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadData}>
            <HiOutlineArrowPath className="size-4" />
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !currentPeriod}>
            {generating ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Génération...
              </>
            ) : (
              <>
                <HiOutlineSparkles className="size-4 mr-2" />
                Générer les fiches
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Fiches de paie</div>
          <div className="text-2xl font-bold">{stats.totalPayslips}</div>
          <div className="text-xs text-muted-foreground">{stats.paidPayslips} payées</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avances en attente</div>
          <div className="text-2xl font-bold text-amber-600">{stats.pendingAdvances}</div>
          <div className="text-xs text-muted-foreground">{stats.approvedAdvances} approuvées</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Périodes</div>
          <div className="text-2xl font-bold">{stats.totalPeriods}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="text-sm text-muted-foreground">Masse salariale</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(stats.totalNet)}</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payslips" className="flex items-center gap-2">
            <HiOutlineDocumentText className="size-4" />
            <span className="hidden sm:inline">Fiches de paie</span>
            <span className="sm:hidden">Fiches</span>
            {stats.pendingPayslips > 0 && (
              <Badge variant="warning" className="ml-1 size-5 p-0 justify-center text-xs">
                {stats.pendingPayslips}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="advances" className="flex items-center gap-2">
            <HiOutlineCurrencyDollar className="size-4" />
            <span className="hidden sm:inline">Avances</span>
            <span className="sm:hidden">Avances</span>
            {stats.pendingAdvances > 0 && (
              <Badge variant="warning" className="ml-1 size-5 p-0 justify-center text-xs">
                {stats.pendingAdvances}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <HiOutlineCalendar className="size-4" />
            <span className="hidden sm:inline">Périodes</span>
            <span className="sm:hidden">Périodes</span>
          </TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* TAB: Payslips */}
        <TabsContent value="payslips" className="mt-4">
          <Card>
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="font-semibold">Fiches de paie</h2>
                <p className="text-xs text-muted-foreground">{filteredPayslips.length} résultat(s)</p>
              </div>
              <Button size="sm" onClick={() => router.push(`/apps/${slug}/hr/payroll/create`)}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Nouvelle fiche
              </Button>
            </div>

            {filteredPayslips.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <HiOutlineDocumentText className="size-12 mx-auto mb-4 opacity-50" />
                <p>Aucune fiche de paie</p>
                <p className="text-sm mt-2">Utilisez "Générer les fiches" pour créer les fiches de la période en cours</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead className="hidden md:table-cell">Période</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayslips.map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payslip.employee_name}</p>
                          <p className="text-xs text-muted-foreground">{payslip.employee_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {payslip.payroll_period_name}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(payslip.net_salary)}
                      </TableCell>
                      <TableCell>{getPayslipStatusBadge(payslip.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/apps/${slug}/hr/payroll/${payslip.id}`)}
                            title="Voir les détails"
                          >
                            Détails
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewPDF(payslip.id, payslip.employee_name || "")}
                          >
                            PDF
                          </Button>
                          {payslip.status !== "paid" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkPaid(payslip.id)}
                              disabled={processingId === payslip.id}
                            >
                              Payer
                            </Button>
                          )}
                          {payslip.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeletePayslip(payslip.id)}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* TAB: Advances */}
        <TabsContent value="advances" className="mt-4">
          <Card>
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="font-semibold">Avances sur salaire</h2>
                <p className="text-xs text-muted-foreground">
                  Les avances approuvées sont automatiquement déduites à la prochaine génération de paie
                </p>
              </div>
              <Button size="sm" onClick={() => setShowAdvanceDialog(true)}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Nouvelle avance
              </Button>
            </div>

            {filteredAdvances.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <HiOutlineCurrencyDollar className="size-12 mx-auto mb-4 opacity-50" />
                <p>Aucune demande d'avance</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="hidden md:table-cell">Raison</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdvances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{advance.employee_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(advance.request_date).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(advance.amount)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
                        {advance.reason}
                      </TableCell>
                      <TableCell>{getAdvanceStatusBadge(advance.status)}</TableCell>
                      <TableCell className="text-right">
                        {advance.status === PayrollAdvanceStatus.PENDING && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleApproveAdvance(advance)}
                              disabled={processingId === advance.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <HiOutlineCheckCircle className="size-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAdvance(advance);
                                setShowRejectDialog(true);
                              }}
                            >
                              Rejeter
                            </Button>
                          </div>
                        )}
                        {advance.status === PayrollAdvanceStatus.APPROVED && (
                          <span className="text-xs text-muted-foreground">
                            Sera déduite à la prochaine paie
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* TAB: Periods */}
        <TabsContent value="periods" className="mt-4">
          <Card>
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="font-semibold">Périodes de paie</h2>
                <p className="text-xs text-muted-foreground">{periods.length} période(s)</p>
              </div>
              <Button size="sm" onClick={initPeriodForm}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Nouvelle période
              </Button>
            </div>

            {periods.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <HiOutlineCalendar className="size-12 mx-auto mb-4 opacity-50" />
                <p>Aucune période de paie</p>
                <Button className="mt-4" onClick={initPeriodForm}>
                  Créer une période
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="hidden md:table-cell">Date paiement</TableHead>
                    <TableHead>Fiches</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow key={period.id} className={cn(currentPeriod?.id === period.id && "bg-primary/5")}>
                      <TableCell className="font-medium">
                        {period.name}
                        {currentPeriod?.id === period.id && (
                          <Badge variant="default" className="ml-2">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(period.start_date).toLocaleDateString("fr-FR")}
                          <span className="text-muted-foreground"> → </span>
                          {new Date(period.end_date).toLocaleDateString("fr-FR")}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {period.payment_date
                          ? new Date(period.payment_date).toLocaleDateString("fr-FR")
                          : "-"
                        }
                      </TableCell>
                      <TableCell>{period.payslip_count || 0}</TableCell>
                      <TableCell className="text-right">
                        {(period.payslip_count || 0) === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeletePeriod(period.id)}
                          >
                            Supprimer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Create Period */}
      <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle période de paie</DialogTitle>
            <DialogDescription>
              Créez une période pour générer les fiches de paie
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom *</Label>
              <Input
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                placeholder="Janvier 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date début *</Label>
                <Input
                  type="date"
                  value={periodForm.start_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Date fin *</Label>
                <Input
                  type="date"
                  value={periodForm.end_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Date de paiement (optionnel)</Label>
              <Input
                type="date"
                value={periodForm.payment_date}
                onChange={(e) => setPeriodForm({ ...periodForm, payment_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreatePeriod} disabled={processingId === "period"}>
              {processingId === "period" ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create Advance */}
      <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle demande d'avance</DialogTitle>
            <DialogDescription>
              L'avance sera automatiquement déduite à la prochaine génération de paie après approbation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employé *</Label>
              <Select
                value={advanceForm.employee}
                onValueChange={(v) => setAdvanceForm({ ...advanceForm, employee: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Montant (GNF) *</Label>
              <Input
                type="number"
                value={advanceForm.amount}
                onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                placeholder="500000"
              />
            </div>
            <div>
              <Label>Raison *</Label>
              <Textarea
                value={advanceForm.reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                placeholder="Raison de la demande d'avance..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateAdvance} disabled={processingId === "advance"}>
              {processingId === "advance" ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reject Advance */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande d'avance</DialogTitle>
            <DialogDescription>
              Rejet de l'avance de {formatCurrency(selectedAdvance?.amount || 0)} pour {selectedAdvance?.employee_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Raison du rejet *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setSelectedAdvance(null);
              setRejectionReason("");
            }}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectAdvance}
              disabled={processingId === selectedAdvance?.id}
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
   </Can>
  );
}
