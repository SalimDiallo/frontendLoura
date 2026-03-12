"use client";

import { Can } from "@/components/apps/common";
import { FormActions, FormCheckbox, FormField, FormHeader, FormSection } from "@/components/common";
import { Alert } from "@/components/ui";
import { useEntityForm } from "@/lib/hooks";
import { getSupplier, updateSupplier } from "@/lib/services/inventory";
import type { SupplierUpdate } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { generateSupplierCode } from "@/lib/utils/code-generator";
import { AlertTriangle, Building, CreditCard, FileText, Mail, MapPin, Phone, Truck, User } from "lucide-react";
import { useParams } from "next/navigation";

export default function EditSupplierPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supplierId = params.id as string;

  const form = useEntityForm<SupplierUpdate>({
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
      website: "",
      tax_id: "",
      payment_terms: "",
      notes: "",
      is_active: true,
    },
    fetchData: () => getSupplier(supplierId),
    onSubmit: (data) => updateSupplier(supplierId, data),
    redirectUrl: `/apps/${slug}/inventory/suppliers/${supplierId}`,
    validate: (data) => {
      if (!data?.name?.trim()) return "Le nom du fournisseur est requis";
      if (!data?.code?.trim()) return "Le code fournisseur est requis";
      return null;
    },
  });

  const handleGenerateCode = () => {
    const code = generateSupplierCode(form.formData.name ?? "");
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
    <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_SUPPLIERS} showMessage>
      <div className="p-6 max-w-4xl mx-auto">
        <FormHeader
          title="Modifier le fournisseur"
          subtitle="Modifiez les informations du fournisseur"
          backUrl={`/apps/${slug}/inventory/suppliers`}
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
          {/* Informations de base */}
          <FormSection title="Informations de base" icon={Truck}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Nom du fournisseur"
                name="name"
                value={form.formData.name}
                onChange={form.handleChange}
                placeholder="Nom complet ou raison sociale"
                required
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Code fournisseur <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="text-xs text-primary hover:underline"
                    disabled={!form?.formData.name}
                  >
                    Générer
                  </button>
                </div>
                <FormField
                  label=""
                  name="code"
                  value={form.formData.code}
                  onChange={form.handleChange}
                  placeholder="SUP-001"
                  required
                />
              </div>

              <FormField
                label="Personne de contact"
                name="contact_person"
                value={form.formData.contact_person}
                onChange={form.handleChange}
                placeholder="Nom du contact principal"
                icon={User}
              />

              <FormField
                label="Numéro fiscal (NIF)"
                name="tax_id"
                value={form.formData.tax_id}
                onChange={form.handleChange}
                placeholder="Numéro d'identification fiscale"
              />
            </div>
          </FormSection>

          {/* Contact */}
          <FormSection title="Contact" icon={Mail}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email"
                name="email"
                type="email"
                value={form.formData.email}
                onChange={form.handleChange}
                placeholder="email@exemple.com"
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

              <FormField
                label="Site web"
                name="website"
                value={form.formData.website}
                onChange={form.handleChange}
                placeholder="https://exemple.com"
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
              placeholder="Rue, quartier, commune..."
              className="md:col-span-2"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="Code postal"
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

          {/* Conditions de paiement */}
          <FormSection title="Conditions commerciales" icon={CreditCard}>
            <FormField
              label="Conditions de paiement"
              name="payment_terms"
              value={form.formData.payment_terms}
              onChange={form.handleChange}
              placeholder="Ex: 30 jours net, 60 jours fin de mois..."
              help="Délais et conditions de paiement habituels avec ce fournisseur"
            />
          </FormSection>

          {/* Notes */}
          <FormSection title="Notes" icon={FileText}>
            <FormField
              label="Notes internes"
              name="notes"
              value={form.formData.notes}
              onChange={form.handleChange}
              placeholder="Informations complémentaires sur ce fournisseur..."
              multiline
              rows={4}
            />
          </FormSection>

          {/* Statut */}
          <FormSection title="Statut" icon={Building}>
            <FormCheckbox
              label="Fournisseur actif"
              name="is_active"
              checked={form.formData.is_active}
              onChange={form.handleCheckboxChange}
            />
          </FormSection>

          <FormActions
            cancelUrl={`/apps/${slug}/inventory/suppliers`}
            submitLabel="Mettre à jour"
            loading={form.loading}
          />
        </form>
      </div>
    </Can>
  );
}
