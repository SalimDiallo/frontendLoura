"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge, Alert } from "@/components/ui";
import { getMovementHistory } from "@/lib/services/inventory";
import { getOrders } from "@/lib/services/inventory/order.service";
import { getStockCounts } from "@/lib/services/inventory/stock-count.service";
import type { MovementHistoryResponse, Order, StockCount } from "@/lib/types/inventory";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  ShoppingCart,
  ClipboardList,
  TrendingUp,
  ArrowLeftRight,
  ArrowLeft,
  Loader2,
  Grid3X3,
  LayoutGrid,
  ListTodo,
  Zap,
  Eye,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "year" | "month" | "day";

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

interface DayActivity {
  date: string;
  movements: { in: number; out: number; transfer: number; adjustment: number; total: number };
  orders: Order[];
  stockCounts: StockCount[];
}

export default function CalendarPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [movementHistory, setMovementHistory] = useState<MovementHistoryResponse | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [movementData, ordersData, countsData] = await Promise.all([
        getMovementHistory(365).catch(() => null),
        getOrders().catch(() => []),
        getStockCounts().catch(() => []),
      ]);
      setMovementHistory(movementData);
      setOrders(Array.isArray(ordersData) ? ordersData : (ordersData as any)?.results || []);
      setStockCounts(Array.isArray(countsData) ? countsData : (countsData as any)?.results || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate("prev");
      if (e.key === "ArrowRight") navigate("next");
      if (e.key === "1") setViewMode("year");
      if (e.key === "2") setViewMode("month");
      if (e.key === "3") { setViewMode("day"); if (!selectedDate) setSelectedDate(currentDate); }
      if (e.key === "t" || e.key === "T") goToToday();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentDate, selectedDate]);

  const getActivitiesForDate = useCallback((date: Date): DayActivity => {
    const dateStr = date.toISOString().split("T")[0];
    const movement = movementHistory?.history?.find(h => h.date === dateStr);
    return {
      date: dateStr,
      movements: {
        in: movement?.in?.count || 0,
        out: movement?.out?.count || 0,
        transfer: movement?.transfer?.count || 0,
        adjustment: movement?.adjustment?.count || 0,
        total: (movement?.in?.count || 0) + (movement?.out?.count || 0) + (movement?.transfer?.count || 0) + (movement?.adjustment?.count || 0),
      },
      orders: orders.filter(o => o.order_date?.startsWith(dateStr)),
      stockCounts: stockCounts.filter(sc => sc.count_date?.startsWith(dateStr)),
    };
  }, [movementHistory, orders, stockCounts]);

  const getMonthActivities = useCallback((year: number, month: number) => {
    let total = { movements: 0, orders: 0, stockCounts: 0 };
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const activity = getActivitiesForDate(new Date(year, month, d));
      total.movements += activity.movements.total;
      total.orders += activity.orders.length;
      total.stockCounts += activity.stockCounts.length;
    }
    return total;
  }, [getActivitiesForDate]);

  const dateHasActivities = useCallback((date: Date): boolean => {
    const a = getActivitiesForDate(date);
    return a.movements.total > 0 || a.orders.length > 0 || a.stockCounts.length > 0;
  }, [getActivitiesForDate]);

  const navigate = (direction: "prev" | "next") => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (viewMode === "year") {
        setCurrentDate(new Date(currentDate.getFullYear() + (direction === "next" ? 1 : -1), 0, 1));
      } else if (viewMode === "month") {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === "next" ? 1 : -1), 1));
      } else {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
        setCurrentDate(newDate);
        setSelectedDate(newDate);
      }
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const switchView = (mode: ViewMode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setViewMode(mode);
      if (mode === "day" && !selectedDate) setSelectedDate(currentDate);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 100);
  };

  const selectMonth = (month: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
    switchView("month");
  };

  const selectDay = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [currentDate]);

  const selectedDayActivity = selectedDate ? getActivitiesForDate(selectedDate) : null;
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isSelected = (date: Date) => selectedDate?.toDateString() === date.toDateString();
  const formatDateFull = (date: Date) => date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const getTitle = () => {
    if (viewMode === "year") return currentDate.getFullYear().toString();
    if (viewMode === "month") return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    return formatDateFull(currentDate);
  };

  // Stats for current period
  const periodStats = useMemo(() => {
    let stats = { movements: 0, orders: 0, stockCounts: 0, days: 0 };
    if (viewMode === "year") {
      for (let m = 0; m < 12; m++) {
        const monthStats = getMonthActivities(currentDate.getFullYear(), m);
        stats.movements += monthStats.movements;
        stats.orders += monthStats.orders;
        stats.stockCounts += monthStats.stockCounts;
      }
      stats.days = 365;
    } else if (viewMode === "month") {
      const monthStats = getMonthActivities(currentDate.getFullYear(), currentDate.getMonth());
      stats = { ...monthStats, days: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() };
    } else if (selectedDayActivity) {
      stats = {
        movements: selectedDayActivity.movements.total,
        orders: selectedDayActivity.orders.length,
        stockCounts: selectedDayActivity.stockCounts.length,
        days: 1,
      };
    }
    return stats;
  }, [viewMode, currentDate, selectedDayActivity, getMonthActivities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-muted/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/apps/${slug}/inventory/reports`}>
            <Button variant="ghost" size="icon" className="hover:bg-muted/80 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Calendrier des activités
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualisez l'historique complet • <span className="text-primary">↔ ← →</span> Navigation • <span className="text-primary">T</span> Aujourd'hui
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Period Stats Mini */}
          <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-lg bg-muted/50 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="font-medium">{periodStats.movements}</span>
              <span className="text-muted-foreground">mvt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium">{periodStats.orders}</span>
              <span className="text-muted-foreground">cmd</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="font-medium">{periodStats.stockCounts}</span>
              <span className="text-muted-foreground">inv</span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border rounded-lg p-1 bg-muted/30">
            {[
              { mode: "year" as ViewMode, icon: Grid3X3, label: "Année", key: "1" },
              { mode: "month" as ViewMode, icon: LayoutGrid, label: "Mois", key: "2" },
              { mode: "day" as ViewMode, icon: ListTodo, label: "Jour", key: "3" },
            ].map(({ mode, icon: Icon, label, key }) => (
              <button
                key={mode}
                onClick={() => switchView(mode)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === mode
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title={`Vue ${label} (${key})`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <Button variant="ghost" size="icon" onClick={loadData} className="hover:bg-muted/80">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Erreur" onClose={() => setError(null)}>{error}</Alert>}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar */}
        <Card className={cn("p-5 lg:col-span-3 transition-opacity duration-150", isTransitioning && "opacity-50")}>
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigate("prev")} className="hover:bg-muted/80 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-[220px] text-center">
                <h2 className="text-xl font-semibold capitalize">{getTitle()}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate("next")} className="hover:bg-muted/80 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday} className="gap-2">
                <Zap className="h-3.5 w-3.5" />
                Aujourd'hui
              </Button>
            </div>
          </div>

          {/* YEAR VIEW */}
          {viewMode === "year" && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {MONTHS.map((month, idx) => {
                const activities = getMonthActivities(currentDate.getFullYear(), idx);
                const hasActivity = activities.movements > 0 || activities.orders > 0 || activities.stockCounts > 0;
                const isCurrentMonth = new Date().getMonth() === idx && new Date().getFullYear() === currentDate.getFullYear();
                const totalActivities = activities.movements + activities.orders + activities.stockCounts;
                
                return (
                  <button
                    key={month}
                    onClick={() => selectMonth(idx)}
                    className={cn(
                      "group relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                      "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
                      isCurrentMonth ? "border-primary bg-primary/5" : "border-transparent bg-muted/30",
                      hasActivity && !isCurrentMonth && "border-muted"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={cn("font-semibold", isCurrentMonth && "text-primary")}>{month}</p>
                      {hasActivity && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {totalActivities}
                        </span>
                      )}
                    </div>
                    {hasActivity ? (
                      <div className="space-y-1">
                        {activities.movements > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>{activities.movements} mouvements</span>
                          </div>
                        )}
                        {activities.orders > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span>{activities.orders} commandes</span>
                          </div>
                        )}
                        {activities.stockCounts > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            <span>{activities.stockCounts} inventaires</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/50">Aucune activité</p>
                    )}
                    <Eye className="absolute top-3 right-3 h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}

          {/* MONTH VIEW */}
          {viewMode === "month" && (
            <>
              <div className="grid grid-cols-7 mb-2">
                {DAYS_OF_WEEK.map((day, idx) => (
                  <div key={day} className={cn(
                    "text-center text-xs font-medium py-2",
                    idx >= 5 ? "text-muted-foreground/60" : "text-muted-foreground"
                  )}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((date, index) => {
                  if (!date) return <div key={`empty-${index}`} className="h-[88px]" />;
                  const hasActivities = dateHasActivities(date);
                  const activity = hasActivities ? getActivitiesForDate(date) : null;
                  const totalActivities = activity ? activity.movements.total + activity.orders.length + activity.stockCounts.length : 0;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => selectDay(date)}
                      onDoubleClick={() => { selectDay(date); switchView("day"); }}
                      className={cn(
                        "group relative h-[88px] p-2 rounded-lg border-2 text-left transition-all duration-200",
                        "hover:border-primary/50 hover:shadow-sm hover:-translate-y-0.5",
                        isToday(date) && "border-primary bg-primary/5",
                        isSelected(date) && !isToday(date) && "border-primary/50 bg-primary/5",
                        !isToday(date) && !isSelected(date) && hasActivities && "border-muted bg-muted/20",
                        !isToday(date) && !isSelected(date) && !hasActivities && "border-transparent",
                        isWeekend && "bg-muted/10"
                      )}
                      title={hasActivities ? `${totalActivities} activité(s) - Double-clic pour détails` : ""}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                          isToday(date) && "bg-primary text-primary-foreground",
                          isWeekend && !isToday(date) && "text-muted-foreground"
                        )}>
                          {date.getDate()}
                        </span>
                        {hasActivities && (
                          <span className="text-[10px] font-medium text-primary">{totalActivities}</span>
                        )}
                      </div>
                      {hasActivities && activity && (
                        <div className="space-y-0.5">
                          {activity.movements.total > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className="text-[10px] text-muted-foreground truncate">{activity.movements.total} mvt</span>
                            </div>
                          )}
                          {activity.orders.length > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              <span className="text-[10px] text-muted-foreground truncate">{activity.orders.length} cmd</span>
                            </div>
                          )}
                          {activity.stockCounts.length > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              <span className="text-[10px] text-muted-foreground truncate">{activity.stockCounts.length} inv</span>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* DAY VIEW */}
          {viewMode === "day" && selectedDate && selectedDayActivity && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Mouvements", value: selectedDayActivity.movements.total, color: "blue", icon: TrendingUp },
                  { label: "Commandes", value: selectedDayActivity.orders.length, color: "green", icon: ShoppingCart },
                  { label: "Inventaires", value: selectedDayActivity.stockCounts.length, color: "orange", icon: ClipboardList },
                  { label: "Total activités", value: selectedDayActivity.movements.total + selectedDayActivity.orders.length + selectedDayActivity.stockCounts.length, color: "primary", icon: Zap },
                ].map(({ label, value, color, icon: Icon }) => (
                  <Card key={label} className={cn(
                    "p-4 transition-all hover:shadow-md",
                    color === "blue" && "bg-blue-50 dark:bg-blue-950/30 border-blue-200/50",
                    color === "green" && "bg-green-50 dark:bg-green-950/30 border-green-200/50",
                    color === "orange" && "bg-orange-50 dark:bg-orange-950/30 border-orange-200/50",
                    color === "primary" && "bg-primary/5 border-primary/20"
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn("text-xs font-medium", `text-${color}-700 dark:text-${color}-300`)}>{label}</p>
                        <p className={cn("text-3xl font-bold mt-1", `text-${color}-900 dark:text-${color}-100`)}>{value}</p>
                      </div>
                      <Icon className={cn("h-8 w-8 opacity-50", `text-${color}-600`)} />
                    </div>
                  </Card>
                ))}
              </div>

              {/* Movements Detail */}
              {selectedDayActivity.movements.total > 0 && (
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Détail des mouvements
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Entrées", value: selectedDayActivity.movements.in, icon: ArrowUpRight, color: "green" },
                      { label: "Sorties", value: selectedDayActivity.movements.out, icon: ArrowDownRight, color: "red" },
                      { label: "Transferts", value: selectedDayActivity.movements.transfer, icon: ArrowLeftRight, color: "blue" },
                      { label: "Ajustements", value: selectedDayActivity.movements.adjustment, icon: RefreshCcw, color: "purple" },
                    ].filter(m => m.value > 0).map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Icon className={cn("h-5 w-5", `text-${color}-500`)} />
                        <div>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-lg font-bold">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Orders */}
              {selectedDayActivity.orders.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-green-500" />
                    Commandes ({selectedDayActivity.orders.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDayActivity.orders.map((order) => (
                      <Link key={order.id} href={`/apps/${slug}/inventory/orders/${order.id}`} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">{order.supplier_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={order.status === "received" ? "success" : order.status === "cancelled" ? "error" : "outline"}>
                            {order.status_display || order.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Stock Counts */}
              {selectedDayActivity.stockCounts.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-orange-500" />
                    Inventaires ({selectedDayActivity.stockCounts.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDayActivity.stockCounts.map((count) => (
                      <Link key={count.id} href={`/apps/${slug}/inventory/stock-counts/${count.id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">{count.count_number}</p>
                            <p className="text-sm text-muted-foreground">{count.warehouse_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={count.status === "validated" ? "success" : count.status === "cancelled" ? "error" : "outline"}>
                            {count.status_display || count.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Empty State */}
              {selectedDayActivity.movements.total === 0 && selectedDayActivity.orders.length === 0 && selectedDayActivity.stockCounts.length === 0 && (
                <Card className="p-12 text-center">
                  <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
                  <h3 className="font-semibold text-lg mb-1">Aucune activité</h3>
                  <p className="text-muted-foreground">Aucun mouvement, commande ou inventaire ce jour.</p>
                </Card>
              )}
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <Card className="p-4 h-fit sticky top-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Navigation
          </h3>
          
          <div className="space-y-4">
            {/* Quick Access */}
            <div className="space-y-1">
              {[
                { label: "Aujourd'hui", onClick: goToToday, icon: Zap },
                { label: "Ce mois", onClick: () => { setCurrentDate(new Date()); switchView("month"); }, icon: LayoutGrid },
                { label: "Cette année", onClick: () => { setCurrentDate(new Date()); switchView("year"); }, icon: Grid3X3 },
              ].map(({ label, onClick, icon: Icon }) => (
                <Button key={label} variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onClick}>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </Button>
              ))}
            </div>

            <div className="border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Mois récents</p>
              <div className="space-y-0.5">
                {[0, 1, 2, 3, 4, 5].map((offset) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - offset);
                  const isCurrent = currentDate.getMonth() === d.getMonth() && currentDate.getFullYear() === d.getFullYear() && viewMode === "month";
                  return (
                    <button
                      key={offset}
                      onClick={() => { setCurrentDate(d); switchView("month"); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        isCurrent ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                      )}
                    >
                      {MONTHS[d.getMonth()]} {d.getFullYear()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Légende</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span>Mouvements</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /><span>Commandes</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /><span>Inventaires</span></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
