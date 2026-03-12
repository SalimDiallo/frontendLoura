'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { authService } from '@/lib/services/auth/auth.service';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useUser, useZodForm } from '@/lib/hooks';
import {
  Form,
  FormEmailField,
  Button,
  Alert,
  PasswordFieldWithToggle,
} from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { ArrowRight, ArrowLeft } from 'lucide-react';

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser();
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setInfoMessage(decodeURIComponent(message));
    }

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

  const getRedirectUrl = (userType: 'admin' | 'employee', user: any): string => {
    if (redirectUrl) {
      return redirectUrl;
    }

    if (userType === 'admin') {
      return siteConfig.core.dashboard.home;
    }
    
    const orgSubdomain = user.organization?.subdomain;
    if (orgSubdomain) {
      return `/apps/${orgSubdomain}/dashboard`;
    }

    return '/';
  };

  if (user?.id && user.user_type) {
    router.push(getRedirectUrl(user.user_type, user))
    return;
  }

  

  const onSubmit = form.handleSubmit(async (data: LoginFormData) => {
    try {
      setError(null);
      const response = await authService.login(data);
      const destination = getRedirectUrl(response.user_type, response.user);
      router.push(destination);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Identifiants incorrects");
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
    <div className="min-h-screen flex bg-background relative">
      {/* Bouton Retour */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-border bg-background/80 backdrop-blur-sm hover:bg-secondary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Accueil
      </Link>
      {/* Formulaire centré */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10 text-center">
            <Logo showTitle={true} className="flex items-center justify-center gap-2 mb-3" />
            <p className="text-muted-foreground text-sm">
              Connectez-vous à votre espace
            </p>
          </div>

          {/* Formulaire */}
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

              <FormEmailField
                name="email"
                label="Email"
                placeholder="vous@exemple.com"
                required
              />

              <PasswordFieldWithToggle
                name="password"
                label="Mot de passe"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-muted-foreground">Se souvenir</span>
                </label>
                <Link
                  href={siteConfig.auth.forgotPassword}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium group"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Connexion...
                  </div>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Séparateur */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-background text-muted-foreground">
                Nouveau sur LouraTech ?
              </span>
            </div>
          </div>

          {/* Lien inscription */}
          <Link
            href={siteConfig.auth.register}
            className="flex items-center justify-center w-full h-11 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            Créer un compte
          </Link>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} LouraTech. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
