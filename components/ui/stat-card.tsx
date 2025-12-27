import { Card } from '@/components/ui';
import { HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown } from 'react-icons/hi2';
import type { ComponentType } from 'react';

export interface StatCardProps {
  variant?: 'minimal' | 'default' | 'featured';
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
  valueColor?: 'default' | 'success' | 'error' | 'warning';
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

const VALUE_COLORS = {
  default: 'text-foreground',
  success: 'text-emerald-600',
  error: 'text-rose-600',
  warning: 'text-amber-600',
};

export function StatCard({
  variant = 'default',
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  iconColor,
  iconBgColor,
  valueColor = 'default',
  trend,
  onClick,
  className = ''
}: StatCardProps) {

  // Variant: Minimal - Design épuré
  if (variant === 'minimal') {
    return (
      <Card
        className={`p-6 ${onClick ? 'cursor-pointer hover:border-primary/40' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-3xl font-bold ${VALUE_COLORS[valueColor]}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </Card>
    );
  }

  // Variant: Featured - Style dashboard moderne et épuré
  if (variant === 'featured') {
    return (
      <Card
        className={`p-6 ${onClick ? 'cursor-pointer hover:border-primary/40' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-3xl font-bold ${VALUE_COLORS[valueColor]}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1.5 pt-1">
                {trend.isPositive ? (
                  <HiOutlineArrowTrendingUp className="size-4 text-emerald-600" />
                ) : (
                  <HiOutlineArrowTrendingDown className="size-4 text-rose-600" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {trend.label || 'vs mois dernier'}
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={`h-12 w-12 rounded-lg flex items-center justify-center ${iconBgColor || 'bg-primary/10'}`}
              style={iconBgColor ? { background: iconBgColor } : undefined}
            >
              <Icon className={`size-6 ${iconColor || 'text-primary'}`} />
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
            {description}
          </p>
        )}
      </Card>
    );
  }

  // Variant: Default - Design épuré avec icône
  return (
    <Card
      className={`p-6 ${onClick ? 'cursor-pointer hover:border-primary/40' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${VALUE_COLORS[valueColor]}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend.isPositive ? (
                <HiOutlineArrowTrendingUp className="size-4 text-emerald-600" />
              ) : (
                <HiOutlineArrowTrendingDown className="size-4 text-rose-600" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">
                {trend.label || 'vs mois dernier'}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${iconBgColor || 'bg-primary/10'}`}
            style={iconBgColor ? { background: iconBgColor } : undefined}
          >
            <Icon className={`size-6 ${iconColor || 'text-primary'}`} />
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
          {description}
        </p>
      )}
    </Card>
  );
}
