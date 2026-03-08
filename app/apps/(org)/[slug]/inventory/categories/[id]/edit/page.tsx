"use client";

import { Can } from "@/components/apps/common";
import { FormActions, FormCheckbox, FormField, FormHeader, FormSection, FormSelect } from "@/components/common";
import { Alert } from "@/components/ui";
import { useEntityForm } from "@/lib/hooks";
import { getCategories, getCategory, updateCategory } from "@/lib/services/inventory";
import type { Category, CategoryUpdate } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { FolderTree } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const categoryId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useEntityForm<CategoryUpdate>({
    initialData: {
      name: "",
      code: "",
      description: "",
      parent: undefined,
      is_active: true,
    },
    onSubmit: async (data) => {
      await updateCategory(categoryId, data);
    },
    redirectUrl: `/apps/${slug}/inventory/categories/${categoryId}`,
    validate: (data) => {
      if (!data?.name?.trim()) return "Le nom de la catégorie est requis";
      if (!data?.code?.trim()) return "Le code de la catégorie est requis";
      return null;
    },
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [categoryId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoryData, categoriesData] = await Promise.all([
        getCategory(categoryId),
        getCategories({ is_active: true }),
      ]);
      form.setFormData({
        name: categoryData.name,
        code: categoryData.code,
        description: categoryData.description || "",
        parent: categoryData.parent || undefined,
        is_active: categoryData.is_active,
      });
      setCategories(categoriesData.filter((cat) => cat.id !== categoryId));
    } catch (err: any) {
      form.setError(err.message || "Erreur lors du chargement de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: `${cat.name} (${cat.code})`,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Can allPermissions={[COMMON_PERMISSIONS.INVENTORY.UPDATE_CATEGORIES, COMMON_PERMISSIONS.INVENTORY.VIEW_CATEGORIES]} showMessage>
      <div className="space-y-6 p-6 max-w-4xl">
        <FormHeader
          title="Modifier la catégorie"
          subtitle="Mettez à jour les informations de la catégorie"
          backUrl={`/apps/${slug}/inventory/categories/${categoryId}`}
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
              <FormField
                label="Code"
                name="code"
                value={form.formData.code}
                onChange={form.handleChange}
                required
                placeholder="Ex: ELEC"
                help=""
              />
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
            cancelUrl={`/apps/${slug}/inventory/categories/${categoryId}`}
            submitLabel={form.loading ? "Enregistrement..." : "Enregistrer les modifications"}
            loading={form.loading}
          />
        </form>
      </div>
    </Can>
  );
}
