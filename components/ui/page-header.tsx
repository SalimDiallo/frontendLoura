"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

export interface PageHeaderAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  loading?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: PageHeaderAction[];
  backLink?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions = [],
  backLink,
  breadcrumbs,
  badge,
  className = "",
}: PageHeaderProps) {
  const router = useRouter();

  // Fonction de retour - utilise backLink si fourni, sinon router.back()
  const handleBack = () => {
    if (backLink) {
      router.push(backLink);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="size-3.5 text-muted-foreground/50" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors duration-150"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Main header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left side - Back button + Title */}
        <div className="flex items-start gap-4">
          {/* Back button - toujours visible */}
          <button
            onClick={handleBack}
            className={cn(
              "flex items-center justify-center",
              "size-10 rounded-xl",
              "bg-muted/50 hover:bg-muted",
              "text-muted-foreground hover:text-foreground",
              "border border-border/50 hover:border-border",
              "transition-all duration-200",
              "hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "shrink-0 mt-0.5"
            )}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </button>

          {/* Title section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Icon */}
              {Icon && (
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="size-5" />
                </div>
              )}

              {/* Title + Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {title}
                </h1>
                {badge}
              </div>
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              const isLastAction = index === actions.length - 1;

              const buttonContent = (
                <>
                  {ActionIcon && (
                    <ActionIcon
                      className={cn(
                        "size-4",
                        action.loading && "animate-spin"
                      )}
                    />
                  )}
                  <span className={cn(ActionIcon && "hidden sm:inline")}>
                    {action.label}
                  </span>
                </>
              );

              const buttonClassName = cn(
                "gap-2",
                // Le dernier bouton est généralement l'action principale
                isLastAction && actions.length > 1 && "order-first sm:order-last"
              );

              if (action.href) {
                return (
                  <Button
                    key={index}
                    variant={action.variant || "default"}
                    disabled={action.disabled || action.loading}
                    asChild
                    className={buttonClassName}
                  >
                    <Link href={action.href}>{buttonContent}</Link>
                  </Button>
                );
              }

              return (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={buttonClassName}
                >
                  {buttonContent}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant séparé pour un header plus simple (sans actions)
export function PageHeaderSimple({
  title,
  subtitle,
  backLink,
  className,
}: {
  title: string;
  subtitle?: string;
  backLink?: string;
  className?: string;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (backLink) {
      router.push(backLink);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        onClick={handleBack}
        className={cn(
          "flex items-center justify-center",
          "size-9 rounded-lg",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted",
          "transition-all duration-200",
          "active:scale-95"
        )}
        aria-label="Retour"
      >
        <ArrowLeft className="size-5" />
      </button>
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
