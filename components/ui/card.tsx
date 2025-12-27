import * as React from "react";

import { cn } from "@/lib/utils";

// Design Premium SaaS - Cards avec glassmorphism et effets élégants
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Base avec glassmorphism subtil
        "bg-card/95 dark:bg-slate-900/90 text-card-foreground",
        "backdrop-blur-xl",
        // Bordure premium avec gradient subtil
        "border border-border/50 dark:border-slate-700/50",
        "rounded-2xl",
        // Ombre moderne et effet de profondeur
        "shadow-xl shadow-black/[0.03] dark:shadow-black/20",
        // Animation au hover
        "transition-all duration-300 ease-out",
        "hover:shadow-2xl hover:shadow-black/[0.05] dark:hover:shadow-black/30",
        "hover:border-border/80 dark:hover:border-slate-600/60",
        "hover:-translate-y-0.5",
        // Overflow pour contenu
        "overflow-hidden",
        // Positionnement pour effets
        "relative",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-2 p-6 pb-4",
        // Séparation subtile du header
        "relative",
        "after:absolute after:bottom-0 after:left-6 after:right-6",
        "after:h-px after:bg-gradient-to-r after:from-transparent after:via-border/60 after:to-transparent",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-lg font-bold leading-none tracking-tight",
        "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-sm text-muted-foreground/90 leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "flex items-center gap-2",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-4", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-4 p-6 pt-4",
        // Séparation subtile du footer
        "relative",
        "before:absolute before:top-0 before:left-6 before:right-6",
        "before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/60 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};