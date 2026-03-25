'use client';

import {
  Alert,
  Button,
  Form,
  FormEmailField,
  FormInputField
} from '@/components/ui';
import { QuickSelect } from '@/components/ui/quick-select';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { COUNTRIES, CURRENCIES } from '@/lib/data/geo';
import { useZodForm } from '@/lib/hooks';
import {
  categoryService,
  moduleService,
  organizationService
} from '@/lib/services/core';
import type { Category, Module, ModuleCreateData } from '@/lib/types';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle,
  Globe,
  ImageIcon,
  Loader2,
  Package,
  Settings,
  Upload,
  X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { FormSelect } from '../common';
import { ModuleSelector } from './module-selector';

const organizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  subdomain: z
    .string()
    .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
    .max(50, 'Le sous-domaine ne peut pas dépasser 50 caractères')
    .regex(
      /^[a-z0-9-]+$/,
      'Le sous-domaine ne peut contenir que des lettres minuscules, chiffres et tirets'
    )
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), {
      message: 'Le sous-domaine ne peut pas commencer ou finir par un tiret',
    }),
  logo_url: z.string().optional().or(z.literal('')),
  category: z.string({
    message: 'La catégorie est obligatoire'
  })
    .min(1, 'La catégorie est obligatoire')
    .refine((val) => val && val !== 'undefined' && val !== '', { message: 'La catégorie est obligatoire' }),
  settings: z.object({
    country: z.string().length(2, 'Code pays ISO (2 lettres)').default('GN'),
    currency: z.string().length(3, 'Code devise ISO (3 lettres)').default('GNF'),
    theme: z.enum(['light', 'dark', 'system']).default('light'),
    contact_email: z
      .union([z.string().email('Adresse email invalide'), z.literal('')])
      .optional(),
  }),
});

type WizardStep = 'info' | 'category' | 'modules' | 'settings' | 'review';

const STEPS: { id: WizardStep; label: string; icon: any }[] = [
  { id: 'info', label: 'Informations', icon: Building2 },
  { id: 'category', label: 'Catégorie', icon: Package },
  { id: 'modules', label: 'Modules', icon: Package },
  { id: 'settings', label: 'Paramètres', icon: Settings },
  { id: 'review', label: 'Validation', icon: CheckCircle },
];

