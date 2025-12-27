'use client';

/**
 * Composant StatsGrid réutilisable
 * Élimine ~800 lignes de code dupliqué
 */

import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
} from 'react-icons/hi2';

// ============================================================================
// TYPES
// ============================================================================

export interface StatItem {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: any;
  iconColor?: string;
  iconBgColor?: string;
  valueColor?: 'default' | 'success' | 'error' | 'warning' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  badge?: {
    label: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
  };
  onClick?: () => void;
  href?: string;
}

export interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const VALUE_COLORS = {
  default: 'text-foreground',
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-yellow-300',
  info: 'text-blue-600 dark:text-blue-400',
};

export function StatsGrid({
  stats,
  columns = 4,
  variant = 'default',
  className,
}: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} variant={variant} />
      ))}
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  stat: StatItem;
  variant: 'default' | 'compact' | 'detailed';
}

function StatCard({ stat, variant }: StatCardProps) {
  const Icon = stat.icon;
  const valueColorClass = VALUE_COLORS[stat.valueColor || 'default'];

  const cardContent = (
    <>
      {/* Compact Variant */}
      {variant === 'compact' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{stat.title}</p>
            {Icon && (
              <div className={cn('size-8 rounded-lg flex items-center justify-center', stat.iconBgColor || 'bg-primary/10')}>
                <Icon className={cn('size-4', stat.iconColor || 'text-primary')} />
              </div>
            )}
          </div>
          <p className={cn('text-2xl font-bold', valueColorClass)}>{stat.value}</p>
          {stat.subtitle && (
            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
          )}
        </div>
      )}

      {/* Default Variant */}
      {variant === 'default' && (
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            <p className={cn('text-3xl font-bold', valueColorClass)}>{stat.value}</p>
            {stat.subtitle && (
              <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
            )}
            {stat.trend && (
              <div className="flex items-center gap-1.5 mt-2">
                {stat.trend.isPositive ? (
                  <HiOutlineArrowTrendingUp className="size-4 text-emerald-600" />
                ) : (
                  <HiOutlineArrowTrendingDown className="size-4 text-rose-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-semibold',
                    stat.trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {stat.trend.isPositive ? '+' : ''}
                  {stat.trend.value}%
                </span>
                {stat.trend.label && (
                  <span className="text-xs text-muted-foreground">{stat.trend.label}</span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                'size-12 rounded-2xl flex items-center justify-center shrink-0',
                stat.iconBgColor || 'bg-primary/10'
              )}
            >
              <Icon className={cn('size-6', stat.iconColor || 'text-primary')} />
            </div>
          )}
        </div>
      )}

      {/* Detailed Variant */}
      {variant === 'detailed' && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className={cn('text-3xl font-bold mt-1', valueColorClass)}>{stat.value}</p>
              {stat.subtitle && (
                <p className="text-sm text-muted-foreground mt-2">{stat.subtitle}</p>
              )}
            </div>
            {Icon && (
              <div
                className={cn(
                  'size-12 rounded-2xl flex items-center justify-center',
                  stat.iconBgColor || 'bg-primary/10'
                )}
              >
                <Icon className={cn('size-6', stat.iconColor || 'text-primary')} />
              </div>
            )}
          </div>
          {(stat.description || stat.trend) && (
            <div className="mt-4 pt-4 border-t border-border/50">
              {stat.description && (
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              )}
              {stat.trend && (
                <div className="flex items-center gap-1.5 mt-2">
                  {stat.trend.isPositive ? (
                    <HiOutlineArrowTrendingUp className="size-4 text-emerald-600" />
                  ) : (
                    <HiOutlineArrowTrendingDown className="size-4 text-rose-600" />
                  )}
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      stat.trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  >
                    {stat.trend.isPositive ? '+' : ''}
                    {stat.trend.value}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stat.trend.label || 'vs mois dernier'}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <Card
      className={cn(
        'p-6 border-0 shadow-sm',
        stat.onClick && 'cursor-pointer hover:border-primary/40 transition-colors'
      )}
      onClick={stat.onClick}
    >
      {cardContent}
    </Card>
  );
}

// ============================================================================
// STAT ITEM HELPER
// ============================================================================

/**
 * Helper pour créer un StatItem rapidement
 */
export function createStat(
  title: string,
  value: string | number,
  options?: Partial<Omit<StatItem, 'title' | 'value'>>
): StatItem {
  return {
    title,
    value,
    ...options,
  };
}
