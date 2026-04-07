"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Payroll } from "@/lib/types/hr";
import { formatCurrency } from "@/lib/utils";
import {
    HiOutlineArrowPath,
    HiOutlineCheckCircle
} from "react-icons/hi2";

// ─── Stats bar shown above each table ────────────────────────────────────────
export function StatsBar({
  payslips,
  canViewPaies,
  processingId,
  onMarkAllPaid,
  isMine = false
}: {
  payslips: Payroll[];
  canViewPaies: boolean;
  processingId: string | null;
  onMarkAllPaid: (rows: Payroll[]) => void;
  isMine?: boolean
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

      {pendingCount > 0 && canViewPaies && isMine === false && (
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
