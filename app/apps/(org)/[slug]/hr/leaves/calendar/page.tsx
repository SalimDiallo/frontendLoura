"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Alert, Button, Badge } from "@/components/ui";
import {
  HiOutlineCalendar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineUserCircle,
  HiOutlineAdjustmentsHorizontal,
} from "react-icons/hi2";
import {
  CalendarDays,
  CalendarRange,
  Grid3X3,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { getLeaveRequests } from "@/lib/services/hr/leave.service";
import type { LeaveRequest } from "@/lib/types/hr";
import { formatLeaveDaysWithLabel } from "@/lib/utils/leave";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

// Types de vue
type ViewMode = "day" | "week" | "month" | "year";

// Utility functions
function getISODay(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function areDatesInSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function LeaveCalendarPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const today = new Date();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const monthNamesShort = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const dayNamesFull = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLeaveRequests();
      setLeaveRequests(response.results.filter(r => r.status === "approved") || []);
    } catch (err: any) {
      console.error("Erreur lors du chargement:", err);
      setError(err.message || "Erreur lors du chargement du calendrier");
    } finally {
      setLoading(false);
    }
  };

  // Build month grid
  function buildMonthGridDates(year: number, month: number) {
    const firstOfMonth = new Date(year, month, 1);
    const startIsoDay = getISODay(firstOfMonth);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - (startIsoDay - 1));
    const grid: Date[] = [];
    for (let i = 0; i < 6 * 7; ++i) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      grid.push(d);
    }
    return grid;
  }

  // Build week grid
  function buildWeekGridDates(date: Date) {
    const startOfWeek = new Date(date);
    const dayOfWeek = getISODay(date);
    startOfWeek.setDate(date.getDate() - (dayOfWeek - 1));
    const grid: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      grid.push(d);
    }
    return grid;
  }

  // Build year grid (12 months)
  function buildYearMonths(year: number) {
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  }

  const calendarGridDates = useMemo(
    () => buildMonthGridDates(year, month),
    [month, year]
  );

  const weekGridDates = useMemo(
    () => buildWeekGridDates(currentDate),
    [currentDate]
  );

  const yearMonths = useMemo(() => buildYearMonths(year), [year]);

  const uniqueLeaveTypes = useMemo(
    () => Array.from(new Set(leaveRequests.map(r => r.leave_type_name).filter(Boolean))),
    [leaveRequests]
  );

  // Get leaves for a date
  function getLeaveEventsForDate(dayDate: Date) {
    return leaveRequests.filter((request) => {
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const checkDate = new Date(dayDate);
      checkDate.setHours(12, 0, 0, 0);
      
      const matchesDate = checkDate >= startDate && checkDate <= endDate;
      const matchesType = selectedLeaveTypes.length === 0 || 
        selectedLeaveTypes.includes(request.leave_type_name || "");
      
      return matchesDate && matchesType;
    }).sort((a, b) => {
      const aLen = new Date(a.end_date).getTime() - new Date(a.start_date).getTime();
      const bLen = new Date(b.end_date).getTime() - new Date(b.start_date).getTime();
      return bLen - aLen;
    });
  }

  // Get leaves count for a month (for year view)
  function getLeavesCountForMonth(monthDate: Date) {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    return leaveRequests.filter((request) => {
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      return (startDate <= monthEnd && endDate >= monthStart);
    }).length;
  }

  // Navigation
  const navigate = (direction: -1 | 1) => {
    setCurrentDate((dt) => {
      const d = new Date(dt);
      switch (viewMode) {
        case "day":
          d.setDate(d.getDate() + direction);
          break;
        case "week":
          d.setDate(d.getDate() + direction * 7);
          break;
        case "month":
          d.setMonth(d.getMonth() + direction);
          break;
        case "year":
          d.setFullYear(d.getFullYear() + direction);
          break;
      }
      return d;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  // View mode labels
  const viewModeLabels: Record<ViewMode, string> = {
    day: "Jour",
    week: "Semaine",
    month: "Mois",
    year: "Année",
  };

  const viewModeIcons: Record<ViewMode, React.ReactNode> = {
    day: <CalendarDays className="size-4" />,
    week: <CalendarRange className="size-4" />,
    month: <Grid3X3 className="size-4" />,
    year: <LayoutGrid className="size-4" />,
  };

  // Get current period label
  const getPeriodLabel = () => {
    switch (viewMode) {
      case "day":
        return currentDate.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      case "week":
        const weekStart = weekGridDates[0];
        const weekEnd = weekGridDates[6];
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.getDate()} - ${weekEnd.getDate()} ${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
        }
        return `${weekStart.getDate()} ${monthNamesShort[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNamesShort[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
      case "month":
        return `${monthNames[month]} ${year}`;
      case "year":
        return `${year}`;
    }
  };

  // Toggle leave type filter
  const toggleLeaveTypeFilter = (leaveType: string) => {
    setSelectedLeaveTypes(prev =>
      prev.includes(leaveType)
        ? prev.filter(t => t !== leaveType)
        : [...prev, leaveType]
    );
  };

  function colorForLeaveType(typeName: string) {
    return leaveRequests.find(r => r.leave_type_name === typeName)?.leave_type_color || "#3B82F6";
  }

  // Render leave event bar
  const renderLeaveBar = (leave: LeaveRequest, cellDate: Date, compact = false) => {
    const isStartDay = areDatesInSameDay(cellDate, new Date(leave.start_date));
    const isEndDay = areDatesInSameDay(cellDate, new Date(leave.end_date));
    const isMultiDay = leave.start_date !== leave.end_date;
    const leaveColor = leave.leave_type_color || "#3B82F6";

    return (
      <div
        key={leave.id}
        className={cn(
          "flex items-center gap-1 rounded-sm text-white font-medium truncate cursor-pointer transition-all",
          "hover:shadow-lg hover:scale-[1.02]",
          compact ? "text-[10px] py-0.5 px-1" : "text-xs py-1 px-1.5"
        )}
        style={{
          backgroundColor: leaveColor,
          marginLeft: isStartDay || !isMultiDay ? 0 : 8,
          marginRight: isEndDay || !isMultiDay ? 0 : 8,
          borderRadius: `${isStartDay || !isMultiDay ? 4 : 0}px ${isEndDay || !isMultiDay ? 4 : 0}px ${isEndDay || !isMultiDay ? 4 : 0}px ${isStartDay || !isMultiDay ? 4 : 0}px`,
        }}
        title={`${leave.employee_name} - ${leave.leave_type_name}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedLeave(leave);
          setDialogOpen(true);
        }}
      >
        <span className="truncate">
          {compact ? leave.employee_name?.split(" ")[0]?.[0] : leave.employee_name?.split(" ")[0]}
        </span>
      </div>
    );
  };

  // Loading
  if (loading) {
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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Calendrier des Congés"
        subtitle="Visualisez les absences avec différentes vues"
        icon={HiOutlineCalendar}
        backLink={`/apps/${slug}/hr/leaves`}
        actions={[
          {
            label: "Nouvelle demande",
            href: `/apps/${slug}/hr/leaves/create`,
            variant: "default",
          },
        ]}
      />

      {error && <Alert variant="error">{error}</Alert>}

      {/* Controls */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Left - Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="size-9 rounded-xl"
            >
              <HiOutlineChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(1)}
              className="size-9 rounded-xl"
            >
              <HiOutlineChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="rounded-xl"
            >
              Aujourd&apos;hui
            </Button>
            <h2 className="text-lg sm:text-xl font-bold ml-2 capitalize">
              {getPeriodLabel()}
            </h2>
          </div>

          {/* Right - View Mode Selector */}
          <div className="flex items-center gap-2">
            {/* Filter button */}
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-xl"
            >
              <HiOutlineAdjustmentsHorizontal className="size-4 mr-2" />
              Filtres
              {selectedLeaveTypes.length > 0 && (
                <Badge className="ml-2">{selectedLeaveTypes.length}</Badge>
              )}
            </Button>

            {/* View Mode Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl gap-2">
                  {viewModeIcons[viewMode]}
                  {viewModeLabels[viewMode]}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(["day", "week", "month", "year"] as ViewMode[]).map((mode) => (
                  <DropdownMenuItem
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "gap-2 cursor-pointer",
                      viewMode === mode && "bg-primary/10 text-primary"
                    )}
                  >
                    {viewModeIcons[mode]}
                    {viewModeLabels[mode]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Types de congé :</span>
              {selectedLeaveTypes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLeaveTypes([])}
                  className="text-xs h-7"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueLeaveTypes.map((leaveType) => {
                if (typeof leaveType !== "string") return null;
                const isSelected = selectedLeaveTypes.includes(leaveType);
                const leaveColor = colorForLeaveType(leaveType);
                return (
                  <button
                    key={leaveType}
                    onClick={() => toggleLeaveTypeFilter(leaveType)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      isSelected
                        ? "ring-2 ring-offset-2 shadow-md text-white"
                        : "bg-muted hover:bg-muted/80"
                    )}
                    style={isSelected ? { backgroundColor: leaveColor } : {}}
                  >
                    {leaveType}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Calendar Views */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {/* ==================== DAY VIEW ==================== */}
        {viewMode === "day" && (
          <div className="p-6">
            <div className="space-y-3">
              {getLeaveEventsForDate(currentDate).length === 0 ? (
                <div className="text-center py-16">
                  <HiOutlineCalendar className="size-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun congé ce jour</p>
                </div>
              ) : (
                getLeaveEventsForDate(currentDate).map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedLeave(leave);
                      setDialogOpen(true);
                    }}
                  >
                    <div
                      className="size-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: leave.leave_type_color || "#3B82F6" }}
                    >
                      {leave.employee_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{leave.employee_name}</p>
                      <p className="text-sm text-muted-foreground">{leave.leave_type_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatLeaveDaysWithLabel(leave.total_days)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(leave.start_date).toLocaleDateString("fr-FR")} - {new Date(leave.end_date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== WEEK VIEW ==================== */}
        {viewMode === "week" && (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Week header */}
              <div className="grid grid-cols-7 border-b">
                {weekGridDates.map((date, idx) => {
                  const isToday = areDatesInSameDay(date, today);
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 text-center border-r last:border-r-0",
                        isToday && "bg-primary/5"
                      )}
                    >
                      <p className="text-xs text-muted-foreground">{dayNames[idx]}</p>
                      <p className={cn(
                        "text-lg font-bold mt-1",
                        isToday && "text-primary"
                      )}>
                        {date.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>
              {/* Week body */}
              <div className="grid grid-cols-7 min-h-[400px]">
                {weekGridDates.map((date, idx) => {
                  const events = getLeaveEventsForDate(date);
                  const isToday = areDatesInSameDay(date, today);
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-2 border-r last:border-r-0 min-h-[300px]",
                        isToday && "bg-primary/5"
                      )}
                    >
                      <div className="space-y-1">
                        {events.slice(0, 8).map((leave) => renderLeaveBar(leave, date))}
                        {events.length > 8 && (
                          <p className="text-xs text-center text-muted-foreground">+{events.length - 8} autres</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== MONTH VIEW ==================== */}
        {viewMode === "month" && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-xs py-2 text-muted-foreground"
                >
                  {day}
                </div>
              ))}
              {/* Calendar Cells */}
              {calendarGridDates.map((cellDate, idx) => {
                const inThisMonth = cellDate.getMonth() === month;
                const isToday = areDatesInSameDay(cellDate, today);
                const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
                const events = getLeaveEventsForDate(cellDate);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-1.5 border rounded-lg min-h-[90px] sm:min-h-[110px] flex flex-col transition-all cursor-pointer",
                      "hover:bg-muted/50 hover:shadow-md",
                      !inThisMonth && "bg-muted/30 opacity-50",
                      isWeekend && inThisMonth && "bg-muted/20",
                      isToday && "ring-2 ring-primary bg-primary/5 shadow-sm"
                    )}
                    onClick={() => {
                      if (events.length > 0) {
                        setCurrentDate(cellDate);
                        setViewMode("day");
                      }
                    }}
                  >
                    {/* Date number */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-xs font-bold",
                        isToday && "text-primary",
                        !inThisMonth && "text-muted-foreground"
                      )}>
                        {cellDate.getDate()}
                      </span>
                      {isToday && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                          Auj
                        </span>
                      )}
                    </div>
                    {/* Events */}
                    <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                      {events.slice(0, 3).map((leave) => renderLeaveBar(leave, cellDate, true))}
                      {events.length > 3 && (
                        <span className="text-[10px] text-muted-foreground text-center">
                          +{events.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== YEAR VIEW ==================== */}
        {viewMode === "year" && (
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {yearMonths.map((monthDate, idx) => {
                const monthGrid = buildMonthGridDates(monthDate.getFullYear(), monthDate.getMonth());
                const leavesCount = getLeavesCountForMonth(monthDate);
                const isCurrentMonth = isSameMonth(monthDate, today);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 border rounded-xl cursor-pointer transition-all",
                      "hover:bg-muted/50 hover:shadow-md hover:scale-[1.02]",
                      isCurrentMonth && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => {
                      setCurrentDate(monthDate);
                      setViewMode("month");
                    }}
                  >
                    {/* Month header */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={cn(
                        "font-semibold",
                        isCurrentMonth && "text-primary"
                      )}>
                        {monthNames[idx]}
                      </h3>
                      {leavesCount > 0 && (
                        <Badge variant="default" className="text-[10px] h-5">
                          {leavesCount}
                        </Badge>
                      )}
                    </div>
                    {/* Mini calendar */}
                    <div className="grid grid-cols-7 gap-px text-[9px]">
                      {dayNames.map((d) => (
                        <div key={d} className="text-center text-muted-foreground font-medium py-0.5">
                          {d[0]}
                        </div>
                      ))}
                      {monthGrid.slice(0, 35).map((cellDate, cellIdx) => {
                        const inMonth = cellDate.getMonth() === monthDate.getMonth();
                        const isTodayCell = areDatesInSameDay(cellDate, today);
                        const hasEvents = getLeaveEventsForDate(cellDate).length > 0;

                        return (
                          <div
                            key={cellIdx}
                            className={cn(
                              "text-center py-0.5 rounded-sm",
                              !inMonth && "text-muted-foreground/30",
                              isTodayCell && "bg-primary text-primary-foreground font-bold",
                              hasEvents && !isTodayCell && "bg-primary/20 font-medium"
                            )}
                          >
                            {cellDate.getDate()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Legend */}
      <Card className="p-4 border-0 shadow-sm">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <HiOutlineAdjustmentsHorizontal className="size-4" />
          Légende
        </h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded ring-2 ring-primary bg-primary/5"></div>
            <span className="text-muted-foreground">Aujourd&apos;hui</span>
          </div>
          {uniqueLeaveTypes.slice(0, 5).map((leaveType) => {
            const color = colorForLeaveType(leaveType);
            return (
              <div key={leaveType} className="flex items-center gap-2">
                <div
                  className="size-4 rounded shadow-sm"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-muted-foreground">{leaveType}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Leave Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          {selectedLeave && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedLeave.leave_type_color || "#3B82F6" }}
                  >
                    {selectedLeave.employee_name?.[0]}
                  </div>
                  <div>
                    <p>{selectedLeave.employee_name}</p>
                    <p className="text-sm font-normal text-muted-foreground">
                      {selectedLeave.leave_type_name}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Début</p>
                  <p className="font-medium">
                    {new Date(selectedLeave.start_date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Fin</p>
                  <p className="font-medium">
                    {new Date(selectedLeave.end_date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Durée</p>
                  <p className="font-medium">{formatLeaveDaysWithLabel(selectedLeave.total_days)}</p>
                </div>
                {selectedLeave.approver_name && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground text-xs mb-1">Approuvé par</p>
                    <p className="font-medium">{selectedLeave.approver_name}</p>
                  </div>
                )}
              </div>
              {selectedLeave.reason && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Motif</p>
                  <p className="text-sm">{selectedLeave.reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}