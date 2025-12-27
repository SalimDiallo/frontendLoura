import { Button } from '@/components/ui';
import Link from 'next/link';
import type { ComponentType } from 'react';

export interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: ComponentType<{ className?: string }>;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="size-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {action && (
        <Button
          variant="default"
          asChild={!!action.href}
          onClick={!action.href ? action.onClick : undefined}
        >
          {action.href ? (
            <Link href={action.href}>
              {action.icon && <action.icon className="size-4 mr-2" />}
              {action.label}
            </Link>
          ) : (
            <>
              {action.icon && <action.icon className="size-4 mr-2" />}
              {action.label}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
