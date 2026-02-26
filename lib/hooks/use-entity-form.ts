/**
 * Hook générique pour gérer les formulaires d'entités
 * Élimine la duplication de code dans les pages de création/édition
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UseEntityFormOptions<T> {
  /**
   * Données initiales du formulaire
   */
  initialData: T;

  /**
   * Fonction pour récupérer les données (mode édition)
   * Si fournie, le hook chargera les données au montage
   */
  fetchData?: () => Promise<T>;

  /**
   * Fonction pour créer/mettre à jour l'entité
   */
  onSubmit: (data: T) => Promise<void | any>;

  /**
   * URL de redirection après succès
   */
  redirectUrl: string;

  /**
   * Fonction de validation personnalisée (optionnelle)
   */
  validate?: (data: T) => string | null;

  /**
   * Générateur de code automatique (optionnel)
   * @param data - Données du formulaire
   * @returns Le code généré ou undefined pour garder le code existant
   */
  generateCode?: (data: T) => string | undefined;

  /**
   * Callback après succès (optionnel)
   */
  onSuccess?: () => void;

  /**
   * Callback après erreur (optionnel)
   */
  onError?: (error: Error) => void;
}

export interface UseEntityFormReturn<T> {
  /** Données du formulaire */
  formData: T;

  /** État de chargement */
  loading: boolean;

  /** Message d'erreur */
  error: string | null;

  /** Met à jour un champ du formulaire */
  setField: (field: keyof T, value: any) => void;

  /** Met à jour plusieurs champs à la fois */
  setFields: (fields: Partial<T>) => void;

  /** Handler pour les inputs HTML */
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

  /** Handler pour les checkboxes */
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /** Handler pour la soumission du formulaire */
  handleSubmit: (e: React.FormEvent) => Promise<void>;

  /** Réinitialise le formulaire */
  reset: () => void;

  /** Définit une erreur manuellement */
  setError: (error: string | null) => void;

  /** Définit les données du formulaire */
  setFormData: React.Dispatch<React.SetStateAction<T>>;
}

/**
 * Hook pour gérer les formulaires d'entités avec CRUD
 */
export function useEntityForm<T extends Record<string, any>>(
  options: UseEntityFormOptions<T>
): UseEntityFormReturn<T> {
  const router = useRouter();
  const {
    initialData,
    fetchData,
    onSubmit,
    redirectUrl,
    validate,
    generateCode,
    onSuccess,
    onError,
  } = options;

  const [formData, setFormData] = useState<T>(initialData);
  const [loading, setLoading] = useState(!!fetchData); // Loading si on doit fetch
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge les données au montage si fetchData est fourni (mode édition)
   */
  useEffect(() => {
    if (fetchData) {
      const loadData = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await fetchData();
          setFormData(data);
        } catch (err: any) {
          setError(err.message || 'Erreur lors du chargement des données');
          onError?.(err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [fetchData, onError]);

  /**
   * Met à jour un champ spécifique
   */
  const setField = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Met à jour plusieurs champs à la fois
   */
  const setFields = useCallback((fields: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  }, []);

  /**
   * Handler générique pour les inputs
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;

      let parsedValue: any = value;

      // Conversion automatique des types
      if (type === 'number') {
        parsedValue = value === '' ? undefined : parseFloat(value) || 0;
      } else if (type === 'checkbox' && 'checked' in e.target) {
        parsedValue = (e.target as HTMLInputElement).checked;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    },
    []
  );

  /**
   * Handler spécifique pour les checkboxes
   */
  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    },
    []
  );

  /**
   * Handler de soumission du formulaire
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation personnalisée
      if (validate) {
        const validationError = validate(formData);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      try {
        setLoading(true);
        setError(null);

        // Génération automatique du code si nécessaire
        let dataToSubmit = { ...formData };
        if (generateCode) {
          const generatedCode = generateCode(formData);
          if (generatedCode) {
            dataToSubmit = { ...dataToSubmit, code: generatedCode } as T;
          }
        }

        // Soumission
        await onSubmit(dataToSubmit);

        // Callback de succès
        onSuccess?.();

        // Redirection
        router.push(redirectUrl);
      } catch (err: any) {
        const errorMessage = err.message || 'Une erreur est survenue';
        setError(errorMessage);
        onError?.(err);
      } finally {
        setLoading(false);
      }
    },
    [formData, validate, generateCode, onSubmit, onSuccess, onError, redirectUrl, router]
  );

  /**
   * Réinitialise le formulaire
   */
  const reset = useCallback(() => {
    setFormData(initialData);
    setError(null);
  }, [initialData]);

  return {
    formData,
    loading,
    error,
    setField,
    setFields,
    handleChange,
    handleCheckboxChange,
    handleSubmit,
    reset,
    setError,
    setFormData,
  };
}
