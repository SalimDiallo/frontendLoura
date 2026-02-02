"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { Label } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { getPayrolls, markPayrollAsPaid, deletePayroll } from "@/lib/services/hr";
import { getPayrollPeriods } from "@/lib/services/hr/payroll-period.service";
import type { Payroll, PayrollPeriod } from "@/lib/types/hr";
import { API_CONFIG } from "@/lib/api/config";
import { PDFPreviewModal } from "@/components/ui";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import Link from "next/link";
import { getStatusBadgeNode } from "@/lib/utils/BadgeStatus";
import { useHasPermission, useIsAdmin, useUser } from "@/lib/hooks";
import { Can } from "@/components/apps/common";
import { Download, Eye } from "lucide-react";

// ─── Shared payslip table rendered identically for both tabs ─────────────────
function PayslipsTable({
  payslips,
  slug,
  canViewPaies,
  processingId,
  onMarkPaid,
  onDeletePayslip,
  onPreviewPDF,
}: {
  payslips: Payroll[];
  slug: string;
  canViewPaies: boolean;
  processingId: string | null;
  onMarkPaid: (id: string) => void;
  onDeletePayslip: (id: string) => void;
  onPreviewPDF: (id: string, name: string) => void;
}) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Période</TableHead>
          <TableHead>Employé</TableHead>
          <TableHead className="text-right">Brut</TableHead>
          <TableHead className="text-right">Déductions</TableHead>
          <TableHead className="text-right">Net</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payslips.map((payslip) => (
          <TableRow key={payslip.id} className="group hover:bg-muted/50 transition-colors">
            <TableCell>
              <p className="font-medium">
                {payslip.payroll_period_name ?? (
                  <span className="italic text-muted-foreground text-sm">Sans période</span>
                )}
              </p>
            </TableCell>
            <TableCell>
              <p className="font-medium">{payslip.employee_name}</p>
              <p className="text-xs text-muted-foreground">{payslip.employee_id}</p>
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
              <div className="flex justify-end gap-1 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/apps/${slug}/hr/payroll/${payslip.id}`)}
                >
                  <Eye className="text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPreviewPDF(String(payslip.id), payslip.employee_name || "")}
                >
                  <Download className="text-secondary" />
                </Button>
                <Can permission={COMMON_PERMISSIONS.HR.PROCESS_PAYROLL}>
                {payslip.status !== "paid" && canViewPaies &&  (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMarkPaid(String(payslip.id))}
                    disabled={processingId === String(payslip.id)}
                  >
                    {processingId === String(payslip.id) ? (
                      <HiOutlineArrowPath className="size-4 animate-spin" />
                    ) : (
                      "Payer"
                    )}
                  </Button>
                )}
                {payslip.status === "draft" && canViewPaies && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDeletePayslip(String(payslip.id))}
                  >
                    ×
                  </Button>
                )}
                </Can>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Stats bar shown above each table ────────────────────────────────────────
function StatsBar({
  payslips,
  canViewPaies,
  processingId,
  onMarkAllPaid,
}: {
  payslips: Payroll[];
  canViewPaies: boolean;
  processingId: string | null;
  onMarkAllPaid: (rows: Payroll[]) => void;
}) {
  const totalNet = payslips.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);
  const paidCount = payslips.filter((p) => p.status === "paid").length;
  const pendingCount = payslips.filter((p) => p.status !== "paid").length;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-muted/40 rounded-t-lg border-b">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total net :</span>
          <span className="font-bold text-lg text-green-600">{formatCurrency(totalNet)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">{paidCount} payée{paidCount !== 1 ? "s" : ""}</Badge>
          {pendingCount > 0 && (
            <Badge variant="warning">{pendingCount} en attente</Badge>
          )}
        </div>
      </div>

      {pendingCount > 0 && canViewPaies && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMarkAllPaid(payslips)}
          disabled={processingId === "all"}
        >
          {processingId === "all" ? (
            <HiOutlineArrowPath className="size-4 animate-spin mr-2" />
          ) : (
            <HiOutlineCheckCircle className="size-4 mr-2" />
          )}
          Tout marquer payé
        </Button>
      )}
    </div>
  );
}

