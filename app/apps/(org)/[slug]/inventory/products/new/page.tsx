"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Input, Label } from "@/components/ui";
import { createProduct } from "@/lib/services/inventory";
import { getCategories } from "@/lib/services/inventory";
import type { ProductCreate, Category, ProductUnit } from "@/lib/types/inventory";
import { ArrowLeft, Save, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { generateSKU, generateCodeFromName } from "@/lib/utils/code-generator";

export default function NewProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductCreate>({
    name: "",
    sku: "",
    description: "",
    purchase_price: 0,
    selling_price: 0,
    unit: "unit" as ProductUnit,
    min_stock_level: 0,
    max_stock_level: 0,
    barcode: "",
    category: null,
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories({ is_active: true });
      setCategories(data);
    } catch (err) {
      console.error("Erreur lors du chargement des catégories:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createProduct(formData);
      router.push(`/apps/${slug}/inventory/products`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du produit");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProductCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateSKU = () => {
    const categoryName = categories.find(c => c.id === formData.category)?.name;
    const sku = generateSKU(formData.name, categoryName);
    if (sku) {
      handleChange('sku', sku);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/apps/${slug}/inventory/products`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouveau produit</h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez un nouveau produit à votre catalogue
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
            <h2 className="text-lg font-semibold mb-4">Informations de base</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom du produit <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  placeholder="Ex: Ordinateur portable HP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    required
                    placeholder="Ex: HP-LAP-001"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateSKU}
                    disabled={!formData.name}
                    title="Générer automatiquement le SKU"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Généré automatiquement à partir du nom et de la catégorie
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <select
                  id="category"
                  value={formData.category || ""}
                  onChange={(e) => handleChange("category", e.target.value || null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Aucune catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Code-barres</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleChange("barcode", e.target.value)}
                  placeholder="Ex: 1234567890123"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Description détaillée du produit..."
                />
              </div>
            </div>
          </div>

          {/* Prix */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Prix</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">
                  Prix d'achat (GNF) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="purchase_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => handleChange("purchase_price", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">
                  Prix de vente (GNF) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => handleChange("selling_price", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
            {formData.selling_price > 0 && formData.purchase_price > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Marge: {((formData.selling_price - formData.purchase_price) / formData.purchase_price * 100).toFixed(2)}%
              </p>
            )}
          </div>

          {/* Stock */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Gestion du stock</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="unit">Unité</Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="unit">Unité</option>
                  <option value="kg">Kilogramme</option>
                  <option value="g">Gramme</option>
                  <option value="l">Litre</option>
                  <option value="ml">Millilitre</option>
                  <option value="m">Mètre</option>
                  <option value="m2">Mètre carré</option>
                  <option value="m3">Mètre cube</option>
                  <option value="box">Boîte</option>
                  <option value="pack">Pack</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Seuil d'alerte stock</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_stock_level}
                  onChange={(e) => handleChange("min_stock_level", parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ Une alerte sera générée quand le stock descend en dessous de cette quantité
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_stock_level">Stock maximum</Label>
                <Input
                  id="max_stock_level"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.max_stock_level}
                  onChange={(e) => handleChange("max_stock_level", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Produit actif
            </Label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Création..." : "Créer le produit"}
            </Button>
            <Link href={`/apps/${slug}/inventory/products`}>
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
