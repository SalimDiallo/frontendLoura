/**
 * Utilitaires pour la gestion des congés
 */

/**
 * Formate l'affichage des jours de congé
 * - Affiche "demi" pour 0.5
 * - Affiche le nombre entier pour les valeurs entières
 * - Affiche "X.5" comme "X et demi" pour les autres cas
 *
 * @param days - Nombre de jours (peut être décimal)
 * @returns Chaîne formatée pour l'affichage
 */
export function formatLeaveDays(days: number): string {
  // Convertir en nombre si c'est une chaîne
  const numDays = typeof days === 'string' ? parseFloat(days) : days;

  // Arrondir les valeurs très proches de .5 ou .0 pour éviter les problèmes de précision
  const rounded = Math.round(numDays * 2) / 2;

  if (rounded === 0.5) {
    return "demi";
  }

  if (Number.isInteger(rounded)) {
    return Math.round(rounded).toString();
  }

  const wholePart = Math.floor(rounded);
  const decimalPart = rounded - wholePart;

  if (Math.abs(decimalPart - 0.5) < 0.01) {
    return `${wholePart} et demi`;
  }

  return rounded.toString();
}

/**
 * Formate l'affichage des jours de congé avec le label "jour(s)"
 *
 * @param days - Nombre de jours
 * @returns Chaîne formatée avec label (ex: "2 jours", "demi jour", "1 et demi jours")
 */
export function formatLeaveDaysWithLabel(days: number): string {
  const formatted = formatLeaveDays(days);

  if (formatted === "demi") {
    return "demi jour";
  }

  if (days <= 1.5) {
    return `${formatted} jour${days > 1 ? 's' : ''}`;
  }

  return `${formatted} jours`;
}
