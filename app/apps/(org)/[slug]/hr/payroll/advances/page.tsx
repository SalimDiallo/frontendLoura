"use client";

import { Can } from "@/components/apps/common";
import { ConfirmationDialog, DeleteConfirmation } from "@/components/common/confirmation-dialog";
import { Label, Textarea } from "@/components/ui";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  approvePayrollAdvance,
  createPayrollAdvance,
  deletePayrollAdvance,
  getMyPayrollAdvances,
  getPayrollAdvances,
  rejectPayrollAdvance,
} from "@/lib/services/hr/payroll-advance.service";
import type { PayrollAdvance } from "@/lib/types/hr";
import { PayrollAdvanceStatus } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { formatCurrency } from "@/lib/utils";
import { getStatusBadgeNode } from "@/lib/utils/BadgeStatus";
import { parseApiError } from "@/lib/utils/format-api-errors";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
  HiOutlineClipboardDocument,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineFunnel,
  HiOutlineInformationCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineNoSymbol,
  HiOutlinePlusCircle,
  HiOutlineUserCircle,
  HiOutlineXCircle,
  HiOutlineXMark,
} from "react-icons/hi2";

// =================================================================================
// UTILITY FUNCTIONS
// =================================================================================

function formatDateFr(dateStr?: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTimeFr(dateStr?: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status: string) {
  switch (status) {
    case "pending":
      return {
        label: "En attente",
        icon: HiOutlineClock,
        color: "text-yellow-600",
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-800",
      };
    case "approved":
      return {
        label: "Approuvée",
        icon: HiOutlineCheckCircle,
        color: "text-green-600",
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800",
      };
    case "rejected":
      return {
        label: "Rejetée",
        icon: HiOutlineXCircle,
        color: "text-red-600",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
      };
    case "deducted":
      return {
        label: "Déduite",
        icon: HiOutlineBanknotes,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
      };
    default:
      return {
        label: status,
        icon: HiOutlineInformationCircle,
        color: "text-gray-600",
        bg: "bg-gray-50",
        border: "border-gray-200",
      };
  }
}

// =================================================================================
// COMPONENTS
// =================================================================================

// Loading skeleton
function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-muted rounded w-64 mb-2" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-muted rounded" />
          <div className="h-9 w-40 bg-muted rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-10 bg-muted rounded w-80" />
      <div className="h-96 bg-muted rounded-xl" />
    </div>
  );
}

// Alerts section
function PageAlerts({
  error,
  success,
  onClearError,
  onClearSuccess,
}: {
  error?: string | null;
  success?: string | null;
  onClearError?: () => void;
  onClearSuccess?: () => void;
}) {
  return (
    <>
      {error && (
        <Alert variant="error" className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HiOutlineExclamationTriangle className="size-4 shrink-0" />
            <span className="whitespace-pre-line">{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearError}>
            <HiOutlineXMark className="size-4" />
          </Button>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="flex justify-between items-center">
          <span>{success}</span>
          <Button variant="ghost" size="sm" onClick={onClearSuccess}>
            <HiOutlineXMark className="size-4" />
          </Button>
        </Alert>
      )}
    </>
  );
}

