"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

// Design Premium SaaS - Scroll Area avec scrollbars stylées

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner className="bg-muted/30" />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-all duration-200",
        // Apparition au hover
        "opacity-0 group-hover:opacity-100",
        "hover:opacity-100",
        // Dimensionnement
        orientation === "vertical" && [
          "h-full w-2",
          "border-l border-l-transparent",
          "p-px",
          "hover:w-3",
        ],
        orientation === "horizontal" && [
          "h-2 flex-col",
          "border-t border-t-transparent",
          "p-px",
          "hover:h-3",
        ],
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className={cn(
          "relative flex-1 rounded-full",
          // Couleur avec gradient subtil
          "bg-gradient-to-b from-muted-foreground/30 to-muted-foreground/40",
          "dark:from-slate-500/40 dark:to-slate-500/50",
          // Hover
          "hover:from-muted-foreground/40 hover:to-muted-foreground/50",
          "dark:hover:from-slate-400/50 dark:hover:to-slate-400/60",
          // Transition
          "transition-colors duration-200"
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
