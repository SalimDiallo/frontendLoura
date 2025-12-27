import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Design Premium SaaS - Alerts modernes avec glassmorphism et animations

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, onClose, ...props }, ref) => {
    const variants = {
      success: {
        container: [
          'bg-gradient-to-r from-emerald-50/90 to-green-50/90',
          'dark:from-emerald-950/50 dark:to-green-950/50',
          'border-emerald-200/80 dark:border-emerald-700/50',
          'shadow-emerald-500/10',
        ].join(' '),
        icon: 'text-emerald-500 dark:text-emerald-400',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        title: 'text-emerald-800 dark:text-emerald-200',
        message: 'text-emerald-700 dark:text-emerald-300',
      },
      error: {
        container: [
          'bg-gradient-to-r from-rose-50/90 to-red-50/90',
          'dark:from-rose-950/50 dark:to-red-950/50',
          'border-rose-200/80 dark:border-rose-700/50',
          'shadow-rose-500/10',
        ].join(' '),
        icon: 'text-rose-500 dark:text-rose-400',
        iconBg: 'bg-rose-100 dark:bg-rose-900/50',
        title: 'text-rose-800 dark:text-rose-200',
        message: 'text-rose-700 dark:text-rose-300',
      },
      warning: {
        container: [
          'bg-gradient-to-r from-amber-50/90 to-orange-50/90',
          'dark:from-amber-950/50 dark:to-orange-950/50',
          'border-amber-200/80 dark:border-amber-700/50',
          'shadow-amber-500/10',
        ].join(' '),
        icon: 'text-amber-500 dark:text-amber-400',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        title: 'text-amber-800 dark:text-amber-200',
        message: 'text-amber-700 dark:text-amber-300',
      },
      info: {
        container: [
          'bg-gradient-to-r from-blue-50/90 to-indigo-50/90',
          'dark:from-blue-950/50 dark:to-indigo-950/50',
          'border-blue-200/80 dark:border-blue-700/50',
          'shadow-blue-500/10',
        ].join(' '),
        icon: 'text-blue-500 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-900/50',
        title: 'text-blue-800 dark:text-blue-200',
        message: 'text-blue-700 dark:text-blue-300',
      },
    };

    const icons = {
      success: CheckCircle2,
      error: XCircle,
      warning: AlertTriangle,
      info: Info,
    };

    const style = variants[variant];
    const Icon = icons[variant];

    return (
      <div
        ref={ref}
        className={cn(
          // Base styling
          'relative overflow-hidden',
          'rounded-xl border p-4',
          'backdrop-blur-sm',
          'shadow-lg',
          // Animation d'entrée
          'animate-in slide-in-from-top-2 fade-in-50 duration-300',
          // Variant styles
          style.container,
          className
        )}
        {...props}
      >
        {/* Décoration de fond */}
        <div className="absolute inset-0 -z-10 opacity-50">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-current to-transparent opacity-10 blur-3xl" />
        </div>

        <div className="flex gap-4">
          {/* Icône avec fond */}
          <div className={cn(
            'flex-shrink-0 flex items-center justify-center',
            'h-10 w-10 rounded-xl',
            style.iconBg
          )}>
            <Icon className={cn('h-5 w-5', style.icon)} />
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={cn('text-sm font-bold mb-1', style.title)}>
                {title}
              </h3>
            )}
            <div className={cn('text-sm leading-relaxed', style.message)}>
              {children}
            </div>
          </div>

          {/* Bouton de fermeture */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-shrink-0',
                'inline-flex items-center justify-center',
                'h-8 w-8 rounded-lg',
                'transition-all duration-200',
                'hover:bg-black/5 dark:hover:bg-white/5',
                'active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current',
                style.icon
              )}
            >
              <span className="sr-only">Fermer</span>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
