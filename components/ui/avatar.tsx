"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

// Design Premium SaaS - Avatar avec effets modernes et animations

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        // Base
        "relative flex shrink-0 overflow-hidden",
        // Forme et taille
        "size-10 rounded-full",
        // Bordure premium
        "ring-2 ring-background",
        "border-2 border-border/30 dark:border-slate-700/50",
        // Ombre
        "shadow-md shadow-black/5",
        // Transition
        "transition-all duration-200",
        "hover:ring-4 hover:ring-primary/20",
        "hover:scale-105",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        // Layout
        "flex size-full items-center justify-center",
        // Forme
        "rounded-full",
        // Gradient de fond premium
        "bg-gradient-to-br from-primary/20 to-primary/10",
        "dark:from-primary/30 dark:to-primary/20",
        // Texte
        "text-sm font-bold text-primary dark:text-primary-foreground",
        "uppercase tracking-wider",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
