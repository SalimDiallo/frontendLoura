"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Alert, Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend, ResponsiveContainer } from "recharts";
import {
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineUsers,
} from "react-icons/hi2";
import { getLeaveRequests } from "@/lib/services/hr/leave.service";
import { getLeaveTypes } from "@/lib/services/hr/leave-type.service";
import type { LeaveRequest, LeaveType } from "@/lib/types/hr";
import { formatLeaveDays } from "@/lib/utils/leave";

export default function LeaveStatsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [requestsResponse, typesResponse] = await Promise.all([
        getLeaveRequests(),
        getLeaveTypes({ is_active: true }),
      ]);

      setLeaveRequests(requestsResponse.results || []);
      setLeaveTypes(typesResponse);
    } catch (err: any) {
      console.error("Erreur lors du chargement:", err);
      setError(err.message || "Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  // Filter requests for selected month
  const filterRequestsForMonth = (requests: LeaveRequest[]) => {
    return requests.filter((request) => {
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      const selectedDate = new Date(selectedMonth + "-01");
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      return (
        (startDate >= monthStart && startDate <= monthEnd) ||
        (endDate >= monthStart && endDate <= monthEnd) ||
        (startDate <= monthStart && endDate >= monthEnd)
      );
    });
  };

  const monthRequests = filterRequestsForMonth(leaveRequests);

  // Calculate statistics
  const stats = {
    total: monthRequests.length,
    pending: monthRequests.filter((r) => r.status === "pending").length,
    approved: monthRequests.filter((r) => r.status === "approved").length,
    rejected: monthRequests.filter((r) => r.status === "rejected").length,
    totalDays: monthRequests
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + r.total_days, 0),
  };

  // Group by leave type
  const statsByType = leaveTypes.map((type) => {
    const typeRequests = monthRequests.filter(
      (r) => r.leave_type === type.id && r.status === "approved"
    );
    return {
      type,
      count: typeRequests.length,
      totalDays: typeRequests.reduce((sum, r) => sum + r.total_days, 0),
    };
  });

  // Top employees by leave days
  const employeeStats = monthRequests
    .filter((r) => r.status === "approved")
    .reduce((acc: any[], request) => {
      const employeeName = request.employee_details?.full_name || "N/A";
      const existing = acc.find((e) => e.name === employeeName);

      if (existing) {
        existing.days += request.total_days;
        existing.count += 1;
      } else {
        acc.push({
          name: employeeName,
          days: request.total_days,
          count: 1,
        });
      }

      return acc;
    }, [])
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/leaves`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <HiOutlineChartBar className="size-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-1">
            Statistiques des Congés
          </h1>
          <p className="text-muted-foreground">
            Analyse et métriques des demandes de congés
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <HiOutlineCalendar className="size-5 text-muted-foreground" />
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Période
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HiOutlineCalendar className="size-6" />
            </div>
            <Badge variant="secondary">
              {new Date(selectedMonth).toLocaleDateString('fr-FR', { month: 'long' })}
            </Badge>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Total demandes
          </p>
          <p className="text-4xl font-bold">
            {stats.total}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Toutes les demandes ce mois
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-orange-500 text-white">
              <HiOutlineClock className="size-6" />
            </div>
            <Badge variant="secondary">
              En attente
            </Badge>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            À traiter
          </p>
          <p className="text-4xl font-bold text-orange-600">
            {stats.pending}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Nécessitent une validation
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-green-500 text-white">
              <HiOutlineCheckCircle className="size-6" />
            </div>
            <Badge variant="secondary">
              Validées
            </Badge>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Approuvées
          </p>
          <p className="text-4xl font-bold text-green-600">
            {stats.approved}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Demandes acceptées
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-purple-500 text-white">
              <HiOutlineCalendar className="size-6" />
            </div>
            <Badge variant="secondary">
              Jours
            </Badge>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Jours approuvés
          </p>
          <p className="text-4xl font-bold text-purple-600">
            {formatLeaveDays(stats.totalDays)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Total des jours validés
          </p>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* By Leave Type - Pie Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HiOutlineChartBar className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Répartition par type
              </h2>
              <p className="text-xs text-muted-foreground">
                Distribution des jours de congé
              </p>
            </div>
          </div>
          {statsByType.length === 0 || statsByType.every(s => s.totalDays === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune donnée pour cette période
            </p>
          ) : (
            <ChartContainer
              config={statsByType.reduce((acc, { type }) => ({
                ...acc,
                [type.id]: {
                  label: type.name,
                  color: type.color,
                },
              }), {} as ChartConfig)}
              className="h-[300px]"
            >
              <PieChart>
                <Pie
                  data={statsByType.filter(s => s.totalDays > 0).map(({ type, totalDays }) => ({
                    name: type.name,
                    value: totalDays,
                    fill: type.color,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${formatLeaveDays(value)}j`}
                >
                  {statsByType.filter(s => s.totalDays > 0).map(({ type }) => (
                    <Cell key={type.id} fill={type.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ChartContainer>
          )}
        </Card>

        {/* Top Employees */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HiOutlineUsers className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Top 5 Employés
              </h2>
              <p className="text-xs text-muted-foreground">
                Employés avec le plus de congés
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {employeeStats.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                  <HiOutlineUsers className="size-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Aucune donnée pour cette période
                </p>
              </div>
            ) : (
              employeeStats.map((employee, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex size-10 items-center justify-center rounded-lg font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{employee.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <HiOutlineCalendar className="size-3" />
                        {employee.count} {employee.count > 1 ? "demandes" : "demande"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl">
                      {formatLeaveDays(employee.days)}
                    </p>
                    <p className="text-xs text-muted-foreground">jours</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Charts Grid - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution Bar Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HiOutlineChartBar className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Répartition par statut
              </h2>
              <p className="text-xs text-muted-foreground">
                Vue d'ensemble des demandes
              </p>
            </div>
          </div>
        <ChartContainer
          config={{
            pending: {
              label: "En attente",
              color: "hsl(var(--chart-1))",
            },
            approved: {
              label: "Approuvées",
              color: "hsl(var(--chart-2))",
            },
            rejected: {
              label: "Rejetées",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px]"
        >
          <BarChart
            data={[
              {
                status: "Statut",
                pending: stats.pending,
                approved: stats.approved,
                rejected: stats.rejected,
              },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="pending" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="approved" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rejected" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

        {/* Top Employees Bar Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HiOutlineUsers className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Top 5 Employés
              </h2>
              <p className="text-xs text-muted-foreground">
                Classement par jours de congé
              </p>
            </div>
          </div>
          {employeeStats.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                <HiOutlineUsers className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Aucune donnée pour cette période
              </p>
            </div>
          ) : (
          <ChartContainer
            config={employeeStats.reduce((acc, employee, index) => ({
              ...acc,
              [`employee${index}`]: {
                label: employee.name,
                color: `hsl(var(--chart-${(index % 5) + 1}))`,
              },
            }), {} as ChartConfig)}
            className="h-[300px]"
          >
            <BarChart
              data={employeeStats.map((employee) => ({
                name: employee.name.length > 15 ? employee.name.substring(0, 15) + '...' : employee.name,
                days: employee.days,
              }))}
              layout="vertical"
              margin={{ left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="days" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
