import * as React from "react"

import { cn } from "@/lib/utils"

// Design Premium SaaS - Inputs élégants avec effets de focus modernes
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        // Base styling
        "flex h-11 w-full rounded-xl px-4 py-3 text-sm",
        // Couleurs avec glassmorphism subtil
        "bg-background/80 dark:bg-slate-900/80",
        "backdrop-blur-sm",
        // Bordure premium
        "border-2 border-input/60 dark:border-slate-700/60",
        // Placeholder élégant
        "placeholder:text-muted-foreground/60 placeholder:font-normal",
        // États de focus premium avec anneau
        "focus-visible:outline-none",
        "focus-visible:border-primary/60",
        "focus-visible:ring-4 focus-visible:ring-primary/10",
        "focus-visible:bg-background dark:focus-visible:bg-slate-900",
        // État disabled
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
        // File input styling
        "file:border-0 file:bg-primary/10 file:text-primary",
        "file:text-sm file:font-semibold file:mr-4 file:px-4 file:py-2",
        "file:rounded-lg file:cursor-pointer",
        "file:hover:bg-primary/20",
        // Transition fluide
        "transition-all duration-200 ease-out",
        // Ombre subtile au focus
        "hover:border-input/80 dark:hover:border-slate-600/80",
        "hover:shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
