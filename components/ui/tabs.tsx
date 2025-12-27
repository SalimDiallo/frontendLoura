"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

// Design Premium SaaS - Tabs modernes avec animations élégantes

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Container avec glassmorphism
        "inline-flex items-center justify-start",
        "h-12 w-fit p-1.5",
        "bg-muted/60 dark:bg-slate-800/60",
        "backdrop-blur-sm",
        "rounded-xl",
        "border border-border/30 dark:border-slate-700/40",
        // Ombre subtile
        "shadow-inner shadow-black/[0.02]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styling
        "inline-flex items-center justify-center gap-2",
        "h-full flex-1 px-4 py-2",
        "rounded-lg",
        "text-sm font-semibold",
        "whitespace-nowrap",
        // Couleurs par défaut
        "text-muted-foreground",
        // Transition
        "transition-all duration-200 ease-out",
        // Hover
        "hover:text-foreground hover:bg-background/50",
        // Active state - design premium
        "data-[state=active]:bg-background dark:data-[state=active]:bg-slate-900",
        "data-[state=active]:text-foreground",
        "data-[state=active]:shadow-md data-[state=active]:shadow-black/5",
        "data-[state=active]:border data-[state=active]:border-border/50 dark:data-[state=active]:border-slate-700/50",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-50",
        // Icons
        "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        // Animation d'entrée
        "animate-in fade-in-50 slide-in-from-bottom-1",
        "duration-200",
        // Layout
        "flex-1 outline-none",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
