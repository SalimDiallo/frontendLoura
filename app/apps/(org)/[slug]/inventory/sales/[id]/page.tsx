"use client";

import { Can } from "@/components/apps/common";
import Etiquette from "@/components/landing/ui/Etiquette";
import { Badge, Button, Card } from "@/components/ui";
import { PDFPreviewWrapper } from "@/components/ui/pdf-preview";
import { addPaymentToSale, getDeliveryNotes, getSale, getSaleInvoiceUrl, getSaleReceiptUrl } from "@/lib/services/inventory";
import type { DeliveryNote, Sale } from "@/lib/types/inventory";
import { COMMON_PERMISSIONS, INVENTORY_PERMISSIONS } from "@/lib/types/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBadgeWIthOutIconAdLabel } from "@/lib/utils/BadgeStatus";
import { usePDF } from "@/lib/hooks/usePDF";
import { useHasPermission } from "@/lib/hooks/use-permissions";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  Clock,
  CreditCard,
  Download,
  Edit,
  Eye,
  FileText,
  FileTextIcon,
  Percent,
  Receipt,
  ShoppingCart,
  Truck,
  User,
  Warehouse,
  X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);

  // Hook pour les PDFs avec prévisualisation
  const { preview, download, closePreview, previewState } = usePDF({
    onError: (err) => setError(err.message || "Erreur lors du chargement du PDF"),
  });

  // Vérifier la permission de modification des ventes payées
  const canModifyPaidSales = useHasPermission(INVENTORY_PERMISSIONS.MODIFY_PAID_SALES);
  const canUpdateSales = useHasPermission(INVENTORY_PERMISSIONS.UPDATE_SALES);

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

      // Load delivery notes for this sale
      const notes = await getDeliveryNotes({ sale: saleId });
      setDeliveryNotes(notes);
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

 

 
  return (
   <Can permission={COMMON_PERMISSIONS.INVENTORY.VIEW_SALES} showMessage>
       <div className="p-6 space-y-6">
      {/* PDF Preview Modal */}
      <PDFPreviewWrapper
        previewState={previewState}
        onClose={closePreview}
      />

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
                  max={sale?.remaining_amount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Reste à payer: {formatCurrency(sale?.remaining_amount || 0)}
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
              <h1 className="text-2xl font-bold">{sale?.sale_number}</h1>
                {sale?.payment_status && sale?.payment_status_display && (
                  getBadgeWIthOutIconAdLabel({ status: sale.payment_status, label: sale.payment_status_display })
                )}
              
              {sale?.is_credit && <Badge variant="info" size="sm" className="text-xs">À crédit</Badge>}
            </div>
            <p className="text-muted-foreground">
              {sale?.sale_date && <>Créée le {formatDate(sale.sale_date)}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bouton Modifier - Affiché selon les permissions et le statut */}
          {sale?.payment_status !== "cancelled" && (
            <>
              {/* Vente non payée - Permission UPDATE_SALES suffit */}
              {sale?.payment_status === "pending" && canUpdateSales && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/apps/${slug}/inventory/sales/edit/${saleId}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Link>
                </Button>
              )}

              {/* Vente payée (partielle ou totale) - Nécessite MODIFY_PAID_SALES */}
              {(sale?.payment_status === "partial" || sale?.payment_status === "paid") && canModifyPaidSales && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/apps/${slug}/inventory/sales/edit/${saleId}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Link>
                </Button>
              )}
            </>
          )}

          {/* Bouton Ajouter paiement */}
          {sale?.payment_status !== "paid" && sale?.payment_status !== "cancelled" && (
            <Can permission={COMMON_PERMISSIONS.INVENTORY.UPDATE_SALES}>
              <Button onClick={() => setShowPaymentModal(true)} size="sm">
                <CreditCard className="mr-2 h-4 w-4" />
                Ajouter paiement
              </Button>
            </Can>
          )}

          {/* Bon de livraison */}
          <Button variant="outline" asChild size="sm">
            <Link href={`/apps/${slug}/inventory/documents/delivery-notes/new?sale=${saleId}`}>
              <Truck className="mr-2 h-4 w-4" />
              Livraison
            </Link>
          </Button>

          {/* Boutons PDF améliorés avec prévisualisation */}
          <div className="flex items-center gap-2">
            {/* Reçu */}
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  preview(
                    `/inventory/sales/${saleId}/receipt/`,
                    `Reçu - ${sale?.sale_number}`,
                    `Recu_${sale?.sale_number}.pdf`
                  )
                }
                title="Prévisualiser le reçu"
                className="rounded-r-none border-r"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => download(`/inventory/sales/${saleId}/receipt/`, `Recu_${sale?.sale_number}.pdf`)}
                title="Télécharger le reçu"
                className="rounded-l-none"
              >
                <Receipt className="mr-1 h-4 w-4" />
                Reçu
              </Button>
            </div>

            {/* Facture */}
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  preview(
                    `/inventory/sales/${saleId}/invoice/`,
                    `Facture - ${sale?.sale_number}`,
                    `Facture_${sale?.sale_number}.pdf`
                  )
                }
                title="Prévisualiser la facture"
                className="rounded-r-none border-r"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => download(`/inventory/sales/${saleId}/invoice/`, `Facture_${sale?.sale_number}.pdf`)}
                title="Télécharger la facture"
                className="rounded-l-none"
              >
                <FileText className="mr-1 h-4 w-4" />
                Facture
              </Button>
            </div>
          </div>

          {/* Lien vers crédit si applicable */}
          {sale?.is_credit_sale && (
            <div className="flex flex-col items-center">
              <Etiquette className="absolute">Vente à crédit</Etiquette>
              <Button variant="outline" size="sm" asChild className="mt-6">
                <Link href={`/apps/${slug}/inventory/credit-sales/${sale.credit_id}`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Voir crédit
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <ShoppingCart className="h-5 w-5 text-foreground dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total brut</p>
              <p className="text-xl font-bold">{formatCurrency(sale?.subtotal || 0)}</p>
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
                -{formatCurrency(sale?.discount_amount || 0)}
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
                {formatCurrency(sale?.paid_amount || 0)}
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
                {formatCurrency(sale?.remaining_amount || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Delivery Notes Section */}
      {deliveryNotes.length > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Bons de livraison associés ({deliveryNotes.length})
            </h3>
          </div>
          <div className="space-y-2">
            {deliveryNotes.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold">{note.delivery_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.delivery_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {note.status === "pending" && <Badge variant="default">En préparation</Badge>}
                  {note.status === "ready" && <Badge variant="warning">Prêt</Badge>}
                  {note.status === "in_transit" && <Badge variant="default">En transit</Badge>}
                  {note.status === "delivered" && <Badge variant="success">Livré</Badge>}
                  {note.status === "cancelled" && <Badge variant="error">Annulé</Badge>}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/apps/${slug}/inventory/documents/delivery-notes/${note.id}`}>
                      Voir →
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4 border-b">
              <h2 className="font-semibold">Articles ({sale?.items?.length || 0})</h2>
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
                  {sale?.items?.map((item) => (
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
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <td colSpan={4} className="p-4 text-right font-medium">
                      Sous-total
                    </td>
                    <td className="p-4 text-right font-bold">{sale && formatCurrency(sale?.subtotal)}</td>
                  </tr>
                  {sale &&sale?.discount_amount > 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-right font-medium text-red-600">
                        Remise globale
                        {sale?.cart_discount_type === "percentage" && ` (${sale?.cart_discount_value}%)`}
                      </td>
                      <td className="p-4 text-right font-bold text-red-600">
                        -{formatCurrency(sale?.discount_amount)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-primary/10">
                    <td colSpan={4} className="p-4 text-right font-bold text-lg">
                      Total
                    </td>
                    <td className="p-4 text-right font-bold text-lg">
                      {sale && formatCurrency(sale?.total_amount)}
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
                  <dd className="font-medium">{sale?.customer_name || "Client anonyme"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Entrepôt</dt>
                  <dd className="font-medium">{sale?.warehouse_name}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Date de vente</dt>
                  <dd className="font-medium">
                    {sale && formatDate(sale?.sale_date)}
                  </dd>
                </div>
              </div>
              {sale?.is_credit && sale?.credit_due_date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Échéance crédit</dt>
                    <dd className="font-medium">
                      {new Date(sale?.credit_due_date).toLocaleDateString("fr-FR")}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </Card>

          {/* Notes Section - Séparée et plus visible */}
          {sale?.notes && (
            <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <FileTextIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Notes
                  </h3>
                  <div className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                    {(() => {
                      // Regex for "Converti depuis proforma <UUID>"
                      const proformaMatch = sale.notes.match(/Converti depuis proforma\s+([0-9a-fA-F-]{36})/i);
                      if (proformaMatch) {
                        const proformaId = proformaMatch[1];
                        return (
                          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-800">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span>
                              Converti depuis{" "}
                              <Link
                                href={`/apps/${slug}/inventory/documents/proformas/${proformaId}`}
                                className="underline font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                facture proforma
                              </Link>
                            </span>
                          </div>
                        );
                      }

                      // Détecter les notes d'ajustement automatique de paiements
                      const hasAutoAdjustment = sale.notes.includes("[Ajusté automatiquement");

                      if (hasAutoAdjustment) {
                        // Séparer les lignes et formatter les ajustements
                        const lines = sale.notes.split('\n');
                        return (
                          <div className="space-y-2">
                            {lines.map((line, index) => {
                              if (line.includes("[Ajusté automatiquement")) {
                                return (
                                  <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/50 rounded border border-orange-200 dark:border-orange-800 text-xs">
                                    <Clock className="h-3 w-3 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-orange-800 dark:text-orange-200">{line}</span>
                                  </div>
                                );
                              }
                              return line && <p key={index}>{line}</p>;
                            })}
                          </div>
                        );
                      }

                      return sale.notes;
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Payments */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Paiements ({sale?.payments?.length || 0})</h3>
            {!sale?.payments || sale?.payments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Aucun paiement enregistré
              </p>
            ) : (
              <div className="space-y-3">
                {sale?.payments.map((payment, index) => {
                  const hasAdjustment = payment.notes?.includes("[Ajusté automatiquement");

                  return (
                    <div
                      key={payment.id}
                      className={`p-3 rounded-lg border ${
                        hasAdjustment
                          ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                          : "bg-muted/50 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            {hasAdjustment && (
                              <Badge variant="warning" size="sm" className="text-xs">
                                Ajusté
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString("fr-FR")} •{" "}
                            {payment.payment_method_display}
                            {payment.receipt_number && ` • ${payment.receipt_number}`}
                          </p>
                        </div>
                        <Badge variant="success" size="sm">
                          Paiement #{index + 1}
                        </Badge>
                      </div>

                      {/* Notes du paiement */}
                      {payment.notes && (
                        <div className="mt-2 pt-2 border-t border-muted">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {payment.notes.split('\n').map((line, idx) => {
                              if (line.includes("[Ajusté automatiquement")) {
                                return (
                                  <span key={idx} className="flex items-start gap-1 text-orange-600 dark:text-orange-400 font-medium">
                                    <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    {line}
                                  </span>
                                );
                              }
                              return line && <span key={idx} className="block">{line}</span>;
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
   </Can>
  );
}
