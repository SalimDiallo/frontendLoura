"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
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
import { getAttendances, getAttendanceStats } from "@/lib/services/hr";
import type { Attendance, AttendanceStats } from "@/lib/types/hr";
import { Can } from "@/components/apps/common/protected-route";
import { COMMON_PERMISSIONS } from "@/lib/types/shared/permissions";
import { useAttendancePermissions } from "@/lib/hooks";

export default function AttendanceHistoryPage() {
  return (
    <Can
      permission={COMMON_PERMISSIONS.HR.VIEW_ATTENDANCE}
      showMessage={true}
    >
      <AttendanceHistoryContent />
    </Can>
  );
}

function AttendanceHistoryContent() {
  const params = useParams();
  const slug = params.slug as string;
  const { canViewAll, permissionContext } = useAttendancePermissions();

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadAttendances();
    loadStats();
  }, [slug, currentPage, startDate, endDate, statusFilter]);

  const loadAttendances = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si l'utilisateur ne peut voir que ses propres pointages, filtrer par employee_id
      const params: any = {
        page: currentPage,
        page_size: 20,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: statusFilter || undefined,
      };

      // Filtrer par employé si l'utilisateur ne peut pas tout voir
      if (!canViewAll && permissionContext?.userId) {
        params.employee_id = permissionContext.userId;
      }

      const data = await getAttendances(slug, params);

      setAttendances(data.results);
      setTotalCount(data.count);
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params: any = {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      // Filtrer les stats par employé si nécessaire
      if (!canViewAll && permissionContext?.userId) {
        params.employee_id = permissionContext.userId;
      }

      const data = await getAttendanceStats(slug, params);
      setStats(data);
    } catch (err: any) {
      console.error("Error loading stats:", err);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "HH:mm", { locale: fr });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy", { locale: fr });
  };

  const formatDuration = (hours?: number) => {
    if (!hours) return "-";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "error" | "secondary"> = {
      present: "success",
      late: "warning",
      absent: "error",
      half_day: "secondary",
      on_leave: "default",
    };

    const labels: Record<string, string> = {
      present: "Présent",
      late: "En retard",
      absent: "Absent",
      half_day: "Demi-journée",
      on_leave: "En congé",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading && attendances.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HiOutlineCalendar className="size-7" />
            Historique des pointages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consultez votre historique de présence
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/apps/${slug}/hr/attendance`}>
            <HiOutlineClock className="size-4 mr-2" />
            Pointer maintenant
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-sm text-muted-foreground">Total jours</div>
            <div className="text-2xl font-bold mt-1">{stats.total_days}</div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-sm text-muted-foreground">Présent</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {stats.present_days}
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-sm text-muted-foreground">Total heures</div>
            <div className="text-2xl font-bold mt-1">
              {formatDuration(stats.total_hours)}
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-sm text-muted-foreground">Heures sup.</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
              {formatDuration(stats.overtime_hours)}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Date début</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Date fin</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              <option value="present">Présent</option>
              <option value="late">En retard</option>
              <option value="absent">Absent</option>
              <option value="half_day">Demi-journée</option>
              <option value="on_leave">En congé</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="border-0 shadow-sm">
        {attendances.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <HiOutlineCalendar className="size-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Aucun pointage</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Aucun enregistrement de pointage pour cette période
                </p>
              </div>
              <Button asChild>
                <Link href={`/apps/${slug}/hr/attendance`}>
                  <HiOutlineClock className="size-4 mr-2" />
                  Pointer maintenant
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Arrivée</TableHead>
                <TableHead>Départ</TableHead>
                <TableHead>Heures</TableHead>
                <TableHead>Heures sup.</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Approuvé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map((attendance) => (
                <TableRow key={attendance.id}>
                  <TableCell className="font-medium">
                    {formatDate(attendance.date)}
                  </TableCell>
                  <TableCell>{formatTime(attendance.check_in)}</TableCell>
                  <TableCell>{formatTime(attendance.check_out)}</TableCell>
                  <TableCell>{formatDuration(attendance.total_hours)}</TableCell>
                  <TableCell>
                    {attendance.is_overtime ? (
                      <span className="text-blue-600">
                        {formatDuration(attendance.overtime_hours)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                  <TableCell>
                    {attendance.is_approved ? (
                      <HiOutlineCheckCircle className="size-5 text-green-600" />
                    ) : (
                      <HiOutlineXCircle className="size-5 text-gray-400" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {totalCount > 20 && (
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} sur {Math.ceil(totalCount / 20)} • {totalCount} pointages au total
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
    </div>
  );
}
