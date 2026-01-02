'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { organizationService, categoryService } from '@/lib/services/core';
import type { Category, Organization } from '@/lib/types/core';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useZodForm } from '@/lib/hooks';
import { Form, Alert, FormInputField } from '@/components/ui';
import { FormSelectField } from '@/components/ui/form-fields';
import { QuickSelect } from '@/components/ui/quick-select';
import { COUNTRIES, CURRENCIES } from '@/lib/data/geo';
import { z } from 'zod';
import { 
  Building2, Globe, Settings, ArrowRight,
  Monitor, CheckCircle, Save, Loader2, ArrowLeft
} from 'lucide-react';

const organizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  subdomain: z
    .string()
    .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
    .max(50, 'Le sous-domaine ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le sous-domaine ne peut contenir que des lettres minuscules, chiffres et tirets')
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), {
      message: 'Le sous-domaine ne peut pas commencer ou finir par un tiret',
    }),
  category: z
    .number()
    .positive('La catégorie est obligatoire'),
  settings: z.object({
    country: z.string().length(2, 'Le code pays doit faire 2 caractères'),
    currency: z.string().length(3, 'Le code devise doit faire 3 caractères'),
    contact_email: z.union([
      z.string().email('Adresse email invalide'),
      z.literal(''),
    ]).optional(),
  }),
});

const dashboardHref =
  siteConfig.nav.core.find((n) => n.title === 'Tableau de bord')?.href ||
  '/core/dashboard';

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pré-rempli plus tard par les données org (voir effet useEffect)
  const form = useZodForm({
    schema: organizationSchema,
    defaultValues: {
      name: '',
      subdomain: '',
      category: 0,
      settings: {
        country: 'GN',
        currency: 'GNF',
        contact_email: '',
      },
    },
  });

  // Charge les catégories et l'organisation et initialise le formulaire
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [org, catsData] = await Promise.all([
          organizationService.getById(organizationId),
          categoryService.getAll(),
        ]);
        setOrganization(org);
        
        // Handle categories data
        const cats = 'results' in catsData ? (catsData as any).results : catsData;
        if (Array.isArray(cats)) {
          setCategories(cats);
        } else {
          setCategories([]);
        }

        form.reset({
          name: org.name,
          subdomain: org.subdomain,
          category: org.category ?? 0,
          settings: {
            country: org.settings.country || 'GN',
            currency: org.settings.currency || 'GNF',
            contact_email: org.settings.contact_email || '',
          },
        });
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          if (err.status === 404) {
            setTimeout(() => router.push(dashboardHref), 2000);
          }
        } else {
          setError("Erreur lors du chargement de l'organisation");
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);
    try {
      // Transformer les données pour le backend
      const payload = {
        ...data,
        settings: {
          ...data.settings,
          contact_email: data.settings.contact_email || undefined,
        },
      };

      await organizationService.update(organizationId, payload);
      router.push(dashboardHref);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors de la modification de l'organisation");
      }
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Organisation introuvable</h2>
          <p className="text-muted-foreground">Redirection vers le dashboard...</p>
        </div>
      </div>
    );
  }

  const categoryOptions = Array.isArray(categories) 
    ? categories.map((cat) => ({ value: cat.id, label: cat.name })) 
    : [];

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 py-8 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
              Configurer l'organisation
            </h1>
            <p className="text-muted-foreground dark:text-slate-400 mt-1">
              Modifiez les informations et préférences de {organization.name}
            </p>
          </div>
          <Link
            href={dashboardHref}
            className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-6">
                {error && <Alert variant="error">{error}</Alert>}

                {/* Section: Identité */}
                <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-border dark:border-slate-800 pb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground dark:text-white">
                      Identité
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <FormInputField
                      name="name"
                      label="Nom de l'organisation"
                      placeholder="Ma Super Entreprise"
                      required
                    />
                    
                    <FormSelectField
                      name="category"
                      label="Secteur d'activité"
                      placeholder="Sélectionner une catégorie"
                      options={categoryOptions}
                      required
                    />

                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Sous-domaine (Lecture seule)</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-md text-sm font-mono text-muted-foreground cursor-not-allowed">
                        <Monitor className="w-4 h-4" />
                        <span>{organization.subdomain}.loura.app</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Le sous-domaine ne peut pas être modifié après la création.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section: Paramètres Régionaux */}
                <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-border dark:border-slate-800 pb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Globe className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground dark:text-white">
                      Régionalisation
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Pays <span className="text-destructive">*</span></label>
                       <QuickSelect
                            label="Pays"
                            items={COUNTRIES.map(c => ({ id: c.id, name: c.name, subtitle: c.id }))}
                            selectedId={form.watch('settings.country')}
                            onSelect={(id) => form.setValue('settings.country', id)}
                            placeholder="Rechercher..."
                            icon={Globe}
                        />
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-medium">Devise <span className="text-destructive">*</span></label>
                       <QuickSelect
                            label="Devise"
                            items={CURRENCIES}
                            selectedId={form.watch('settings.currency')}
                            onSelect={(id) => form.setValue('settings.currency', id)}
                            placeholder="Rechercher..."
                            icon={Settings}
                        />
                    </div>
                  </div>

                  <div className="mt-6">
                    <FormInputField
                      type="email"
                      name="settings.contact_email"
                      label="Email de contact"
                      placeholder="contact@exemple.com"
                      description="Utilisé pour les communications administratives."
                    />
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-end gap-3 pt-4">
                   <Link
                    href={dashboardHref}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Annuler
                  </Link>
                  <button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Enregistrer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Form>
          </div>

          {/* Sidebar Status */}
          <div className="md:col-span-1 space-y-6">
             <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-6 shadow-sm sticky top-8">
                <h3 className="font-semibold text-foreground mb-4">État du compte</h3>
                
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50 mb-4">
                  <span className="text-sm font-medium">Statut</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      organization.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {organization.is_active ? <CheckCircle className="w-3 h-3"/> : null}
                    {organization.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-2">
                  <p>
                    Créé le: {new Date(organization.created_at).toLocaleDateString()}
                  </p>
                  <p>
                    Dernière modification: {new Date(organization.updated_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-border/50">
                   <h4 className="text-sm font-medium text-destructive mb-2">Zone de danger</h4>
                   <p className="text-xs text-muted-foreground mb-3">
                     Désactiver l'organisation suspendra l'accès à tous les membres.
                   </p>
                   <button 
                     type="button"
                     className="w-full px-3 py-2 text-xs font-medium text-destructive bg-destructive/5 hover:bg-destructive/10 border border-destructive/20 rounded-md transition-colors"
                   >
                     Désactiver l'organisation
                   </button>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
