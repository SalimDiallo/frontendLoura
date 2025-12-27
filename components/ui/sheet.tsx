"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Design Premium SaaS - Sheet (Drawer) avec glassmorphism et animations modernes

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        // Fond avec blur premium
        "fixed inset-0 z-50",
        "bg-black/40 dark:bg-black/60",
        "backdrop-blur-sm",
        // Animation
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "duration-300",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          // Base
          "fixed z-50 flex flex-col gap-4",
          // Glassmorphism premium
          "bg-background/95 dark:bg-slate-900/95",
          "backdrop-blur-xl",
          // Ombre élégante
          "shadow-2xl shadow-black/10 dark:shadow-black/40",
          // Animation de base
          "transition-all ease-out",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:duration-200 data-[state=open]:duration-300",
          // Positions avec animations spécifiques
          side === "right" && [
            "inset-y-0 right-0 h-full w-3/4 sm:max-w-md",
            "border-l border-border/50 dark:border-slate-700/50",
            "rounded-l-2xl",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          ],
          side === "left" && [
            "inset-y-0 left-0 h-full w-3/4 sm:max-w-md",
            "border-r border-border/50 dark:border-slate-700/50",
            "rounded-r-2xl",
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          ],
          side === "top" && [
            "inset-x-0 top-0 h-auto max-h-[85vh]",
            "border-b border-border/50 dark:border-slate-700/50",
            "rounded-b-2xl",
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          ],
          side === "bottom" && [
            "inset-x-0 bottom-0 h-auto max-h-[85vh]",
            "border-t border-border/50 dark:border-slate-700/50",
            "rounded-t-2xl",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          ],
          className
        )}
        {...props}
      >
        {children}
        {/* Bouton de fermeture premium */}
        <SheetPrimitive.Close
          className={cn(
            "absolute top-4 right-4",
            "rounded-full p-2",
            "bg-muted/50 hover:bg-muted",
            "text-muted-foreground hover:text-foreground",
            "transition-all duration-200",
            "hover:scale-105 active:scale-95",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none",
            "disabled:pointer-events-none"
          )}
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex flex-col gap-2 p-6 pb-4",
        // Séparation subtile
        "relative",
        "after:absolute after:bottom-0 after:left-6 after:right-6",
        "after:h-px after:bg-gradient-to-r after:from-transparent after:via-border/60 after:to-transparent",
        className
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto flex flex-col gap-3 p-6 pt-4",
        // Séparation subtile
        "relative",
        "before:absolute before:top-0 before:left-6 before:right-6",
        "before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/60 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "text-xl font-bold leading-none tracking-tight",
        "text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn(
        "text-sm text-muted-foreground/90 leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
