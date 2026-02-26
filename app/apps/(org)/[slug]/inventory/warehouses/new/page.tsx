"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Alert } from "@/components/ui";
import { createWarehouse } from "@/lib/services/inventory";
import type { WarehouseCreate } from "@/lib/types/inventory";
import { AlertTriangle, Warehouse, MapPin, Building, User, Mail, Phone } from "lucide-react";
import { useEntityForm } from "@/lib/hooks";
import { FormHeader, FormActions, FormSection, FormField, FormCheckbox } from "@/components/common";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";

// Fonction utilitaire pour générer un code à partir du nom et de la date
function generateWarehouseCode(name: string, city: string) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const cleanedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");

  const code =
    "WH-" +
    (city ? city.toUpperCase().slice(0, 3) : "XXX") +
    "-" +
    dateStr +
    "-" +
    (cleanedName.length >= 3 ? cleanedName.toUpperCase().slice(0, 3) : "NEW");

  return code;
}

export default function NewWarehousePage() {
  const params = useParams();
  const slug = params.slug as string;

  const form = useEntityForm<WarehouseCreate>({
    initialData: {
      name: "",
      code: "",
      address: "",
      city: "",
      country: "Guinée",
      manager_name: "",
      phone: "",
      email: "",
      is_active: true,
    },
    onSubmit: createWarehouse,
    redirectUrl: `/apps/${slug}/inventory/warehouses`,
    validate: (data) => {
      if (!data.name.trim()) return "Le nom de l'entrepôt est requis";
      if (!data.code.trim()) return "Le code de l'entrepôt est requis";
      return null;
    },
  });

  // Auto-génération du code quand le nom ou la ville change
  useEffect(() => {
    if (form.formData.name || form.formData.city) {
      // Ne regénère que si le code est vide ou commence par "WH-" (auto-généré)
      if (!form.formData.code || form.formData.code.startsWith("WH-")) {
        const autoCode = generateWarehouseCode(form.formData.name, form.formData.city || form.formData.country || "");
        form.setField('code', autoCode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.formData.name, form.formData.city]);

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_WAREHOUSES} showMessage>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <FormHeader
          title="Nouvel entrepôt"
          subtitle="Ajoutez un nouveau lieu de stockage"
          backUrl={`/apps/${slug}/inventory/warehouses`}
        />

        {form.error && (
          <Alert variant="error">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <h3 className="font-semibold">Erreur</h3>
              <p className="text-sm">{form.error}</p>
            </div>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <FormSection title="Informations de base" icon={Warehouse}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Nom de l'entrepôt"
                name="name"
                value={form.formData.name}
                onChange={form.handleChange}
                placeholder="Ex: Entrepôt principal Conakry"
                required
              />

              <FormField
                label="Code"
                name="code"
                value={form.formData.code}
                onChange={form.handleChange}
                placeholder="Généré automatiquement, mais modifiable"
                required
                help="Ce code est généré automatiquement à partir du nom, de la ville et de la date. Vous pouvez le modifier si besoin."
              />
            </div>
          </FormSection>

          {/* Localisation */}
          <FormSection title="Localisation" icon={MapPin}>
            <FormField
              label="Adresse"
              name="address"
              value={form.formData.address}
              onChange={form.handleChange}
              placeholder="Adresse complète..."
              multiline
              rows={2}
            />

            <div className="grid gap-4 md:grid-cols-2">
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

          {/* Responsable */}
          <FormSection title="Responsable" icon={User}>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                label="Nom du responsable"
                name="manager_name"
                value={form.formData.manager_name}
                onChange={form.handleChange}
                placeholder="Ex: Jean Dupont"
                icon={User}
              />

              <FormField
                label="Téléphone"
                name="phone"
                type="tel"
                value={form.formData.phone}
                onChange={form.handleChange}
                placeholder="Ex: +224 xxx xx xx xx"
                icon={Phone}
              />

              <FormField
                label="Email"
                name="email"
                type="email"
                value={form.formData.email}
                onChange={form.handleChange}
                placeholder="Ex: responsable@example.com"
                icon={Mail}
              />
            </div>

            <FormCheckbox
              label="Entrepôt actif"
              name="is_active"
              checked={form.formData.is_active}
              onChange={form.handleCheckboxChange}
            />
          </FormSection>

          <FormActions
            cancelUrl={`/apps/${slug}/inventory/warehouses`}
            submitLabel="Créer l'entrepôt"
            loading={form.loading}
          />
        </form>
      </div>
    </Can>
  );
}
