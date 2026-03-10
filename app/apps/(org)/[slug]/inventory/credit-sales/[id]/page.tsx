"use client";

import { Can } from "@/components/apps/common";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input
} from "@/components/ui";
import { addCreditPayment, getCreditSale, getCreditSaleInvoiceUrl, getCreditSaleStatementUrl } from "@/lib/services/inventory";
import type { CreditSale } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  FileText,
  History,
  Loader2,
  MoreVertical,
  Phone,
  Receipt,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
      console.log(paymentAmount);
      
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto absolute inset-0"></div>
          </div>
          <p className="mt-6 text-muted-foreground font-medium">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  

  const progress = (creditSale ? creditSale?.total_amount : 0) > 0 
    ? ((Number(creditSale?.paid_amount) || 0) / Number(creditSale?.total_amount)) * 100 
    : 0;

  return (
    <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES}  showMessage>
        <div className="p-6 space-y-6">
      {/* Payment Dialog */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              Ajouter un paiement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Montant</label>
              <Input
                type="number"
                min="0"
                max={Number(creditSale?.remaining_amount) || 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                autoFocus
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Banknote className="h-3 w-3" />
                Reste à payer: {formatCurrency(Number(creditSale?.remaining_amount) || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Méthode de paiement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              >
                <option value="cash">💵 Espèces</option>
                <option value="card">💳 Carte bancaire</option>
                <option value="bank_transfer">🏦 Virement bancaire</option>
                <option value="mobile_money">📱 Mobile Money</option>
                <option value="check">📝 Chèque</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              disabled={paymentLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={paymentLoading || paymentAmount <= 0}
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmer le paiement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="hover:scale-105 transition-transform">
            <Link href={`/apps/${slug}/inventory/credit-sales`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">Créance #{creditSale?.sale_number}</h1>
              <div className="flex items-center gap-1.5">
                {creditSale && getStatusIcon(creditSale?.status)}
               {
                creditSale &&  <Badge variant={getStatusVariant(creditSale?.status)}>
                {creditSale?.status_display || creditSale?.status}
              </Badge>
               }
              </div>
              {creditSale?.is_overdue && (
                <Badge variant="error" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  En retard
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <User className="h-3.5 w-3.5 inline mr-1" />
              {creditSale?.customer_name || "Inconnu"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {creditSale?.status !== "paid" && (
            <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_SALES}>
              <Button
              onClick={() => setShowPaymentModal(true)}
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Ajouter paiement
            </Button>
            </Can>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="hover:bg-accent">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Plus d'actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <a href={getCreditSaleStatementUrl(id)} target="_blank" className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le relevé
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={getCreditSaleInvoiceUrl(id)} target="_blank" className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  Télécharger la facture
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/apps/${slug}/inventory/sales/${creditSale?.sale}`} className="cursor-pointer">
                  <Receipt className="mr-2 h-4 w-4" />
                  Voir la vente associée
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-5 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              progress >= 100 ? "bg-green-100 dark:bg-green-900/30" : progress > 0 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-red-100 dark:bg-red-900/30"
            )}>
              {progress >= 100 ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <span className="text-sm font-semibold">Progression du paiement</span>
          </div>
          <span className={cn(
            "text-lg font-bold",
            progress >= 100 ? "text-green-600" : progress > 0 ? "text-orange-600" : "text-red-600"
          )}>
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="relative w-full bg-muted rounded-full h-4 overflow-hidden">
          <div
            className={cn(
              "h-4 rounded-full transition-all duration-700 ease-out relative overflow-hidden",
              progress >= 100 ? "bg-linear-to-r from-green-500 to-green-600" : progress > 0 ? "bg-linear-to-r from-orange-500 to-orange-600" : "bg-linear-to-r from-red-500 to-red-600"
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            <span className="font-medium text-muted-foreground">Payé:</span>
            <span className="font-bold text-green-600">{formatCurrency(Number(creditSale?.paid_amount) || 0)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Total:</span>
            <span className="font-bold">{formatCurrency(Number(creditSale?.total_amount) || 0)}</span>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-900/30 shadow-sm">
              <Banknote className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Montant total</p>
              <p className="text-xl font-bold mt-0.5">{formatCurrency(Number(creditSale?.total_amount) || 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-900/30 shadow-sm">
              <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payé</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-500 mt-0.5">
                {formatCurrency(Number(creditSale?.paid_amount) || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-900/30 shadow-sm">
              <CreditCard className="h-5 w-5 text-orange-700 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reste à payer</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-500 mt-0.5">
                {formatCurrency(Number(creditSale?.remaining_amount) || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl shadow-sm",
              !creditSale?.due_date
                ? "bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-900/50 dark:to-gray-900/30"
                : creditSale?.is_overdue
                  ? "bg-linear-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-900/30"
                  : "bg-linear-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-900/30"
            )}>
              <Calendar className={cn(
                "h-5 w-5",
                !creditSale?.due_date
                  ? "text-gray-700 dark:text-gray-400"
                  : creditSale?.is_overdue
                    ? "text-red-700 dark:text-red-400"
                    : "text-purple-700 dark:text-purple-400"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Échéance</p>
              {creditSale?.due_date ? (
                <>
                  <p className={cn(
                    "text-lg font-bold mt-0.5 truncate",
                    creditSale?.is_overdue && "text-red-600 dark:text-red-500"
                  )}>
                    {formatDate(creditSale?.due_date)}
                  </p>
                  {creditSale?.days_until_due !== undefined && creditSale?.days_until_due !== null && (
                    <div className={cn("text-xs font-semibold mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
                      creditSale?.days_until_due < 0
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : creditSale?.days_until_due === 0
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    )}>
                      {creditSale?.days_until_due < 0 ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          -{Math.abs(creditSale?.days_until_due)}j
                        </>
                      ) : creditSale?.days_until_due === 0 ? (
                        <>
                          <Clock className="h-3 w-3" />
                          Aujourd'hui
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          +{creditSale?.days_until_due}j
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm font-medium text-muted-foreground italic mt-0.5">
                  Sans échéance
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card className="p-5 hover:shadow-lg transition-shadow duration-300">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            Informations client
          </h3>
          <dl className="space-y-4">
            <div className="pb-3 border-b border-border/50">
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Nom</dt>
              <dd className="font-semibold text-base">{creditSale?.customer_name || "Non renseigné"}</dd>
            </div>
            {creditSale?.customer_phone && (
              <div className="pb-3 border-b border-border/50">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Téléphone</dt>
                <dd className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href={`tel:${creditSale?.customer_phone}`} className="hover:text-primary transition-colors">
                    {creditSale?.customer_phone}
                  </a>
                </dd>
              </div>
            )}
            <div className="pb-3 border-b border-border/50">
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Délai de grâce</dt>
              <dd className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {creditSale?.grace_period_days || 0} jours
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Rappels envoyés</dt>
              <dd className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-sm",
                  (creditSale?.reminder_count || 0) > 0 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" : "bg-muted"
                )}>
                  {creditSale?.reminder_count || 0}
                </span>
              </dd>
            </div>
          </dl>
        </Card>

        {/* Payment History */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <History className="h-4 w-4 text-primary" />
              </div>
              Historique des paiements
            </h3>
            <Badge variant="default" className="font-mono">
              {creditSale?.payments?.length || 0}
            </Badge>
          </div>
          {!creditSale?.payments || creditSale?.payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-2xl bg-muted/50 mb-4">
                <CreditCard className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium">Aucun paiement enregistré</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Les paiements apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-2">
              {creditSale?.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="group flex items-center justify-between p-4 bg-linear-to-r from-muted/30 to-muted/50 hover:from-muted/50 hover:to-muted/70 rounded-xl transition-all duration-200 hover:shadow-md border border-transparent hover:border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{formatCurrency(Number(payment.amount) || 0)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(payment.payment_date)}</span>
                        <span>•</span>
                        <span className="font-medium">{payment.payment_method_display || payment.payment_method}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="success" className="shadow-sm">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Payé
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Notes */}
      {creditSale?.notes && (
        <Card className="p-5 hover:shadow-lg transition-shadow duration-300">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            Notes
          </h3>
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{creditSale?.notes}</p>
          </div>
        </Card>
      )}
    </div>
    </Can>
  );
}
