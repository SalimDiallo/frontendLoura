'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import { organizationService, categoryService } from '@/lib/services/core';
import type { Category } from '@/lib/types';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useZodForm } from '@/lib/hooks';
import {
  Form,
  FormInputField,
  FormEmailField,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Button,
  Alert,
} from '@/components/ui';
import { FormSelectField } from '@/components/ui/form-fields';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';

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
  logo_url: z
    .string()
    .optional()
    .or(z.literal('')),
  category: z
    .number()
    .positive('La catégorie est obligatoire'),
  settings: z.object({
    country: z
      .string()
      .length(2, 'Code pays ISO (2 lettres)')
      .default('GN'),
    currency: z
      .string()
      .length(3, 'Code devise ISO (3 lettres)')
      .default('GNF'),
    contact_email: z.union([
      z.string().email('Adresse email invalide'),
      z.literal(''),
    ]).optional(),
  }),
});

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useZodForm({
    schema: organizationSchema,
    defaultValues: {
      name: '',
      subdomain: '',
      logo_url: '',
      category: undefined,
      settings: {
        country: 'GN',
        currency: 'GNF',
        theme: 'light' as const,
        contact_email: '',
      },
    },
  });

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as any).results)) {
        setCategories((data as any).results);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubdomainChange = (value: string) => {
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');
    return cleaned;
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setError('Format de fichier non supporté. Utilisez JPG, PNG, GIF, WebP ou SVG.');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier est trop volumineux (max 5 Mo)');
        return;
      }
      
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setError(null);
      
      // Create organization first
      const org = await organizationService.create(data);
      
      // Upload logo if selected
      if (logoFile && org.id) {
        setUploadingLogo(true);
        try {
          await organizationService.uploadLogo(org.id, logoFile);
        } catch (logoErr) {
          console.error('Erreur upload logo:', logoErr);
          // Continue anyway, org is created
        }
        setUploadingLogo(false);
      }
      
      router.push(siteConfig.core.dashboard.home);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors de la création de l'organisation");
      }
    }
  });

  const categoryOptions = Array.isArray(categories)
    ? categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
      }))
    : [];

  return (
    <div className="min-h-screen bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg transition-colors">
          <div className="px-6 py-4 border-b border-border dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-foreground dark:text-white">
                Nouvelle Organisation
              </h1>
              <Link
                href={siteConfig.core.dashboard.home}
                className="text-sm text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-colors"
              >
                ← Retour au dashboard
              </Link>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={onSubmit} className="px-6 py-6 space-y-6">
              {error && (
                <Alert variant="error">
                  {error}
                </Alert>
              )}

              {/* Informations de base */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-foreground dark:text-white">
                  Informations de base
                </h2>

                <FormInputField
                  name="name"
                  label="Nom de l'organisation"
                  placeholder="Ma Super Entreprise"
                  required
                />

                <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Sous-domaine
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex rounded-md">
                          <input
                            {...field}
                            type="text"
                            placeholder="super-entreprise"
                            onChange={(e) => field.onChange(handleSubdomainChange(e.target.value))}
                            className="flex-1 block w-full px-3 py-2 border border-input dark:border-slate-700 bg-background dark:bg-slate-900 text-foreground dark:text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm font-mono transition-colors"
                          />
                          <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input dark:border-slate-700 bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-400 text-sm transition-colors">
                            .loura.app
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Lettres, chiffres et tirets uniquement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormSelectField
                  name="category"
                  label="Catégorie"
                  placeholder="Sélectionner une catégorie"
                  options={categoryOptions}
                  required
                />

                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground dark:text-white">
                    Logo de l'organisation
                  </label>
                  
                  {logoPreview ? (
                    <div className="relative w-32 h-32 rounded-xl border-2 border-primary/30 bg-muted/50 overflow-hidden group">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all">
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Ajouter logo</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, WebP ou SVG. Max 5 Mo.
                  </p>
                </div>
              </div>

              {/* Paramètres */}
              <div className="space-y-4 pt-6 border-t border-border dark:border-slate-800 transition-colors">
                <h2 className="text-lg font-medium text-foreground dark:text-white">Paramètres</h2>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="settings.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <input
                            {...field}
                            type="text"
                            maxLength={2}
                            placeholder="GN"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className="mt-1 block w-full px-3 py-2 border border-input dark:border-slate-700 bg-background dark:bg-slate-900 text-foreground dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm transition-colors"
                          />
                        </FormControl>
                        <FormDescription>Code ISO (2 lettres)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Devise</FormLabel>
                        <FormControl>
                          <input
                            {...field}
                            type="text"
                            maxLength={3}
                            placeholder="GNF"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className="mt-1 block w-full px-3 py-2 border border-input dark:border-slate-700 bg-background dark:bg-slate-900 text-foreground dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm transition-colors"
                          />
                        </FormControl>
                        <FormDescription>Code ISO (3 lettres)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormEmailField
                  name="settings.contact_email"
                  label="Email de contact"
                  placeholder="contact@exemple.com"
                />
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-border dark:border-slate-800 flex justify-end space-x-3 transition-colors">
                <Link
                  href={siteConfig.core.dashboard.organizations.list}
                  className="px-4 py-2 border border-input dark:border-slate-700 bg-background dark:bg-slate-950 rounded-md text-sm font-medium text-foreground dark:text-white hover:bg-accent dark:hover:bg-slate-900 transition-colors"
                >
                  Annuler
                </Link>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || uploadingLogo}
                >
                  {form.formState.isSubmitting || uploadingLogo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadingLogo ? 'Upload logo...' : 'Création...'}
                    </>
                  ) : "Créer l'organisation"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
