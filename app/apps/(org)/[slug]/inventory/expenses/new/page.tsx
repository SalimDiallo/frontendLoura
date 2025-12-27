"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Input, Label } from "@/components/ui";
import { QuickSelect } from "@/components/ui/quick-select";
import { createExpense, getExpenseCategories, createExpenseCategory } from "@/lib/services/inventory";
import type { ExpenseCreate, ExpenseCategory } from "@/lib/types/inventory";
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
} from "lucide-react";
import Link from "next/link";

export default function NewExpensePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const [formData, setFormData] = useState<ExpenseCreate>({
    description: "",
    amount: 0,
    category: "",
    expense_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    beneficiary: "",
    reference: "",
    notes: "",
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      setError("La description est requise");
      return;
    }

    if (formData.amount <= 0) {
      setError("Le montant doit être supérieur à 0");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createExpense(formData);
      router.push(`/apps/${slug}/inventory/expenses`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de la dépense");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/apps/${slug}/inventory/expenses`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle dépense</h1>
          <p className="text-muted-foreground">
            Enregistrez une nouvelle dépense
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
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
                  selectedId={formData.category || ""}
                  onSelect={(id) => setFormData(prev => ({ ...prev, category: id }))}
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
                <Label htmlFor="expense_date">Date de la dépense *</Label>
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
                <Label htmlFor="payment_method">Méthode de paiement</Label>
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
                  placeholder="Nom du bénéficiaire ou fournisseur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="N° de facture, reçu..."
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
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Informations complémentaires..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </Card>

          {/* Résumé */}
          <Card className="p-6 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span className="font-semibold">Montant de la dépense</span>
              </div>
              <span className="text-2xl font-bold text-red-600">
                -{formatCurrency(formData.amount)}
              </span>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/inventory/expenses`}>Annuler</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Enregistrement...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
