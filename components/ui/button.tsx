import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Design Premium SaaS - Boutons élégants avec micro-animations et effets visuels modernes
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-xl text-sm font-semibold",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Effet de transformation au hover
    "active:scale-[0.98] transform-gpu",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-r from-primary to-primary/90",
          "text-primary-foreground dark:text-white",
          "shadow-lg shadow-primary/25",
          "hover:shadow-xl hover:shadow-primary/30",
          "hover:from-primary/95 hover:to-primary",
          "border border-primary/20",
        ].join(" "),
        destructive: [
          "bg-gradient-to-r from-rose-500 to-rose-600",
          "text-white",
          "shadow-lg shadow-rose-500/25",
          "hover:shadow-xl hover:shadow-rose-500/30",
          "hover:from-rose-600 hover:to-rose-700",
          "border border-rose-400/20",
        ].join(" "),
        outline: [
          "border-2 border-input/80 bg-background/80",
          "backdrop-blur-sm",
          "hover:bg-accent/80 hover:text-accent-foreground",
          "hover:border-primary/40",
          "shadow-sm hover:shadow-md",
        ].join(" "),
        secondary: [
          "bg-gradient-to-r from-secondary to-secondary/90",
          "text-secondary-foreground",
          "shadow-md shadow-secondary/20",
          "hover:shadow-lg hover:shadow-secondary/30",
          "hover:from-secondary/95 hover:to-secondary",
          "border border-secondary/40",
        ].join(" "),
        ghost: [
          "hover:bg-accent/80 hover:text-accent-foreground",
          "hover:backdrop-blur-sm",
          "rounded-lg",
        ].join(" "),
        link: [
          "text-primary underline-offset-4 hover:underline",
          "hover:text-primary/80",
        ].join(" "),
        // Nouvelles variantes premium
        success: [
          "bg-gradient-to-r from-emerald-500 to-emerald-600",
          "text-white",
          "shadow-lg shadow-emerald-500/25",
          "hover:shadow-xl hover:shadow-emerald-500/30",
          "hover:from-emerald-600 hover:to-emerald-700",
          "border border-emerald-400/20",
        ].join(" "),
        premium: [
          "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500",
          "text-white",
          "shadow-lg shadow-purple-500/30",
          "hover:shadow-xl hover:shadow-purple-500/40",
          "border border-purple-400/20",
          "animate-gradient-x bg-[length:200%_100%]",
        ].join(" "),
        glass: [
          "bg-white/10 dark:bg-white/5",
          "backdrop-blur-xl",
          "border border-white/20 dark:border-white/10",
          "text-foreground",
          "shadow-lg shadow-black/5",
          "hover:bg-white/20 dark:hover:bg-white/10",
          "hover:shadow-xl",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Composant button principal avec design premium
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
