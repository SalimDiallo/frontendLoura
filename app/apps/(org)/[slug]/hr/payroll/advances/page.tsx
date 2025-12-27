"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Alert,
  Button,
  Card,
  Input,
  Badge,
  Form,
} from "@/components/ui";
import {
  FormInputField,
  FormTextareaField,
  FormSelectField,
} from "@/components/ui/form-fields";
import {
  getPayrollAdvances,
  createPayrollAdvance,
  approvePayrollAdvance,
  rejectPayrollAdvance,
  markAdvanceAsPaid,
  deductAdvanceFromPayslip,
} from "@/lib/services/hr";
import { getEmployees } from "@/lib/services/hr/employee.service";
import { getPayrolls } from "@/lib/services/hr/payroll.service";
import type { PayrollAdvance, EmployeeListItem, Payroll } from "@/lib/types/hr";
import { PayrollAdvanceStatus } from "@/lib/types/hr";
import {
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, KeyboardHint } from "@/components/ui/shortcuts-help";
import { QuickActionsPanel } from "@/components/hr/quick-actions-panel";
import { HelpCircle, Zap } from "lucide-react";

const advanceSchema = z.object({
  employee: z.string().min(1, "L'employé est requis"),
  amount: z.coerce
    .number({ invalid_type_error: "Le montant doit être un nombre" })
    .min(1000, "Le montant minimum est de 1 000 GNF")
    .max(10000000, "Le montant maximum est de 10 000 000 GNF"),
  reason: z.string()
    .min(10, "La raison doit contenir au moins 10 caractères")
    .max(500, "La raison ne peut pas dépasser 500 caractères"),
  notes: z.string()
    .max(1000, "Les notes ne peuvent pas dépasser 1000 caractères")
    .optional(),
});

type AdvanceFormData = z.infer<typeof advanceSchema>;

