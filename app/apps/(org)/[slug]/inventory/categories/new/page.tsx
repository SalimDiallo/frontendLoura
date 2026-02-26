"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Alert, Button } from "@/components/ui";
import { createCategory, getCategories } from "@/lib/services/inventory";
import type { CategoryCreate, Category } from "@/lib/types/inventory";
import { AlertTriangle, FolderTree, FileText, Repeat } from "lucide-react";
import { useEntityForm } from "@/lib/hooks";
import { FormHeader, FormActions, FormSection, FormField, FormCheckbox, FormSelect } from "@/components/common";
import { generateCategoryCode } from "@/lib/utils/code-generator";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";

export default function NewCategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);

  const form = useEntityForm<CategoryCreate>({
    initialData: {
      name: "",
      code: "",
      description: "",
      parent: undefined,
      is_active: true,
    },
    onSubmit: createCategory,
    redirectUrl: `/apps/${slug}/inventory/categories`,
    validate: (data) => {
      if (!data.name.trim()) return "Le nom de la catégorie est requis";
      if (!data?.code?.trim()) return "Le code de la catégorie est requis";
      return null;
    },
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories({ is_active: true });
      setCategories(data);
    } catch (err: any) {
      console.error("Erreur lors du chargement des catégories", err);
    }
  };

  const handleGenerateCode = () => {
    const parentCode = categories.find(c => c.id === form.formData.parent)?.code;
    const code = generateCategoryCode(form.formData.name, parentCode);
    if (code) {
      form.setField('code', code);
    }
  };

  // Convertir les catégories en options pour le select
  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: `${cat.name} (${cat.code})`
  }));

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_CATEGORIES} showMessage>
      <div className="space-y-6 p-6 max-w-4xl">
        <FormHeader
          title="Nouvelle catégorie"
          subtitle="Ajoutez une nouvelle catégorie de produits"
          backUrl={`/apps/${slug}/inventory/categories`}
        />

        {form.error && (
          <Alert variant="error" title="Erreur">
            {form.error}
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} className="space-y-6">
          <FormSection title="Informations générales" icon={FolderTree}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Nom de la catégorie"
                name="name"
                value={form.formData.name}
                onChange={form.handleChange}
                placeholder="Ex: Électronique"
                required
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateCode}
                    className="h-auto py-0 px-2 text-xs"
                    disabled={!form.formData.name.trim()}
                    title="Générer automatiquement le code"
                  >
                    <Repeat className="h-3 w-3 mr-1" />
                    Générer
                  </Button>
                </div>
                <FormField
                  label=""
                  name="code"
                  value={form.formData.code}
                  onChange={form.handleChange}
                  placeholder="Ex: ELEC"
                  required
                  help="Généré automatiquement à partir du nom de la catégorie"
                />
              </div>
            </div>

            <FormField
              label="Description"
              name="description"
              value={form.formData.description}
              onChange={form.handleChange}
              placeholder="Description de la catégorie..."
              multiline
              rows={4}
            />

            <FormSelect
              label="Catégorie parente"
              name="parent"
              value={form.formData.parent}
              onChange={form.handleChange}
              options={categoryOptions}
              placeholder="Aucune (catégorie racine)"
              icon={FolderTree}
              help="Sélectionnez une catégorie parente pour créer une sous-catégorie"
            />

            <FormCheckbox
              label="Catégorie active"
              name="is_active"
              checked={form.formData.is_active}
              onChange={form.handleCheckboxChange}
            />
          </FormSection>

          <FormActions
            cancelUrl={`/apps/${slug}/inventory/categories`}
            submitLabel="Créer la catégorie"
            loading={form.loading}
          />
        </form>
      </div>
    </Can>
  );
}
