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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      <Card
        className={cn(
          "p-2 border-0 shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/20",
          !filters.status && "ring-2 ring-primary/30"
        )}
        onClick={() => handleFilterChange("status", "")}
      >
        <div className="text-[11px] text-muted-foreground">Total</div>
        <div className="text-lg font-bold mt-0.5">{stats.total}</div>
      </Card>
      <Card
        className={cn(
          "p-2 border-0 shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-green-500/20",
          filters.status === "active" && "ring-2 ring-green-500/50"
        )}
        onClick={() => handleFilterChange("status", filters.status === "active" ? "" : "active")}
      >
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <HiOutlineCheckCircle className="size-2.5 text-green-500" />
          Actifs
        </div>
        <div className="text-lg font-bold mt-0.5 text-green-600 dark:text-green-400">
          {stats.active}
        </div>
      </Card>
      <Card
        className={cn(
          "p-2 border-0 shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-foreground/20",
          filters.status === "on_leave" && "ring-2 ring-foreground/50"
        )}
        onClick={() => handleFilterChange("status", filters.status === "on_leave" ? "" : "on_leave")}
      >
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <LuCalendarOff className="size-2.5 text-foreground" />
          En congé
        </div>
        <div className="text-lg font-bold mt-0.5 text-foreground dark:text-blue-400">
          {stats.onLeave}
        </div>
      </Card>
      <Card
        className={cn(
          "p-2 border-0 shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-orange-500/20",
          (filters.status === "suspended" || filters.status === "terminated") && "ring-2 ring-orange-500/50"
        )}
        onClick={() => handleFilterChange("status", filters.status === "suspended" ? "" : "suspended")}
      >
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <LuPause className="size-2.5 text-orange-500" />
          Inactifs
        </div>
        <div className="text-lg font-bold mt-0.5 text-orange-600 dark:text-orange-400">
          {stats.inactive}
        </div>
      </Card>
      <Card className="p-2 border-0 shadow-sm">
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <HiOutlineBanknotes className="size-2.5 text-emerald-500" />
          Masse Salariale
        </div>
        <div className="text-base font-bold mt-0.5 text-emerald-600 dark:text-emerald-400 truncate" title={formatCurrency(stats.totalSalary)}>
          {formatCurrency(stats.totalSalary)}
        </div>
      </Card>
    </div>
  );
}
