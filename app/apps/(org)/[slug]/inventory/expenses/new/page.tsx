"use client";

import { Can } from "@/components/apps/common";
import { FormActions, FormField, FormHeader, FormSection, FormSelect } from "@/components/common";
import { Alert } from "@/components/ui";
import { QuickSelect } from "@/components/ui/quick-select";
import { formatCurrency } from "@/lib";
import { useEntityForm } from "@/lib/hooks";
import { createExpense, createExpenseCategory, getExpenseCategories } from "@/lib/services/inventory";
import type { ExpenseCategory, ExpenseCreate } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  Receipt,
  Tag,
  User,
  Wallet,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const PAYMENT_METHODS = [
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte" },
  { value: "bank_transfer", label: "Virement" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "check", label: "Chèque" },
];

export default function NewExpensePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const form = useEntityForm<ExpenseCreate>({
    initialData: {
      description: "",
      amount: 0,
      category_id: "",
      expense_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      beneficiary: "",
      reference: "",
      notes: "",
    },
    onSubmit: async (data) => {
      // Convertir category_id vide en null pour le backend
      const dataToSend = {
        ...data,
        category_id: data.category_id || null,
      };
      return createExpense(dataToSend);
    },
    redirectUrl: `/apps/${slug}/inventory/expenses`,
    validate: (data) => {
      if (!data.description.trim()) return "La description est requise";
      if (data.amount <= 0) return "Le montant doit être supérieur à 0";
      return null;
    },
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getExpenseCategories({ is_active: true });
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.CREATE_EXPENSES} showMessage>
      <div className="p-6 max-w-3xl mx-auto">
      <FormHeader
        title="Nouvelle dépense"
        subtitle="Enregistrez une nouvelle dépense"
        backUrl={`/apps/${slug}/inventory/expenses`}
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
        {/* Informations principales */}
        <FormSection title="Informations" icon={Receipt}>
          <FormField
            label="Description"
            name="description"
            value={form.formData.description}
            onChange={form.handleChange}
            placeholder="Description de la dépense"
            required
            className="md:col-span-2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormField
                label="Montant"
                name="amount"
                type="number"
                value={form.formData.amount}
                onChange={form.handleChange}
                placeholder="0"
                min={0}
                step={1000}
                required
                icon={DollarSign}
              />
              <p className="text-sm font-medium text-red-600">
                {formatCurrency(form.formData.amount)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <QuickSelect
                label="Catégorie"
                items={categories.map(c => ({ id: c.id, name: c.name }))}
                selectedId={form.formData.category_id || ""}
                onSelect={(id) => form.setField('category_id', id)}
                onCreate={async (name) => {
                  const newCat = await createExpenseCategory({ name, is_active: true });
                  setCategories(prev => [...prev, newCat]);
                  return { id: newCat.id, name: newCat.name };
                }}
                placeholder="Rechercher une catégorie..."
                icon={Tag}
                accentColor="orange"
                createLabel="Nouvelle catégorie"
              />
            </div>
          </div>
        </FormSection>

        {/* Date et paiement */}
        <FormSection title="Date et paiement" icon={Calendar}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Date de la dépense"
              name="expense_date"
              type="date"
              value={form.formData.expense_date}
              onChange={form.handleChange}
              required
            />

            <FormSelect
              label="Méthode de paiement"
              name="payment_method"
              value={form.formData.payment_method}
              onChange={form.handleChange}
              options={PAYMENT_METHODS}
            />
          </div>
        </FormSection>

        {/* Bénéficiaire et référence */}
        <FormSection title="Informations complémentaires" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Bénéficiaire"
              name="beneficiary"
              value={form.formData.beneficiary}
              onChange={form.handleChange}
              placeholder="Nom du bénéficiaire ou fournisseur"
              icon={User}
            />

            <FormField
              label="Référence"
              name="reference"
              value={form.formData.reference}
              onChange={form.handleChange}
              placeholder="N° de facture, reçu..."
              icon={Receipt}
            />
          </div>
        </FormSection>

        {/* Notes */}
        <FormSection title="Notes" icon={FileText}>
          <FormField
            label="Notes"
            name="notes"
            value={form.formData.notes}
            onChange={form.handleChange}
            placeholder="Informations complémentaires..."
            multiline
            rows={4}
          />
        </FormSection>

        {/* Résumé */}
        <div className="p-6 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <span className="font-semibold">Montant de la dépense</span>
            </div>
            <span className="text-2xl font-bold text-red-600">
              {formatCurrency(form.formData.amount)}
            </span>
          </div>
        </div>

        <FormActions
          cancelUrl={`/apps/${slug}/inventory/expenses`}
          submitLabel="Enregistrer"
          loading={form.loading}
        />
      </form>
    </div>
    </Can>
  );
}
