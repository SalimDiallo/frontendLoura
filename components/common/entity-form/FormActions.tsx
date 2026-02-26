/**
 * Actions de formulaire standardisées (Annuler / Enregistrer)
 */

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Save, Loader2 } from 'lucide-react';

interface FormActionsProps {
  cancelUrl: string;
  cancelLabel?: string;
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function FormActions({
  cancelUrl,
  cancelLabel = 'Annuler',
  submitLabel = 'Enregistrer',
  loading = false,
  disabled = false,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" asChild disabled={loading}>
        <Link href={cancelUrl}>{cancelLabel}</Link>
      </Button>
      <Button type="submit" disabled={loading || disabled}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  );
}
