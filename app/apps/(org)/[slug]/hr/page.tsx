"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Alert,
  Badge,
  Card,
  EmptyState
} from "@/components/ui";
import { getHRStats, getDepartmentStats } from "@/lib/services/hr";
import { getEmployees } from "@/lib/services/hr";
import { getLeaveRequests } from "@/lib/services/hr/leave.service";
import type { HRStats, DepartmentStats, LeaveRequest } from "@/lib/types/hr";
import {
  Users,
  Calendar,
  Wallet,
  FileText,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserPlus,
  ArrowUpRight,
  CalendarDays,
  BriefcaseBusiness,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/utils";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types";

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

      const [statsData, deptStats, employeesData, leavesData] = await Promise.allSettled([
        getHRStats(slug),
        getDepartmentStats(slug),
        getEmployees(slug, { page_size: 1000 }),
        getLeaveRequests({ status: "pending" }),
      ]);

      // Handle stats data
      if (statsData.status === "fulfilled" && statsData.value) {
        setStats(statsData.value);
      } else {
        console.error("Failed to load HR stats:", statsData.status === "rejected" ? statsData.reason : "No data");
        setStats(null);
      }

      // Handle department stats
      if (deptStats?.status === "fulfilled" && Array.isArray(deptStats?.value)) {
        setDepartmentStats(deptStats?.value);
      } else {
        console.error("Failed to load department stats:", deptStats?.status === "rejected" ? deptStats?.reason : "No data");
        setDepartmentStats([]);
      }

      // Handle employees data
      const employees = employeesData.status === "fulfilled" && employeesData.value
        ? employeesData.value
        : { results: [], count: 0 };

      // Handle leave requests
      if (leavesData.status === "fulfilled" && leavesData.value && "results" in leavesData.value) {
        setPendingLeaves(Array.isArray(leavesData.value.results) ? leavesData.value.results : []);
      } else {
        console.error("Failed to load leave requests:", leavesData.status === "rejected" ? leavesData.reason : "No data");
        setPendingLeaves([]);
      }

      // Generate payroll trend data (last 6 months)
      // TODO: Replace with real API data when available
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: d.toLocaleDateString("fr-FR", { month: "short" }),
          fullMonth: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
          montant: Math.floor(Math.random() * 5000000) + 10000000,
          employes: Math.max(0, Math.floor(Math.random() * 10) + (employees.count - 5)),
        });
      }
      setPayrollTrend(months);
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

  const statusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Actifs", value: stats?.active_employees, color: "#22c55e" },
      { name: "Inactifs", value: stats?.inactive_employees, color: "#94a3b8" },
      { name: "En congé", value: stats?.on_leave_employees, color: "#3b82f6" },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const departmentData = useMemo(() => {
    return departmentStats?.slice(0, 6).map((dept) => ({
      name:
        dept.department.name.length > 12
          ? dept.department.name.substring(0, 12) + "..."
          : dept.department.name,
      fullName: dept.department.name,
      total: dept.employee_count,
      actifs: dept.active_count,
    }));
  }, [departmentStats]);

  const activityRate = useMemo(() => {
    if (!stats || stats?.total_employees === 0) return 0;
    return Math.round((stats?.active_employees / stats?.total_employees) * 100);
  }, [stats]);

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

  // if (!stats) {
  //   return (
  //     <div className={cn("space-y-6")}>
  //       <Alert variant="error">{error || "Impossible de charger les données"}</Alert>
  //       <Button onClick={loadDashboardData}>Réessayer</Button>
  //     </div>
  //   );
  // }

  return (
   <Can anyPermissions={[COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS, COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS]} showMessage>
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

      {/* Quick Insights Banner (Can par insight) */}
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

      {/* Main Stats Grid - chaque Card dans Can */}
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
                <p className={cn("text-sm text-muted-foreground mt-2")}>GNF ce mois</p>
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
                    ? Math.round((stats?.total_payroll_this_month ?? 0) / (stats?.active_employees ?? 0 )/ 1000).toLocaleString() + "K"
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

      {/* Charts Section */}
      <div className={cn("grid grid-cols-1 xl:grid-cols-3 gap-6")}>
        {/* Payroll Trend */}
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_PAYROLL}>
          <Card className={cn("xl:col-span-2 p-4 md:p-6 border-0 shadow-sm h-full")}>
            <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-2")}>
              <div>
                <h3 className={cn("font-semibold")}>Évolution de la masse salariale</h3>
                <p className={cn("text-sm text-muted-foreground")}>6 derniers mois</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/apps/${slug}/hr/payroll`}>
                  Détails
                  <ArrowUpRight className={cn("size-3 ml-1")} />
                </Link>
              </Button>
            </div>
            <div className={cn("w-full min-h-[200px] h-[200px] md:h-[240px] xl:h-[280px]")}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payrollTrend}>
                  <defs>
                    <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} GNF`, 'Montant']}
                    labelFormatter={(label) => payrollTrend.find(p => p.month === label)?.fullMonth}
                  />
                  <Area
                    type="monotone"
                    dataKey="montant"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorMontant)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Can>

        {/* Employee Distribution */}
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
          <Card className={cn("p-4 md:p-6 border-0 shadow-sm h-full")}>
            <div className={cn("flex items-center justify-between mb-6")}>
              <div>
                <h3 className={cn("font-semibold")}>Répartition</h3>
                <p className={cn("text-sm text-muted-foreground")}>Par statut</p>
              </div>
            </div>
            <div className={cn("w-full min-h-[120px] h-[140px] sm:h-[180px]")}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={cn("flex flex-wrap justify-center gap-4 mt-4")}>
              {statusData.map((item) => (
                <div key={item.name} className={cn("flex items-center gap-2")}>
                  <div className={cn("size-3 rounded-full")} style={{ backgroundColor: item.color }} />
                  <span className={cn("text-xs text-muted-foreground")}>{item.name}</span>
                  <span className={cn("text-xs font-semibold")}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </Can>
      </div>

      {/* Department Stats & Recent Activity */}
      <div className={cn("flex flex-col xl:flex-row gap-6")}>
        {/* Departments */}
        <Can permission={COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS}>
          <Card className={cn("p-4 md:p-6 border-0 shadow-sm w-full xl:w-1/2")}>
            <div className={cn("flex items-center justify-between mb-6")}>
              <div>
                <h3 className={cn("font-semibold")}>Répartition par département</h3>
                <p className={cn("text-sm text-muted-foreground")}>{departmentStats?.length} départements</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/apps/${slug}/hr/departments`}>
                  Voir tout
                  <ArrowUpRight className={cn("size-3 ml-1")} />
                </Link>
              </Button>
            </div>
            {departmentData.length > 0 ? (
              <div className={cn("space-y-4")}>
                {departmentStats?.slice(0, 5).map((dept, idx) => {
                  const percentage =
                    (stats?.total_employees ?? 0 )> 0
                      ? Math.round((dept.employee_count / (stats?.total_employees ?? 1)) * 100)
                      : 0;
                  return (
                    <div key={dept.department.id} className={cn("space-y-2")}>
                      <div className={cn("flex items-center justify-between")}>
                        <div className={cn("flex items-center gap-3")}>
                          <div
                            className={cn(
                              "size-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm",
                              idx === 0 && "bg-primary",
                              idx === 1 && "bg-foreground",
                              idx === 2 && "bg-green-500",
                              idx === 3 && "bg-amber-500",
                              idx >= 4 && "bg-purple-500"
                            )}
                          >
                            {dept.department.name[0]}
                          </div>
                          <div>
                            <p className={cn("font-medium text-sm")}>{dept.department.name}</p>
                            <p className={cn("text-xs text-muted-foreground")}>
                              {dept.employee_count} employés
                            </p>
                          </div>
                        </div>
                        <span className={cn("text-sm font-semibold")}>{percentage}%</span>
                      </div>
                      <div className={cn("h-2 bg-muted rounded-full overflow-hidden")}>
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            idx === 0 && "bg-primary",
                            idx === 1 && "bg-foreground",
                            idx === 2 && "bg-green-500",
                            idx === 3 && "bg-amber-500",
                            idx >= 4 && "bg-purple-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
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

        {/* Pending Leaves & Recent Hires */}
        <div className={cn("flex flex-col gap-6 w-full xl:w-1/2")}>
          {/* Pending Leaves */}
          <Can permission={COMMON_PERMISSIONS.HR.VIEW_LEAVE_REQUESTS}>
            <Card className={cn("p-4 md:p-6 border-0 shadow-sm h-full")}>
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
            <Card className={cn("p-4 md:p-6 border-0 shadow-sm h-full")}>
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
