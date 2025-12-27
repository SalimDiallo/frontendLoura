"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Design Premium SaaS - Dropdown Menu avec glassmorphism et animations modernes

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          // Dimensions et positionnement
          "z-50 min-w-[12rem] overflow-hidden",
          "max-h-[var(--radix-dropdown-menu-content-available-height)]",
          // Glassmorphism premium
          "bg-background/95 dark:bg-slate-900/95",
          "backdrop-blur-xl",
          // Bordure et forme
          "border border-border/60 dark:border-slate-700/60",
          "rounded-xl",
          // Ombre premium
          "shadow-2xl shadow-black/10 dark:shadow-black/40",
          // Padding
          "p-1.5",
          // Animation
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          "origin-[var(--radix-dropdown-menu-content-transform-origin)]",
          "duration-200",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // Base
        "relative flex cursor-pointer select-none items-center gap-3",
        "rounded-lg px-3 py-2.5 text-sm font-medium",
        "outline-none",
        // Transition
        "transition-colors duration-150",
        // Default variant
        variant === "default" && [
          "text-foreground/90",
          "focus:bg-primary/10 focus:text-primary",
          "hover:bg-accent/80",
          "[&_svg:not([class*='text-'])]:text-muted-foreground",
        ],
        // Destructive variant
        variant === "destructive" && [
          "text-rose-600 dark:text-rose-400",
          "focus:bg-rose-500/10 focus:text-rose-700 dark:focus:text-rose-300",
          "hover:bg-rose-500/5",
          "[&_svg]:text-rose-500",
        ],
        // Disabled
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Inset
        inset && "pl-9",
        // Icons
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        // Base
        "relative flex cursor-pointer select-none items-center gap-3",
        "rounded-lg py-2.5 pr-3 pl-9 text-sm font-medium",
        "outline-none",
        // Transition
        "transition-colors duration-150",
        // Hover et focus
        "focus:bg-primary/10 focus:text-primary",
        "hover:bg-accent/80",
        // Disabled
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Icons
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-3 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        // Base
        "relative flex cursor-pointer select-none items-center gap-3",
        "rounded-lg py-2.5 pr-3 pl-9 text-sm font-medium",
        "outline-none",
        // Transition
        "transition-colors duration-150",
        // Hover et focus
        "focus:bg-primary/10 focus:text-primary",
        "hover:bg-accent/80",
        // Disabled
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Icons
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="absolute left-3 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-primary text-primary" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-3 py-2 text-xs font-bold uppercase tracking-wider",
        "text-muted-foreground/70",
        inset && "pl-9",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        "-mx-1 my-1.5 h-px",
        "bg-gradient-to-r from-transparent via-border/60 to-transparent",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest",
        "text-muted-foreground/60",
        "px-1.5 py-0.5 rounded-md",
        "bg-muted/50",
        "font-mono",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        // Base
        "flex cursor-pointer select-none items-center gap-3",
        "rounded-lg px-3 py-2.5 text-sm font-medium",
        "outline-none",
        // Transition
        "transition-colors duration-150",
        // Hover et focus
        "focus:bg-primary/10 focus:text-primary",
        "data-[state=open]:bg-accent/80",
        "hover:bg-accent/80",
        // Icons
        "[&_svg:not([class*='text-'])]:text-muted-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        inset && "pl-9",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4 opacity-60" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        // Dimensions
        "z-50 min-w-[10rem] overflow-hidden",
        // Glassmorphism premium
        "bg-background/95 dark:bg-slate-900/95",
        "backdrop-blur-xl",
        // Bordure et forme
        "border border-border/60 dark:border-slate-700/60",
        "rounded-xl",
        // Ombre premium
        "shadow-xl shadow-black/10 dark:shadow-black/30",
        // Padding
        "p-1.5",
        // Animation
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        "origin-[var(--radix-dropdown-menu-content-transform-origin)]",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
