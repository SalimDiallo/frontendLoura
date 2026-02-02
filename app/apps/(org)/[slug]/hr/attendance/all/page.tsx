"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
} from "react-icons/hi2";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, Button, Card, Badge, Input } from "@/components/ui";
import { getAttendances, approveAttendance } from "@/lib/services/hr";
import type { Attendance } from "@/lib/types/hr";
import { usePermissions } from "@/lib/hooks";
import { Can } from "@/components/apps/common/protected-route";
import { formatDate, formatDuration, formatTime } from "@/lib/utils";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import {
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Filter,
  RotateCcw,
  User,
  Calendar,
  Clock,
  Search,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
type DateRangeFilter = {
  from: string; // "YYYY-MM-DD"
  to: string;
};

type StatusKey = "all" | "pending" | "approved" | "rejected";

type Filters = {
  status: StatusKey;
  search: string;
  dateRange: DateRangeFilter;
};

// ─── Grouped data shape ─────────────────────────────────────────────────────
type EmployeeGroup = {
  employeeId: string;
  fullName: string;
  email: string;
  attendances: Attendance[];
  totalHours: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function getDefaultDateRange(): DateRangeFilter {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function isDateInRange(dateStr: string, range: DateRangeFilter): boolean {
  if (!range.from && !range.to) return true;
  const d = dateStr.slice(0, 10); // take only YYYY-MM-DD
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}

/**
 * Returns a safe number from input, guaranteeing a finite number (0 if NaN/falsy/undefined/null)
 */
function safeNumber(val: unknown): number {
  const n = Number(val);
  return isNaN(n) || !isFinite(n) ? 0 : n;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Small status pill used in the group header summary */
function MiniPill({
  count,
  variant,
  label,
}: {
  count: number;
  variant: "pending" | "approved" | "rejected";
  label: string;
}) {
  if (count === 0) return null;
  const colors: Record<string, string> = {
    pending:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    approved:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors[variant]}`}
    >
      {variant === "pending" && <Clock className="size-3" />}
      {variant === "approved" && <Check className="size-3" />}
      {variant === "rejected" && <X className="size-3" />}
      {label} {count}
    </span>
  );
}

/** Single attendance row inside an expanded group */
function AttendanceRow({
  attendance,
  isSelected,
  onToggle,
  onApprove,
  onRejectOpen,
  isProcessing,
  canApprovePermission,
}: {
  attendance: Attendance;
  isSelected: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onRejectOpen: () => void;
  isProcessing: boolean;
  canApprovePermission: boolean;
}) {
  const isPending = attendance.approval_status === "pending";
  const isApproved = attendance.approval_status === "approved";

  return (
    <TableRow
      className={`transition-colors duration-150 ${
        isSelected ? "bg-blue-50 dark:bg-blue-950/60" : ""
      }`}
    >
      {/* Checkbox */}
      <TableCell className="w-10 pl-8">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          disabled={!canApprovePermission || isApproved}
          className="rounded accent-blue-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        />
      </TableCell>

      {/* Date */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatDate(attendance.date)}
        </span>
      </TableCell>

      {/* Check-in */}
      <TableCell>
        <span className="text-sm font-medium">{formatTime(attendance.check_in)}</span>
      </TableCell>

      {/* Check-out */}
      <TableCell>
        <span className="text-sm font-medium">
          {attendance.check_out ? formatTime(attendance.check_out) : "—"}
        </span>
      </TableCell>

      {/* Break */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatDuration(safeNumber(attendance.break_duration))}
        </span>
      </TableCell>

      {/* Total hours */}
      <TableCell>
        <span className="text-sm font-semibold">
          {formatDuration(safeNumber(attendance.total_hours))}
        </span>
      </TableCell>

      {/* Status badge */}
      <TableCell>
        <Badge
          variant={
            isApproved ? "success" : attendance.approval_status === "rejected" ? "error" : "warning"
          }
        >
          {isApproved && "✓ Approuvé"}
          {attendance.approval_status === "rejected" && "✗ Rejeté"}
          {isPending && "⏳ En attente"}
        </Badge>
        {attendance.approval_status === "rejected" && attendance.rejection_reason && (
          <p className="text-xs text-red-500 mt-1 leading-tight">
            {attendance.rejection_reason}
          </p>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        {isPending && canApprovePermission ? (
          <div className="flex gap-1.5 justify-end">
            <button
              onClick={onApprove}
              disabled={isProcessing}
              aria-label="Approuver"
              className="inline-flex items-center justify-center size-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="size-4" />
            </button>
            <button
              onClick={onRejectOpen}
              disabled={isProcessing}
              aria-label="Rejeter"
              className="inline-flex items-center justify-center size-8 rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : !canApprovePermission ? (
          <span className="text-xs text-muted-foreground italic">—</span>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function AttendanceApprovalsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { user, hasPermission, isAdmin, loading: permLoading } = usePermissions();

  // ── raw data ──
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── filters ──
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    search: "",
    dateRange: getDefaultDateRange(),
  });
  const [showFilters, setShowFilters] = useState(false);

  // ── selection & processing ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // ── reject dialog ──
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // ── collapsed groups ──
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // ── Permission guard ──
  useEffect(() => {
    if (
      !permLoading &&
      !isAdmin &&
      !hasPermission(COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE)
    ) {
      router.push(`/apps/${slug}/hr/attendance`);
    }
  }, [permLoading, isAdmin, hasPermission, router, slug]);

  // ── Initial load ──
  useEffect(() => {
    if (
      !permLoading &&
      (isAdmin || hasPermission(COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE))
    ) {
      loadAttendances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, permLoading, isAdmin]);

  const myUserId = user?.id;
  const canApprovePermission = hasPermission(COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE);

  // ── Filtered & Grouped data ──
  const groups: EmployeeGroup[] = useMemo(() => {
    let filtered = attendances;

    // Exclude own records
    if (myUserId) {
      filtered = filtered.filter((att) => att.employee !== myUserId);
    }

    // Status filter
    if (filters.status !== "all") {
      // Only filter for strict approval_status keys, not "all"
      filtered = filtered.filter(
        (att) => att.approval_status === filters.status
      );
    }

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (att) =>
          att.user_full_name.toLowerCase().includes(q) ||
          att.user_email.toLowerCase().includes(q) ||
          att.employee_name?.toLowerCase().includes(q)
      );
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter((att) =>
        isDateInRange(att.date, filters.dateRange)
      );
    }

    // Group by employee
    const map = new Map<string, EmployeeGroup>();
    for (const att of filtered) {
      const key = att.employee || "";
      if (!key) continue; // skip undefined/null employees

      if (!map.has(key)) {
        map.set(key, {
          employeeId: key,
          fullName: att.user_full_name,
          email: att.user_email,
          attendances: [],
          totalHours: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
        });
      }
      const group = map.get(key)!;
      group.attendances.push(att);
      // Correction: always use safeNumber to avoid NaN
      group.totalHours += safeNumber(att.total_hours);
      if (att.approval_status === "pending") group.pendingCount++;
      if (att.approval_status === "approved") group.approvedCount++;
      if (att.approval_status === "rejected") group.rejectedCount++;
    }

    // Sort groups: those with pending first, then alphabetically
    return Array.from(map.values()).sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [attendances, myUserId, filters]);

  // ── Counts for filter pills (before grouping, after excluding self) ──
  const counts = useMemo(() => {
    const base = myUserId
      ? attendances.filter((a) => a.employee !== myUserId)
      : attendances;
    return {
      all: base.length,
      pending: base.filter((a) => a.approval_status === "pending").length,
      approved: base.filter((a) => a.approval_status === "approved").length,
      rejected: base.filter((a) => a.approval_status === "rejected").length,
    };
  }, [attendances, myUserId]);

  // ── API ──
  const loadAttendances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAttendances(slug, { page: 1, page_size: 100 });
      setAttendances(data.results);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = useCallback(async (id: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(id));
      setError(null);
      await approveAttendance(id, { action: "approve" }, slug);
      await loadAttendances();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      setError(err.error || err.message || "Erreur lors de l'approbation");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleReject = useCallback(async (id: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(id));
      setError(null);
      await approveAttendance(
        id,
        { action: "reject", rejection_reason: rejectionReason },
        slug
      );
      await loadAttendances();
      setShowRejectDialog(null);
      setRejectionReason("");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      setError(err.error || err.message || "Erreur lors du rejet");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, rejectionReason]);

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => handleApprove(id)));
  };

  // ── Selection helpers ──
  const toggleSelection = (id: string) => {
    const att = attendances.find((a) => a.id === id);
    if (!att || att.approval_status === "approved") return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /** Toggle all *selectable* (non-approved) items within a specific group */
  const toggleGroupSelection = (group: EmployeeGroup) => {
    const selectable = group.attendances.filter(
      (att) => att.approval_status !== "approved"
    );
    const allSelected = selectable.every((att) => selectedIds.has(att.id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const att of selectable) {
        allSelected ? next.delete(att.id) : next.add(att.id);
      }
      return next;
    });
  };

  /** Toggle all selectable items across all groups */
  const toggleSelectAll = () => {
    const allSelectable = groups.flatMap((g) =>
      g.attendances.filter((att) => att.approval_status !== "approved")
    );
    const allSelected = allSelectable.every((att) => selectedIds.has(att.id));
    setSelectedIds(
      allSelected ? new Set() : new Set(allSelectable.map((a) => a.id))
    );
  };

  const toggleGroup = (employeeId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(employeeId) ? next.delete(employeeId) : next.add(employeeId);
      return next;
    });
  };

  // ── Quick-approve all pending in a group ──
  const approveGroupPending = async (group: EmployeeGroup) => {
    const pendingIds = group.attendances
      .filter((att) => att.approval_status === "pending")
      .map((att) => att.id);
    await Promise.all(pendingIds.map((id) => handleApprove(id)));
  };

  // ── Filter reset ──
  const hasActiveFilters =
    filters.status !== "all" ||
    filters.search !== "" ||
    filters.dateRange.from !== getDefaultDateRange().from ||
    filters.dateRange.to !== getDefaultDateRange().to;

  const resetFilters = () => {
    setFilters({
      status: "all",
      search: "",
      dateRange: getDefaultDateRange(),
    });
  };

  // ── Loading skeleton ──
  if (loading || permLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-muted rounded w-56"></div>
        <div className="h-12 bg-muted rounded"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-12 bg-muted rounded-lg"></div>
            <div className="h-40 bg-muted rounded-lg ml-4"></div>
          </div>
        ))}
      </div>
    );
  }

  // ── Render ──
  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE}>
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineClock className="size-6" />
              Validation des Pointages
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {groups.length} employé{groups.length !== 1 ? "s" : ""} ·{" "}
              {counts.pending > 0 && (
                <span className="text-amber-600 font-medium">
                  {counts.pending} en attente
                </span>
              )}
              {counts.pending === 0 && "Tout est à jour ✓"}
            </p>
          </div>
          <button
            onClick={loadAttendances}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Rafraîchir"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        {/* ── Status pills + search row ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé…"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="pl-9"
            />
          </div>

          {/* Status pills */}
          <div className="flex gap-1.5 flex-wrap">
            {(
              [
                { key: "all", label: "Tous", count: counts.all },
                { key: "pending", label: "En attente", count: counts.pending },
                { key: "approved", label: "Approuvés", count: counts.approved },
                { key: "rejected", label: "Rejetés", count: counts.rejected },
              ] as const
            ).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilters((f) => ({ ...f, status: key }))}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filters.status === key
                    ? "bg-foreground text-background border-foreground"
                    : "border-muted text-muted-foreground hover:border-foreground hover:text-foreground bg-background"
                }`}
              >
                {label}
                <span className="ml-1.5 opacity-60">({count})</span>
              </button>
            ))}
          </div>

          {/* Date filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-300 text-primary dark:bg-blue-950 dark:border-primary dark:text-primary"
                : "border-muted text-muted-foreground hover:border-foreground"
            }`}
          >
            <Filter className="size-3" />
            Filtres
            {hasActiveFilters && (
              <span className="inline-block size-1.5 rounded-full bg-primary"></span>
            )}
          </button>
        </div>

        {/* ── Expanded filters panel ── */}
        {showFilters && (
          <Card className="p-4 border border-muted/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filtres avancés
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="size-3" /> Du
                </label>
                <input
                  type="date"
                  value={filters.dateRange.from}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      dateRange: { ...f.dateRange, from: e.target.value },
                    }))
                  }
                  className="w-full text-sm border border-muted rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="size-3" /> Jusqu'à
                </label>
                <input
                  type="date"
                  value={filters.dateRange.to}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      dateRange: { ...f.dateRange, to: e.target.value },
                    }))
                  }
                  className="w-full text-sm border border-muted rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </Card>
        )}

        {/* ── Bulk action bar ── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5 sticky top-0 z-10">
            <span className="text-sm font-medium text-primary dark:text-primary">
              {selectedIds.size} pointage{selectedIds.size !== 1 ? "s" : ""}{" "}
              sélectionné{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE}>
                <Button onClick={handleBulkApprove} size="sm">
                  <HiOutlineCheckCircle className="size-4 mr-1.5" />
                  Approuver tout
                </Button>
              </Can>
              <Button
                onClick={() => setSelectedIds(new Set())}
                size="sm"
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

{groups.length > 0 && canApprovePermission && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <input
              type="checkbox"
              checked={
                groups
                  .flatMap((g) =>
                    g.attendances.filter(
                      (a) => a.approval_status !== "approved"
                    )
                  )
                  .length > 0 &&
                groups
                  .flatMap((g) =>
                    g.attendances.filter(
                      (a) => a.approval_status !== "approved"
                    )
                  )
                  .every((a) => selectedIds.has(a.id))
              }
              onChange={toggleSelectAll}
              className="rounded accent-primary cursor-pointer"
            />
            <span>Sélectionner tous les pointages en attente</span>
          </div>
        )}

        {/* ── Groups ── */}
        {groups.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="text-muted-foreground">
              Aucun pointage ne correspond à vos filtres.
            </p>
          </Card>
        ) : (
          
          <div className="space-y-3">
            {groups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.employeeId);
              const selectableInGroup = group.attendances.filter(
                (att) => att.approval_status !== "approved"
              );
              const allGroupSelected =
                selectableInGroup.length > 0 &&
                selectableInGroup.every((att) => selectedIds.has(att.id));

              return (
                <Card key={group.employeeId} className="border border-muted/40 overflow-hidden">
                  {/* Group header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => toggleGroup(group.employeeId)}
                  >
                    {/* Chevron */}
                    {isCollapsed ? (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}

                    {/* Avatar placeholder */}
                    <div className="size-8 rounded-full bg-linear-to-br from-primary to-primary flex items-center justify-center shrink-0">
                      <User className="size-4 text-white" />
                    </div>

                    {/* Name & email */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {group.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {group.email}
                      </p>
                    </div>

                    {/* Stat pills */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <MiniPill
                        count={group.pendingCount}
                        variant="pending"
                        label="En attente"
                      />
                      <MiniPill
                        count={group.approvedCount}
                        variant="approved"
                        label="Approuvé"
                      />
                      <MiniPill
                        count={group.rejectedCount}
                        variant="rejected"
                        label="Rejeté"
                      />
                    </div>

                    {/* Total hours */}
                    <div className="text-right min-w-[56px]">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-sm font-semibold">
                        {formatDuration(safeNumber(group.totalHours))}
                      </p>
                    </div>

                    {/* Quick approve all pending (only if pending > 0 and permission) */}
                    {group.pendingCount > 0 && canApprovePermission && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          approveGroupPending(group);
                        }}
                        className="ml-2 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900 px-2.5 py-1 rounded-md transition-colors shrink-0"
                      >
                        Tout approuver
                      </button>
                    )}
                  </div>

                  {/* Expanded rows */}
                  {!isCollapsed && (
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="w-10 pl-8">
                            <input
                              type="checkbox"
                              checked={allGroupSelected}
                              onChange={() => toggleGroupSelection(group)}
                              disabled={selectableInGroup.length === 0}
                              className="rounded accent-primary cursor-pointer disabled:opacity-30"
                            />
                          </TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Arrivée</TableHead>
                          <TableHead>Départ</TableHead>
                          <TableHead>Pause</TableHead>
                          <TableHead>Heures</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.attendances.map((att) => (
                          <AttendanceRow
                            key={att.id}
                            attendance={att}
                            isSelected={selectedIds.has(att.id)}
                            onToggle={() => toggleSelection(att.id)}
                            onApprove={() => handleApprove(att.id)}
                            onRejectOpen={() => setShowRejectDialog(att.id)}
                            isProcessing={processingIds.has(att.id)}
                            canApprovePermission={canApprovePermission}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Global select-all bar (only when groups are visible) ── */}
        {groups.length > 0 && canApprovePermission && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <input
              type="checkbox"
              checked={
                groups
                  .flatMap((g) =>
                    g.attendances.filter(
                      (a) => a.approval_status !== "approved"
                    )
                  )
                  .length > 0 &&
                groups
                  .flatMap((g) =>
                    g.attendances.filter(
                      (a) => a.approval_status !== "approved"
                    )
                  )
                  .every((a) => selectedIds.has(a.id))
              }
              onChange={toggleSelectAll}
              className="rounded accent-primary cursor-pointer"
            />
            <span>Sélectionner tous les pointages en attente</span>
          </div>
        )}

        {/* ── Reject dialog ── */}
        {showRejectDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-1">
                Rejeter le pointage
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Vous pouvez optionnellement indiquer une raison.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-muted rounded-md p-3 min-h-[100px] text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Expliquez pourquoi ce pointage est rejeté…"
                autoFocus
              />
              <div className="flex gap-2 justify-end mt-4">
                <Button
                  onClick={() => {
                    setShowRejectDialog(null);
                    setRejectionReason("");
                  }}
                  variant="outline"
                  size="sm"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => handleReject(showRejectDialog)}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirmer le rejet
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Can>
  );
}