'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { organizationService, categoryService } from '@/lib/services/core';
import type { Category, Organization } from '@/lib/types/core';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { Alert } from '@/components/ui/alert';
import { useZodForm } from '@/lib/hooks';
import { Form } from '@/components/ui';
import { FormInputField, FormSelectField } from '@/components/ui/form-fields';
import { z } from 'zod';

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
        // Defensive: Ensure categories is always an array
        if (Array.isArray(catsData)) {
          setCategories(catsData);
        } else if (catsData && Array.isArray(catsData?.results)) {
          setCategories(catsData?.results);
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
        <div className="text-xl text-foreground">Chargement...</div>
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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card border rounded-lg">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Modifier l'Organisation
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {organization.subdomain}.loura.app
                </p>
              </div>
              <Link
                href={dashboardHref}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Retour au dashboard
              </Link>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={onSubmit} className="px-6 py-6 space-y-6">
              {error && <Alert variant="error">{error}</Alert>}

              {/* Informations de base */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-foreground">
                  Informations de base
                </h2>
                <FormInputField
                  name="name"
                  label="Nom de l'organisation"
                  placeholder="Ma Super Entreprise"
                  required
                />
                <FormInputField
                  name="subdomain"
                  label="Sous-domaine"
                  required
                  disabled
                  className="flex-1 block w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground sm:text-sm font-mono cursor-not-allowed"
                   />
                <FormSelectField
                  name="category"
                  label="Catégorie"
                  placeholder="Sélectionner une catégorie"
                  options={Array.isArray(categories) ? categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  })) : []}
                  required
                />
              </div>

              {/* Paramètres */}
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-lg font-medium text-foreground">Paramètres</h2>

                <div className="grid grid-cols-2 gap-4">
                  <FormInputField
                    name="settings.country"
                    label="Pays"
                    maxLength={2}
                    placeholder="GN"
                    onChange={e => form.setValue('settings.country', e.target.value.toUpperCase())}
                    description="Code ISO (2 lettres)"
                  />
                  <FormInputField
                    name="settings.currency"
                    label="Devise"
                    maxLength={3}
                    placeholder="GNF"
                    onChange={e => form.setValue('settings.currency', e.target.value.toUpperCase())}
                    description="Code ISO (3 lettres)"
                  />
                </div>

              
                <FormInputField
                  type="email"
                  name="settings.contact_email"
                  label="Email de contact"
                  placeholder="contact@exemple.com"
                />
              </div>

              {/* Statut de l'organisation */}
              <div className="pt-6 border-t">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Statut</h3>
                    <p className="text-sm text-muted-foreground">
                      Cette organisation est actuellement{' '}
                      <span className={organization.is_active ? 'text-foreground font-medium' : 'text-muted-foreground font-medium'}>
                        {organization.is_active ? 'active' : 'inactive'}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      organization.is_active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}
                  >
                    {organization.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Pour activer ou désactiver l'organisation, utilisez les actions du dashboard
                </p>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t flex justify-end space-x-3">
                <Link
                  href={dashboardHref}
                  className="px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground hover:bg-accent"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? 'Enregistrement...'
                    : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
