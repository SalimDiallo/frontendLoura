"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Design Premium SaaS - Tables modernes avec effets élégants
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-x-auto",
        "rounded-xl",
        "border border-border/50 dark:border-slate-700/50",
        "bg-card/50 dark:bg-slate-900/50",
        "backdrop-blur-sm",
        "shadow-lg shadow-black/[0.02] dark:shadow-black/10"
      )}
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-sm border-separate border-spacing-0",
          className
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        // Fond avec gradient subtil
        "[&_tr]:border-b-0",
        "[&_th]:bg-gradient-to-b [&_th]:from-slate-50 [&_th]:to-slate-100/80",
        "[&_th]:dark:from-slate-800/80 [&_th]:dark:to-slate-800/60",
        "[&_th]:backdrop-blur-sm",
        // Première et dernière cellule arrondies
        "[&_tr>th:first-child]:rounded-tl-xl",
        "[&_tr>th:last-child]:rounded-tr-xl",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0",
        "[&_tr]:hover:z-10",
        // Animation des lignes au survol
        "[&_tr]:transition-all [&_tr]:duration-150",
        className
      )}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-gradient-to-b from-muted/30 to-muted/50",
        "border-t border-border/40",
        "font-semibold",
        "[&>tr]:last:border-b-0",
        "[&_tr>td:first-child]:rounded-bl-xl",
        "[&_tr>td:last-child]:rounded-br-xl",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // Hover avec effet de surlignage
        "hover:bg-primary/[0.03] dark:hover:bg-primary/[0.05]",
        "data-[state=selected]:bg-primary/5 dark:data-[state=selected]:bg-primary/10",
        // Bordure inférieure subtile
        "border-b border-border/30 dark:border-slate-700/30",
        // Transition fluide
        "transition-colors duration-150",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ 
  className, 
  "data-active": dataActive, 
  ...props 
}: React.ComponentProps<"th"> & { "data-active"?: boolean }) {
  return (
    <th
      data-slot="table-head"
      data-active={dataActive}
      className={cn(
        // Style de base
        "h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider",
        "text-muted-foreground/80 dark:text-slate-400",
        "whitespace-nowrap",
        // Bordure inférieure stylée
        "border-b-2 border-border/40 dark:border-slate-700/40",
        // Active state (pour tabs)
        dataActive && [
          "text-primary dark:text-primary",
          "border-b-2 border-primary",
          "bg-primary/5 dark:bg-primary/10",
        ],
        // Hover
        !dataActive && "hover:text-foreground hover:bg-muted/50",
        // Checkbox alignment
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        // Cursor
        "cursor-pointer select-none",
        "transition-all duration-150",
        className
      )}
      tabIndex={0}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-4 align-middle",
        "text-sm text-foreground/90",
        "whitespace-nowrap",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "mt-4 text-sm text-muted-foreground/80 italic",
        className
      )}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
