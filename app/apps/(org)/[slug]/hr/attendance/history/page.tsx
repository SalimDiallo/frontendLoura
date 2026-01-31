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
} from "react-icons/hi2";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, Button, Card } from "@/components/ui";
import { getAttendances, getAttendanceStats } from "@/lib/services/hr";
import type { Attendance, AttendanceStats } from "@/lib/types/hr";
import { Can } from "@/components/apps/common/protected-route";
import { COMMON_PERMISSIONS } from "@/lib/types/shared/permissions";
import { useAttendancePermissions } from "@/lib/hooks";
import { formatDate, formatDuration, formatTime } from "@/lib/utils";
import { getStatusBadgeNode } from "@/lib/utils/BadgeStatus";

// Simple Calendar View
function AttendanceCalendar({ attendances }: { attendances: Attendance[] }) {
  // Parse all unique months present in the attendances
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (attendances.length === 0) return format(new Date(), "yyyy-MM");
    return format(new Date(attendances[0].date), "yyyy-MM");
  });

  // Group attendances by date, for quick lookup
  const attendanceByDate = attendances.reduce(
    (acc: Record<string, Attendance>, att) => {
      acc[att.date] = att;
      return acc;
    },
    {},
  );

  // Helper to get all days in the current selected month
  function getDaysInMonth(year: number, month: number) {
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      days.push(format(new Date(date), "yyyy-MM-dd"));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  const [year, month] = currentMonth.split("-").map(Number);
  const days = getDaysInMonth(year, month);

  // For navigation
  function changeMonth(offset: number) {
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + offset);
    setCurrentMonth(format(date, "yyyy-MM"));
  }

  // Get locale month display
  const displayMonth = format(new Date(`${currentMonth}-01`), "LLLL yyyy", { locale: fr });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-lg">{displayMonth}</div>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => changeMonth(-1)}>
            <span className="sr-only">Mois précédent</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </Button>
          <Button size="icon" variant="ghost" onClick={() => changeMonth(1)}>
            <span className="sr-only">Mois suivant</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => (
          <div key={d} className="text-sm text-muted-foreground">{d}</div>
        ))}
        {/* Empty slots for the first day */}
        {(() => {
          // 0=Sunday, but in France, week starts Monday (1)
          const firstDate = new Date(days[0]);
          let firstDay = firstDate.getDay();
          if (firstDay === 0) firstDay = 7;
          return Array.from({ length: firstDay - 1 }, (_, i) => <div key={i}></div>);
        })()}
        {days.map(day => {
          const attendance = attendanceByDate[day];
          return (
            <div key={day} className="aspect-square border rounded flex flex-col items-center justify-center bg-background p-1 min-h-[60px]">
              <div className="text-xs text-muted-foreground">{parseInt(day.split("-")[2], 10)}</div>
              {attendance ? (
                <div>
                  {getStatusBadgeNode(attendance.status)}
                  {attendance.is_approved ? (
                    <HiOutlineCheckCircle className="size-4 text-green-600 mt-1 inline" title="Approuvé" />
                  ) : (
                    <HiOutlineXCircle className="size-4 text-gray-400 mt-1 inline" title="Non approuvé" />
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AttendanceHistoryPage() {
  return (
    <Can
      showMessage={true}
    >
      <AttendanceHistoryContent />
    </Can>
  );
}

// This version: show ONLY current user's attendance history, no filters, can see "calendar/table" view
function AttendanceHistoryContent() {
  const params = useParams();
  const slug = params.slug as string;
  const { permissionContext } = useAttendancePermissions();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");

  useEffect(() => {
    // Only fetch attendance for the current (connected) user
    loadAttendances();
    loadStats();
    // eslint-disable-next-line
  }, [slug]);

  const loadAttendances = async () => {
    if (!permissionContext?.userId) {
      setAttendances([]);
      setLoading(false);
      setError("Impossible de trouver votre identifiant utilisateur.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const paramsFetch: any = {
        employee_id: permissionContext.userId,
        page: 1,
        page_size: 366, // 1 year for calendar view, show all for this user
      };
      const data = await getAttendances(slug, paramsFetch);
      setAttendances(data.results);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!permissionContext?.userId) {
      setStats(null);
      return;
    }
    try {
      const paramsFetch: any = {
        employee_id: permissionContext.userId,
      };
      const data = await getAttendanceStats(slug, paramsFetch);
      setStats(data);
    } catch (err: any) {
      // ignore error for stats
    }
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

      {/* Header + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HiOutlineCalendar className="size-7" />
            Historique de mes pointages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consultez votre propre historique de présence
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            size="sm"
            variant={viewMode === "calendar" ? "default" : "outline"}
            type="button"
            onClick={() => setViewMode("calendar")}
          >
            <HiOutlineCalendar className="size-4 mr-1" />
            Vue Calendrier
          </Button>
          <Button
            size="sm"
            variant={viewMode === "table" ? "default" : "outline"}
            type="button"
            onClick={() => setViewMode("table")}
          >
            <HiOutlineClock className="size-4 mr-1" />
            Vue Tableau
          </Button>
          <Button asChild variant="outline">
            <Link href={`/apps/${slug}/hr/attendance`}>
              <HiOutlineClock className="size-4 mr-2" />
              Pointer maintenant
            </Link>
          </Button>
        </div>
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
            <div className="text-2xl font-bold mt-1 text-foreground">
              {formatDuration(stats.overtime_hours)}
            </div>
          </Card>
        </div>
      )}

      {/* View mode: calendar or table */}
      <Card className="p-6 border-0 shadow-sm">
        {attendances.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <HiOutlineCalendar className="size-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Aucun pointage</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Aucun enregistrement trouvé pour vous.
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
        ) : viewMode === "calendar" ? (
          <AttendanceCalendar attendances={attendances} />
        ) : (
          <div className="overflow-x-auto">
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
                {attendances
                  .sort((a, b) => (a.date < b.date ? 1 : -1))
                  .map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell className="font-medium">
                      {formatDate(attendance.date)}
                    </TableCell>
                    <TableCell>{formatTime(attendance.check_in)}</TableCell>
                    <TableCell>{formatTime(attendance.check_out)}</TableCell>
                    <TableCell>{formatDuration(attendance.total_hours)}</TableCell>
                    <TableCell>
                      {attendance.is_overtime ? (
                        <span className="text-foreground">
                          {formatDuration(attendance.overtime_hours)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadgeNode(attendance.status)}</TableCell>
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
          </div>
        )}
      </Card>
    </div>
  );
}
