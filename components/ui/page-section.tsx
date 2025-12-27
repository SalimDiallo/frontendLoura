import { Card } from '@/components/ui';
import type { ReactNode } from 'react';

export interface PageSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  variant?: 'default' | 'muted' | 'gradient';
  className?: string;
  noPadding?: boolean;
}

export function PageSection({
  title,
  subtitle,
  children,
  action,
  variant = 'default',
  className = '',
  noPadding = false
}: PageSectionProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'muted':
        return 'bg-muted/30';
      case 'gradient':
        return 'bg-muted/10';
      default:
        return '';
    }
  };

  return (
    <Card className={`border-0m ${getVariantClasses()} ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between ${noPadding ? 'p-6 pb-0' : 'p-6'}`}>
          <div>
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </Card>
  );
}
