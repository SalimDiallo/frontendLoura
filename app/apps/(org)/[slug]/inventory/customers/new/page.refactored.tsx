"use client";

/**
 * EXEMPLE DE PAGE REFACTORISÉE avec useEntityForm et composants réutilisables
 * Compare avec page.tsx pour voir la réduction de code
 */

import { useParams } from "next/navigation";
import { Alert } from "@/components/ui";
import { createCustomer } from "@/lib/services/inventory";
import type { CustomerCreate } from "@/lib/types/inventory";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { useEntityForm } from "@/lib/hooks";
import { FormHeader, FormActions, FormSection, FormField } from "@/components/common";
import { generateCodeFromName } from "@/lib/utils/code-generator";

export default function NewCustomerPageRefactored() {
  const params = useParams();
  const slug = params.slug as string;

  // ✨ Tout le boilerplate de gestion de formulaire est dans le hook
  const form = useEntityForm<CustomerCreate>({
    initialData: {
      name: "",
      code: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "Guinée",
      credit_limit: 0,
      notes: "",
      tax_id: "",
      is_active: true,
    },
    onSubmit: createCustomer,
    redirectUrl: `/apps/${slug}/inventory/customers`,
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
      return undefined; // Garder le code existant
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header standardisé */}
      <FormHeader
        title="Nouveau Client"
        subtitle="Ajouter un nouveau client à votre inventaire"
        backUrl={`/apps/${slug}/inventory/customers`}
      />

      {/* Affichage des erreurs */}
      {form.error && (
        <Alert variant="error" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          {form.error}
        </Alert>
      )}

      {/* Formulaire */}
      <form onSubmit={form.handleSubmit} className="space-y-6">
        {/* Section Informations générales */}
        <FormSection title="Informations générales" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nom du client"
              name="name"
              value={form.formData.name}
              onChange={form.handleChange}
              placeholder="Nom complet du client"
              required
              icon={User}
            />

            <FormField
              label="Code client"
              name="code"
              value={form.formData.code}
              onChange={form.handleChange}
              placeholder="Généré automatiquement"
              help="Laissez vide pour générer automatiquement"
              icon={Building}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Email"
              name="email"
              type="email"
              value={form.formData.email}
              onChange={form.handleChange}
              placeholder="email@example.com"
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

          <FormField
            label="Identifiant fiscal"
            name="tax_id"
            value={form.formData.tax_id}
            onChange={form.handleChange}
            placeholder="Numéro fiscal (optionnel)"
            icon={CreditCard}
          />
        </FormSection>

        {/* Section Adresse */}
        <FormSection title="Adresse" icon={MapPin}>
          <FormField
            label="Adresse"
            name="address"
            value={form.formData.address}
            onChange={form.handleChange}
            placeholder="Adresse complète"
            multiline
            rows={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Ville"
              name="city"
              value={form.formData.city}
              onChange={form.handleChange}
              placeholder="Ville"
              icon={Building}
            />

            <FormField
              label="Pays"
              name="country"
              value={form.formData.country}
              onChange={form.handleChange}
              placeholder="Pays"
              icon={MapPin}
            />
          </div>
        </FormSection>

        {/* Section Finances */}
        <FormSection title="Informations financières" icon={CreditCard}>
          <FormField
            label="Limite de crédit"
            name="credit_limit"
            type="number"
            value={form.formData.credit_limit}
            onChange={form.handleChange}
            placeholder="0"
            min={0}
            step={0.01}
            help="Montant maximum de crédit autorisé (GNF)"
          />

          <FormField
            label="Notes"
            name="notes"
            value={form.formData.notes}
            onChange={form.handleChange}
            placeholder="Notes additionnelles..."
            multiline
            rows={3}
          />
        </FormSection>

        {/* Actions */}
        <FormActions
          cancelUrl={`/apps/${slug}/inventory/customers`}
          loading={form.loading}
        />
      </form>
    </div>
  );
}