export default function PayrollAdvancesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [advances, setAdvances] = useState<PayrollAdvance[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDeductDialog, setShowDeductDialog] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<PayrollAdvance | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<string>("");
  const [quickActionProcessing, setQuickActionProcessing] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AdvanceFormData>({
    resolver: zodResolver(advanceSchema),
  });

  useEffect(() => {
    loadData();
  }, [slug, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [advancesData, employeesData] = await Promise.all([
        getPayrollAdvances({
          organization_subdomain: slug,
          status: statusFilter !== "all" ? statusFilter : undefined,
        }),
        getEmployees(slug),
      ]);

      setAdvances(advancesData);
      setEmployees(employeesData.results);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AdvanceFormData) => {
    try {
      setProcessing(true);
      setError(null);

      // Validation supplémentaire: vérifier que l'employé existe
      const selectedEmployee = employees.find(e => e.id === data.employee);
      if (!selectedEmployee) {
        setError("Employé introuvable");
        return;
      }

      await createPayrollAdvance({
        employee: data.employee,
        amount: data.amount,
        reason: data.reason,
        notes: data.notes,
      });

      setSuccess(`Demande d'avance de ${data.amount.toLocaleString()} GNF créée pour ${selectedEmployee.full_name}`);
      setShowCreateDialog(false);
      form.reset();
      loadData();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.data?.detail || err?.message || "Erreur lors de la création de la demande";
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAdvance) return;

    try {
      setProcessing(true);
      setError(null);
      await approvePayrollAdvance(selectedAdvance.id);
      setSuccess(`Avance de ${selectedAdvance.amount.toLocaleString()} GNF approuvée pour ${selectedAdvance.employee_name}`);
      setShowApprovalDialog(false);
      setSelectedAdvance(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err?.data?.detail || err?.message || "Erreur lors de l'approbation");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAdvance || !rejectionReason) {
      setError("Veuillez fournir une raison de rejet");
      return;
    }

    if (rejectionReason.length < 10) {
      setError("La raison du rejet doit contenir au moins 10 caractères");
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      await rejectPayrollAdvance(selectedAdvance.id, rejectionReason);
      setSuccess(`Avance de ${selectedAdvance.amount.toLocaleString()} GNF rejetée pour ${selectedAdvance.employee_name}`);
      setShowApprovalDialog(false);
      setSelectedAdvance(null);
      setRejectionReason("");
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err?.data?.detail || err?.message || "Erreur lors du rejet");
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsPaid = async (advance: PayrollAdvance) => {
    if (!confirm(`Marquer comme payée l'avance de ${advance.amount.toLocaleString()} GNF pour ${advance.employee_name} ?`)) {
      return;
    }

    try {
      setError(null);
      await markAdvanceAsPaid(advance.id);
      setSuccess(`Avance de ${advance.amount.toLocaleString()} GNF marquée comme payée`);
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err?.data?.detail || err?.message || "Erreur lors de la mise à jour");
    }
  };

  const loadPayslipsForEmployee = async (employeeId: string, advanceAmount: number) => {
    try {
      console.log('Loading payslips for employee:', employeeId);
      console.log('Advance amount:', advanceAmount);

      const payslipsData = await getPayrolls(slug, {
        employee: employeeId,
      });

      console.log('Payslips received:', payslipsData.results.length);
      console.log('Payslips data:', payslipsData.results.map(p => ({
        id: p.id,
        employee: p.employee,
        employee_name: p.employee_name,
        net_salary: p.net_salary
      })));

      // DOUBLE FILTRAGE : Par employé ET par salaire net suffisant
      const employeePayslips = payslipsData.results.filter(
        (payslip: Payroll) => payslip.employee === employeeId
      );

      console.log('Payslips for this employee after frontend filter:', employeePayslips.length);

      const eligiblePayslips = employeePayslips.filter(
        (payslip: Payroll) => (payslip.net_salary || 0) >= advanceAmount
      );

      console.log('Eligible payslips (net salary >= advance):', eligiblePayslips.length);

      if (eligiblePayslips.length === 0 && employeePayslips.length > 0) {
        setError(`Aucune fiche de paie avec un salaire net suffisant (>= ${advanceAmount.toLocaleString()} GNF) pour cet employé`);
      } else if (eligiblePayslips.length === 0) {
        setError("Aucune fiche de paie disponible pour cet employé");
      }

      setPayslips(eligiblePayslips);
    } catch (err) {
      console.error('Error loading payslips:', err);
      setError("Erreur lors du chargement des fiches de paie");
    }
  };

  const handleDeductFromPayslip = async () => {
    if (!selectedAdvance) {
      setError("Avance non sélectionnée");
      return;
    }

    if (!selectedPayslip) {
      setError("Veuillez sélectionner une fiche de paie");
      return;
    }

    // Validation supplémentaire
    if (typeof selectedPayslip !== 'string' || selectedPayslip.trim() === '') {
      setError("ID de fiche de paie invalide");
      console.error('Invalid payslip ID:', selectedPayslip);
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      console.log('Deducting advance:', {
        advanceId: selectedAdvance.id,
        payslipId: selectedPayslip,
        amount: selectedAdvance.amount,
        employee: selectedAdvance.employee_name
      });

      await deductAdvanceFromPayslip(selectedAdvance.id, selectedPayslip);

      setSuccess(`Avance de ${selectedAdvance.amount.toLocaleString()} GNF déduite avec succès et marquée comme clôturée`);
      setShowDeductDialog(false);
      setSelectedAdvance(null);
      setSelectedPayslip("");
      setPayslips([]);
      loadData();
    } catch (err: any) {
      console.error('Error deducting advance:', err);
      const errorMessage = err?.data?.error || err?.data?.detail || err?.message || "Erreur lors de la déduction de l'avance";
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Action rapide : Approuver et payer en une seule étape
  const handleQuickApproveAndPay = async (advance: PayrollAdvance) => {
    if (!confirm(`Approuver et marquer comme payée l'avance de ${advance.amount.toLocaleString()} GNF pour ${advance.employee_name} ?`)) {
      return;
    }

    try {
      setQuickActionProcessing(advance.id);
      // Approuver d'abord
      await approvePayrollAdvance(advance.id);
      // Puis marquer comme payée
      await markAdvanceAsPaid(advance.id);
      setSuccess("Avance approuvée et marquée comme payée avec succès");
      loadData();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'action rapide");
    } finally {
      setQuickActionProcessing(null);
    }
  };

  const getStatusBadge = (status: PayrollAdvanceStatus) => {
    const variants = {
      [PayrollAdvanceStatus.PENDING]: { variant: "default" as const, label: "En attente", color: "bg-yellow-100 text-yellow-700" },
      [PayrollAdvanceStatus.APPROVED]: { variant: "default" as const, label: "Approuvée", color: "bg-blue-100 text-blue-700" },
      [PayrollAdvanceStatus.REJECTED]: { variant: "error" as const, label: "Rejetée", color: "bg-red-100 text-red-700" },
      [PayrollAdvanceStatus.PAID]: { variant: "success" as const, label: "Payée", color: "bg-green-100 text-green-700" },
      [PayrollAdvanceStatus.DEDUCTED]: { variant: "default" as const, label: "Déduite (Close)", color: "bg-gray-100 text-gray-700" },
    };

    const config = variants[status] || variants[PayrollAdvanceStatus.PENDING];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredAdvances = advances.filter((advance) =>
    advance.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    advance.employee_id_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: advances.length,
    pending: advances.filter(a => a.status === PayrollAdvanceStatus.PENDING).length,
    approved: advances.filter(a => a.status === PayrollAdvanceStatus.APPROVED).length,
    paid: advances.filter(a => a.status === PayrollAdvanceStatus.PAID).length,
    deducted: advances.filter(a => a.status === PayrollAdvanceStatus.DEDUCTED).length,
  };

  // Première avance en attente pour action rapide
  const firstPendingAdvance = filteredAdvances.find(a => a.status === PayrollAdvanceStatus.PENDING);
  const firstApprovedAdvance = filteredAdvances.find(a => a.status === PayrollAdvanceStatus.APPROVED);
  const firstPaidAdvance = filteredAdvances.find(a => a.status === PayrollAdvanceStatus.PAID);

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.new(() => setShowCreateDialog(true)),
    commonShortcuts.help(() => setShowShortcuts(true)),
    commonShortcuts.escape(() => {
      if (showShortcuts) setShowShortcuts(false);
      else if (showCreateDialog) setShowCreateDialog(false);
      else if (showApprovalDialog) setShowApprovalDialog(false);
      else if (showDeductDialog) setShowDeductDialog(false);
      else if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearchQuery("");
      } else {
        setSelectedIndex(-1);
      }
    }),
    commonShortcuts.arrowDown(() => {
      setSelectedIndex((prev) => Math.min(prev + 1, filteredAdvances.length - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    // Actions rapides
    { key: "a", action: () => {
      if (firstPendingAdvance) handleQuickApproveAndPay(firstPendingAdvance);
    }, description: "Approuver & payer la première en attente" },
    { key: "p", action: () => {
      if (firstApprovedAdvance) handleMarkAsPaid(firstApprovedAdvance);
    }, description: "Marquer payée la première approuvée" },
    // Filtres
    commonShortcuts.filter("1", () => setStatusFilter("all"), "Tous"),
    commonShortcuts.filter("2", () => setStatusFilter("pending"), "En attente"),
    commonShortcuts.filter("3", () => setStatusFilter("approved"), "Approuvées"),
    commonShortcuts.filter("4", () => setStatusFilter("paid"), "Payées"),
    commonShortcuts.filter("5", () => setStatusFilter("deducted"), "Déduites"),
    { key: "r", action: () => {
      setSearchQuery("");
      setStatusFilter("all");
    }, description: "Réinitialiser les filtres" },
    // Note: B pour retour est géré globalement par le layout
  ], [showShortcuts, showCreateDialog, showApprovalDialog, showDeductDialog, filteredAdvances, firstPendingAdvance, firstApprovedAdvance]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modal des raccourcis */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis clavier - Avances"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HiOutlineCurrencyDollar className="size-8" />
            Avances sur salaire
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les demandes d'avances des employés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            aria-label="Afficher les raccourcis clavier"
            title="Raccourcis clavier (?)"
          >
            <HelpCircle className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/apps/${slug}/hr/payroll`)}>
            Retour
            <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">B</kbd>
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <HiOutlinePlusCircle className="size-5 mr-2" />
            Nouvelle avance
            <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-white/20 px-1 font-mono text-xs">N</kbd>
          </Button>
        </div>
      </div>

      {/* Actions rapides si des demandes en attente */}
      {(stats.pending > 0 || stats.approved > 0 || stats.paid > 0) && (
        <QuickActionsPanel
          title="Actions Rapides"
          subtitle={`${stats.pending} demande(s) en attente, ${stats.approved} approuvée(s), ${stats.paid} à déduire`}
          compact
          actions={[
            ...(firstPendingAdvance ? [{
              id: "approve-pay",
              label: `Approuver & Payer: ${firstPendingAdvance.employee_name}`,
              description: `${firstPendingAdvance.amount.toLocaleString()} GNF`,
              icon: <HiOutlineCheckCircle className="size-5" />,
              shortcut: "A",
              variant: "success" as const,
              onClick: () => handleQuickApproveAndPay(firstPendingAdvance),
            }] : []),
            ...(firstApprovedAdvance ? [{
              id: "mark-paid",
              label: `Marquer payée: ${firstApprovedAdvance.employee_name}`,
              description: `${firstApprovedAdvance.amount.toLocaleString()} GNF`,
              icon: <HiOutlineCurrencyDollar className="size-5" />,
              shortcut: "P",
              variant: "info" as const,
              onClick: () => handleMarkAsPaid(firstApprovedAdvance),
            }] : []),
            ...(firstPaidAdvance ? [{
              id: "deduct",
              label: `Déduire: ${firstPaidAdvance.employee_name}`,
              description: `${firstPaidAdvance.amount.toLocaleString()} GNF`,
              icon: <Zap className="size-5" />,
              variant: "warning" as const,
              onClick: async () => {
                setSelectedAdvance(firstPaidAdvance);
                await loadPayslipsForEmployee(firstPaidAdvance.employee, firstPaidAdvance.amount);
                setShowDeductDialog(true);
              },
            }] : []),
          ]}
        />
      )}

      {error && (
        <Alert variant="error" className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
          >
            <HiOutlineXCircle className="size-4" />
          </Button>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="flex items-center justify-between bg-green-50 border-green-200">
          <span className="text-green-800">{success}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccess(null)}
          >
            <HiOutlineCheckCircle className="size-4" />
          </Button>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Total demandes</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">En attente</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pending}</div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Approuvées</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{stats.approved}</div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Payées</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{stats.paid}</div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="text-sm text-muted-foreground">Déduites</div>
          <div className="text-2xl font-bold mt-1 text-gray-600">{stats.deducted}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Rechercher par employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20"
              aria-label="Rechercher des avances"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
              Ctrl+K
            </kbd>
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Tous
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              En attente
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("approved")}
            >
              Approuvées
            </Button>
            <Button
              variant={statusFilter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("paid")}
            >
              Payées
            </Button>
            <Button
              variant={statusFilter === "deducted" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("deducted")}
            >
              Déduites
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        {filteredAdvances.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Aucune demande d'avance trouvée
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Raison</TableHead>
                <TableHead>Date demande</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Approuvé par</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvances.map((advance) => (
                <TableRow key={advance.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{advance.employee_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {advance.employee_id_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-lg">
                      {advance.amount.toLocaleString()} GNF
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={advance.reason}>
                      {advance.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(advance.request_date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{getStatusBadge(advance.status)}</TableCell>
                  <TableCell>
                    {advance.approved_by_name || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Action rapide : Approuver ET payer en un clic */}
                      {advance.status === PayrollAdvanceStatus.PENDING && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleQuickApproveAndPay(advance)}
                            disabled={quickActionProcessing === advance.id}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          >
                            <HiOutlineCheckCircle className="size-4 mr-1" />
                            {quickActionProcessing === advance.id ? "Traitement..." : "Approuver & Payer"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAdvance(advance);
                              setShowApprovalDialog(true);
                            }}
                          >
                            <HiOutlineEye className="size-4 mr-1" />
                            Examiner
                          </Button>
                        </>
                      )}
                      {advance.status === PayrollAdvanceStatus.APPROVED && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleMarkAsPaid(advance)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <HiOutlineCurrencyDollar className="size-4 mr-1" />
                          Marquer payée
                        </Button>
                      )}
                      {advance.status === PayrollAdvanceStatus.PAID && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={async () => {
                            setSelectedAdvance(advance);
                            await loadPayslipsForEmployee(advance.employee, advance.amount);
                            setShowDeductDialog(true);
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <HiOutlineCurrencyDollar className="size-4 mr-1" />
                          Déduire de la paie
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle paiement d'avance</DialogTitle>
            <DialogDescription>
              Créer un paiement d'avance sur salaire pour un employé
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormSelectField
                name="employee"
                label="Employé"
                placeholder="Sélectionner un employé"
                options={employees.map(emp => ({
                  value: emp.id,
                  label: `${emp.full_name} (${emp.employee_id})`
                }))}
                required
              />

              <FormInputField
                name="amount"
                label="Montant (GNF) *"
                type="number"
                placeholder="Ex: 500000"
                required
              />

              <FormTextareaField
                name="reason"
                label="Raison de la demande *"
                placeholder="Expliquez la raison de cette avance..."
                required
              />

              <FormTextareaField
                name="notes"
                label="Notes supplémentaires"
                placeholder="Notes optionnelles..."
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? "Création..." : "Créer la demande"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Examiner la demande</DialogTitle>
            <DialogDescription>
              Approuver ou rejeter cette demande d'avance
            </DialogDescription>
          </DialogHeader>

          {selectedAdvance && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Employé</div>
                <div className="font-semibold">{selectedAdvance.employee_name}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Montant demandé</div>
                <div className="text-2xl font-bold">
                  {selectedAdvance.amount.toLocaleString()} GNF
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Raison</div>
                <div className="text-sm">{selectedAdvance.reason}</div>
              </div>

              {selectedAdvance.notes && (
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="text-sm">{selectedAdvance.notes}</div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Raison du rejet (si rejet)
                </label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous rejetez cette demande..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              <HiOutlineXCircle className="size-4 mr-2" />
              Rejeter
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processing}
            >
              <HiOutlineCheckCircle className="size-4 mr-2" />
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deduct from Payslip Dialog */}
      <Dialog open={showDeductDialog} onOpenChange={setShowDeductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déduire l'avance de la paie</DialogTitle>
            <DialogDescription>
              Sélectionnez la fiche de paie de {selectedAdvance?.employee_name} pour déduire cette avance
            </DialogDescription>
          </DialogHeader>

          {selectedAdvance && (
            <div className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <div className="flex items-start gap-2">
                  <HiOutlineExclamationTriangle className="size-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Employé : {selectedAdvance.employee_name}</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Seules les fiches de paie de cet employé sont affichées ci-dessous
                    </p>
                  </div>
                </div>
              </Alert>

              <div>
                <div className="text-sm text-muted-foreground">Montant à déduire</div>
                <div className="text-2xl font-bold text-amber-700">
                  {selectedAdvance.amount.toLocaleString()} GNF
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Fiche de paie de {selectedAdvance.employee_name} *
                </label>
                {payslips.length === 0 ? (
                  <Alert variant="warning">
                    <p className="text-sm">
                      Aucune fiche de paie disponible pour {selectedAdvance.employee_name}.
                      Veuillez d'abord créer une fiche de paie pour cet employé.
                    </p>
                  </Alert>
                ) : (
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={selectedPayslip}
                    onChange={(e) => setSelectedPayslip(e.target.value)}
                  >
                    <option value="">Sélectionner une fiche de paie</option>
                    {payslips.map((payslip) => (
                    <option key={payslip.id} value={payslip.id}>
                      {payslip.payroll_period_name || `Période ${payslip.payroll_period}`} - Net: {payslip.net_salary?.toLocaleString()} GNF
                    </option>
                  ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeductDialog(false);
                setSelectedPayslip("");
                setPayslips([]);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDeductFromPayslip}
              disabled={processing || !selectedPayslip}
            >
              <HiOutlineCheckCircle className="size-4 mr-2" />
              Déduire et fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Hint */}
      <KeyboardHint />
    </div>
  );
}
