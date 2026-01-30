"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineCurrencyDollar,
  HiOutlinePlusCircle,
  HiOutlineUserPlus,
} from "react-icons/hi2";
import { formatCurrency, cn } from "@/lib/utils";
import {
  getPayrolls,
  markPayrollAsPaid,
  deletePayroll,
  generateBulkPayslips,
} from "@/lib/services/hr";
import { getPayrollPeriods, createPayrollPeriod } from "@/lib/services/hr/payroll-period.service";
import { getPayrollAdvances, createPayrollAdvance, approvePayrollAdvance, rejectPayrollAdvance } from "@/lib/services/hr/payroll-advance.service";
import { getEmployees } from "@/lib/services/hr/employee.service";
import type { Payroll, PayrollStatus, PayrollPeriod, PayrollAdvance, EmployeeListItem } from "@/lib/types/hr";
import { PayrollAdvanceStatus } from "@/lib/types/hr";
import { API_CONFIG } from "@/lib/api/config";
import { PDFPreviewModal } from "@/components/ui";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types";
import { parseApiError } from "@/lib/utils/format-api-errors";
import Link from "next/link";
import { getStatusBadgeNode } from "@/lib/utils/BadgeStatus";

// ============================================
// MAIN COMPONENT - SIMPLIFIED UX
// ============================================

