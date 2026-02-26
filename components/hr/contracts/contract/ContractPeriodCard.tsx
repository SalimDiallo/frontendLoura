"use client";

import { Card } from "@/components/ui";
import {
    HiOutlineCalendar
} from "react-icons/hi2";



export function ContractPeriodCard({ startDate, endDate }: { startDate: string; endDate?: string | null }) {
  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <HiOutlineCalendar className="size-4" />
        PÉRIODE
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Date de début</span>
          <span className="font-medium">
            {new Date(startDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Date de fin</span>
          <span className="font-medium">
            {endDate ? (
              new Date(endDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            ) : (
              <span className="text-green-600">Indéterminée (CDI)</span>
            )}
          </span>
        </div>
      </div>
    </Card>
  );
}
