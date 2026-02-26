import { Badge } from '@/components/ui';
import type { BadgeProps } from '@/components/ui/badge';
import {
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Hourglass,
  Package,
  type LucideIcon
} from 'lucide-react';

/**
 * Configuration unifiée pour les badges de statut
 * Supporte les icônes, classes personnalisées et labels
 */
export interface StatusConfig {
  variant: BadgeProps['variant'];
  label: string;
  icon?: LucideIcon;
  bgClass?: string;
  textClass?: string;
  iconColor?: string;
}

/**
 * Props du composant générique StatusBadge
 */
interface StatusBadgeProps<T extends string> {
  status: T;
  config: Record<T, StatusConfig>;
  className?: string;
  showIcon?: boolean;
  iconSize?: 'sm' | 'md' | 'lg';
}

/**
 * Tailles d'icônes standardisées
 */
const ICON_SIZES = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const;

/**
 * Composant générique pour afficher un badge de statut avec icône optionnelle
 */
function StatusBadge<T extends string>({
  status,
  config,
  className,
  showIcon = false,
  iconSize = 'md'
}: StatusBadgeProps<T>) {
  const statusConfig = config[status];

  if (!statusConfig) {
    console.warn(`Status "${status}" not found in config`);
    return <Badge variant="secondary" className={className}>Inconnu</Badge>;
  }

  const Icon = statusConfig.icon;
  const iconSizeClass = ICON_SIZES[iconSize];

  return (
    <Badge variant={statusConfig.variant} className={className}>
      {showIcon && Icon && (
        <Icon className={`${iconSizeClass} ${statusConfig.iconColor || ''} mr-1.5 inline-block align-middle`} />
      )}
      {statusConfig.label}
    </Badge>
  );
}

// ============================================================================
// CONFIGURATIONS PAR MODULE
// ============================================================================

// ----- HR MODULE -----

