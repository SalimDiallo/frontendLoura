"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Alert, Badge, Card } from "@/components/ui";
import { getSale, addPaymentToSale, getSaleReceiptUrl } from "@/lib/services/inventory";
import type { Sale, Payment } from "@/lib/types/inventory";
import {
  ArrowLeft,
  AlertTriangle,
  Download,
  CreditCard,
  Calendar,
  ShoppingCart,
  User,
  Warehouse,
  CheckCircle,
  Clock,
  Percent,
  Banknote,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const saleId = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadSale();
  }, [saleId]);

  const loadSale = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSale(saleId);
      setSale(data);
      setPaymentAmount(data.remaining_amount || 0);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de la vente");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (paymentAmount <= 0) return;

    try {
      setPaymentLoading(true);
      await addPaymentToSale(saleId, {
        amount: paymentAmount,
        payment_method: paymentMethod,
      });
      setShowPaymentModal(false);
      loadSale();
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

  if (error || !sale) {
    return (
      <div className="p-6">
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Erreur</h3>
            <p className="text-sm">{error || "Vente non trouvée"}</p>
          </div>
        </Alert>
        <Button className="mt-4" asChild>
          <Link href={`/apps/${slug}/inventory/sales`}>Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "partial":
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

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
                <input
                  type="number"
                  min="0"
                  max={sale.remaining_amount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Reste à payer: {formatCurrency(sale.remaining_amount || 0)}
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
            <Link href={`/apps/${slug}/inventory/sales`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{sale.sale_number}</h1>
              <div className="flex items-center gap-1">
                {getStatusIcon(sale.payment_status)}
                <Badge
                  variant={
                    sale.payment_status === "paid"
                      ? "success"
                      : sale.payment_status === "partial"
                      ? "warning"
                      : sale.payment_status === "cancelled"
                      ? "error"
                      : "default"
                  }
                >
                  {sale.payment_status_display}
                </Badge>
              </div>
              {sale.is_credit && <Badge variant="info">À crédit</Badge>}
            </div>
            <p className="text-muted-foreground">
              Créée le {new Date(sale.sale_date).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sale.payment_status !== "paid" && sale.payment_status !== "cancelled" && (
            <Button onClick={() => setShowPaymentModal(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Ajouter paiement
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href={getSaleReceiptUrl(saleId)} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              Télécharger reçu
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total brut</p>
              <p className="text-xl font-bold">{formatCurrency(sale.subtotal_amount)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
              <Percent className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remises</p>
              <p className="text-xl font-bold text-red-600">
                -{formatCurrency(sale.discount_amount)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payé</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(sale.paid_amount)}
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
              <p className="text-sm text-muted-foreground">Reste</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(sale.remaining_amount || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4 border-b">
              <h2 className="font-semibold">Articles ({sale.items?.length || 0})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Produit</th>
                    <th className="text-center p-4 font-medium">Qté</th>
                    <th className="text-right p-4 font-medium">Prix unit.</th>
                    <th className="text-right p-4 font-medium">Remise</th>
                    <th className="text-right p-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items?.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4">
                        <p className="font-medium">{item.product_name}</p>
                        <code className="text-xs bg-muted px-1 rounded">{item.product_sku}</code>
                      </td>
                      <td className="p-4 text-center">{item.quantity}</td>
                      <td className="p-4 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="p-4 text-right text-red-600">
                        {item.discount_value > 0 ? (
                          item.discount_type === "percentage"
                            ? `-${item.discount_value}%`
                            : `-${formatCurrency(item.discount_value)}`
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-4 text-right font-bold">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <td colSpan={4} className="p-4 text-right font-medium">
                      Sous-total
                    </td>
                    <td className="p-4 text-right font-bold">{formatCurrency(sale.subtotal_amount)}</td>
                  </tr>
                  {sale.discount_amount > 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-right font-medium text-red-600">
                        Remise globale
                        {sale.cart_discount_type === "percentage" && ` (${sale.cart_discount_value}%)`}
                      </td>
                      <td className="p-4 text-right font-bold text-red-600">
                        -{formatCurrency(sale.discount_amount)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-primary/10">
                    <td colSpan={4} className="p-4 text-right font-bold text-lg">
                      Total
                    </td>
                    <td className="p-4 text-right font-bold text-lg">
                      {formatCurrency(sale.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>

        {/* Details & Payments */}
        <div className="space-y-6">
          {/* Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Détails</h3>
            <dl className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Client</dt>
                  <dd className="font-medium">{sale.customer_name || "Client anonyme"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Entrepôt</dt>
                  <dd className="font-medium">{sale.warehouse_name}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Date de vente</dt>
                  <dd className="font-medium">
                    {new Date(sale.sale_date).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              </div>
              {sale.is_credit && sale.credit_due_date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Échéance crédit</dt>
                    <dd className="font-medium">
                      {new Date(sale.credit_due_date).toLocaleDateString("fr-FR")}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
            {sale.notes && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-xs text-muted-foreground mb-1">Notes</dt>
                <dd className="text-sm whitespace-pre-wrap">{sale.notes}</dd>
              </div>
            )}
          </Card>

          {/* Payments */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Paiements ({sale.payments?.length || 0})</h3>
            {!sale.payments || sale.payments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Aucun paiement enregistré
              </p>
            ) : (
              <div className="space-y-3">
                {sale.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString("fr-FR")} •{" "}
                        {payment.payment_method_display}
                      </p>
                    </div>
                    <Badge variant="success">Payé</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
