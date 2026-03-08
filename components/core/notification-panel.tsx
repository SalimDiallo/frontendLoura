"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  ChevronRight,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/lib/store/notification-store";
import { useNotifications } from "@/lib/hooks/use-notifications";
import type { Notification, NotificationType } from "@/lib/types/notifications";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const typeConfig: Record<
  NotificationType,
  { icon: typeof Bell; color: string; label: string }
> = {
  alert: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-500",
    label: "Alerte",
  },
  system: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-500",
    label: "Système",
  },
  user: {
    icon: User2,
    color: "text-violet-600 dark:text-violet-500",
    label: "Utilisateur",
  },
};

// ---------------------------------------------------------------------------
// Notification Icon
// ---------------------------------------------------------------------------
function NotificationIcon({ type }: { type: NotificationType }) {
  const config = typeConfig[type] || typeConfig.system;
  const Icon = config.icon;
  return (
    <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 shrink-0">
      <Icon className={cn("size-4", config.color)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Priority dot — minimal
// ---------------------------------------------------------------------------
function PriorityDot({ priority }: { priority: Notification["priority"] }) {
  if (priority === "low") return null;
  const colors = {
    low: "",
    medium: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-rose-500",
  };
  return <span className={cn("size-1.5 rounded-full shrink-0", colors[priority])} />;
}

// ---------------------------------------------------------------------------
// Notification item
// ---------------------------------------------------------------------------
function NotificationItem({
  notification,
  onRead,
  onDelete,
  index,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}) {
  const timeAgo = formatTimeAgo(notification.created_at);
  const isUnread = !notification.is_read;
  const [isExiting, setIsExiting] = useState(false);

  const handleDelete = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDelete(notification.id), 200);
  }, [onDelete, notification.id]);

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3",
        "border-b border-border/30 last:border-b-0",
        "transition-all duration-200",
        isExiting && "opacity-0 -translate-x-8 max-h-0 py-0 overflow-hidden",
        isUnread ? "bg-muted/30" : "bg-transparent",
        "hover:bg-muted/40"
      )}
    >
      {/* Unread indicator */}
      {isUnread && (
        <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
      )}

      {/* Icon */}
      <div className="mt-0.5">
        <NotificationIcon type={notification.notification_type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className={cn(
              "text-sm leading-snug truncate",
              isUnread ? "font-medium text-foreground" : "text-foreground/80"
            )}
          >
            {notification.title}
          </p>
          <PriorityDot priority={notification.priority} />
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>

        <div className="flex items-center gap-1.5 mt-1">
          {notification.sender_name && (
            <>
              <span className="text-[11px] text-muted-foreground/70">
                {notification.sender_name}
              </span>
              <span className="text-muted-foreground/30">·</span>
            </>
          )}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <Clock className="size-2.5" />
            {timeAgo}
          </span>
        </div>
      </div>

      {/* Actions on hover */}
      <div
        className={cn(
          "flex shrink-0 items-start gap-0.5 pt-0.5",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-100"
        )}
      >
        {isUnread && (
          <button
            onClick={() => onRead(notification.id)}
            className="p-1 rounded text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
            title="Marquer comme lu"
          >
            <Check className="size-3.5" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel principal
// ---------------------------------------------------------------------------
export function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const params = useParams();
  const slug = params.slug as string;

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
    goToNextPage,
  } = useNotifications();

  useEffect(() => {
    if (open) {
      fetchNotifications(1, {});
      fetchPreferences();
    }
  }, [open, fetchNotifications, fetchPreferences]);

  // Quick filters
  const currentFilters = useNotificationStore((s) => s.filters);
  const activeFilter =
    currentFilters.is_read !== undefined
      ? currentFilters.is_read === false
        ? "unread"
        : "read"
      : "all";

  const setQuickFilter = useCallback(
    (f: "all" | "unread" | "read") => {
      if (f === "all") applyFilters({});
      else if (f === "unread") applyFilters({ is_read: false });
      else applyFilters({ is_read: true });
    },
    [applyFilters]
  );

  const [showPrefs, setShowPrefs] = useState(false);

  // Infinite scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNext || isLoading) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      goToNextPage();
    }
  }, [hasNext, isLoading, goToNextPage]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 flex flex-col">

        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/40">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                <Bell className="size-4 text-foreground" />
              </div>
              <div>
                <SheetTitle className="text-sm font-semibold">
                  Notifications
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                    : "Tout est à jour"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPrefs((v) => !v)}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                showPrefs
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              title="Préférences"
            >
              <Settings className="size-4" />
            </button>
          </div>
        </SheetHeader>

        {/* Preferences (collapsible) */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            showPrefs ? "max-h-40" : "max-h-0"
          )}
        >
          {preferences && (
            <PreferencesBlock preferences={preferences} onSave={savePreferences} />
          )}
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/20">
          <div className="flex gap-1">
            {(["all", "unread", "read"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setQuickFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                  activeFilter === f
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {f === "all" ? "Tout" : f === "unread" ? "Non lues" : "Lues"}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCircle2 className="size-3" />
              Tout lire
            </button>
          )}
        </div>

        {/* List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          {isLoading && notifications.length === 0 ? (
            <LoadingSkeleton />
          ) : notifications.length === 0 ? (
            <EmptyState activeFilter={activeFilter} />
          ) : (
            <div>
              {notifications.map((n, i) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                  index={i}
                />
              ))}
              {isLoading && (
                <div className="flex justify-center py-4">
                  <div className="size-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 px-4 py-2.5">
          <Link
            href={`/apps/${slug}/notifications`}
            onClick={onClose}
            className={cn(
              "flex items-center justify-center gap-2 w-full",
              "px-3 py-2 rounded-lg",
              "text-xs font-medium",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted/40",
              "transition-colors",
              "group"
            )}
          >
            Voir toutes les notifications
            <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          {totalCount > 0 && (
            <p className="text-center text-[11px] text-muted-foreground/50 mt-1.5">
              {totalCount} notification{totalCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Preferences block
// ---------------------------------------------------------------------------
function PreferencesBlock({
  preferences,
  onSave,
}: {
  preferences: import("@/lib/types/notifications").NotificationPreference;
  onSave: (
    data: import("@/lib/types/notifications").NotificationPreferenceUpdate
  ) => Promise<any>;
}) {
  const items = [
    { key: "receive_alerts" as const, label: "Alertes stock", icon: AlertTriangle },
    { key: "receive_system" as const, label: "Système", icon: Info },
    { key: "receive_user" as const, label: "Utilisateurs", icon: User2 },
  ];

  return (
    <div className="mx-4 my-3 p-3 rounded-lg bg-muted/40 border border-border/40">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2.5">
        Recevoir les notifications
      </p>
      <div className="space-y-2">
        {items.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-foreground">{label}</span>
            </div>
            <Switch
              checked={preferences[key]}
              onCheckedChange={(checked) => onSave({ [key]: checked })}
              className="scale-[0.85]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <div className="py-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3 border-b border-border/30">
          <div className="size-8 rounded-lg bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-4/5 rounded bg-muted/60 animate-pulse" />
            <div className="h-2 w-1/4 rounded bg-muted/40 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ activeFilter }: { activeFilter: string }) {
  const messages = {
    all: { title: "Aucune notification", sub: "Rien de nouveau pour le moment." },
    unread: { title: "Tout est lu", sub: "Aucune notification non lue." },
    read: { title: "Aucune notification lue", sub: "Les notifications lues apparaîtront ici." },
  };
  const { title, sub } = messages[activeFilter as keyof typeof messages] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
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
  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}j`;
  return new Date(dateStr).toLocaleDateString("fr", { day: "numeric", month: "short" });
}
