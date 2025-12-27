'use client';

/**
 * Composants pour gérer les états de page (Loading, Empty, Error)
 * Élimine ~1,800 lignes de code dupliqué
 */

import { Button, Card, Alert } from '@/components/ui';
import Link from 'next/link';
import { Can } from '@/components/apps/common';
import { cn } from '@/lib/utils';
import {
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

// ============================================================================
// LOADING STATE
// ============================================================================

export interface PageLoadingStateProps {
  variant?: 'table' | 'form' | 'dashboard' | 'detail';
  className?: string;
}

export function PageLoadingState({ variant = 'table', className }: PageLoadingStateProps) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {variant === 'table' && (
        <>
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </>
      )}

      {variant === 'form' && (
        <>
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <Card className="p-6 space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </Card>
        </>
      )}

      {variant === 'dashboard' && (
        <>
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-80 bg-muted rounded"></div>
            <div className="h-80 bg-muted rounded"></div>
          </div>
        </>
      )}

      {variant === 'detail' && (
        <>
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

export interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    permission?: string;
    shortcut?: string;
    variant?: 'default' | 'outline';
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const ActionButton = action ? (
    <Button
      variant={action.variant || 'default'}
      asChild={!!action.href}
      onClick={action.onClick}
    >
      {action.href ? <Link href={action.href}>{action.label}</Link> : action.label}
    </Button>
  ) : null;

  return (
    <div className={cn('p-12 text-center', className)}>
      <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
        {Icon && (
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Icon className="size-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {action?.shortcut && (
            <p className="text-sm text-muted-foreground mt-2">
              Appuyez sur <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">{action.shortcut}</kbd> pour {action.label.toLowerCase()}
            </p>
          )}
        </div>
        {action && (
          <div className="flex gap-2">
            {action.permission ? (
              <Can permission={action.permission}>{ActionButton}</Can>
            ) : (
              ActionButton
            )}
            {secondaryAction && (
              <Button
                variant="outline"
                asChild={!!secondaryAction.href}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.href ? (
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                ) : (
                  secondaryAction.label
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Une erreur est survenue',
  message,
  onRetry,
  retryLabel = 'Réessayer',
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('p-12', className)}>
      <Alert variant="error" className="max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <HiOutlineExclamationTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm mt-1">{message}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-3"
              >
                <HiOutlineArrowPath className="size-4 mr-2" />
                {retryLabel}
              </Button>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
}

// ============================================================================
// COMBINED PAGE STATE WRAPPER
// ============================================================================

export interface PageStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  loadingVariant?: PageLoadingStateProps['variant'];
  emptyState?: EmptyStateProps;
  errorState?: Omit<ErrorStateProps, 'message'>;
  children: React.ReactNode;
}

/**
 * Wrapper qui gère automatiquement les états loading/error/empty
 * Simplifie énormément le code des pages
 */
export function PageState({
  loading,
  error,
  empty,
  loadingVariant,
  emptyState,
  errorState,
  children,
}: PageStateProps) {
  if (loading) {
    return <PageLoadingState variant={loadingVariant} />;
  }

  if (error) {
    return <ErrorState message={error} {...errorState} />;
  }

  if (empty && emptyState) {
    return <EmptyState {...emptyState} />;
  }

  return <>{children}</>;
}
