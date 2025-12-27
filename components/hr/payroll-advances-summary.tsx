"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  HiOutlineExclamationTriangle,
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import type { PayrollAdvance } from "@/lib/types/hr";
import { formatCurrency } from "@/lib/utils";

interface PayrollAdvancesSummaryProps {
  advances: PayrollAdvance[];
  employeeName?: string;
  onAdvanceSelect?: (advanceIds: string[]) => void;
  selectedAdvanceIds?: string[];
}

export function PayrollAdvancesSummary({
  advances,
  employeeName,
  onAdvanceSelect,
  selectedAdvanceIds = [],
}: PayrollAdvancesSummaryProps) {
  if (advances.length === 0) {
    return null;
  }

  const paidAdvances = advances.filter((a) => a.status === "paid");
  const totalAdvancesAmount = paidAdvances.reduce((sum, a) => sum + a.amount, 0);

  const toggleAdvanceSelection = (advanceId: string) => {
    if (!onAdvanceSelect) return;

    const isSelected = selectedAdvanceIds.includes(advanceId);
    const newSelection = isSelected
      ? selectedAdvanceIds.filter((id) => id !== advanceId)
      : [...selectedAdvanceIds, advanceId];

    onAdvanceSelect(newSelection);
  };

  if (paidAdvances.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <HiOutlineExclamationTriangle className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Avances sur salaire à déduire
            </h3>
            {employeeName && (
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                {employeeName} a {paidAdvances.length} avance(s) payée(s) en attente de déduction
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {paidAdvances.map((advance) => {
            const isSelected = selectedAdvanceIds.includes(advance.id);

            return (
              <div
                key={advance.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                    : "bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-800 hover:border-amber-300"
                }`}
                onClick={() => toggleAdvanceSelection(advance.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex size-8 items-center justify-center rounded-full ${
                    isSelected ? "bg-green-100 dark:bg-green-900/40" : "bg-amber-100 dark:bg-amber-900/40"
                  }`}>
                    {isSelected ? (
                      <HiOutlineCheckCircle className="size-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <HiOutlineCurrencyDollar className="size-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {formatCurrency(advance.amount)}
                      </span>
                      <Badge variant="default" className="text-xs bg-amber-200 text-amber-800">
                        {new Date(advance.payment_date || advance.request_date).toLocaleDateString('fr-FR')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {advance.reason}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <Badge variant="success" className="text-xs">
                    Sera déduit
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <Alert variant="warning" className="mt-3">
          <div className="flex items-start gap-2">
            <HiOutlineExclamationTriangle className="size-4 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Total à déduire : {formatCurrency(
                  paidAdvances
                    .filter(a => selectedAdvanceIds.includes(a.id))
                    .reduce((sum, a) => sum + a.amount, 0)
                )}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                {selectedAdvanceIds.length > 0
                  ? `Les avances sélectionnées seront automatiquement déduites du salaire net et marquées comme "Déduites".`
                  : "Sélectionnez les avances à déduire en cliquant dessus."}
              </p>
            </div>
          </div>
        </Alert>
      </div>
    </Card>
  );
}
