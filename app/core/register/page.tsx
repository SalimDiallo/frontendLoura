'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { authService } from '@/lib/services/core';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useZodForm } from '@/lib/hooks';
import {
  Form,
  FormInputField,
  FormEmailField,
  FormPasswordField,
  Button,
  Alert,
} from '@/components/ui';

// Schéma de validation Zod
const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Adresse email invalide'),
  first_name: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  last_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  password_confirm: z
    .string()
    .min(1, 'Veuillez confirmer votre mot de passe'),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useZodForm({
    schema: registerSchema,
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
    },
  });

  const onSubmit = form.handleSubmit(async (data: RegisterFormData) => {
    try {
      setError(null);
      // Enlever password_confirm avant d'envoyer à l'API
      await authService.register(data);
      router.push(siteConfig.core.dashboard.home);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors de l'inscription");
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 sm:p-8 transition-colors">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-slate-100">
            Créer un compte Loura
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-400">
            Ou{' '}
            <Link
              href={siteConfig.core.auth.login}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              se connecter à un compte existant
            </Link>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            <div className="space-y-4">
              <FormEmailField
                name="email"
                label="Adresse email"
                placeholder="exemple@email.com"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInputField
                  name="first_name"
                  label="Prénom"
                  placeholder="John"
                  required
                />

                <FormInputField
                  name="last_name"
                  label="Nom"
                  placeholder="Doe"
                  required
                />
              </div>

              <FormPasswordField
                name="password"
                label="Mot de passe"
                placeholder="••••••••"
                description="Minimum 8 caractères, 1 majuscule et 1 chiffre"
                autoComplete="new-password"
                required
              />

              <FormPasswordField
                name="password_confirm"
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Inscription en cours...' : "S'inscrire"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
