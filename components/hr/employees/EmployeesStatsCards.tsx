"use client";


import {
  HiOutlineCheckCircle,
  HiOutlineBanknotes,
} from "react-icons/hi2";
import {  LuCalendarOff, LuPause } from "react-icons/lu";
import {  Card } from "@/components/ui";

import { cn } from "@/lib/utils";


export function EmployeesStatsCards({
  stats,
  filters,
  handleFilterChange,
  formatCurrency,
}: {
  stats: any;
  filters: Record<string, any>;
  handleFilterChange: (key: string, value: string) => void;
  formatCurrency: (val: any) => string;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card
        className={cn(
          "p-4 border shadow-sm cursor-pointer transition-all hover:border-primary",
          !filters.status && "border-primary"
        )}
        onClick={() => handleFilterChange("status", "")}
      >
        <div className="text-xs text-muted-foreground font-medium">Total</div>
        <div className="text-2xl font-semibold mt-2">{stats.total}</div>
      </Card>
      <Card
        className={cn(
          "p-4 border shadow-sm cursor-pointer transition-all hover:border-green-500",
          filters.status === "active" && "border-green-500"
        )}
        onClick={() => handleFilterChange("status", filters.status === "active" ? "" : "active")}
      >
        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <HiOutlineCheckCircle className="size-3.5 text-green-600" />
          Actifs
        </div>
        <div className="text-2xl font-semibold mt-2 text-green-600">
          {stats.active}
        </div>
      </Card>
      <Card
        className={cn(
          "p-4 border shadow-sm cursor-pointer transition-all hover:border-blue-500",
          filters.status === "on_leave" && "border-blue-500"
        )}
        onClick={() => handleFilterChange("status", filters.status === "on_leave" ? "" : "on_leave")}
      >
        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <LuCalendarOff className="size-3.5 text-blue-600" />
          En congé
        </div>
        <div className="text-2xl font-semibold mt-2 text-blue-600">
          {stats.onLeave}
        </div>
      </Card>
      <Card
        className={cn(
          "p-4 border shadow-sm cursor-pointer transition-all hover:border-orange-500",
          (filters.status === "suspended" || filters.status === "terminated") && "border-orange-500"
        )}
        onClick={() => handleFilterChange("status", filters.status === "suspended" ? "" : "suspended")}
      >
        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <LuPause className="size-3.5 text-orange-600" />
          Inactifs
        </div>
        <div className="text-2xl font-semibold mt-2 text-orange-600">
          {stats.inactive}
        </div>
      </Card>
      <Card className="p-4 border shadow-sm">
        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <HiOutlineBanknotes className="size-3.5 text-emerald-600" />
          Masse Salariale
        </div>
        <div className="text-xl font-semibold mt-2 text-emerald-600 truncate" title={formatCurrency(stats.totalSalary)}>
          {formatCurrency(stats.totalSalary)}
        </div>
      </Card>
    </div>
  );
}
