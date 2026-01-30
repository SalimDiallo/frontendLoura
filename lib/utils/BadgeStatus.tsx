
import { Badge } from "@/components/ui";
import { JSX } from "react";

// Icons for main statuses
import { CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";

/** Types de statuts et variants possibles */
export type StatusBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "secondary";

export interface StatusBadgeMapping {
  variant: StatusBadgeVariant;
  label: string;
  icon?: JSX.Element;
}

/**
 * Mappe le statut vers variant/label/icon pour badge d'affichage.
 * @param status Statut (ex: "present", "late", "absent", "half_day", "on_leave", "draft", "pending", "paid", "cancelled", "processing", "processing_payment", "closed", "finalized", "approved", "rejected")
 * @returns { variant: StatusBadgeVariant; label: string; icon?: JSX.Element }
 * 
 * L'icône est incluse pour certains statuts (ex: "paid", "overdue", "partial") comme dans CreditSale (voir page.tsx ligne 78+).
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
    cancelled: "error",
    processing: "warning",
    processing_payment: "warning",
    closed: "secondary",
    finalized: "success",
    // Leaves (ajoutés depuis page.tsx => getStatusConfig)
    approved: "success",
    rejected: "error",
    // credit sales statuses
    overdue: "error",
    partial: "warning",
    // Pour matcher le code HR/Leaves: "cancelled": "default",
  };

  const labels: Record<string, string> = {
    // Attendance
    present: "Présent",
    late: "En retard",
    absent: "Absent",
    half_day: "Demi-journée",
    on_leave: "En congé",
    // Payroll
    draft: "Brouillon",
    pending: "En attente",
    paid: "Payé",
    cancelled: "Annulé",
    processing: "Traitement",
    processing_payment: "Paiement en cours",
    closed: "Clôturé",
    finalized: "Finalisé",
    // Leaves
    approved: "Approuvée",
    rejected: "Rejetée",
    // Credit Sales
    overdue: "En retard",
    partial: "Partiel",
    // cancelled est déjà couvert
  };

  // Optionally inject an icon for some statuses (cf. page.tsx)
  let icon: JSX.Element | undefined = undefined;
  switch (status) {
    case "paid":
      icon = <CheckCircle className="h-5 w-5 text-green-600" />;
      break;
    case "overdue":
      icon = <AlertCircle className="h-5 w-5 text-red-600" />;
      break;
    case "partial":
      icon = <Clock className="h-5 w-5 text-orange-600" />;
      break;
    default:
      if (["pending","draft","processing","processing_payment"].includes(status)) {
        icon = <Clock className="h-5 w-5 text-yellow-600" />;
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
 * Retourne un composant Badge pour un statut générique (présence, paie ou congé), avec l'icône si applicable.
 * @param status string
 * @returns JSX.Element (Badge)
 */
export function getStatusBadgeNode(status: string): JSX.Element {
  const { variant, label, icon } = getStatusBadge(status);
  // @ts-ignore
  return (
    <Badge variant={variant}>
      {icon && <span className="mr-1 align-middle inline-block">{icon}</span>}
      {label}
    </Badge>
  );
}

/**
 * Retourne un objet prêt à configurer un Badge de congé, incluant le texte, la variante et l'icône.
 * Utilisé spécifiquement pour les demandes de congé pour fidélité à l'affichage du détail.
 * @param status string
 * @returns { label: string, variant: string, icon: React.ElementType, bgClass: string, textClass: string }
 */
export function getLeaveStatusConfig(status: string) {
  switch (status) {
    case 'approved':
      return {
        label: 'Approuvée',
        variant: 'success' as const,
        icon: require('lucide-react').CheckCircle2,
        bgClass: 'bg-green-50 dark:bg-green-950/30',
        textClass: 'text-green-600 dark:text-green-400',
      };
    case 'rejected':
      return {
        label: 'Rejetée',
        variant: 'error' as const,
        icon: require('lucide-react').XCircle,
        bgClass: 'bg-red-50 dark:bg-red-950/30',
        textClass: 'text-red-600 dark:text-red-400',
      };
    case 'cancelled':
      return {
        label: 'Annulée',
        variant: 'default' as const,
        icon: require('lucide-react').XCircle,
        bgClass: 'bg-gray-50 dark:bg-gray-800',
        textClass: 'text-gray-600 dark:text-gray-400',
      };
    default:
      return {
        label: 'En attente',
        variant: 'warning' as const,
        icon: require('lucide-react').Hourglass,
        bgClass: 'bg-amber-50 dark:bg-amber-950/30',
        textClass: 'text-amber-600 dark:text-amber-400',
      };
  }
}



/**
 * Retourne l'icône correspondant au statut de paiement d'une créance.
 * @param status Le statut de la créance (ex: "paid", "partial", "pending", "overdue", "cancelled")
 * @returns JSX.Element L'icône correspondante
 */
export const getStatusIcon = (status: string) => {
  switch (status) {
    case "paid":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "partial":
      return <Clock className="h-4 w-4 text-orange-600" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "overdue":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 text-gray-600" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

/**
 * Retourne la variante de badge correspondant au statut de paiement d'une créance.
 * @param status Le statut de la créance (ex: "paid", "partial", "pending", "overdue")
 * @returns "success" | "warning" | "error" | "default"
 */
export const getStatusVariant = (
  status: string
): "success" | "warning" | "error" | "default" => {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
      return "warning";
    case "pending":
      return "warning";
    case "overdue":
      return "error";
    default:
      return "default";
  }
};


// Badge status "sans icône", retourne juste le bloc <div> comme dans page.tsx (436-440)
export function getBadgeWIthOutIconAdLabel({ status, label, className }: { status: string; label: string; className?: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {getStatusIcon(status)}
      <Badge variant={getStatusVariant(status)} className={className}>
        {label}
      </Badge>
    </div>
  );
}


/**
 * Mappe le statut d'une commande d'achat à son label, couleurs, et icône pour affichage.
 * @param status Statut de la commande ("draft", "pending", "confirmed", "received", "cancelled")
 * @returns Un objet { label, color, bg, icon }
 */
export function getStatusInfo(status: string) {
  // Les icônes Clock, CheckCircle, Package, XCircle doivent être importés dans le fichier appelant.
  // Ici on retourne juste les noms de composants pour que le composant parent les utilise.
  const info: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    draft: {
      label: "Brouillon",
      color: "text-gray-600",
      bg: "bg-gray-100 dark:bg-gray-800",
      icon: "Clock",
    },
    pending: {
      label: "En attente",
      color: "text-yellow-600",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      icon: "Clock",
    },
    confirmed: {
      label: "Confirmée",
      color: "text-foreground",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      icon: "CheckCircle",
    },
    received: {
      label: "Reçue",
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
      icon: "Package",
    },
    cancelled: {
      label: "Annulée",
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
      icon: "XCircle",
    },
  };

  // Retourne un objet pour usage dans le composant Badge ou autre affichage
  return info[status] || info["draft"];
}
