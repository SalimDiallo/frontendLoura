import { Badge } from '@/components/ui';
import type { EmploymentStatus, LeaveStatus, PayrollStatus } from '@/lib/types/hr';
import type { BadgeProps } from '@/components/ui/badge';

/**
 * Configuration générique pour les badges de statut
 */
interface StatusConfig {
  variant: BadgeProps['variant'];
  label: string;
}

/**
 * Composant générique pour afficher un badge de statut
 * Réduit la duplication de code entre différents types de statuts
 */
interface StatusBadgeProps<T extends string> {
  status: T;
  config: Record<T, StatusConfig>;
  className?: string;
}

function StatusBadge<T extends string>({ status, config, className }: StatusBadgeProps<T>) {
  const statusConfig = config[status];
  if (!statusConfig) {
    console.warn(`Status "${status}" not found in config`);
    return <Badge variant="secondary" className={className}>Inconnu</Badge>;
  }
  return <Badge variant={statusConfig.variant} className={className}>{statusConfig.label}</Badge>;
}

// ============================================================================
// Configurations spécifiques pour HR
// ============================================================================

const EMPLOYMENT_STATUS_CONFIG: Record<EmploymentStatus, StatusConfig> = {
  active: { variant: 'success', label: 'Actif' },
  inactive: { variant: 'secondary', label: 'Inactif' },
  on_leave: { variant: 'warning', label: 'En congé' },
  terminated: { variant: 'destructive', label: 'Terminé' },
};

const LEAVE_STATUS_CONFIG: Record<LeaveStatus, StatusConfig> = {
  pending: { variant: 'warning', label: 'En attente' },
  approved: { variant: 'success', label: 'Approuvé' },
  rejected: { variant: 'destructive', label: 'Rejeté' },
  cancelled: { variant: 'secondary', label: 'Annulé' },
};

const PAYROLL_STATUS_CONFIG: Record<PayrollStatus, StatusConfig> = {
  draft: { variant: 'secondary', label: 'Brouillon' },
  pending: { variant: 'warning', label: 'En attente' },
  paid: { variant: 'success', label: 'Payé' },
  cancelled: { variant: 'destructive', label: 'Annulé' },
};

// ============================================================================
// Composants spécifiques (wrappers autour du composant générique)
// ============================================================================

interface EmploymentStatusBadgeProps {
  status: EmploymentStatus;
  className?: string;
}

export function EmploymentStatusBadge({ status, className }: EmploymentStatusBadgeProps) {
  return <StatusBadge status={status} config={EMPLOYMENT_STATUS_CONFIG} className={className} />;
}

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
  className?: string;
}

export function LeaveStatusBadge({ status, className }: LeaveStatusBadgeProps) {
  return <StatusBadge status={status} config={LEAVE_STATUS_CONFIG} className={className} />;
}

interface PayrollStatusBadgeProps {
  status: PayrollStatus;
  className?: string;
}

export function PayrollStatusBadge({ status, className }: PayrollStatusBadgeProps) {
  return <StatusBadge status={status} config={PAYROLL_STATUS_CONFIG} className={className} />;
}

// Export du composant générique pour d'autres modules (inventory, etc.)
export { StatusBadge };
export type { StatusConfig, StatusBadgeProps };
