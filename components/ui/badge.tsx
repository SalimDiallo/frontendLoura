import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'outline' | 'premium' | 'glass' | "secondary";
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  children: React.ReactNode;
}

// Design Premium SaaS - Badges avec effets modernes et animations
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', pulse = false, children, ...props }, ref) => {
    const variants = {
      default: [
        "bg-secondary/90 text-secondary-foreground",
        "border border-secondary/20",
      ].join(" "),
      secondary:[
        "bg-gradient-to-r from-blue-500/15 to-indigo-500/15",
        "text-blue-700 dark:text-blue-300",
        "border border-blue-500/30 dark:border-blue-400/30",
        "shadow-sm shadow-blue-500/10",
      ].join(),
      success: [
        "bg-gradient-to-r from-emerald-500/15 to-green-500/15",
        "text-emerald-700 dark:text-emerald-300",
        "border border-emerald-500/30 dark:border-emerald-400/30",
        "shadow-sm shadow-emerald-500/10",
      ].join(" "),
      error: [
        "bg-gradient-to-r from-rose-500/15 to-red-500/15",
        "text-rose-700 dark:text-rose-300",
        "border border-rose-500/30 dark:border-rose-400/30",
        "shadow-sm shadow-rose-500/10",
      ].join(" "),
      warning: [
        "bg-gradient-to-r from-amber-500/15 to-orange-500/15",
        "text-amber-700 dark:text-amber-300",
        "border border-amber-500/30 dark:border-amber-400/30",
        "shadow-sm shadow-amber-500/10",
      ].join(" "),
      info: [
        "bg-gradient-to-r from-blue-500/15 to-indigo-500/15",
        "text-blue-700 dark:text-blue-300",
        "border border-blue-500/30 dark:border-blue-400/30",
        "shadow-sm shadow-blue-500/10",
      ].join(" "),
      outline: [
        "bg-transparent",
        "border-2 border-input/80",
        "text-foreground/80",
        "hover:bg-accent/50",
      ].join(" "),
      premium: [
        "bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20",
        "text-purple-700 dark:text-purple-300",
        "border border-purple-500/30 dark:border-purple-400/30",
        "shadow-sm shadow-purple-500/10",
        "animate-gradient-x bg-[length:200%_100%]",
      ].join(" "),
      glass: [
        "bg-white/10 dark:bg-white/5",
        "backdrop-blur-md",
        "border border-white/20 dark:border-white/10",
        "text-foreground",
        "shadow-lg shadow-black/5",
      ].join(" "),
    };

    const sizes = {
      sm: 'px-2.5 py-0.5 text-[10px] font-semibold',
      md: 'px-3 py-1 text-xs font-semibold',
      lg: 'px-4 py-1.5 text-sm font-medium',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full',
          'tracking-wide uppercase',
          'transition-all duration-200 ease-out',
          variants[variant],
          sizes[size],
          pulse && 'animate-pulse',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