// ─── Empty state shown when a tab has no matching payslips ───────────────────
function EmptyState({
  slug,
  globallyEmpty,
  currentPeriod,
  selectedPeriodId,
}: {
  slug: string;
  globallyEmpty: boolean;
  currentPeriod?: PayrollPeriod;
  selectedPeriodId: string;
}) {
  return (
    <div className="p-12 text-center">
      <HiOutlineDocumentText className="size-16 mx-auto mb-4 text-muted-foreground/30" />
      {globallyEmpty ? (
        <>
          <p className="text-lg font-medium mb-2">Commencez à gérer vos paies</p>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Créez une fiche de paie individuelle ou générez des fiches en masse pour tous vos employés.
          </p>
         <Can permission={COMMON_PERMISSIONS.HR.CREATE_PAYROLL}>
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
         </Can>
        </>
      ) : (
        <>
          <p className="text-lg font-medium mb-2">Aucune fiche trouvée</p>
          <p className="text-muted-foreground mb-4">
            {selectedPeriodId === "none"
              ? "Aucune fiche de paie ad-hoc (sans période)"
              : currentPeriod
                ? `Aucune fiche pour "${currentPeriod.name}"`
                : "Essayez de modifier vos filtres ou créez une nouvelle fiche"}
          </p>
         <Can permission={COMMON_PERMISSIONS.HR.CREATE_PAYROLL}>
         <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/apps/${slug}/hr/payroll/create`}
          >
            <HiOutlineUserPlus className="size-4 mr-2" />
            Créer une fiche
          </Link>
         </Can>
        </>
      )}
    </div>
  );
}

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

  // PDF preview — keep a ref to the current blob URL so we can revoke before opening a new one
  const activeBlobUrl = useRef<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    pdfUrl: string;
    title: string;
    filename: string;
  }>({ isOpen: false, pdfUrl: "", title: "", filename: "" });

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

  const handleMarkAllPaid = async (rows: Payroll[]) => {
    const unpaid = (rows || []).filter((p) => p.status !== "paid");
    if (unpaid.length === 0) {
      setError("Toutes les fiches sont déjà payées");
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Marquer ${unpaid.length} fiche(s) comme payée(s) ?`)
    )
      return;

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

  const handleDeletePayslip = async (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Supprimer cette fiche de paie ?"))
      return;
    try {
      await deletePayroll(id);
      setSuccess("Fiche supprimée");
      await loadData();
    } catch {
      setError("Erreur lors de la suppression");
    }
  };

  // Revoke the previously opened blob URL before creating a new one
  const revokeActiveBlobUrl = () => {
    if (activeBlobUrl.current && typeof window !== "undefined") {
      window.URL.revokeObjectURL(activeBlobUrl.current);
      activeBlobUrl.current = null;
    }
  };

  const handlePreviewPDF = async (payslipId: string, employeeName: string) => {
    try {
      revokeActiveBlobUrl(); // free previous blob before fetching

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!token) throw new Error("Token missing");

      const response = await fetch(
        `${API_CONFIG.baseURL}/hr/payslips/${payslipId}/export_pdf/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Organization-Slug": slug,
          },
        }
      );
      if (!response.ok) throw new Error("Erreur");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      activeBlobUrl.current = url;

      setPdfPreview({
        isOpen: true,
        pdfUrl: url,
        title: `Fiche de paie – ${employeeName}`,
        filename: `Fiche_Paie_${(employeeName || "Employe").replace(/\s+/g, "_")}.pdf`,
      });
    } catch {
      setError("Erreur lors du chargement du PDF");
    }
  };

  const handleClosePdf = () => {
    revokeActiveBlobUrl();
    setPdfPreview({ isOpen: false, pdfUrl: "", title: "", filename: "" });
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
      {/* PDF Modal */}
      <PDFPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={handleClosePdf}
        pdfUrl={pdfPreview.pdfUrl}
        title={pdfPreview.title}
        filename={pdfPreview.filename}
      />

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
            Avances
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/apps/${slug}/hr/payroll/create`)}
          >
            <HiOutlinePlusCircle className="size-4 mr-2" />
            Paie individuelle
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            title="Rafraîchir"
            aria-label="Rafraîchir les données"
          >
            <HiOutlineArrowPath className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/apps/${slug}/hr/payroll/generate`)}
          >
            <HiOutlineSparkles className="size-4 mr-2" />
            Générer en masse
          </Button>
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
              <EmptyState
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
                  onMarkAllPaid={handleMarkAllPaid}
                />
                <PayslipsTable
                  payslips={myPayslips}
                  slug={slug}
                  canViewPaies={canViewPaies}
                  processingId={processingId}
                  onMarkPaid={handleMarkPaid}
                  onDeletePayslip={handleDeletePayslip}
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
              <EmptyState
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
                  onMarkAllPaid={handleMarkAllPaid}
                />
                <PayslipsTable
                  payslips={othersPayslips}
                  slug={slug}
                  canViewPaies={canViewPaies}
                  processingId={processingId}
                  onMarkPaid={handleMarkPaid}
                  onDeletePayslip={handleDeletePayslip}
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