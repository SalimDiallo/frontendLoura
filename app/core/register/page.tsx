'use client';

import {
    Alert,
    Button,
    Form,
    FormEmailField,
    FormInputField,
    PasswordFieldWithToggle,
} from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useUser, useZodForm } from '@/lib/hooks';
import { authService } from '@/lib/services/core';
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    Building2,
    Check,
    Shield,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

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

// Features list (sobre, icon + texte simple)
const features = [
  { icon: Building2, text: "Multi-entreprises" },
  { icon: Users, text: "Équipes illimitées" },
  { icon: BarChart3, text: "Dashboards en temps réel" },
  { icon: Shield, text: "Sécurité renforcée" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const user = useUser();

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

  if (user?.id) {
    if (user.user_type === "admin") {
      router.push(`/core/dashboard`)
      return;
    } else if (user.user_type == "employee") {
      router.push(`/apps/${user.organization?.subdomain}/dashboard`)
    }
  }

  const onSubmit = form.handleSubmit(async (data: RegisterFormData) => {
    try {
      setError(null);
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
    <div className="min-h-screen flex bg-white dark:bg-black transition-colors relative">
      {/* Bouton Retour */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded border border-border bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Accueil
      </Link>

      {/* Panneau gauche sobre */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[50%] bg-white dark:bg-black border-r border-border relative items-center justify-center transition-colors">
        <div className="w-full px-12 xl:px-16 flex flex-col justify-center">
          <div className="mb-10">
            <Logo showTitle className="[&_h1]:text-black dark:[&_h1]:text-white" />
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-black dark:text-white mb-4">
            Simplifiez la gestion de votre entreprise
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-300 mb-8 max-w-md">
            Unifiez vos opérations d'équipe et gérez vos organisations en toute sérénité.
          </p>
          <ul className="space-y-3 mb-12">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-primary/10 dark:bg-primary/20 text-primary">
                  <feature.icon className="w-4 h-4" />
                </span>
                <span className="text-black dark:text-white text-base">{feature.text}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-7 pt-6 border-t border-border mt-auto">
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Shield className="w-4 h-4" />
              <span>SSL sécurisé</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Check className="w-4 h-4" />
              <span>Respect RGPD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau droit - Formulaire */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 bg-white dark:bg-black transition-colors">
        <div className="w-full max-w-md">
          {/* Header mobile */}
          <div className="lg:hidden mb-8 text-center">
            <Logo showTitle className="flex items-center justify-center gap-2 mb-6 [&_h1]:text-black dark:[&_h1]:text-white" />
          </div>

          {/* Titre du formulaire */}
          <div className="mb-7">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2 text-black dark:text-white">
              Créer un compte
            </h2>
            {/* <p className="text-neutral-500 dark:text-neutral-400">
              Essai gratuit 14 jours
            </p> */}
          </div>

          {/* Formulaire */}
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-5">
              {error && (
                <Alert variant="error">
                  {error}
                </Alert>
              )}

              <FormEmailField
                name="email"
                label="Adresse email professionnelle"
                placeholder="vous@entreprise.com"
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

              <PasswordFieldWithToggle
                name="password"
                label="Mot de passe"
                placeholder="••••••••"
                autoComplete="new-password"
                description="Min. 8 caractères, 1 majuscule et 1 chiffre"
                required
              />

              <PasswordFieldWithToggle
                name="password_confirm"
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />

              {/* Conditions */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="terms" className="text-sm text-neutral-600 dark:text-neutral-300">
                  J'accepte les{' '}
                  <Link href="#" className="text-black dark:text-white hover:underline transition-colors">
                    Conditions d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link href="#" className="text-black dark:text-white hover:underline transition-colors">
                    Politique de confidentialité
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  'Création en cours...'
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Lien connexion */}
          <p className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-300">
            Déjà un compte ?{' '}
            <Link
              href={siteConfig.core.auth.login}
              className="font-medium text-black dark:text-white hover:text-primary transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
