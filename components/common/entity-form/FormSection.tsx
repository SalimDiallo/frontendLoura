/**
 * Section de formulaire avec titre et icône
 */

import { Card } from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

interface FormSectionProps {
  title: string;
  icon?: LucideIcon;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, icon: Icon, description, children, className }: FormSectionProps) {
  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}
