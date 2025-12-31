"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Input, Label } from "@/components/ui";
import { QuickSelect } from "@/components/ui/quick-select";
import { getExpense, updateExpense, getExpenseCategories, createExpenseCategory } from "@/lib/services/inventory";
import type { ExpenseUpdate, ExpenseCategory } from "@/lib/types/inventory";
import {
  ArrowLeft,
  AlertTriangle,
  Save,
  Receipt,
  Calendar,
  Wallet,
  User,
  FileText,
  Tag,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const [formData, setFormData] = useState<ExpenseUpdate>({
    description: "",
    amount: 0,
    category_id: "",
    expense_date: "",
    payment_method: "cash",
    beneficiary: "",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expense, categoriesData] = await Promise.all([
        getExpense(id),
        getExpenseCategories({ is_active: true }),
      ]);
      setFormData({
        description: expense.description || "",
        amount: expense.amount || 0,
        category_id: expense.category || "",
        expense_date: expense.expense_date?.split("T")[0] || "",
        payment_method: expense.payment_method || "cash",
        beneficiary: expense.beneficiary || "",
        reference: expense.reference || "",
        notes: expense.notes || "",
      });
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description?.trim()) {
      setError("La description est requise");
      return;
    }
    if ((formData.amount || 0) <= 0) {
      setError("Le montant doit être supérieur à 0");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Convertir category_id vide en null pour le backend
      const dataToSend = {
        ...formData,
        category_id: formData.category_id || null,
      };
      
      await updateExpense(id, dataToSend);
      router.push(`/apps/${slug}/inventory/expenses/${id}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/apps/${slug}/inventory/expenses/${id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Modifier la dépense</h1>
          <p className="text-muted-foreground">Mettez à jour les informations</p>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations principales */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Informations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description de la dépense"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (GNF) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="1000"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <QuickSelect
                label="Catégorie"
                items={categories.map(c => ({ id: c.id, name: c.name }))}
                selectedId={formData.category_id || ""}
                onSelect={(id) => setFormData(prev => ({ ...prev, category_id: id }))}
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
        </Card>

        {/* Date et paiement */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date et paiement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_date">Date *</Label>
              <Input
                id="expense_date"
                name="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Mode de paiement</Label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="cash">Espèces</option>
                <option value="card">Carte</option>
                <option value="bank_transfer">Virement</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="check">Chèque</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Bénéficiaire et référence */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations complémentaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiary">Bénéficiaire</Label>
              <Input
                id="beneficiary"
                name="beneficiary"
                value={formData.beneficiary}
                onChange={handleChange}
                placeholder="Nom du bénéficiaire"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="N° facture, reçu..."
              />
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </h2>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes supplémentaires..."
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </Card>

        {/* Résumé */}
        <Card className="p-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <span className="font-semibold">Montant</span>
            </div>
            <span className="text-2xl font-bold text-red-600">
              -{formatCurrency(formData.amount || 0)}
            </span>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/apps/${slug}/inventory/expenses/${id}`}>Annuler</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
