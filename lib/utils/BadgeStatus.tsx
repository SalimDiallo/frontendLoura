
import { Badge } from "@/components/ui";
import { JSX } from "react";
// Icons for main statuses
import { AlertCircle, CheckCircle, Clock, LucideIcon, Package, XCircle } from "lucide-react";

/** Types de statuts et variants possibles */
export type StatusBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "secondary"

export interface StatusBadgeMapping {
  variant: StatusBadgeVariant;
  label: string;
  icon?: JSX.Element;
}

/**
 * Mappe le statut vers variant/label/icon pour badge d'affichage.
 */
export function getStatusBadge(status: string): StatusBadgeMapping {
  // Variant mapping (global)
  const variants: Record<string, StatusBadgeVariant> = {
    // Attendance
    present: "success",
    late: "warning",
    absent: "error",
    half_day: "secondary",
    on_leave: "default",
    // Payroll
    draft: "default",
    pending: "warning",
    paid: "success",
    deducted: "success",
    cancelled: "error",
    processing: "warning",
    processing_payment: "warning",
    closed: "secondary",
    finalized: "success",
    // Leaves / sales
    approved: "success",
    rejected: "error",
    overdue: "error",
    partial: "warning",
    validated: "success",
    received: "success",
    in_progress: "default",
    planned: "secondary"
  };

  const labels: Record<string, string> = {
    present: "Présent",
    late: "En retard",
    absent: "Absent",
    half_day: "Demi-journée",
    on_leave: "En congé",
    draft: "Brouillon",
    pending: "En attente",
    paid: "Payé",
    deducted: "Déduit",
    cancelled: "Annulé",
    processing: "Traitement",
    processing_payment: "Paiement en cours",
    closed: "Clôturé",
    finalized: "Finalisé",
    approved: "Approuvée",
    rejected: "Rejetée",
    overdue: "En retard",
    partial: "Partiel",
    validated: "Validé",
    received: "Reçu",
    in_progress: "En cours",
    planned: "Planifié"
  };

  // Amélioration icônes (pour plus de style, dégradés ou silhouette légère, et ovales colorées de fond possibles)
  let icon: JSX.Element | undefined = undefined;
  switch (status) {
    case "paid":
    case "deducted":
      icon = (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30 mr-1 shadow-inner">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        </span>
      );
      break;
    case "overdue":
      icon = (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 mr-1 shadow-inner">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </span>
      );
      break;
    case "partial":
      icon = (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mr-1 shadow-inner">
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </span>
      );
      break;
    case "validated":
      icon = (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 mr-1 shadow-inner">
          <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
        </span>
      );
      break;
    default:
      if (["pending", "draft", "processing", "processing_payment"].includes(status)) {
        icon = (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 mr-1 shadow-inner">
            <Clock className="h-4 w-4 text-yellow-600 dark:text-amber-400" />
          </span>
        );
      }
      break;
  }

  return {
    variant: variants[status] || "default",
    label: labels[status] || status,
    icon,
  };
}

/**
 * Retourne un composant Badge pour un statut générique, avec icône stylisé si applicable.
 */
export function getStatusBadgeNode(status: string): JSX.Element {
  const { variant, label, icon } = getStatusBadge(status);
  return (
    <Badge
      variant={variant}
      className="px-2.5 py-1.5 rounded-full font-medium tracking-wide flex items-center gap-1 transition-all duration-150 text-sm shadow-sm border-none"
      style={{ letterSpacing: "0.01em", minHeight: 32, minWidth: 38 }}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </Badge>
  );
}

/**
 * Retourne un objet prêt à configurer un Badge de congé, incluant couleurs & icônes arrondies stylées.
 */
export function getLeaveStatusConfig(status: string) {
  switch (status) {
    case 'approved':
      return {
        label: 'Approuvée',
        variant: 'success' as const,
        icon: require('lucide-react').CheckCircle2,
        bgClass: 'bg-green-100 dark:bg-green-950/30',
        textClass: 'text-green-700 dark:text-green-400 font-semibold',
        iconWrap: 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-200/60 dark:bg-green-900/30 mr-1 shadow-inner'
      };
    case 'rejected':
      return {
        label: 'Rejetée',
        variant: 'error' as const,
        icon: require('lucide-react').XCircle,
        bgClass: 'bg-red-100 dark:bg-red-950/30',
        textClass: 'text-red-700 dark:text-red-400 font-semibold',
        iconWrap: 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-200/60 dark:bg-red-900/40 mr-1 shadow-inner'
      };
    case 'cancelled':
      return {
        label: 'Annulée',
        variant: 'default' as const,
        icon: require('lucide-react').XCircle,
        bgClass: 'bg-gray-100 dark:bg-gray-900/30',
        textClass: 'text-gray-600 dark:text-gray-400 font-semibold',
        iconWrap: 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200/60 dark:bg-gray-900/40 mr-1 shadow-inner'
      };
    case 'validated':
      return {
        label: 'Validé',
        variant: 'success' as const,
        icon: require('lucide-react').CheckCircle,
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/25',
        textClass: 'text-emerald-700 dark:text-emerald-400 font-semibold',
        iconWrap: 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200/60 dark:bg-emerald-900/30 mr-1 shadow-inner'
      };
    default:
      return {
        label: 'En attente',
        variant: 'warning' as const,
        icon: require('lucide-react').Hourglass,
        bgClass: 'bg-amber-50 dark:bg-amber-950/25',
        textClass: 'text-amber-700 dark:text-amber-400 font-semibold',
        iconWrap: 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-200/60 dark:bg-amber-900/30 mr-1 shadow-inner'
      };
  }
}