export function OrganizationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('info');
  const [categories, setCategories] = useState<Category[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useZodForm({
    schema: organizationSchema,
    defaultValues: {
      name: '',
      subdomain: '',
      logo_url: '',
      category: '',
      settings: {
        country: 'GN',
        currency: 'GNF',
        theme: 'light',
        contact_email: '',
      },
    },
  });

  const watchedName = form.watch('name');
  const watchedSubdomain = form.watch('subdomain');
  const watchedCategory = form.watch('category');

  // Load categories and modules
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesResponse, modulesData] = await Promise.all([
        categoryService.getAll(),
        moduleService.getAll(),
      ]);

      const categoriesData =
        'results' in categoriesResponse
          ? (categoriesResponse as any).results
          : categoriesResponse;

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      // Ensure modulesData is an array
      const modules = Array.isArray(modulesData) ? modulesData : [];
      setAllModules(modules);

      // Pre-select core modules
      const coreModules = modules
        .filter((m) => m.is_core)
        .map((m) => m.code);
      setSelectedModules(coreModules);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    }
  };

  // Load default modules when category changes
  useEffect(() => {
    if (
      watchedCategory &&
      watchedCategory !== 'undefined' &&
      watchedCategory !== '' &&
      allModules.length > 0
    ) {
      loadDefaultModules(watchedCategory);
    }
  }, [watchedCategory, allModules]);

  const loadDefaultModules = async (categoryId: string) => {
    try {
      const response = await moduleService.getDefaultModules({
        category_id: categoryId,
      });

      const defaultCodes = response.default_modules.map((m) => m.code);
      setSelectedModules(defaultCodes);
    } catch (err) {
      console.error('Erreur lors du chargement des modules par défaut:', err);
      // Keep core modules at minimum
      const coreModules = allModules
        .filter((m) => m.is_core)
        .map((m) => m.code);
      setSelectedModules(coreModules);
    }
  };

  // Auto-generate subdomain from name
  useEffect(() => {
    if (watchedName && currentStep === 'info') {
      const slug = watchedName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      form.setValue('subdomain', `${slug}-${uniqueSuffix}`);
    }
  }, [watchedName, currentStep, form]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];
      if (!allowedTypes.includes(file.type)) {
        setError(
          'Format de fichier non supporté. Utilisez JPG, PNG, GIF, WebP ou SVG.'
        );
        return;
      }
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

  const getCurrentStepIndex = () => STEPS.findIndex((s) => s.id === currentStep);

  // Enforce category requirement even if categoryOptions present but nothing picked
  const canGoNext = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex === 0) {
      // Info step: require name and subdomain
      return !!watchedName && !!watchedSubdomain;
    }
    if (stepIndex === 1) {
      // Category step: require a valid category picked from list
      return !!watchedCategory && watchedCategory !== 'undefined' && watchedCategory !== '';
    }
    if (stepIndex === 2) {
      // Modules step: at least core modules
      return selectedModules.length > 0;
    }
    return true;
  };

  const goToNextStep = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
      setError(null);
    }
  };

  const goToPreviousStep = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
      setError(null);
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setError(null);
      setIsSubmitting(true);

      // Ensure a valid category is picked
      if (!data.category || data.category === '' || data.category === 'undefined') {
        setError('La catégorie est obligatoire');
        setIsSubmitting(false);
        return;
      }

      // Prepare modules data
      const modulesData: ModuleCreateData[] = selectedModules.map((code) => ({
        module_code: code,
        is_enabled: true,
      }));

      // Create organization
      const org = await organizationService.create({
        ...data,
        category: Number(data.category),
        modules: modulesData,
      });

      // Upload logo if selected
      if (logoFile && org.id) {
        try {
          await organizationService.uploadLogo(org.id, logoFile);
        } catch (logoErr) {
          console.error('Erreur upload logo:', logoErr);
        }
      }

      router.push(siteConfig.core.dashboard.home);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors de la création de l'organisation");
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const selectedCategoryLabel =
    categoryOptions.find((c) => c.value === watchedCategory)?.label ||
    'Non catégorisé';

  const currentStepIndex = getCurrentStepIndex();

  console.log(allModules);
  

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
              Configurez votre espace de travail en quelques étapes simples.
            </p>
          </div>
          <Link
            href={siteConfig.core.dashboard.home}
            className="text-sm text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-colors"
          >
            ← Retour au dashboard
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all
                        ${
                          isActive
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : isCompleted
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`
                        text-xs mt-2 font-medium
                        ${isActive ? 'text-foreground' : 'text-muted-foreground'}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`
                        flex-1 h-0.5 mx-2 transition-colors
                        ${isCompleted ? 'bg-primary' : 'bg-border'}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">

             {/* Preview Sidebar */}
             {/* <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground">
                  <Monitor className="w-4 h-4" />
                  Aperçu
                </div>

                <div className="bg-background dark:bg-slate-950 rounded-lg border border-border p-4 shadow-sm">
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
                      <h3 className="font-semibold text-foreground">
                        {watchedName || "Nom de l'organisation"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedCategoryLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                      Adresse Web
                    </div>
                    <div className="flex items-center text-sm font-mono text-primary truncate">
                      <span className="truncate">{watchedSubdomain || 'sous-domaine'}</span>
                      <span className="opacity-50">.loura.app</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Main Content */}
          <div className="">
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-6">
                {error && <Alert variant="error">{error}</Alert>}

                {/* Step Content */}
                <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl p-6 shadow-sm min-h-[400px]">
                  {/* Step 1: Info */}
                  {currentStep === 'info' && (
                    <div className="space-y-6">
                      <div className="border-b border-border dark:border-slate-800 pb-4">
                        <h2 className="text-xl font-semibold text-foreground dark:text-white">
                          Informations de base
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Commencez par donner un nom à votre organisation
                        </p>
                      </div>

                      {/* Logo */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Logo (Optionnel)</label>
                        <div className="flex items-center gap-6">
                          {logoPreview ? (
                            <div className="relative w-24 h-24 rounded-2xl border border-border bg-muted/30 overflow-hidden group">
                              <Image
                                src={logoPreview}
                                alt="Logo preview"
                                fill
                                className="object-contain p-2"
                              />
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
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
                            <label className="inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
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
                              Format carré recommandé. Max 5 Mo.
                            </p>
                          </div>
                        </div>
                      </div>

                      <FormInputField
                        name="name"
                        label="Nom de l'organisation"
                        placeholder="Ex: Tech Solutions Inc."
                        required
                      />

                      <FormInputField
                        name="subdomain"
                        label="Sous-domaine"
                        placeholder="mon-entreprise"
                        description="Votre organisation sera accessible via ce sous-domaine"
                        required
                      />
                    </div>
                  )}

                  {/* Step 2: Category */}
                  {currentStep === 'category' && (
                    <div className="space-y-6">
                      <div className="border-b border-border dark:border-slate-800 pb-4">
                        <h2 className="text-xl font-semibold text-foreground dark:text-white">
                          Secteur d'activité
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sélectionnez la catégorie qui correspond le mieux à votre organisation
                        </p>
                      </div>

                      <FormSelect
                        label="Catégorie"
                        name="category"
                        value={form.watch("category") || ""}
                        onChange={e => form.setValue("category", e.target.value, { shouldValidate: true })}
                        options={categoryOptions}
                        placeholder="Sélectionner une catégorie"
                        required
                        disabled={form.formState.isSubmitting}
                        error={form.formState.errors.category?.message as string | undefined}
                      />

                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground">
                          💡 <strong>Astuce :</strong> La catégorie sélectionnée déterminera
                          les modules qui seront activés par défaut pour votre organisation.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Modules */}
                  {currentStep === 'modules' && (
                    <div className="space-y-6">
                      <div className="border-b border-border dark:border-slate-800 pb-4">
                        <h2 className="text-xl font-semibold text-foreground dark:text-white">
                          Modules fonctionnels
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Choisissez les modules à activer pour votre organisation
                        </p>
                      </div>

                      <ModuleSelector
                        modules={allModules}
                        selectedModules={selectedModules}
                        onChange={setSelectedModules}
                      />
                    </div>
                  )}

                  {/* Step 4: Settings */}
                  {currentStep === 'settings' && (
                    <div className="space-y-6">
                      <div className="border-b border-border dark:border-slate-800 pb-4">
                        <h2 className="text-xl font-semibold text-foreground dark:text-white">
                          Paramètres régionaux
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Configurez les paramètres de localisation
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Pays <span className="text-destructive">*</span>
                          </label>
                          <QuickSelect
                            label="Pays"
                            items={COUNTRIES.map((c) => ({
                              id: c.id,
                              name: c.name,
                              subtitle: c.id,
                            }))}
                            selectedId={form.watch('settings.country')}
                            onSelect={(id) => form.setValue('settings.country', id)}
                            placeholder="Rechercher..."
                            icon={Globe}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Devise <span className="text-destructive">*</span>
                          </label>
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

                      <FormEmailField
                        name="settings.contact_email"
                        label="Email de contact (Optionnel)"
                        placeholder="contact@exemple.com"
                      />
                    </div>
                  )}

                  {/* Affichage de l'ensemble des erreurs du formulaire */}
                  {form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
                    <Alert variant="error" className="mb-4">
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {Object.entries(form.formState.errors).map(([field, err]: any) => {
                          // Pour les champs imbriqués (ex: settings.contact_email)
                          if (err && err.message) {
                            return (
                              <li key={field}>{err.message}</li>
                            );
                          }
                          // Pour les objets imbriqués (ex: settings)
                          if (err && typeof err === 'object') {
                            return Object.entries(err).map(([subField, subErr]: any) =>
                              subErr?.message ? (
                                <li key={field + '.' + subField}>{subErr.message}</li>
                              ) : null
                            );
                          }
                          return null;
                        })}
                      </ul>
                    </Alert>
                  )}

                  {/* Step 5: Review */}
                  {currentStep === 'review' && (
                    <div className="space-y-6">
                      <div className="border-b border-border dark:border-slate-800 pb-4">
                        <h2 className="text-xl font-semibold text-foreground dark:text-white">
                          Récapitulatif
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Vérifiez les informations avant de créer l'organisation
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h3 className="text-sm font-semibold mb-2">Informations</h3>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Nom :</dt>
                              <dd className="font-medium">{watchedName}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Sous-domaine :</dt>
                              <dd className="font-mono text-xs">{watchedSubdomain}.loura.app</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Catégorie :</dt>
                              <dd className="font-medium">{selectedCategoryLabel}</dd>
                            </div>
                          </dl>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h3 className="text-sm font-semibold mb-2">
                            Modules ({selectedModules.length})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedModules.map((code) => {
                              const module = allModules.find((m) => m.code === code);
                              return (
                                <span
                                  key={code}
                                  className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                                >
                                  {module?.name || code}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={currentStepIndex === 0 || isSubmitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Précédent
                  </Button>

                  {currentStep !== 'review' ? (
                    <Button
                      type="button"
                      onClick={goToNextStep}
                      disabled={!canGoNext()}
                    >
                      Suivant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          Créer l'organisation
                          <CheckCircle className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
