"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {

  HiOutlineIdentification,
  HiOutlineCheckCircle,
  HiOutlineBriefcase,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { LuUsers, LuCalendarOff, LuPause, LuBan } from "react-icons/lu";
import { Alert, Badge, Button, Card, Input } from "@/components/ui";

import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";
import { SmartFilters, FilterConfig } from "@/components/ui/smart-filters";
import { useAuthStore } from "@/lib/store";
import { getEmployees, deleteEmployee, activateEmployee, deactivateEmployee } from "@/lib/services/hr";
import type { EmployeeListItem } from "@/lib/types/hr";
import { DeleteConfirmation } from "@/components/common/confirmation-dialog";
import { EmployeesHeader } from "@/components/hr/employees/EmployeesHeader";
import { EmployeesStatsCards } from "@/components/hr/employees/EmployeesStatsCards";
import { EmployeesSearchAndFilters } from "@/components/hr/employees/EmployeesSearchAndFilters";
import { EmployeesEmptyState } from "@/components/hr/employees/EmployeesEmptyState";
import { EmployeesTable } from "@/components/hr/employees/EmployeesTable";
import { EmployeesPagination } from "@/components/hr/employees/EmployeesPagination";

// ============================================
// Types & Constants
// ============================================

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "active", label: "Actifs", icon: <HiOutlineCheckCircle className="size-3 text-green-500" /> },
  { value: "on_leave", label: "En congé", icon: <LuCalendarOff className="size-3 text-foreground" /> },
  { value: "suspended", label: "Suspendus", icon: <LuPause className="size-3 text-orange-500" /> },
  { value: "terminated", label: "Terminés", icon: <LuBan className="size-3 text-red-500" /> },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" },
];

function uniqueNonEmpty<T>(items: (T | undefined | null)[]): T[] {
  return [...new Set(items.filter((item): item is T => !!item))];
}


