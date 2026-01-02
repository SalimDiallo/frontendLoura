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
import { Upload, X, ImageIcon, Loader2, 
  Building2, Globe, Settings, ArrowRight,
  Monitor, CheckCircle 
} from 'lucide-react';
import { QuickSelect } from '@/components/ui/quick-select';
import { COUNTRIES, CURRENCIES } from '@/lib/data/geo';

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
    theme: z.enum(['light', 'dark', 'system']).default('light'),
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
        theme: 'light',
        contact_email: '',
      },
    },
  });

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      // Handle Django pagination response { count: number, results: [...] }
      const data = 'results' in response ? (response as any).results : response;
      
      if (Array.isArray(data)) {
        setCategories(data);
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

  // Slug generation helper
  const generateSlug = (name: string) => {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with -
      .replace(/-+/g, '-')        // Replace multiple - with single -
      .replace(/^-|-$/g, '');     // Remove leading/trailing -
    
    // Generate a short random string for uniqueness (6 chars)
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    
    return `${baseSlug}-${uniqueSuffix}`;
  };

  // Watch name changes to auto-generate subdomain
  const watchedName = form.watch('name');
  const watchedSubdomain = form.watch('subdomain');
  const watchedCategory = form.watch('category');
  
  useEffect(() => {
    if (watchedName) {
      const slug = generateSlug(watchedName);
      form.setValue('subdomain', slug);
    }
  }, [watchedName, form]);

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
  
  // Get category label for preview
  const selectedCategoryLabel = categoryOptions.find(c => c.value === watchedCategory)?.label || 'Non catégorisé';

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 py-8 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">
              Nouvelle Organisation
            </h1>
            <p className="text-muted-foreground dark:text-slate-400 mt-1">
              Configurez votre espace de travail et commencez à gérer vos opérations.
            </p>
          </div>
          <Link
            href={siteConfig.core.dashboard.home}
            className="text-sm text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-colors"
          >
            ← Retour au dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main FormColumn */}
          <div className="lg:col-span-2 space-y-6">
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-8">
                {error && (
                  <Alert variant="error">
                    {error}
                  </Alert>
                )}

                {/* Section: Identité */}
                <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-border dark:border-slate-800 pb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground dark:text-white">
                      Identité de l'organisation
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div className="grid gap-6">
                       {/* Logo Upload - Enhanced */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground dark:text-white block">
                          Logo
                        </label>
                        <div className="flex items-center gap-6">
                          {logoPreview ? (
                            <div className="relative w-24 h-24 rounded-2xl border border-border dark:border-slate-700 bg-muted/30 overflow-hidden group shadow-sm">
                              <Image
                                src={logoPreview}
                                alt="Logo preview"
                                fill
                                className="object-contain p-2"
                              />
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                              >
                                <X className="h-6 w-6 text-white" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <label className="inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                              <Upload className="mr-2 h-4 w-4" />
                              Choisir un fichier
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoSelect}
                                className="hidden"
                              />
                            </label>
                            <p className="text-xs text-muted-foreground mt-2">
                              Recommandé: Format carré, fond transparent. Max 5 Mo.
                            </p>
                          </div>
                        </div>
                      </div>

                      <FormInputField
                        name="name"
                        label="Nom de l'organisation"
                        placeholder="Ex: Tech Solutions Inc."
                        description="Ce nom sera affiché partout sur votre espace."
                        required
                      />

                      <FormSelectField
                        name="category"
                        label="Secteur d'activité"
                        placeholder="Sélectionner une catégorie"
                        options={categoryOptions}
                        required
                      />
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
                      Paramètres régionaux
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
                    <FormEmailField
                      name="settings.contact_email"
                      label="Email de contact (Optionnel)"
                      placeholder="contact@exemple.com"
                      description="Utilisé pour les communications administratives."
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-border dark:border-slate-800">
                  <Link
                    href={siteConfig.core.dashboard.organizations.list}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Annuler
                  </Link>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={form.formState.isSubmitting || uploadingLogo}
                    className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    {form.formState.isSubmitting || uploadingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        Créer l'organisation
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Sidebar Preview - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Preview Card */}
              <div className="bg-gradient-to-br from-card to-muted/50 dark:from-slate-900 dark:to-slate-950 border border-border dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground">
                  <Monitor className="w-4 h-4" />
                  Aperçu
                </div>

                <div className="bg-background dark:bg-slate-950 rounded-lg border border-border dark:border-slate-800 p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="relative w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Preview"
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground dark:text-white line-clamp-1">
                        {watchedName || "Nom de l'organisation"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedCategoryLabel}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                      Adresse Web
                    </div>
                    <div className="flex items-center text-sm font-mono text-primary truncate">
                      <span className="truncate">
                        {watchedSubdomain || "sous-domaine"}
                      </span>
                      <span className="opacity-50">.loura.app</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      URL unique générée
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Votre organisation sera accessible immédiatement après la création. Vous pourrez inviter vos collaborateurs et configurer vos services.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
