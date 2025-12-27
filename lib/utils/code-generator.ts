/**
 * Utilitaires pour générer automatiquement des codes (SKU, codes de catégorie, etc.)
 */

/**
 * Génère un code à partir d'un nom en prenant les premières lettres et en ajoutant un suffixe numérique
 * @param name - Le nom à partir duquel générer le code
 * @param length - La longueur du préfixe (nombre de lettres à extraire)
 * @param suffix - Un suffixe numérique optionnel (ex: 001)
 * @returns Le code généré
 */
export function generateCodeFromName(name: string, length: number = 3, suffix?: string): string {
  if (!name) return '';

  // Nettoyer le nom: enlever les accents, caractères spéciaux, et mettre en majuscules
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-zA-Z0-9\s]/g, '') // Garder seulement lettres et chiffres
    .toUpperCase()
    .trim();

  // Extraire les premières lettres de chaque mot
  const words = cleanName.split(/\s+/);
  let code = '';

  if (words.length === 1) {
    // Un seul mot: prendre les N premières lettres
    code = words[0].substring(0, length);
  } else {
    // Plusieurs mots: prendre la première lettre de chaque mot
    code = words
      .map(word => word.charAt(0))
      .join('')
      .substring(0, length);

    // Si le code est trop court, compléter avec les lettres du premier mot
    if (code.length < length && words[0].length > 1) {
      const remaining = length - code.length;
      code += words[0].substring(1, 1 + remaining);
    }
  }

  // Ajouter le suffixe si fourni
  if (suffix) {
    code += `-${suffix}`;
  }

  return code;
}

/**
 * Génère un SKU pour un produit
 * @param productName - Le nom du produit
 * @param category - Le nom ou code de la catégorie (optionnel)
 * @param sequence - Le numéro de séquence (ex: 001)
 * @returns Le SKU généré
 */
export function generateSKU(
  productName: string,
  category?: string,
  sequence?: number
): string {
  if (!productName) return '';

  let sku = '';

  // Ajouter le préfixe de catégorie si disponible
  if (category) {
    const categoryCode = generateCodeFromName(category, 3);
    sku += categoryCode + '-';
  }

  // Ajouter le code du produit
  const productCode = generateCodeFromName(productName, 3);
  sku += productCode;

  // Ajouter la séquence si fournie
  if (sequence !== undefined) {
    sku += `-${String(sequence).padStart(3, '0')}`;
  }

  return sku;
}

/**
 * Génère un code de catégorie
 * @param categoryName - Le nom de la catégorie
 * @param parentCode - Le code de la catégorie parente (optionnel)
 * @returns Le code de catégorie généré
 */
export function generateCategoryCode(
  categoryName: string,
  parentCode?: string
): string {
  if (!categoryName) return '';

  const code = generateCodeFromName(categoryName, 4);

  // Si c'est une sous-catégorie, ajouter le code parent comme préfixe
  if (parentCode) {
    return `${parentCode}-${code}`;
  }

  return code;
}

/**
 * Génère un code fournisseur
 * @param supplierName - Le nom du fournisseur
 * @param sequence - Le numéro de séquence (optionnel)
 * @returns Le code fournisseur généré
 */
export function generateSupplierCode(
  supplierName: string,
  sequence?: number
): string {
  if (!supplierName) return '';

  const code = generateCodeFromName(supplierName, 4);

  if (sequence !== undefined) {
    return `SUPP-${code}-${String(sequence).padStart(3, '0')}`;
  }

  return `SUPP-${code}`;
}

/**
 * Génère un code entrepôt
 * @param warehouseName - Le nom de l'entrepôt
 * @param city - La ville de l'entrepôt (optionnel)
 * @returns Le code entrepôt généré
 */
export function generateWarehouseCode(
  warehouseName: string,
  city?: string
): string {
  if (!warehouseName) return '';

  let code = 'WH-';

  // Ajouter le code de la ville si disponible
  if (city) {
    code += generateCodeFromName(city, 3) + '-';
  }

  // Ajouter le code de l'entrepôt
  code += generateCodeFromName(warehouseName, 3);

  return code;
}

/**
 * Valide un code (vérifie le format)
 * @param code - Le code à valider
 * @param minLength - Longueur minimale
 * @param maxLength - Longueur maximale
 * @returns true si le code est valide
 */
export function validateCode(
  code: string,
  minLength: number = 2,
  maxLength: number = 20
): boolean {
  if (!code) return false;

  const trimmedCode = code.trim();

  // Vérifier la longueur
  if (trimmedCode.length < minLength || trimmedCode.length > maxLength) {
    return false;
  }

  // Vérifier que le code contient uniquement des lettres, chiffres et tirets
  return /^[A-Z0-9-]+$/i.test(trimmedCode);
}
