"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Card, Badge } from "@/components/ui";
import { getExpense, deleteExpense } from "@/lib/services/inventory";
import type { Expense } from "@/lib/types/inventory";
import {
  ArrowLeft,
  AlertTriangle,
  Edit,
  Trash2,
  Calendar,
  Wallet,
  User,
  FileText,
  Receipt,
  CreditCard,
  Tag,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadExpense();
  }, [id]);

  const loadExpense = async () => {
    try {
      setLoading(true);
      const data = await getExpense(id);
      setExpense(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteExpense(id);
      router.push(`/apps/${slug}/inventory/expenses`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: "Espèces",
      card: "Carte",
      bank_transfer: "Virement",
      mobile_money: "Mobile Money",
      check: "Chèque",
    };
    return methods[method] || method;
  };

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

  if (!expense) {
    return (
      <div className="p-6">
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <span>Dépense non trouvée</span>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p className="text-muted-foreground mb-6">
              Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/apps/${slug}/inventory/expenses`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {expense.description}
            </h1>
            {expense.expense_number && (
              <code className="text-sm text-muted-foreground">{expense.expense_number}</code>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/inventory/expenses/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {/* Montant principal */}
      <Card className="p-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <Wallet className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant de la dépense</p>
              <p className="text-3xl font-bold text-red-600">-{formatCurrency(expense.amount)}</p>
            </div>
          </div>
          <Badge variant="default" className="text-lg">
            {getPaymentMethodLabel(expense.payment_method)}
          </Badge>
        </div>
      </Card>

      {/* Détails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Date</span>
          </div>
          <p className="text-lg">{new Date(expense.expense_date).toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          })}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Catégorie</span>
          </div>
          <Badge variant="info" className="text-base">
            {expense.category_name || "Sans catégorie"}
          </Badge>
        </Card>

        {expense.beneficiary && (
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Bénéficiaire</span>
            </div>
            <p className="text-lg">{expense.beneficiary}</p>
          </Card>
        )}

        {expense.reference && (
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Référence</span>
            </div>
            <code className="text-lg">{expense.reference}</code>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Mode de paiement</span>
          </div>
          <p className="text-lg">{getPaymentMethodLabel(expense.payment_method)}</p>
        </Card>
      </div>

      {/* Notes */}
      {expense.notes && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Notes</span>
          </div>
          <p className="text-muted-foreground whitespace-pre-wrap">{expense.notes}</p>
        </Card>
      )}

      {/* Métadonnées */}
      <div className="text-sm text-muted-foreground text-center space-y-1">
        <p>Créé le {new Date(expense.created_at).toLocaleString("fr-FR")}</p>
        {expense.updated_at !== expense.created_at && (
          <p>Modifié le {new Date(expense.updated_at).toLocaleString("fr-FR")}</p>
        )}
      </div>
    </div>
  );
}
