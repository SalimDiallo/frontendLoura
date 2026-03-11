"use client";

import { HRReportPDF } from "../../../../../components/apps/hr/HRReportPDF";

import { Can } from "@/components/apps/common";
import {
  Badge,
  Button,
  Card,
  EmptyState
} from "@/components/ui";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { getDepartmentStats, getHRStats } from "@/lib/services/hr";
import type { DepartmentStats, HRStats, LeaveRequest } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Shield,
  DollarSign,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis
} from "recharts";

// ─── Helpers ────────────────────────────────────────────────
function fmtCurrency(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}Md`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("fr-FR");
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Component ──────────────────────────────────────────────
export default function HRDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [stats, setStats] = useState<HRStats | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [payrollTrend, setPayrollTrend] = useState<any[]>([]);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // All data comes from the enhanced backend stats endpoint now
      // No more separate attendance API call — it's pre-aggregated
      const [statsData, deptStats] = await Promise.allSettled([
        getHRStats(slug),
        getDepartmentStats(slug),
      ]);

      if (statsData.status === "fulfilled" && statsData.value) {
        setStats(statsData.value);
        if (statsData.value.payroll_trend && Array.isArray(statsData.value.payroll_trend)) {
          setPayrollTrend(
            statsData.value.payroll_trend.map((item) => ({
              month: item.month,
              fullMonth: item.full_month,
              montant: item.montant,
              employes: item.employes,
            }))
          );
        }
      }

      if (deptStats?.status === "fulfilled" && Array.isArray(deptStats?.value)) {
        setDepartmentStats(deptStats.value);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Computed values ──────────────────────────────────────
  const activityRate = useMemo(() => {
    if (!stats || stats.total_employees === 0) return 0;
    return Math.round((stats.active_employees / stats.total_employees) * 100);
  }, [stats]);

  // Use backend-computed variation (server-side is more reliable)
  const payrollVariation = useMemo(() => {
    return stats?.payroll_variation ?? 0;
  }, [stats]);

  // Use backend pre-aggregated attendance data
  const attendanceSummary = useMemo(() => {
    if (stats?.attendance_today) {
      return stats.attendance_today;
    }
    // Fallback for old backend format
    return {
      total_expected: stats?.active_employees || 0,
      present: 0,
      late: 0,
      absent: 0,
      not_checked_in: stats?.active_employees || 0,
      checked_in: 0,
      rate: 0,
    };
  }, [stats]);

  const statusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Actifs", value: stats.active_employees, color: "hsl(152 60% 42%)" },
      { name: "En congé", value: stats.on_leave_employees, color: "hsl(217 72% 56%)" },
      { name: "Inactifs", value: stats.inactive_employees, color: "hsl(215 14% 60%)" },
    ].filter((d) => d.value > 0);
  }, [stats]);

  // Use backend dept payroll data if available, fallback to departmentStats
  const departmentData = useMemo(() => {
    if (stats?.department_payroll && stats.department_payroll.length > 0) {
      return stats.department_payroll.slice(0, 6).map((dept) => ({
        name: dept.department_name.length > 18 ? dept.department_name.substring(0, 18) + "…" : dept.department_name,
        fullName: dept.department_name,
        effectif: dept.employee_count,
        avgSalary: dept.avg_salary,
        totalSalary: dept.total_salary,
        pct: dept.pct_of_total,
      }));
    }
    return departmentStats
      .sort((a, b) => b.employee_count - a.employee_count)
      .slice(0, 6)
      .map((dept) => ({
        name: dept.department.name.length > 18 ? dept.department.name.substring(0, 18) + "…" : dept.department.name,
        fullName: dept.department.name,
        effectif: dept.employee_count,
        avgSalary: dept.average_salary,
        totalSalary: 0,
        pct: Math.round((dept.employee_count / (stats?.total_employees || 1)) * 100),
      }));
  }, [departmentStats, stats]);

  const pendingLeaves = useMemo(() => {
    return stats?.pending_leaves_detail || [];
  }, [stats]);

  // ─── Chart configs ────────────────────────────────────────
  const payrollChartConfig = {
    montant: { label: "Masse salariale", color: "hsl(215 72% 56%)" },
  } satisfies ChartConfig;

  const statusChartConfig = {
    actifs: { label: "Actifs", color: "hsl(152 60% 42%)" },
    enConge: { label: "En congé", color: "hsl(217 72% 56%)" },
    inactifs: { label: "Inactifs", color: "hsl(215 14% 60%)" },
  } satisfies ChartConfig;


  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn("space-y-6 animate-pulse")}>
        <div className={cn("h-8 bg-muted rounded w-56")} />
        <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4")}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={cn("h-[120px] bg-muted rounded-xl")} />
          ))}
        </div>
        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4")}>
          <div className={cn("lg:col-span-2 h-[360px] bg-muted rounded-xl")} />
          <div className={cn("h-[360px] bg-muted rounded-xl")} />
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <Can
      anyPermissions={[
        COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
        COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS,
        COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS,
      ]}
      showMessage
    >
      <div className={cn("space-y-6")}>
        {/* ── Header ──────────────────────────────────────── */}
        <div className={cn("flex items-center justify-between")}>
          <div>
            <h1 className={cn("text-2xl font-semibold tracking-tight")}>Tableau de bord RH</h1>
            <p className={cn("text-sm text-muted-foreground mt-0.5")}>
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className={cn("flex items-center gap-2")}>
            <Button variant="outline" size="sm" onClick={() => setReportOpen(true)}>
              <FileDown className={cn("size-4 mr-1.5")} />
              Rapport PDF
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/employees`}>
                <Users className={cn("size-4 mr-1.5")} />
                Employés
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/apps/${slug}/hr/employees/create`}>
                <UserPlus className={cn("size-4 mr-1.5")} />
                Nouvel employé
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Alerts row ──────────────────────────────────── */}
        {((stats?.pending_leave_requests ?? 0) > 0 || (stats?.expiring_contracts ?? 0) > 0 || (stats?.pending_advances ?? 0) > 0) && (
          <div className={cn("flex flex-wrap gap-3")}>
            {(stats?.pending_leave_requests ?? 0) > 0 && (
              <Can permission={COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS}>
                <Link
                  href={`/apps/${slug}/hr/leaves`}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm",
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    "hover:bg-amber-500/15 transition-colors"
                  )}
                >
                  <Clock className={cn("size-4")} />
                  <span className={cn("font-medium")}>
                    {stats?.pending_leave_requests ?? 0} demande{(stats?.pending_leave_requests ?? 0) > 1 ? "s" : ""} de congé
                  </span>
                  <ArrowRight className={cn("size-3.5")} />
                </Link>
              </Can>
            )}
            {(stats?.expiring_contracts ?? 0) > 0 && (
              <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
                <Link
                  href={`/apps/${slug}/hr/contracts`}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm",
                    "bg-red-500/10 text-red-600 dark:text-red-400",
                    "hover:bg-red-500/15 transition-colors"
                  )}
                >
                  <AlertTriangle className={cn("size-4")} />
                  <span className={cn("font-medium")}>
                    {stats?.expiring_contracts ?? 0} contrat{(stats?.expiring_contracts ?? 0) > 1 ? "s" : ""} expire{(stats?.expiring_contracts ?? 0) > 1 ? "nt" : ""} bientôt
                  </span>
                  <ArrowRight className={cn("size-3.5")} />
                </Link>
              </Can>
            )}
            {(stats?.pending_advances ?? 0) > 0 && (
              <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
                <Link
                  href={`/apps/${slug}/hr/payroll`}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm",
                    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    "hover:bg-blue-500/15 transition-colors"
                  )}
                >
                  <DollarSign className={cn("size-4")} />
                  <span className={cn("font-medium")}>
                    {stats?.pending_advances} avance{(stats?.pending_advances ?? 0) > 1 ? "s" : ""} en attente
                  </span>
                  <ArrowRight className={cn("size-3.5")} />
                </Link>
              </Can>
            )}
          </div>
        )}

        {/* ── KPI Cards ────────────────────────────────────── */}
        <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4")}>
          {/* Effectif total */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
            <Card className={cn("p-5 border border-border/50 shadow-none")}>
              <div className={cn("flex items-center gap-3 mb-3")}>
                <div className={cn("size-9 rounded-lg bg-emerald-500/8 flex items-center justify-center")}>
                  <Users className={cn("size-[18px] text-emerald-600 dark:text-emerald-400")} />
                </div>
                <span className={cn("text-sm text-muted-foreground")}>Effectif total</span>
              </div>
              <p className={cn("text-3xl font-semibold tabular-nums")}>{stats?.total_employees ?? 0}</p>
              <div className={cn("flex items-center gap-2 mt-3")}>
                <div className={cn("h-1.5 flex-1 bg-muted rounded-full overflow-hidden")}>
                  <div
                    className={cn("h-full rounded-full bg-emerald-500 transition-all duration-700")}
                    style={{ width: `${activityRate}%` }}
                  />
                </div>
                <span className={cn("text-xs text-emerald-600 dark:text-emerald-400 font-medium tabular-nums")}>
                  {activityRate}% actifs
                </span>
              </div>
            </Card>
          </Can>

          {/* Présents aujourd'hui — using pre-aggregated backend data */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
            <Card className={cn("p-5 border border-border/50 shadow-none")}>
              <div className={cn("flex items-center gap-3 mb-3")}>
                <div className={cn("size-9 rounded-lg bg-cyan-500/8 flex items-center justify-center")}>
                  <UserCheck className={cn("size-[18px] text-cyan-600 dark:text-cyan-400")} />
                </div>
                <span className={cn("text-sm text-muted-foreground")}>Présents aujourd&apos;hui</span>
              </div>
              <div className={cn("flex items-baseline gap-1")}>
                <p className={cn("text-3xl font-semibold tabular-nums")}>{attendanceSummary.checked_in}</p>
                <span className={cn("text-sm text-muted-foreground")}>/ {attendanceSummary.total_expected}</span>
              </div>
              <div className={cn("flex items-center gap-3 mt-3 text-xs")}>
                {attendanceSummary.rate > 0 && (
                  <span className={cn(
                    "font-medium tabular-nums",
                    attendanceSummary.rate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  )}>
                    {attendanceSummary.rate}% présence
                  </span>
                )}
                {attendanceSummary.late > 0 && (
                  <span className={cn("text-amber-600 dark:text-amber-400")}>
                    {attendanceSummary.late} en retard
                  </span>
                )}
                {attendanceSummary.absent > 0 && (
                  <span className={cn("text-muted-foreground")}>
                    {attendanceSummary.absent} absent{attendanceSummary.absent > 1 ? "s" : ""}
                  </span>
                )}
                {attendanceSummary.checked_in === attendanceSummary.total_expected && attendanceSummary.total_expected > 0 && (
                  <span className={cn("text-emerald-600 dark:text-emerald-400 flex items-center gap-1")}>
                    <CheckCircle2 className={cn("size-3")} /> Tous présents
                  </span>
                )}
              </div>
            </Card>
          </Can>

          {/* Masse salariale */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
            <Card className={cn("p-5 border border-border/50 shadow-none")}>
              <div className={cn("flex items-center gap-3 mb-3")}>
                <div className={cn("size-9 rounded-lg bg-blue-500/8 flex items-center justify-center")}>
                  <Wallet className={cn("size-[18px] text-blue-600 dark:text-blue-400")} />
                </div>
                <span className={cn("text-sm text-muted-foreground")}>Masse salariale</span>
              </div>
              <div className={cn("flex items-baseline gap-1")}>
                <p className={cn("text-3xl font-semibold tabular-nums")}>
                  {stats?.total_contract_mass ? fmtCurrency(stats.total_contract_mass) : fmtCurrency(stats?.total_payroll_this_month ?? 0)}
                </p>
                <span className={cn("text-sm text-muted-foreground ml-0.5")}>GNF</span>
              </div>
              <div className={cn("flex items-center gap-1.5 mt-3 text-xs")}>
                {payrollVariation !== 0 ? (
                  <>
                    {payrollVariation > 0 ? (
                      <TrendingUp className={cn("size-3.5 text-emerald-600")} />
                    ) : (
                      <TrendingDown className={cn("size-3.5 text-red-500")} />
                    )}
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        payrollVariation > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                      )}
                    >
                      {payrollVariation > 0 ? "+" : ""}{payrollVariation}%
                    </span>
                    <span className={cn("text-muted-foreground")}>vs mois précédent</span>
                  </>
                ) : stats?.avg_contract_salary ? (
                  <span className={cn("text-muted-foreground")}>
                    Moy: {fmtCurrency(stats.avg_contract_salary)} GNF / employé
                  </span>
                ) : (
                  <span className={cn("text-muted-foreground")}>—</span>
                )}
              </div>
            </Card>
          </Can>

          {/* Contrats */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
            <Card className={cn("p-5 border border-border/50 shadow-none")}>
              <div className={cn("flex items-center gap-3 mb-3")}>
                <div className={cn("size-9 rounded-lg bg-violet-500/8 flex items-center justify-center")}>
                  <FileText className={cn("size-[18px] text-violet-600 dark:text-violet-400")} />
                </div>
                <span className={cn("text-sm text-muted-foreground")}>Contrats actifs</span>
              </div>
              <div className={cn("flex items-baseline gap-1")}>
                <p className={cn("text-3xl font-semibold tabular-nums")}>{stats?.active_contracts ?? 0}</p>
                <span className={cn("text-sm text-muted-foreground")}>/ {stats?.total_contracts ?? 0}</span>
              </div>
              <div className={cn("flex items-center gap-2 mt-3 text-xs")}>
                {(stats?.expiring_contracts ?? 0) > 0 ? (
                  <span className={cn("text-red-500 flex items-center gap-1")}>
                    <AlertTriangle className={cn("size-3")} />
                    {stats?.expiring_contracts} expire{(stats?.expiring_contracts ?? 0) > 1 ? "nt" : ""} sous 30j
                  </span>
                ) : (stats?.employees_without_contract ?? 0) > 0 ? (
                  <span className={cn("text-amber-500 flex items-center gap-1")}>
                    <Shield className={cn("size-3")} />
                    {stats?.employees_without_contract} sans contrat
                  </span>
                ) : (
                  <span className={cn("text-emerald-600 dark:text-emerald-400 flex items-center gap-1")}>
                    <CheckCircle2 className={cn("size-3")} /> Tous à jour
                  </span>
                )}
              </div>
            </Card>
          </Can>
        </div>

        {/* ── Charts section ──────────────────────────────── */}
        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4")}>
          {/* Payroll trend */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
            <Card className={cn("lg:col-span-2 border border-border/50 shadow-none overflow-hidden")}>
              <div className={cn("px-6 pt-5 pb-2 flex items-start justify-between")}>
                <div>
                  <h3 className={cn("text-sm font-medium")}>Évolution de la masse salariale</h3>
                  <p className={cn("text-xs text-muted-foreground mt-0.5")}>
                    {payrollTrend.length > 0
                      ? `${payrollTrend[0].fullMonth} → ${payrollTrend[payrollTrend.length - 1].fullMonth}`
                      : "Aucune donnée"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild className={cn("text-xs -mr-2")}>
                  <Link href={`/apps/${slug}/hr/payroll`}>
                    Détails
                    <ArrowUpRight className={cn("size-3 ml-1")} />
                  </Link>
                </Button>
              </div>

              <div className={cn("px-2")}>
                <ChartContainer config={payrollChartConfig} className={cn("h-[240px] w-full")}>
                  <AreaChart data={payrollTrend} margin={{ top: 16, right: 16, bottom: 0, left: 16 }}>
                    <defs>
                      <linearGradient id="payrollFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(215 72% 56%)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(215 72% 56%)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      dy={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v > 0 ? `${(v / 1_000_000).toFixed(1)}M` : "0")}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      width={48}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(label) => {
                            const item = payrollTrend.find((p) => p.month === label);
                            return item?.fullMonth || label;
                          }}
                          formatter={(value) => {
                            const n = Number(value);
                            if (n === 0) return ["Aucune paie", "Masse salariale"];
                            return [`${fmtCurrency(n)} GNF`, "Masse salariale"];
                          }}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="montant"
                      stroke="hsl(215 72% 56%)"
                      strokeWidth={2}
                      fill="url(#payrollFill)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>

              {/* Bottom summary */}
              <div className={cn("px-6 py-4 border-t border-border/40 grid grid-cols-3 gap-4")}>
                <div>
                  <p className={cn("text-[11px] text-muted-foreground uppercase tracking-wider")}>Ce mois</p>
                  <p className={cn("text-base font-semibold mt-0.5 tabular-nums")}>
                    {payrollTrend.length > 0 ? fmtCurrency(payrollTrend[payrollTrend.length - 1].montant) : "—"}
                  </p>
                </div>
                <div>
                  <p className={cn("text-[11px] text-muted-foreground uppercase tracking-wider")}>Variation</p>
                  <div className={cn("flex items-center gap-1 mt-0.5")}>
                    {payrollVariation !== 0 ? (
                      <p
                        className={cn(
                          "text-base font-semibold tabular-nums",
                          payrollVariation > 0 ? "text-emerald-600" : "text-red-500"
                        )}
                      >
                        {payrollVariation > 0 ? "+" : ""}{payrollVariation}%
                      </p>
                    ) : (
                      <p className={cn("text-base font-semibold text-muted-foreground")}>—</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className={cn("text-[11px] text-muted-foreground uppercase tracking-wider")}>Moy. / employé</p>
                  <p className={cn("text-base font-semibold mt-0.5 tabular-nums")}>
                    {stats?.avg_contract_salary
                      ? fmtCurrency(stats.avg_contract_salary)
                      : (stats?.active_employees ?? 0) > 0
                        ? fmtCurrency(Math.round((stats?.total_payroll_this_month ?? 0) / (stats?.active_employees ?? 1)))
                        : "—"}
                  </p>
                </div>
              </div>
            </Card>
          </Can>

          {/* Répartition employés */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
            <Card className={cn("border border-border/50 shadow-none")}>
              <div className={cn("px-6 pt-5 pb-2")}>
                <h3 className={cn("text-sm font-medium")}>Répartition des employés</h3>
                <p className={cn("text-xs text-muted-foreground mt-0.5")}>Par statut</p>
              </div>

              <div className={cn("px-6 flex items-center justify-center")}>
                <div className={cn("relative")}>
                  <ChartContainer config={statusChartConfig} className={cn("h-[180px] w-[180px]")}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={78}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => [
                              `${value} employé${Number(value) > 1 ? "s" : ""}`,
                              String(name),
                            ]}
                          />
                        }
                      />
                    </PieChart>
                  </ChartContainer>
                  {/* Center label */}
                  <div
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    )}
                  >
                    <span className={cn("text-2xl font-semibold tabular-nums")}>{stats?.total_employees ?? 0}</span>
                    <span className={cn("text-[11px] text-muted-foreground")}>Total</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className={cn("px-6 pb-4 pt-2 space-y-2.5")}>
                {statusData.map((item) => {
                  const pct =
                    stats && stats.total_employees > 0
                      ? Math.round((item.value / stats.total_employees) * 100)
                      : 0;
                  return (
                    <div key={item.name} className={cn("flex items-center justify-between")}>
                      <div className={cn("flex items-center gap-2")}>
                        <span
                          className={cn("block size-2.5 rounded-full")}
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={cn("text-sm")}>{item.name}</span>
                      </div>
                      <div className={cn("flex items-center gap-2")}>
                        <span className={cn("text-sm font-medium tabular-nums")}>{item.value}</span>
                        <span className={cn("text-xs text-muted-foreground tabular-nums")}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Turnover indicator */}
              {(stats?.turnover_rate !== undefined && stats.turnover_rate > 0) && (
                <div className={cn("px-6 py-3 border-t border-border/40")}>
                  <div className={cn("flex items-center justify-between text-xs")}>
                    <span className={cn("text-muted-foreground")}>Turnover (90j)</span>
                    <span className={cn(
                      "font-medium tabular-nums",
                      stats.turnover_rate > 10 ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {stats.turnover_rate}%
                    </span>
                  </div>
                  {(stats.hires_last_90d !== undefined || stats.departures_last_90d !== undefined) && (
                    <div className={cn("flex items-center gap-3 mt-1.5 text-xs text-muted-foreground")}>
                      {(stats.hires_last_90d ?? 0) > 0 && (
                        <span className={cn("text-emerald-600 dark:text-emerald-400")}>
                          +{stats.hires_last_90d} embauche{(stats.hires_last_90d ?? 0) > 1 ? "s" : ""}
                        </span>
                      )}
                      {(stats.departures_last_90d ?? 0) > 0 && (
                        <span className={cn("text-red-500")}>
                          -{stats.departures_last_90d} départ{(stats.departures_last_90d ?? 0) > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Can>
        </div>

        {/* ── Bottom section ──────────────────────────────── */}
        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4")}>
          {/* Département + payroll breakdown */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS}>
            <Card className={cn("border border-border/50 shadow-none overflow-hidden")}>
              <div className={cn("px-6 pt-5 pb-1 flex items-start justify-between")}>
                <div>
                  <h3 className={cn("text-sm font-medium")}>Répartition par département</h3>
                  <p className={cn("text-xs text-muted-foreground mt-0.5")}>
                    {departmentStats.length} département{departmentStats.length > 1 ? "s" : ""}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild className={cn("text-xs -mr-2")}>
                  <Link href={`/apps/${slug}/hr/departments`}>
                    Voir
                    <ArrowUpRight className={cn("size-3 ml-1")} />
                  </Link>
                </Button>
              </div>

              {departmentData.length > 0 ? (
                <div className={cn("px-6 pb-5 pt-3 space-y-3")}>
                  {departmentData.map((dept) => (
                    <div key={dept.fullName} className={cn("space-y-1.5")}>
                      <div className={cn("flex items-center justify-between text-sm")}>
                        <span className={cn("truncate flex-1")}>{dept.fullName}</span>
                        <div className={cn("flex items-center gap-2 ml-3")}>
                          <span className={cn("text-muted-foreground tabular-nums text-xs")}>
                            {dept.effectif} emp.
                          </span>
                          {dept.totalSalary > 0 && (
                            <span className={cn("text-xs tabular-nums text-muted-foreground/70")}>
                              · {fmtCurrency(dept.totalSalary)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={cn("h-1.5 bg-muted rounded-full overflow-hidden")}>
                        <div
                          className={cn("h-full rounded-full bg-primary/70 transition-all duration-500")}
                          style={{ width: `${dept.pct}%`, minWidth: dept.effectif > 0 ? "4px" : "0" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cn("px-6 pb-6")}>
                  <EmptyState
                    icon={Briefcase}
                    title="Aucun département"
                    description="Créez des départements pour organiser votre équipe"
                    action={{
                      label: "Créer",
                      href: `/apps/${slug}/hr/departments/create`,
                    }}
                  />
                </div>
              )}
            </Card>
          </Can>

          {/* Pending leaves */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS}>
            <Card className={cn("border border-border/50 shadow-none")}>
              <div className={cn("px-6 pt-5 pb-3 flex items-start justify-between")}>
                <div>
                  <h3 className={cn("text-sm font-medium")}>Demandes en attente</h3>
                  <p className={cn("text-xs text-muted-foreground mt-0.5")}>
                    {(stats?.on_leave_now ?? 0) > 0
                      ? `${stats?.on_leave_now} en congé actuellement`
                      : "Congés à traiter"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild className={cn("text-xs -mr-2")}>
                  <Link href={`/apps/${slug}/hr/leaves`}>
                    Tout voir
                    <ArrowUpRight className={cn("size-3 ml-1")} />
                  </Link>
                </Button>
              </div>

              {pendingLeaves.length > 0 ? (
                <div className={cn("px-6 pb-5 space-y-2")}>
                  {pendingLeaves.slice(0, 4).map((leave: LeaveRequest) => (
                    <div
                      key={leave.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "bg-muted/40 hover:bg-muted/60 transition-colors"
                      )}
                    >
                      <div
                        className={cn(
                          "size-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                        )}
                        style={{ backgroundColor: leave.leave_type_color || "#6366f1" }}
                      >
                        {getInitials(leave.employee_name)}
                      </div>
                      <div className={cn("flex-1 min-w-0")}>
                        <p className={cn("text-sm font-medium truncate")}>{leave.employee_name}</p>
                        <p className={cn("text-xs text-muted-foreground truncate")}>
                          {leave.title || leave.leave_type_name || "Congé"} · {fmtDate(leave.start_date)}
                          {leave.total_days > 1 ? ` — ${fmtDate(leave.end_date)}` : ""}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800")}
                      >
                        <CalendarClock className={cn("size-3 mr-1")} />
                        {leave.total_days}j
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cn("px-6 pb-6 text-center py-8")}>
                  <CheckCircle2 className={cn("size-8 text-emerald-500/60 mx-auto mb-2")} />
                  <p className={cn("text-sm text-muted-foreground")}>Aucune demande en attente</p>
                </div>
              )}
            </Card>
          </Can>

          {/* Recent hires + expiring contracts */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
            <Card className={cn("border border-border/50 shadow-none")}>
              <div className={cn("px-6 pt-5 pb-3 flex items-start justify-between")}>
                <div>
                  <h3 className={cn("text-sm font-medium")}>Nouvelles recrues</h3>
                  <p className={cn("text-xs text-muted-foreground mt-0.5")}>Dernières embauches</p>
                </div>
                <Button variant="ghost" size="sm" asChild className={cn("text-xs -mr-2")}>
                  <Link href={`/apps/${slug}/hr/employees`}>
                    Voir
                    <ArrowUpRight className={cn("size-3 ml-1")} />
                  </Link>
                </Button>
              </div>

              {stats?.recent_hires && stats.recent_hires.length > 0 ? (
                <div className={cn("px-6 pb-5 space-y-2")}>
                  {stats.recent_hires.slice(0, 4).map((employee) => (
                    <Link
                      key={employee.id}
                      href={`/apps/${slug}/hr/employees/${employee.id}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "hover:bg-muted/50 transition-colors"
                      )}
                    >
                      <div
                        className={cn(
                          "size-8 rounded-full bg-primary/10 flex items-center justify-center",
                          "text-xs font-semibold text-primary shrink-0"
                        )}
                      >
                        {getInitials(employee.full_name)}
                      </div>
                      <div className={cn("flex-1 min-w-0")}>
                        <p className={cn("text-sm font-medium truncate")}>{employee.full_name}</p>
                        <p className={cn("text-xs text-muted-foreground truncate")}>
                          {employee.position_title || employee.department_name || "—"}
                        </p>
                      </div>
                      <div className={cn("text-right shrink-0")}>
                        <p className={cn("text-xs text-muted-foreground tabular-nums")}>
                          {employee.hire_date ? fmtDate(employee.hire_date) : "—"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={cn("px-6 pb-6 text-center py-8")}>
                  <UserPlus className={cn("size-8 text-muted-foreground/30 mx-auto mb-2")} />
                  <p className={cn("text-sm text-muted-foreground")}>Aucune embauche récente</p>
                </div>
              )}

              {/* Expiring contracts warning widget */}
              {stats?.expiring_contracts_detail && stats.expiring_contracts_detail.length > 0 && (
                <div className={cn("px-6 py-3 border-t border-border/40")}>
                  <p className={cn("text-[11px] text-muted-foreground uppercase tracking-wider mb-2")}>
                    Contrats expirant bientôt
                  </p>
                  {stats.expiring_contracts_detail.slice(0, 3).map((c) => (
                    <div key={c.employee_id} className={cn("flex items-center justify-between py-1")}>
                      <span className={cn("text-xs truncate flex-1")}>{c.employee_name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] ml-2",
                          (c.days_remaining ?? 0) <= 7
                            ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                        )}
                      >
                        {c.days_remaining}j restants
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Can>
        </div>
      </div>

      {/* ── PDF Report Dialog ─────────────────────────── */}
      <HRReportPDF
        open={reportOpen}
        onOpenChange={setReportOpen}
        stats={stats}
        departmentStats={departmentStats}
        payrollTrend={payrollTrend}
        organizationSlug={slug}
      />
    </Can>
  );
}