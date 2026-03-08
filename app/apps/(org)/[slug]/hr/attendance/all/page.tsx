"use client";

import { Can } from "@/components/apps/common/protected-route";
import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions } from "@/lib/hooks";
import { approveAttendance, getAttendances } from "@/lib/services/hr";
import type { Attendance } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { formatDate, formatDuration, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
type DateRangeFilter = {
  from: string;
  to: string;
};

type StatusKey = "all" | "pending" | "approved" | "rejected";

type Filters = {
  status: StatusKey;
  search: string;
  dateRange: DateRangeFilter;
};

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
  const d = dateStr.slice(0, 10);
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}

function safeNumber(val: unknown): number {
  const n = Number(val);
  return isNaN(n) || !isFinite(n) ? 0 : n;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusPill({ count, variant, label }: {
  count: number;
  variant: "pending" | "approved" | "rejected";
  label: string;
}) {
  if (count === 0) return null;
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    rejected: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full", styles[variant])}>
      {count} {label}
    </span>
  );
}

function AttendanceRow({
  attendance, isSelected, onToggle, onApprove, onRejectOpen, isProcessing, canApprovePermission,
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
    <TableRow className={cn("transition-colors", isSelected && "bg-muted/50")}>
      <TableCell className="w-10 pl-8">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          disabled={!canApprovePermission || isApproved}
          className="rounded accent-zinc-800 dark:accent-zinc-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        />
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{formatDate(attendance.date)}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium tabular-nums">{formatTime(attendance.check_in)}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium tabular-nums">
          {attendance.check_out ? formatTime(attendance.check_out) : "—"}
        </span>
      </TableCell>
      <TableCell>
        {attendance.breaks && attendance.breaks.length > 0 ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col gap-0.5 cursor-help">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {attendance.breaks.length} pause{attendance.breaks.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    {Math.round(attendance.total_break_minutes)} min
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium mb-2">Détail des pauses</div>
                  {attendance.breaks.map((breakItem, idx) => (
                    <div key={breakItem.id} className="text-xs flex items-center gap-2 py-1 border-b border-border/30 last:border-0">
                      <span className="font-medium text-muted-foreground">Pause {idx + 1}:</span>
                      <span>{formatTime(breakItem.start_time)}</span>
                      {breakItem.end_time && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span>{formatTime(breakItem.end_time)}</span>
                        </>
                      )}
                      <span className="text-muted-foreground ml-auto">
                        ({breakItem.duration_minutes} min)
                      </span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-sm text-muted-foreground tabular-nums">—</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm font-semibold tabular-nums">
          {formatDuration(safeNumber(attendance.total_hours))}
        </span>
      </TableCell>
      <TableCell>
        <Badge
          variant={isApproved ? "success" : attendance.approval_status === "rejected" ? "error" : "warning"}
          className="text-xs"
        >
          {isApproved && "Approuvé"}
          {attendance.approval_status === "rejected" && "Rejeté"}
          {isPending && "En attente"}
        </Badge>
        {attendance.approval_status === "rejected" && attendance.rejection_reason && (
          <p className="text-[11px] text-red-500 mt-0.5 leading-tight truncate max-w-[120px]">
            {attendance.rejection_reason}
          </p>
        )}
      </TableCell>
      <TableCell className="text-right">
        {isPending && canApprovePermission ? (
          <div className="flex gap-1 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
              disabled={isProcessing}
              aria-label="Approuver"
              className="inline-flex items-center justify-center size-7 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
            >
              <Check className="size-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRejectOpen();
              }}
              disabled={isProcessing}
              aria-label="Rejeter"
              className="inline-flex items-center justify-center size-7 rounded-md border border-zinc-300 dark:border-zinc-600 text-muted-foreground hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : !canApprovePermission ? (
          <span className="text-xs text-muted-foreground">—</span>
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

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    status: "all",
    search: "",
    dateRange: getDefaultDateRange(),
  });
  const [showFilters, setShowFilters] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState<string | null>(null);
  const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!permLoading && !isAdmin && !hasPermission(COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE)) {
      router.push(`/apps/${slug}/hr/attendance`);
    }
  }, [permLoading, isAdmin, hasPermission, router, slug]);

  useEffect(() => {
    if (!permLoading && (isAdmin || hasPermission(COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE))) {
      loadAttendances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, permLoading, isAdmin]);

  const myUserId = user?.id;
  const canApprovePermission = hasPermission(COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE);

  const groups: EmployeeGroup[] = useMemo(() => {
    let filtered = attendances;

    if (myUserId) {
      filtered = filtered.filter((att) => att.employee !== myUserId);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((att) => att.approval_status === filters.status);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (att) =>
          att.user_full_name.toLowerCase().includes(q) ||
          att.user_email.toLowerCase().includes(q) ||
          att.employee_name?.toLowerCase().includes(q)
      );
    }

    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter((att) => isDateInRange(att.date, filters.dateRange));
    }

    const map = new Map<string, EmployeeGroup>();
    for (const att of filtered) {
      const key = att.employee || "";
      if (!key) continue;

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
      group.totalHours += safeNumber(att.total_hours);
      if (att.approval_status === "pending") group.pendingCount++;
      if (att.approval_status === "approved") group.approvedCount++;
      if (att.approval_status === "rejected") group.rejectedCount++;
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [attendances, myUserId, filters]);

  const counts = useMemo(() => {
    const base = myUserId ? attendances.filter((a) => a.employee !== myUserId) : attendances;
    return {
      all: base.length,
      pending: base.filter((a) => a.approval_status === "pending").length,
      approved: base.filter((a) => a.approval_status === "approved").length,
      rejected: base.filter((a) => a.approval_status === "rejected").length,
    };
  }, [attendances, myUserId]);

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
      setShowApproveDialog(null);
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
      await approveAttendance(id, { action: "reject", rejection_reason: rejectionReason }, slug);
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
    setShowBulkApproveDialog(false);
  };

  const toggleSelection = (id: string) => {
    const att = attendances.find((a) => a.id === id);
    if (!att || att.approval_status === "approved") return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroupSelection = (group: EmployeeGroup) => {
    const selectable = group.attendances.filter((att) => att.approval_status !== "approved");
    const allSelected = selectable.every((att) => selectedIds.has(att.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const att of selectable) {
        allSelected ? next.delete(att.id) : next.add(att.id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allSelectable = groups.flatMap((g) =>
      g.attendances.filter((att) => att.approval_status !== "approved")
    );
    const allSelected = allSelectable.every((att) => selectedIds.has(att.id));
    setSelectedIds(allSelected ? new Set() : new Set(allSelectable.map((a) => a.id)));
  };

  const toggleGroup = (employeeId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(employeeId) ? next.delete(employeeId) : next.add(employeeId);
      return next;
    });
  };

  const [showGroupApproveDialog, setShowGroupApproveDialog] = useState<EmployeeGroup | null>(null);

  const approveGroupPending = async (group: EmployeeGroup) => {
    const pendingIds = group.attendances
      .filter((att) => att.approval_status === "pending")
      .map((att) => att.id);
    await Promise.all(pendingIds.map((id) => handleApprove(id)));
    setShowGroupApproveDialog(null);
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.search !== "" ||
    filters.dateRange.from !== getDefaultDateRange().from ||
    filters.dateRange.to !== getDefaultDateRange().to;

  const resetFilters = () => {
    setFilters({ status: "all", search: "", dateRange: getDefaultDateRange() });
  };

  // ── Loading ──
  if (loading || permLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-48" />
        <div className="h-10 bg-muted rounded w-full max-w-xs" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-14 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg ml-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE} showMessage>
      <div className="max-w-5xl mx-auto space-y-5 pb-10">
        {error && <Alert variant="error" className="text-sm">{error}</Alert>}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/apps/${slug}/hr/attendance`}>
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Tous les pointages
              </h1>
              <p className="text-sm text-muted-foreground">
                {groups.length} employé{groups.length !== 1 ? "s" : ""}{" · "}
                {counts.pending > 0 ? (
                  <span className="text-amber-600 font-medium">{counts.pending} en attente</span>
                ) : (
                  "Tout est à jour"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={loadAttendances}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Rafraîchir"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        {/* Search + status pills + filter toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap items-center">
            {([
              { key: "all" as const, label: "Tous", count: counts.all },
              { key: "pending" as const, label: "En attente", count: counts.pending },
              { key: "approved" as const, label: "Approuvés", count: counts.approved },
              { key: "rejected" as const, label: "Rejetés", count: counts.rejected },
            ]).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilters((f) => ({ ...f, status: key }))}
                className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full border transition-colors",
                  filters.status === key
                    ? "bg-zinc-800 text-white border-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200"
                    : "border-zinc-200 dark:border-zinc-700 text-muted-foreground hover:text-foreground hover:border-zinc-400"
                )}
              >
                {label}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            ))}

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors",
                showFilters || hasActiveFilters
                  ? "bg-muted border-zinc-400 dark:border-zinc-500 text-foreground"
                  : "border-zinc-200 dark:border-zinc-700 text-muted-foreground hover:border-zinc-400"
              )}
            >
              <Filter className="size-3" />
              Dates
              {hasActiveFilters && (
                <span className="inline-block size-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          </div>
        </div>

        {/* Date filters panel */}
        {showFilters && (
          <Card className="p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Période
              </span>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Réinitialiser
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="size-3" /> Du
                </label>
                <input
                  type="date"
                  value={filters.dateRange.from}
                  onChange={(e) => setFilters((f) => ({ ...f, dateRange: { ...f.dateRange, from: e.target.value } }))}
                  className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="size-3" /> Jusqu'au
                </label>
                <input
                  type="date"
                  value={filters.dateRange.to}
                  onChange={(e) => setFilters((f) => ({ ...f, dateRange: { ...f.dateRange, to: e.target.value } }))}
                  className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-muted/50 border rounded-lg px-4 py-2.5 sticky top-0 z-10">
            <span className="text-sm font-medium">
              {selectedIds.size} pointage{selectedIds.size !== 1 ? "s" : ""} sélectionné{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE}>
                <Button onClick={() => setShowBulkApproveDialog(true)} size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="size-3.5" />
                  Approuver tout
                </Button>
              </Can>
              <Button onClick={() => setSelectedIds(new Set())} size="sm" variant="outline">
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Select all */}
        {groups.length > 0 && canApprovePermission && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={
                groups.flatMap((g) => g.attendances.filter((a) => a.approval_status !== "approved")).length > 0 &&
                groups.flatMap((g) => g.attendances.filter((a) => a.approval_status !== "approved")).every((a) => selectedIds.has(a.id))
              }
              onChange={toggleSelectAll}
              className="rounded accent-zinc-800 dark:accent-zinc-200 cursor-pointer"
            />
            <span>Sélectionner tous les pointages en attente</span>
          </div>
        )}

        {/* Groups */}
        {groups.length === 0 ? (
          <Card className="py-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              Aucun pointage ne correspond à vos filtres.
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {groups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.employeeId);
              const selectableInGroup = group.attendances.filter((att) => att.approval_status !== "approved");
              const allGroupSelected = selectableInGroup.length > 0 && selectableInGroup.every((att) => selectedIds.has(att.id));

              return (
                <Card key={group.employeeId} className="overflow-hidden shadow-sm">
                  {/* Group header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => toggleGroup(group.employeeId)}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                    )}

                    {/* Avatar */}
                    <div className="size-8 rounded-full bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center shrink-0">
                      <User className="size-4 text-white dark:text-zinc-900" />
                    </div>

                    {/* Name & email */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{group.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{group.email}</p>
                    </div>

                    {/* Status pills */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <StatusPill count={group.pendingCount} variant="pending" label="attente" />
                      <StatusPill count={group.approvedCount} variant="approved" label="approuvé" />
                      <StatusPill count={group.rejectedCount} variant="rejected" label="rejeté" />
                    </div>

                    {/* Total hours */}
                    <div className="text-right min-w-[50px]">
                      <p className="text-[11px] text-muted-foreground">Total</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {formatDuration(safeNumber(group.totalHours))}
                      </p>
                    </div>

                    {/* Quick approve */}
                    {group.pendingCount > 0 && canApprovePermission && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowGroupApproveDialog(group);
                        }}
                        className="ml-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950 px-2 py-1 rounded-md transition-colors shrink-0"
                      >
                        Tout approuver
                      </button>
                    )}
                  </div>

                  {/* Expanded table */}
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
                              className="rounded accent-zinc-800 dark:accent-zinc-200 cursor-pointer disabled:opacity-30"
                            />
                          </TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Arrivée</TableHead>
                          <TableHead>Départ</TableHead>
                          <TableHead>Pauses</TableHead>
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
                            onApprove={() => setShowApproveDialog(att.id)}
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

        {/* Approve dialog */}
        {showApproveDialog && (
          <ConfirmationDialog
            open={!!showApproveDialog}
            onOpenChange={(open) => {
              if (!open) setShowApproveDialog(null);
            }}
            title="Approuver le pointage"
            description="Êtes-vous sûr de vouloir approuver ce pointage ?"
            confirmLabel="Approuver"
            confirmVariant="default"
            onConfirm={() => handleApprove(showApproveDialog)}
            loading={processingIds.has(showApproveDialog)}
            icon="success"
          />
        )}

        {/* Bulk approve dialog */}
        <ConfirmationDialog
          open={showBulkApproveDialog}
          onOpenChange={setShowBulkApproveDialog}
          title="Approuver plusieurs pointages"
          description={`Êtes-vous sûr de vouloir approuver ${selectedIds.size} pointage${selectedIds.size > 1 ? 's' : ''} ?`}
          confirmLabel="Approuver tout"
          confirmVariant="default"
          onConfirm={handleBulkApprove}
          loading={processingIds.size > 0}
          icon="success"
        />

        {/* Group approve dialog */}
        {showGroupApproveDialog && (
          <ConfirmationDialog
            open={!!showGroupApproveDialog}
            onOpenChange={(open) => {
              if (!open) setShowGroupApproveDialog(null);
            }}
            title="Approuver les pointages en attente"
            description={`Êtes-vous sûr de vouloir approuver les ${showGroupApproveDialog.pendingCount} pointage${showGroupApproveDialog.pendingCount > 1 ? 's' : ''} en attente de ${showGroupApproveDialog.fullName} ?`}
            confirmLabel="Approuver tout"
            confirmVariant="default"
            onConfirm={() => approveGroupPending(showGroupApproveDialog)}
            loading={processingIds.size > 0}
            icon="success"
          />
        )}

        {/* Reject dialog */}
        {showRejectDialog && (
          <ConfirmationDialog
            open={!!showRejectDialog}
            onOpenChange={(open) => {
              if (!open) {
                setShowRejectDialog(null);
                setRejectionReason("");
              }
            }}
            title="Rejeter le pointage"
            description={
              <div className="space-y-3">
                <p>Êtes-vous sûr de vouloir rejeter ce pointage ?</p>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Raison du rejet (optionnel)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full border border-border rounded-md p-2.5 min-h-[100px] text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Indiquez la raison du rejet..."
                  />
                </div>
              </div>
            }
            confirmLabel="Rejeter"
            confirmVariant="destructive"
            onConfirm={() => handleReject(showRejectDialog)}
            loading={processingIds.has(showRejectDialog)}
            icon="warning"
          />
        )}
      </div>
    </Can>
  );
}