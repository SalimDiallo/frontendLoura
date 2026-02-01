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
  HiOutlineArrowUpTray,
} from "react-icons/hi2";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  StatCard,
  PageHeader,
  FilterBar,
  PageSection,
  Alert,
  Button,
  Badge,
} from "@/components/ui";
import { getAttendances, getAttendanceStats } from "@/lib/services/hr/attendance.service";
import type { Attendance, AttendanceStats } from "@/lib/types/hr";
import { Can } from "@/components/apps/common/protected-route";
import { useAttendancePermissions } from "@/lib/hooks";
import { cn, formatDate, formatDuration, formatTime } from "@/lib/utils";
import { getStatusBadgeNode } from "@/lib/utils/BadgeStatus";

// Status → Google-style chip colour
const STATUS_CHIP: Record<string, { bg: string; text: string }> = {
  present:  { bg: "bg-emerald-100",  text: "text-emerald-700" },
  absent:   { bg: "bg-red-100",      text: "text-red-700" },
  late:     { bg: "bg-amber-100",    text: "text-amber-700" },
  half_day: { bg: "bg-sky-100",      text: "text-sky-700" },
  on_leave: { bg: "bg-purple-100",   text: "text-purple-700" },
};

const STATUS_LABEL: Record<string, string> = {
  present:  "Présent",
  absent:   "Absent",
  late:     "En retard",
  half_day: "Demi-jour",
  on_leave: "Congé",
};

