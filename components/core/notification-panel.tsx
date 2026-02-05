"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/lib/store/notification-store";
import { useNotifications } from "@/lib/hooks/use-notifications";
import type { Notification, NotificationType } from "@/lib/types/notifications";

// ---------------------------------------------------------------------------
// Icône selon le type de notification
// ---------------------------------------------------------------------------

function NotificationIcon({ type }: { type: NotificationType }) {
  const base = "size-4";
  switch (type) {
    case "alert":
      return <AlertTriangle className={cn(base, "text-amber-500")} />;
    case "system":
      return <Info className={cn(base, "text-blue-500")} />;
    case "user":
      return <User2 className={cn(base, "text-violet-500")} />;
  }
}

// Badge de priorité
function PriorityBadge({ priority }: { priority: Notification["priority"] }) {
  const map = {
    low: { label: "Faible", variant: "info" as const },
    medium: { label: "Moyenne", variant: "warning" as const },
    high: { label: "Haute", variant: "error" as const },
    critical: { label: "Critique", variant: "error" as const },
  };
  const { label, variant } = map[priority];
  return (
    <Badge variant={variant} size="sm">
      {label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Une ligne de notification
// ---------------------------------------------------------------------------

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const timeAgo = formatTimeAgo(notification.created_at);

  return (
    <div
      className={cn(
        "group relative flex gap-3 p-3",
        "rounded-xl transition-all duration-200",
        "hover:bg-muted/60",
        !notification.is_read && "bg-muted/30"
      )}
    >
      {/* Indicateur non lu */}
      {!notification.is_read && (
        <span className="absolute top-4 left-3 size-2 rounded-full bg-blue-500 shrink-0" />
      )}

      {/* Icône type */}
      <div
        className={cn(
          "mt-0.5 flex shrink-0 size-8 items-center justify-center rounded-lg",
          notification.notification_type === "alert" && "bg-amber-500/10",
          notification.notification_type === "system" && "bg-blue-500/10",
          notification.notification_type === "user" && "bg-violet-500/10"
        )}
      >
        <NotificationIcon type={notification.notification_type} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug",
              notification.is_read
                ? "text-muted-foreground"
                : "font-semibold text-foreground"
            )}
          >
            {notification.title}
          </p>
          <PriorityBadge priority={notification.priority} />
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
          {notification.message}
        </p>

        {/* Expéditeur + temps */}
        <div className="flex items-center gap-2 mt-1.5">
          {notification.sender_name && (
            <span className="text-[11px] text-muted-foreground/70">
              Par {notification.sender_name}
            </span>
          )}
          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground/50">
            <Clock className="size-2.5" />
            {timeAgo}
          </span>
        </div>
      </div>

      {/* Actions (apparaissent au hover) */}
      <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-col gap-1">
        {!notification.is_read && (
          <button
            onClick={() => onRead(notification.id)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Marquer comme lu"
          >
            <Check className="size-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
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
  } = useNotifications();

  // Fetch à chaque ouverture du panel
  useEffect(() => {
    if (open) {
      fetchNotifications(1, {});
      fetchPreferences();
    }
  }, [open, fetchNotifications, fetchPreferences]);

  // --- Filtres rapides ------------------------------------------------------
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

  // --- Préférences panel ---------------------------------------------------
  const [showPrefs, setShowPrefs] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 flex flex-col">
        {/* Header du panel */}
        <SheetHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10">
                <Bell className="size-4 text-blue-500" />
              </div>
              <div>
                <SheetTitle className="text-base">Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {unreadCount} non lu{unreadCount > 1 ? "es" : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Bouton préférences */}
            <button
              onClick={() => setShowPrefs((v) => !v)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Préférences"
            >
              <Settings className="size-4" />
            </button>
          </div>
        </SheetHeader>

        {/* Préférences dépliable */}
        {showPrefs && preferences && (
          <PreferencesBlock
            preferences={preferences}
            onSave={savePreferences}
          />
        )}

        {/* Filtres rapides */}
        <div className="flex items-center gap-1.5 px-5 pb-3">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setQuickFilter(f)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150",
                activeFilter === f
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted/60"
              )}
            >
              {f === "all" ? "Tout" : f === "unread" ? "Non lu" : "Lu"}
            </button>
          ))}

          {/* Marquer tout comme lu */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <CheckCircle2 className="size-3" />
              Tout lire
            </button>
          )}
        </div>

        {/* Séparateur */}
        <div className="h-px bg-border/40 mx-5" />

        {/* Liste des notifications */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Chargement…</p>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState />
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </div>

        {/* Footer — compteur */}
        {totalCount > 0 && (
          <div className="border-t border-border/40 mx-5 pt-3 pb-4">
            <p className="text-center text-[11px] text-muted-foreground/60">
              {totalCount} notification{totalCount > 1 ? "s" : ""} au total
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Bloc préférences (compact)
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
  const toggle = (key: "receive_alerts" | "receive_system" | "receive_user") => {
    onSave({ [key]: !preferences[key] });
  };

  const items = [
    { key: "receive_alerts" as const, label: "Alertes de stock" },
    { key: "receive_system" as const, label: "Système" },
    { key: "receive_user" as const, label: "Utilisateurs" },
  ];

  return (
    <div className="mx-5 mb-3 p-3 rounded-xl bg-muted/40 border border-border/30">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Préférences
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all duration-150",
              preferences[key]
                ? "bg-foreground/10 text-foreground border border-foreground/20"
                : "bg-muted/60 text-muted-foreground border border-border/30"
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                preferences[key] ? "bg-emerald-500" : "bg-muted-foreground/40"
              )}
            />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
        <Bell className="size-6 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Aucune notification</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Vous êtes à jour — rien de nouveau pour le moment.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Util : temps écoulé
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
  return new Date(dateStr).toLocaleDateString("fr", {
    day: "numeric",
    month: "short",
  });
}

