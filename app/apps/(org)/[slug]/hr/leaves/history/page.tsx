"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Alert, Button, Badge, Input, Select } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCalendar,
  HiOutlineMagnifyingGlass,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import {
  getLeaveRequests,
  getLeaveBalances,
} from "@/lib/services/hr/leave.service";
import { getLeaveTypes } from "@/lib/services/hr/leave-type.service";
import { getEmployees } from "@/lib/services/hr/employee.service";
import type { LeaveRequest, LeaveType, Employee } from "@/lib/types/hr";
import { exportLeaveRequestToPDF } from "@/lib/utils/pdf-export";

type SortField = "created_at" | "start_date" | "end_date" | "total_days";
type SortOrder = "asc" | "desc";

export default function LeaveHistoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  // Sorting
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [requestsResponse, typesResponse, employeesResponse] =
        await Promise.all([
          getLeaveRequests(),
          getLeaveTypes({ is_active: true }),
          getEmployees({ is_active: true }),
        ]);

      setLeaveRequests(requestsResponse.results || []);
      setLeaveTypes(typesResponse);
      setEmployees(employeesResponse.results || []);
    } catch (err: any) {
      console.error("Erreur lors du chargement:", err);
      setError(
        err.message || "Erreur lors du chargement de l'historique des congés"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, any> = {
      pending: {
        label: "En attente",
        variant: "warning" as const,
        icon: HiOutlineClock,
      },
      approved: {
        label: "Approuvé",
        variant: "success" as const,
        icon: HiOutlineCheckCircle,
      },
      rejected: {
        label: "Rejeté",
        variant: "error" as const,
        icon: HiOutlineXCircle,
      },
      cancelled: {
        label: "Annulé",
        variant: "default" as const,
        icon: HiOutlineXCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="size-3" />
        {config.label}
      </Badge>
    );
  };

  // Apply filters and sorting
  const filteredRequests = leaveRequests
    .filter((request) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        request.employee_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.leave_type_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      // Employee filter
      const matchesEmployee =
        selectedEmployee === "all" || request.employee === selectedEmployee;

      // Type filter
      const matchesType =
        selectedType === "all" || request.leave_type === selectedType;

      // Status filter
      const matchesStatus =
        selectedStatus === "all" || request.status === selectedStatus;

      // Year filter
      const requestYear = new Date(request.start_date).getFullYear().toString();
      const matchesYear = selectedYear === "all" || requestYear === selectedYear;

      return (
        matchesSearch &&
        matchesEmployee &&
        matchesType &&
        matchesStatus &&
        matchesYear
      );
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "created_at":
          aValue = new Date(a.created_at || "").getTime();
          bValue = new Date(b.created_at || "").getTime();
          break;
        case "start_date":
          aValue = new Date(a.start_date).getTime();
          bValue = new Date(b.start_date).getTime();
          break;
        case "end_date":
          aValue = new Date(a.end_date).getTime();
          bValue = new Date(b.end_date).getTime();
          break;
        case "total_days":
          aValue = a.total_days;
          bValue = b.total_days;
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

  // Get available years from requests
  const availableYears = Array.from(
    new Set(
      leaveRequests.map((r) => new Date(r.start_date).getFullYear().toString())
    )
  ).sort((a, b) => parseInt(b) - parseInt(a));

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedEmployee("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedYear(new Date().getFullYear().toString());
    setSortField("created_at");
    setSortOrder("desc");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/leaves`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineCalendar className="size-7" />
              Historique des Congés
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            Consultez l'historique complet des demandes de congés
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Filters Card */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineAdjustmentsHorizontal className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Filtres et Recherche</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Employee Filter */}
          <Select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            options={[
              { value: "all", label: "Tous les employés" },
              ...employees.map((employee) => ({
                value: employee.id,
                label: employee.full_name,
              })),
            ]}
          />

          {/* Type Filter */}
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={[
              { value: "all", label: "Tous les types" },
              ...leaveTypes.map((type) => ({
                value: type.id,
                label: type.name,
              })),
            ]}
          />

          {/* Status Filter */}
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: "all", label: "Tous les statuts" },
              { value: "pending", label: "En attente" },
              { value: "approved", label: "Approuvé" },
              { value: "rejected", label: "Rejeté" },
              { value: "cancelled", label: "Annulé" },
            ]}
          />

          {/* Year Filter */}
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            options={[
              { value: "all", label: "Toutes les années" },
              ...availableYears.map((year) => ({
                value: year,
                label: year,
              })),
            ]}
          />

          {/* Sort */}
          <Select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-") as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}
            options={[
              { value: "created_at-desc", label: "Plus récent (création)" },
              { value: "created_at-asc", label: "Plus ancien (création)" },
              { value: "start_date-desc", label: "Plus récent (début)" },
              { value: "start_date-asc", label: "Plus ancien (début)" },
              { value: "total_days-desc", label: "Plus de jours" },
              { value: "total_days-asc", label: "Moins de jours" },
            ]}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredRequests.length} demande
            {filteredRequests.length > 1 ? "s" : ""} trouvée
            {filteredRequests.length > 1 ? "s" : ""}
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Réinitialiser les filtres
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <HiOutlineCalendar className="size-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Aucune demande trouvée
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Aucune demande de congé ne correspond à vos critères de recherche
                </p>
              </div>
              <Button variant="outline" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demandé le</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Approbateur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {request.created_at
                          ? new Date(request.created_at).toLocaleDateString(
                              "fr-FR",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {request.employee_name || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3 rounded-full"
                          style={{
                            backgroundColor:
                              request.leave_type_color || "#3B82F6",
                          }}
                        />
                        <span className="text-sm">
                          {request.leave_type_name || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {new Date(request.start_date).toLocaleDateString(
                            "fr-FR"
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          →{" "}
                          {new Date(request.end_date).toLocaleDateString(
                            "fr-FR"
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {request.total_days}{" "}
                        {request.total_days > 1 ? "jours" : "jour"}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {request.approver_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportLeaveRequestToPDF(request)}
                          title="Télécharger PDF"
                        >
                          <HiOutlineDocumentText className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/apps/${slug}/hr/leaves/${request.id}`}>
                            Détails
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      {filteredRequests.length > 0 && (
        <Card className="p-6 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            Résumé de la sélection
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total demandes</p>
              <p className="text-2xl font-bold text-foreground">
                {filteredRequests.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jours approuvés</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredRequests
                  .filter((r) => r.status === "approved")
                  .reduce((sum, r) => sum + parseFloat(r.total_days as any), 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold text-orange-600">
                {filteredRequests.filter((r) => r.status === "pending").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejetés</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredRequests.filter((r) => r.status === "rejected").length}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
