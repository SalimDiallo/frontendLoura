"use client"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsMobile } from "@/lib/hooks/use-mobile"
import { cn } from "@/lib/utils"

// ============================================
// DESIGN PREMIUM SAAS - SIDEBAR PROFESSIONNELLE
// ============================================

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "5rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "s"
const SIDEBAR_MARGIN = "1rem" // Marge pour détacher la sidebar

type SidebarContextProps = {
  state: "expanded" | "icon" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  viewMode: "expanded" | "icon" | "collapsed"
  setViewMode: (mode: "expanded" | "icon" | "collapsed") => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"expanded" | "icon" | "collapsed">("expanded")

  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((open) => !open)
    } else {
      // Cycle entre les 3 états: expanded -> icon -> collapsed -> expanded
      setViewMode((current) => {
        if (current === "expanded") return "icon"
        if (current === "icon") return "collapsed"
        return "expanded"
      })
    }
  }, [isMobile])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  const state = viewMode

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      viewMode,
      setViewMode,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, viewMode]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              "--sidebar-margin": SIDEBAR_MARGIN,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

// Styles de base premium pour la sidebar - Design unique organisation pro
const SIDEBAR_STYLES = {
  bg: "bg-white/98 dark:bg-slate-950/98",
  text: "text-slate-900 dark:text-slate-50",
  border: "border-r-2 border-slate-100 dark:border-slate-900",
  backdrop: "backdrop-blur-xl",
  innerBorder: "shadow-[inset_-1px_0_0_0] shadow-slate-200/50 dark:shadow-slate-800/30",
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col",
          SIDEBAR_STYLES.bg,
          SIDEBAR_STYLES.text,
          SIDEBAR_STYLES.border,
          SIDEBAR_STYLES.backdrop,
          SIDEBAR_STYLES.innerBorder,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className={cn(
            "w-(--sidebar-width) p-0 [&>button]:hidden",
            SIDEBAR_STYLES.bg,
            SIDEBAR_STYLES.text,
            SIDEBAR_STYLES.backdrop
          )}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className={cn(
        "group peer hidden md:block",
        SIDEBAR_STYLES.text,
      )}
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : state === "icon" ? "icon" : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative bg-transparent",
          // État expanded
          "w-[calc(var(--sidebar-width)+var(--sidebar-margin)*2)]",
          // État icon
          "group-data-[state=icon]:w-[calc(var(--sidebar-width-icon)+var(--sidebar-margin)*2)]",
          // État collapsed (complètement caché)
          "group-data-[state=collapsed]:w-0",
          "group-data-[side=right]:rotate-180"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed z-10 hidden md:flex",
          // Positionnement avec marges
          "inset-y-(--sidebar-margin)",
          side === "left"
            ? "left-(--sidebar-margin)"
            : "right-(--sidebar-margin)",
          // Largeur selon l'état
          "w-(--sidebar-width)",
          "group-data-[state=icon]:w-(--sidebar-width-icon)",
          "group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0",
          // Transitions
          "transition-all duration-300 ease-out",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className={cn(
            "flex h-full w-full flex-col overflow-hidden",
            SIDEBAR_STYLES.bg,
            SIDEBAR_STYLES.backdrop,
            SIDEBAR_STYLES.innerBorder,
            // Design détaché avec bordures arrondies
            "rounded-xl",
            "border-2 border-slate-100 dark:border-slate-900",
            // Padding interne
            "p-3",
            "group-data-[state=icon]:p-2"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar, viewMode } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn(
        "size-8 rounded-md shrink-0",
        "text-slate-600 dark:text-slate-400",
        "hover:bg-slate-100 hover:text-slate-900",
        "dark:hover:bg-slate-900 dark:hover:text-slate-100",
        "transition-transform duration-200",
        viewMode === "icon" && "scale-90",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      {viewMode === "expanded" ? (
        <ChevronsLeft className="size-4" />
      ) : viewMode === "icon" ? (
        <ChevronsLeft className="size-4 opacity-50" />
      ) : (
        <ChevronsRight className="size-4" />
      )}
      <span className="sr-only">Toggle Sidebar (Expanded → Icons → Collapsed)</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-3 -translate-x-1/2 sm:flex",
        "group-data-[side=left]:-right-3 group-data-[side=right]:left-0",
        // Rail indicator minimaliste
        "after:absolute after:inset-y-0 after:left-1/2 after:w-[1px]",
        "after:bg-transparent",
        // Hover effects
        "hover:after:bg-slate-200 dark:hover:after:bg-slate-800",
        // Cursor
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize",
        "[[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        // Collapsible offcanvas
        "group-data-[collapsible=offcanvas]:translate-x-0",
        "group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-3 md:peer-data-[variant=inset]:ml-0",
        "md:peer-data-[variant=inset]:rounded-xl",
        "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-3",
        "md:peer-data-[variant=inset]:peer-data-[state=icon]:ml-0",
        "md:peer-data-[variant=inset]:border-2 md:peer-data-[variant=inset]:border-slate-100",
        "md:peer-data-[variant=inset]:dark:border-slate-900",
        className
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn(
        "h-9 w-full px-3",
        "bg-slate-50 dark:bg-slate-900/50",
        "border-0 border-b-2 border-transparent",
        "rounded-md",
        "text-sm",
        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
        "focus-visible:outline-none focus-visible:border-slate-900 dark:focus-visible:border-slate-100",
        "focus-visible:bg-slate-100 dark:focus-visible:bg-slate-900",
        "group-data-[state=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn(
        "flex flex-col gap-4 px-3 py-5",
        // Bordure gauche accent + fond
        "relative",
        "border-b border-slate-100 dark:border-slate-900",
        "bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/30 dark:to-transparent",
        "before:absolute before:left-0 before:top-4 before:bottom-4",
        "before:w-[3px] before:bg-slate-900 dark:before:bg-slate-100",
        "before:rounded-r-full",
        // Mode icon - logo centré
        "group-data-[state=icon]:px-0 group-data-[state=icon]:py-4 group-data-[state=icon]:justify-center group-data-[state=icon]:items-center",
        "group-data-[state=icon]:before:hidden",
        "group-data-[state=icon]:bg-gradient-to-br group-data-[state=icon]:from-slate-100 dark:group-data-[state=icon]:from-slate-900/50",
        className
      )}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn(
        "flex flex-col gap-3 px-3 py-4 mt-auto",
        // Bordure haut
        "relative",
        "border-t border-slate-100 dark:border-slate-900",
        "bg-gradient-to-tr from-slate-50/30 to-transparent dark:from-slate-900/20 dark:to-transparent",
        // Mode icon
        "group-data-[state=icon]:px-0 group-data-[state=icon]:py-3 group-data-[state=icon]:items-center",
        className
      )}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn(
        "mx-2 w-auto h-px my-1",
        "bg-slate-100 dark:bg-slate-900",
        "group-data-[state=icon]:mx-1",
        className
      )}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto py-2 px-1",
        "group-data-[state=icon]:overflow-y-auto group-data-[state=icon]:overflow-x-hidden",
        "group-data-[state=icon]:px-0",
        // Custom scrollbar minimaliste
        "scrollbar-thin scrollbar-track-transparent",
        "scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col px-2 py-1.5",
        "group-data-[state=icon]:px-0 group-data-[state=icon]:items-center",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "flex h-7 shrink-0 items-center px-2 mb-1.5 mt-0.5",
        "text-[11px] font-bold uppercase tracking-wide",
        "text-slate-400 dark:text-slate-500",
        "outline-hidden",
        "[&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:mr-2",
        "group-data-[state=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "absolute top-1.5 right-1 flex aspect-square w-6 items-center justify-center",
        "rounded-md p-0",
        "text-slate-400 dark:text-slate-500",
        "outline-hidden",
        "hover:bg-slate-100 hover:text-slate-900",
        "dark:hover:bg-slate-900 dark:hover:text-slate-100",
        "[&>svg]:size-3.5 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[state=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn(
        "flex w-full min-w-0 flex-col gap-0.5",
        "group-data-[state=icon]:gap-1",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

