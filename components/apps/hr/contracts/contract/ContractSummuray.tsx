"use client";

import { Card } from "@/components/ui";
import { formatCurrency } from "@/lib";
import type { Contract } from "@/lib/types/hr";
import {
    HiOutlineBanknotes,
    HiOutlineCalendar,
    HiOutlineClock
} from "react-icons/hi2";


const SALARY_PERIOD_LABELS: Record<string, string> = {
  hourly: "h",
  daily: "jour",
  monthly: "mois",
  annual: "an",
};


export function ContractSummary({ contract, getDuration }: { contract: Contract, getDuration: () => string | null }) {
  return (
    <Card className={`p-6 border-0 shadow-sm ${contract.is_active ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Salaire */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground mb-1">
            <HiOutlineBanknotes className="size-4" />
            Salaire
          </div>
          <div className="text-3xl font-bold">
            {formatCurrency(contract.base_salary)}
          </div>
          <div className="text-sm text-muted-foreground">
            par {SALARY_PERIOD_LABELS[contract.salary_period || 'monthly']}
          </div>
        </div>

        {/* Durée */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
            <HiOutlineCalendar className="size-4" />
            Durée
          </div>
          <div className="text-3xl font-bold">
            {getDuration()}
          </div>
          <div className="text-sm text-muted-foreground">
            depuis le {new Date(contract.start_date).toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Heures */}
        <div className="text-center md:text-right">
          <div className="flex items-center justify-center md:justify-end gap-2 text-sm text-muted-foreground mb-1">
            <HiOutlineClock className="size-4" />
            Temps de travail
          </div>
          <div className="text-3xl font-bold">
            {contract.hours_per_week || 40}
            <span className="text-lg font-normal text-muted-foreground ml-1">h</span>
          </div>
          <div className="text-sm text-muted-foreground">
            par semaine
          </div>
        </div>
      </div>
    </Card>
  );
}
