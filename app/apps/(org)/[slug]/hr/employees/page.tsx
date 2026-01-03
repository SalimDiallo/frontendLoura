"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmploymentStatusBadge } from "@/components/hr";
import { getEmployees, deleteEmployee, activateEmployee, deactivateEmployee } from "@/lib/services/hr";
import type { EmployeeListItem } from "@/lib/types/hr";
import {
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineEllipsisVertical,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUserCircle,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBriefcase,
  HiOutlineShieldCheck,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";
import { LuUsers, LuCalendarOff, LuPause, LuBan } from "react-icons/lu";
import { Alert, Button, Card, Input } from "@/components/ui";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/shared";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";
import { SmartFilters, FilterConfig } from "@/components/ui/smart-filters";

// ============================================
// Types & Constants
// ============================================

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "active", label: "Actifs", icon: <HiOutlineCheckCircle className="size-4 text-green-500" /> },
  { value: "on_leave", label: "En congé", icon: <LuCalendarOff className="size-4 text-blue-500" /> },
  { value: "suspended", label: "Suspendus", icon: <LuPause className="size-4 text-orange-500" /> },
  { value: "terminated", label: "Terminés", icon: <LuBan className="size-4 text-red-500" /> },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" },
];

function uniqueNonEmpty<T>(items: (T | undefined | null)[]): T[] {
  return [...new Set(items.filter((item): item is T => !!item))];
}

