"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card, Input } from "@/components/ui";
import { getCreditSale, addCreditPayment } from "@/lib/services/inventory";
import type { CreditSale } from "@/lib/types/inventory";
import {
  ArrowLeft,
  AlertTriangle,
  CreditCard,
  Calendar,
  User,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Banknote,
  X,
  History,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CreditSaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [creditSale, setCreditSale] = useState<CreditSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadCreditSale();
  }, [id]);

  const loadCreditSale = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCreditSale(id);
      setCreditSale(data);
      setPaymentAmount(Number(data.remaining_amount) || 0);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) return;

    try {
      setPaymentLoading(true);
      await addCreditPayment(id, {
        amount: paymentAmount,
        payment_method: paymentMethod,
      });
      setShowPaymentModal(false);
      loadCreditSale();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout du paiement");
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " GNF";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "partial":
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status: string): "success" | "error" | "warning" | "default" => {
    switch (status) {
      case "paid":
        return "success";
      case "overdue":
        return "error";
      case "partial":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !creditSale) {
    return (
      <div className="p-6">
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error || "Créance non trouvée"}</p>
          </div>
        </Alert>
        <Button className="mt-4" asChild>
          <Link href={`/apps/${slug}/inventory/credit-sales`}>Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const progress = creditSale.total_amount > 0 
    ? ((Number(creditSale.paid_amount) || 0) / Number(creditSale.total_amount)) * 100 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Ajouter un paiement</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPaymentModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Montant</label>
                <Input
                  type="number"
                  min="0"
                  max={Number(creditSale.remaining_amount) || 0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Reste à payer: {formatCurrency(Number(creditSale.remaining_amount) || 0)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Méthode de paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Carte</option>
                  <option value="bank_transfer">Virement</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="check">Chèque</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={handleAddPayment}
                  disabled={paymentLoading || paymentAmount <= 0}
                  className="flex-1"
                >
                  {paymentLoading ? "..." : "Confirmer"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/apps/${slug}/inventory/credit-sales`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Créance #{creditSale.sale_number}</h1>
              <div className="flex items-center gap-1">
                {getStatusIcon(creditSale.status)}
                <Badge variant={getStatusVariant(creditSale.status)}>
                  {creditSale.status_display || creditSale.status}
                </Badge>
              </div>
              {creditSale.is_overdue && (
                <Badge variant="error">En retard</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Client: {creditSale.customer_name || "Inconnu"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {creditSale.status !== "paid" && (
            <Button onClick={() => setShowPaymentModal(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Ajouter paiement
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/apps/${slug}/inventory/sales/${creditSale.sale}`}>
              <Receipt className="mr-2 h-4 w-4" />
              Voir la vente
            </Link>
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progression du paiement</span>
          <span className="text-sm font-bold">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className={cn(
              "h-3 rounded-full transition-all",
              progress >= 100 ? "bg-green-500" : progress > 0 ? "bg-orange-500" : "bg-red-500"
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Payé: {formatCurrency(Number(creditSale.paid_amount) || 0)}</span>
          <span>Total: {formatCurrency(Number(creditSale.total_amount) || 0)}</span>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="text-xl font-bold">{formatCurrency(Number(creditSale.total_amount) || 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payé</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(Number(creditSale.paid_amount) || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
              <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reste à payer</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(Number(creditSale.remaining_amount) || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              creditSale.is_overdue 
                ? "bg-red-100 dark:bg-red-900" 
                : "bg-purple-100 dark:bg-purple-900"
            )}>
              <Calendar className={cn(
                "h-5 w-5",
                creditSale.is_overdue 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-purple-600 dark:text-purple-400"
              )} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Échéance</p>
              <p className={cn(
                "text-xl font-bold",
                creditSale.is_overdue && "text-red-600"
              )}>
                {formatDate(creditSale.due_date)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations client
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-muted-foreground">Nom</dt>
              <dd className="font-medium">{creditSale.customer_name || "Non renseigné"}</dd>
            </div>
            {creditSale.customer_phone && (
              <div>
                <dt className="text-xs text-muted-foreground">Téléphone</dt>
                <dd className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {creditSale.customer_phone}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted-foreground">Délai de grâce</dt>
              <dd className="font-medium">{creditSale.grace_period_days || 0} jours</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Rappels envoyés</dt>
              <dd className="font-medium">{creditSale.reminder_count || 0}</dd>
            </div>
          </dl>
        </Card>

        {/* Payment History */}
        <Card className="lg:col-span-2 p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique des paiements ({creditSale.payments?.length || 0})
          </h3>
          {!creditSale.payments || creditSale.payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun paiement enregistré</p>
            </div>
          ) : (
            <div className="space-y-3">
              {creditSale.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(Number(payment.amount) || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.payment_date)} • {payment.payment_method_display || payment.payment_method}
                    </p>
                  </div>
                  <Badge variant="success">Payé</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Notes */}
      {creditSale.notes && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{creditSale.notes}</p>
        </Card>
      )}
    </div>
  );
}
