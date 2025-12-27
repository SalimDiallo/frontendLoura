"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

// Design Premium SaaS - Separator avec gradient élégant

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        // Gradient subtil au lieu d'une couleur pleine
        orientation === "horizontal" && [
          "h-px w-full",
          "bg-gradient-to-r from-transparent via-border/60 to-transparent",
        ],
        orientation === "vertical" && [
          "w-px h-full",
          "bg-gradient-to-b from-transparent via-border/60 to-transparent",
        ],
        className
      )}
      {...props}
    />
  )
}

export { Separator }