export default function EmployeesPage() {
  const params = useParams();
  const routerNav = useRouter();
  const slug = params.slug as string;

  // Data states
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // For delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeListItem | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    status: "",
    department: "",
    position: "",
    role: "",
    gender: "",
    active: "",
  });

  // UI states
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Current user
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id;

  // ============================================
  // Data Loading
  // ============================================

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployees(slug, {
        page: currentPage,
        page_size: 20,
      });
      setEmployees(data.results);
      setTotalCount(data.count);
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors du chargement des employés";
      setError(errorMessage);
      console.error("Error loading employees:", err);
    } finally {
      setLoading(false);
    }
  }, [slug, currentPage]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // ============================================
  // Filter Configuration
  // ============================================

  // Build dynamic options from loaded data
  const filterConfigs: FilterConfig[] = useMemo(() => {
    const departments = uniqueNonEmpty(employees.map((e) => e.department_name));
    const positions = uniqueNonEmpty(employees.map((e) => e.position_title));
    const roles = uniqueNonEmpty(employees.map((e) => e.role_name));

    // Count employees per status
    const statusCounts = EMPLOYMENT_STATUS_OPTIONS.map((opt) => ({
      ...opt,
      count: employees.filter((e) => e.employment_status === opt.value).length,
    }));

    return [
      {
        key: "status",
        label: "Statut",
        icon: <LuUsers className="size-3" />,
        options: statusCounts,
      },
      {
        key: "department",
        label: "Département",
        icon: <HiOutlineBriefcase className="size-3" />,
        options: departments.map((d) => ({
          value: d,
          label: d,
          count: employees.filter((e) => e.department_name === d).length,
        })),
      },
      {
        key: "position",
        label: "Poste",
        icon: <HiOutlineIdentification className="size-3" />,
        options: positions.map((p) => ({
          value: p,
          label: p,
          count: employees.filter((e) => e.position_title === p).length,
        })),
      },
      {
        key: "role",
        label: "Rôle",
        icon: <HiOutlineShieldCheck className="size-3" />,
        options: roles.map((r) => ({
          value: r,
          label: r,
          count: employees.filter((e) => e.role_name === r).length,
        })),
      },
      {
        key: "gender",
        label: "Genre",
        options: GENDER_OPTIONS,
      },
    ];
  }, [employees]);

  // ============================================
  // Filtering Logic
  // ============================================

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchString = `${emp.full_name || ""} ${emp.email || ""} ${emp.employee_id || ""}`.toLowerCase();
        if (!searchString.includes(query)) return false;
      }

      // Status filter
      if (filters.status && emp.employment_status !== filters.status) return false;

      // Department filter
      if (filters.department && emp.department_name !== filters.department) return false;

      // Position filter
      if (filters.position && emp.position_title !== filters.position) return false;

      // Role filter
      if (filters.role && emp.role_name !== filters.role) return false;

      // Gender filter
      if (filters.gender && emp.gender !== filters.gender) return false;

      return true;
    });
  }, [employees, searchQuery, filters]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v
    );
  }, [filters]);

  // ============================================
  // Handlers
  // ============================================

  const handleFilterChange = useCallback((key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      status: "",
      department: "",
      position: "",
      role: "",
      gender: "",
      active: "",
    });
    setSearchQuery("");
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    setEmployeeToDelete(emp || null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      setDeleting(employeeToDelete.id);
      await deleteEmployee(employeeToDelete.id);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      await loadEmployees();
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setDeleting(id);
      if (currentStatus) {
        await deactivateEmployee(id);
      } else {
        await activateEmployee(id);
      }
      await loadEmployees();
    } catch (err) {
      alert("Erreur lors du changement de statut");
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  // ============================================
  // Keyboard Shortcuts
  // ============================================

  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      commonShortcuts.search(() => searchInputRef.current?.focus()),
      commonShortcuts.new(() => routerNav.push(`/apps/${slug}/hr/employees/create`)),
      commonShortcuts.help(() => setShowShortcuts(true)),
      commonShortcuts.escape(() => {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
          setSearchQuery("");
        } else {
          setSelectedIndex(-1);
        }
      }),
      commonShortcuts.arrowDown(() => {
        setSelectedIndex((prev) => Math.min(prev + 1, filteredEmployees.length - 1));
      }),
      commonShortcuts.arrowUp(() => {
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }),
      commonShortcuts.enter(() => {
        if (selectedIndex >= 0 && filteredEmployees[selectedIndex]) {
          routerNav.push(`/apps/${slug}/hr/employees/${filteredEmployees[selectedIndex].id}`);
        }
      }),
      {
        key: "e",
        action: () => {
          if (selectedIndex >= 0 && filteredEmployees[selectedIndex]) {
            routerNav.push(`/apps/${slug}/hr/employees/${filteredEmployees[selectedIndex].id}/edit`);
          }
        },
        description: "Éditer l'employé sélectionné",
      },
      {
        key: "r",
        action: handleResetFilters,
        description: "Réinitialiser tous les filtres",
      },
      commonShortcuts.filter("1", () => handleFilterChange("status", filters.status === "active" ? "" : "active"), "Filtrer: Actifs"),
      commonShortcuts.filter("2", () => handleFilterChange("status", filters.status === "on_leave" ? "" : "on_leave"), "Filtrer: En congé"),
      commonShortcuts.filter("3", () => handleFilterChange("status", filters.status === "suspended" ? "" : "suspended"), "Filtrer: Suspendus"),
      commonShortcuts.filter("4", () => handleFilterChange("status", filters.status === "terminated" ? "" : "terminated"), "Filtrer: Terminés"),
      {
        key: ",",
        action: () => {
          if (hasPrevious) handlePageChange(currentPage - 1);
        },
        description: "Page précédente",
      },
      {
        key: ".",
        action: () => {
          if (hasNext) handlePageChange(currentPage + 1);
        },
        description: "Page suivante",
      },
    ],
    [slug, routerNav, showShortcuts, selectedIndex, filteredEmployees, filters, hasPrevious, hasNext, currentPage, handleResetFilters, handleFilterChange]
  );

  useKeyboardShortcuts({ shortcuts });

  // ============================================
  // Stats
  // ============================================

  const stats = useMemo(() => {
    const totalSalary = employees.reduce((sum, e) => sum + (e.base_salary || 0), 0);
    return {
      total: totalCount,
      active: employees.filter((e) => e.employment_status === "active").length,
      onLeave: employees.filter((e) => e.employment_status === "on_leave").length,
      inactive: employees.filter(
        (e) => e.employment_status === "suspended" || e.employment_status === "terminated"
      ).length,
      totalSalary,
    };
  }, [totalCount, employees]);

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES} showMessage={true}>
        <div className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-44 bg-muted rounded"></div>
          </div>
        </div>
      </Can>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES} showMessage={true}>
      <div className="space-y-5">
        {/* Shortcuts Modal */}
        <ShortcutsHelpModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          shortcuts={shortcuts}
          title="Raccourcis clavier - Employés"
        />

        {error && <Alert variant="error" className="text-sm py-2 px-3">{error}</Alert>}

        {/* Header */}
        <EmployeesHeader slug={slug} shortcuts={shortcuts} showShortcuts={showShortcuts} setShowShortcuts={setShowShortcuts} />

        {/* Stats Cards */}
        <EmployeesStatsCards stats={stats} filters={filters} handleFilterChange={handleFilterChange} formatCurrency={formatCurrency} />

        {/* Search & Filters */}
        <EmployeesSearchAndFilters
          searchInputRef={searchInputRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterConfigs={filterConfigs}
          filters={filters}
          handleFilterChange={handleFilterChange}
          handleResetFilters={handleResetFilters}
        />

        {/* Employees Table or Empty State */}
        <Card className="border shadow-sm overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <EmployeesEmptyState
              hasActiveFilters={hasActiveFilters}
              searchQuery={searchQuery}
              slug={slug}
            />
          ) : (
            <EmployeesTable
              employees={filteredEmployees}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
              routerNav={routerNav}
              slug={slug}
              currentUserId={currentUserId}
              handleToggleStatus={handleToggleStatus}
              handleDelete={handleDelete}
              deleting={deleting}
            />
          )}
        </Card>

        {/* Pagination */}
        {!(searchQuery || hasActiveFilters) && totalCount > 20 && (
          <EmployeesPagination
            currentPage={currentPage}
            totalCount={totalCount}
            handlePageChange={handlePageChange}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            loading={loading}
          />
        )}

        {/* Delete Employee Dialog */}
        <DeleteConfirmation
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setEmployeeToDelete(null);
          }}
          itemName={employeeToDelete?.full_name}
          onConfirm={handleConfirmDelete}
          loading={!!(employeeToDelete && deleting === employeeToDelete.id)}
        />

        {/* Keyboard Hint */}
        <KeyboardHint />
      </div>
    </Can>
  );
}