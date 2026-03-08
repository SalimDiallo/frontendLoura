"use client";

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
import { getLeaveRequests } from "@/lib/services/hr/leave.service";
import type { DepartmentStats, HRStats, LeaveRequest } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis
} from "recharts";

export default function HRDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [stats, setStats] = useState<HRStats | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payrollTrend, setPayrollTrend] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, deptStats, leavesData] = await Promise.allSettled([
        getHRStats(slug),
        getDepartmentStats(slug),
        getLeaveRequests({ status: "pending", organization_subdomain: slug }),
      ]);

      // Handle stats data
      if (statsData.status === "fulfilled" && statsData.value) {
        setStats(statsData.value);
        
        // Use real payroll trend data from backend
        if (statsData.value.payroll_trend && Array.isArray(statsData.value.payroll_trend)) {
          const trendData = statsData.value.payroll_trend.map(item => ({
            month: item.month,
            fullMonth: item.full_month,
            montant: item.montant,
            employes: item.employes,
            moyenneParEmploye: item.employes > 0 ? Math.round(item.montant / item.employes) : 0,
          }));
          setPayrollTrend(trendData);
        } else {
          setPayrollTrend([]);
        }
      } else {
        console.error("Failed to load HR stats:", statsData.status === "rejected" ? statsData.reason : "No data");
        setStats(null);
        setPayrollTrend([]);
      }

      // Handle department stats
      if (deptStats?.status === "fulfilled" && Array.isArray(deptStats?.value)) {
        setDepartmentStats(deptStats?.value);
      } else {
        console.error("Failed to load department stats:", deptStats?.status === "rejected" ? deptStats?.reason : "No data");
        setDepartmentStats([]);
      }

      // Handle leave requests
      if (leavesData.status === "fulfilled" && leavesData.value && "results" in leavesData.value) {
        setPendingLeaves(Array.isArray(leavesData.value.results) ? leavesData.value.results : []);
      } else {
        console.error("Failed to load leave requests:", leavesData.status === "rejected" ? leavesData.reason : "No data");
        setPendingLeaves([]);
      }
    } catch (err) {
      setError("Erreur lors du chargement des statistiques");
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const insights = useMemo(() => {
    if (!stats) return [];

    const items = [];

    if (stats?.pending_leave_requests > 0) {
      items.push({
        type: "warning",
        icon: Clock,
        title: `${stats?.pending_leave_requests} demande${stats?.pending_leave_requests > 1 ? "s" : ""} de congé en attente`,
        permission: COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS,
        action: { label: "Traiter", href: `/apps/${slug}/hr/leaves` }
      });
    }

    if (stats?.expiring_contracts && stats?.expiring_contracts > 0) {
      items.push({
        type: "alert",
        icon: AlertTriangle,
        title: `${stats?.expiring_contracts} contrat${stats?.expiring_contracts > 1 ? "s" : ""} expire${stats?.expiring_contracts > 1 ? "nt" : ""} bientôt`,
        permission: COMMON_PERMISSIONS.HR.VIEW_CONTRACTS,
        action: { label: "Voir", href: `/apps/${slug}/hr/contracts` }
      });
    }

    if (stats?.recent_hires && stats?.recent_hires.length > 0) {
      items.push({
        type: "success",
        icon: UserPlus,
        title: `${stats?.recent_hires.length} nouvelle${stats?.recent_hires.length > 1 ? "s" : ""} recrue${stats?.recent_hires.length > 1 ? "s" : ""} ce mois`,
        permission: COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
        action: { label: "Voir", href: `/apps/${slug}/hr/employees` }
      });
    }
    return items;
  }, [stats, slug]);

  // Chart configurations
  const payrollChartConfig = {
    montant: {
      label: "Masse salariale",
      color: "hsl(var(--primary))",
    },
    moyenneParEmploye: {
      label: "Moyenne/employé",
      color: "hsl(var(--muted-foreground))",
    },
  } satisfies ChartConfig;

  const statusChartConfig = {
    actifs: {
      label: "Actifs",
      color: "hsl(142 76% 36%)",
    },
    inactifs: {
      label: "Inactifs",
      color: "hsl(215 20% 65%)",
    },
    enConge: {
      label: "En congé",
      color: "hsl(217 91% 60%)",
    },
  } satisfies ChartConfig;

  const departmentChartConfig = {
    employes: {
      label: "Employés",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const statusData = useMemo(() => {
    if (!stats) return [];
    return [
      { 
        status: "actifs", 
        employes: stats?.active_employees, 
        fill: "hsl(142 76% 36%)",
        percentage: Math.round((stats?.active_employees / stats?.total_employees) * 100) 
      },
      { 
        status: "inactifs", 
        employes: stats?.inactive_employees, 
        fill: "hsl(215 20% 65%)",
        percentage: Math.round((stats?.inactive_employees / stats?.total_employees) * 100)
      },
      { 
        status: "enConge", 
        employes: stats?.on_leave_employees, 
        fill: "hsl(217 91% 60%)",
        percentage: Math.round((stats?.on_leave_employees / stats?.total_employees) * 100)
      },
    ].filter((item) => item.employes > 0);
  }, [stats]);

  const departmentData = useMemo(() => {
    return departmentStats?.slice(0, 6).map((dept) => ({
      departement: dept.department.name.length > 15
        ? dept.department.name.substring(0, 15) + "..."
        : dept.department.name,
      fullName: dept.department.name,
      employes: dept.employee_count,
      actifs: dept.active_count,
      pourcentage: Math.round((dept.employee_count / (stats?.total_employees || 1)) * 100),
    }));
  }, [departmentStats, stats]);

  const activityRate = useMemo(() => {
    if (!stats || stats?.total_employees === 0) return 0;
    return Math.round((stats?.active_employees / stats?.total_employees) * 100);
  }, [stats]);

  const payrollTrend6Months = useMemo(() => {
    if (payrollTrend.length < 2) return 0;
    const current = payrollTrend[payrollTrend.length - 1].montant;
    const previous = payrollTrend[payrollTrend.length - 2].montant;
    return Math.round(((current - previous) / previous) * 100);
  }, [payrollTrend]);

  const quickActions = useMemo(() => {
    if (!stats) return [];
    return [
      {
        icon: Users,
        label: "Employés",
        href: `/apps/${slug}/hr/employees`,
        permission: COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
        count: stats?.total_employees,
      },
      {
        icon: Building2,
        label: "Départements",
        href: `/apps/${slug}/hr/departments`,
        permission: COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS,
      },
      {
        icon: BriefcaseBusiness,
        label: "Rôles",
        href: `/apps/${slug}/hr/roles`,
        permission: COMMON_PERMISSIONS.HR.VIEW_ROLES,
      },
      {
        icon: Wallet,
        label: "Paie",
        href: `/apps/${slug}/hr/payroll`,
        permission: COMMON_PERMISSIONS.HR.VIEW_PAYROLL,
      },
      {
        icon: CalendarDays,
        label: "Congés",
        href: `/apps/${slug}/hr/leaves`,
        permission: COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS,
        count: stats?.pending_leave_requests,
      },
      {
        icon: FileText,
        label: "Contrats",
        href: `/apps/${slug}/hr/contracts`,
        permission: COMMON_PERMISSIONS.HR.VIEW_CONTRACTS,
      },
    ];
  }, [stats, slug]);

  if (loading) {
    return (
      <div className={cn("space-y-6")}>
        <div className={cn("animate-pulse space-y-6")}>
          <div className={cn("h-10 bg-muted rounded w-1/4")} />
          <div className={cn("grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4")}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={cn("h-32 bg-muted rounded-xl")}></div>
            ))}
          </div>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4")}>
            <div className={cn("lg:col-span-2 h-80 bg-muted rounded-xl")} />
            <div className={cn("h-80 bg-muted rounded-xl")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Can anyPermissions={[COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES, COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS, COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS]} showMessage>
      <div className={cn("space-y-7")}>
        {/* Header */}
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4")}>
          <div>
            <h1 className={cn("text-2xl sm:text-3xl font-bold text-foreground")}>Ressources Humaines</h1>
            <p className={cn("text-muted-foreground mt-1")}>Vue d&apos;ensemble de votre équipe</p>
          </div>
          <div className={cn("flex flex-col xs:flex-row items-stretch xs:items-center gap-2")}>
            <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
              <Button variant="outline" asChild className={cn("w-full xs:w-auto")}>
                <Link href={`/apps/${slug}/hr/employees`}>
                  <Users className={cn("size-4 mr-2")} />
                  Employés
                </Link>
              </Button>
            </Can>
            <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
              <Button asChild className={cn("w-full xs:w-auto")}>
                <Link href={`/apps/${slug}/hr/employees/create`}>
                  <UserPlus className={cn("size-4 mr-2")} />
                  Nouvel employé
                </Link>
              </Button>
            </Can>
          </div>
        </div>

        {/* Quick Insights Banner */}
        {insights.length > 0 && (
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3")}>
            {insights.map((insight, idx) => (
              <Can key={idx} permission={insight.permission}>
                <Card
                  className={cn(
                    "p-4 border-0 shadow-sm flex items-center gap-4",
                    insight.type === "warning" && "bg-amber-50 dark:bg-amber-950/30",
                    insight.type === "alert" && "bg-red-50 dark:bg-red-950/30",
                    insight.type === "success" && "bg-green-50 dark:bg-green-950/30"
                  )}
                >
                  <div
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0",
                      insight.type === "warning" && "bg-amber-100 dark:bg-amber-900/50 text-amber-600",
                      insight.type === "alert" && "bg-red-100 dark:bg-red-900/50 text-red-600",
                      insight.type === "success" && "bg-green-100 dark:bg-green-900/50 text-green-600"
                    )}
                  >
                    <insight.icon className={cn("size-5")} />
                  </div>
                  <div className={cn("flex-1 min-w-0")}>
                    <p className={cn("text-sm font-medium truncate")}>{insight.title}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild className={cn("shrink-0")}>
                    <Link href={insight.action.href}>
                      {insight.action.label}
                      <ArrowUpRight className={cn("size-3 ml-1")} />
                    </Link>
                  </Button>
                </Card>
              </Can>
            ))}
          </div>
        )}

        {/* Main Stats Grid */}
        <div className={cn("grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4")}>
          {/* Effectif */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
            <Card className={cn("p-5 border-0 shadow-sm h-full")}>
              <div className={cn("flex items-start justify-between")}>
                <div>
                  <p className={cn("text-sm text-muted-foreground")}>Effectif total</p>
                  <p className={cn("text-3xl font-bold mt-1")}>{stats?.total_employees}</p>
                  <div className={cn("flex items-center gap-2 mt-2")}>
                    <Badge
                      variant="default"
                      className={cn(
                        "bg-green-100 text-green-700",
                        "dark:bg-green-900/30 dark:text-green-400"
                      )}
                    >
                      {stats?.active_employees} actifs
                    </Badge>
                  </div>
                </div>
                <div className={cn("size-12 rounded-2xl bg-primary/10 flex items-center justify-center")}>
                  <Users className={cn("size-6 text-primary")} />
                </div>
              </div>
              <div className={cn("mt-4 pt-4 border-t border-border/50")}>
                <div className={cn("flex items-center justify-between text-sm")}>
                  <span className={cn("text-muted-foreground")}>Taux d&apos;activité</span>
                  <span className={cn("font-semibold text-green-600")}>{activityRate}%</span>
                </div>
                <div className={cn("mt-2 h-2 bg-muted rounded-full overflow-hidden")}>
                  <div
                    className={cn("h-full bg-green-500 rounded-full transition-all")}
                    style={{ width: `${activityRate}%` }}
                  />
                </div>
              </div>
            </Card>
          </Can>

          {/* Masse Salariale */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
            <Card className={cn("p-5 border-0 shadow-sm h-full")}>
              <div className={cn("flex items-start justify-between")}>
                <div>
                  <p className={cn("text-sm text-muted-foreground")}>Masse salariale</p>
                  <p className={cn("text-3xl font-bold mt-1")}>
                    {((stats?.total_payroll_this_month ?? 0) / 1000000).toFixed(1)}
                    <span className={cn("text-lg font-normal text-muted-foreground ml-1")}>M</span>
                  </p>
                  <div className={cn("flex items-center gap-1 mt-2")}>
                    {payrollTrend6Months > 0 ? (
                      <>
                        <TrendingUp className={cn("size-3 text-green-600")} />
                        <span className={cn("text-xs text-green-600 font-medium")}>+{payrollTrend6Months}%</span>
                      </>
                    ) : payrollTrend6Months < 0 ? (
                      <>
                        <TrendingDown className={cn("size-3 text-red-600")} />
                        <span className={cn("text-xs text-red-600 font-medium")}>{payrollTrend6Months}%</span>
                      </>
                    ) : (
                      <span className={cn("text-xs text-muted-foreground")}>Stable</span>
                    )}
                    <span className={cn("text-xs text-muted-foreground")}>vs mois dernier</span>
                  </div>
                </div>
                <div className={cn("size-12 rounded-2xl bg-foreground/10 flex items-center justify-center")}>
                  <Wallet className={cn("size-6 text-foreground")} />
                </div>
              </div>
              <div className={cn("mt-4 pt-4 border-t border-border/50")}>
                <div className={cn("flex items-center justify-between text-sm")}>
                  <span className={cn("text-muted-foreground")}>Moy. / employé</span>
                  <span className={cn("font-semibold")}>
                    {(stats?.active_employees ?? 0) > 0
                      ? Math.round((stats?.total_payroll_this_month ?? 0) / (stats?.active_employees ?? 0) / 1000).toLocaleString() + "K"
                      : "0"}
                  </span>
                </div>
              </div>
            </Card>
          </Can>

          {/* Congés */}
          <Can permission={COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS}>
            <Card className={cn("p-5 border-0 shadow-sm h-full")}>
              <div className={cn("flex items-start justify-between")}>
                <div>
                  <p className={cn("text-sm text-muted-foreground")}>Demandes de congé</p>
                  <p className={cn("text-3xl font-bold mt-1")}>{stats?.pending_leave_requests}</p>
                  <p className={cn("text-sm text-muted-foreground mt-2")}>en attente</p>
                </div>
                <div className={cn("size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center")}>
                  <Calendar className={cn("size-6 text-amber-500")} />
                </div>
              </div>
              <div className={cn("mt-4 pt-4 border-t border-border/50")}>
                <div className={cn("flex items-center gap-4 text-sm")}>
                  <div className={cn("flex items-center gap-1")}>
                    <div className={cn("size-2 rounded-full bg-foreground")} />
                    <span className={cn("text-muted-foreground")}>{stats?.on_leave_employees} en congé</span>
                  </div>
                </div>
              </div>
            </Card>
          </Can>

          {/* Contrats */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
            <Card className={cn("p-5 border-0 shadow-sm h-full")}>
              <div className={cn("flex items-start justify-between")}>
                <div>
                  <p className={cn("text-sm text-muted-foreground")}>Contrats actifs</p>
                  <p className={cn("text-3xl font-bold mt-1")}>{stats?.active_contracts || 0}</p>
                  <p className={cn("text-sm text-muted-foreground mt-2")}>
                    sur {stats?.total_contracts || 0} total
                  </p>
                </div>
                <div className={cn("size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center")}>
                  <FileText className={cn("size-6 text-purple-500")} />
                </div>
              </div>
              <div className={cn("mt-4 pt-4 border-t border-border/50")}>
                {stats?.expiring_contracts && stats?.expiring_contracts > 0 ? (
                  <div className={cn("flex items-center gap-2 text-sm text-amber-600")}>
                    <AlertTriangle className={cn("size-4")} />
                    <span>{stats?.expiring_contracts} expirent bientôt</span>
                  </div>
                ) : (
                  <div className={cn("flex items-center gap-2 text-sm text-green-600")}>
                    <CheckCircle2 className={cn("size-4")} />
                    <span>Tous à jour</span>
                  </div>
                )}
              </div>
            </Card>
          </Can>
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4")}>
            {quickActions.map((item) => (
              <Can key={item.label} permission={item.permission}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition group shadow-sm",
                    "focus:outline-none focus-visible:ring-2 ring-primary/40 w-full"
                  )}
                >
                  <div className={cn("size-10 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform shadow")}>
                    <item.icon className={cn("size-5 text-primary")} />
                  </div>
                  <span className={cn("text-[11px] xs:text-xs sm:text-sm font-medium text-center")}>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <Badge variant="outline" className={cn("text-[10px] px-1 py-0.5")}>{item.count}</Badge>
                  )}
                </Link>
              </Can>
            ))}
          </div>
        )}

        {/* Charts Section - Improved */}
        <div className={cn("grid grid-cols-1 xl:grid-cols-3 gap-6")}>
          {/* Payroll Trend - Line Chart */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
            <Card className={cn("xl:col-span-2 p-6 border-0 shadow-sm")}>
              <div className={cn("flex items-start justify-between mb-6")}>
                <div>
                  <h3 className={cn("font-semibold text-lg")}>Évolution de la masse salariale</h3>
                  <p className={cn("text-sm text-muted-foreground mt-1")}>
                    Tendance sur 6 mois • {payrollTrend.length > 0 && payrollTrend[payrollTrend.length - 1]?.fullMonth}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/apps/${slug}/hr/payroll`}>
                    Détails
                    <ArrowUpRight className={cn("size-3 ml-1")} />
                  </Link>
                </Button>
              </div>
              
              <ChartContainer config={payrollChartConfig} className={cn("h-[300px] w-full")}>
                <AreaChart data={payrollTrend} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <defs>
                    <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className={cn("stroke-muted")} />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false}
                    axisLine={false}
                    className={cn("text-xs")}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value > 0 ? `${(value / 1000000).toFixed(1)}M` : "0"}
                    className={cn("text-xs")}
                    width={50}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent 
                        labelFormatter={(label) => {
                          const item = payrollTrend.find(p => p.month === label);
                          return item?.fullMonth || label;
                        }}
                        formatter={(value, name) => {
                          if (name === "montant") {
                            const numValue = Number(value);
                            if (numValue === 0) return ["Aucune paie", "Masse salariale"];
                            return [`${(numValue / 1000000).toFixed(2)}M GNF`, "Masse salariale"];
                          }
                          return [value, name];
                        }}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="montant"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#payrollGradient)"
                    dot={{ fill: "hsl(var(--primary))", r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ChartContainer>

              {/* Summary Stats */}
              <div className={cn("grid grid-cols-3 gap-4 mt-6 pt-6 border-t")}>
                <div>
                  <p className={cn("text-xs text-muted-foreground")}>Mois actuel</p>
                  <p className={cn("text-lg font-bold mt-1")}>
                    {payrollTrend.length > 0 ? (payrollTrend[payrollTrend.length - 1].montant / 1000000).toFixed(1) : "0"}M
                  </p>
                </div>
                <div>
                  <p className={cn("text-xs text-muted-foreground")}>Variation</p>
                  <div className={cn("flex items-center gap-1 mt-1")}>
                    {payrollTrend6Months > 0 ? (
                      <>
                        <TrendingUp className={cn("size-4 text-green-600")} />
                        <p className={cn("text-lg font-bold text-green-600")}>+{payrollTrend6Months}%</p>
                      </>
                    ) : payrollTrend6Months < 0 ? (
                      <>
                        <TrendingDown className={cn("size-4 text-red-600")} />
                        <p className={cn("text-lg font-bold text-red-600")}>{payrollTrend6Months}%</p>
                      </>
                    ) : (
                      <p className={cn("text-lg font-bold")}>0%</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className={cn("text-xs text-muted-foreground")}>Moyenne</p>
                  <p className={cn("text-lg font-bold mt-1")}>
                    {payrollTrend.length > 0 
                      ? (payrollTrend.reduce((acc, curr) => acc + curr.montant, 0) / payrollTrend.length / 1000000).toFixed(1)
                      : "0"}M
                  </p>
                </div>
              </div>
            </Card>
          </Can>

          {/* Employee Status Distribution - Pie Chart */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
            <Card className={cn("p-6 border-0 shadow-sm")}>
              <div className={cn("flex items-center justify-between mb-6")}>
                <div>
                  <h3 className={cn("font-semibold text-lg")}>Répartition des employés</h3>
                  <p className={cn("text-sm text-muted-foreground mt-1")}>Par statut</p>
                </div>
              </div>
              
              <ChartContainer config={statusChartConfig} className={cn("h-[200px] w-full")}>
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent 
                        formatter={(value, name, props) => {
                          const data = props.payload;
                          return [
                            `${value} (${data.percentage}%)`,
                            statusChartConfig[name as keyof typeof statusChartConfig]?.label || name
                          ];
                        }}
                      />
                    }
                  />
                  <Pie
                    data={statusData}
                    dataKey="employes"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 10}
                                className={cn("fill-foreground text-2xl font-bold")}
                              >
                                {stats?.total_employees}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 15}
                                className={cn("fill-muted-foreground text-xs")}
                              >
                                Total
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>

              {/* Legend */}
              <div className={cn("flex flex-col gap-3 mt-6 pt-6 border-t")}>
                {statusData.map((item) => (
                  <div key={item.status} className={cn("flex items-center justify-between")}>
                    <div className={cn("flex items-center gap-2")}>
                      <div className={cn("size-3 rounded-full")} style={{ backgroundColor: item.fill }} />
                      <span className={cn("text-sm capitalize")}>
                        {statusChartConfig[item.status as keyof typeof statusChartConfig]?.label}
                      </span>
                    </div>
                    <div className={cn("flex items-center gap-2")}>
                      <span className={cn("text-sm font-semibold")}>{item.employes}</span>
                      <span className={cn("text-xs text-muted-foreground")}>({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Can>
        </div>

        {/* Department Stats & Activity */}
        <div className={cn("grid grid-cols-1 xl:grid-cols-2 gap-6")}>
          {/* Department Distribution - Bar Chart */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS}>
            <Card className={cn("p-6 border-0 shadow-sm")}>
              <div className={cn("flex items-center justify-between mb-6")}>
                <div>
                  <h3 className={cn("font-semibold text-lg")}>Répartition par département</h3>
                  <p className={cn("text-sm text-muted-foreground mt-1")}>
                    Top {Math.min(6, departmentStats?.length || 0)} départements
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/apps/${slug}/hr/departments`}>
                    Voir tout
                    <ArrowUpRight className={cn("size-3 ml-1")} />
                  </Link>
                </Button>
              </div>

              {departmentData && departmentData.length > 0 ? (
                <>
                  <ChartContainer config={departmentChartConfig} className={cn("h-[300px] w-full")}>
                    <BarChart data={departmentData} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className={cn("stroke-muted")} />
                      <XAxis type="number" tickLine={false} axisLine={false} className={cn("text-xs")} />
                      <YAxis 
                        type="category" 
                        dataKey="departement" 
                        tickLine={false}
                        axisLine={false}
                        className={cn("text-xs")}
                        width={100}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent 
                            labelFormatter={(label) => {
                              const item = departmentData.find(d => d.departement === label);
                              return item?.fullName || label;
                            }}
                            formatter={(value, name) => {
                              const item = departmentData.find(d => d.employes === value);
                              return [
                                `${value} employés (${item?.pourcentage}%)`,
                                "Effectif"
                              ];
                            }}
                          />
                        }
                      />
                      <Bar 
                        dataKey="employes" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ChartContainer>

                  {/* Summary */}
                  <div className={cn("grid grid-cols-2 gap-4 mt-6 pt-6 border-t")}>
                    <div>
                      <p className={cn("text-xs text-muted-foreground")}>Plus grand département</p>
                      <p className={cn("text-sm font-semibold mt-1 truncate")}>
                        {departmentData[0]?.fullName}
                      </p>
                      <p className={cn("text-xs text-muted-foreground mt-0.5")}>
                        {departmentData[0]?.employes} employés
                      </p>
                    </div>
                    <div>
                      <p className={cn("text-xs text-muted-foreground")}>Départements actifs</p>
                      <p className={cn("text-2xl font-bold mt-1")}>{departmentStats?.length || 0}</p>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={Building2}
                  title="Aucun département"
                  description="Créez des départements pour organiser votre équipe"
                  action={{
                    label: "Créer un département",
                    href: `/apps/${slug}/hr/departments/create`,
                  }}
                />
              )}
            </Card>
          </Can>

          {/* Recent Activity Panel */}
          <div className={cn("flex flex-col gap-6")}>
            {/* Pending Leaves */}
            <Can permission={COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS}>
              <Card className={cn("p-6 border-0 shadow-sm")}>
                <div className={cn("flex items-center justify-between mb-4")}>
                  <div>
                    <h3 className={cn("font-semibold")}>Demandes en attente</h3>
                    <p className={cn("text-sm text-muted-foreground")}>À traiter</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/apps/${slug}/hr/leaves`}>
                      Voir tout
                      <ArrowUpRight className={cn("size-3 ml-1")} />
                    </Link>
                  </Button>
                </div>
                {pendingLeaves.length > 0 ? (
                  <div className={cn("space-y-3")}>
                    {pendingLeaves.slice(0, 3).map((leave) => (
                      <div key={leave.id} className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/30")}>
                        <div
                          className={cn(
                            "size-10 rounded-full flex items-center justify-center font-semibold text-sm text-white"
                          )}
                          style={{ backgroundColor: leave.leave_type_color || "#3b82f6" }}
                        >
                          {leave.employee_name?.[0] || "?"}
                        </div>
                        <div className={cn("flex-1 min-w-0")}>
                          <p className={cn("font-medium text-sm truncate")}>{leave.employee_name}</p>
                          <p className={cn("text-xs text-muted-foreground truncate")}>
                            {leave.leave_type_name} ·{" "}
                            {new Date(leave.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("shrink-0 bg-amber-50 text-amber-700 border-amber-200")}>
                          En attente
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={cn("text-center py-6")}>
                    <CheckCircle2 className={cn("size-10 text-green-500 mx-auto mb-2")} />
                    <p className={cn("text-sm text-muted-foreground")}>Aucune demande en attente</p>
                  </div>
                )}
              </Card>
            </Can>

            {/* Recent Hires */}
            <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
              <Card className={cn("p-6 border-0 shadow-sm")}>
                <div className={cn("flex items-center justify-between mb-4")}>
                  <div>
                    <h3 className={cn("font-semibold")}>Nouvelles recrues</h3>
                    <p className={cn("text-sm text-muted-foreground")}>Dernières embauches</p>
                  </div>
                </div>
                {stats?.recent_hires && stats?.recent_hires.length > 0 ? (
                  <div className={cn("space-y-3")}>
                    {stats?.recent_hires.slice(0, 3).map((employee) => (
                      <Link
                        key={employee.id}
                        href={`/apps/${slug}/hr/employees/${employee.id}`}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg",
                          "hover:bg-muted/50 transition-colors"
                        )}
                      >
                        <div
                          className={cn("size-10 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center font-semibold text-primary")}
                        >
                          {employee.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className={cn("flex-1 min-w-0")}>
                          <p className={cn("font-medium text-sm truncate")}>{employee.full_name}</p>
                          <p className={cn("text-xs text-muted-foreground truncate")}>
                            {employee.position_title || "Poste non défini"}
                          </p>
                        </div>
                        <Badge variant="default" className={cn("shrink-0 text-[10px]")}>
                          {employee.hire_date
                            ? new Date(employee.hire_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                            : "N/A"}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className={cn("text-center py-6 text-muted-foreground")}>
                    <UserPlus className={cn("size-10 mx-auto mb-2 opacity-30")} />
                    <p className={cn("text-sm")}>Aucune embauche récente</p>
                  </div>
                )}
              </Card>
            </Can>
          </div>
        </div>
      </div>
    </Can>
  );
}