/**
 * Header de formulaire standardisé avec bouton retour et titre
 */

import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

interface FormHeaderProps {
  title: string;
  subtitle?: string;
  backUrl: string;
  backLabel?: string;
}

export function FormHeader({ title, subtitle, backUrl, backLabel = 'Retour' }: FormHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={backUrl}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {backLabel}
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
