"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

// Design Premium SaaS - Switch avec animations fluides et effets modernes

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Dimensions et forme
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center",
      "rounded-full",
      // Bordure et ombre
      "border-2 border-transparent",
      "shadow-inner shadow-black/5",
      // États
      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-primary/90",
      "data-[state=checked]:shadow-lg data-[state=checked]:shadow-primary/25",
      "data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700",
      // Focus
      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:ring-offset-2",
      // Disabled
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Transition
      "transition-all duration-200 ease-out",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Dimensions et forme
        "pointer-events-none block h-5 w-5 rounded-full",
        // Style du thumb
        "bg-white",
        "shadow-lg shadow-black/10",
        // Ring décoratif subtil
        "ring-0",
        // Translation
        "data-[state=checked]:translate-x-5",
        "data-[state=unchecked]:translate-x-0",
        // Transition avec bounce subtil
        "transition-transform duration-200 ease-out",
        // Effet de scale au hover du parent
        "peer-hover:scale-105",
        "peer-active:scale-95"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
