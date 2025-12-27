'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { employeeAuthService } from '@/lib/services/hr';
import { organizationService } from '@/lib/services/core';
import { ApiError } from '@/lib/api/client';
import { useZodForm } from '@/lib/hooks';
import {
  Form,
  FormEmailField,
  FormPasswordField,
  Button,
  Alert,
} from '@/components/ui';

// Schéma de validation Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Adresse email invalide'),
  password: z
    .string()
    .min(1, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function EmployeeLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Récupérer le message de l'URL au chargement
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setInfoMessage(decodeURIComponent(message));
    }
  }, [searchParams]);

  const form = useZodForm({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = form.handleSubmit(async (data: LoginFormData) => {
    try {
      setError(null);
      const response = await employeeAuthService.login(data);

      // Utiliser le subdomain retourné par le backend
      if (response.employee.organization_subdomain) {
        // Rediriger vers le dashboard de l'organisation en utilisant le subdomain
        router.push(`/apps/${response.employee.organization_subdomain}/dashboard`);
      } else if (response.employee.organization) {
        // Fallback: si le backend ne retourne pas encore organization_subdomain
        // essayer de récupérer l'organisation
        try {
          const organization = await organizationService.getById(response.employee.organization);
          router.push(`/apps/${organization.subdomain || organization.id}/dashboard`);
        } catch (orgError) {
          console.error('Erreur lors de la récupération de l\'organisation:', orgError);
          setError("Impossible de rediriger vers votre organisation. Veuillez réessayer.");
        }
      } else {
        setError("Aucune organisation associée à ce compte employé.");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de la connexion');
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 sm:p-8 transition-colors">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-slate-100">
            Connexion Employé
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-400">
            Accédez à votre espace employé
          </p>
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
            Vous êtes administrateur ?{' '}
            <Link
              href="/auth/admin"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Connectez-vous ici
            </Link>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            {infoMessage && (
              <Alert variant="warning">
                {infoMessage}
              </Alert>
            )}

            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            <div className="space-y-4">
              <FormEmailField
                name="email"
                label="Adresse email professionnelle"
                placeholder="votre.nom@entreprise.com"
                required
              />

              <FormPasswordField
                name="password"
                label="Mot de passe"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/employee/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
