"use client";

import { FormActions, FormField, FormHeader, FormSection, FormSelect } from "@/components/common";
import { Alert, Label } from "@/components/ui";
import { QuickSelect } from "@/components/ui/quick-select";
import { formatCurrency } from "@/lib";
import { useEntityForm } from "@/lib/hooks";
import { createExpenseCategory, getExpense, getExpenseCategories, updateExpense } from "@/lib/services/inventory";
import type { ExpenseCategory, ExpenseUpdate } from "@/lib/types/inventory";
import {
  AlertTriangle,
  Calendar,
  FileText,
  Receipt,
  Tag,
  User,
  Wallet,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function EditExpensePage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const form = useEntityForm<ExpenseUpdate>({
    initialData: {
      description: "",
      amount: 0,
      category_id: "",
      expense_date: "",
      payment_method: "cash",
      beneficiary: "",
      reference: "",
      notes: "",
    },
    fetchData: async () => {
      const [expense, categoriesData] = await Promise.all([
        getExpense(id),
        getExpenseCategories({ is_active: true }),
      ]);
      setCategories(categoriesData);

      return {
        description: expense.description || "",
        amount: expense.amount || 0,
        category_id: expense.category || "",
        expense_date: expense.expense_date?.split("T")[0] || "",
        payment_method: expense.payment_method || "cash",
        beneficiary: expense.beneficiary || "",
        reference: expense.reference || "",
        notes: expense.notes || "",
      };
    },
    onSubmit: (data) => {
      // Convertir category_id vide en null pour le backend
      const dataToSend = {
        ...data,
        category_id: data.category_id || null,
      };
      return updateExpense(id, dataToSend);
    },
    redirectUrl: `/apps/${slug}/inventory/expenses/${id}`,
    validate: (data) => {
      if (!data.description?.trim()) return "La description est requise";
      if ((data.amount || 0) <= 0) return "Le montant doit être supérieur à 0";
      return null;
    },
  });

  if (form.loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 rounded bg-neutral-100 dark:bg-neutral-900 w-2/5 mb-2" />
          <div className="h-10 rounded bg-neutral-100 dark:bg-neutral-900 mb-2" />
          <div className="h-96 bg-neutral-100 dark:bg-neutral-900 rounded-xl mt-6" />
        </div>
      </div>
    );
  }

  const paymentMethodOptions = [
    { value: "cash", label: "Espèces" },
    { value: "card", label: "Carte" },
    { value: "bank_transfer", label: "Virement" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "check", label: "Chèque" },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <FormHeader
        title="Modifier la dépense"
        subtitle="Mettez à jour les informations"
        backUrl={`/apps/${slug}/inventory/expenses/${id}`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Description"
                name="description"
                value={form.formData.description}
                onChange={form.handleChange}
                placeholder="Description de la dépense"
                required
              />
            </div>

            <FormField
              label="Montant"
              name="amount"
              type="number"
              value={form.formData.amount}
              onChange={form.handleChange}
              min={0}
              step={1000}
              placeholder="0"
              required
            />

            <div className="space-y-2">
              <Label>Catégorie</Label>
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
              label="Date"
              type="date"
              name="expense_date"
              value={form.formData.expense_date}
              onChange={form.handleChange}
              required
            />

            <FormSelect
              label="Mode de paiement"
              name="payment_method"
              value={form.formData.payment_method}
              onChange={form.handleChange}
              options={paymentMethodOptions}
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
              placeholder="Nom du bénéficiaire"
            />

            <FormField
              label="Référence"
              name="reference"
              value={form.formData.reference}
              onChange={form.handleChange}
              placeholder="N° facture, reçu..."
            />
          </div>
        </FormSection>

        {/* Notes */}
        <FormSection title="Notes" icon={FileText}>
          <FormField
            label="Notes supplémentaires"
            name="notes"
            value={form.formData.notes}
            onChange={form.handleChange}
            placeholder="Notes supplémentaires..."
            multiline
            rows={3}
          />
        </FormSection>

        {/* Résumé */}
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <span className="font-semibold">Montant</span>
            </div>
            <span className="text-2xl font-bold text-red-600">
              -{formatCurrency(form.formData.amount || 0)}
            </span>
          </div>
        </div>

        <FormActions
          cancelUrl={`/apps/${slug}/inventory/expenses/${id}`}
          submitLabel="Enregistrer"
          loading={form.loading}
        />
      </form>
    </div>
  );
}
