"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Alert,
  Badge,
  Card,
  StatCard,
  PageHeader,
  PageSection,
  EmptyState
} from "@/components/ui";
import { getHRStats, getDepartmentStats } from "@/lib/services/hr";
import { getEmployees } from "@/lib/services/hr";
import { getLeaveRequests } from "@/lib/services/hr/leave.service";
import type { HRStats, DepartmentStats, LeaveRequest } from "@/lib/types/hr";
import {
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineBanknotes,
  HiOutlineBriefcase,
  HiOutlineArrowRight,
  HiOutlinePlusCircle,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineUserPlus,
} from "react-icons/hi2";
import {
  Users,
  Calendar,
  Wallet,
  FileText,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserPlus,
  ArrowUpRight,
  MoreHorizontal,
  CalendarDays,
  BriefcaseBusiness,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  LineChart,
  Line,
} from "recharts";
import { cn } from "@/lib/utils";

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
  }, [slug]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, deptStats, employeesData, leavesData] = await Promise.all([
        getHRStats(slug).catch(() => null),
        getDepartmentStats(slug).catch(() => []),
        getEmployees(slug, { page_size: 1000 }).catch(() => ({ results: [], count: 0 })),
        getLeaveRequests({ status: "pending" }).catch(() => ({ results: [] })),
      ]);

      setStats(statsData);
      setDepartmentStats(deptStats);
      setPendingLeaves(leavesData.results || []);

      // Generate payroll trend data (last 6 months)
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: d.toLocaleDateString("fr-FR", { month: "short" }),
          fullMonth: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
          montant: Math.floor(Math.random() * 5000000) + 10000000,
          employes: Math.floor(Math.random() * 10) + (employeesData.count - 5),
        });
      }
      setPayrollTrend(months);

    } catch (err) {
      setError("Erreur lors du chargement des statistiques");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate quick insights
  const insights = useMemo(() => {
    if (!stats) return [];
    
    const list = [];
    
    if (stats.pending_leave_requests > 0) {
      list.push({
        type: "warning",
        icon: Clock,
        title: `${stats.pending_leave_requests} demande${stats.pending_leave_requests > 1 ? 's' : ''} de congé en attente`,
        action: { label: "Traiter", href: `/apps/${slug}/hr/leaves` }
      });
    }
    
    if (stats.expiring_contracts && stats.expiring_contracts > 0) {
      list.push({
        type: "alert",
        icon: AlertTriangle,
        title: `${stats.expiring_contracts} contrat${stats.expiring_contracts > 1 ? 's' : ''} expire${stats.expiring_contracts > 1 ? 'nt' : ''} bientôt`,
        action: { label: "Voir", href: `/apps/${slug}/hr/contracts` }
      });
    }
    
    if (stats.recent_hires && stats.recent_hires.length > 0) {
      list.push({
        type: "success",
        icon: UserPlus,
        title: `${stats.recent_hires.length} nouvelle${stats.recent_hires.length > 1 ? 's' : ''} recrue${stats.recent_hires.length > 1 ? 's' : ''} ce mois`,
        action: { label: "Voir", href: `/apps/${slug}/hr/employees` }
      });
    }
    
    return list;
  }, [stats, slug]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-80 bg-muted rounded-xl"></div>
            <div className="h-80 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <Alert variant="error">{error || "Impossible de charger les données"}</Alert>
        <Button onClick={loadDashboardData}>Réessayer</Button>
      </div>
    );
  }

  // Prepare chart data
  const statusData = [
    { name: 'Actifs', value: stats.active_employees, color: '#22c55e' },
    { name: 'Inactifs', value: stats.inactive_employees, color: '#94a3b8' },
    { name: 'En congé', value: stats.on_leave_employees, color: '#3b82f6' },
  ].filter(item => item.value > 0);

  const departmentData = departmentStats.slice(0, 6).map(dept => ({
    name: dept.department.name.length > 12 
      ? dept.department.name.substring(0, 12) + '...' 
      : dept.department.name,
    fullName: dept.department.name,
    total: dept.employee_count,
    actifs: dept.active_count,
  }));

  const activityRate = stats.total_employees > 0 
    ? Math.round((stats.active_employees / stats.total_employees) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Ressources Humaines
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre équipe
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/hr/employees`}>
              <Users className="size-4 mr-2" />
              Employés
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/apps/${slug}/hr/employees/create`}>
              <UserPlus className="size-4 mr-2" />
              Nouvel employé
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Insights Banner */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, idx) => (
            <Card
              key={idx}
              className={cn(
                "p-4 border-0 shadow-sm flex items-center gap-4",
                insight.type === "warning" && "bg-amber-50 dark:bg-amber-950/30",
                insight.type === "alert" && "bg-red-50 dark:bg-red-950/30",
                insight.type === "success" && "bg-green-50 dark:bg-green-950/30"
              )}
            >
              <div className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0",
                insight.type === "warning" && "bg-amber-100 dark:bg-amber-900/50 text-amber-600",
                insight.type === "alert" && "bg-red-100 dark:bg-red-900/50 text-red-600",
                insight.type === "success" && "bg-green-100 dark:bg-green-900/50 text-green-600"
              )}>
                <insight.icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{insight.title}</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href={insight.action.href}>
                  {insight.action.label}
                  <ArrowUpRight className="size-3 ml-1" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Effectif */}
        <Card className="p-5 border-0 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Effectif total</p>
              <p className="text-3xl font-bold mt-1">{stats.total_employees}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {stats.active_employees} actifs
                </Badge>
              </div>
            </div>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="size-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taux d'activité</span>
              <span className="font-semibold text-green-600">{activityRate}%</span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${activityRate}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Masse Salariale */}
        <Card className="p-5 border-0 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Masse salariale</p>
              <p className="text-3xl font-bold mt-1">
                {(stats.total_payroll_this_month / 1000000).toFixed(1)}
                <span className="text-lg font-normal text-muted-foreground ml-1">M</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">GNF ce mois</p>
            </div>
            <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Wallet className="size-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Moy. / employé</span>
              <span className="font-semibold">
                {stats.active_employees > 0 
                  ? Math.round(stats.total_payroll_this_month / stats.active_employees / 1000).toLocaleString() + 'K'
                  : '0'
                }
              </span>
            </div>
          </div>
        </Card>

        {/* Congés */}
        <Card className="p-5 border-0 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Demandes de congé</p>
              <p className="text-3xl font-bold mt-1">{stats.pending_leave_requests}</p>
              <p className="text-sm text-muted-foreground mt-2">en attente</p>
            </div>
            <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Calendar className="size-6 text-amber-500" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">{stats.on_leave_employees} en congé</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Contrats */}
        <Card className="p-5 border-0 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Contrats actifs</p>
              <p className="text-3xl font-bold mt-1">{stats.active_contracts || 0}</p>
              <p className="text-sm text-muted-foreground mt-2">
                sur {stats.total_contracts || 0} total
              </p>
            </div>
            <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <FileText className="size-6 text-purple-500" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50">
            {stats.expiring_contracts && stats.expiring_contracts > 0 ? (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="size-4" />
                <span>{stats.expiring_contracts} expirent bientôt</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="size-4" />
                <span>Tous à jour</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: Users, label: "Employés", href: `/apps/${slug}/hr/employees`, count: stats.total_employees },
          { icon: Building2, label: "Départements", href: `/apps/${slug}/hr/departments` },
          { icon: BriefcaseBusiness, label: "Rôles", href: `/apps/${slug}/hr/roles` },
          { icon: Wallet, label: "Paie", href: `/apps/${slug}/hr/payroll` },
          { icon: CalendarDays, label: "Congés", href: `/apps/${slug}/hr/leaves`, count: stats.pending_leave_requests },
          { icon: FileText, label: "Contrats", href: `/apps/${slug}/hr/contracts` },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all group"
          >
            <div className="size-10 rounded-xl bg-background shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <item.icon className="size-5 text-primary" />
            </div>
            <span className="text-sm font-medium">{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <Badge variant="outline" className="text-[10px]">{item.count}</Badge>
            )}
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Trend */}
        <Card className="lg:col-span-2 p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Évolution de la masse salariale</h3>
              <p className="text-sm text-muted-foreground">6 derniers mois</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/payroll`}>
                Détails
                <ArrowUpRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
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
        </Card>

        {/* Employee Distribution */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Répartition</h3>
              <p className="text-sm text-muted-foreground">Par statut</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
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
          <div className="flex justify-center gap-4 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.name}</span>
                <span className="text-xs font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Department Stats & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Répartition par département</h3>
              <p className="text-sm text-muted-foreground">{departmentStats.length} départements</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/departments`}>
                Voir tout
                <ArrowUpRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>
          {departmentData.length > 0 ? (
            <div className="space-y-4">
              {departmentStats.slice(0, 5).map((dept, idx) => {
                const percentage = stats.total_employees > 0 
                  ? Math.round((dept.employee_count / stats.total_employees) * 100) 
                  : 0;
                return (
                  <div key={dept.department.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "size-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm",
                          idx === 0 && "bg-primary",
                          idx === 1 && "bg-blue-500",
                          idx === 2 && "bg-green-500",
                          idx === 3 && "bg-amber-500",
                          idx >= 4 && "bg-purple-500"
                        )}>
                          {dept.department.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{dept.department.name}</p>
                          <p className="text-xs text-muted-foreground">{dept.employee_count} employés</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">{percentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          idx === 0 && "bg-primary",
                          idx === 1 && "bg-blue-500",
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

        {/* Pending Leaves & Recent Hires */}
        <div className="space-y-6">
          {/* Pending Leaves */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Demandes en attente</h3>
                <p className="text-sm text-muted-foreground">À traiter</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/apps/${slug}/hr/leaves`}>
                  Voir tout
                  <ArrowUpRight className="size-3 ml-1" />
                </Link>
              </Button>
            </div>
            {pendingLeaves.length > 0 ? (
              <div className="space-y-3">
                {pendingLeaves.slice(0, 3).map((leave) => (
                  <div key={leave.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div 
                      className="size-10 rounded-full flex items-center justify-center font-semibold text-sm text-white"
                      style={{ backgroundColor: leave.leave_type_color || '#3b82f6' }}
                    >
                      {leave.employee_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{leave.employee_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {leave.leave_type_name} · {new Date(leave.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                      En attente
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="size-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune demande en attente</p>
              </div>
            )}
          </Card>

          {/* Recent Hires */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Nouvelles recrues</h3>
                <p className="text-sm text-muted-foreground">Dernières embauches</p>
              </div>
            </div>
            {stats.recent_hires && stats.recent_hires.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_hires.slice(0, 3).map((employee) => (
                  <Link
                    key={employee.id}
                    href={`/apps/${slug}/hr/employees/${employee.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-semibold text-primary">
                      {employee.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{employee.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {employee.position_title || 'Poste non défini'}
                      </p>
                    </div>
                    <Badge variant="default" className="shrink-0 text-[10px]">
                      {employee.hire_date
                        ? new Date(employee.hire_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                        : 'N/A'}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <UserPlus className="size-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune embauche récente</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
