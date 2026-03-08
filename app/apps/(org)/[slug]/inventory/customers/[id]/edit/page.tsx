"use client";

import { Can } from "@/components/apps/common";
import { FormActions, FormCheckbox, FormField, FormHeader, FormSection } from "@/components/common";
import { Alert } from "@/components/ui";
import { useEntityForm } from "@/lib/hooks";
import { getCustomer, updateCustomer } from "@/lib/services/inventory";
import type { Customer } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { generateCodeFromName } from "@/lib/utils/code-generator";
import {
  AlertTriangle,
  Building,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  User
} from "lucide-react";
import { useParams } from "next/navigation";

export default function EditCustomerPage() {
  const params = useParams();
  const slug = params.slug as string;
  const customerId = params.id as string;

  const form = useEntityForm<Customer>({
    // form will fetch entity, so initialData is just type-safe placeholder
    initialData: {
      id: customerId,
      organization: "", // Sera rempli par fetchData
      name: "",
      code: "",
      email: "",
      phone: "",
      secondary_phone: "",
      address: "",
      city: "",
      country: "Guinée",
      credit_limit: 0,
      notes: "",
      tax_id: "",
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    fetchData: () => getCustomer(customerId),
    onSubmit: async (data) => {
      // Envoyer tous les champs nécessaires incluant organization
      const updateData = {
        organization: data.organization,
        name: data.name,
        code: data.code,
        email: data.email,
        phone: data.phone,
        secondary_phone: data.secondary_phone,
        address: data.address,
        city: data.city,
        country: data.country,
        tax_id: data.tax_id,
        credit_limit: data.credit_limit,
        notes: data.notes,
        is_active: data.is_active,
      };
      return updateCustomer(customerId, updateData);
    },
    redirectUrl: `/apps/${slug}/inventory/customers/${customerId}`,
    validate: (data) => {
      if (!data.name.trim()) {
        return "Le nom du client est requis";
      }
      return null;
    },
    generateCode: (data) => {
      const code = data.code?.trim();
      if (!code) {
        return `CLT-${generateCodeFromName(data.name, 3)}`;
      }
      return undefined;
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

  return (
  <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_CUSTOMERS} showMessage>
        <div className="p-6 max-w-4xl mx-auto">
      <FormHeader
        title="Modification client"
        subtitle="Modifiez les informations du client sélectionné"
        backUrl={`/apps/${slug}/inventory/customers`}
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
        <FormSection title="Informations générales" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nom du client"
              name="name"
              value={form.formData.name}
              onChange={form.handleChange}
              placeholder="Nom complet ou raison sociale"
              required
            />

            <FormField
              label="Code client"
              name="code"
              value={form.formData.code}
              onChange={form.handleChange}
              placeholder="CLT-001 (optionnel, auto-généré si vide)"
            />

            <FormField
              label="Numéro fiscal (NIF)"
              name="tax_id"
              value={form.formData.tax_id}
              onChange={form.handleChange}
              placeholder="Numéro d'identification fiscale"
            />

            <div className="flex items-center pt-6">
              <FormCheckbox
                label="Client actif"
                name="is_active"
                checked={form.formData.is_active ? form.formData.is_active : false}
                onChange={form.handleCheckboxChange}
              />
            </div>
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
              label="Téléphone principal"
              name="phone"
              type="tel"
              value={form.formData.phone}
              onChange={form.handleChange}
              placeholder="+224 XXX XXX XXX"
              icon={Phone}
            />

            <FormField
              label="Téléphone secondaire"
              name="secondary_phone"
              type="tel"
              value={form.formData.secondary_phone}
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
            placeholder="Rue, quartier, commune..."
            className="md:col-span-2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Ville"
              name="city"
              value={form.formData.city}
              onChange={form.handleChange}
              placeholder="Conakry"
              icon={Building}
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

        {/* Finances */}
        <FormSection title="Crédit" icon={CreditCard}>
          <FormField
            label="Limite de crédit"
            name="credit_limit"
            type="number"
            value={form.formData.credit_limit}
            onChange={form.handleChange}
            placeholder="0"
            min={0}
            step={1000}
            help="Montant maximum de crédit autorisé pour ce client. Laisser vide si pas de limite"
          />
        </FormSection>

        {/* Notes */}
        <FormSection title="Notes" icon={FileText}>
          <FormField
            label="Notes internes"
            name="notes"
            value={form.formData.notes}
            onChange={form.handleChange}
            placeholder="Informations complémentaires sur ce client..."
            multiline
            rows={4}
          />
        </FormSection>

        <FormActions
          cancelUrl={`/apps/${slug}/inventory/customers`}
          submitLabel="Mettre à jour"
          loading={form.loading}
        />
      </form>
    </div>
  </Can>
  );
}
