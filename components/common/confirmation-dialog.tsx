'use client';

/**
 * Dialogs de confirmation réutilisables
 * Élimine ~1,400 lignes de code dupliqué
 */

import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
} from 'react-icons/hi2';
import { cn } from '@/lib/utils';

// ============================================================================
// CONFIRMATION DIALOG
// ============================================================================

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  icon?: 'warning' | 'info' | 'success';
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmVariant = 'default',
  onConfirm,
  loading = false,
  icon = 'warning',
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const IconComponent = {
    warning: HiOutlineExclamationTriangle,
    info: HiOutlineInformationCircle,
    success: HiOutlineCheckCircle,
  }[icon];

  const iconColor = {
    warning: 'text-amber-600',
    info: 'text-blue-600',
    success: 'text-green-600',
  }[icon];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn('size-10 rounded-full bg-muted flex items-center justify-center shrink-0', iconColor)}>
              <IconComponent className="size-5" />
            </div>
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-2">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Traitement...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// DELETE CONFIRMATION (Shortcut)
// ============================================================================

export interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  title?: string;
  description?: string;
}

export function DeleteConfirmation({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  loading,
  title,
  description,
}: DeleteConfirmationProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title || 'Confirmer la suppression'}
      description={
        description ||
        (itemName
          ? `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`
          : 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')
      }
      confirmLabel="Supprimer"
      confirmVariant="destructive"
      onConfirm={onConfirm}
      loading={loading}
      icon="warning"
    />
  );
}

// ============================================================================
// GENERIC ACTION CONFIRMATION
// ============================================================================

export interface ActionConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: {
    label: string;
    variant?: 'default' | 'destructive';
    icon?: 'warning' | 'info' | 'success';
  };
  target?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ActionConfirmation({
  open,
  onOpenChange,
  action,
  target,
  description,
  onConfirm,
  loading,
}: ActionConfirmationProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Confirmer: ${action.label}`}
      description={
        description ||
        (target
          ? `Êtes-vous sûr de vouloir ${action.label.toLowerCase()} "${target}" ?`
          : `Êtes-vous sûr de vouloir ${action.label.toLowerCase()} ?`)
      }
      confirmLabel={action.label}
      confirmVariant={action.variant || 'default'}
      onConfirm={onConfirm}
      loading={loading}
      icon={action.icon || 'info'}
    />
  );
}