export default function PayrollPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data
  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [advances, setAdvances] = useState<PayrollAdvance[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showAdvancesSheet, setShowAdvancesSheet] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<PayrollAdvance | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Dialog states
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showIndividualPayDialog, setShowIndividualPayDialog] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ employee: "", amount: "", reason: "" });
  const [individualPayEmployee, setIndividualPayEmployee] = useState("");

  // PDF preview
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    pdfUrl: string;
    title: string;
    filename: string;
  }>({ isOpen: false, pdfUrl: "", title: "", filename: "" });

  // ============================================
  // DATA LOADING
  // ============================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [payrollsData, periodsData, advancesData, employeesData] = await Promise.all([
        getPayrolls(slug, { page_size: 200 }),
        getPayrollPeriods(slug, { page_size: 50 }),
        getPayrollAdvances({ organization_subdomain: slug }).catch(() => []),
        getEmployees(slug, { page_size: 200 }),
      ]);

      setPayslips(payrollsData.results);
      setPeriods(periodsData.results);
      setAdvances(advancesData || []);
      setEmployees(employeesData.results);
      
      // Initialiser sur "all" pour voir toutes les fiches par défaut
      if (!selectedPeriodId) {
        setSelectedPeriodId("all");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [slug, selectedPeriodId]);

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

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const currentPeriod = useMemo(() => {
    return periods.find(p => p.id === selectedPeriodId);
  }, [periods, selectedPeriodId]);

  const filteredPayslips = useMemo(() => {
    let filtered = payslips;
    
    // Filtrer par période sélectionnée
    // "all" = toutes les fiches, "none" = fiches sans période
    if (selectedPeriodId && selectedPeriodId !== "all") {
      if (selectedPeriodId === "none") {
        filtered = filtered.filter(p => !p.payroll_period);
      } else {
        filtered = filtered.filter(p => p.payroll_period === selectedPeriodId);
      }
    }
    
    // Filtrer par recherche (nom, matricule, description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.employee_name?.toLowerCase().includes(query) ||
        p.employee_id?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.display_name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [payslips, selectedPeriodId, searchQuery]);


  const pendingAdvances = useMemo(() => {
    return advances.filter(a => a.status === PayrollAdvanceStatus.PENDING);
  }, [advances]);

  const stats = useMemo(() => ({
    totalNet: filteredPayslips.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0),
    paidCount: filteredPayslips.filter(p => p.status === "paid").length,
    pendingCount: filteredPayslips.filter(p => p.status !== "paid").length,
  }), [filteredPayslips]);

  // ============================================
  // ACTIONS
  // ============================================

  // Créer période du mois automatiquement si besoin
  const ensureCurrentPeriod = async (): Promise<string | null> => {
    const now = new Date();
    const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const periodName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
    // Vérifier si période existe déjà
    const existing = periods.find(p => p.name === periodName);
    if (existing) {
      return existing.id;
    }
    
    // Créer la période
    try {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const newPeriod = await createPayrollPeriod(slug, {
        name: periodName,
        start_date: firstDay.toISOString().split('T')[0],
        end_date: lastDay.toISOString().split('T')[0],
      });
      
      return newPeriod.id;
    } catch (err: any) {
      const parsed = parseApiError(err);
      throw new Error(parsed.message);
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

  const handleMarkAllPaid = async () => {
    const unpaidPayslips = filteredPayslips.filter(p => p.status !== "paid");
    if (unpaidPayslips.length === 0) {
      setError("Toutes les fiches sont déjà payées");
      return;
    }
    
    if (!confirm(`Marquer ${unpaidPayslips.length} fiche(s) comme payée(s) ?`)) return;
    
    try {
      setProcessingId("all");
      for (const payslip of unpaidPayslips) {
        await markPayrollAsPaid(payslip.id);
      }
      setSuccess(`✅ ${unpaidPayslips.length} fiche(s) marquée(s) comme payée(s)`);
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

  // Advances actions
  const handleApproveAdvance = async (advance: PayrollAdvance) => {
    try {
      setProcessingId(advance.id);
      await approvePayrollAdvance(advance.id);
      setSuccess(`✅ Avance de ${formatCurrency(advance.amount)} approuvée`);
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

  // Create an advance
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
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Generate payslip for individual employee
  const handleGenerateIndividualPay = async () => {
    if (!individualPayEmployee) {
      setError("Veuillez sélectionner un employé");
      return;
    }

    try {
      setProcessingId("individual");
      
      // S'assurer d'avoir une période
      let periodId = selectedPeriodId;
      if (!periodId) {
        periodId = await ensureCurrentPeriod() || "";
        if (!periodId) {
          setError("Impossible de créer la période de paie");
          return;
        }
        setSelectedPeriodId(periodId);
      }

      const result = await generateBulkPayslips(periodId, { 
        auto_deduct_advances: true,
        auto_approve: false,
        employee_ids: [individualPayEmployee],
      });

      if (result.created > 0) {
        setSuccess("✅ Fiche de paie générée");
      } else if (result.skipped > 0) {
        setError("Cette fiche de paie existe déjà pour cette période");
      } else {
        setError("Aucune fiche n'a pu être générée (vérifiez le contrat de l'employé)");
      }
      
      setShowIndividualPayDialog(false);
      setIndividualPayEmployee("");
      await loadData();
    } catch (err: any) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================
  // HELPERS
  // ============================================



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
  // RENDER
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

        {/* Reject Advance Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter l'avance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Raison du rejet</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Expliquez la raison du rejet..."
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejectAdvance}
                disabled={!rejectionReason || processingId === selectedAdvance?.id}
              >
                Rejeter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Advance Dialog */}
        <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle demande d'avance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Employé</Label>
                <Select value={advanceForm.employee} onValueChange={(v) => setAdvanceForm(prev => ({ ...prev, employee: v }))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Montant (GNF)</Label>
                <Input
                  type="number"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Ex: 500000"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Motif</Label>
                <Textarea
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Raison de la demande..."
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateAdvance}
                disabled={!advanceForm.employee || !advanceForm.amount || !advanceForm.reason || processingId === "advance"}
              >
                {processingId === "advance" ? "Création..." : "Créer l'avance"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Messages */}
        {error && (
          <Alert variant="error" className="flex justify-between items-center">
            <span className="whitespace-pre-line">{error}</span>
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
            {currentPeriod && (
              <p className="text-sm text-muted-foreground mt-1">
                Période : <span className="font-medium">{currentPeriod.name}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Advances Sheet Trigger */}
            <Sheet open={showAdvancesSheet} onOpenChange={setShowAdvancesSheet}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <HiOutlineCurrencyDollar className="size-4 mr-2" />
                  Avances
                  {pendingAdvances.length > 0 && (
                    <Badge 
                      variant="warning" 
                      className="absolute -top-2 -right-2 size-5 p-0 justify-center text-xs"
                    >
                      {pendingAdvances.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <HiOutlineCurrencyDollar className="size-5" />
                    Avances à traiter
                  </SheetTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAdvanceDialog(true)}
                    >
                      <HiOutlinePlusCircle className="size-4 mr-2" />
                      Nouvelle avance
                    </Button>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {pendingAdvances.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <HiOutlineCheckCircle className="size-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune avance en attente</p>
                    </div>
                  ) : (
                    pendingAdvances.map((advance) => (
                      <Card key={advance.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">{advance.employee_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(advance.request_date).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <span className="text-lg font-bold">
                            {formatCurrency(advance.amount)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {advance.reason}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveAdvance(advance)}
                            disabled={processingId === advance.id}
                            className="flex-1 bg-green-600 hover:bg-green-700"
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
                            className="flex-1"
                          >
                            Rejeter
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Create Advance Button */}
          

            {/* Individual Pay Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/apps/${slug}/hr/payroll/create`)}
            >
              <HiOutlineUserPlus className="size-4 mr-2" />
              Paie individuelle
            </Button>

            <Button variant="ghost" size="sm" onClick={loadData}>
              <HiOutlineArrowPath className="size-4" />
            </Button>
            
            <Link className={buttonVariants()} href={`/apps/${slug}/hr/payroll/generate`} >
              <HiOutlineSparkles className="size-4 mr-2" />
              Paiement Groupé
            </Link>
          </div>
        </div>

        {/* Stats + Period Selector */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Period Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Label className="whitespace-nowrap">Filtre :</Label>
            <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Toutes les fiches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-medium">📋 Toutes les fiches</span>
                </SelectItem>
                <SelectItem value="none">
                  <span className="text-muted-foreground">📝 Sans période (ad-hoc)</span>
                </SelectItem>
                {periods.length > 0 && (
                  <div className="py-1 px-2 text-xs text-muted-foreground border-t mt-1">
                    Périodes
                  </div>
                )}
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total :</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(stats.totalNet)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">{stats.paidCount} payées</Badge>
              {stats.pendingCount > 0 && (
                <Badge variant="warning">{stats.pendingCount} en attente</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Search + Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {stats.pendingCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarkAllPaid}
              disabled={processingId === "all"}
            >
              <HiOutlineCheckCircle className="size-4 mr-2" />
              Tout marquer payé
            </Button>
          )}
        </div>

        {/* Payslips Table */}
        <Card>
          {filteredPayslips.length === 0 ? (
            <div className="p-12 text-center">
              <HiOutlineDocumentText className="size-16 mx-auto mb-4 text-muted-foreground/30" />
              {payslips.length === 0 ? (
                <>
                  <p className="text-lg font-medium mb-2">Commencez à gérer vos paies</p>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Créez une fiche de paie individuelle ou générez des fiches en masse pour tous vos employés.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link 
                      className={buttonVariants({ variant: "outline" })} 
                      href={`/apps/${slug}/hr/payroll/create`}
                    >
                      <HiOutlineUserPlus className="size-4 mr-2" />
                      Paie individuelle
                    </Link>
                    <Link 
                      className={buttonVariants()} 
                      href={`/apps/${slug}/hr/payroll/generate`}
                    >
                      <HiOutlineSparkles className="size-4 mr-2" />
                      Générer en masse
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">Aucune fiche trouvée</p>
                  <p className="text-muted-foreground mb-4">
                    {selectedPeriodId === "none" 
                      ? "Aucune fiche de paie ad-hoc (sans période)"
                      : selectedPeriodId && selectedPeriodId !== "all" && currentPeriod
                        ? `Aucune fiche pour "${currentPeriod.name}"`
                        : "Essayez de modifier vos filtres ou créez une nouvelle fiche"
                    }
                  </p>
                  <Link className={buttonVariants({ variant: "outline" })} href={`/apps/${slug}/hr/payroll/create`}>
                    <HiOutlineUserPlus className="size-4 mr-2" />
                    Créer une fiche
                  </Link>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead className="text-right">Brut</TableHead>
                  <TableHead className="text-right">Déductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id} className="group hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{payslip.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{payslip.employee_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(payslip.gross_salary)}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      -{formatCurrency(payslip.total_deductions)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(payslip.net_salary)}
                    </TableCell>
                    <TableCell>{getStatusBadgeNode(payslip.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/apps/${slug}/hr/payroll/${payslip.id}`)}
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
                            className="text-destructive hover:text-destructive"
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
      </div>
    </Can>
  );
}
