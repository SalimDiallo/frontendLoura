"use client";

import { Can } from "@/components/apps/common";
import { ActionConfirmation, DeleteConfirmation } from "@/components/common/confirmation-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Payroll } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { formatCurrency } from "@/lib/utils";
import { getStatusBadgeNode } from "@/lib/utils/BadgeStatus";
import { Download, Eye, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiOutlineArrowPath } from "react-icons/hi2";

// ─── Shared payslip table rendered identically for both tabs ─────────────────
export function PayslipsTable({
  payslips,
  slug,
  canViewPaies,
  processingId,
  onMarkPaid,
  onDeletePayslip,
  onPreviewPDF,
  isMine = false,
}: {
  payslips: Payroll[];
  slug: string;
  canViewPaies: boolean;
  processingId: string | null;
  onMarkPaid: (id: string) => void;
  onDeletePayslip: (id: string) => void;
  isMine?: boolean;
  onPreviewPDF: (id: string, name: string) => void;
}) {
  const router = useRouter();
  // State for tracking which payslip is being considered for delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // State for tracking which payslip is being considered for mark-as-paid
  const [pendingPayId, setPendingPayId] = useState<string | null>(null);

  // Handler to confirm deletion
  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      onDeletePayslip(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  // Handler to cancel deletion
  const handleCancelDelete = () => {
    setPendingDeleteId(null);
  };

  // Handler to confirm mark-as-paid
  const handleConfirmPay = () => {
    if (pendingPayId) {
      onMarkPaid(pendingPayId);
      setPendingPayId(null);
    }
  };

  // Handler to cancel mark-as-paid
  const handleCancelPay = () => {
    setPendingPayId(null);
  };

  return (
    <>
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
                  {isMine == false && (
                    <Can permission={COMMON_PERMISSIONS.HR.UPDATE_PAYROLL}>
                      {payslip.status !== "paid" && canViewPaies && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPendingPayId(String(payslip.id))}
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
                          onClick={() => setPendingDeleteId(String(payslip.id))}
                        >
                          <Trash />
                        </Button>
                      )}
                    </Can>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DeleteConfirmation
        open={pendingDeleteId !== null}
        description="Voulez-vous vraiment supprimer cette fiche de paie ? Cette action est irréversible."
        onConfirm={handleConfirmDelete}
        onOpenChange={handleCancelDelete}
      />
      <ActionConfirmation
      action={
        {label: "Valider la paiement"}
      }
        open={pendingPayId !== null}
        description="Confirmer le paiement de cette fiche de paie ? Cette action est irréversible."
        onConfirm={handleConfirmPay}
        onOpenChange={handleCancelPay}
      />
    </>
  );
}
