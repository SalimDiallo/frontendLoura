"use client";

import { Alert, Button, Card } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { API_ENDPOINTS } from "@/lib/api/config";
import { cacheManager } from "@/lib/offline";
import { getEmployees } from "@/lib/services/hr/employee.service";
import { getLeaveRequests } from "@/lib/services/hr/leave.service";
import type { EmployeeListItem, LeaveType } from "@/lib/types/hr";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineUserGroup,
  HiOutlineXMark
} from "react-icons/hi2";

const ReactApexChart = dynamic(
  () => import("react-apexcharts").then((mod) => mod.default as any),
  { ssr: false }
);

const STATUS_COLORS = {
  approved: "#22c55e", // Vert
  pending: "#f97316",  // Orange
  rejected: "#ef4444", // Rouge
};

function getUniqueUsers(reqs: any[]) {
  const users = new Set(reqs.map((r) => r.employee ?? r.employee_name));
  return users.size;
}

export default function LeaveStatsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Employee dropdown search
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>("");
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);

  // Leave type dropdown
  const [leaveTypeDropdownOpen, setLeaveTypeDropdownOpen] = useState(false);

  // Status dropdown
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Graph status selector
  const [graphStatuses, setGraphStatuses] = useState<string[]>(["all"]);

  // Filtered employees for dropdown search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearchTerm) return employees;
    const term = employeeSearchTerm.toLowerCase();
    return employees.filter(emp =>
      emp.full_name.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term)
    );
  }, [employees, employeeSearchTerm]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [requestsResponse, employeesResponse, leaveTypesResponse] = await Promise.all([
          getLeaveRequests(),
          getEmployees(slug),
          cacheManager.get<{ results: LeaveType[] } | LeaveType[]>(API_ENDPOINTS.HR.LEAVE_TYPES.LIST, { ttl: 10 * 60 * 1000 }),
        ]);

        setLeaveRequests(requestsResponse.results || []);
        setEmployees(employeesResponse.results || []);

        // Handle both array and paginated response formats
        const types = Array.isArray(leaveTypesResponse)
          ? leaveTypesResponse
          : (leaveTypesResponse as any)?.results || [];
        setLeaveTypes(types);
      } catch (err: any) {
        setError(err?.message || "Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  const monthList = useMemo(() => {
    if (!leaveRequests.length) return [];

    // Generate month list based on data or filter dates
    let minDate: Date, maxDate: Date;

    if (startDate && endDate) {
      minDate = new Date(startDate);
      maxDate = new Date(endDate);
    } else {
      const dates = leaveRequests.map(r => new Date(r.start_date));
      minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    }

    const months: string[] = [];
    let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= end) {
      const y = current.getFullYear();
      const m = ("0" + (current.getMonth() + 1)).slice(-2);
      months.push(`${y}-${m}`);
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }, [leaveRequests, startDate, endDate]);

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      const reqStart = new Date(req.start_date);
      const reqEnd = new Date(req.end_date);

      // Date range filter
      let byDate = true;
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date("2100-01-01");
        byDate =
          (reqStart >= start && reqStart <= end) ||
          (reqEnd >= start && reqEnd <= end) ||
          (reqStart <= start && reqEnd >= end);
      }

      // Employee filter
      let byEmployee = true;
      if (selectedEmployees.length > 0) {
        byEmployee = selectedEmployees.includes(req.employee);
      }

      // Leave type filter
      let byLeaveType = true;
      if (selectedLeaveTypes.length > 0) {
        byLeaveType = selectedLeaveTypes.includes(req.leave_type);
      }

      // Status filter
      let byStatus = true;
      if (selectedStatuses.length > 0) {
        byStatus = selectedStatuses.includes(req.status);
      }

      // Search (employee name or reason)
      let bySearch = true;
      if (searchTerm) {
        const val = searchTerm.toLowerCase();
        const employeeName = req.employee_name?.toLowerCase() || "";
        const reason = (req.reason || "").toLowerCase();
        bySearch = employeeName.includes(val) || reason.includes(val);
      }

      return byDate && byEmployee && byLeaveType && byStatus && bySearch;
    });
  }, [leaveRequests, startDate, endDate, selectedEmployees, selectedLeaveTypes, selectedStatuses, searchTerm]);

  // Statistiques globales
  const stats = useMemo(() => {
    return {
      total: filteredRequests.length,
      approved: filteredRequests.filter((r) => r.status === "approved").length,
      rejected: filteredRequests.filter((r) => r.status === "rejected").length,
      pending: filteredRequests.filter((r) => r.status === "pending").length,
      uniqueUsers: getUniqueUsers(filteredRequests),
    };
  }, [filteredRequests]);

  // Statistique cards - minimal design with status colors
  const statCards = [
    {
      label: "Total demandes",
      value: stats.total,
      icon: HiOutlineDocumentText,
      color: "text-neutral-900 dark:text-neutral-100",
    },
    {
      label: "Employés concernés",
      value: stats.uniqueUsers,
      icon: HiOutlineUserGroup,
      color: "text-neutral-900 dark:text-neutral-100",
    },
    {
      label: "Validées",
      value: stats.approved,
      color: "text-green-600",
    },
    {
      label: "En attente",
      value: stats.pending,
      color: "text-orange-500",
    },
    {
      label: "Refusées",
      value: stats.rejected,
      color: "text-red-500",
    },
  ];

  // Toggle graph status
  function handleToggleGraphStatus(status: string) {
    if (status === "all") {
      setGraphStatuses(["all"]);
    } else {
      let copy = graphStatuses.includes("all") ? [] : [...graphStatuses];
      if (copy.includes(status)) {
        copy = copy.filter((s) => s !== status);
      } else {
        copy.push(status);
      }
      if (copy.length === 0) copy = ["all"];
      setGraphStatuses(copy);
    }
  }

  // Reset all filters
  function resetFilters() {
    setSearchTerm("");
    setSelectedEmployees([]);
    setSelectedLeaveTypes([]);
    setSelectedStatuses([]);
    setStartDate("");
    setEndDate("");
    setGraphStatuses(["all"]);
  }

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedEmployees.length > 0) count++;
    if (selectedLeaveTypes.length > 0) count++;
    if (selectedStatuses.length > 0) count++;
    if (startDate || endDate) count++;
    return count;
  }, [searchTerm, selectedEmployees, selectedLeaveTypes, selectedStatuses, startDate, endDate]);

  // Data pour graphe
  const chartSeries = useMemo(() => {
    if (!filteredRequests.length || !monthList.length) {
      return [];
    }

    function getCountByMonth(statusFilter?: string) {
      const counts: Record<string, number> = {};
      filteredRequests.forEach((req) => {
        if (statusFilter && req.status !== statusFilter) return;
        let d = new Date(req.start_date);
        const y = d.getFullYear();
        const m = ("0" + (d.getMonth() + 1)).slice(-2);
        const key = `${y}-${m}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      return monthList.map((key) => counts[key] || 0);
    }

    if (graphStatuses.includes("all")) {
      return [{
        name: "Total demandes",
        data: getCountByMonth(),
        color: "#525252"
      }];
    }

    const statusLabels: Record<string, string> = {
      approved: "Validées",
      pending: "En attente",
      rejected: "Refusées"
    };

    return graphStatuses.map((status) => ({
      name: statusLabels[status] ?? status,
      data: getCountByMonth(status),
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#525252",
    }));
  }, [filteredRequests, graphStatuses, monthList]);

  const chartCategories = monthList;

  // Loader
  if (loading) {
    return (
      <div className="space-y-6 px-4 pt-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded bg-neutral-50 dark:bg-neutral-900 w-2/5 mb-2" />
          <div className="flex gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-md bg-neutral-50 dark:bg-neutral-900 flex-1"
              />
            ))}
          </div>
          <div className="h-80 bg-neutral-50 dark:bg-neutral-900 rounded-md mt-6" />
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-5 px-2 md:px-6 py-6 w-full max-w-screen-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="size-8 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Link href={`/apps/${slug}/hr/leaves`}>
              <HiOutlineArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Statistiques des congés
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <HiOutlineAdjustmentsHorizontal className="size-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs px-1.5 py-0.5 min-w-[20px] text-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </header>

      {/* Stats Cards - Minimal */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className="px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-none"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                {card.label}
              </span>
              {card.icon && <card.icon className="size-3.5 text-neutral-400" />}
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </Card>
        ))}
      </section>

      {/* Error */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Filtres avancés
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                <HiOutlineXMark className="size-5" />
              </button>
            </div>

            {/* Date Range & Search - Compact Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                  Date de début
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-all"
                  />
                  {startDate && (
                    <button
                      onClick={() => setStartDate("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      <HiOutlineXMark className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                  Date de fin
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-all"
                  />
                  {endDate && (
                    <button
                      onClick={() => setEndDate("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      <HiOutlineXMark className="size-4" />
                    </button>
                  )}
                </div>
              </div>
              

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                  Recherche
                </label>
                <div className="relative">
                  <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nom d'employé ou motif..."
                    className="w-full pl-9 pr-8 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      <HiOutlineXMark className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Employees Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                  Employés {selectedEmployees.length > 0 && `(${selectedEmployees.length})`}
                </label>
                {selectedEmployees.length > 0 && (
                  <button
                    onClick={() => setSelectedEmployees([])}
                    className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Dropdown Menu */}
              <DropdownMenu
                open={employeeDropdownOpen}
                onOpenChange={(open) => {
                  setEmployeeDropdownOpen(open);
                  if (!open) setEmployeeSearchTerm(""); // Reset search when closing
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {selectedEmployees.length > 0
                        ? `${selectedEmployees.length} employé${selectedEmployees.length > 1 ? 's' : ''} sélectionné${selectedEmployees.length > 1 ? 's' : ''}`
                        : "Sélectionner des employés"}
                    </span>
                    <HiOutlineChevronDown className="size-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[320px] max-h-[400px] overflow-hidden" align="start">
                  <div className="px-2 py-2">
                    <div className="relative">
                      <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un employé..."
                        value={employeeSearchTerm}
                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        if (selectedEmployees.length === employees.length) {
                          setSelectedEmployees([]);
                        } else {
                          setSelectedEmployees(employees.map(e => e.id));
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                    >
                      {selectedEmployees.length === employees.length ? "Tout désélectionner" : "Tout sélectionner"}
                    </button>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="max-h-[250px] overflow-y-auto">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <DropdownMenuCheckboxItem
                          key={emp.id}
                          checked={selectedEmployees.includes(emp.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEmployees([...selectedEmployees, emp.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                            }
                          }}
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">{emp.full_name}</span>
                            <span className="text-xs text-neutral-500">{emp.email}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-sm text-neutral-500">
                        Aucun employé trouvé
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Selected badges */}
              {selectedEmployees.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800">
                  {selectedEmployees.map((empId) => {
                    const emp = employees.find(e => e.id === empId);
                    return emp ? (
                      <span
                        key={empId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100"
                      >
                        {emp.full_name}
                        <button
                          onClick={() => setSelectedEmployees(prev => prev.filter(id => id !== empId))}
                          className="hover:text-red-500 transition-colors"
                        >
                          <HiOutlineXMark className="size-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Leave Types Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                  Types de congé {selectedLeaveTypes.length > 0 && `(${selectedLeaveTypes.length})`}
                </label>
                {selectedLeaveTypes.length > 0 && (
                  <button
                    onClick={() => setSelectedLeaveTypes([])}
                    className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Dropdown Menu */}
              <DropdownMenu open={leaveTypeDropdownOpen} onOpenChange={setLeaveTypeDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {selectedLeaveTypes.length > 0
                        ? `${selectedLeaveTypes.length} type${selectedLeaveTypes.length > 1 ? 's' : ''} sélectionné${selectedLeaveTypes.length > 1 ? 's' : ''}`
                        : "Sélectionner des types"}
                    </span>
                    <HiOutlineChevronDown className="size-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[280px]" align="start">
                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        if (selectedLeaveTypes.length === leaveTypes.length) {
                          setSelectedLeaveTypes([]);
                        } else {
                          setSelectedLeaveTypes(leaveTypes.map(t => t.id));
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                    >
                      {selectedLeaveTypes.length === leaveTypes.length ? "Tout désélectionner" : "Tout sélectionner"}
                    </button>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="max-h-[300px] overflow-y-auto">
                    {Array.isArray(leaveTypes) && leaveTypes.length > 0 ? (
                      leaveTypes.map((type) => (
                        <DropdownMenuCheckboxItem
                          key={type.id}
                          checked={selectedLeaveTypes.includes(type.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLeaveTypes([...selectedLeaveTypes, type.id]);
                            } else {
                              setSelectedLeaveTypes(selectedLeaveTypes.filter(id => id !== type.id));
                            }
                          }}
                          onSelect={(e) => e.preventDefault()}
                        >
                          <span className="text-sm">{type.name}</span>
                        </DropdownMenuCheckboxItem>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-sm text-neutral-500">
                        Aucun type de congé
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Selected badges */}
              {selectedLeaveTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800">
                  {selectedLeaveTypes.map((typeId) => {
                    const type = leaveTypes.find(t => t.id === typeId);
                    return type ? (
                      <span
                        key={typeId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100"
                      >
                        {type.name}
                        <button
                          onClick={() => setSelectedLeaveTypes(prev => prev.filter(id => id !== typeId))}
                          className="hover:text-red-500 transition-colors"
                        >
                          <HiOutlineXMark className="size-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                  Statut {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
                </label>
                {selectedStatuses.length > 0 && (
                  <button
                    onClick={() => setSelectedStatuses([])}
                    className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Dropdown Menu */}
              <DropdownMenu open={statusDropdownOpen} onOpenChange={setStatusDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {selectedStatuses.length > 0
                        ? `${selectedStatuses.length} statut${selectedStatuses.length > 1 ? 's' : ''} sélectionné${selectedStatuses.length > 1 ? 's' : ''}`
                        : "Sélectionner des statuts"}
                    </span>
                    <HiOutlineChevronDown className="size-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[240px]" align="start">
                  {[
                    { value: "pending", label: "En attente", color: "text-orange-600" },
                    { value: "approved", label: "Validée", color: "text-green-600" },
                    { value: "rejected", label: "Refusée", color: "text-red-600" }
                  ].map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status.value}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStatuses([...selectedStatuses, status.value]);
                        } else {
                          setSelectedStatuses(selectedStatuses.filter(s => s !== status.value));
                        }
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Selected badges */}
              {selectedStatuses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800">
                  {selectedStatuses.map((status) => {
                    const statusLabels: Record<string, string> = {
                      pending: "En attente",
                      approved: "Validée",
                      rejected: "Refusée"
                    };
                    const statusColors: Record<string, string> = {
                      pending: "text-orange-600 border-orange-300",
                      approved: "text-green-600 border-green-300",
                      rejected: "text-red-600 border-red-300"
                    };
                    return (
                      <span
                        key={status}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white dark:bg-neutral-950 border rounded ${statusColors[status]}`}
                      >
                        {statusLabels[status]}
                        <button
                          onClick={() => setSelectedStatuses(prev => prev.filter(s => s !== status))}
                          className="hover:text-red-500 transition-colors"
                        >
                          <HiOutlineXMark className="size-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-xs gap-2"
              >
                <HiOutlineXMark className="size-4" />
                Réinitialiser tous les filtres
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Graph Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Afficher sur le graphique :
        </span>
        <div className="flex gap-1.5">
          {[
            { value: "all", label: "Total" },
            { value: "approved", label: "Validées" },
            { value: "pending", label: "En attente" },
            { value: "rejected", label: "Refusées" },
          ].map((opt) => {
            const isActive = graphStatuses.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleGraphStatus(opt.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition border ${
                  isActive
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                    : "bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Graph */}
      <Card className="p-5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineChartBar className="size-4 text-neutral-500" />
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Évolution mensuelle des demandes
          </span>
        </div>

        {chartCategories.length === 0 || chartSeries.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex size-12 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 mx-auto mb-3">
              <HiOutlineCalendar className="size-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Aucune donnée disponible pour les filtres sélectionnés
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <ReactApexChart
              //@ts-ignore
              type="bar"
              //@ts-ignore
              height={360}
              //@ts-ignore
              width="100%"
              //@ts-ignore
              options={{
                chart: {
                  type: "bar",
                  toolbar: { show: false },
                  background: "transparent",
                  fontFamily: "inherit",
                  animations: { enabled: true, easing: "easeinout" }
                },
                plotOptions: {
                  bar: {
                    columnWidth: "60%",
                    borderRadius: 4,
                  },
                },
                dataLabels: { enabled: false },
                stroke: { show: false },
                xaxis: {
                  categories: chartCategories,
                  labels: {
                    style: { fontSize: "11px", colors: "#737373" },
                    rotate: -45,
                  },
                  axisTicks: { show: false },
                  axisBorder: { show: false },
                },
                yaxis: {
                  labels: {
                    style: { fontSize: "11px", colors: "#737373" },
                  },
                  min: 0,
                  forceNiceScale: true,
                },
                colors: chartSeries.map((serie) => serie.color),
                tooltip: {
                  enabled: true,
                  shared: true,
                  intersect: false,
                  y: {
                    formatter: function (val: any) {
                      return `${val} demande${val === 1 ? "" : "s"}`;
                    }
                  }
                },
                grid: {
                  strokeDashArray: 3,
                  borderColor: "#e5e5e5",
                  xaxis: { lines: { show: false } },
                  yaxis: { lines: { show: true } }
                },
                legend: {
                  show: chartSeries.length > 1,
                  position: "top",
                  horizontalAlign: "right",
                  fontSize: "11px",
                  markers: { width: 8, height: 8, radius: 2 }
                },
              }}
              //@ts-ignore
              series={chartSeries}
            />
          </div>
        )}
      </Card>
    </main>
  );
}
