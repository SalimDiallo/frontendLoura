"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, Alert } from "@/components/ui";
import { getCategory, updateCategory, getCategories } from "@/lib/services/inventory";
import type { CategoryUpdate, Category } from "@/lib/types/inventory";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const categoryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<CategoryUpdate>({
    name: "",
    code: "",
    description: "",
    parent: undefined,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, [categoryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [categoryData, categoriesData] = await Promise.all([
        getCategory(categoryId),
        getCategories({ is_active: true }),
      ]);

      setFormData({
        name: categoryData.name,
        code: categoryData.code,
        description: categoryData.description || "",
        parent: categoryData.parent || undefined,
        is_active: categoryData.is_active,
      });

      // Filter out current category and its children from parent options
      setCategories(categoriesData.filter(c => c.id !== categoryId));
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);
      await updateCategory(categoryId, formData);
      router.push(`/apps/${slug}/inventory/categories/${categoryId}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour de la catégorie");
    } finally {
      setSaving(false);
    }
  };

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
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/apps/${slug}/inventory/categories/${categoryId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Modifier la catégorie</h1>
          <p className="text-muted-foreground mt-1">
            Mettez à jour les informations de la catégorie
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Erreur">
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom de la catégorie <span className="text-destructive">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Électronique"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Code <span className="text-destructive">*</span>
                </label>
                <Input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="Ex: ELEC"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Description de la catégorie..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Catégorie parente
              </label>
              <select
                name="parent"
                value={formData.parent || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Aucune (catégorie racine)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Sélectionnez une catégorie parente pour créer une sous-catégorie
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                id="is_active"
                className="h-4 w-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Catégorie active
              </label>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
          <Link href={`/apps/${slug}/inventory/categories/${categoryId}`}>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
