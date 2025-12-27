"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  HiOutlineAdjustmentsHorizontal,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { Alert, Button, Card, Input, Badge } from "@/components/ui";
import { ProtectedRoute, Can } from "@/components/apps/common";
import { HR_ROUTE_PERMISSIONS } from "@/lib/config/route-permissions";
import { ResourceType, PermissionAction, COMMON_PERMISSIONS } from "@/lib/types/shared";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, KeyboardShortcut, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { ShortcutsHelpModal, ShortcutBadge, KeyboardHint } from "@/components/ui/shortcuts-help";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi2";

// Filter helper utils
function uniqueNonEmpty<T>(items: (T | undefined | null)[]): T[] {
  return [...new Set(items.filter((item): item is T => !!item))];
}
const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "active", label: "Actifs" },
  { value: "on_leave", label: "En congé" },
  { value: "suspended", label: "Suspendus" },
  { value: "terminated", label: "Terminés" },
];
const GENDER_OPTIONS = [
  { value: "", label: "Tous les genres" },
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" },
];

const THEME_INPUT_STYLE =
  "rounded-md border px-3 py-1.5 block text-sm transition bg-background text-foreground dark:bg-gray-900 dark:text-gray-100 border-input dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30";

// Replace the FilterDrawer with a modern filter component
function FilterInline({
  filterStatus,
  filterDepartment,
  filterPosition,
  filterRole,
  filterGender,
  filterActive,
  onChangeStatus,
  onChangeDepartment,
  onChangePosition,
  onChangeRole,
  onChangeGender,
  onChangeActive,
  departmentOptions,
  positionOptions,
  roleOptions,
  hasActiveFilters,
  onReset,
}: {
  filterStatus: string;
  filterDepartment: string;
  filterPosition: string;
  filterRole: string;
  filterGender: string;
  filterActive: string;
  onChangeStatus: (v: string) => void;
  onChangeDepartment: (v: string) => void;
  onChangePosition: (v: string) => void;
  onChangeRole: (v: string) => void;
  onChangeGender: (v: string) => void;
  onChangeActive: (v: string) => void;
  departmentOptions: { value: string; label: string }[];
  positionOptions: { value: string; label: string }[];
  roleOptions: { value: string; label: string }[];
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="w-full py-4 space-y-4">
      {/* Quick status pills */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground mr-2 flex items-center">Statut rapide:</span>
        {EMPLOYMENT_STATUS_OPTIONS.slice(1).map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChangeStatus(filterStatus === opt.value ? "" : opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              filterStatus === opt.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main filters grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <HiOutlineBriefcase className="size-3" />
            Département
          </label>
          <select
            className={cn(THEME_INPUT_STYLE, "w-full", filterDepartment && "ring-2 ring-primary/30")}
            value={filterDepartment}
            onChange={e => onChangeDepartment(e.target.value)}
          >
            {departmentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <HiOutlineIdentification className="size-3" />
            Poste
          </label>
          <select
            className={cn(THEME_INPUT_STYLE, "w-full", filterPosition && "ring-2 ring-primary/30")}
            value={filterPosition}
            onChange={e => onChangePosition(e.target.value)}
          >
            {positionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <HiOutlineUserCircle className="size-3" />
            Rôle
          </label>
          <select
            className={cn(THEME_INPUT_STYLE, "w-full", filterRole && "ring-2 ring-primary/30")}
            value={filterRole}
            onChange={e => onChangeRole(e.target.value)}
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Statut</label>
          <select
            className={cn(THEME_INPUT_STYLE, "w-full", filterStatus && "ring-2 ring-primary/30")}
            value={filterStatus}
            onChange={e => onChangeStatus(e.target.value)}
          >
            {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Genre</label>
          <select
            className={cn(THEME_INPUT_STYLE, "w-full", filterGender && "ring-2 ring-primary/30")}
            value={filterGender}
            onChange={e => onChangeGender(e.target.value)}
          >
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Compte actif</label>
          <select
            className={cn(THEME_INPUT_STYLE, "w-full", filterActive && "ring-2 ring-primary/30")}
            value={filterActive}
            onChange={e => onChangeActive(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="yes">Actifs</option>
            <option value="no">Inactifs</option>
          </select>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground hover:text-foreground">
            <HiOutlineXMark className="size-4 mr-1" />
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  );
}

// Add missing icon import at line 32
import { HiOutlineBriefcase } from "react-icons/hi2";

export default function EmployeesPage() {
  const params = useParams();
  const routerNav = useRouter();
  const slug = params.slug as string;

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // More relevant filters for UX
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterGender, setFilterGender] = useState<string>("");
  const [filterActive, setFilterActive] = useState<string>("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // No side bar: no showFilters
  // const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentPage]);

  // Get filtering options
  const departmentOptions = useMemo(
    () => [
      { value: "", label: "Tous les départements" },
      ...uniqueNonEmpty(employees.map((e) => e.department_name)).map((dep) => ({
        value: dep,
        label: dep,
      })),
    ],
    [employees]
  );
  const roleOptions = useMemo(
    () => [
      { value: "", label: "Tous les rôles" },
      ...uniqueNonEmpty(employees.map((e) => e.role_name)).map((role) => ({
        value: role,
        label: role,
      })),
    ],
    [employees]
  );
  
  const positionOptions = useMemo(
    () => [
      { value: "", label: "Tous les postes" },
      ...uniqueNonEmpty(employees.map((e) => e.position_title)).map((pos) => ({
        value: pos,
        label: pos,
      })),
    ],
    [employees]
  );

  const loadEmployees = async () => {
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
  };

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
      setDeleting(id); // Réutiliser deleting pour désactiver le menu
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

  const hasActiveFilters =
    !!filterStatus ||
    !!filterDepartment ||
    !!filterPosition ||
    !!filterRole ||
    !!filterGender ||
    !!filterActive;

  // UX: Filtering logic includes search + all filters
  const filteredEmployees = employees.filter((emp) => {
    // Search
    const query = searchQuery.toLowerCase();
    if (query) {
      const searchString = `${emp.full_name || ""} ${emp.email || ""} ${emp.employee_id || ""}`
        .toLowerCase();
      if (!searchString.includes(query)) return false;
    }
    // Statut
    if (filterStatus && emp.employment_status !== filterStatus) return false;
    // Département
    if (filterDepartment && emp.department_name !== filterDepartment) return false;
    // Poste
    if (filterPosition && emp.position_title !== filterPosition) return false;
    // Rôle
    if (filterRole && emp.role_name !== filterRole) return false;
    // Genre (optional in emp)
    if (
      filterGender &&
      (emp.gender !== filterGender &&
        // Support old data: if no gender, exclude ONLY if filtering by gender
        (emp.gender !== undefined && emp.gender !== null))
    )
      return false;
    // Actif/Inactif
    if (filterActive === "yes") {
      if (emp.employment_status !== "active") return false;
    } else if (filterActive === "no") {
      if (emp.employment_status === "active") return false;
    }
    return true;
  });

  // Reset filters
  const handleResetFilters = () => {
    setFilterStatus("");
    setFilterDepartment("");
    setFilterPosition("");
    setFilterRole("");
    setFilterGender("");
    setFilterActive("");
  };

  // Activer/Désactiver l'employé sélectionné
  const handleToggleSelectedEmployee = () => {
    if (selectedIndex >= 0 && filteredEmployees[selectedIndex]) {
      const emp = filteredEmployees[selectedIndex];
      handleToggleStatus(emp.id, emp.is_active);
    }
  };

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    // Navigation de base
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

    // Navigation dans la liste
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

    // Actions sur l'employé sélectionné
    { key: "e", action: () => {
      if (selectedIndex >= 0 && filteredEmployees[selectedIndex]) {
        routerNav.push(`/apps/${slug}/hr/employees/${filteredEmployees[selectedIndex].id}/edit`);
      }
    }, description: "Éditer l'employé sélectionné" },
    { key: "a", action: handleToggleSelectedEmployee, description: "Activer/désactiver l'employé" },
    { key: "p", action: () => {
      if (selectedIndex >= 0 && filteredEmployees[selectedIndex]) {
        routerNav.push(`/apps/${slug}/hr/employees/${filteredEmployees[selectedIndex].id}/payroll`);
      }
    }, description: "Voir la paie de l'employé" },

    // Filtres de statut (1-4)
    commonShortcuts.filter("1", () => setFilterStatus(filterStatus === "active" ? "" : "active"), "Filtrer: Actifs"),
    commonShortcuts.filter("2", () => setFilterStatus(filterStatus === "on_leave" ? "" : "on_leave"), "Filtrer: En congé"),
    commonShortcuts.filter("3", () => setFilterStatus(filterStatus === "suspended" ? "" : "suspended"), "Filtrer: Suspendus"),
    commonShortcuts.filter("4", () => setFilterStatus(filterStatus === "terminated" ? "" : "terminated"), "Filtrer: Terminés"),

    // Réinitialisation et pagination
    { key: "r", action: () => {
      handleResetFilters();
      setSearchQuery("");
    }, description: "Réinitialiser tous les filtres" },
    { key: ",", action: () => {
      if (hasPrevious) handlePageChange(currentPage - 1);
    }, description: "Page précédente" },
    { key: ".", action: () => {
      if (hasNext) handlePageChange(currentPage + 1);
    }, description: "Page suivante" },
  ], [slug, routerNav, showShortcuts, selectedIndex, filteredEmployees, filterStatus, hasPrevious, hasNext, currentPage]);

  useKeyboardShortcuts({ shortcuts });

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
        {/* Modal des raccourcis */}
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
                  <ShortcutBadge shortcut={shortcuts.find(s => s.key === "n")!} />
                </Link>
              </Button>
            </Can>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-0 shadow-sm bg-background dark:bg-gray-900">
            <div className="text-sm text-muted-foreground">Total employés</div>
            <div className="text-2xl font-bold mt-1">{totalCount}</div>
          </Card>
          <Card className="p-4 border-0 shadow-sm bg-background dark:bg-gray-900">
            <div className="text-sm text-muted-foreground">Actifs</div>
            <div className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              {employees.filter((e) => e.employment_status === "active").length}
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm bg-background dark:bg-gray-900">
            <div className="text-sm text-muted-foreground">En congé</div>
            <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
              {employees.filter((e) => e.employment_status === "on_leave").length}
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm bg-background dark:bg-gray-900">
            <div className="text-sm text-muted-foreground">Inactifs</div>
            <div className="text-2xl font-bold mt-1 text-orange-600 dark:text-yellow-300">
              {employees.filter(
                (e) =>
                  e.employment_status === "suspended" ||
                  e.employment_status === "terminated"
              ).length}
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 border-0 shadow-sm bg-background dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Input
                ref={searchInputRef}
                placeholder="Rechercher par nom, email ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-20 ${THEME_INPUT_STYLE}`}
                style={{ WebkitAppearance: 'none' }}
                aria-label="Rechercher des employés"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                Ctrl+K
              </kbd>
            </div>
          </div>
          {/* Inline filter form instead of side bar */}
          <FilterInline
            filterStatus={filterStatus}
            filterDepartment={filterDepartment}
            filterPosition={filterPosition}
            filterRole={filterRole}
            filterGender={filterGender}
            filterActive={filterActive}
            onChangeStatus={setFilterStatus}
            onChangeDepartment={setFilterDepartment}
            onChangePosition={setFilterPosition}
            onChangeRole={setFilterRole}
            onChangeGender={setFilterGender}
            onChangeActive={setFilterActive}
            departmentOptions={departmentOptions}
            positionOptions={positionOptions}
            roleOptions={roleOptions}
            hasActiveFilters={hasActiveFilters}
            onReset={handleResetFilters}
          />
          {/* Active filters summary (chips/badges) */}
          {(hasActiveFilters || searchQuery) && (
            <div className="flex flex-wrap mt-2 gap-3 items-center text-xs">
              {searchQuery && (
                <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-2 py-1">
                  <span className="hidden sm:inline">Recherche :</span> {searchQuery}
                  <button onClick={() => setSearchQuery("")} className="ml-1" aria-label="Effacer la recherche">
                    <HiOutlineXMark className="size-3 inline" />
                  </button>
                </Badge>
              )}
              {filterStatus && (
                <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-2 py-1">
                  {EMPLOYMENT_STATUS_OPTIONS.find(x=>x.value === filterStatus)?.label}
                  <button onClick={() => setFilterStatus("")} className="ml-1" aria-label="Supprimer filtre statut">
                    <HiOutlineXMark className="size-3 inline" />
                  </button>
                </Badge>
              )}
              {filterDepartment && (
                <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-2 py-1">
                  {filterDepartment}
                  <button onClick={() => setFilterDepartment("")} className="ml-1" aria-label="Supprimer filtre département">
                    <HiOutlineXMark className="size-3 inline" />
                  </button>
                </Badge>
              )}
              {filterPosition && (
                <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-2 py-1">
                  {filterPosition}
                  <button onClick={() => setFilterPosition("")} className="ml-1" aria-label="Supprimer filtre poste">
                    <HiOutlineXMark className="size-3 inline" />
                  </button>
                </Badge>
              )}
              {filterRole && (
                <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-2 py-1">
                  {filterRole}
                  <button onClick={() => setFilterRole("")} className="ml-1" aria-label="Supprimer filtre rôle">
                    <HiOutlineXMark className="size-3 inline" />
                  </button>
                </Badge>
              )}
              {filterGender && (
                <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-2 py-1">
                  {GENDER_OPTIONS.find(x=>x.value===filterGender)?.label}
                  <button onClick={() => setFilterGender("")} className="ml-1" aria-label="Supprimer filtre genre">
                    <HiOutlineXMark className="size-3 inline" />
                  </button>
                </Badge>
              )}
              {filterActive && (
                <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-2 py-1">
                  {filterActive === "yes" ? "Actifs" : "Inactifs"}
                  <button onClick={() => setFilterActive("")} className="ml-1" aria-label="Supprimer filtre actif/inactif">
                    <HiOutlineXMark className="size-3 inline" />
                  </button>
                </Badge>
              )}
              {(hasActiveFilters || searchQuery) && (
                <Button
                  size='sm'
                  variant="ghost"
                  onClick={() => {
                    handleResetFilters();
                    setSearchQuery("");
                  }}
                  className="pl-1 text-muted-foreground"
                >
                  <HiOutlineXMark className="size-4" /> Effacer tout
                  <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-xs">R</kbd>
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Employees Table */}
        <Card className="border-0 shadow-sm bg-background dark:bg-gray-900">
          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted dark:bg-gray-800">
                  <HiOutlineUserCircle className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Aucun employé</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(searchQuery || hasActiveFilters)
                      ? "Aucun résultat pour ces filtres"
                      : "Commencez par ajouter votre premier employé"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Appuyez sur <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-xs">N</kbd> pour ajouter un nouvel employé
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
                  <TableHead>Matricule</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Rôle</TableHead>
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
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm dark:bg-primary/20 dark:text-primary-200">
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
                        <div>
                          <div className="font-medium">{employee.full_name || "Sans nom"}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <HiOutlineEnvelope className="size-3" />
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <HiOutlineIdentification className="size-4 text-muted-foreground" />
                        {employee.employee_id || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{employee.department_name || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{employee.position_title || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{employee.role_name || "-"}</span>
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
          <Card className="p-4 border-0 shadow-sm bg-background dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {Math.ceil(totalCount / 20)} • {totalCount} employés au total
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
                  <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-xs">,</kbd>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNext || loading}
                >
                  Suivant
                  <HiOutlineChevronRight className="size-4 ml-1" />
                  <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-xs">.</kbd>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Hint */}
        <KeyboardHint />
      </div>
    </Can>
  );
}
