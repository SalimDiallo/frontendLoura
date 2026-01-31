"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from "react-icons/hi2";
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
import { ApprovalStatus } from "@/lib/types/hr";
import { usePermissions, useAttendancePermissions } from "@/lib/hooks";
import { Can } from "@/components/apps/common/protected-route";
import { formatDate, formatDuration, formatTime } from "@/lib/utils";
import { COMMON_PERMISSIONS } from "@/lib/types";
import { Check, X } from "lucide-react";

export default function AttendanceApprovalsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { user, hasPermission, isAdmin, loading: permLoading } = usePermissions();
  const { canApprove, permissionContext } = useAttendancePermissions();

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">(ApprovalStatus.PENDING);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Check permissions - redirect if not authorized
  useEffect(() => {
    if (!permLoading && !isAdmin && !hasPermission(COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE)) {
      router.push(`/apps/${slug}/hr/attendance`);
    }
  }, [permLoading, isAdmin, hasPermission, router, slug]);

  // Load attendances only once when permissions are ready
  useEffect(() => {
    if (!permLoading && (isAdmin || hasPermission(COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE))) {
      loadAttendances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, permLoading, isAdmin]);

  const myUserId = user?.id;

  // Filtre: on n'affiche PAS ses propres pointages (cf consigne de l'utilisateur)
  const filteredAttendances = useMemo(() => {
    let filtered: Attendance[] = attendances;

    // Exclure ses propres pointages
    if (myUserId) {
      filtered = filtered.filter((att) => att.employee !== myUserId);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((att) => att.approval_status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (att) =>
          att.user_full_name.toLowerCase().includes(query) ||
          att.user_email.toLowerCase().includes(query) ||
          att.employee_name?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [attendances, myUserId, statusFilter, searchQuery]);

  const loadAttendances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAttendances(slug, {
        page: 1,
        page_size: 100,
      });
      setAttendances(data.results);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
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
  };

  const handleReject = async (id: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(id));
      setError(null);

      await approveAttendance(
        id,
        {
          action: "reject",
          rejection_reason: rejectionReason,
        },
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
  };

  const handleBulkApprove = async () => {
    const idsToApprove = Array.from(selectedIds);
    for (const id of idsToApprove) {
      await handleApprove(id);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAttendances.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAttendances.map((att) => att.id)));
    }
  };

  if (loading || permLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_ALL_ATTENDANCE}>
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HiOutlineClock className="size-7" />
            Validation des Pointages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approuvez ou rejetez les pointages des employés
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Tous ({attendances.filter((a) => a.employee !== myUserId).length})
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter(ApprovalStatus.PENDING)}
                size="sm"
              >
                En attente ({attendances.filter((a) => a.approval_status === "pending" && a.employee !== myUserId).length})
              </Button>
              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                onClick={() => setStatusFilter(ApprovalStatus.APPROVED)}
                size="sm"
              >
                Approuvés ({attendances.filter((a) => a.approval_status === "approved" && a.employee !== myUserId).length})
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                onClick={() => setStatusFilter(ApprovalStatus.REJECTED)}
                size="sm"
              >
                Rejetés ({attendances.filter((a) => a.approval_status === "rejected" && a.employee !== myUserId).length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <Card className="p-4 border-0 shadow-sm bg-blue-50 dark:bg-blue-950">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedIds.size} pointage(s) sélectionné(s)
              </span>
              <div className="flex gap-2">
                <Can permission={COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE}>
                <Button onClick={handleBulkApprove} size="sm" variant="default">
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                  Approuver la sélection
                </Button>
                </Can>
                <Button onClick={() => setSelectedIds(new Set())} size="sm" variant="outline">
                  Annuler
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Attendances Table */}
        <Card className="border-0 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={filteredAttendances.length > 0 && selectedIds.size === filteredAttendances.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Employé</TableHead>
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
              {filteredAttendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Aucun pointage à afficher
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendances.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(attendance.id)}
                        onChange={() => toggleSelection(attendance.id)}
                        disabled={!hasPermission(COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{attendance.user_full_name}</div>
                        <div className="text-sm text-muted-foreground">{attendance.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(attendance.date)}</TableCell>
                    <TableCell>{formatTime(attendance.check_in)}</TableCell>
                    <TableCell>{formatTime(attendance.check_out)}</TableCell>
                    <TableCell>{formatDuration(attendance.break_duration)}</TableCell>
                    <TableCell>{formatDuration(attendance.total_hours)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          attendance.approval_status === "approved"
                            ? "success"
                            : attendance.approval_status === "rejected"
                            ? "error"
                            : "warning"
                        }
                      >
                        {attendance.approval_status === "approved" && "✓ Approuvé"}
                        {attendance.approval_status === "rejected" && "✗ Rejeté"}
                        {attendance.approval_status === "pending" && "⏳ En attente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {attendance.approval_status === "pending" && hasPermission(COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE) && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            onClick={() => handleApprove(attendance.id)}
                            disabled={processingIds.has(attendance.id)}
                            size="sm"
                            variant="default"
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            onClick={() => setShowRejectDialog(attendance.id)}
                            disabled={processingIds.has(attendance.id)}
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                          >
                            <X className="size-4"  />
                          </Button>
                        </div>
                      )}
                      {!hasPermission(COMMON_PERMISSIONS.HR.APPROVE_ATTENDANCE) && (
                        <div className="text-sm text-muted-foreground italic">
                         Vous ne pouvez pas approuver
                        </div>
                      )}
                      {attendance.approval_status === "rejected" && attendance.rejection_reason && (
                        <div className="text-sm text-red-600">
                          {attendance.rejection_reason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Rejeter le pointage</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Raison du rejet (optionnel)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full border rounded-md p-2 min-h-[100px]"
                    placeholder="Expliquez pourquoi ce pointage est rejeté..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => {
                      setShowRejectDialog(null);
                      setRejectionReason("");
                    }}
                    variant="outline"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => handleReject(showRejectDialog)}
                    variant="default"
                  >
                    Rejeter
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Can>
  );
}
