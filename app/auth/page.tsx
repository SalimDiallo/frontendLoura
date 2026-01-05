'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { authService } from '@/lib/services/auth/auth.service';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useZodForm } from '@/lib/hooks';
import {
  Form,
  FormEmailField,
  FormPasswordField,
  Button,
  Alert,
} from '@/components/ui';
import { cn } from '@/lib/utils';

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
type UserType = 'admin' | 'employee';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  // Récupérer les paramètres de l'URL au chargement
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setInfoMessage(decodeURIComponent(message));
    }
    
    // Type d'utilisateur
 
    
    // URL de redirection après login
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectUrl(decodeURIComponent(redirect));
    }
  }, [searchParams]);

  const form = useZodForm({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * Détermine l'URL de redirection après login
   */
  const getRedirectUrl = (userType: 'admin' | 'employee', user: any): string => {
    // Si une URL de redirection spécifique est fournie, l'utiliser
    if (redirectUrl) {
      return redirectUrl;
    }

    // Sinon, rediriger vers le dashboard approprié
    if (userType === 'admin') {
      return siteConfig.core.dashboard.home;
    }
    
    // Pour les employés, rediriger vers leur organisation
    const orgSubdomain = user.organization?.subdomain;
    if (orgSubdomain) {
      return `/apps/${orgSubdomain}/dashboard`;
    }

    // Fallback
    return '/';
  };

  const onSubmit = form.handleSubmit(async (data: LoginFormData) => {
    try {
      setError(null);
      const response = await authService.login(data);
      
      // Obtenir l'URL de redirection
      const destination = getRedirectUrl(response.user_type, response.user);
      
      // Effectuer la redirection
      router.push(destination);
    } catch (err) {
      if (err instanceof ApiError) {
        // Messages d'erreur plus explicites
        if (err.status === 401) {
          setError("Identifiant incorrects");
        } else if (err.status === 403) {
          setError('Compte désactivé. Contactez votre administrateur.');
        } else {
          setError('Identifiants incorrects');
        }
      } else {
        setError('Une erreur est survenue lors de la connexion');
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-6">
        {/* Logo / Brand */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 mb-4 hover:scale-105 transition-transform">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Loura
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Connexion à votre espace
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 transition-colors">
          
          {/* User Type Selector */}
          {/* <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              Je suis
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedType('admin')}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                  selectedType === 'admin'
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                {selectedType === 'admin' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors",
                  selectedType === 'admin' 
                    ? "bg-blue-500 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                
                <span className={cn(
                  "text-sm font-semibold transition-colors",
                  selectedType === 'admin' 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-slate-700 dark:text-slate-300"
                )}>
                  Administrateur
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Propriétaire
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('employee')}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                  selectedType === 'employee'
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                {selectedType === 'employee' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors",
                  selectedType === 'employee' 
                    ? "bg-emerald-500 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                <span className={cn(
                  "text-sm font-semibold transition-colors",
                  selectedType === 'employee' 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-slate-700 dark:text-slate-300"
                )}>
                  Employé
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Collaborateur
                </span>
              </button>
            </div>
          </div> */}

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">
                Connexion
              </span>
            </div>
          </div>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-5">
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
                  label="Adresse email"
                  placeholder={"user@gmail.com"}
                  required
                />

                <FormPasswordField
                  name="password"
                  label="Mot de passe"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-600 dark:text-slate-400">Se souvenir de moi</span>
                </label>
                <Link
                  href={siteConfig.auth.forgotPassword}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                className={cn(
                  "w-full h-11 text-base font-medium transition-all",
                  "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                   
                )}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion en cours...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Pas encore de compte ?{' '}
              <Link
                href={siteConfig.auth.register}
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Créer une compte
              </Link>
            </p>
          <p className="text-xs text-gray-500 dark:text-slate-500">
            © 2024 Loura. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
