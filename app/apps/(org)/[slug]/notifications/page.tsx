"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Bell,
  Check,
  CheckCircle2,
  Trash2,
  Clock,
  AlertTriangle,
  Info,
  User2,
  Settings,
  SlidersHorizontal,
  Inbox,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  BellRing,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/hooks/use-notifications";
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStats,
} from "@/lib/types/notifications";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Bell; color: string; label: string }
> = {
  alert: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-500", label: "Alertes" },
  system: { icon: Info, color: "text-blue-600 dark:text-blue-500", label: "Système" },
  user: { icon: User2, color: "text-violet-600 dark:text-violet-500", label: "Utilisateurs" },
};

const PRIORITY_CONFIG: Record<
  NotificationPriority,
  { label: string; dotColor: string }
> = {
  low: { label: "Faible", dotColor: "bg-muted-foreground/30" },
  medium: { label: "Moyenne", dotColor: "bg-amber-500" },
  high: { label: "Haute", dotColor: "bg-orange-500" },
  critical: { label: "Urgente", dotColor: "bg-rose-500" },
};

// ---------------------------------------------------------------------------
// Stats Cards
// ---------------------------------------------------------------------------
function StatsCards({
  stats,
  unreadCount,
  totalCount,
}: {
  stats: NotificationStats | null;
  unreadCount: number;
  totalCount: number;
}) {
  const cards = [
    { label: "Total", value: totalCount, icon: Bell },
    { label: "Non lues", value: unreadCount, icon: BellRing },
    { label: "Alertes", value: stats?.by_type?.alert ?? 0, icon: AlertTriangle },
    {
      label: "Haute priorité",
      value: (stats?.by_priority?.high ?? 0) + (stats?.by_priority?.critical ?? 0),
      icon: Shield,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">
                  {card.value}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60">
                <Icon className="size-4 text-muted-foreground" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Bar
// ---------------------------------------------------------------------------
function FilterBar({
  activeReadFilter,
  onReadFilterChange,
  activeTypeFilter,
  onTypeFilterChange,
  activePriorityFilter,
  onPriorityFilterChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
  hasActiveFilters,
}: {
  activeReadFilter: "all" | "unread" | "read";
  onReadFilterChange: (f: "all" | "unread" | "read") => void;
  activeTypeFilter: NotificationType | null;
  onTypeFilterChange: (t: NotificationType | null) => void;
  activePriorityFilter: NotificationPriority | null;
  onPriorityFilterChange: (p: NotificationPriority | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card className="p-4 border border-border/50">
      {/* Row 1 */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "w-full h-9 pl-9 pr-8 rounded-lg",
              "bg-muted/30 border border-border/50",
              "text-sm placeholder:text-muted-foreground/40",
              "focus:outline-none focus:ring-1 focus:ring-ring",
              "transition-shadow"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Read status filter */}
        <div className="flex gap-1">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => onReadFilterChange(f)}
              className={cn(
                "px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
                activeReadFilter === f
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {f === "all" ? "Tout" : f === "unread" ? "Non lues" : "Lues"}
            </button>
          ))}
        </div>

        {/* Toggle advanced */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "h-8 gap-1.5 rounded text-xs shrink-0",
            (showAdvanced || hasActiveFilters) && "text-foreground"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          Filtres
          {hasActiveFilters && (
            <span className="size-1.5 rounded-full bg-primary" />
          )}
          {showAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </Button>
      </div>

      {/* Row 2: Advanced */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          showAdvanced ? "max-h-32 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"
        )}
      >
        <div className="flex flex-wrap gap-6 pt-3 border-t border-border/30">
          {/* Type */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Type
            </p>
            <div className="flex gap-1">
              {(Object.keys(TYPE_CONFIG) as NotificationType[]).map((type) => {
                const config = TYPE_CONFIG[type];
                const Icon = config.icon;
                const isActive = activeTypeFilter === type;
                return (
                  <button
                    key={type}
                    onClick={() => onTypeFilterChange(isActive ? null : type)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors border",
                      isActive
                        ? "bg-foreground text-background border-foreground"
                        : "text-muted-foreground border-border/50 hover:bg-muted/40"
                    )}
                  >
                    <Icon className="size-3" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Priorité
            </p>
            <div className="flex gap-1">
              {(Object.keys(PRIORITY_CONFIG) as NotificationPriority[]).map((priority) => {
                const config = PRIORITY_CONFIG[priority];
                const isActive = activePriorityFilter === priority;
                return (
                  <button
                    key={priority}
                    onClick={() => onPriorityFilterChange(isActive ? null : priority)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors border",
                      isActive
                        ? "bg-foreground text-background border-foreground"
                        : "text-muted-foreground border-border/50 hover:bg-muted/40"
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", config.dotColor)} />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={onClearFilters}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Notification Row
// ---------------------------------------------------------------------------
function NotificationRow({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const timeAgo = formatTimeAgo(notification.created_at);
  const fullDate = new Date(notification.created_at).toLocaleDateString("fr", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const isUnread = !notification.is_read;
  const [isExiting, setIsExiting] = useState(false);
  const typeConf = TYPE_CONFIG[notification.notification_type] || TYPE_CONFIG.system;
  const priorityConf = PRIORITY_CONFIG[notification.priority] || PRIORITY_CONFIG.low;
  const Icon = typeConf.icon;

  const handleDelete = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDelete(notification.id), 200);
  }, [onDelete, notification.id]);

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3.5 px-5 py-3.5",
        "border-b border-border/30 last:border-b-0",
        "transition-all duration-200",
        isExiting && "opacity-0 -translate-x-4 max-h-0 py-0 overflow-hidden",
        isUnread ? "bg-muted/20" : "bg-transparent",
        "hover:bg-muted/30"
      )}
    >
      {/* Unread indicator */}
      {isUnread && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}

      {/* Icon */}
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60 shrink-0 mt-0.5">
        <Icon className={cn("size-4", typeConf.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p
                className={cn(
                  "text-sm leading-snug",
                  isUnread ? "font-medium text-foreground" : "text-foreground/80"
                )}
              >
                {notification.title}
              </p>
              {notification.priority !== "low" && (
                <span className={cn("size-1.5 rounded-full shrink-0", priorityConf.dotColor)} />
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-2xl">
              {notification.message}
            </p>

            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-muted-foreground/60">
                {typeConf.label}
              </span>

              {notification.sender_name && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-[11px] text-muted-foreground/60">
                    {notification.sender_name}
                  </span>
                </>
              )}

              <span className="text-muted-foreground/30">·</span>
              <span
                className="text-[11px] text-muted-foreground/50 flex items-center gap-1 cursor-help"
                title={fullDate}
              >
                <Clock className="size-2.5" />
                {timeAgo}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
            {isUnread && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRead(notification.id)}
                className="size-7 rounded text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                title="Marquer comme lu"
              >
                <Check className="size-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="size-7 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
              title="Supprimer"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preferences Section
// ---------------------------------------------------------------------------
function PreferencesSection({
  preferences,
  onSave,
}: {
  preferences: import("@/lib/types/notifications").NotificationPreference;
  onSave: (data: import("@/lib/types/notifications").NotificationPreferenceUpdate) => Promise<any>;
}) {
  const typeItems = [
    {
      key: "receive_alerts" as const,
      label: "Alertes stock",
      description: "Seuils bas, ruptures, expirations",
      icon: AlertTriangle,
    },
    {
      key: "receive_system" as const,
      label: "Notifications système",
      description: "Mises à jour, maintenances planifiées",
      icon: Info,
    },
    {
      key: "receive_user" as const,
      label: "Actions utilisateurs",
      description: "Mentions, assignations, commentaires",
      icon: User2,
    },
  ];

  const priorityLevels = [
    { value: "low", label: "Tout", desc: "Toutes les notifications" },
    { value: "medium", label: "Moyenne+", desc: "Ignorer les faibles" },
    { value: "high", label: "Haute+", desc: "Seulement les importantes" },
    { value: "critical", label: "Critiques", desc: "Seulement les urgentes" },
  ];

  return (
    <Card className="border border-border/50 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/40 bg-muted/10">
        <div className="flex items-center gap-2.5">
          <Settings className="size-4 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Préférences de notification
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Personnalisez quelles notifications vous recevez
            </p>
          </div>
        </div>
      </div>

      {/* Type toggles */}
      <div className="p-5 space-y-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Types de notifications
        </p>
        <div className="space-y-2">
          {typeItems.map(({ key, label, description, icon: Icon }) => (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between py-2.5 px-3 rounded-lg border border-border/40",
                "transition-colors",
                preferences[key] ? "bg-muted/10" : "opacity-50"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                checked={preferences[key]}
                onCheckedChange={(checked) => onSave({ [key]: checked })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Priority level */}
      <div className="px-5 pb-5 space-y-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Priorité minimale
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {priorityLevels.map((level) => {
            const isActive = preferences.min_priority === level.value;
            return (
              <button
                key={level.value}
                onClick={() =>
                  onSave({ min_priority: level.value as NotificationPriority })
                }
                className={cn(
                  "flex flex-col items-center gap-0.5 p-3 rounded-lg text-center border transition-colors",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/50 text-muted-foreground hover:bg-muted/30"
                )}
              >
                <span className="text-xs font-medium">{level.label}</span>
                <span className={cn("text-[10px]", isActive ? "text-background/70" : "text-muted-foreground/60")}>
                  {level.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function FullEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="flex size-14 items-center justify-center rounded-xl bg-muted/60 mb-4">
        <Inbox className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        {hasFilters ? "Aucun résultat" : "Aucune notification"}
      </h3>
      <p className="text-xs text-muted-foreground max-w-xs text-center">
        {hasFilters
          ? "Essayez de modifier vos filtres."
          : "Les nouvelles notifications apparaîtront ici."}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function PageSkeleton() {
  return (
    <div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3.5 px-5 py-3.5 border-b border-border/30">
          <div className="size-9 rounded-lg bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 py-0.5">
            <div className="h-3.5 w-1/3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-3/5 rounded bg-muted/60 animate-pulse" />
            <div className="h-2.5 w-1/4 rounded bg-muted/40 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    totalCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    applyFilters,
    fetchPreferences,
    savePreferences,
    preferences,
    hasNext,
    currentPage,
    goToNextPage,
    goToPreviousPage,
    fetchStats,
  } = useNotifications();

  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | null>(null);
  const [activeTab, setActiveTab] = useState<"notifications" | "preferences">("notifications");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    fetchNotifications(1, {});
    fetchPreferences();
    fetchStats().then((s) => s && setStats(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter changes (ref to break circular dep)
  const applyFiltersRef = useRef(applyFilters);
  applyFiltersRef.current = applyFilters;

  useEffect(() => {
    const filters: Record<string, unknown> = {};
    if (readFilter === "unread") filters.is_read = false;
    if (readFilter === "read") filters.is_read = true;
    if (typeFilter) filters.notification_type = typeFilter;
    if (priorityFilter) filters.priority = priorityFilter;
    applyFiltersRef.current(filters);
  }, [readFilter, typeFilter, priorityFilter]);

  // Client-side search
  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const q = searchQuery.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.sender_name?.toLowerCase().includes(q)
    );
  }, [notifications, searchQuery]);

  const hasActiveFilters =
    readFilter !== "all" || !!typeFilter || !!priorityFilter || !!searchQuery;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotifications(1, {});
    const s = await fetchStats();
    if (s) setStats(s);
    setTimeout(() => setIsRefreshing(false), 400);
  }, [fetchNotifications, fetchStats]);

  const handleClearFilters = useCallback(() => {
    setReadFilter("all");
    setTypeFilter(null);
    setPriorityFilter(null);
    setSearchQuery("");
  }, []);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gérez vos notifications et préférences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            Actualiser
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 gap-1.5 text-xs"
            >
              <CheckCircle2 className="size-3.5" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} unreadCount={unreadCount} totalCount={totalCount} />

      {/* Tabs */}
      <div className="flex gap-1">
        {(
          [
            { key: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
            { key: "preferences", label: "Préférences", icon: Settings, badge: 0 },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="ml-0.5 px-1.5 py-px rounded-full bg-background/20 text-[10px] font-semibold">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "notifications" ? (
        <div className="space-y-3">
          <FilterBar
            activeReadFilter={readFilter}
            onReadFilterChange={setReadFilter}
            activeTypeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            activePriorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <Card className="border border-border/50 overflow-hidden">
            {isLoading && filteredNotifications.length === 0 ? (
              <PageSkeleton />
            ) : filteredNotifications.length === 0 ? (
              <FullEmptyState hasFilters={hasActiveFilters} />
            ) : (
              <div>
                {filteredNotifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/30 bg-muted/10">
                <p className="text-[11px] text-muted-foreground">
                  {filteredNotifications.length} sur {totalCount}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPreviousPage}
                    disabled={currentPage <= 1}
                    className="size-7"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <span className="text-[11px] text-muted-foreground px-1.5 tabular-nums">
                    {currentPage}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNextPage}
                    disabled={!hasNext}
                    className="size-7"
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {isLoading && filteredNotifications.length > 0 && (
              <div className="flex justify-center py-3 border-t border-border/30">
                <div className="size-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
              </div>
            )}
          </Card>
        </div>
      ) : (
        preferences && (
          <PreferencesSection preferences={preferences} onSave={savePreferences} />
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------
function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr", { day: "numeric", month: "short" });
}
