"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

// Design Premium SaaS - Tooltip avec glassmorphism et animations modernes

function TooltipProvider({
  delayDuration = 200,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          // Positionnement
          "z-[100] w-fit max-w-xs",
          // Glassmorphism premium
          "bg-slate-900/95 dark:bg-slate-800/95",
          "backdrop-blur-xl",
          // Bordure et forme
          "border border-white/10 dark:border-slate-700/50",
          "rounded-xl",
          // Padding et typographie
          "px-3.5 py-2",
          "text-xs font-medium text-white/90 dark:text-slate-100",
          "leading-relaxed text-center",
          // Ombre premium
          "shadow-xl shadow-black/20 dark:shadow-black/40",
          // Animation d'entrée/sortie
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          "duration-200",
          // Transform origin
          "origin-[var(--radix-tooltip-content-transform-origin)]",
          className
        )}
        {...props}
      >
        {children}
        {/* Arrow stylée */}
        <TooltipPrimitive.Arrow 
          className={cn(
            "fill-slate-900/95 dark:fill-slate-800/95",
            "drop-shadow-sm"
          )} 
          width={12} 
          height={6} 
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
