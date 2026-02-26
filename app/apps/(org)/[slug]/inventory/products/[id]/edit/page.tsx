"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Alert } from "@/components/ui";
import { getProduct, updateProduct, getCategories } from "@/lib/services/inventory";
import type { ProductUpdate, Category } from "@/lib/types/inventory";
import { ProductUnit } from "@/lib/types/inventory";
import { AlertTriangle, Package, DollarSign, BarChart3, Tag } from "lucide-react";
import { useEntityForm } from "@/lib/hooks";
import { FormHeader, FormActions, FormSection, FormField, FormCheckbox, FormSelect } from "@/components/common";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";

export default function EditProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const productId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);

  const form = useEntityForm<ProductUpdate>({
    initialData: {
      name: "",
      sku: "",
      description: "",
      category: undefined,
      purchase_price: 0,
      selling_price: 0,
      unit: ProductUnit.UNIT,
      min_stock_level: 0,
      max_stock_level: 0,
      reorder_point: 0,
      barcode: "",
      is_active: true,
    },
    fetchData: async () => {
      const [productData, categoriesData] = await Promise.all([
        getProduct(productId),
        getCategories({ is_active: true }),
      ]);
      setCategories(categoriesData);
      return productData;
    },
    onSubmit: (data) => updateProduct(productId, data),
    redirectUrl: `/apps/${slug}/inventory/products/${productId}`,
    validate: (data) => {
      if (!data.name.trim()) return "Le nom du produit est requis";
      if (!data.sku.trim()) return "Le SKU est requis";
      return null;
    },
  });

  if (form.loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded bg-neutral-100 dark:bg-neutral-900 w-2/5 mb-2" />
          <div className="h-10 rounded bg-neutral-100 dark:bg-neutral-900 mb-2" />
          <div className="h-96 bg-neutral-100 dark:bg-neutral-900 rounded-xl mt-6" />
        </div>
      </div>
    );
  }

  const unitOptions = [
    { value: "unit", label: "Unité" },
    { value: "kg", label: "Kilogramme" },
    { value: "g", label: "Gramme" },
    { value: "l", label: "Litre" },
    { value: "ml", label: "Millilitre" },
    { value: "m", label: "Mètre" },
    { value: "cm", label: "Centimètre" },
    { value: "box", label: "Boîte" },
    { value: "pack", label: "Pack" },
  ];

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_PRODUCTS} showMessage>
      <div className="p-6 max-w-4xl mx-auto">
        <FormHeader
          title="Modifier le produit"
          subtitle="Mettez à jour les informations du produit"
          backUrl={`/apps/${slug}/inventory/products/${productId}`}
        />

        {form.error && (
          <Alert variant="error" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <h3 className="font-semibold">Erreur</h3>
              <p className="text-sm">{form.error}</p>
            </div>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <FormSection title="Informations générales" icon={Package}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Nom du produit"
                name="name"
                value={form.formData.name}
                onChange={form.handleChange}
                placeholder="Ex: Ordinateur portable"
                required
              />

              <FormField
                label="SKU"
                name="sku"
                value={form.formData.sku}
                onChange={form.handleChange}
                placeholder="Ex: LAPTOP-001"
                required
              />

              <div className="md:col-span-2">
                <FormField
                  label="Description"
                  name="description"
                  value={form.formData.description}
                  onChange={form.handleChange}
                  placeholder="Description du produit..."
                  multiline
                  rows={3}
                />
              </div>

              <FormSelect
                label="Catégorie"
                name="category"
                value={form.formData.category || ""}
                onChange={form.handleChange}
                options={[
                  { value: "", label: "Aucune catégorie" },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                ]}
                icon={Tag}
              />

              <FormField
                label="Code-barres"
                name="barcode"
                value={form.formData.barcode}
                onChange={form.handleChange}
                placeholder="Ex: 1234567890123"
              />
            </div>
          </FormSection>

          {/* Prix et unité */}
          <FormSection title="Prix et unité" icon={DollarSign}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Prix d'achat"
                name="purchase_price"
                type="number"
                value={form.formData.purchase_price}
                onChange={form.handleChange}
                min={0}
                step={0.01}
                required
              />

              <FormField
                label="Prix de vente"
                name="selling_price"
                type="number"
                value={form.formData.selling_price}
                onChange={form.handleChange}
                min={0}
                step={0.01}
                required
              />

              <FormSelect
                label="Unité"
                name="unit"
                value={form.formData.unit}
                onChange={form.handleChange}
                options={unitOptions}
              />
            </div>
          </FormSection>

          {/* Gestion du stock */}
          <FormSection title="Gestion du stock" icon={BarChart3}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Seuil d'alerte stock"
                name="min_stock_level"
                type="number"
                value={form.formData.min_stock_level}
                onChange={form.handleChange}
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
                min={0}
                step={0.01}
              />

              <FormField
                label="Point de réapprovisionnement"
                name="reorder_point"
                type="number"
                value={form.formData.reorder_point}
                onChange={form.handleChange}
                min={0}
                step={0.01}
              />
            </div>
          </FormSection>

          {/* Statut */}
          <FormSection title="Statut" icon={Package}>
            <FormCheckbox
              label="Produit actif"
              name="is_active"
              checked={form.formData.is_active}
              onChange={form.handleCheckboxChange}
            />
          </FormSection>

          <FormActions
            cancelUrl={`/apps/${slug}/inventory/products/${productId}`}
            submitLabel="Enregistrer les modifications"
            loading={form.loading}
          />
        </form>
      </div>
    </Can>
  );
}
