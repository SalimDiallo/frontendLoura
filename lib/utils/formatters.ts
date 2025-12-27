/**
 * Fonctions utilitaires de formatage
 */

/**
 * Formate un montant en devise
 */
export const formatCurrency = (amount: number, currency: string = "GNF") => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
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
 * Formate une durée en heures et minutes
 */
export const formatDuration = (hours: number): string => {
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
