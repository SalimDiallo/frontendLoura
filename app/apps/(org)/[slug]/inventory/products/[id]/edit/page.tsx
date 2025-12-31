"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, Alert } from "@/components/ui";
import { getProduct, updateProduct, getCategories } from "@/lib/services/inventory";
import type { ProductUpdate, Category } from "@/lib/types/inventory";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<ProductUpdate>({
    name: "",
    sku: "",
    description: "",
    category: undefined,
    purchase_price: 0,
    selling_price: 0,
    unit: "unit",
    min_stock_level: 0,
    max_stock_level: 0,
    reorder_point: 0,
    barcode: "",
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productData, categoriesData] = await Promise.all([
        getProduct(productId),
        getCategories({ is_active: true }),
      ]);

      setFormData({
        name: productData.name,
        sku: productData.sku,
        description: productData.description || "",
        category: productData.category || undefined,
        purchase_price: productData.purchase_price,
        selling_price: productData.selling_price,
        unit: productData.unit,
        min_stock_level: productData.min_stock_level,
        max_stock_level: productData.max_stock_level,
        reorder_point: productData.reorder_point,
        barcode: productData.barcode || "",
        is_active: productData.is_active,
      });

      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du produit");
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
      [name]: type === "number" ? parseFloat(value) || 0 : type === "checkbox" ? (e.target as HTMLInputElement).checked : value || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);
      await updateProduct(productId, formData);
      router.push(`/apps/${slug}/inventory/products/${productId}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour du produit");
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
        <Link href={`/apps/${slug}/inventory/products/${productId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Modifier le produit</h1>
          <p className="text-muted-foreground mt-1">
            Mettez à jour les informations du produit
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
      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Informations de base */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Informations générales</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom du produit <span className="text-destructive">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Ordinateur portable"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  SKU <span className="text-destructive">*</span>
                </label>
                <Input
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  placeholder="Ex: LAPTOP-001"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="Description du produit..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <select
                  name="category"
                  value={formData.category || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Aucune catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Code-barres</label>
                <Input
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Ex: 1234567890123"
                />
              </div>
            </div>
          </div>

          {/* Prix */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Prix et unité</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Prix d'achat (GNF) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Prix de vente (GNF) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unité</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="unit">Unité</option>
                  <option value="kg">Kilogramme</option>
                  <option value="g">Gramme</option>
                  <option value="l">Litre</option>
                  <option value="ml">Millilitre</option>
                  <option value="m">Mètre</option>
                  <option value="cm">Centimètre</option>
                  <option value="box">Boîte</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
            </div>
          </div>

          {/* Gestion du stock */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Gestion du stock</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">Seuil d'alerte stock</label>
                <Input
                  type="number"
                  name="min_stock_level"
                  value={formData.min_stock_level}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ Une alerte sera générée quand le stock descend en dessous de cette quantité
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock maximum</label>
                <Input
                  type="number"
                  name="max_stock_level"
                  value={formData.max_stock_level}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Point de réapprovisionnement</label>
                <Input
                  type="number"
                  name="reorder_point"
                  value={formData.reorder_point}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Status */}
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
              Produit actif
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
            <Link href={`/apps/${slug}/inventory/products/${productId}`}>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
