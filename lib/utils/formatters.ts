/**
 * Fonctions utilitaires de formatage
 */

/**
 * Récupère l'organisation courante depuis les utilitaires locaux
 * Si non disponible, tente de la récupérer via le backend (organizationService)
 */


/**
 * Formate un montant en devise
 */
export const formatCurrency = (amount: number, currency: string = "GNF") => {
  // On récupère la devise locale depuis le localStorage, sinon on utilise le paramètre ou "GNF"
  let localCurrency: string | null = null;
  if (typeof window !== "undefined") {
    try {
      localCurrency = window.localStorage.getItem("loura-currency");
    } catch {
      // ignore erreurs d'accès au localStorage
      localCurrency = null;
    }
  }
  
  const currencyUsed = localCurrency || currency || "GNF";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currencyUsed,
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formate un nombre avec séparateurs de milliers
 */
export const formatNumber = (value: number, locale: string = "fr-FR") => {
  return new Intl.NumberFormat(locale).format(value);
};

/**
 * Formate une date en français
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("fr-FR", options);
};

/**
 * Formate une date et heure en français
 */
export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formate une date courte en français (JJ/MM/AAAA)
 */
export const formatShortDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formate une heure (HH:mm) à partir d'une chaîne ou d'un objet Date
 */
export const formatTime = (dateString?: string | Date): string => {
  if (!dateString) return "-";
  let dateObj: Date;
  if (dateString instanceof Date) {
    dateObj = dateString;
  } else {
    dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return "-";
  }
  return dateObj
    .toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/^(\d{2}:\d{2}).*$/, "$1");
};


/**
 * Formate une durée en heures et minutes
 */
export const formatDuration = (hours?: number): string => {
  if (!hours) {
    return "vide"
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

/**
 * Formate un pourcentage
 */
export const formatPercent = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Tronque un texte avec ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

/**
 * Capitalise la première lettre
 */
export const capitalize = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Transforme un texte en slug
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};


/**
 * Donne une couleur de texte en fonction du nombre de jours jusqu'à échéance (pour crédits à vendre, etc.)
 * @param days number | undefined
 * @returns string nom de class Tailwind
 */
export const getDaysColor = (days: number | undefined): string => {
  if (days === undefined) return "";
  if (days < 0) return "text-red-600 font-bold";
  if (days <= 7) return "text-orange-600";
  return "text-green-600";
};


/**
 * Génère les initiales à partir d'un nom
 */
export const getInitials = (name: string, maxLength: number = 2): string => {
  if (!name) return "";
  
  return name
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, maxLength)
    .map((part) => part[0].toUpperCase())
    .join("");
};

/**
 * Formate un numéro de téléphone
 */
export const formatPhone = (phone: string): string => {
  // Supprime tout sauf les chiffres et le +
  const cleaned = phone.replace(/[^+\d]/g, "");
  
  // Format: +XXX XX XX XX XX
  if (cleaned.startsWith("+")) {
    const parts = cleaned.slice(1).match(/.{1,2}/g) || [];
    return "+" + parts.join(" ");
  }
  
  // Format local: XX XX XX XX
  const parts = cleaned.match(/.{1,2}/g) || [];
  return parts.join(" ");
};
