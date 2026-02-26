"use client";

import { useParams } from "next/navigation";
import { Alert } from "@/components/ui";
import { getWarehouse, updateWarehouse } from "@/lib/services/inventory";
import type { WarehouseUpdate } from "@/lib/types/inventory";
import { AlertTriangle, Warehouse, MapPin, Building } from "lucide-react";
import { useEntityForm } from "@/lib/hooks";
import { FormHeader, FormActions, FormSection, FormField, FormCheckbox } from "@/components/common";
import { generateWarehouseCode } from "@/lib/utils/code-generator";

export default function EditWarehousePage() {
  const params = useParams();
  const slug = params.slug as string;
  const warehouseId = params.id as string;

  const form = useEntityForm<WarehouseUpdate>({
    initialData: {
      name: "",
      code: "",
      address: "",
      city: "",
      country: "",
      is_active: true,
    },
    fetchData: () => getWarehouse(warehouseId),
    onSubmit: (data) => updateWarehouse(warehouseId, data),
    redirectUrl: `/apps/${slug}/inventory/warehouses/${warehouseId}`,
    validate: (data) => {
      if (!data.name.trim()) return "Le nom de l'entrepôt est requis";
      if (!data.code.trim()) return "Le code est requis";
      return null;
    },
  });

  const handleGenerateCode = () => {
    const code = generateWarehouseCode(form.formData.name ?? "", form.formData.city);
    if (code) {
      form.setField('code', code);
    }
  };

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <FormHeader
        title="Modifier l'entrepôt"
        subtitle="Mettez à jour les informations de l'entrepôt"
        backUrl={`/apps/${slug}/inventory/warehouses/${warehouseId}`}
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
        <FormSection title="Informations générales" icon={Warehouse}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nom de l'entrepôt"
              name="name"
              value={form.formData.name}
              onChange={form.handleChange}
              placeholder="Ex: Entrepôt Central"
              required
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Code <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="text-xs text-primary hover:underline"
                  disabled={!form.formData.name}
                >
                  Générer
                </button>
              </div>
              <FormField
                label=""
                name="code"
                value={form.formData.code}
                onChange={form.handleChange}
                placeholder="Ex: WH-CNK-001"
                help="Généré à partir du nom et de la ville"
                required
              />
            </div>
          </div>
        </FormSection>

        {/* Adresse */}
        <FormSection title="Adresse" icon={MapPin}>
          <FormField
            label="Adresse complète"
            name="address"
            value={form.formData.address}
            onChange={form.handleChange}
            placeholder="Ex: 123 Avenue de la République"
            className="md:col-span-2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Ville"
              name="city"
              value={form.formData.city}
              onChange={form.handleChange}
              placeholder="Ex: Conakry"
              icon={Building}
            />

            <FormField
              label="Pays"
              name="country"
              value={form.formData.country}
              onChange={form.handleChange}
              placeholder="Ex: Guinée"
            />
          </div>
        </FormSection>

        {/* Statut */}
        <FormSection title="Statut" icon={Building}>
          <FormCheckbox
            label="Entrepôt actif"
            name="is_active"
            checked={form.formData.is_active}
            onChange={form.handleCheckboxChange}
          />
        </FormSection>

        <FormActions
          cancelUrl={`/apps/${slug}/inventory/warehouses/${warehouseId}`}
          submitLabel="Enregistrer les modifications"
          loading={form.loading}
        />
      </form>
    </div>
  );
}
