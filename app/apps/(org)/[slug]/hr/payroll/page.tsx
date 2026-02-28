"use client";

import { Can } from "@/components/apps/common";
import { EmptyStatePaylips } from "@/components/hr/payrolls/EmptyStatePaylips";
import { PayslipsTable } from "@/components/hr/payrolls/PayslipsTable";
import { StatsBar } from "@/components/hr/payrolls/StatsBar";
import { Label, PDFPreviewWrapper } from "@/components/ui";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHasPermission, useIsAdmin, usePDF, useUser } from "@/lib/hooks";
import { deletePayroll, getPayrolls, markPayrollAsPaid } from "@/lib/services/hr";
import { getPayrollPeriods } from "@/lib/services/hr/payroll-period.service";
import type { Payroll, PayrollPeriod } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineCurrencyDollar,
  HiOutlineMagnifyingGlass,
  HiOutlinePlusCircle,
  HiOutlineSparkles,
  HiOutlineXCircle
} from "react-icons/hi2";

// Import the ActionConfirmation dialog
import { ActionConfirmation, DeleteConfirmation } from "@/components/common/confirmation-dialog";

export default function PayrollPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const isAdmin = useIsAdmin()

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data
  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("all");
  const canViewPaies = useHasPermission(COMMON_PERMISSIONS.HR.VIEW_PAYROLL);

  // UI
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"mine" | "others">(isAdmin ? "others" : "mine");
  const user = useUser();

  const { preview, previewState, closePreview } = usePDF({
    onSuccess: () => setSuccess('PDF chargé avec succès'),
    onError: (err) => setError(err),
  });

  // Confirmation UI State
  const [confirmDelete, setConfirmDelete] = useState<{ id: string | null, open: boolean }>({ id: null, open: false });
  const [confirmMarkAllPaid, setConfirmMarkAllPaid] = useState<{ rows: Payroll[]; open: boolean }>({ rows: [], open: false });

  // ======================== DATA LOADING ===========================
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Removed unused getEmployees call
      const [payrollsData, periodsData] = await Promise.all([
        getPayrolls(slug, { page_size: 200 }),
        getPayrollPeriods(slug, { page_size: 50 }),
      ]);
      
      setPayslips(Array.isArray(payrollsData?.results) ? payrollsData.results : []);
      setPeriods(Array.isArray(periodsData?.results) ? periodsData.results : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-clear success after 5s
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ======================== COMPUTED ===============================
  const currentPeriod = useMemo(() => {
    if (!selectedPeriodId || selectedPeriodId === "all" || selectedPeriodId === "none")
      return undefined;
    return periods.find((p) => String(p.id) === String(selectedPeriodId));
  }, [periods, selectedPeriodId]);


  const filteredPayslips = useMemo(() => {
    let filtered = Array.isArray(payslips) ? payslips : [];

    // Non-admins see only their own payslips at the data level
    if (!canViewPaies && user?.id) {
      filtered = filtered.filter((p) => String(p.employee) === String(user.id));
    }

    // Period filter
    if (selectedPeriodId && selectedPeriodId !== "all") {
      if (selectedPeriodId === "none") {
        filtered = filtered.filter((p) => !p.payroll_period);
      } else {
        filtered = filtered.filter(
          (p) => String(p.payroll_period) === String(selectedPeriodId)
        );
      }
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.employee_name?.toLowerCase().includes(q) ||
          p.employee_id?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.display_name?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [payslips, selectedPeriodId, searchQuery, user?.id, canViewPaies]);

  console.log("Filtered paylist , " , filteredPayslips);
  

  // Split into "mine" / "others" only after all filters are applied
  const myPayslips = useMemo(() => {
    if (!user?.id) return [];
    return filteredPayslips.filter((p) => String(p.employee) === String(user.id));
  }, [filteredPayslips, user?.id]);

  const othersPayslips = useMemo(() => {
    if (!user?.id) return [];
    return filteredPayslips.filter((p) => String(p.employee) !== String(user.id));
  }, [filteredPayslips, user?.id]);

  // ======================= ACTIONS ================================
  const handleMarkPaid = async (id: string) => {
    try {
      setProcessingId(id);
      await markPayrollAsPaid(id);
      setSuccess("Fiche marquée comme payée");
      await loadData();
    } catch {
      setError("Erreur lors de la mise à jour");
    } finally {
      setProcessingId(null);
    }
  };

  // Change: NOT confirmation here (single mark paid does not use the dialog)

  // Mark ALL as paid – Use ActionConfirmation dialog
  const onMarkAllPaidClick = (rows: Payroll[]) => {
    if ((rows || []).filter((p) => p.status !== "paid").length === 0) {
      setError("Toutes les fiches sont déjà payées");
      return;
    }
    setConfirmMarkAllPaid({ rows, open: true });
  };

  const doMarkAllPaid = async () => {
    const rows = confirmMarkAllPaid.rows || [];
    const unpaid = rows.filter((p) => p.status !== "paid");
    setConfirmMarkAllPaid({ rows: [], open: false });
    if (unpaid.length === 0) return;

    try {
      setProcessingId("all");
      await Promise.all(unpaid.map((p) => markPayrollAsPaid(String(p.id))));
      setSuccess(`${unpaid.length} fiche(s) marquée(s) comme payée(s)`);
      await loadData();
    } catch {
      setError("Erreur lors de la mise à jour");
    } finally {
      setProcessingId(null);
    }
  };

  // Delete payslip — via ActionConfirmation dialog
  const onDeletePayslipClick = (id: string) => {
    setConfirmDelete({ id, open: true });
  };

  const doDeletePayslip = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ id: null, open: false });
    if (!id) return;
    try {
      await deletePayroll(id);
      setSuccess("Fiche supprimée");
      await loadData();
    } catch {
      setError("Erreur lors de la suppression");
    }
  };

  const handlePreviewPDF = async (payslipId: string, employeeName: string) => {
    try {
      const filename = `Fiche_Paie_${(employeeName || "Employe").replace(/\s+/g, "_")}.pdf`;
      const title = `Fiche de paie – ${employeeName}`;
      await preview(`/hr/payslips/${payslipId}/export-pdf/`, title, filename);
    } catch (err) {
      setError("Erreur lors du chargement du PDF");
    }
  };

  // ======================== LOADING ================================
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  // ======================== RENDER ===============================
  return (
    <div className="space-y-6">
      {/* ActionConfirmation dialogs */}
      <DeleteConfirmation
        open={confirmDelete.open}
        description="Êtes-vous sûr de vouloir supprimer cette fiche de paie ? Cette action est irréversible."
        onOpenChange={() => setConfirmDelete({ id: null, open: false })}
        onConfirm={doDeletePayslip}
        loading={false}
      />

      <ActionConfirmation
       action={{
        label: "Confirmer"
       }}
        open={confirmMarkAllPaid.open}
        description={`Marquer ${confirmMarkAllPaid.rows.filter((p) => p.status !== "paid").length} fiche(s) comme payée(s) ?`}
        onOpenChange={() => setConfirmMarkAllPaid({ rows: [], open: false })}
        onConfirm={doMarkAllPaid}
        loading={processingId === "all"}
      />

      {/* PDF Modal */}
      <PDFPreviewWrapper previewState={previewState} onClose={closePreview} />

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
              Période :{" "}
              <span className="font-medium">{currentPeriod.name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/apps/${slug}/hr/payroll/advances`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <HiOutlineCurrencyDollar className="size-4 mr-2" />
            Gestion des avances
          </Link>
          
          <Can permission={COMMON_PERMISSIONS.HR.CREATE_PAYROLL}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/apps/${slug}/hr/payroll/generate`)}
          >
            <HiOutlineSparkles className="size-4 mr-2" />
            Générer en masse
          </Button>
          </Can>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            title="Rafraîchir"
            aria-label="Rafraîchir les données"
          >
            <HiOutlineArrowPath className="size-4" />
          </Button>

          <Can permission={COMMON_PERMISSIONS.HR.CREATE_PAYROLL}>
            <Button
              onClick={() => router.push(`/apps/${slug}/hr/payroll/create`)}
            >
              <HiOutlinePlusCircle className="size-4 mr-2" />
              Creer une fiche de paie
            </Button>
          </Can>

        </div>
      </div>

      {/* Filters row — shared across tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Label className="whitespace-nowrap">Période :</Label>
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="Toutes les fiches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les fiches</SelectItem>
              <SelectItem value="none">Sans période (ad-hoc)</SelectItem>
              {periods.length > 0 && (
                <div className="py-1 px-2 text-xs text-muted-foreground border-t mt-1">
                  Périodes
                </div>
              )}
              {periods.map((period) => (
                <SelectItem key={period.id} value={String(period.id)}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full md:w-72 ml-auto">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "mine" | "others")}
        className="space-y-0"
      >
        <TabsList>
       {!isAdmin &&  <TabsTrigger value="mine">
            Mes fiches de paie
            {myPayslips.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {myPayslips.length}
              </Badge>
            )}
          </TabsTrigger>}
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
        <TabsTrigger value="others">
            Paies des autres
            {othersPayslips.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {othersPayslips.length}
              </Badge>
            )}
          </TabsTrigger>
        </Can>
        </TabsList>

        {/* ── Mine ── */}
        <TabsContent value="mine">
          <Card className="overflow-hidden">
            {myPayslips.length === 0 ? (
              <EmptyStatePaylips
                slug={slug}
                globallyEmpty={payslips.length === 0}
                currentPeriod={currentPeriod}
                selectedPeriodId={selectedPeriodId}
              />
            ) : (
              <>
                <StatsBar
                  payslips={myPayslips}
                  canViewPaies={canViewPaies}
                  processingId={processingId}
                  // Replaced mark-all handler to show confirmation dialog
                  onMarkAllPaid={onMarkAllPaidClick}
                  isMine
                />
                <PayslipsTable
                  payslips={myPayslips}
                  slug={slug}
                  isMine={true}
                  canViewPaies={canViewPaies}
                  processingId={processingId}
                  onMarkPaid={handleMarkPaid}
                  onDeletePayslip={onDeletePayslipClick}
                  onPreviewPDF={handlePreviewPDF}
                />
              </>
            )}
          </Card>
        </TabsContent>

        {/* ── Others ── */}
        <TabsContent value="others">
          <Card className="overflow-hidden">
            {othersPayslips.length === 0 ? (
              <EmptyStatePaylips
                slug={slug}
                globallyEmpty={payslips.length === 0}
                currentPeriod={currentPeriod}
                selectedPeriodId={selectedPeriodId}
              />
            ) : (
              <>
                <StatsBar
                  payslips={othersPayslips}
                  canViewPaies={canViewPaies}
                  processingId={processingId}
                  onMarkAllPaid={onMarkAllPaidClick}
                />
                <PayslipsTable
                  payslips={othersPayslips}
                  slug={slug}
                  canViewPaies={canViewPaies}
                  processingId={processingId}
                  onMarkPaid={handleMarkPaid}
                  onDeletePayslip={onDeletePayslipClick}
                  onPreviewPDF={handlePreviewPDF}
                />
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}