// ============================================
// Main Component
// ============================================

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
        icon: <LuUsers className="size-4" />,
        options: statusCounts,
      },
      {
        key: "department",
        label: "Département",
        icon: <HiOutlineBriefcase className="size-4" />,
        options: departments.map((d) => ({
          value: d,
          label: d,
          count: employees.filter((e) => e.department_name === d).length,
        })),
      },
      {
        key: "position",
        label: "Poste",
        icon: <HiOutlineIdentification className="size-4" />,
        options: positions.map((p) => ({
          value: p,
          label: p,
          count: employees.filter((e) => e.position_title === p).length,
        })),
      },
      {
        key: "role",
        label: "Rôle",
        icon: <HiOutlineShieldCheck className="size-4" />,
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

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return;
    try {
      setDeleting(id);
      await deleteEmployee(id);
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

  const stats = useMemo(() => ({
    total: totalCount,
    active: employees.filter((e) => e.employment_status === "active").length,
    onLeave: employees.filter((e) => e.employment_status === "on_leave").length,
    inactive: employees.filter(
      (e) => e.employment_status === "suspended" || e.employment_status === "terminated"
    ).length,
  }), [totalCount, employees]);

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES} showMessage={true}>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </Can>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES} showMessage={true}>
      <div className="space-y-6">
        {/* Shortcuts Modal */}
        <ShortcutsHelpModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          shortcuts={shortcuts}
          title="Raccourcis clavier - Employés"
        />

        {error && <Alert variant="error">{error}</Alert>}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineUserCircle className="size-7" />
              Employés
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez tous vos employés et leurs informations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              aria-label="Afficher les raccourcis clavier"
              title="Raccourcis clavier (?)"
            >
              <HiOutlineQuestionMarkCircle className="size-4" />
            </Button>
            <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
              <Button asChild>
                <Link href={`/apps/${slug}/hr/employees/create`}>
                  <HiOutlinePlusCircle className="size-4 mr-2" />
                  Nouvel employé
                  <ShortcutBadge shortcut={shortcuts.find((s) => s.key === "n")!} />
                </Link>
              </Button>
            </Can>
          </div>
        </div>

        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card 
            className={cn(
              "p-4 border-0 shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/20",
              !filters.status && "ring-2 ring-primary/30"
            )}
            onClick={() => handleFilterChange("status", "")}
          >
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-xl font-bold mt-0.5">{stats.total}</div>
          </Card>
          <Card 
            className={cn(
              "p-4 border-0 shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-green-500/20",
              filters.status === "active" && "ring-2 ring-green-500/50"
            )}
            onClick={() => handleFilterChange("status", filters.status === "active" ? "" : "active")}
          >
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <HiOutlineCheckCircle className="size-3 text-green-500" />
              Actifs
            </div>
            <div className="text-xl font-bold mt-0.5 text-green-600 dark:text-green-400">
              {stats.active}
            </div>
          </Card>
          <Card 
            className={cn(
              "p-4 border-0 shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/20",
              filters.status === "on_leave" && "ring-2 ring-blue-500/50"
            )}
            onClick={() => handleFilterChange("status", filters.status === "on_leave" ? "" : "on_leave")}
          >
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <LuCalendarOff className="size-3 text-blue-500" />
              En congé
            </div>
            <div className="text-xl font-bold mt-0.5 text-blue-600 dark:text-blue-400">
              {stats.onLeave}
            </div>
          </Card>
          <Card 
            className={cn(
              "p-4 border-0 shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-orange-500/20",
              (filters.status === "suspended" || filters.status === "terminated") && "ring-2 ring-orange-500/50"
            )}
            onClick={() => handleFilterChange("status", filters.status === "suspended" ? "" : "suspended")}
          >
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <LuPause className="size-3 text-orange-500" />
              Inactifs
            </div>
            <div className="text-xl font-bold mt-0.5 text-orange-600 dark:text-orange-400">
              {stats.inactive}
            </div>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="p-4 border-0 shadow-sm">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
            <div className="relative flex-1 w-full">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par nom, email ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-16"
                aria-label="Rechercher des employés"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Smart Filters */}
          <SmartFilters
            filters={filterConfigs}
            values={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            quickFilterKey="status"
          />
        </Card>

        {/* Employees Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <HiOutlineUserCircle className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Aucun employé trouvé</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || hasActiveFilters
                      ? "Aucun résultat pour ces critères"
                      : "Commencez par ajouter votre premier employé"}
                  </p>
                </div>
                {!(searchQuery || hasActiveFilters) && (
                  <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
                    <Button asChild>
                      <Link href={`/apps/${slug}/hr/employees/create`}>
                        <HiOutlinePlusCircle className="size-4 mr-2" />
                        Ajouter un employé
                      </Link>
                    </Button>
                  </Can>
                )}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead className="hidden md:table-cell">Matricule</TableHead>
                  <TableHead className="hidden lg:table-cell">Département</TableHead>
                  <TableHead className="hidden lg:table-cell">Poste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee, index) => (
                  <TableRow
                    key={employee.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedIndex === index && "bg-primary/10 ring-1 ring-primary"
                    )}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => routerNav.push(`/apps/${slug}/hr/employees/${employee.id}`)}
                    tabIndex={0}
                    role="row"
                    aria-selected={selectedIndex === index}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                          {employee.full_name
                            ? employee.full_name
                                .split(" ")
                                .filter((n) => n)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            : "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{employee.full_name || "Sans nom"}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <HiOutlineEnvelope className="size-3 shrink-0" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <HiOutlineIdentification className="size-4 text-muted-foreground" />
                        {employee.employee_id || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm">{employee.department_name || "-"}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{employee.position_title || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <EmploymentStatusBadge status={employee.employment_status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={deleting === employee.id}>
                            <HiOutlineEllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Can permission={COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES}>
                            <DropdownMenuItem asChild>
                              <Link href={`/apps/${slug}/hr/employees/${employee.id}`}>
                                <HiOutlineEye className="size-4 mr-2" />
                                Voir le profil
                              </Link>
                            </DropdownMenuItem>
                          </Can>
                          <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
                            <DropdownMenuItem asChild>
                              <Link href={`/apps/${slug}/hr/employees/${employee.id}/edit`}>
                                <HiOutlinePencil className="size-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                          </Can>
                          <Can permission={COMMON_PERMISSIONS.HR.UPDATE_EMPLOYEES}>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(employee.id, employee.is_active)}
                            >
                              {employee.is_active ? (
                                <>
                                  <HiOutlineXCircle className="size-4 mr-2" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <HiOutlineCheckCircle className="size-4 mr-2" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                          </Can>
                          <Can permission={COMMON_PERMISSIONS.HR.DELETE_EMPLOYEES}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(employee.id)}
                            >
                              <HiOutlineTrash className="size-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </Can>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Pagination */}
        {!(searchQuery || hasActiveFilters) && totalCount > 20 && (
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {Math.ceil(totalCount / 20)} • {totalCount} employés
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevious || loading}
                >
                  <HiOutlineChevronLeft className="size-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNext || loading}
                >
                  Suivant
                  <HiOutlineChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Keyboard Hint */}
        <KeyboardHint />
      </div>
    </Can>
  );
}
