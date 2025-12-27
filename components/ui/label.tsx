"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

// Design Premium SaaS - Label avec typographie moderne

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // Base
        "flex items-center gap-2 text-sm font-semibold leading-none",
        // Couleur avec effet subtil
        "text-foreground/90",
        // Sélection
        "select-none",
        // Transition
        "transition-colors duration-150",
        // États disabled du groupe parent
        "group-data-[disabled=true]:pointer-events-none",
        "group-data-[disabled=true]:opacity-50",
        // États peer (pour les inputs associés)
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        // Optionnel : indicateur d'erreur
        "group-data-[invalid=true]:text-destructive",
        "peer-aria-[invalid=true]:text-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Label }