export const EMPLOYMENT_STATUS_CONFIG = {
  active: {
    variant: 'success' as const,
    label: 'Actif',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  inactive: {
    variant: 'secondary' as const,
    label: 'Inactif',
    icon: XCircle,
    iconColor: 'text-gray-600'
  },
  on_leave: {
    variant: 'warning' as const,
    label: 'En congé',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  terminated: {
    variant: 'error' as const,
    label: 'Terminé',
    icon: XCircle,
    iconColor: 'text-red-600'
  },
} satisfies Record<string, StatusConfig>;

export const LEAVE_STATUS_CONFIG = {
  pending: {
    variant: 'warning' as const,
    label: 'En attente',
    icon: Hourglass,
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    textClass: 'text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-600'
  },
  approved: {
    variant: 'success' as const,
    label: 'Approuvée',
    icon: CheckCircle2,
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    textClass: 'text-green-600 dark:text-green-400',
    iconColor: 'text-green-600'
  },
  rejected: {
    variant: 'error' as const,
    label: 'Rejetée',
    icon: XCircle,
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    textClass: 'text-red-600 dark:text-red-400',
    iconColor: 'text-red-600'
  },
  cancelled: {
    variant: 'default' as const,
    label: 'Annulée',
    icon: XCircle,
    bgClass: 'bg-gray-50 dark:bg-gray-800',
    textClass: 'text-gray-600 dark:text-gray-400',
    iconColor: 'text-gray-600'
  },
  validated: {
    variant: 'success' as const,
    label: 'Validée',
    icon: CheckCircle,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    iconColor: 'text-emerald-700 dark:text-emerald-400'
  },
} satisfies Record<string, StatusConfig>;

export const PAYROLL_STATUS_CONFIG = {
  draft: {
    variant: 'default' as const,
    label: 'Brouillon',
    icon: Clock,
    iconColor: 'text-gray-600'
  },
  pending: {
    variant: 'warning' as const,
    label: 'En attente',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  paid: {
    variant: 'success' as const,
    label: 'Payé',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  deducted: {
    variant: 'success' as const,
    label: 'Déduit',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  cancelled: {
    variant: 'error' as const,
    label: 'Annulé',
    icon: XCircle,
    iconColor: 'text-red-600'
  },
  processing: {
    variant: 'warning' as const,
    label: 'Traitement',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  processing_payment: {
    variant: 'warning' as const,
    label: 'Paiement en cours',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  closed: {
    variant: 'secondary' as const,
    label: 'Clôturé',
    icon: Package,
    iconColor: 'text-gray-600'
  },
  finalized: {
    variant: 'success' as const,
    label: 'Finalisé',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
} satisfies Record<string, StatusConfig>;

export const ATTENDANCE_STATUS_CONFIG = {
  present: {
    variant: 'success' as const,
    label: 'Présent',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  late: {
    variant: 'warning' as const,
    label: 'En retard',
    icon: Clock,
    iconColor: 'text-orange-600'
  },
  absent: {
    variant: 'error' as const,
    label: 'Absent',
    icon: XCircle,
    iconColor: 'text-red-600'
  },
  half_day: {
    variant: 'secondary' as const,
    label: 'Demi-journée',
    icon: Clock,
    iconColor: 'text-gray-600'
  },
  on_leave: {
    variant: 'default' as const,
    label: 'En congé',
    icon: Clock,
    iconColor: 'text-blue-600'
  },
} satisfies Record<string, StatusConfig>;

// ----- INVENTORY MODULE -----

export const ORDER_STATUS_CONFIG = {
  draft: {
    variant: 'default' as const,
    label: 'Brouillon',
    icon: Clock,
    iconColor: 'text-gray-600',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    textClass: 'text-gray-600'
  },
  pending: {
    variant: 'warning' as const,
    label: 'En attente',
    icon: Clock,
    iconColor: 'text-yellow-600',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-600'
  },
  confirmed: {
    variant: 'default' as const,
    label: 'Confirmée',
    icon: CheckCircle,
    iconColor: 'text-blue-600',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-foreground'
  },
  received: {
    variant: 'success' as const,
    label: 'Reçue',
    icon: Package,
    iconColor: 'text-green-600',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-600'
  },
  cancelled: {
    variant: 'error' as const,
    label: 'Annulée',
    icon: XCircle,
    iconColor: 'text-red-600',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-600'
  },
  validated: {
    variant: 'success' as const,
    label: 'Validé',
    icon: CheckCircle,
    iconColor: 'text-emerald-700 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    textClass: 'text-emerald-700 dark:text-emerald-400'
  },
  deducted: {
    variant: 'success' as const,
    label: 'Déduit',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    textClass: 'text-green-600'
  },
  in_progress: {
    variant: 'default' as const,
    label: 'En cours',
    icon: Clock,
    iconColor: 'text-blue-600'
  },
  planned: {
    variant: 'secondary' as const,
    label: 'Planifié',
    icon: Clock,
    iconColor: 'text-gray-600'
  },
} satisfies Record<string, StatusConfig>;

export const PAYMENT_STATUS_CONFIG = {
  paid: {
    variant: 'success' as const,
    label: 'Payé',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  partial: {
    variant: 'warning' as const,
    label: 'Partiel',
    icon: Clock,
    iconColor: 'text-orange-600'
  },
  overdue: {
    variant: 'error' as const,
    label: 'En retard',
    icon: AlertCircle,
    iconColor: 'text-red-600'
  },
  pending: {
    variant: 'warning' as const,
    label: 'En attente',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  cancelled: {
    variant: 'default' as const,
    label: 'Annulé',
    icon: XCircle,
    iconColor: 'text-gray-600'
  },
} satisfies Record<string, StatusConfig>;

// ============================================================================
// COMPOSANTS SPÉCIFIQUES (Wrappers typés)
// ============================================================================

// ----- HR Badges -----

export function EmploymentStatusBadge({
  status,
  className,
  showIcon = false
}: {
  status: keyof typeof EMPLOYMENT_STATUS_CONFIG;
  className?: string;
  showIcon?: boolean;
}) {
  return <StatusBadge status={status} config={EMPLOYMENT_STATUS_CONFIG} className={className} showIcon={showIcon} />;
}

export function LeaveStatusBadge({
  status,
  className,
  showIcon = false
}: {
  status: keyof typeof LEAVE_STATUS_CONFIG;
  className?: string;
  showIcon?: boolean;
}) {
  return <StatusBadge status={status} config={LEAVE_STATUS_CONFIG} className={className} showIcon={showIcon} />;
}

export function PayrollStatusBadge({
  status,
  className,
  showIcon = false
}: {
  status: keyof typeof PAYROLL_STATUS_CONFIG;
  className?: string;
  showIcon?: boolean;
}) {
  return <StatusBadge status={status} config={PAYROLL_STATUS_CONFIG} className={className} showIcon={showIcon} />;
}

export function AttendanceStatusBadge({
  status,
  className,
  showIcon = false
}: {
  status: keyof typeof ATTENDANCE_STATUS_CONFIG;
  className?: string;
  showIcon?: boolean;
}) {
  return <StatusBadge status={status} config={ATTENDANCE_STATUS_CONFIG} className={className} showIcon={showIcon} />;
}

// ----- Inventory Badges -----

export function OrderStatusBadge({
  status,
  className,
  showIcon = false
}: {
  status: keyof typeof ORDER_STATUS_CONFIG;
  className?: string;
  showIcon?: boolean;
}) {
  return <StatusBadge status={status} config={ORDER_STATUS_CONFIG} className={className} showIcon={showIcon} />;
}

export function PaymentStatusBadge({
  status,
  className,
  showIcon = false
}: {
  status: keyof typeof PAYMENT_STATUS_CONFIG;
  className?: string;
  showIcon?: boolean;
}) {
  return <StatusBadge status={status} config={PAYMENT_STATUS_CONFIG} className={className} showIcon={showIcon} />;
}

// ============================================================================
// FONCTIONS UTILITAIRES (Pour compatibilité avec l'ancien code)
// ============================================================================

/**
 * Retourne la configuration de statut pour n'importe quel type
 * @deprecated Préférer les composants typés spécifiques
 */
export function getStatusConfig(status: string): StatusConfig {
  // Chercher dans toutes les configurations
  const allConfigs = {
    ...EMPLOYMENT_STATUS_CONFIG,
    ...LEAVE_STATUS_CONFIG,
    ...PAYROLL_STATUS_CONFIG,
    ...ATTENDANCE_STATUS_CONFIG,
    ...ORDER_STATUS_CONFIG,
    ...PAYMENT_STATUS_CONFIG,
  };

  return allConfigs[status as keyof typeof allConfigs] || {
    variant: 'default',
    label: status,
  };
}

/**
 * Retourne un Badge JSX pour un statut générique
 * @deprecated Préférer les composants typés spécifiques
 */
export function getStatusBadge(status: string, showIcon = false): React.ReactElement {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      {showIcon && Icon && (
        <Icon className={`h-4 w-4 ${config.iconColor || ''} mr-1.5 inline-block align-middle`} />
      )}
      {config.label}
    </Badge>
  );
}

/**
 * Retourne uniquement l'icône pour un statut
 */
export function getStatusIcon(status: string, size: 'sm' | 'md' | 'lg' = 'md'): React.ReactElement | null {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  if (!Icon) return null;

  const sizeClass = ICON_SIZES[size];
  return <Icon className={`${sizeClass} ${config.iconColor || ''}`} />;
}

/**
 * Badge avec icône séparée et label (comme dans credit-sales)
 */
export function BadgeWithIconAndLabel({
  status,
  className
}: {
  status: string;
  className?: string;
}) {
  const config = getStatusConfig(status);

  return (
    <div className="flex items-center justify-center gap-2">
      {getStatusIcon(status)}
      <Badge variant={config.variant} className={className}>
        {config.label}
      </Badge>
    </div>
  );
}

// Export du composant générique et types
export { StatusBadge };
export type { StatusBadgeProps };
