"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
} from "react-icons/hi2";

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void | Promise<void>;
}

interface QuickActionsPanelProps {
  title?: string;
  subtitle?: string;
  actions: QuickAction[];
  className?: string;
  compact?: boolean;
}

const variantStyles = {
  default: "bg-primary hover:bg-primary/90 text-primary-foreground",
  success: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/25",
  warning: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25",
  danger: "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-500/25",
  info: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/25",
};

/**
 * Panneau d'actions rapides avec design moderne et animations
 */
export function QuickActionsPanel({
  title = "Actions Rapides",
  subtitle,
  actions,
  className,
  compact = false,
}: QuickActionsPanelProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (action: QuickAction) => {
    if (action.disabled || processingId) return;
    
    try {
      setProcessingId(action.id);
      await action.onClick();
    } finally {
      setProcessingId(null);
    }
  };

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {actions.map((action) => (
          <Button
            key={action.id}
            size="sm"
            className={cn(
              "gap-2 shadow-lg transition-all duration-200 hover:scale-105",
              variantStyles[action.variant || "default"]
            )}
            disabled={action.disabled || processingId === action.id}
            onClick={() => handleAction(action)}
          >
            {processingId === action.id ? (
              <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              action.icon
            )}
            {action.label}
            {action.shortcut && (
              <kbd className="ml-1 hidden lg:inline-flex h-5 items-center rounded border border-white/30 bg-white/10 px-1 font-mono text-xs">
                {action.shortcut}
              </kbd>
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Card className={cn("border-0 shadow-sm overflow-hidden", className)}>
      {/* Header avec effet de gradient subtil */}
      <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b">
        <div className="flex items-center gap-2">
          <HiOutlineBolt className="size-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>

      {/* Actions Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            className={cn(
              "group relative p-4 rounded-xl text-left transition-all duration-300",
              "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              action.disabled && "opacity-50 cursor-not-allowed",
              !action.disabled && "cursor-pointer",
              // Fond avec gradient selon la variante
              action.variant === "success" && "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800",
              action.variant === "warning" && "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800",
              action.variant === "danger" && "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800",
              action.variant === "info" && "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800",
              !action.variant && "bg-muted/50 hover:bg-muted border border-border"
            )}
            disabled={action.disabled || processingId === action.id}
            onClick={() => handleAction(action)}
          >
            {/* Indicateur de chargement ou icône */}
            <div className={cn(
              "size-10 rounded-lg flex items-center justify-center mb-3",
              action.variant === "success" && "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
              action.variant === "warning" && "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
              action.variant === "danger" && "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400",
              action.variant === "info" && "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
              !action.variant && "bg-primary/10 text-primary"
            )}>
              {processingId === action.id ? (
                <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                action.icon
              )}
            </div>

            {/* Label et description */}
            <div>
              <div className="font-medium flex items-center gap-2">
                {action.label}
                {action.shortcut && (
                  <kbd className="hidden lg:inline-flex h-5 items-center rounded border bg-background px-1.5 font-mono text-xs text-muted-foreground">
                    {action.shortcut}
                  </kbd>
                )}
              </div>
              {action.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {action.description}
                </p>
              )}
            </div>

            {/* Effet hover */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </div>
    </Card>
  );
}

/**
 * Version inline pour les listes avec actions rapides
 */
export function QuickActionButtons({
  actions,
  size = "sm",
}: {
  actions: QuickAction[];
  size?: "sm" | "default" | "lg";
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (action: QuickAction) => {
    if (action.disabled || processingId) return;
    try {
      setProcessingId(action.id);
      await action.onClick();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          size={size}
          className={cn(
            "gap-1.5 shadow transition-transform hover:scale-105 active:scale-95",
            variantStyles[action.variant || "default"]
          )}
          disabled={action.disabled || processingId === action.id}
          onClick={() => handleAction(action)}
        >
          {processingId === action.id ? (
            <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            action.icon
          )}
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
