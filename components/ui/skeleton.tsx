import { cn } from "@/lib/utils"

// Design Premium SaaS - Skeleton avec animation moderne et effets premium

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // Base avec gradient animé
        "relative overflow-hidden",
        "rounded-xl",
        // Fond avec gradient subtil
        "bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60",
        "dark:from-slate-800/60 dark:via-slate-700/40 dark:to-slate-800/60",
        // Animation shimmer premium
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:dark:via-white/5",
        "before:animate-shimmer",
        "before:-translate-x-full",
        // Bordure subtile
        "border border-border/10 dark:border-slate-700/20",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