/**
 * Retourne l'icône stylisée correspondant au statut de paiement.
 */
export const getStatusIcon = (status: string) => {
  let wrap = (icon: JSX.Element, bg: string) =>
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${bg} mr-1 shadow-inner`}>
      {icon}
    </span>;
  switch (status) {
    case "paid":
    case "deducted":
      return wrap(<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />, "bg-green-100 dark:bg-green-950/30");
    case "partial":
      return wrap(<Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />, "bg-orange-100 dark:bg-orange-900/30");
    case "pending":
      return wrap(<Clock className="h-4 w-4 text-yellow-600 dark:text-amber-400" />, "bg-amber-50 dark:bg-amber-950/25");
    case "overdue":
      return wrap(<AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />, "bg-red-100 dark:bg-red-950/30");
    case "cancelled":
      return wrap(<XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />, "bg-gray-100 dark:bg-gray-900/30");
    case "validated":
      return wrap(<CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />, "bg-emerald-50 dark:bg-emerald-950/30");
    default:
      return wrap(<Clock className="h-4 w-4 text-zinc-400" />, "bg-zinc-50 dark:bg-zinc-900/20");
  }
};

/**
 * Retourne la variante de badge liée au statut (inchangé, pour style d'affiche).
 */
export const getStatusVariant = (
  status: string
): "success" | "warning" | "error" | "default" => {
  switch (status) {
    case "paid":
    case "deducted":
    case "validated":
      return "success";
    case "partial":
    case "pending":
      return "warning";
    case "overdue":
      return "error";
    default:
      return "default";
  }
};

export function getBadgeWIthOutIconAdLabel({ status, label, className }: { status: string; label: string; className?: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span>{getStatusIcon(status)}</span>
      <Badge size="sm" variant={getStatusVariant(status)} className={"rounded-full shadow-sm font-medium px-2.5 py-1.5 text-xs " + (className || "")}>
        {label}
      </Badge>
    </div>
  );
}

/**
 * Mappe le statut d'une commande d'achat à son label & couleurs, avec icône arrondie pour un affichage stylé.
 */
export function getStatusInfo(status: string) {
  // Les icônes Clock, CheckCircle, Package, XCircle doivent être importés dans le fichier appelant.
  const info: Record<string, { label: string; color: string; bg: string; icon: LucideIcon; iconWrap?: string }> = {
    draft: {
      label: "Brouillon",
      color: "text-gray-700 dark:text-gray-300 font-semibold",
      bg: "bg-gray-100 dark:bg-gray-800",
      icon: Clock,
      iconWrap: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200/70 dark:bg-gray-900/40 mr-1 shadow-inner"
    },
    pending: {
      label: "En attente",
      color: "text-yellow-700 dark:text-yellow-400 font-semibold",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      icon: Clock,
      iconWrap: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100/70 dark:bg-amber-950/30 mr-1 shadow-inner"
    },
    confirmed: {
      label: "Confirmée",
      color: "text-blue-800 dark:text-blue-300 font-semibold",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      icon: CheckCircle,
      iconWrap: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-200/70 dark:bg-blue-900/40 mr-1 shadow-inner"
    },
    received: {
      label: "Reçue",
      color: "text-green-800 dark:text-green-400 font-semibold",
      bg: "bg-green-100 dark:bg-green-900/30",
      icon: Package,
      iconWrap: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-200/70 dark:bg-green-900/40 mr-1 shadow-inner"
    },
    cancelled: {
      label: "Annulée",
      color: "text-red-700 dark:text-red-400 font-semibold",
      bg: "bg-red-100 dark:bg-red-900/30",
      icon: XCircle,
      iconWrap: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-200/70 dark:bg-red-900/40 mr-1 shadow-inner"
    },
    validated: {
      label: "Validé",
      color: "text-emerald-700 dark:text-emerald-400 font-semibold",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      icon: CheckCircle,
      iconWrap: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200/70 dark:bg-emerald-900/40 mr-1 shadow-inner"
    },
    deducted: {
      label: "Déduit",
      color: "text-green-700 dark:text-green-400 font-semibold",
      bg: "bg-green-50 dark:bg-green-950/30",
      icon: CheckCircle,
      iconWrap: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-200/70 dark:bg-green-900/40 mr-1 shadow-inner"
    },
  };

  return info[status] || info["draft"];
}
