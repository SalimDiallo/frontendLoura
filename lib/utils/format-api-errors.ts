/**
 * Utilitaires pour formater les erreurs API du backend Django
 */

// Mapping des messages d'erreur anglais vers français
const ERROR_TRANSLATIONS: Record<string, string> = {
  // Email
  'Utilisateur with this email already exists.': 'Un utilisateur avec cet email existe déjà.',
  'user with this email already exists.': 'Un utilisateur avec cet email existe déjà.',
  'Enter a valid email address.': 'Veuillez entrer une adresse email valide.',
  
  // Password
  'This password is too short. It must contain at least 8 characters.': 
    'Ce mot de passe est trop court. Il doit contenir au moins 8 caractères.',
  'This password is too common.': 'Ce mot de passe est trop courant.',
  'This password is entirely numeric.': 'Ce mot de passe ne doit pas être entièrement numérique.',
  'The password is too similar to the email.': 'Le mot de passe est trop similaire à l\'email.',
  'The password is too similar to the username.': 'Le mot de passe est trop similaire au nom d\'utilisateur.',
  
  // Champs obligatoires
  'This field is required.': 'Ce champ est obligatoire.',
  'This field may not be blank.': 'Ce champ ne peut pas être vide.',
  'This field may not be null.': 'Ce champ ne peut pas être vide.',
  
  // Dates
  'Date has wrong format. Use one of these formats instead: YYYY-MM-DD.':
    'Format de date invalide. Utilisez le format: AAAA-MM-JJ.',
  'Invalid date.': 'Date invalide.',
  
  // Génériques
  'Not found.': 'Non trouvé.',
  'Permission denied.': 'Permission refusée.',
  'Invalid token.': 'Token invalide.',
  'Authentication credentials were not provided.': 'Identifiants d\'authentification non fournis.',
  
  // Validations
  'Ensure this field has no more than': 'Ce champ ne doit pas dépasser',
  'Ensure this value is less than or equal to': 'Cette valeur doit être inférieure ou égale à',
  'Ensure this value is greater than or equal to': 'Cette valeur doit être supérieure ou égale à',
};

// Labels des champs en français
const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  password: 'Mot de passe',
  password_confirm: 'Confirmation du mot de passe',
  first_name: 'Prénom',
  last_name: 'Nom',
  phone: 'Téléphone',
  date_of_birth: 'Date de naissance',
  gender: 'Genre',
  address: 'Adresse',
  city: 'Ville',
  country: 'Pays',
  employee_id: 'Matricule',
  department: 'Département',
  position: 'Poste',
  manager: 'Manager',
  employment_status: 'Statut d\'emploi',
  hire_date: 'Date d\'embauche',
  termination_date: 'Date de fin',
  organization: 'Organisation',
  role: 'Rôle',
  name: 'Nom',
  code: 'Code',
  description: 'Description',
  non_field_errors: 'Erreur',
  detail: 'Erreur',
};

/**
 * Traduit un message d'erreur
 */
function translateError(message: string): string {
  // Vérifier une correspondance exacte
  if (ERROR_TRANSLATIONS[message]) {
    return ERROR_TRANSLATIONS[message];
  }
  
  // Vérifier les correspondances partielles
  for (const [english, french] of Object.entries(ERROR_TRANSLATIONS)) {
    if (message.toLowerCase().includes(english.toLowerCase())) {
      return message.replace(new RegExp(english, 'gi'), french);
    }
  }
  
  return message;
}

/**
 * Obtient le label d'un champ
 */
function getFieldLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] || fieldName.replace(/_/g, ' ');
}

export interface FormattedError {
  field: string;
  fieldLabel: string;
  messages: string[];
}

export interface ParsedApiError {
  /** Message principal formaté */
  message: string;
  /** Erreurs par champ */
  fieldErrors: FormattedError[];
  /** Est-ce une erreur de validation de formulaire */
  isValidationError: boolean;
}

/**
 * Parse et formate les erreurs d'API Django
 */
export function parseApiError(error: any): ParsedApiError {
  // Cas simple: erreur avec message string
  if (typeof error === 'string') {
    return {
      message: translateError(error),
      fieldErrors: [],
      isValidationError: false,
    };
  }
  
  // Erreur API avec data
  const errorData = error?.data || error;
  
  // Si c'est un message simple
  if (typeof errorData === 'string') {
    return {
      message: translateError(errorData),
      fieldErrors: [],
      isValidationError: false,
    };
  }
  
  // Si c'est un objet avec detail
  if (errorData?.detail && typeof errorData.detail === 'string') {
    return {
      message: translateError(errorData.detail),
      fieldErrors: [],
      isValidationError: false,
    };
  }
  
  // Si c'est un objet avec des erreurs par champ
  if (typeof errorData === 'object' && errorData !== null) {
    const fieldErrors: FormattedError[] = [];
    
    for (const [field, errors] of Object.entries(errorData)) {
      // Ignorer les champs meta
      if (field === 'status' || field === 'code') continue;
      
      let messages: string[] = [];
      
      if (Array.isArray(errors)) {
        messages = errors.map(e => translateError(String(e)));
      } else if (typeof errors === 'string') {
        messages = [translateError(errors)];
      } else if (typeof errors === 'object' && errors !== null) {
        // Erreurs imbriquées
        messages = Object.values(errors).flat().map(e => translateError(String(e)));
      }
      
      if (messages.length > 0) {
        fieldErrors.push({
          field,
          fieldLabel: getFieldLabel(field),
          messages,
        });
      }
    }
    
    if (fieldErrors.length > 0) {
      // Construire le message principal
      const message = fieldErrors
        .map(fe => `${fe.fieldLabel}: ${fe.messages.join(', ')}`)
        .join('\n');
      
      return {
        message,
        fieldErrors,
        isValidationError: true,
      };
    }
  }
  
  // Fallback
  return {
    message: error?.message || 'Une erreur est survenue',
    fieldErrors: [],
    isValidationError: false,
  };
}

/**
 * Formate les erreurs d'API en composants React-friendly
 * Retourne un objet avec les erreurs formatées pour l'affichage
 */
export function formatApiErrorsForDisplay(error: any): {
  title: string;
  errors: Array<{ field: string; messages: string[] }>;
} {
  const parsed = parseApiError(error);
  
  return {
    title: parsed.isValidationError 
      ? 'Erreurs de validation' 
      : 'Erreur',
    errors: parsed.fieldErrors.length > 0 
      ? parsed.fieldErrors.map(fe => ({ field: fe.fieldLabel, messages: fe.messages }))
      : [{ field: '', messages: [parsed.message] }],
  };
}
