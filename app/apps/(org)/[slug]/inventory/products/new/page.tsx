"use client";

import { Can } from "@/components/apps/common";
import { FormActions, FormCheckbox, FormField, FormHeader, FormSection, FormSelect } from "@/components/common";
import { Alert, Button } from "@/components/ui";
import { formatCurrency } from "@/lib";
import { useEntityForm } from "@/lib/hooks";
import { createProduct, getCategories } from "@/lib/services/inventory";
import type { Category, ProductCreate, ProductUnit } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { generateSKU } from "@/lib/utils/code-generator";
import { Barcode, DollarSign, Package, Repeat, Warehouse } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const UNIT_OPTIONS = [
  { value: "unit", label: "Unité" },
  { value: "kg", label: "Kilogramme" },
  { value: "g", label: "Gramme" },
  { value: "l", label: "Litre" },
  { value: "ml", label: "Millilitre" },
  { value: "m", label: "Mètre" },
  { value: "m2", label: "Mètre carré" },
  { value: "m3", label: "Mètre cube" },
  { value: "box", label: "Boîte" },
  { value: "pack", label: "Pack" },
];

export default function NewProductPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);

  const form = useEntityForm<ProductCreate>({
    initialData: {
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
    },
    onSubmit: createProduct,
    redirectUrl: `/apps/${slug}/inventory/products`,
    validate: (data) => {
      if (!data.name.trim()) return "Le nom du produit est requis";
      if (!data.sku.trim()) return "Le SKU est requis";
      if (data.purchase_price <= 0) return "Le prix d'achat doit être supérieur à 0";
      if (data.selling_price <= 0) return "Le prix de vente doit être supérieur à 0";
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
    } catch (err) {
      console.error("Erreur lors du chargement des catégories:", err);
    }
  };

  const handleGenerateSKU = () => {
    const categoryName = categories.find(c => c.id === form.formData.category)?.name;
    const sku = generateSKU(form.formData.name, categoryName);
    if (sku) {
      form.setField('sku', sku);
    }
  };

  // Calculer la marge
  const margin = form.formData.selling_price > 0 && form.formData.purchase_price > 0
    ? ((form.formData.selling_price - form.formData.purchase_price) / form.formData.purchase_price * 100).toFixed(2)
    : null;

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name
  }));

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_PRODUCTS} showMessage>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <FormHeader
          title="Nouveau produit"
          subtitle="Ajoutez un nouveau produit à votre catalogue"
          backUrl={`/apps/${slug}/inventory/products`}
        />

        {form.error && (
          <Alert variant="error" title="Erreur">
            {form.error}
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <FormSection title="Informations de base" icon={Package}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Nom du produit"
                name="name"
                value={form.formData.name}
                onChange={form.handleChange}
                placeholder="Ex: Ordinateur portable HP"
                required
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSKU}
                    className="h-auto py-0 px-2 text-xs"
                    disabled={!form.formData.name.trim()}
                    title="Générer automatiquement le SKU"
                  >
                    <Repeat className="h-3 w-3 mr-1" />
                    Générer
                  </Button>
                </div>
                <FormField
                  label=""
                  name="sku"
                  value={form.formData.sku}
                  onChange={form.handleChange}
                  placeholder="Ex: HP-LAP-001"
                  required
                  help="Généré automatiquement à partir du nom et de la catégorie"
                />
              </div>

              <FormSelect
                label="Catégorie"
                name="category"
                value={form.formData.category}
                onChange={form.handleChange}
                options={categoryOptions}
                placeholder="Aucune catégorie"
              />

              <FormField
                label="Code-barres"
                name="barcode"
                value={form.formData.barcode}
                onChange={form.handleChange}
                placeholder="Ex: 1234567890123"
                icon={Barcode}
              />
            </div>

            <FormField
              label="Description"
              name="description"
              value={form.formData.description}
              onChange={form.handleChange}
              placeholder="Description détaillée du produit..."
              multiline
              rows={3}
              className="md:col-span-2"
            />
          </FormSection>

          {/* Prix */}
          <FormSection title="Prix" icon={DollarSign}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FormField
                  label="Prix d'achat"
                  name="purchase_price"
                  type="number"
                  value={form.formData.purchase_price}
                  onChange={form.handleChange}
                  placeholder="0"
                  min={0}
                  step={0.01}
                  required
                />
                <p className="text-sm font-medium">{formatCurrency(form.formData.purchase_price)}</p>
                <p className="text-xs text-muted-foreground">
                  💡 Vous pourrez modifier le prix lors de chaque transaction si besoin.
                </p>
              </div>

              <div className="space-y-2">
                <FormField
                  label="Prix de vente"
                  name="selling_price"
                  type="number"
                  value={form.formData.selling_price}
                  onChange={form.handleChange}
                  placeholder="0"
                  min={0}
                  step={0.01}
                  required
                />
                <p className="text-sm font-medium">{formatCurrency(form.formData.selling_price)}</p>
                <p className="text-xs text-muted-foreground">
                  💡 Vous pourrez modifier le prix de vente lors de chaque transaction si besoin.
                </p>
              </div>
            </div>

            {margin && (
              <p className="text-sm text-muted-foreground">
                Marge: <span className="font-semibold text-green-600">{margin}%</span>
              </p>
            )}
          </FormSection>

          {/* Stock */}
          <FormSection title="Gestion du stock" icon={Warehouse}>
            <div className="grid gap-4 md:grid-cols-3">
              <FormSelect
                label="Unité"
                name="unit"
                value={form.formData.unit}
                onChange={form.handleChange}
                options={UNIT_OPTIONS}
              />

              <FormField
                label="Seuil d'alerte stock"
                name="min_stock_level"
                type="number"
                value={form.formData.min_stock_level}
                onChange={form.handleChange}
                placeholder="0"
                min={0}
                step={0.01}
                help="⚠️ Une alerte sera générée quand le stock descend en dessous de cette quantité"
              />

              <FormField
                label="Stock maximum"
                name="max_stock_level"
                type="number"
                value={form.formData.max_stock_level}
                onChange={form.handleChange}
                placeholder="0"
                min={0}
                step={0.01}
              />
            </div>

            <FormCheckbox
              label="Produit actif"
              name="is_active"
              checked={form.formData.is_active}
              onChange={form.handleCheckboxChange}
            />
          </FormSection>

          <FormActions
            cancelUrl={`/apps/${slug}/inventory/products`}
            submitLabel="Créer le produit"
            loading={form.loading}
          />
        </form>
      </div>
    </Can>
  );
}