// Variantes premium pour les boutons de menu - Design unique avec barre latérale
const sidebarMenuButtonVariants = cva(
  [
    // Base avec bordure gauche pour l'indicateur
    "peer/menu-button relative flex w-full items-center gap-2.5 overflow-hidden",
    "mx-0 px-3 py-2 rounded-md",
    "text-left text-[13px] font-medium outline-hidden",
    // Bordure latérale indicatrice (invisible par défaut)
    "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
    "before:h-0 before:w-[3px] before:rounded-r-full",
    "before:bg-slate-900 dark:before:bg-slate-100",
    // States
    "disabled:pointer-events-none disabled:opacity-40",
    "aria-disabled:pointer-events-none aria-disabled:opacity-40",
    // Menu action
    "group-has-data-[sidebar=menu-action]/menu-item:pr-9",
    // Icon mode - seulement icônes, IMPORTANT: les icônes SVG restent visibles
    "group-data-[state=icon]:!w-10 group-data-[state=icon]:!h-10 group-data-[state=icon]:min-w-10",
    "group-data-[state=icon]:mx-auto group-data-[state=icon]:!p-2",
    "group-data-[state=icon]:justify-center group-data-[state=icon]:items-center",
    "group-data-[state=icon]:[&>span:not(.sr-only)]:!hidden",
    "group-data-[state=icon]:before:hidden",
    // Icon en mode icon - plus grand
    "group-data-[state=icon]:[&>svg]:!size-5",
    // Text and icons
    "[&>span:last-child]:truncate",
    "[&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:flex-shrink-0",
    "[&>svg]:text-slate-500 dark:[&>svg]:text-slate-400",
    // Default text color
    "text-slate-600 dark:text-slate-400",
    // Hover
    "hover:bg-slate-50 hover:text-slate-900",
    "dark:hover:bg-slate-900/50 dark:hover:text-slate-100",
    "hover:[&>svg]:text-slate-700 dark:hover:[&>svg]:text-slate-300",
    // Active state avec barre latérale
    "data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900",
    "data-[active=true]:font-semibold",
    "data-[active=true]:[&>svg]:text-slate-900",
    "data-[active=true]:before:h-[60%]",
    "dark:data-[active=true]:bg-slate-900 dark:data-[active=true]:text-slate-50",
    "dark:data-[active=true]:[&>svg]:text-slate-50",
    // State open
    "data-[state=open]:bg-slate-50 dark:data-[state=open]:bg-slate-900/50",
  ],
  {
    variants: {
      variant: {
        default: "",
        outline: [
          "border border-slate-200 dark:border-slate-800",
        ].join(" "),
      },
      size: {
        default: "min-h-[2.25rem]",
        sm: "min-h-[2rem] text-xs py-1.5",
        lg: "min-h-[2.75rem] text-sm py-2.5 group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button"
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state === "expanded" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "absolute top-1/2 -translate-y-1/2 right-1 flex aspect-square w-6 items-center justify-center",
        "rounded-md p-0",
        "text-slate-400 dark:text-slate-500",
        "outline-hidden",
        "hover:bg-slate-200 hover:text-slate-900",
        "dark:hover:bg-slate-800 dark:hover:text-slate-100",
        "peer-hover/menu-button:text-slate-600 dark:peer-hover/menu-button:text-slate-400",
        "[&>svg]:size-3.5 [&>svg]:shrink-0",
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[state=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-slate-900 dark:peer-data-[active=true]/menu-button:text-slate-50 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute top-1/2 -translate-y-1/2 right-1.5",
        "flex h-5 min-w-5 items-center justify-center",
        "rounded-md px-1.5",
        "text-[10px] font-bold tabular-nums",
        "bg-slate-900 text-white",
        "dark:bg-slate-100 dark:text-slate-900",
        "select-none",
        "peer-data-[active=true]/menu-button:bg-slate-900 peer-data-[active=true]/menu-button:text-white",
        "dark:peer-data-[active=true]/menu-button:bg-slate-100 dark:peer-data-[active=true]/menu-button:text-slate-900",
        "group-data-[state=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex min-h-[2.25rem] items-center gap-2.5 rounded-md mx-1 px-3", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-[18px] rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-3.5 max-w-(--skeleton-width) flex-1 rounded-md"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarLogo({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-logo"
      data-sidebar="logo"
      className={cn(
        "flex items-center justify-center gap-3 px-2 py-1 mb-2",
        "font-bold text-base",
        "text-slate-900 dark:text-slate-50",
        // Mode expanded - logo + texte
        "group-data-[state=expanded]:justify-start",
        // Mode icon - logo seul centré, plus grand
        "group-data-[state=icon]:justify-center",
        "group-data-[state=icon]:[&>span:not(.sr-only)]:!hidden",
        "group-data-[state=icon]:[&>svg]:!size-8",
        "group-data-[state=icon]:mb-0",
        // Icône
        "[&>svg]:size-6 [&>svg]:shrink-0",
        "[&>svg]:text-slate-900 dark:[&>svg]:text-slate-100",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "flex min-w-0 flex-col gap-0.5 pl-8 pr-2 py-1",
        "group-data-[state=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "relative flex min-h-[1.875rem] min-w-0 items-center gap-2 overflow-hidden",
        "rounded-md px-2 py-1",
        "text-xs font-medium",
        "text-slate-500 dark:text-slate-400",
        "outline-hidden",
        // Point à gauche
        "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
        "before:size-1 before:rounded-full before:bg-slate-300 dark:before:bg-slate-600",
        "hover:before:bg-slate-900 dark:hover:before:bg-slate-100",
        "hover:bg-slate-50 hover:text-slate-900",
        "dark:hover:bg-slate-900/50 dark:hover:text-slate-100",
        "disabled:pointer-events-none disabled:opacity-40",
        "aria-disabled:pointer-events-none aria-disabled:opacity-40",
        "[&>span:last-child]:truncate [&>svg]:size-3.5 [&>svg]:shrink-0",
        "[&>svg]:text-slate-400 dark:[&>svg]:text-slate-500",
        // Active state
        "data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900",
        "data-[active=true]:font-semibold",
        "data-[active=true]:before:bg-slate-900 data-[active=true]:before:scale-150",
        "dark:data-[active=true]:bg-slate-900 dark:data-[active=true]:text-slate-50",
        "dark:data-[active=true]:before:bg-slate-100",
        size === "sm" && "text-[11px] min-h-[1.625rem]",
        "group-data-[state=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarLogo,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
}
