"use client";

import { useParams } from "next/navigation";
import { Alert, Button } from "@/components/ui";
import { createSupplier } from "@/lib/services/inventory";
import type { SupplierCreate } from "@/lib/types/inventory";
import { AlertTriangle, User, Mail, Phone, MapPin, Building, FileText, Repeat } from "lucide-react";
import { useEntityForm } from "@/lib/hooks";
import { FormHeader, FormActions, FormSection, FormField, FormCheckbox } from "@/components/common";
import { generateSupplierCode } from "@/lib/utils/code-generator";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";

export default function NewSupplierPage() {
  const params = useParams();
  const slug = params.slug as string;

  const form = useEntityForm<SupplierCreate>({
    initialData: {
      name: "",
      code: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postal_code: "",
      country: "",
      notes: "",
      is_active: true,
    },
    onSubmit: createSupplier,
    redirectUrl: `/apps/${slug}/inventory/suppliers`,
    validate: (data) => {
      if (!data.name.trim()) return "Le nom du fournisseur est requis";
      if (!data.code.trim()) return "Le code fournisseur est requis";
      return null;
    },
  });

  // Handler pour générer le code manuellement
  const handleGenerateCode = () => {
    if (form.formData.name.trim()) {
      const code = generateSupplierCode(form.formData.name);
      form.setField('code', code);
    }
  };

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_SUPPLIERS} showMessage>
      <div className="space-y-6 p-6 max-w-4xl">
        <FormHeader
          title="Nouveau fournisseur"
          subtitle="Ajoutez un nouveau fournisseur à votre inventaire"
          backUrl={`/apps/${slug}/inventory/suppliers`}
        />

        {form.error && (
          <Alert variant="error" title="Erreur">
            {form.error}
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <FormSection title="Informations générales" icon={User}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Nom du fournisseur"
                name="name"
                value={form.formData.name}
                onChange={form.handleChange}
                placeholder="Ex: Fournisseur ABC"
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
                  >
                    <Repeat className="h-3 w-3 mr-1" />
                    Générer automatiquement
                  </Button>
                </div>
                <FormField
                  label=""
                  name="code"
                  value={form.formData.code}
                  onChange={form.handleChange}
                  placeholder="Ex: SUPP-001"
                  required
                />
              </div>
            </div>
          </FormSection>

          {/* Informations de contact */}
          <FormSection title="Informations de contact" icon={Mail}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Personne de contact"
                name="contact_person"
                value={form.formData.contact_person}
                onChange={form.handleChange}
                placeholder="Nom du contact"
                icon={User}
              />

              <FormField
                label="Email"
                name="email"
                type="email"
                value={form.formData.email}
                onChange={form.handleChange}
                placeholder="contact@fournisseur.com"
                icon={Mail}
              />

              <FormField
                label="Téléphone"
                name="phone"
                type="tel"
                value={form.formData.phone}
                onChange={form.handleChange}
                placeholder="+224 XXX XXX XXX"
                icon={Phone}
              />
            </div>
          </FormSection>

          {/* Adresse */}
          <FormSection title="Adresse" icon={MapPin}>
            <FormField
              label="Adresse"
              name="address"
              value={form.formData.address}
              onChange={form.handleChange}
              placeholder="Rue, numéro, bâtiment..."
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                label="Ville"
                name="city"
                value={form.formData.city}
                onChange={form.handleChange}
                placeholder="Conakry"
                icon={Building}
              />

              <FormField
                label="Code postal"
                name="postal_code"
                value={form.formData.postal_code}
                onChange={form.handleChange}
                placeholder="00000"
              />

              <FormField
                label="Pays"
                name="country"
                value={form.formData.country}
                onChange={form.handleChange}
                placeholder="Guinée"
              />
            </div>
          </FormSection>

          {/* Informations complémentaires */}
          <FormSection title="Informations complémentaires" icon={FileText}>
            <FormField
              label="Notes"
              name="notes"
              value={form.formData.notes}
              onChange={form.handleChange}
              placeholder="Informations supplémentaires sur le fournisseur..."
              multiline
              rows={4}
            />

            <FormCheckbox
              label="Fournisseur actif"
              name="is_active"
              checked={form.formData.is_active}
              onChange={form.handleCheckboxChange}
            />
          </FormSection>

          <FormActions
            cancelUrl={`/apps/${slug}/inventory/suppliers`}
            submitLabel="Créer le fournisseur"
            loading={form.loading}
          />
        </form>
      </div>
    </Can>
  );
}