// Stats cards
function StatsCards({
  advances,
  title,
}: {
  advances: PayrollAdvance[];
  title: string;
}) {
  const stats = useMemo(() => {
    const pending = advances.filter(
      (a) => a.status === PayrollAdvanceStatus.PENDING
    );
    const approved = advances.filter(
      (a) => a.status === PayrollAdvanceStatus.APPROVED
    );
    const rejected = advances.filter(
      (a) => a.status === PayrollAdvanceStatus.REJECTED
    );
    const deducted = advances.filter(
      (a) => a.status === PayrollAdvanceStatus.DEDUCTED
    );
    return {
      total: advances.length,
      pending: pending.length,
      pendingAmount: pending.reduce((s, a) => s + Number(a.amount), 0),
      approved: approved.length,
      approvedAmount: approved.reduce((s, a) => s + Number(a.amount), 0),
      rejected: rejected.length,
      deducted: deducted.length,
      deductedAmount: deducted.reduce((s, a) => s + Number(a.amount), 0),
      totalAmount: advances.reduce((s, a) => s + Number(a.amount), 0),
    };
  }, [advances]);

  const cards = [
    {
      label: title === "my" ? "Mes demandes" : "Total demandes",
      value: stats.total,
      icon: HiOutlineClipboardDocument,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600",
    },
    {
      label: "En attente",
      value: stats.pending,
      subtitle: stats.pendingAmount > 0 ? formatCurrency(stats.pendingAmount) : undefined,
      icon: HiOutlineClock,
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600",
    },
    {
      label: "Approuvées",
      value: stats.approved + stats.deducted,
      subtitle:
        stats.approvedAmount + stats.deductedAmount > 0
          ? formatCurrency(stats.approvedAmount + stats.deductedAmount)
          : undefined,
      icon: HiOutlineCheckCircle,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600",
    },
    {
      label: "Montant total",
      value: formatCurrency(stats.totalAmount),
      isAmount: true,
      icon: HiOutlineBanknotes,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
              <card.icon className={`size-5 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className={`${card.isAmount ? "text-lg" : "text-2xl"} font-bold truncate`}>
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {card.subtitle}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Detail panel for an advance
function AdvanceDetailPanel({
  advance,
  onClose,
  onApprove,
  onReject,
  onDelete,
  canApprove,
  loading,
}: {
  advance: PayrollAdvance;
  onClose: () => void;
  onApprove?: (adv: PayrollAdvance) => void;
  onReject?: (adv: PayrollAdvance) => void;
  onDelete?: (adv: PayrollAdvance) => void;
  canApprove?: boolean;
  loading?: boolean;
}) {
  const config = getStatusConfig(advance.status);
  const StatusIcon = config.icon;

  // Build timeline steps
  const timeline: {
    label: string;
    date?: string;
    isDateTime?: boolean;
    detail?: string;
    status: "done" | "current" | "pending" | "rejected";
    icon: typeof HiOutlineClock;
  }[] = [];

  // Step 1: Demandée
  timeline.push({
    label: "Demande créée",
    date: advance.created_at || advance.request_date,
    isDateTime: !!advance.created_at,
    detail: advance.employee_name || undefined,
    status: "done",
    icon: HiOutlineClipboardDocument,
  });

  // Step 2: Approved / Rejected / Pending
  if (advance.status === "rejected") {
    timeline.push({
      label: "Rejetée",
      date: advance.approved_date || undefined,
      isDateTime: true,
      detail: advance.approved_by_name
        ? `Par ${advance.approved_by_name}`
        : undefined,
      status: "rejected",
      icon: HiOutlineXCircle,
    });
  } else if (advance.status === "pending") {
    timeline.push({
      label: "En attente d'approbation",
      status: "current",
      icon: HiOutlineClock,
    });
  } else {
    timeline.push({
      label: "Approuvée",
      date: advance.approved_date || undefined,
      isDateTime: true,
      detail: advance.approved_by_name
        ? `Par ${advance.approved_by_name}`
        : undefined,
      status: "done",
      icon: HiOutlineCheckCircle,
    });
  }

  // Step 3: Deducted
  if (advance.status === "deducted") {
    timeline.push({
      label: "Déduite du salaire",
      date: advance.deduction_month || undefined,
      isDateTime: false,
      detail: advance.payslip_reference
        ? `Fiche: ${advance.payslip_reference}`
        : undefined,
      status: "done",
      icon: HiOutlineBanknotes,
    });
  } else if (advance.status === "approved") {
    timeline.push({
      label: "En attente de déduction",
      status: "current",
      icon: HiOutlineBanknotes,
    });
  }

  return (
    <Dialog open={!!advance} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HiOutlineDocumentText className="size-5" />
            Détails de l&apos;avance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Status Banner */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border ${config.bg} ${config.border}`}
          >
            <StatusIcon className={`size-6 ${config.color}`} />
            <div>
              <p className={`font-semibold ${config.color}`}>{config.label}</p>
              <p className="text-xs text-muted-foreground">
                Demande du {formatDateFr(advance.request_date)}
              </p>
            </div>
            <p className="ml-auto text-xl font-bold">
              {formatCurrency(advance.amount)}
            </p>
          </div>

          {/* Employee Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-primary/10">
              <HiOutlineUserCircle className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{advance.employee_name}</p>
              {advance.employee_id_number && (
                <p className="text-xs text-muted-foreground">
                  ID: {advance.employee_id_number}
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Motif
            </p>
            <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-lg">
              {advance.reason || "Aucun motif fourni"}
            </p>
          </div>

          {/* Rejection Reason */}
          {advance.status === "rejected" && advance.rejection_reason && (
            <div>
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">
                Raison du rejet
              </p>
              <p className="text-sm leading-relaxed bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                {advance.rejection_reason}
              </p>
            </div>
          )}

          {/* Notes */}
          {advance.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-lg">
                {advance.notes}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Progression
            </p>
            <div className="space-y-0">
              {timeline.map((step, i) => {
                const StepIcon = step.icon;
                const isLast = i === timeline.length - 1;
                return (
                  <div key={i} className="flex gap-3">
                    {/* Vertical line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`p-1.5 rounded-full ${
                          step.status === "done"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : step.status === "current"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400"
                            : step.status === "rejected"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-muted"
                        }`}
                      >
                        <StepIcon
                          className={`size-3.5 ${
                            step.status === "done"
                              ? "text-green-600"
                              : step.status === "current"
                              ? "text-yellow-600"
                              : step.status === "rejected"
                              ? "text-red-600"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-px flex-1 my-1 ${
                            step.status === "done"
                              ? "bg-green-300 dark:bg-green-700"
                              : "bg-muted-foreground/20"
                          }`}
                        />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                      <p className="text-sm font-medium">{step.label}</p>
                      {step.date && (
                        <p className="text-xs text-muted-foreground">
                          {step.isDateTime ? formatDateTimeFr(step.date) : formatDateFr(step.date)}
                        </p>
                      )}
                      {step.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.detail}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment info */}
          {advance.payment_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HiOutlineBanknotes className="size-4" />
              <span>Date de paiement : {formatDateFr(advance.payment_date)}</span>
            </div>
          )}

          {/* Payslip reference */}
          {advance.payslip_reference && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HiOutlineDocumentText className="size-4" />
              <span>Fiche de paie : {advance.payslip_reference}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {/* Delete button for own pending advances */}
          {onDelete && advance.status === "pending" && (
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => onDelete(advance)}
              disabled={loading}
            >
              <HiOutlineXMark className="size-4 mr-1" />
              Annuler la demande
            </Button>
          )}

          {/* Approve / Reject buttons for managers */}
          {canApprove && advance.status === "pending" && (
            <>
              {onReject && (
                <Button
                  variant="outline"
                  onClick={() => onReject(advance)}
                  disabled={loading}
                >
                  <HiOutlineXCircle className="size-4 mr-1" />
                  Rejeter
                </Button>
              )}
              {onApprove && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onApprove(advance)}
                  disabled={loading}
                >
                  <HiOutlineCheckCircle className="size-4 mr-1" />
                  Approuver
                </Button>
              )}
            </>
          )}

          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Advances table (generic, used for both tabs)
function AdvancesTable({
  advances,
  loadingId,
  showEmployee,
  showActions,
  onView,
  onApprove,
  onReject,
  onDelete,
}: {
  advances: PayrollAdvance[];
  loadingId?: string | null;
  showEmployee?: boolean;
  showActions?: "own" | "manage";
  onView: (adv: PayrollAdvance) => void;
  onApprove?: (adv: PayrollAdvance) => void;
  onReject?: (adv: PayrollAdvance) => void;
  onDelete?: (adv: PayrollAdvance) => void;
}) {
  if (!advances.length)
    return (
      <div className="p-16 text-center">
        <HiOutlineCurrencyDollar className="size-16 mx-auto mb-4 text-muted-foreground/20" />
        <p className="text-lg font-medium mb-2">Aucune avance trouvée</p>
        <p className="text-sm text-muted-foreground">
          {showActions === "own"
            ? "Vous n'avez aucune demande d'avance sur salaire"
            : "Aucune demande d'avance à afficher"}
        </p>
      </div>
    );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showEmployee && <TableHead>Employé</TableHead>}
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead>Motif</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Traité par</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {advances.map((advance) => {
          const config = getStatusConfig(advance.status);
          return (
            <TableRow
              key={advance.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onView(advance)}
            >
              {showEmployee && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary/10">
                      <HiOutlineUserCircle className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {advance.employee_name}
                      </p>
                      {advance.employee_id_number && (
                        <p className="text-xs text-muted-foreground">
                          {advance.employee_id_number}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
              )}
              <TableCell className="text-sm">
                {formatDateFr(advance.request_date)}
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums">
                {formatCurrency(advance.amount)}
              </TableCell>
              <TableCell className="max-w-[200px]">
                <p className="truncate text-sm">{advance.reason}</p>
              </TableCell>
              <TableCell>
                {getStatusBadgeNode(advance.status)}
              </TableCell>
              <TableCell>
                {advance.approved_by_name ? (
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      {advance.approved_by_name}
                    </p>
                    {advance.approved_date && (
                      <p className="text-xs text-muted-foreground/70">
                        {formatDateFr(advance.approved_date)}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    -
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div
                  className="flex justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Own: can delete pending */}
                  {showActions === "own" &&
                    advance.status === PayrollAdvanceStatus.PENDING &&
                    onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-8 px-2"
                        onClick={() => onDelete(advance)}
                        disabled={loadingId === advance.id}
                      >
                        <HiOutlineXMark className="size-4 mr-1" />
                        Annuler
                      </Button>
                    )}

                  {/* Manager: approve / reject pending */}
                  {showActions === "manage" &&
                    advance.status === PayrollAdvanceStatus.PENDING && (
                      <>
                        {onApprove && (
                          <Button
                            size="sm"
                            onClick={() => onApprove(advance)}
                            disabled={loadingId === advance.id}
                            className="bg-green-600 hover:bg-green-700 h-8 px-2.5"
                          >
                            <HiOutlineCheckCircle className="size-4 mr-1" />
                            Approuver
                          </Button>
                        )}
                        {onReject && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5"
                            onClick={() => onReject(advance)}
                            disabled={loadingId === advance.id}
                          >
                            Rejeter
                          </Button>
                        )}
                      </>
                    )}

                  {/* View detail */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => onView(advance)}
                  >
                    <HiOutlineChevronRight className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Create advance dialog
function CreateAdvanceDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", reason: "" });

  const handleSubmit = async () => {
    setError(null);
    if (!form.amount || !form.reason) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    if (Number(form.amount) <= 0) {
      setError("Le montant doit être supérieur à 0");
      return;
    }
    try {
      setProcessing(true);
      await createPayrollAdvance({
        employee: user?.id || "",
        amount: Number(form.amount),
        reason: form.reason,
      });
      setForm({ amount: "", reason: "" });
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HiOutlineCurrencyDollar className="size-5" />
            Nouvelle demande d&apos;avance
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert variant="info" className="text-sm">
            <HiOutlineInformationCircle className="size-4 mr-1.5 inline" />
            Cette demande sera soumise à approbation par votre responsable.
          </Alert>
          {error && (
            <Alert variant="error" className="text-sm">
              {error}
            </Alert>
          )}
          <div>
            <Label>Montant *</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm((p) => ({ ...p, amount: e.target.value }))
              }
              placeholder="Ex: 500000"
              className="mt-2"
              min="0"
              step="1000"
            />
            {Number(form.amount) > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(Number(form.amount))}
              </p>
            )}
          </div>
          <div>
            <Label>Motif de la demande *</Label>
            <Textarea
              value={form.reason}
              onChange={(e) =>
                setForm((p) => ({ ...p, reason: e.target.value }))
              }
              placeholder="Expliquez la raison de votre demande d'avance..."
              className="mt-2"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.amount || !form.reason || processing}
          >
            {processing ? "Création..." : "Soumettre la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Approve advance dialog
function ApproveAdvanceDialog({
  open,
  advance,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  advance?: PayrollAdvance | null;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title="Approuver la demande d'avance"
      confirmLabel="Approuver"
      loading={loading}
      onConfirm={onConfirm}
      description={
        advance ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-primary/10">
                <HiOutlineUserCircle className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{advance.employee_name}</p>
                {advance.employee_id_number && (
                  <p className="text-xs text-muted-foreground">
                    {advance.employee_id_number}
                  </p>
                )}
              </div>
              <p className="ml-auto text-lg font-bold text-primary">
                {formatCurrency(advance.amount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Motif
              </p>
              <p className="text-sm text-muted-foreground">{advance.reason}</p>
            </div>
          </div>
        ) : null
      }
    />
  );
}

// Reject advance dialog
function RejectAdvanceDialog({
  open,
  advance,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  advance?: PayrollAdvance | null;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title="Rejeter la demande d'avance"
      confirmLabel="Rejeter"
      loading={loading}
      onConfirm={() => onConfirm(reason)}
      description={
        advance ? (
          <div className="space-y-4 py-1">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-primary/10">
                <HiOutlineUserCircle className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{advance.employee_name}</p>
              </div>
              <p className="ml-auto text-lg font-bold text-primary">
                {formatCurrency(advance.amount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Motif de la demande
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                {advance.reason}
              </p>
            </div>
            <div>
              <Label>Raison du rejet *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                rows={3}
                className="mt-2"
                required
                autoFocus
              />
            </div>
          </div>
        ) : null
      }
    />
  );
}

// Status filter
function StatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <HiOutlineFunnel className="size-3.5 text-muted-foreground" />
          <SelectValue placeholder="Tous les statuts" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tous les statuts</SelectItem>
        <SelectItem value="pending">
          <div className="flex items-center gap-2">
            <HiOutlineClock className="size-3.5 text-yellow-600" />
            En attente
          </div>
        </SelectItem>
        <SelectItem value="approved">
          <div className="flex items-center gap-2">
            <HiOutlineCheckCircle className="size-3.5 text-green-600" />
            Approuvées
          </div>
        </SelectItem>
        <SelectItem value="rejected">
          <div className="flex items-center gap-2">
            <HiOutlineNoSymbol className="size-3.5 text-red-600" />
            Rejetées
          </div>
        </SelectItem>
        <SelectItem value="deducted">
          <div className="flex items-center gap-2">
            <HiOutlineBanknotes className="size-3.5 text-blue-600" />
            Déduites
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

// =================================================================================
// MAIN PAGE COMPONENT
// =================================================================================

export default function PayrollAdvancesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { isEmployee } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myAdvances, setMyAdvances] = useState<PayrollAdvance[]>([]);
  const [allAdvances, setAllAdvances] = useState<PayrollAdvance[]>([]);
  const [activeTab, setActiveTab] = useState("my-advances");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerStatusFilter, setManagerStatusFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAdvance, setDeletingAdvance] =
    useState<PayrollAdvance | null>(null);
  const [selectedAdvance, setSelectedAdvance] =
    useState<PayrollAdvance | null>(null);
  const [viewingAdvance, setViewingAdvance] =
    useState<PayrollAdvance | null>(null);

  // Data loading
  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const myAdvancesData = await getMyPayrollAdvances().catch(() => []);
      setMyAdvances(myAdvancesData || []);
      try {
        const allAdvancesData = await getPayrollAdvances({
          organization_subdomain: slug,
          exclude_own: true,
        });
        setAllAdvances(allAdvancesData || []);
      } catch {
        setAllAdvances([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Computed values
  const pendingToApprove = allAdvances.filter(
    (a) => a.status === PayrollAdvanceStatus.PENDING
  );

  // Filter: My advances
  const filteredMyAdvances = useMemo(() => {
    return myAdvances.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [myAdvances, statusFilter]);

  // Filter: Manager advances
  const filteredAllAdvances = useMemo(() => {
    return allAdvances.filter((a) => {
      if (managerStatusFilter !== "all" && a.status !== managerStatusFilter)
        return false;
      if (
        searchQuery &&
        !a.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !a.reason?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !a.employee_id_number
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [allAdvances, managerStatusFilter, searchQuery]);

  // HANDLERS
  function handleDeleteAdvance(a: PayrollAdvance) {
    setDeletingAdvance(a);
    setShowDeleteDialog(true);
  }

  async function confirmDeleteAdvance() {
    if (!deletingAdvance) return;
    try {
      setProcessingId(deletingAdvance.id);
      await deletePayrollAdvance(deletingAdvance.id);
      setSuccess("Demande supprimée avec succès");
      setViewingAdvance(null);
      setShowDeleteDialog(false);
      setDeletingAdvance(null);
      await loadData();
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    } finally {
      setProcessingId(null);
    }
  }

  function handleApproveAdvance(advance: PayrollAdvance) {
    setSelectedAdvance(advance);
    setShowApproveDialog(true);
  }

  function handleRejectAdvance(advance: PayrollAdvance) {
    setSelectedAdvance(advance);
    setShowRejectDialog(true);
  }

  async function confirmApproveAdvance() {
    if (!selectedAdvance) return;
    try {
      setProcessingId(selectedAdvance.id);
      await approvePayrollAdvance(selectedAdvance.id);
      setSuccess(
        `Avance de ${formatCurrency(selectedAdvance.amount)} approuvée pour ${selectedAdvance.employee_name}`
      );
      setShowApproveDialog(false);
      setSelectedAdvance(null);
      setViewingAdvance(null);
      await loadData();
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    } finally {
      setProcessingId(null);
    }
  }

  async function confirmRejectAdvance(reason: string) {
    if (!selectedAdvance || !reason) {
      setError("Veuillez fournir une raison de rejet");
      return;
    }
    try {
      setProcessingId(selectedAdvance.id);
      await rejectPayrollAdvance(selectedAdvance.id, reason);
      setSuccess("Demande rejetée avec succès");
      setShowRejectDialog(false);
      setSelectedAdvance(null);
      setViewingAdvance(null);
      await loadData();
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    } finally {
      setProcessingId(null);
    }
  }

  // =================================================================================
  // RENDER
  // =================================================================================

  if (loading) return <PageLoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <PageAlerts
        error={error}
        success={success}
        onClearError={() => setError(null)}
        onClearSuccess={() => setSuccess(null)}
      />

      {/* Dialogs */}
      <ApproveAdvanceDialog
        open={showApproveDialog}
        advance={selectedAdvance}
        loading={processingId === selectedAdvance?.id}
        onConfirm={confirmApproveAdvance}
        onClose={() => {
          setShowApproveDialog(false);
          setSelectedAdvance(null);
        }}
      />
      <RejectAdvanceDialog
        open={showRejectDialog}
        advance={selectedAdvance}
        loading={processingId === selectedAdvance?.id}
        onConfirm={confirmRejectAdvance}
        onClose={() => {
          setShowRejectDialog(false);
          setSelectedAdvance(null);
        }}
      />
      <CreateAdvanceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={loadData}
      />
      <DeleteConfirmation
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setDeletingAdvance(null);
          }
        }}
        itemName={
          deletingAdvance
            ? `Avance de ${formatCurrency(deletingAdvance.amount)}`
            : undefined
        }
        title="Annuler la demande d'avance"
        description={
          deletingAdvance
            ? `Êtes-vous sûr de vouloir annuler votre demande d'avance de ${formatCurrency(deletingAdvance.amount)} ? Cette action est irréversible.`
            : undefined
        }
        onConfirm={confirmDeleteAdvance}
        loading={processingId === deletingAdvance?.id}
      />

      {/* Detail panel */}
      {viewingAdvance && (
        <AdvanceDetailPanel
          advance={viewingAdvance}
          onClose={() => setViewingAdvance(null)}
          onApprove={
            activeTab === "to-approve" ? handleApproveAdvance : undefined
          }
          onReject={
            activeTab === "to-approve" ? handleRejectAdvance : undefined
          }
          onDelete={
            activeTab === "my-advances" ? handleDeleteAdvance : undefined
          }
          canApprove={activeTab === "to-approve"}
          loading={processingId === viewingAdvance.id}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HiOutlineCurrencyDollar className="size-7" />
            Avances sur Salaire
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos demandes d&apos;avances et suivez leur statut
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadData} title="Rafraîchir">
            <HiOutlineArrowPath className="size-4" />
          </Button>
          {isEmployee && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <HiOutlinePlusCircle className="size-4 mr-2" />
              Demander une avance
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="my-advances" className="flex items-center gap-2">
            <HiOutlineClipboardDocument className="size-4" />
            Mes demandes
            {myAdvances.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 justify-center text-xs">
                {myAdvances.length}
              </Badge>
            )}
          </TabsTrigger>
          <Can permission={COMMON_PERMISSIONS.HR.APPROVE_PAYROLL}>
            <TabsTrigger
              value="to-approve"
              className="flex items-center gap-2 relative"
            >
              <HiOutlineCheckCircle className="size-4" />
              Gestion
              {pendingToApprove.length > 0 && (
                <Badge
                  variant="warning"
                  className="ml-1 h-5 min-w-[20px] px-1.5 justify-center text-xs animate-pulse"
                >
                  {pendingToApprove.length}
                </Badge>
              )}
            </TabsTrigger>
          </Can>
        </TabsList>

        {/* Tab 1: My advances */}
        <TabsContent value="my-advances" className="mt-6 space-y-4">
          {/* Stats */}
          <StatsCards advances={myAdvances} title="my" />

          {/* Filter bar */}
          {myAdvances.length > 0 && (
            <div className="flex items-center gap-3">
              <StatusFilter value={statusFilter} onChange={setStatusFilter} />
              {statusFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="text-xs"
                >
                  Effacer le filtre
                </Button>
              )}
              <span className="text-sm text-muted-foreground ml-auto">
                {filteredMyAdvances.length} résultat
                {filteredMyAdvances.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Table */}
          <Card>
            {myAdvances.length === 0 ? (
              <div className="p-16 text-center">
                <HiOutlineCurrencyDollar className="size-16 mx-auto mb-4 text-muted-foreground/20" />
                <p className="text-lg font-medium mb-2">
                  Aucune demande d&apos;avance
                </p>
                <p className="text-muted-foreground mb-6 text-sm">
                  Vous n&apos;avez encore fait aucune demande d&apos;avance sur salaire
                </p>
                {isEmployee && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <HiOutlinePlusCircle className="size-4 mr-2" />
                    Faire ma première demande
                  </Button>
                )}
              </div>
            ) : (
              <AdvancesTable
                advances={filteredMyAdvances}
                loadingId={processingId}
                showActions="own"
                onView={setViewingAdvance}
                onDelete={handleDeleteAdvance}
              />
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: Manager view */}
        <TabsContent value="to-approve" className="mt-6 space-y-4">
          {/* Stats */}
          <StatsCards advances={allAdvances} title="manage" />

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un employé ou motif..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <StatusFilter
              value={managerStatusFilter}
              onChange={setManagerStatusFilter}
            />
            {(searchQuery || managerStatusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setManagerStatusFilter("all");
                }}
                className="text-xs"
              >
                Effacer les filtres
              </Button>
            )}
            <span className="text-sm text-muted-foreground sm:ml-auto">
              {filteredAllAdvances.length} résultat
              {filteredAllAdvances.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table */}
          <Card>
            <AdvancesTable
              advances={filteredAllAdvances}
              loadingId={processingId}
              showEmployee
              showActions="manage"
              onView={setViewingAdvance}
              onApprove={handleApproveAdvance}
              onReject={handleRejectAdvance}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Back link */}
      <div className="flex justify-center pt-4">
        <Link
          href={`/apps/${slug}/hr/payroll`}
          className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
        >
          ← Retour à la gestion de la paie
        </Link>
      </div>
    </div>
  );
}