function AttendanceCalendar({ attendances }: { attendances: Attendance[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (attendances.length === 0) return format(new Date(), "yyyy-MM");
    return format(new Date(attendances[0].date), "yyyy-MM");
  });

  const attendanceByDate = attendances.reduce(
    (acc: Record<string, Attendance>, att) => {
      acc[att.date] = att;
      return acc;
    },
    {}
  );

  function getDaysInMonth(year: number, month: number) {
    const date = new Date(year, month - 1, 1);
    const days: string[] = [];
    while (date.getMonth() === month - 1) {
      days.push(format(new Date(date), "yyyy-MM-dd"));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  const [year, month] = currentMonth.split("-").map(Number);
  const days = getDaysInMonth(year, month);

  function changeMonth(offset: number) {
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + offset);
    setCurrentMonth(format(date, "yyyy-MM"));
  }

  function goToToday() {
    setCurrentMonth(format(new Date(), "yyyy-MM"));
  }

  const displayMonth = format(new Date(`${currentMonth}-01`), "LLLL yyyy", { locale: fr });
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Build week-rows so we can render row-by-row with horizontal separators only
  const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

  // leading offset (Monday = 0)
  const firstDate   = new Date(days[0]);
  let   firstDayIdx = firstDate.getDay();
  if (firstDayIdx === 0) firstDayIdx = 7;
  const offset = firstDayIdx - 1;

  // total grid slots needed to fill complete weeks
  const totalSlots = offset + days.length;
  const rows  = Math.ceil(totalSlots / 7);

  return (
    <div className="space-y-0">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-2 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-[18px] font-normal text-foreground capitalize">
            {displayMonth}
          </h3>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full px-3 h-7 text-xs font-medium border-border/40 text-foreground hover:bg-muted/60"
            onClick={goToToday}
          >
            Aujourd'hui
          </Button>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            className="size-8 rounded-full hover:bg-muted/60"
            onClick={() => changeMonth(-1)}
          >
            <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="size-8 rounded-full hover:bg-muted/60"
            onClick={() => changeMonth(1)}
          >
            <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </Button>
        </div>
      </div>

      {/* ─── Weekday header row ──────────────────────────── */}
      <div className="grid grid-cols-7 border-b border-border/25">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="py-2 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
          >
            {label}
          </div>
        ))}
      </div>

      {/* ─── Week rows ───────────────────────────────────── */}
      {Array.from({ length: rows }, (_, rowIdx) => {
        const cells = Array.from({ length: 7 }, (_, colIdx) => {
          const slotIdx  = rowIdx * 7 + colIdx;
          const dayIdx   = slotIdx - offset;          // index into `days[]`
          const isValid  = dayIdx >= 0 && dayIdx < days.length;
          const day      = isValid ? days[dayIdx] : null;
          const att      = day ? attendanceByDate[day] : null;
          const isToday  = day === todayStr;
          const dayNum   = day ? parseInt(day.split("-")[2], 10) : null;
          const chip     = att ? STATUS_CHIP[att.status] : null;
          const label    = att ? STATUS_LABEL[att.status] : null;

          return (
            <div
              key={colIdx}
              className={cn(
                "min-h-[80px] px-1.5 py-1.5 flex flex-col",
                !isValid && "bg-muted/30",
              )}
            >
              {isValid && (
                <>
                  {/* Day number — circle on today */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-7 h-7 text-[13px] rounded-full leading-none",
                        isToday
                          ? "bg-primary text-white font-medium"
                          : "text-foreground/70 font-normal hover:bg-muted/50 cursor-default"
                      )}
                    >
                      {dayNum}
                    </span>
                  </div>

                  {/* Chip */}
                  {att && chip && label && (
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <span
                        className={cn(
                          "block text-left truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight",
                          chip.bg,
                          chip.text
                        )}
                      >
                        {label}
                      </span>
                      {!att.is_approved && (
                        <span className="block text-left truncate rounded-md px-1.5 py-0.5 text-[10px] font-normal leading-tight bg-muted/60 text-muted-foreground">
                          En attente
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        });

        return (
          <div
            key={rowIdx}
            className={cn(
              "grid grid-cols-7 border-b border-border/15",
              rowIdx === rows - 1 && "border-b-0"
            )}
          >
            {cells}
          </div>
        );
      })}

      {/* ─── Footer: legend + CTA ────────────────────────── */}
      <div className="flex items-center justify-between px-2 pt-3">
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
          {Object.entries(STATUS_CHIP).map(([key, { bg, text }]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={cn("inline-block w-2.5 h-2.5 rounded-sm", bg)} />
              <span className={cn("text-[11px]", text)}>{STATUS_LABEL[key]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AttendanceHistoryPage() {
  return (
    <Can showMessage={true}>
      <AttendanceHistoryContent />
    </Can>
  );
}

function AttendanceHistoryContent() {
  const params = useParams();
  const slug = params.slug as string;
  const { permissionContext } = useAttendancePermissions();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadAttendances();
    loadStats();
    // eslint-disable-next-line
  }, [slug, statusFilter]);

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
        page_size: 366,
      };
      if (statusFilter !== "all") {
        paramsFetch.status = statusFilter;
      }
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
          <div className="h-5 bg-muted rounded w-1/4"></div>
          <div className="h-14 bg-muted rounded"></div>
          <div className="h-40 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Historique de mes pointages"
        subtitle="Consultez et suivez votre assiduité au quotidien"
        icon={HiOutlineCalendar}
        actions={[
          {
            label: "Pointer",
            icon: HiOutlineClock,
            href: `/apps/${slug}/hr/attendance`,
            variant: "default",
          }
        ]}
      />

      {error && <Alert variant="error">{error}</Alert>}

      {/* Stat cards — flat, no blur */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard
            variant="minimal"
            title="Total jours"
            value={stats.total_days}
            icon={HiOutlineCalendar}
            className="border border-border/40 bg-background px-3 py-2 min-h-0"
          />
          <StatCard
            variant="minimal"
            title="Présent"
            value={stats.present_days}
            icon={HiOutlineCheckCircle}
            valueColor="success"
            className="border border-border/40 bg-background px-3 py-2 min-h-0"
          />
          <StatCard
            variant="minimal"
            title="Heures totales"
            value={formatDuration(stats.total_hours)}
            icon={HiOutlineClock}
            className="border border-border/40 bg-background px-3 py-2 min-h-0"
          />
          <StatCard
            variant="minimal"
            title="Heures sup."
            value={formatDuration(stats.overtime_hours)}
            icon={HiOutlineArrowUpTray}
            className="border border-border/40 bg-background px-3 py-2 min-h-0"
          />
        </div>
      )}

      {/* Filters + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <FilterBar
          variant="minimal"
          className="bg-transparent p-0 border-0"
          filters={[
            {
              label: "Statut",
              value: statusFilter,
              onValueChange: setStatusFilter,
              options: [
                { label: "Tous les statuts", value: "all" },
                { label: "Présent", value: "present" },
                { label: "Absent", value: "absent" },
                { label: "En retard", value: "late" },
                { label: "Demi-journée", value: "half_day" },
                { label: "En congé", value: "on_leave" },
              ]
            }
          ]}
        />

        <div className="flex bg-muted/20 p-0.5 rounded-md border border-border/40 self-start sm:self-auto">
          <Button
            size="sm"
            variant={viewMode === "calendar" ? "premium" : "ghost"}
            className={cn(
              "rounded px-3 py-1 text-xs shadow-none",
              viewMode === "calendar" && "bg-foreground text-background border border-border/30"
            )}
            onClick={() => setViewMode("calendar")}
          >
            <HiOutlineCalendar className="size-3.5 mr-1" />
            Calendrier
          </Button>
          <Button
            size="sm"
            variant={viewMode === "table" ? "premium" : "ghost"}
            className={cn(
              "rounded px-3 py-1 text-xs shadow-none",
              viewMode === "table" && "bg-foreground text-background border border-border/30"
            )}
            onClick={() => setViewMode("table")}
          >
            <HiOutlineClock className="size-3.5 mr-1" />
            Tableau
          </Button>
        </div>
      </div>

      {/* Main content */}
      <PageSection
        noPadding
        className="overflow-hidden bg-background border border-border/40"
      >
        {attendances.length === 0 && !loading ? (
          <div className="p-10 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-muted border border-border/40">
                <HiOutlineCalendar className="size-6 text-muted-foreground" />
              </div>
              <div className="max-w-xs mx-auto">
                <h3 className="text-sm font-semibold">Aucun enregistrement</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Nous n'avons trouvé aucun pointage correspondant à vos critères de recherche.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-1 text-xs py-1 px-4 h-7 border-border/50">
                <Link href={`/apps/${slug}/hr/attendance`}>
                  Pointer mon arrivée
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn(viewMode === "calendar" ? "p-4" : "p-0")}>
            {viewMode === "calendar" ? (
              <AttendanceCalendar attendances={attendances} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-medium px-3 py-2.5 text-xs text-muted-foreground">Date</TableHead>
                      <TableHead className="font-medium px-2 py-2.5 text-xs text-muted-foreground">Arrivée</TableHead>
                      <TableHead className="font-medium px-2 py-2.5 text-xs text-muted-foreground">Départ</TableHead>
                      <TableHead className="font-medium px-2 py-2.5 text-center text-xs text-muted-foreground">Durée</TableHead>
                      <TableHead className="font-medium px-2 py-2.5 text-center text-xs text-muted-foreground">Heures sup.</TableHead>
                      <TableHead className="font-medium px-2 py-2.5 text-xs text-muted-foreground">Statut</TableHead>
                      <TableHead className="font-medium px-3 py-2.5 text-right text-xs text-muted-foreground">Validation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendances
                      .sort((a, b) => (a.date < b.date ? 1 : -1))
                      .map((attendance) => (
                        <TableRow key={attendance.id} className="hover:bg-muted/20 transition-colors border-b border-border/20">
                          <TableCell className="font-medium px-3 py-2.5 whitespace-nowrap text-xs">
                            {formatDate(attendance.date)}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-muted-foreground whitespace-nowrap text-xs">
                            {formatTime(attendance.check_in)}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-muted-foreground whitespace-nowrap text-xs">
                            {formatTime(attendance.check_out)}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-center font-medium text-xs">
                            {formatDuration(attendance.total_hours)}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-center text-xs">
                            {attendance.is_overtime ? (
                              <Badge variant="secondary" className="bg-amber-50 text-amber-600 hover:bg-amber-50 font-medium border border-amber-200 text-xs">
                                +{formatDuration(attendance.overtime_hours)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-xs">
                            {getStatusBadgeNode(attendance.status)}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-right text-xs">
                            {attendance.is_approved ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-medium">
                                <HiOutlineCheckCircle className="size-3" />
                                Approuvé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground text-[10px] font-medium">
                                <HiOutlineClock className="size-3" />
                                En attente
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </PageSection>
    </div>
  );
}