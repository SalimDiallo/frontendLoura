'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { authService } from '@/lib/services/core';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useUser, useZodForm } from '@/lib/hooks';
import {
  Form,
  FormInputField,
  FormEmailField,
  Button,
  Alert,
  PasswordFieldWithToggle,
} from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { ArrowRight, ArrowLeft, Building2, Users, BarChart3, Shield, Check } from 'lucide-react';

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

// Features list pour l'illustration
const features = [
  { icon: Building2, text: "Gestion multi-entreprises" },
  { icon: Users, text: "Équipes illimitées" },
  { icon: BarChart3, text: "Tableaux de bord en temps réel" },
  { icon: Shield, text: "Sécurité de niveau entreprise" },
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
    }else if (user.user_type == "employee") {
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
    <div className="min-h-screen flex bg-background relative">
      {/* Bouton Retour */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-border bg-background/80 backdrop-blur-sm hover:bg-secondary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Accueil
      </Link>
      
      {/* Panneau gauche - Illustration créative */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-foreground relative overflow-hidden">
        {/* Pattern de fond */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-size-[60px_60px] bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]"></div>
        </div>
        
        {/* Cercles décoratifs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        
        {/* Contenu principal */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
          {/* Logo */}
          <div className="mb-12">
            <Logo showTitle={true} className="flex items-center gap-3 [&_h1]:text-background [&_span]:text-primary" />
          </div>
          
          {/* Titre principal */}
          <div className="mb-12">
            <h1 className="text-4xl xl:text-5xl font-bold text-background leading-tight mb-4">
              Simplifiez la gestion
              <br />
              <span className="text-primary">de votre entreprise</span>
            </h1>
            <p className="text-background/60 text-lg max-w-md">
              Rejoignez des milliers d'entreprises qui font confiance à LouraTech pour gérer leurs opérations quotidiennes.
            </p>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-12">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-background/5 backdrop-blur-sm border border-background/10"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-background/80 text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
          
          {/* Stats */}
          <div className="flex gap-12">
            <div>
              <p className="text-3xl font-bold text-background">5,000+</p>
              <p className="text-background/50 text-sm">Entreprises</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-background">99.9%</p>
              <p className="text-background/50 text-sm">Disponibilité</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-background">24/7</p>
              <p className="text-background/50 text-sm">Support</p>
            </div>
          </div>
        </div>
        
        {/* Illustration abstraite flottante */}
        <div className="absolute bottom-20 right-20 w-64 h-64 opacity-20">
          <div className="absolute inset-0 border-2 border-background/30 rounded-3xl rotate-12"></div>
          <div className="absolute inset-4 border-2 border-background/20 rounded-3xl -rotate-6"></div>
          <div className="absolute inset-8 border-2 border-background/10 rounded-3xl rotate-3"></div>
        </div>
      </div>
      
      {/* Panneau droit - Formulaire */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          {/* Header mobile */}
          <div className="lg:hidden mb-8 text-center">
            <Logo showTitle={true} className="flex items-center justify-center gap-2 mb-6" />
          </div>
          
          {/* Titre du formulaire */}
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
              Créer un compte
            </h2>
            <p className="text-muted-foreground">
              Commencez votre essai gratuit de 14 jours
            </p>
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
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  J'accepte les{' '}
                  <Link href="#" className="text-foreground hover:underline">
                    Conditions d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link href="#" className="text-foreground hover:underline">
                    Politique de confidentialité
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium group"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  'Création en cours...'
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </Form>
          
          {/* Lien connexion */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link
              href={siteConfig.core.auth.login}
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              Se connecter
            </Link>
          </p>
          
          {/* Badges de confiance */}
          <div className="mt-10 pt-8 border-t border-border">
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2 text-xs">
                <Shield className="w-4 h-4" />
                <span>SSL sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Check className="w-4 h-4" />
                <span>RGPD conforme</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
