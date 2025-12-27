"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, Alert } from "@/components/ui";
import { createCategory, getCategories } from "@/lib/services/inventory";
import type { CategoryCreate, Category } from "@/lib/types/inventory";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import { generateCategoryCode } from "@/lib/utils/code-generator";

export default function NewCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<CategoryCreate>({
    name: "",
    code: "",
    description: "",
    parent: undefined,
    is_active: true,
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value || undefined,
    }));
  };

  const handleGenerateCode = () => {
    const parentCode = categories.find(c => c.id === formData.parent)?.code;
    const code = generateCategoryCode(formData.name, parentCode);
    if (code) {
      setFormData(prev => ({ ...prev, code }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await createCategory(formData);
      router.push(`/apps/${slug}/inventory/categories`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de la catégorie");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/apps/${slug}/inventory/categories`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouvelle catégorie</h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez une nouvelle catégorie de produits
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
                <div className="flex gap-2">
                  <Input
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="Ex: ELEC"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateCode}
                    disabled={!formData.name}
                    title="Générer automatiquement le code"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Généré automatiquement à partir du nom de la catégorie
                </p>
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
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Création en cours..." : "Créer la catégorie"}
          </Button>
          <Link href={`/apps/${slug}/inventory/categories`}>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
